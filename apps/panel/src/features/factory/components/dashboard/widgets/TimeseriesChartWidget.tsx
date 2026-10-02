import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { telemetryService, type TelemetryPoint } from "@paapeli/api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { fmtDateTime, fmtTimeTick, noDataSpans, toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import type { WidgetRenderProps } from "./types";

const T = {
  noSeries: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و کلید تله‌متری انتخاب کنید" },
  noData: { en: "No data in this time range", ar: "لا توجد بيانات في هذه الفترة", fa: "در این بازه داده‌ای وجود ندارد" },
  noDataShort: { en: "No data", ar: "لا توجد بيانات", fa: "بدون داده" },
  failed: { en: "Couldn't load telemetry", ar: "تعذر تحميل القياسات", fa: "بارگذاری تله‌متری ممکن نشد" },
  partlyFailed: { en: "Some data couldn't be refreshed", ar: "تعذر تحديث بعض البيانات", fa: "برخی داده‌ها به‌روز نشدند" },
  queryUnsupported: { en: "Device-query sources aren't available yet", ar: "مصادر استعلام الأجهزة غير متاحة بعد", fa: "منبع «جستجوی دستگاه» هنوز در دسترس نیست" },
};

const SERIES_COLORS = ["hsl(var(--primary))", "#0077B6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
const AXIS_TEXT = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
// ReferenceArea renders these SVG props, but Recharts 3's typings drop them.
const NO_DATA_FILL = { fill: "hsl(var(--muted-foreground))", fillOpacity: 0.08, stroke: "none" } as Record<string, unknown>;
const SELECTION_FILL = { fill: "hsl(var(--primary))", fillOpacity: 0.15, stroke: "hsl(var(--primary))", strokeOpacity: 0.4 } as Record<string, unknown>;
/** Points asked for per key; enough for a smooth line over any window offered. */
const POINT_LIMIT = 5000;

/**
 * The element's content size, once it has one. Charts are drawn at this exact
 * size instead of through ResponsiveContainer, whose first render uses a -1×-1
 * placeholder and logs a size warning for every chart it mounts.
 */
function useBoxSize<T extends HTMLElement>() {
  // A callback ref (element in state), so observing starts whenever the element
  // mounts — including after an early-return hint is replaced by the chart.
  const [el, ref] = useState<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = (width: number, height: number) => {
      const w = Math.floor(width);
      const h = Math.floor(height);
      setSize((prev) => (w > 0 && h > 0 ? (prev?.width === w && prev?.height === h ? prev : { width: w, height: h }) : null));
    };
    const rect = el.getBoundingClientRect();
    update(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) => entry && update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [ref, size] as const;
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full flex items-center justify-center text-center text-xs text-muted-foreground px-3">{children}</div>
);

type Options = { showLegend?: boolean; yAxis?: { min?: number; max?: number } };

/**
 * The "timeseries-chart" widget: one line per `data` item, read from
 * GET /telemetry/{ws}/{pk}/devices/{deviceId}/timeseries — one request per
 * device, asking for all of that device's keys at once.
 */
export function TimeseriesChartWidget({ widget, dataSources, window: [start, end], timeZone, lang, onZoom }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;

  /* Series, and the device requests that feed them. */
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
  const byDevice = useMemo(() => {
    const m = new Map<string, Set<string>>();
    series.forEach((s) => {
      if (s.source?.type !== "device") return;
      const keys = m.get(s.source.deviceId) ?? new Set<string>();
      keys.add(s.item.key);
      m.set(s.source.deviceId, keys);
    });
    return [...m.entries()].map(([deviceId, keys]) => ({ deviceId, keys: [...keys].sort() }));
  }, [series]);

  const results = useQueries({
    queries: byDevice.map(({ deviceId, keys }) => ({
      queryKey: ["telemetryHistory", workspaceId, PRODUCT_KEY, deviceId, keys.join(","), start, end, POINT_LIMIT],
      queryFn: () =>
        telemetryService.getHistory(workspaceId, PRODUCT_KEY, deviceId, {
          keys,
          startTs: Math.floor(start),
          endTs: Math.ceil(end),
          limit: POINT_LIMIT,
          order: "ASC",
        }),
      enabled: !!workspaceId,
      // Keep drawing the last result while a refresh or a new window loads.
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: Record<string, TelemetryPoint[]>; isLoading: boolean; isError: boolean; error: unknown }>;

  const telemetryOf = new Map(byDevice.map((d, i) => [d.deviceId, results[i]?.data]));
  // No loading indicator: until the first response the chart is drawn empty.
  const loading = results.some((r) => r.isLoading);
  const errored = results.filter((r) => r.isError);
  const errorText = errored.length ? apiErrorMessage(errored[0].error, T.failed[lang]) : "";

  /* One row per timestamp; a row carries only the series that reported then. */
  // Cheap enough to rebuild each render: a few thousand points at most.
  const { rows, times } = (() => {
    const at = new Map<number, Record<string, number>>();
    series.forEach((s) => {
      if (s.source?.type !== "device") return;
      const points = telemetryOf.get(s.source.deviceId)?.[s.item.key] ?? [];
      points.forEach((p) => {
        const ts = Number(p.ts);
        const y = toNumber(p.value);
        if (y === null || !Number.isFinite(ts) || ts < start || ts > end) return;
        at.set(ts, { ...(at.get(ts) ?? {}), [s.id]: y });
      });
    });
    const sorted = [...at.entries()].sort(([a], [b]) => a - b);
    return { rows: sorted.map(([t, v]) => ({ t, ...v })), times: sorted.map(([t]) => t) };
  })();

  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const [boxRef, box] = useBoxSize<HTMLDivElement>();

  if (series.length === 0) return <Hint>{T.noSeries[lang]}</Hint>;
  if (series.every((s) => s.source?.type === "deviceQuery")) return <Hint>{T.queryUnsupported[lang]}</Hint>;
  if (errored.length && rows.length === 0 && !loading) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={errorText}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }
  if (rows.length === 0 && !loading) return <Hint>{T.noData[lang]}</Hint>;

  const span = end - start;
  const units = [...new Set(series.map((s) => s.unit).filter(Boolean))];
  const yLabel = units.length === 1 ? units[0] : undefined;
  const showLegend = options.showLegend ?? series.length > 1;
  const yDomain: [number | "auto", number | "auto"] = [
    typeof options.yAxis?.min === "number" ? options.yAxis.min : "auto",
    typeof options.yAxis?.max === "number" ? options.yAxis.max : "auto",
  ];
  const zoomable = !!onZoom && rows.length > 1;
  const pointerTime = (state: any) => {
    const t = Number(state?.activeLabel);
    return state?.activeLabel === undefined || !Number.isFinite(t) ? undefined : t;
  };
  const zoomHandlers = zoomable
    ? {
        onMouseDown: (state: any) => { const t = pointerTime(state); if (t !== undefined) setSelection({ from: t, to: t }); },
        onMouseMove: (state: any) => { const t = pointerTime(state); if (t !== undefined) setSelection((s) => (s ? { ...s, to: t } : s)); },
        onMouseUp: () => {
          if (selection) {
            const from = Math.min(selection.from, selection.to);
            const to = Math.max(selection.from, selection.to);
            if (to > from) onZoom!(from, to);
          }
          setSelection(null);
        },
        onMouseLeave: () => setSelection(null),
      }
    : {};

  return (
    <div ref={boxRef} className={`relative h-full w-full min-h-0 min-w-0 ${zoomable ? "cursor-crosshair select-none" : ""}`} dir="ltr">
      {/* Loaded, but a refresh of some series failed: keep the last data on screen and say so. */}
      {errored.length > 0 && rows.length > 0 && (
        <span
          className="absolute top-0 end-0 z-10 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive"
          title={errorText}
        >
          <TriangleAlert className="h-3 w-3" />{T.partlyFailed[lang]}
        </span>
      )}
      {box && (
        <AreaChart width={box.width} height={box.height} data={rows} margin={{ top: 6, right: 12, bottom: 0, left: 0 }} {...zoomHandlers}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[start, end]}
            allowDataOverflow
            tickFormatter={fmtTimeTick(span, timeZone)}
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            minTickGap={16}
            height={24}
          />
          <YAxis
            width={yLabel ? 58 : 44}
            domain={yDomain}
            allowDataOverflow={yDomain.some((v) => v !== "auto")}
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => compactNumber.format(v)}
            label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, ...AXIS_TEXT } : undefined}
          />
          <RTooltip
            labelFormatter={(v) => fmtDateTime(Number(v), timeZone)}
            formatter={(value: any, _name: any, item: any) => {
              const s = series.find((x) => x.id === item?.dataKey);
              return [`${value}${s?.unit ? ` ${s.unit}` : ""}`, s?.label ?? ""];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
          />
          {showLegend && <Legend verticalAlign="top" height={22} iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
          {/* While the first response is on its way the chart is simply empty, not "no data". */}
          {!loading && noDataSpans(times, start, end).map(([x1, x2]) => (
            <ReferenceArea
              key={`${x1}-${x2}`}
              {...NO_DATA_FILL}
              x1={x1}
              x2={x2}
              ifOverflow="hidden"
              zIndex={0}
              label={span && (x2 - x1) / span > 0.15 ? { value: T.noDataShort[lang], position: "center" as const, ...AXIS_TEXT } : undefined}
            />
          ))}
          {selection && selection.from !== selection.to && (
            <ReferenceArea
              {...SELECTION_FILL}
              x1={Math.min(selection.from, selection.to)}
              x2={Math.max(selection.from, selection.to)}
              ifOverflow="hidden"
              zIndex={0}
            />
          )}
          {series.map((s, i) => {
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <Area
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.label}
                stroke={color}
                fill={color}
                fillOpacity={series.length > 1 ? 0.06 : 0.12}
                strokeWidth={1.75}
                dot={rows.length === 1}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </AreaChart>
      )}
    </div>
  );
}
