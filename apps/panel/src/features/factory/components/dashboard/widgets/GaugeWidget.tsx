import { useQuery } from "@tanstack/react-query";
import { telemetryService } from "@paapeli/api";
import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import type { WidgetRenderProps } from "./types";

const T = {
  noBinding: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  failed: { en: "Couldn't load the value", ar: "تعذر تحميل القيمة", fa: "بارگذاری مقدار ممکن نشد" },
};

type Range = { from: number; to: number; color: string };
type Options = { min?: number; max?: number; decimals?: number; ranges?: Range[] };

/* A half circle, drawn left to right. The value arc and the band marks share
   one path each and are cut to length with a dash pattern. */
const R = 46;
const BAND_R = 56;
const arc = (r: number) => `M ${60 - r} 62 A ${r} ${r} 0 0 1 ${60 + r} 62`;
const lengthOf = (r: number) => Math.PI * r;
const cut = (r: number, from: number, to: number) => ({
  strokeDasharray: `${lengthOf(r) * Math.max(0, to - from)} ${lengthOf(r)}`,
  strokeDashoffset: -lengthOf(r) * from,
});

/**
 * The "gauge" widget: the latest value of one telemetry key on a scale from
 * `min` to `max`, read from GET /telemetry/{ws}/{pk}/devices/{deviceId}/latest.
 *
 * A value inside a range takes that range's colour; ranges are matched in
 * order. A value outside the scale is drawn at the nearest end but written as
 * it is. `max <= min` is an empty scale, as the gateway's definition says.
 */
export function GaugeWidget({ widget, dataSources, lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const item = widget.data[0];
  const source = item ? dataSources[item.source] : undefined;
  const deviceId = source?.type === "device" ? source.deviceId : "";

  const query = useQuery({
    queryKey: ["gauge", workspaceId, PRODUCT_KEY, deviceId, item?.key],
    queryFn: async () => (await telemetryService.getLatest(workspaceId, PRODUCT_KEY, deviceId, [item.key]))[item.key]?.[0]?.value,
    enabled: !!workspaceId && !!deviceId && !!item?.key,
    // Keep the last value on screen while it refreshes.
    placeholderData: (prev: unknown) => prev,
  });

  if (!item || !deviceId || !item.key) return <Hint>{T.noBinding[lang]}</Hint>;
  if (query.isError && query.data === undefined) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(query.error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  const min = typeof options.min === "number" ? options.min : 0;
  const max = typeof options.max === "number" ? options.max : 100;
  const scale = max > min ? max - min : 0;
  const ranges = Array.isArray(options.ranges) ? options.ranges : [];
  const raw = query.data;
  const value = raw === undefined || raw === null || raw === "" ? null : toNumber(raw);

  const position = (v: number) => (scale ? Math.min(1, Math.max(0, (v - min) / scale)) : 0);
  const band = value === null ? undefined : ranges.find((r) => value >= Math.min(r.from, r.to) && value <= Math.max(r.from, r.to));
  const color = band?.color ?? "hsl(var(--primary))";
  const decimals = Number.isInteger(options.decimals) ? Number(options.decimals) : 1;
  const format = (v: number) => v.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  const text = query.isLoading ? "" : value !== null ? format(value) : raw === undefined || raw === null || raw === "" ? "—" : String(raw);
  const label = item.label?.trim() || item.key;
  const unit = item.unit?.trim() || "";

  return (
    <div className="flex h-full w-full min-h-0 flex-col items-center justify-center px-2" dir="ltr">
      <svg viewBox="0 0 120 70" className="h-full max-h-40 w-full min-h-0" role="img" aria-label={`${label}: ${text} ${unit}`.trim()}>
        <path d={arc(R)} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} strokeLinecap="round" />
        {scale > 0 &&
          ranges.map((r, i) => (
            <path
              key={i}
              d={arc(BAND_R)}
              fill="none"
              stroke={r.color}
              strokeWidth={3}
              {...cut(BAND_R, position(Math.min(r.from, r.to)), position(Math.max(r.from, r.to)))}
            />
          ))}
        {value !== null && scale > 0 && position(value) > 0 && (
          <path d={arc(R)} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" {...cut(R, 0, position(value))} />
        )}
        <text x={60} y={56} textAnchor="middle" className="fill-foreground" style={{ fontSize: 17, fontWeight: 700 }}>
          {text}
          {unit && text && text !== "—" && (
            <tspan dx={2} style={{ fontSize: 8, fontWeight: 500 }} className="fill-muted-foreground">{unit}</tspan>
          )}
        </text>
        <text x={60 - R} y={69} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 6.5 }}>{format(min)}</text>
        <text x={60 + R} y={69} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 6.5 }}>{format(max)}</text>
      </svg>
      <div className="max-w-full truncate text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
