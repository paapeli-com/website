import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import { useLatestReadings } from "./useLatestReadings";
import type { WidgetRenderProps } from "./types";

const T = {
  noBinding: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  failed: { en: "Couldn't load the value", ar: "تعذر تحميل القيمة", fa: "بارگذاری مقدار ممکن نشد" },
};

type Range = { from: number; to: number; color: string };
type Options = { min?: number; max?: number; decimals?: number; ranges?: Range[] };

/**
 * The "level-bar" widget: the latest value of one telemetry key on a vertical
 * scale. A value inside a range takes that range's colour, and the ranges are
 * marked beside the bar. As on the gauge, a value outside the scale is drawn at
 * the nearest end but written as it is.
 */
export function LevelBarWidget({ widget, dataSources, window: [, refreshedAt], lang }: WidgetRenderProps) {
  const options = (widget.options ?? {}) as Options;
  const item = widget.data[0];
  const { values, bound, loading, failed, error } = useLatestReadings(widget, dataSources, refreshedAt);

  if (!item || !bound) return <Hint>{T.noBinding[lang]}</Hint>;
  const raw = values[0];
  if (failed && raw === undefined) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  const min = typeof options.min === "number" ? options.min : 0;
  const max = typeof options.max === "number" ? options.max : 100;
  const scale = max > min ? max - min : 0;
  const ranges = Array.isArray(options.ranges) ? options.ranges : [];
  const value = toNumber(raw);
  const position = (v: number) => (scale ? Math.min(1, Math.max(0, (v - min) / scale)) : 0);
  const band = value === null ? undefined : ranges.find((r) => value >= Math.min(r.from, r.to) && value <= Math.max(r.from, r.to));
  const decimals = Number.isInteger(options.decimals) ? Number(options.decimals) : 1;
  const format = (v: number) => v.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  const text = loading && raw === undefined ? "" : value !== null ? format(value) : raw === undefined || raw === null || raw === "" ? "—" : String(raw);
  const label = item.label?.trim() || item.key;
  const unit = item.unit?.trim() || "";

  return (
    <div className="flex h-full w-full min-h-0 items-stretch justify-center gap-3 px-2" dir="ltr" role="img" aria-label={`${label}: ${text} ${unit}`.trim()}>
      <div className="flex flex-col justify-between py-0.5 text-[10px] tabular-nums text-muted-foreground">
        <span>{format(max)}</span>
        <span>{format(min)}</span>
      </div>
      <div className="relative w-5 shrink-0 overflow-hidden rounded-md bg-muted">
        {scale > 0 && value !== null && (
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-700"
            style={{ height: `${position(value) * 100}%`, background: band?.color ?? "hsl(var(--primary))" }}
          />
        )}
      </div>
      {scale > 0 && ranges.length > 0 && (
        <div className="relative -ms-2.5 w-1 shrink-0">
          {ranges.map((r, i) => {
            const from = position(Math.min(r.from, r.to));
            const to = position(Math.max(r.from, r.to));
            return <div key={i} className="absolute inset-x-0" style={{ bottom: `${from * 100}%`, height: `${(to - from) * 100}%`, background: r.color }} />;
          })}
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-center">
        <div className="text-xl font-bold tabular-nums text-foreground">
          {text}
          {unit && text && text !== "—" && <span className="ms-1 text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
