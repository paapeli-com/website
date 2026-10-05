import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { telemetryService, type TelemetryAggregation, type TelemetryPoint } from "@paapeli/api";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { fmtDateTime, fmtTimeTick, toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { AXIS_TEXT, Hint, SERIES_COLORS, TOOLTIP_STYLE, compactNumber, useBoxSize } from "./chartKit";
import type { WidgetRenderProps } from "./types";

const T = {
  noSeries: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  noData: { en: "No data in this time range", ar: "لا توجد بيانات في هذه الفترة", fa: "در این بازه داده‌ای وجود ندارد" },
  failed: { en: "Couldn't load telemetry", ar: "تعذر تحميل القياسات", fa: "بارگذاری تله‌متری ممکن نشد" },
  queryUnsupported: { en: "Device-query sources aren't available yet", ar: "مصادر استعلام الأجهزة غير متاحة بعد", fa: "منبع «جستجوی دستگاه» هنوز در دسترس نیست" },
};

type Options = {
  aggregation?: Exclude<TelemetryAggregation, "NONE">;
  /** Bucket width in ms, or "window" for one bucket covering the whole window. */
  interval?: number | "window";
  showLegend?: boolean;
  yAxis?: { min?: number; max?: number };
};

/** More buckets than this would be slivers; the interval is widened to fit. */
const MAX_BUCKETS = 120;

/**
 * The "bar-chart" widget: one telemetry key, aggregated per device, read from
 * GET /telemetry/{ws}/{pk}/devices/{deviceId}/timeseries with an aggregation.
 *
 * With interval "window" each series is a single bar (the aggregate over the
 * whole window), so the chart compares devices. With a numeric interval the
 * window is cut into buckets and each bucket shows one bar per series.
 */
export function BarChartWidget({ widget, dataSources, window: [start, end], timeZone, lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const aggregation = options.aggregation ?? "AVG";
  const span = Math.max(1, Math.ceil(end) - Math.floor(start));
  const whole = options.interval === undefined || options.interval === "window";
  const interval = whole ? span : Math.max(Number(options.interval), Math.ceil(span / MAX_BUCKETS));

  const series = useMemo(
    () =>
      widget.data.map((d, i) => ({
        id: `s${i}`,
        item: d,
        source: dataSources[d.source],
        label: d.label?.trim() || d.key,
        unit: d.unit?.trim() || "",
      })),
    [widget.data, dataSources],
  );
  const drawable = series.filter((s) => s.source?.type === "device");

  const results = useQueries({
    queries: drawable.map((s) => {
      const deviceId = s.source?.type === "device" ? s.source.deviceId : "";
      return {
        queryKey: ["telemetryAggregate", workspaceId, PRODUCT_KEY, deviceId, s.item.key, start, end, aggregation, interval],
        queryFn: () =>
          telemetryService.getHistory(workspaceId, PRODUCT_KEY, deviceId, {
            keys: [s.item.key],
            startTs: Math.floor(start),
            endTs: Math.ceil(end),
            aggregation,
            interval,
            limit: MAX_BUCKETS + 1,
            order: "ASC",
          }),
        enabled: !!workspaceId && !!deviceId,
        // Keep drawing the last result while a refresh or a new window loads.
        placeholderData: (prev: unknown) => prev,
      };
    }),
  }) as Array<{ data?: Record<string, TelemetryPoint[]>; isLoading: boolean; isError: boolean; error: unknown }>;

  const [boxRef, box] = useBoxSize<HTMLDivElement>();

  if (series.length === 0) return <Hint>{T.noSeries[lang]}</Hint>;
  if (drawable.length === 0) return <Hint>{T.queryUnsupported[lang]}</Hint>;

  const loading = results.some((r) => r.isLoading);
  const errored = results.filter((r) => r.isError);
  const pointsOf = (i: number) =>
    (results[i]?.data?.[drawable[i].item.key] ?? [])
      .map((p) => ({ ts: Number(p.ts), y: toNumber(p.value) }))
      .filter((p): p is { ts: number; y: number } => p.y !== null && Number.isFinite(p.ts));

  // Whole window: one row per series. Buckets: one row per bucket, a column per series.
  const rows: Array<Record<string, number | string>> = whole
    ? drawable.flatMap((s, i) => {
        const last = pointsOf(i).at(-1);
        return last ? [{ name: s.label, value: last.y, index: i }] : [];
      })
    : (() => {
        const at = new Map<number, Record<string, number>>();
        drawable.forEach((s, i) => pointsOf(i).forEach((p) => at.set(p.ts, { ...(at.get(p.ts) ?? {}), [s.id]: p.y })));
        return [...at.entries()].sort(([a], [b]) => a - b).map(([t, v]) => ({ t, ...v }));
      })();

  if (errored.length && rows.length === 0 && !loading) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(errored[0].error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }
  if (rows.length === 0 && !loading) return <Hint>{T.noData[lang]}</Hint>;

  const units = [...new Set(drawable.map((s) => s.unit).filter(Boolean))];
  const unit = units.length === 1 ? units[0] : "";
  const yDomain: [number | "auto", number | "auto"] = [
    typeof options.yAxis?.min === "number" ? options.yAxis.min : "auto",
    typeof options.yAxis?.max === "number" ? options.yAxis.max : "auto",
  ];
  const withUnit = (value: unknown) => `${value}${unit ? ` ${unit}` : ""}`;

  return (
    <div ref={boxRef} className="relative h-full w-full min-h-0 min-w-0" dir="ltr">
      {box && (
        <BarChart width={box.width} height={box.height} data={rows} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          {whole ? (
            <XAxis dataKey="name" tick={AXIS_TEXT} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} interval={0} height={24} />
          ) : (
            <XAxis
              dataKey="t"
              tickFormatter={fmtTimeTick(span, timeZone)}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              minTickGap={16}
              height={24}
            />
          )}
          <YAxis
            width={unit ? 58 : 44}
            domain={yDomain}
            allowDataOverflow={yDomain.some((v) => v !== "auto")}
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => compactNumber.format(v)}
            label={unit ? { value: unit, angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, ...AXIS_TEXT } : undefined}
          />
          <RTooltip
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
            labelFormatter={(v) => (whole ? String(v) : fmtDateTime(Number(v), timeZone))}
            formatter={(value: unknown, name: unknown) => [withUnit(value), whole ? aggregation : String(name)]}
            contentStyle={TOOLTIP_STYLE}
          />
          {whole ? (
            <Bar dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]} maxBarSize={56}>
              {rows.map((r) => (
                <Cell key={String(r.name)} fill={SERIES_COLORS[Number(r.index) % SERIES_COLORS.length]} />
              ))}
            </Bar>
          ) : (
            <>
              {(options.showLegend ?? drawable.length > 1) && (
                <Legend verticalAlign="top" height={22} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              )}
              {drawable.map((s, i) => (
                <Bar
                  key={s.id}
                  dataKey={s.id}
                  name={s.label}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  isAnimationActive={false}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </>
          )}
        </BarChart>
      )}
    </div>
  );
}
