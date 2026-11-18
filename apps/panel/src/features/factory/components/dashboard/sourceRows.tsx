import { useMemo } from "react";
import {
  useDeviceTelemetryKeysQuery,
  useGetProductDeviceTypesQuery,
  type AlarmSeverity,
  type AlarmStatus,
  type DashboardDataSource,
  type DashboardDefinition,
  type DashboardWidget,
  type FormulaOperation,
  type JsonSchema,
  type WidgetDefinition,
} from "@paapeli/api";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { currentProductKey } from "@/features/factory/lib/product";
import { compact, ensureDeviceSource, ensureSource } from "@/features/factory/lib/dashboardDefinition";
import { SEVERITY_LABEL, STATUS_LABEL } from "./widgets/AlarmListWidget";
import type { WidgetLang } from "./widgets/types";

/* The "Data" rows of the widget settings sheet.

   A row is one binding of the widget. What it may be bound to depends on the
   widget's definition: one device and a key, the devices of a type under a
   location, a number of devices, a set of alarms, or a formula over several
   device keys. Each kind has its own editor here, and each is turned into the
   data source the gateway expects when the sheet is applied. */

const T = {
  sourceKind: { en: "Source", ar: "المصدر", fa: "منبع" },
  kindDevice: { en: "One device", ar: "جهاز واحد", fa: "یک دستگاه" },
  kindQuery: { en: "Devices by type and location", ar: "أجهزة حسب النوع والموقع", fa: "دستگاه‌ها بر اساس نوع و مکان" },
  kindCount: { en: "Number of devices", ar: "عدد الأجهزة", fa: "تعداد دستگاه‌ها" },
  kindAlarm: { en: "Alarms", ar: "الإنذارات", fa: "هشدارها" },
  kindFormula: { en: "Formula over several readings", ar: "معادلة على عدة قراءات", fa: "محاسبه روی چند مقدار" },
  device: { en: "Device", ar: "الجهاز", fa: "دستگاه" },
  selectDevice: { en: "Select a device", ar: "اختر جهازًا", fa: "یک دستگاه انتخاب کنید" },
  key: { en: "Telemetry key", ar: "مفتاح القياس", fa: "کلید تله‌متری" },
  selectKey: { en: "Select a key", ar: "اختر مفتاحًا", fa: "یک کلید انتخاب کنید" },
  typeKey: { en: "e.g. temperature", ar: "مثال: temperature", fa: "مثلاً temperature" },
  noKeys: { en: "This device hasn't reported any telemetry", ar: "لم يرسل هذا الجهاز أي قياسات", fa: "این دستگاه هنوز تله‌متری ارسال نکرده است" },
  loadingKeys: { en: "Loading keys…", ar: "جارٍ تحميل المفاتيح…", fa: "در حال بارگذاری کلیدها…" },
  deviceType: { en: "Device type", ar: "نوع الجهاز", fa: "نوع دستگاه" },
  selectType: { en: "Select a type", ar: "اختر نوعًا", fa: "یک نوع انتخاب کنید" },
  location: { en: "Location", ar: "الموقع", fa: "مکان" },
  everywhere: { en: "The whole workspace", ar: "كامل مساحة العمل", fa: "کل فضای کاری" },
  countOf: { en: "Devices counted", ar: "الأجهزة المحسوبة", fa: "دستگاه‌های شمرده‌شده" },
  countAll: { en: "All devices", ar: "كل الأجهزة", fa: "همه دستگاه‌ها" },
  countActive: { en: "Online devices", ar: "الأجهزة المتصلة", fa: "دستگاه‌های آنلاین" },
  countInactive: { en: "Offline devices", ar: "الأجهزة غير المتصلة", fa: "دستگاه‌های آفلاین" },
  severities: { en: "Severity (none chosen means all)", ar: "الشدة (بدون اختيار تعني الكل)", fa: "شدت (بدون انتخاب یعنی همه)" },
  statuses: { en: "Status (none chosen means all)", ar: "الحالة (بدون اختيار تعني الكل)", fa: "وضعیت (بدون انتخاب یعنی همه)" },
  alarms: { en: "Alarms", ar: "الإنذارات", fa: "هشدارها" },
  operation: { en: "Operation", ar: "العملية", fa: "عملیات" },
  opSUM: { en: "Sum", ar: "المجموع", fa: "جمع" },
  opAVG: { en: "Average", ar: "المتوسط", fa: "میانگین" },
  opMIN: { en: "Minimum", ar: "الأدنى", fa: "کمینه" },
  opMAX: { en: "Maximum", ar: "الأقصى", fa: "بیشینه" },
  inputs: { en: "Readings (2 to 10)", ar: "القراءات (2 إلى 10)", fa: "مقدارها (۲ تا ۱۰)" },
  addInput: { en: "Add reading", ar: "إضافة قراءة", fa: "افزودن مقدار" },
  label: { en: "Label", ar: "التسمية", fa: "برچسب" },
  unit: { en: "Unit", ar: "الوحدة", fa: "واحد" },
  color: { en: "Color", ar: "اللون", fa: "رنگ" },
  role: { en: "Role in the picture", ar: "الدور في الصورة", fa: "نقش در تصویر" },
  remove: { en: "Remove", ar: "إزالة", fa: "حذف" },
  keptSource: { en: "Source kept as it is", ar: "المصدر يبقى كما هو", fa: "این منبع بدون تغییر می‌ماند" },
};
const tr = (k: keyof typeof T, lang: WidgetLang) => T[k][lang] ?? T[k].en;

export type SourceKind = "device" | "query" | "count" | "alarm" | "formula" | "other";
export type DeviceCountState = "all" | "active" | "inactive";

export interface Row {
  rowId: string;
  kind: SourceKind;
  /** kind "device". */
  deviceId: string;
  /** kind "other": a source this editor has no form for, kept as it is. */
  otherSource: string;
  key: string;
  label: string;
  unit: string;
  color: string;
  /** What this reading drives, where the widget type has roles. */
  role: string;
  /** kind "count". */
  count: DeviceCountState;
  /** kinds "count" and "query": the location they are limited to; "" is everywhere. */
  assetId: string;
  /** kind "query". */
  deviceTypeId: string;
  /** kind "alarm": empty means every value. */
  severities: AlarmSeverity[];
  statuses: AlarmStatus[];
  /** kind "formula". */
  operation: FormulaOperation;
  inputs: Array<{ deviceId: string; key: string }>;
}

/** What a widget type's rows may hold, read from its definition. */
export interface RowShape {
  /** The data schema has a telemetry key. */
  keyed: boolean;
  hasUnit: boolean;
  hasColor: boolean;
  /** The roles a binding may take; empty for a widget type without roles. */
  roles: string[];
  /** The source kinds this widget type can bind, in menu order. */
  kinds: SourceKind[];
}

/* Widget types whose renderer resolves a deviceQuery. The charts do not yet,
   so the kind is not offered to them. */
const QUERY_READY = new Set(["device-table", "device-map"]);
const KIND_OF_TYPE: Array<[string, SourceKind]> = [
  ["device", "device"],
  ["deviceQuery", "query"],
  ["deviceCount", "count"],
  ["alarmQuery", "alarm"],
  ["formula", "formula"],
];

export const shapeOf = (definition: WidgetDefinition | undefined): RowShape => {
  const itemProps = (definition?.dataSchema as JsonSchema | undefined)?.items?.properties ?? {};
  const types = (definition?.capabilities?.supportedDataSourceTypes as string[] | undefined) ?? ["device"];
  const kinds = KIND_OF_TYPE.filter(([t, k]) => types.includes(t) && (k !== "query" || QUERY_READY.has(definition?.type ?? ""))).map(([, k]) => k);
  return {
    keyed: "key" in itemProps,
    hasUnit: "unit" in itemProps,
    hasColor: "color" in itemProps,
    roles: (itemProps.role?.enum as string[] | undefined) ?? [],
    kinds: kinds.length ? kinds : ["device"],
  };
};

let rowSeq = 0;
export const newRow = (kind: SourceKind, partial: Partial<Row> = {}): Row => ({
  rowId: `r${++rowSeq}`,
  kind,
  deviceId: "",
  otherSource: "",
  key: "",
  label: "",
  unit: "",
  color: "",
  role: "",
  count: "all",
  assetId: "",
  deviceTypeId: "",
  severities: [],
  statuses: [],
  operation: "SUM",
  inputs: [{ deviceId: "", key: "" }, { deviceId: "", key: "" }],
  ...partial,
});

const COUNT_LABEL = { all: "countAll", active: "countActive", inactive: "countInactive" } as const;
const autoLabels = (lang: WidgetLang) => [...Object.values(COUNT_LABEL).map((k) => tr(k, lang)), tr("alarms", lang)];

/** A fresh row of `kind`, labelled where the kind has an obvious name. */
export const freshRow = (kind: SourceKind, lang: WidgetLang, partial: Partial<Row> = {}): Row =>
  newRow(kind, {
    label: kind === "count" ? tr(COUNT_LABEL[partial.count ?? "all"], lang) : kind === "alarm" ? tr("alarms", lang) : "",
    ...partial,
  });

/** The rows an unconfigured widget opens on. */
export const startingRows = (shape: RowShape, lang: WidgetLang): Row[] => {
  const first = shape.kinds[0];
  // A widget that only counts opens on the usual comparison, online against offline.
  if (first === "count") return [freshRow("count", lang, { count: "active" }), freshRow("count", lang, { count: "inactive" })];
  return [freshRow(first, lang)];
};

export const rowFromBinding = (d: DashboardWidget["data"][number], sources: Record<string, DashboardDataSource>): Row => {
  const src = sources[d.source];
  const common = { key: d.key ?? "", label: d.label ?? "", unit: d.unit ?? "", color: d.color ?? "", role: d.role ?? "" };
  if (src?.type === "device") return newRow("device", { ...common, deviceId: src.deviceId });
  if (src?.type === "deviceQuery") return newRow("query", { ...common, deviceTypeId: src.deviceTypeId, assetId: src.assetId ?? "" });
  // A count narrowed by device type has no picker here; it is kept as it is.
  if (src?.type === "deviceCount" && !src.deviceTypeId) {
    return newRow("count", { ...common, count: src.active === true ? "active" : src.active === false ? "inactive" : "all", assetId: src.assetId ?? "" });
  }
  // An alarm query pinned to one device has no picker here either.
  if (src?.type === "alarmQuery" && !src.deviceId) {
    return newRow("alarm", { ...common, severities: src.severities ?? [], statuses: src.statuses ?? [] });
  }
  if (src?.type === "formula") return newRow("formula", { ...common, operation: src.operation, inputs: src.inputs.map((i) => ({ ...i })) });
  return newRow("other", { ...common, otherSource: d.source });
};

const filledInputs = (row: Row) => row.inputs.filter((i) => i.deviceId && i.key.trim());

/** Whether a row has enough chosen to be sent; half-filled rows are dropped. */
export const isFilled = (row: Row, shape: RowShape): boolean => {
  switch (row.kind) {
    case "device": return !!row.deviceId && (!shape.keyed || !!row.key.trim());
    case "query": return !!row.deviceTypeId && (!shape.keyed || !!row.key.trim());
    case "formula": return filledInputs(row).length >= 2;
    case "other": return !!row.otherSource;
    default: return true;
  }
};

/** The binding for a row, with its data source added to the definition if it is new. */
export const bindingFromRow = (
  def: DashboardDefinition,
  row: Row,
  shape: RowShape,
  deviceName: (id: string) => string,
): [DashboardDefinition, DashboardWidget["data"][number]] => {
  let next = def;
  let source = row.otherSource;
  // Only one device or one device query reads a telemetry key through the binding.
  const takesKey = shape.keyed && (row.kind === "device" || row.kind === "query" || row.kind === "other");
  const scope = row.assetId ? { assetId: row.assetId, includeDescendants: true } : {};
  switch (row.kind) {
    case "device":
      [next, source] = ensureDeviceSource(next, row.deviceId, deviceName(row.deviceId));
      break;
    case "query":
      [next, source] = ensureSource(next, { type: "deviceQuery", deviceTypeId: row.deviceTypeId, ...scope }, "devices");
      break;
    case "count":
      [next, source] = ensureSource(
        next,
        { type: "deviceCount", ...(row.count === "all" ? {} : { active: row.count === "active" }), ...scope },
        `devices-${row.count}`,
      );
      break;
    case "alarm":
      [next, source] = ensureSource(
        next,
        {
          type: "alarmQuery",
          ...(row.severities.length ? { severities: row.severities } : {}),
          ...(row.statuses.length ? { statuses: row.statuses } : {}),
        },
        "alarms",
      );
      break;
    case "formula":
      [next, source] = ensureSource(
        next,
        { type: "formula", operation: row.operation, inputs: filledInputs(row).map((i) => ({ deviceId: i.deviceId, key: i.key.trim() })) },
        "formula",
      );
      break;
  }
  const item = compact({
    source,
    key: takesKey ? row.key.trim() : "",
    label: row.label.trim(),
    unit: shape.hasUnit ? row.unit.trim() : "",
    color: shape.hasColor ? row.color : "",
    role: shape.roles.length ? row.role : "",
  }) as DashboardWidget["data"][number];
  return [next, item];
};

/* ---------------- editors ---------------- */

type DeviceOption = { id: string; name: string };

function DevicePicker({ value, devices, onChange, lang }: { value: string; devices: DeviceOption[]; onChange: (id: string) => void; lang: WidgetLang }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue placeholder={tr("selectDevice", lang)} /></SelectTrigger>
      <SelectContent>
        {devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** The keys one device has reported, as a picker. */
function KeyPicker({ deviceId, value, onChange, lang }: { deviceId: string; value: string; onChange: (key: string) => void; lang: WidgetLang }) {
  const workspaceId = useWorkspaceId() ?? "";
  const keysQuery = useDeviceTelemetryKeysQuery(workspaceId, currentProductKey(), deviceId);
  const keys = useMemo(() => {
    const list = [...(keysQuery.data ?? [])].sort();
    return value && !list.includes(value) ? [value, ...list] : list;
  }, [keysQuery.data, value]);
  return (
    <Select value={value} disabled={!deviceId} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder={deviceId && keysQuery.isLoading ? tr("loadingKeys", lang) : tr("selectKey", lang)} />
      </SelectTrigger>
      <SelectContent>
        {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
        {deviceId && !keysQuery.isLoading && keys.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">{tr("noKeys", lang)}</div>
        )}
      </SelectContent>
    </Select>
  );
}

const EVERYWHERE = "__everywhere";

function LocationPicker({ value, onChange, lang }: { value: string; onChange: (assetId: string) => void; lang: WidgetLang }) {
  const { options } = useAssetLocations();
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{tr("location", lang)}</Label>
      <Select value={value || EVERYWHERE} onValueChange={(v) => onChange(v === EVERYWHERE ? "" : v)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={EVERYWHERE}>{tr("everywhere", lang)}</SelectItem>
          {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.path}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Chips<V extends string>({ title, all, labels, value, onChange, lang }: {
  title: string;
  all: readonly V[];
  labels: Record<string, Record<WidgetLang, string>>;
  value: V[];
  onChange: (v: V[]) => void;
  lang: WidgetLang;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{title}</Label>
      <div className="flex flex-wrap gap-1.5">
        {all.map((v) => {
          const on = value.includes(v);
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== v) : all.filter((x) => x === v || value.includes(x)))}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {labels[v]?.[lang] ?? v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ROLE_LABEL: Record<string, Record<WidgetLang, string>> = {
  reading: { en: "Reading only", ar: "قراءة فقط", fa: "فقط نمایش مقدار" },
  motion: { en: "Runs the motion (above 0)", ar: "يشغّل الحركة (فوق 0)", fa: "راه‌انداز حرکت (بالای ۰)" },
  level: { en: "Tank level (0 to 100)", ar: "مستوى الخزان (0 إلى 100)", fa: "سطح مخزن (۰ تا ۱۰۰)" },
  travel: { en: "Moving part height (0 to 100)", ar: "ارتفاع الجزء المتحرك (0 إلى 100)", fa: "ارتفاع قطعه متحرک (۰ تا ۱۰۰)" },
};

const SEVERITIES = ["CRITICAL", "MAJOR", "MINOR", "WARNING", "INDETERMINATE"] as const;
const STATUSES = ["ACTIVE_UNACK", "ACTIVE_ACK", "CLEARED_UNACK", "CLEARED_ACK"] as const;
const OPERATIONS = ["SUM", "AVG", "MIN", "MAX"] as const;
const KIND_LABEL: Record<Exclude<SourceKind, "other">, keyof typeof T> = {
  device: "kindDevice",
  query: "kindQuery",
  count: "kindCount",
  alarm: "kindAlarm",
  formula: "kindFormula",
};

export function RowEditor({ row, shape, devices, onChange, onRemove, canRemove, lang }: {
  row: Row;
  shape: RowShape;
  devices: DeviceOption[];
  onChange: (r: Row) => void;
  onRemove: () => void;
  canRemove: boolean;
  lang: WidgetLang;
}) {
  const typesQuery = useGetProductDeviceTypesQuery(currentProductKey(), row.kind === "query");
  const deviceTypes = (typesQuery.data ?? []).flatMap((t) => {
    const id = (t as { id?: string }).id;
    return id && t.enabled ? [{ id, label: t.label || t.deviceType }] : [];
  });
  // A label the form wrote itself follows the choice; one the user typed is left alone.
  const relabel = (next: Row, label: string) => ({ ...next, label: !row.label || autoLabels(lang).includes(row.label) ? label : row.label });

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      {shape.kinds.length > 1 && row.kind !== "other" && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("sourceKind", lang)}</Label>
          <Select value={row.kind} onValueChange={(v) => onChange({ ...freshRow(v as SourceKind, lang), rowId: row.rowId, unit: row.unit, color: row.color })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {shape.kinds.map((k) => k !== "other" && <SelectItem key={k} value={k}>{tr(KIND_LABEL[k], lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {row.kind === "other" && (
        <div className="text-xs text-muted-foreground">
          {tr("keptSource", lang)}: <span className="font-mono">{row.otherSource}</span>
        </div>
      )}

      {row.kind === "device" && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("device", lang)}</Label>
          <DevicePicker value={row.deviceId} devices={devices} lang={lang} onChange={(deviceId) => onChange({ ...row, deviceId, key: "" })} />
        </div>
      )}

      {row.kind === "query" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("deviceType", lang)}</Label>
            <Select value={row.deviceTypeId} onValueChange={(deviceTypeId) => onChange({ ...row, deviceTypeId })}>
              <SelectTrigger className="h-9"><SelectValue placeholder={tr("selectType", lang)} /></SelectTrigger>
              <SelectContent>
                {deviceTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <LocationPicker value={row.assetId} lang={lang} onChange={(assetId) => onChange({ ...row, assetId })} />
        </>
      )}

      {row.kind === "count" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("countOf", lang)}</Label>
            <Select value={row.count} onValueChange={(v) => onChange(relabel({ ...row, count: v as DeviceCountState }, tr(COUNT_LABEL[v as DeviceCountState], lang)))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr("countAll", lang)}</SelectItem>
                <SelectItem value="active">{tr("countActive", lang)}</SelectItem>
                <SelectItem value="inactive">{tr("countInactive", lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LocationPicker value={row.assetId} lang={lang} onChange={(assetId) => onChange({ ...row, assetId })} />
        </>
      )}

      {row.kind === "alarm" && (
        <>
          <Chips title={tr("severities", lang)} all={SEVERITIES} labels={SEVERITY_LABEL} value={row.severities} lang={lang} onChange={(severities) => onChange({ ...row, severities })} />
          <Chips title={tr("statuses", lang)} all={STATUSES} labels={STATUS_LABEL} value={row.statuses} lang={lang} onChange={(statuses) => onChange({ ...row, statuses })} />
        </>
      )}

      {row.kind === "formula" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("operation", lang)}</Label>
            <Select value={row.operation} onValueChange={(v) => onChange({ ...row, operation: v as FormulaOperation })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPERATIONS.map((o) => <SelectItem key={o} value={o}>{tr(`op${o}`, lang)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{tr("inputs", lang)}</Label>
            {row.inputs.map((input, i) => {
              const set = (patch: Partial<Row["inputs"][number]>) => onChange({ ...row, inputs: row.inputs.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              return (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <DevicePicker value={input.deviceId} devices={devices} lang={lang} onChange={(deviceId) => set({ deviceId, key: "" })} />
                  <KeyPicker deviceId={input.deviceId} value={input.key} lang={lang} onChange={(key) => set({ key })} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    disabled={row.inputs.length <= 2}
                    aria-label={tr("remove", lang)}
                    onClick={() => onChange({ ...row, inputs: row.inputs.filter((_, j) => j !== i) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={row.inputs.length >= 10}
              onClick={() => onChange({ ...row, inputs: [...row.inputs, { deviceId: row.inputs[row.inputs.length - 1]?.deviceId ?? "", key: "" }] })}
            >
              <Plus className="h-3.5 w-3.5 me-1" />{tr("addInput", lang)}
            </Button>
          </div>
        </>
      )}

      {shape.keyed && (row.kind === "device" || row.kind === "query" || row.kind === "other") && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("key", lang)}</Label>
          {row.kind === "device" ? (
            <KeyPicker deviceId={row.deviceId} value={row.key} lang={lang} onChange={(key) => onChange({ ...row, key, label: row.label || key })} />
          ) : (
            // Several devices: there is no one device to list keys from.
            <Input className="h-9 font-mono text-xs" dir="ltr" value={row.key} placeholder={tr("typeKey", lang)} onChange={(e) => onChange({ ...row, key: e.target.value })} />
          )}
        </div>
      )}

      <div className={shape.hasUnit || shape.hasColor ? "grid grid-cols-[1fr_6rem] gap-2" : ""}>
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("label", lang)}</Label>
          <Input className="h-9" value={row.label} onChange={(e) => onChange({ ...row, label: e.target.value })} />
        </div>
        {shape.hasUnit && (
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("unit", lang)}</Label>
            <Input className="h-9" value={row.unit} onChange={(e) => onChange({ ...row, unit: e.target.value })} />
          </div>
        )}
        {shape.hasColor && !shape.hasUnit && (
          <div className="space-y-1.5">
            <Label className="text-xs">{tr("color", lang)}</Label>
            <Input type="color" className="h-9 p-1" value={row.color || "#0077B6"} onChange={(e) => onChange({ ...row, color: e.target.value.toUpperCase() })} />
          </div>
        )}
      </div>

      {shape.roles.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("role", lang)}</Label>
          <Select value={row.role || "reading"} onValueChange={(role) => onChange({ ...row, role })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {shape.roles.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]?.[lang] ?? r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {canRemove && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5 me-1" />{tr("remove", lang)}
          </Button>
        </div>
      )}
    </div>
  );
}
