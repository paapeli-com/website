import { useEffect, useMemo, useState } from "react";
import {
  useDeviceTelemetryKeysQuery,
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
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { TIME_WINDOW_OPTIONS } from "@/features/factory/lib/dashboardSettings";
import { compact, ensureDeviceSource, replaceWidget, validateWidget } from "@/features/factory/lib/dashboardDefinition";
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
  querySource: { en: "Device query source", ar: "مصدر استعلام الأجهزة", fa: "منبع جستجوی دستگاه" },
  timeWindow: { en: "Time range", ar: "النطاق الزمني", fa: "بازه زمانی" },
  useDashboard: { en: "Same as the dashboard", ar: "مثل اللوحة", fa: "مانند داشبورد" },
  options: { en: "Options", ar: "الخيارات", fa: "گزینه‌ها" },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  apply: { en: "Apply", ar: "تطبيق", fa: "اعمال" },
  fix: { en: "Fix these before applying:", ar: "أصلح ما يلي قبل التطبيق:", fa: "پیش از اعمال این موارد را اصلاح کنید:" },
  none: { en: "—", ar: "—", fa: "—" },
  invalidJson: { en: "Not valid JSON", ar: "JSON غير صالح", fa: "JSON نامعتبر است" },
};
const tr = (k: keyof typeof T, lang: WidgetLang) => T[k][lang] ?? T[k].en;

const DASHBOARD_WINDOW = "__dashboard";
const EMPTY = "__empty";

/** One series being edited. Device sources are picked by device; others are kept as-is. */
interface SeriesRow {
  rowId: string;
  deviceId?: string;
  /** Existing non-device source key (deviceQuery), shown read-only. */
  otherSource?: string;
  key: string;
  label: string;
  unit: string;
}

let rowSeq = 0;
const newRow = (partial: Partial<SeriesRow> = {}): SeriesRow => ({ rowId: `r${++rowSeq}`, key: "", label: "", unit: "", ...partial });

/* ---------------- schema-driven options form ---------------- */

const humanize = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bY axis\b/i, "Y axis");

const primaryType = (s: JsonSchema) => (Array.isArray(s.type) ? s.type.find((t) => t !== "null") : s.type);

const orderedKeys = (schema: JsonSchema, order?: string[]) => {
  const props = Object.keys(schema.properties ?? {});
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
              onChange={(v) => onChange({ ...obj, [k]: v })}
            />
          ))}
        </div>
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

/* ---------------- series rows ---------------- */

function SeriesEditor({
  row,
  devices,
  onChange,
  onRemove,
  canRemove,
  lang,
}: {
  row: SeriesRow;
  devices: { id: string; name: string }[];
  onChange: (r: SeriesRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  lang: WidgetLang;
}) {
  const workspaceId = useWorkspaceId() ?? "";
  const keysQuery = useDeviceTelemetryKeysQuery(workspaceId, PRODUCT_KEY, row.deviceId ?? "");
  const keys = useMemo(() => {
    const list = [...(keysQuery.data ?? [])].sort();
    return row.key && !list.includes(row.key) ? [row.key, ...list] : list;
  }, [keysQuery.data, row.key]);

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      {row.otherSource ? (
        <div className="text-xs text-muted-foreground">
          {tr("querySource", lang)}: <span className="font-mono">{row.otherSource}</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("device", lang)}</Label>
          <Select value={row.deviceId ?? ""} onValueChange={(deviceId) => onChange({ ...row, deviceId, key: "" })}>
            <SelectTrigger className="h-9"><SelectValue placeholder={tr("selectDevice", lang)} /></SelectTrigger>
            <SelectContent>
              {devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">{tr("key", lang)}</Label>
        {row.otherSource ? (
          <Input className="h-9" value={row.key} onChange={(e) => onChange({ ...row, key: e.target.value })} />
        ) : (
          <Select
            value={row.key}
            disabled={!row.deviceId}
            onValueChange={(key) => onChange({ ...row, key, label: row.label || key })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={row.deviceId && keysQuery.isLoading ? tr("loadingKeys", lang) : tr("selectKey", lang)} />
            </SelectTrigger>
            <SelectContent>
              {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              {row.deviceId && !keysQuery.isLoading && keys.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{tr("noKeys", lang)}</div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("label", lang)}</Label>
          <Input className="h-9" value={row.label} onChange={(e) => onChange({ ...row, label: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{tr("unit", lang)}</Label>
          <Input className="h-9" value={row.unit} onChange={(e) => onChange({ ...row, unit: e.target.value })} />
        </div>
      </div>
      {canRemove && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5 me-1" />{tr("removeSeries", lang)}
          </Button>
        </div>
      )}
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
  const [rows, setRows] = useState<SeriesRow[]>([]);
  const [windowValue, setWindowValue] = useState(DASHBOARD_WINDOW);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Load the widget into the draft each time the sheet opens on it.
  useEffect(() => {
    if (!open || !widget) return;
    setTitle(widget.title);
    const loaded = widget.data.map((d) => {
      const src = dashboard.dataSources[d.source];
      return newRow({
        deviceId: src?.type === "device" ? src.deviceId : undefined,
        otherSource: src && src.type !== "device" ? d.source : undefined,
        key: d.key,
        label: d.label ?? "",
        unit: d.unit ?? "",
      });
    });
    setRows(loaded.length ? loaded : [newRow()]);
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
    const filled = rows.filter((r) => (r.deviceId || r.otherSource) && r.key.trim());
    let next = dashboard;
    const data = filled.map((r) => {
      let source = r.otherSource ?? "";
      if (r.deviceId) {
        const name = devices.find((d) => d.id === r.deviceId)?.name ?? r.deviceId;
        [next, source] = ensureDeviceSource(next, r.deviceId, name);
      }
      return compact({ source, key: r.key.trim(), label: r.label.trim(), unit: r.unit.trim() }) as DashboardWidget["data"][number];
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
              <SeriesEditor
                key={r.rowId}
                row={r}
                devices={devices}
                lang={lang}
                canRemove={rows.length > 1}
                onChange={(nr) => setRows((prev) => prev.map((x) => (x.rowId === r.rowId ? nr : x)))}
                onRemove={() => setRows((prev) => prev.filter((x) => x.rowId !== r.rowId))}
              />
            ))}
            {multiple && (
              <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, newRow({ deviceId: prev[prev.length - 1]?.deviceId })])}>
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
