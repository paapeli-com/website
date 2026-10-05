import type {
  DashboardDefinition,
  DashboardLayout,
  DashboardWidget,
  JsonSchema,
  LayoutItem,
  WidgetDataItem,
  WidgetDefinition,
} from "@paapeli/api";

/* Pure edits of a dashboard definition. The canvas keeps a draft definition
 * in state and runs every change through these, so what it saves is always a
 * complete, self-consistent document: every widget has a desktop and a mobile
 * layout entry, and every data source is referenced by some widget. */

export const DESKTOP_COLS = 12;
export const MOBILE_COLS = 1;

/* ---------------- widget definitions ---------------- */

/** Definitions a new widget may be created from. */
export const creatableDefinitions = (defs: WidgetDefinition[] | undefined) =>
  (defs ?? []).filter((d) => d.enabled && d.current);

/** The exact definition a widget instance was written against. */
export const definitionFor = (defs: WidgetDefinition[] | undefined, w: Pick<DashboardWidget, "type" | "schemaVersion">) =>
  (defs ?? []).find((d) => d.type === w.type && d.schemaVersion === w.schemaVersion);

/** Starting size on the 12-column grid. */
export const defaultSize = (def: Pick<WidgetDefinition, "type" | "category">): Pick<LayoutItem, "w" | "h"> => {
  if (/chart/i.test(def.type) || /chart/i.test(def.category ?? "")) return { w: 6, h: 4 };
  if (/table/i.test(def.type)) return { w: 6, h: 4 };
  return { w: 4, h: 3 };
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export const newWidget = (def: WidgetDefinition, title: string): DashboardWidget => ({
  id: newId(),
  type: def.type,
  schemaVersion: def.schemaVersion,
  title,
  data: [],
  timeWindow: null,
  options: clone(def.defaultConfiguration ?? {}) as Record<string, unknown>,
});

/* ---------------- layout ---------------- */

const overlaps = (a: LayoutItem, b: LayoutItem) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** The lowest row any item reaches. */
export const layoutBottom = (layout: DashboardLayout) =>
  Object.values(layout).reduce((m, r) => Math.max(m, r.y + r.h), 0);

/** First free spot, in reading order, that fits a w×h item. */
export const firstFreeSpot = (layout: DashboardLayout, w: number, h: number, cols = DESKTOP_COLS) => {
  const items = Object.values(layout);
  const width = Math.min(w, cols);
  for (let y = 0; ; y++) {
    for (let x = 0; x + width <= cols; x++) {
      if (!items.some((o) => overlaps({ x, y, w: width, h }, o))) return { x, y };
    }
  }
};

/** Push down anything the moved item overlaps, repeating until stable. */
export const resolveCollisions = (layout: DashboardLayout, movedId: string): DashboardLayout => {
  const out: DashboardLayout = Object.fromEntries(Object.entries(layout).map(([k, v]) => [k, { ...v }]));
  const ids = Object.keys(out);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 100) {
    changed = false;
    for (const a of [movedId, ...ids.filter((i) => i !== movedId)]) {
      for (const b of ids) {
        if (a === b || b === movedId) continue;
        const A = out[a];
        const B = out[b];
        if (A && B && overlaps(A, B) && (a === movedId || A.y <= B.y)) {
          B.y = A.y + A.h;
          changed = true;
        }
      }
    }
  }
  return out;
};

/** Close gaps, keeping reading order and sizes. */
export const packLayout = (layout: DashboardLayout, cols = DESKTOP_COLS): DashboardLayout => {
  const ordered = Object.entries(layout).sort(([, a], [, b]) => a.y - b.y || a.x - b.x);
  const placed: DashboardLayout = {};
  let cursor = { x: 0, y: 0 };
  for (const [id, item] of ordered) {
    const w = Math.min(item.w, cols);
    let spot: LayoutItem | null = null;
    for (let y = cursor.y; !spot; y++) {
      for (let x = y === cursor.y ? cursor.x : 0; x + w <= cols; x++) {
        const candidate = { x, y, w, h: item.h };
        if (!Object.values(placed).some((p) => overlaps(candidate, p))) { spot = candidate; break; }
      }
    }
    placed[id] = spot!;
    cursor = { x: spot!.x, y: spot!.y };
  }
  return placed;
};

/* ---------------- widgets ---------------- */

/** Adds a widget: on desktop at `at` (pushing others down) or in the first gap; on mobile at the end. */
export const addWidget = (
  def: DashboardDefinition,
  widget: DashboardWidget,
  size: Pick<LayoutItem, "w" | "h">,
  at?: { x: number; y: number },
): DashboardDefinition => {
  const w = Math.min(size.w, DESKTOP_COLS);
  const spot = at ? { x: Math.max(0, Math.min(DESKTOP_COLS - w, at.x)), y: Math.max(0, at.y) } : firstFreeSpot(def.layouts.desktop, w, size.h);
  let desktop: DashboardLayout = { ...def.layouts.desktop, [widget.id]: { ...spot, w, h: size.h } };
  if (at) desktop = resolveCollisions(desktop, widget.id);
  const mobile: DashboardLayout = {
    ...def.layouts.mobile,
    [widget.id]: { x: 0, y: layoutBottom(def.layouts.mobile), w: MOBILE_COLS, h: size.h },
  };
  return { ...def, widgets: [...def.widgets, widget], layouts: { desktop, mobile } };
};

export const replaceWidget = (def: DashboardDefinition, widget: DashboardWidget): DashboardDefinition =>
  pruneDataSources({ ...def, widgets: def.widgets.map((w) => (w.id === widget.id ? widget : w)) });

export const removeWidget = (def: DashboardDefinition, id: string): DashboardDefinition => {
  const { [id]: _d, ...desktop } = def.layouts.desktop;
  const { [id]: _m, ...mobile } = def.layouts.mobile;
  return pruneDataSources({
    ...def,
    widgets: def.widgets.filter((w) => w.id !== id),
    layouts: { desktop, mobile: packLayout(mobile, MOBILE_COLS) },
  });
};

export const setDesktopRect = (def: DashboardDefinition, id: string, rect: LayoutItem): DashboardDefinition => ({
  ...def,
  layouts: { ...def.layouts, desktop: resolveCollisions({ ...def.layouts.desktop, [id]: rect }, id) },
});

export const packDesktop = (def: DashboardDefinition): DashboardDefinition => ({
  ...def,
  layouts: { ...def.layouts, desktop: packLayout(def.layouts.desktop) },
});

/**
 * Fills in layout entries a definition is missing (e.g. one written by
 * another client), so every widget can be drawn and dragged.
 */
export const normalizeDefinition = (def: DashboardDefinition): DashboardDefinition => {
  let desktop = { ...(def.layouts?.desktop ?? {}) };
  let mobile = { ...(def.layouts?.mobile ?? {}) };
  for (const w of def.widgets ?? []) {
    if (!desktop[w.id]) {
      const spot = firstFreeSpot(desktop, 6, 4);
      desktop = { ...desktop, [w.id]: { ...spot, w: 6, h: 4 } };
    }
    if (!mobile[w.id]) mobile = { ...mobile, [w.id]: { x: 0, y: layoutBottom(mobile), w: MOBILE_COLS, h: desktop[w.id].h } };
  }
  return {
    ...def,
    dataSources: def.dataSources ?? {},
    widgets: (def.widgets ?? []).map((w) => ({ ...w, data: w.data ?? [], options: w.options ?? {}, timeWindow: w.timeWindow ?? null })),
    layouts: { desktop, mobile },
  };
};

/* ---------------- data sources ---------------- */

const slug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "device";

/** The key of the data source for `deviceId`, adding one (named after the device) if there is none. */
export const ensureDeviceSource = (
  def: DashboardDefinition,
  deviceId: string,
  deviceName: string,
): [DashboardDefinition, string] => {
  const existing = Object.entries(def.dataSources).find(([, s]) => s.type === "device" && s.deviceId === deviceId);
  if (existing) return [def, existing[0]];
  const base = slug(deviceName);
  let key = base;
  for (let i = 2; def.dataSources[key]; i++) key = `${base}-${i}`;
  return [{ ...def, dataSources: { ...def.dataSources, [key]: { type: "device", deviceId } } }, key];
};

/** Drops data sources no widget reads any more. */
/** Which devices a count covers: every one, the active ones, or the inactive ones. */
export type DeviceCountState = "all" | "active" | "inactive";

/** The key of the workspace-wide device-count source for `state`, adding one if there is none. */
export const ensureCountSource = (def: DashboardDefinition, state: DeviceCountState): [DashboardDefinition, string] => {
  const active = state === "all" ? undefined : state === "active";
  const existing = Object.entries(def.dataSources).find(
    ([, s]) => s.type === "deviceCount" && s.active === active && !s.deviceTypeId && !s.assetId,
  );
  if (existing) return [def, existing[0]];
  const base = `devices-${state}`;
  let key = base;
  for (let i = 2; def.dataSources[key]; i++) key = `${base}-${i}`;
  const source = active === undefined ? { type: "deviceCount" as const } : { type: "deviceCount" as const, active };
  return [{ ...def, dataSources: { ...def.dataSources, [key]: source } }, key];
};

export const pruneDataSources = (def: DashboardDefinition): DashboardDefinition => {
  const used = new Set(def.widgets.flatMap((w) => w.data.map((d) => d.source)));
  const dataSources = Object.fromEntries(Object.entries(def.dataSources).filter(([k]) => used.has(k)));
  return Object.keys(dataSources).length === Object.keys(def.dataSources).length ? def : { ...def, dataSources };
};

/* ---------------- validation ---------------- */

const typeOf = (v: unknown) => (Array.isArray(v) ? "array" : v === null ? "null" : Number.isInteger(v) ? "integer" : typeof v);

const typeMatches = (schemaType: string | string[] | undefined, v: unknown) => {
  if (!schemaType) return true;
  const types = Array.isArray(schemaType) ? schemaType : [schemaType];
  const t = typeOf(v);
  return types.some((s) => s === t || (s === "number" && t === "integer"));
};

/**
 * A small JSON Schema check covering what widget schemas use: type, required,
 * properties, additionalProperties: false, enum, minimum/maximum, minLength,
 * items, minItems/maxItems. The gateway validates in full on save; this only
 * catches mistakes early enough to point at the right field.
 */
export const validateAgainst = (schema: JsonSchema | undefined, value: unknown, path = ""): string[] => {
  if (!schema) return [];
  const at = path || "value";
  if (value === undefined) return [];
  if (!typeMatches(schema.type, value)) return [`${at}: expected ${[schema.type].flat().join(" or ")}`];
  const errs: string[] = [];
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) errs.push(`${at}: must be one of ${schema.enum.join(", ")}`);
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) errs.push(`${at}: must be ≥ ${schema.minimum}`);
    if (typeof schema.maximum === "number" && value > schema.maximum) errs.push(`${at}: must be ≤ ${schema.maximum}`);
  }
  if (typeof value === "string" && typeof schema.minLength === "number" && value.length < schema.minLength) errs.push(`${at}: is required`);
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) errs.push(`${at}: needs at least ${schema.minItems}`);
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) errs.push(`${at}: allows at most ${schema.maxItems}`);
    value.forEach((item, i) => errs.push(...validateAgainst(schema.items, item, `${at}[${i + 1}]`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const r of schema.required ?? []) if (obj[r] === undefined || obj[r] === "") errs.push(`${path ? `${path}.` : ""}${r}: is required`);
    for (const [k, v] of Object.entries(obj)) {
      const sub = schema.properties?.[k];
      if (sub) errs.push(...validateAgainst(sub, v, path ? `${path}.${k}` : k));
      else if (schema.additionalProperties === false) errs.push(`${path ? `${path}.` : ""}${k}: is not allowed`);
    }
  }
  return errs;
};

/** Removes keys whose value is undefined or "", so optional fields left blank aren't sent. */
export const compact = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(compact);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== undefined && x !== "")
        .map(([k, x]) => [k, compact(x)]),
    );
  }
  return v;
};

/** Problems with one widget against its definition; empty when it is fine to save. */
export const validateWidget = (w: DashboardWidget, def: WidgetDefinition | undefined, dataSources: DashboardDefinition["dataSources"]): string[] => {
  if (!def) return [`"${w.type}" v${w.schemaVersion} is not an available widget type`];
  const errs: string[] = [];
  if (!def.enabled) errs.push(`"${def.name}" widgets are disabled`);
  errs.push(...validateAgainst(def.dataSchema, w.data, "data"));
  if (def.capabilities?.supportsMultipleSeries === false && w.data.length > 1) errs.push("data: only one series is allowed");
  const allowed = def.capabilities?.supportedDataSourceTypes;
  w.data.forEach((d: WidgetDataItem, i) => {
    const src = dataSources[d.source];
    if (!src) errs.push(`data[${i + 1}]: unknown data source "${d.source}"`);
    else if (allowed && !allowed.includes(src.type)) errs.push(`data[${i + 1}]: "${src.type}" sources are not supported by this widget`);
  });
  if (w.timeWindow && def.capabilities?.supportsTimeWindow === false) errs.push("timeWindow: this widget follows the dashboard's time range");
  errs.push(...validateAgainst(def.configurationSchema, w.options, "options"));
  return errs;
};
