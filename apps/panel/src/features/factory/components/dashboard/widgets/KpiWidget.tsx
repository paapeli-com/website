import { useQuery } from "@tanstack/react-query";
import { countDevices, telemetryService } from "@paapeli/api";
import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import { evaluateFormula, matchAlarms } from "./sources";
import type { WidgetRenderProps } from "./types";

const T = {
  noBinding: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  unsupported: { en: "This source can't feed a KPI", ar: "هذا المصدر لا يصلح لمؤشر", fa: "این منبع برای شاخص قابل استفاده نیست" },
  failed: { en: "Couldn't load the value", ar: "تعذر تحميل القيمة", fa: "بارگذاری مقدار ممکن نشد" },
};

type Threshold = { condition: "above" | "below"; value: number; backgroundColor: string; foregroundColor: string };
type Options = { backgroundColor?: string; foregroundColor?: string; threshold?: Threshold | null };

const numberFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

/**
 * The "kpi" widget: one current value, large.
 *
 * A `device` binding shows the latest value of its key, from
 * GET /telemetry/{ws}/{pk}/devices/{deviceId}/latest. A `deviceCount` binding
 * has no key and shows GET /devices/{ws}/{pk}/count for its filters. The
 * dashboard's time window does not apply: a KPI is always the current value.
 *
 * Threshold colours apply only to a numeric value strictly above or below the
 * threshold. Equal, missing and non-numeric values keep the base colours, and
 * a missing value reads as a dash.
 */
export function KpiWidget({ widget, dataSources, window: [, refreshedAt], lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const item = widget.data[0];
  const source = item ? dataSources[item.source] : undefined;

  const isDevice = source?.type === "device" && !!item?.key;
  // A device count, an alarm count and a formula each resolve to one number without a key.
  const isCount = source?.type === "deviceCount" || source?.type === "alarmQuery" || source?.type === "formula";

  const query = useQuery({
    // The window's end moves on every dashboard refresh; keying on it re-reads then.
    queryKey: ["kpi", workspaceId, PRODUCT_KEY, source, item?.key, refreshedAt],
    queryFn: async (): Promise<unknown> => {
      if (source?.type === "device") {
        const latest = await telemetryService.getLatest(workspaceId, PRODUCT_KEY, source.deviceId, [item.key]);
        return latest[item.key]?.[0]?.value;
      }
      if (source?.type === "deviceCount") {
        const { type: _type, ...filters } = source;
        return countDevices(workspaceId, PRODUCT_KEY, filters);
      }
      if (source?.type === "alarmQuery") return (await matchAlarms(workspaceId, source)).length;
      if (source?.type === "formula") return (await evaluateFormula(workspaceId, source)) ?? undefined;
      return undefined;
    },
    enabled: !!workspaceId && (isDevice || isCount),
    // Keep the last value on screen while it refreshes.
    placeholderData: (prev: unknown) => prev,
  });

  if (!item || !source) return <Hint>{T.noBinding[lang]}</Hint>;
  if (!isDevice && !isCount) return <Hint>{source.type === "device" ? T.noBinding[lang] : T.unsupported[lang]}</Hint>;
  if (query.isError && query.data === undefined) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(query.error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  const raw = query.data;
  const numeric = raw === undefined || raw === null || raw === "" ? null : toNumber(raw);
  const threshold = options.threshold ?? null;
  const breached =
    numeric !== null && threshold !== null && (threshold.condition === "above" ? numeric > threshold.value : numeric < threshold.value);

  const background = (breached ? threshold?.backgroundColor : options.backgroundColor) ?? "#FFFFFF";
  const foreground = (breached ? threshold?.foregroundColor : options.foregroundColor) ?? "#222222";
  const text = query.isLoading ? "" : numeric !== null ? numberFormat.format(numeric) : raw === undefined || raw === null || raw === "" ? "—" : String(raw);
  const label = item.label?.trim() || (isDevice ? item.key : "");
  const unit = item.unit?.trim() || "";

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-1 rounded-lg px-3 text-center"
      style={{ backgroundColor: background, color: foreground }}
    >
      {/* Numbers read left to right in every language, with the unit after them. */}
      <div dir="ltr" className="flex max-w-full items-baseline gap-1.5">
        <span className="truncate text-3xl font-bold leading-none tabular-nums">{text}</span>
        {unit && text && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
      {label && <div className="max-w-full truncate text-xs opacity-80">{label}</div>}
    </div>
  );
}
