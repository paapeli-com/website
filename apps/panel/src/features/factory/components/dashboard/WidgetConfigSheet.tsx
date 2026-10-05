import { useEffect, useMemo, useState } from "react";
import {
  type DashboardDefinition,
  type DashboardWidget,
  type JsonSchema,
  type WidgetDefinition,
} from "@paapeli/api";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Switch } from "@/features/factory/components/ui/switch";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { TIME_WINDOW_OPTIONS } from "@/features/factory/lib/dashboardSettings";
import { compact, replaceWidget, validateWidget } from "@/features/factory/lib/dashboardDefinition";
import { RowEditor, bindingFromRow, freshRow, isFilled, rowFromBinding, shapeOf, startingRows, type Row } from "./sourceRows";
import type { WidgetLang } from "./widgets/types";

const T = {
  config: { en: "Configure widget", ar: "ضبط العنصر", fa: "پیکربندی ویجت" },
  title: { en: "Title", ar: "العنوان", fa: "عنوان" },
  series: { en: "Data", ar: "البيانات", fa: "داده‌ها" },
  device: { en: "Device", ar: "الجهاز", fa: "دستگاه" },
  selectDevice: { en: "Select a device", ar: "اختر جهازًا", fa: "یک دستگاه انتخاب کنید" },
  key: { en: "Telemetry key", ar: "مفتاح القياس", fa: "کلید تله‌متری" },
  selectKey: { en: "Select a key", ar: "اختر مفتاحًا", fa: "یک کلید انتخاب کنید" },
  noKeys: { en: "This device hasn't reported any telemetry", ar: "لم يرسل هذا الجهاز أي قياسات", fa: "این دستگاه هنوز تله‌متری ارسال نکرده است" },
  loadingKeys: { en: "Loading keys…", ar: "جارٍ تحميل المفاتيح…", fa: "در حال بارگذاری کلیدها…" },
  label: { en: "Label", ar: "التسمية", fa: "برچسب" },
  unit: { en: "Unit", ar: "الوحدة", fa: "واحد" },
  addSeries: { en: "Add series", ar: "إضافة سلسلة", fa: "افزودن سری" },
  removeSeries: { en: "Remove series", ar: "إزالة السلسلة", fa: "حذف سری" },
  sourceKind: { en: "Source", ar: "المصدر", fa: "منبع" },
  kindTelemetry: { en: "Device telemetry", ar: "قياسات جهاز", fa: "تله‌متری دستگاه" },
  kindCount: { en: "Number of devices", ar: "عدد الأجهزة", fa: "تعداد دستگاه‌ها" },
  countOf: { en: "Devices counted", ar: "الأجهزة المحسوبة", fa: "دستگاه‌های شمرده‌شده" },
  countAll: { en: "All devices", ar: "كل الأجهزة", fa: "همه دستگاه‌ها" },
  countActive: { en: "Online devices", ar: "الأجهزة المتصلة", fa: "دستگاه‌های آنلاین" },
  countInactive: { en: "Offline devices", ar: "الأجهزة غير المتصلة", fa: "دستگاه‌های آفلاین" },
  color: { en: "Color", ar: "اللون", fa: "رنگ" },
  querySource: { en: "Device query source", ar: "مصدر استعلام الأجهزة", fa: "منبع جستجوی دستگاه" },
  timeWindow: { en: "Time range", ar: "النطاق الزمني", fa: "بازه زمانی" },
  useDashboard: { en: "Same as the dashboard", ar: "مثل اللوحة", fa: "مانند داشبورد" },
  options: { en: "Options", ar: "الخيارات", fa: "گزینه‌ها" },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  apply: { en: "Apply", ar: "تطبيق", fa: "اعمال" },
  fix: { en: "Fix these before applying:", ar: "أصلح ما يلي قبل التطبيق:", fa: "پیش از اعمال این موارد را اصلاح کنید:" },
  none: { en: "—", ar: "—", fa: "—" },
  addItem: { en: "Add", ar: "إضافة", fa: "افزودن" },
  removeItem: { en: "Remove", ar: "إزالة", fa: "حذف" },
  wholeWindow: { en: "Whole time range (one bar)", ar: "كامل النطاق الزمني (عمود واحد)", fa: "کل بازه زمانی (یک میله)" },
  every: { en: "Every", ar: "كل", fa: "هر" },
  invalidJson: { en: "Not valid JSON", ar: "JSON غير صالح", fa: "JSON نامعتبر است" },
};
const tr = (k: keyof typeof T, lang: WidgetLang) => T[k][lang] ?? T[k].en;

const DASHBOARD_WINDOW = "__dashboard";
const EMPTY = "__empty";

/* ---------------- schema-driven options form ---------------- */

const humanize = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bY axis\b/i, "Y axis");

const primaryType = (s: JsonSchema) => (Array.isArray(s.type) ? s.type.find((t) => t !== "null") : s.type);

/** A string the gateway accepts only as #RRGGBB or #RRGGBBAA. */
const isColor = (s: JsonSchema) => typeof s.pattern === "string" && s.pattern.includes("[0-9A-Fa-f]{6}");

/** "window", or a bucket width in ms: the bar chart's interval. */
const isWindowOrBucket = (s: JsonSchema) => {
  const options = s.oneOf as JsonSchema[] | undefined;
  return Array.isArray(options) && options.some((o) => o.const === "window") && options.some((o) => o.type === "integer");
};
const BUCKETS: Array<{ ms: number; label: Record<WidgetLang, string> }> = [
  { ms: 60_000, label: { en: "minute", ar: "دقيقة", fa: "دقیقه" } },
  { ms: 5 * 60_000, label: { en: "5 minutes", ar: "5 دقائق", fa: "۵ دقیقه" } },
  { ms: 15 * 60_000, label: { en: "15 minutes", ar: "15 دقيقة", fa: "۱۵ دقیقه" } },
  { ms: 3_600_000, label: { en: "hour", ar: "ساعة", fa: "ساعت" } },
  { ms: 6 * 3_600_000, label: { en: "6 hours", ar: "6 ساعات", fa: "۶ ساعت" } },
  { ms: 24 * 3_600_000, label: { en: "day", ar: "يوم", fa: "روز" } },
];

/** Whether an edited object has nothing left in it. */
const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || v === "" || (typeof v === "object" && !Array.isArray(v) && Object.values(v as object).every(isBlank));

const orderedKeys = (schema: JsonSchema, order?: string[]) => {
  // A scale reads from its low end: min before max where no order is given.
  const props = Object.keys(schema.properties ?? {}).sort((a, b) => (a === "min" && b === "max" ? -1 : a === "max" && b === "min" ? 1 : 0));
  const first = (order ?? []).filter((k) => props.includes(k));
  return [...first, ...props.filter((k) => !first.includes(k))];
};

function SchemaField({
  name,
  schema,
  value,
  onChange,
  uiSchema,
  lang,
  depth = 0,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  uiSchema?: Record<string, unknown>;
  lang: WidgetLang;
  depth?: number;
}) {
  const label = (schema.title as string) || humanize(name);
  const type = primaryType(schema);
  const [jsonText, setJsonText] = useState(() => (value === undefined ? "" : JSON.stringify(value, null, 2)));
  const [jsonError, setJsonError] = useState(false);

  if (isWindowOrBucket(schema)) {
    const current = value === undefined || value === "window" ? "window" : String(value);
    const known = BUCKETS.some((b) => String(b.ms) === current);
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Select value={current} onValueChange={(v) => onChange(v === "window" ? "window" : Number(v))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="window">{tr("wholeWindow", lang)}</SelectItem>
            {BUCKETS.map((b) => <SelectItem key={b.ms} value={String(b.ms)}>{tr("every", lang)} {b.label[lang]}</SelectItem>)}
            {/* A width set elsewhere (the API) that is not one of the presets. */}
            {current !== "window" && !known && <SelectItem value={current}>{current} ms</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (primaryType(schema) === "string" && isColor(schema)) {
    const text = typeof value === "string" ? value : "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-2" dir="ltr">
          {/* The picker has no alpha channel; an 8-digit colour keeps its alpha when typed. */}
          <Input type="color" className="h-9 w-12 shrink-0 p-1" value={/^#[0-9A-Fa-f]{6}/.test(text) ? text.slice(0, 7) : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} />
          <Input className="h-9 font-mono text-xs" value={text} placeholder="#RRGGBB" onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
    );
  }
  if (schema.enum) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Select value={value === undefined ? EMPTY : JSON.stringify(value)} onValueChange={(v) => onChange(v === EMPTY ? undefined : JSON.parse(v))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>{tr("none", lang)}</SelectItem>
            {schema.enum.map((e) => <SelectItem key={JSON.stringify(e)} value={JSON.stringify(e)}>{String(e)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs">{label}</Label>
        <Switch checked={value === true} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }
  if (type === "number" || type === "integer") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Input
          type="number"
          className="h-9"
          step={type === "integer" ? 1 : "any"}
          min={schema.minimum}
          max={schema.maximum}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(undefined);
            const n = type === "integer" ? parseInt(raw, 10) : Number(raw);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
        />
      </div>
    );
  }
  if (type === "string") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Input className="h-9" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (type === "object" && schema.properties) {
    const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const nested = (uiSchema?.[name] as { order?: string[] } | undefined)?.order;
    return (
      <fieldset className={`space-y-3 ${depth > 0 ? "" : "rounded-md border border-border p-3"}`}>
        <legend className="px-1 text-xs font-medium text-muted-foreground">{label}</legend>
        <div className={Object.keys(schema.properties).length === 2 ? "grid grid-cols-2 gap-3" : "space-y-3"}>
          {orderedKeys(schema, nested).map((k) => (
            <SchemaField
              key={k}
              name={k}
              schema={schema.properties![k]}
              value={obj[k]}
              uiSchema={uiSchema?.[name] as Record<string, unknown> | undefined}
              lang={lang}
              depth={depth + 1}
              onChange={(v) => {
                const next = { ...obj, [k]: v };
                // An optional group (one that may be null) that has been emptied
                // is "not set". Left as {} it fails its own required fields and
                // blocks Apply on a group the user meant to leave out.
                const nullable = Array.isArray(schema.type) && schema.type.includes("null");
                onChange(nullable && isBlank(next) ? null : next);
              }}
            />
          ))}
        </div>
      </fieldset>
    );
  }
  if (type === "array" && primaryType(schema.items ?? {}) === "object" && schema.items?.properties) {
    const list = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const itemSchema = schema.items;
    const full = typeof schema.maxItems === "number" && list.length >= schema.maxItems;
    return (
      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">{label}</legend>
        {list.map((item, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${Object.keys(itemSchema.properties!).length}, minmax(0, 1fr))` }}>
              {orderedKeys(itemSchema).map((k) => (
                <SchemaField
                  key={k}
                  name={k}
                  schema={itemSchema.properties![k]}
                  value={item?.[k]}
                  lang={lang}
                  depth={depth + 1}
                  onChange={(v) => onChange(list.map((x, j) => (j === i ? { ...x, [k]: v } : x)))}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              aria-label={tr("removeItem", lang)}
              onClick={() => onChange(list.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => onChange([...list, {}])}>
          <Plus className="h-3.5 w-3.5 me-1" />{tr("addItem", lang)}
        </Button>
      </fieldset>
    );
  }
  // Arrays and anything else: edit the JSON directly.
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea
        rows={4}
        className="font-mono text-xs"
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          try {
            onChange(e.target.value.trim() === "" ? undefined : JSON.parse(e.target.value));
            setJsonError(false);
          } catch {
            setJsonError(true);
          }
        }}
      />
      {jsonError && <p className="text-xs text-destructive">{tr("invalidJson", lang)}</p>}
    </div>
  );
}

/* ---------------- the sheet ---------------- */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: DashboardWidget | null;
  definition: WidgetDefinition | undefined;
  dashboard: DashboardDefinition;
  lang: WidgetLang;
  rtl: boolean;
  /** Called with the whole dashboard definition, this widget updated in it. */
  onApply: (next: DashboardDefinition) => void;
}

export function WidgetConfigSheet({ open, onOpenChange, widget, definition, dashboard, lang, rtl, onApply }: Props) {
  const { items: deviceItems } = useDevices();
  const devices = useMemo(() => deviceItems.map((d) => ({ id: d.id, name: d.label || d.name })), [deviceItems]);

  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [windowValue, setWindowValue] = useState(DASHBOARD_WINDOW);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const shape = shapeOf(definition);

  // Load the widget into the draft each time the sheet opens on it.
  useEffect(() => {
    if (!open || !widget) return;
    setTitle(widget.title);
    const loaded = widget.data.map((d) => rowFromBinding(d, dashboard.dataSources));
    setRows(loaded.length ? loaded : startingRows(shape, lang));
    setWindowValue(widget.timeWindow?.type === "relative" ? widget.timeWindow.last : DASHBOARD_WINDOW);
    setOptions({ ...(definition?.defaultConfiguration ?? {}), ...(widget.options ?? {}) });
    setErrors([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, widget?.id]);

  if (!widget) return null;

  const caps = definition?.capabilities ?? {};
  const multiple = caps.supportsMultipleSeries !== false;
  const configSchema = definition?.configurationSchema;
  const uiSchema = (definition?.uiSchema ?? {}) as Record<string, unknown> & { order?: string[] };

  const apply = () => {
    // Rows with nothing chosen yet are dropped rather than sent half-filled.
    const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
    let next = dashboard;
    const data = rows
      .filter((r) => isFilled(r, shape))
      .map((r) => {
        const [withSource, item] = bindingFromRow(next, r, shape, deviceName);
        next = withSource;
        return item;
      });
    const updated: DashboardWidget = {
      ...widget,
      title: title.trim() || definition?.name || widget.type,
      data,
      timeWindow: windowValue === DASHBOARD_WINDOW ? null : { type: "relative", last: windowValue },
      options: compact(options) as Record<string, unknown>,
    };
    const problems = validateWidget(updated, definition, next.dataSources);
    if (problems.length) {
      setErrors(problems);
      return;
    }
    onApply(replaceWidget(next, updated));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={rtl ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto" dir={rtl ? "rtl" : "ltr"}>
        <SheetHeader>
          <SheetTitle>{tr("config", lang)}</SheetTitle>
          {definition && <SheetDescription>{definition.name}{definition.description ? ` — ${definition.description}` : ""}</SheetDescription>}
        </SheetHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-1.5">
            <Label>{tr("title", lang)}</Label>
            <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{tr("series", lang)}</Label>
            {rows.map((r) => (
              <RowEditor
                key={r.rowId}
                row={r}
                devices={devices}
                shape={shape}
                lang={lang}
                canRemove={rows.length > 1}
                onChange={(nr) => setRows((prev) => prev.map((x) => (x.rowId === r.rowId ? nr : x)))}
                onRemove={() => setRows((prev) => prev.filter((x) => x.rowId !== r.rowId))}
              />
            ))}
            {multiple && (
              <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => {
                const last = prev[prev.length - 1];
                const kind = last && last.kind !== "other" ? last.kind : shape.kinds[0];
                return [...prev, freshRow(kind, lang, kind === "device" ? { deviceId: last?.deviceId ?? "" } : {})];
              })}>
                <Plus className="h-3.5 w-3.5 me-1" />{tr("addSeries", lang)}
              </Button>
            )}
          </div>

          {caps.supportsTimeWindow && (
            <div className="space-y-1.5">
              <Label>{tr("timeWindow", lang)}</Label>
              <Select value={windowValue} onValueChange={setWindowValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={DASHBOARD_WINDOW}>{tr("useDashboard", lang)}</SelectItem>
                  {TIME_WINDOW_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label[lang]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {configSchema?.properties && Object.keys(configSchema.properties).length > 0 && (
            <div className="space-y-3">
              <Label>{tr("options", lang)}</Label>
              {orderedKeys(configSchema, uiSchema.order).map((k) => (
                <SchemaField
                  key={`${widget.id}-${k}`}
                  name={k}
                  schema={configSchema.properties![k]}
                  value={options[k]}
                  uiSchema={uiSchema}
                  lang={lang}
                  onChange={(v) => setOptions((o) => ({ ...o, [k]: v }))}
                />
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-destructive"><TriangleAlert className="h-3.5 w-3.5" />{tr("fix", lang)}</div>
              <ul className="list-disc ps-5 text-destructive">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tr("cancel", lang)}</Button>
          <Button onClick={apply}>{tr("apply", lang)}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
