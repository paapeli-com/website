import { useQueries } from "@tanstack/react-query";
import { countDevices } from "@paapeli/api";
import { Cell, Pie, PieChart, Tooltip as RTooltip } from "recharts";
import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { Hint, SERIES_COLORS, TOOLTIP_STYLE, useBoxSize } from "./chartKit";
import type { WidgetRenderProps } from "./types";

const T = {
  noSlices: { en: "Add at least two slices in the widget settings", ar: "أضف شريحتين على الأقل في إعدادات العنصر", fa: "در تنظیمات ویجت دست‌کم دو بخش اضافه کنید" },
  failed: { en: "Couldn't load the counts", ar: "تعذر تحميل الأعداد", fa: "بارگذاری تعدادها ممکن نشد" },
  total: { en: "Total", ar: "الإجمالي", fa: "مجموع" },
  slice: { en: "Slice", ar: "شريحة", fa: "بخش" },
};

type Options = { showLegend?: boolean; showTotal?: boolean };

/**
 * The "donut-chart" widget: each binding is a `deviceCount` source, drawn as
 * a share of the total, with GET /devices/{ws}/{pk}/count resolving each one.
 * A slice whose count is zero stays in the legend and draws no arc.
 */
export function DonutChartWidget({ widget, dataSources, window: [, refreshedAt], lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;

  const slices = widget.data.flatMap((item, i) => {
    const source = dataSources[item.source];
    if (source?.type !== "deviceCount") return [];
    const { type: _type, ...filters } = source;
    return [{ id: `s${i}`, filters, label: item.label?.trim() || `${T.slice[lang]} ${i + 1}`, color: item.color || SERIES_COLORS[i % SERIES_COLORS.length] }];
  });

  const results = useQueries({
    queries: slices.map((s) => ({
      // The window's end moves on every dashboard refresh; keying on it re-reads then.
      queryKey: ["deviceCount", workspaceId, PRODUCT_KEY, s.filters, refreshedAt],
      queryFn: () => countDevices(workspaceId, PRODUCT_KEY, s.filters),
      enabled: !!workspaceId,
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: number; isLoading: boolean; isError: boolean; error: unknown }>;

  const [boxRef, box] = useBoxSize<HTMLDivElement>();

  if (slices.length < 2) return <Hint>{T.noSlices[lang]}</Hint>;

  const errored = results.filter((r) => r.isError && r.data === undefined);
  if (errored.length === results.length) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(errored[0].error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  const rows = slices.map((s, i) => ({ ...s, value: results[i]?.data ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const loading = results.some((r) => r.isLoading);
  const size = box ? Math.min(box.width, box.height) : 0;
  const outer = Math.max(20, size / 2 - 4);

  return (
    <div className="flex h-full w-full min-h-0 items-center gap-3">
      <div ref={boxRef} className="relative h-full min-h-0 min-w-0 flex-1" dir="ltr">
        {box && (
          <PieChart width={box.width} height={box.height}>
            {/* An empty ring while every count is zero, so the widget is not blank. */}
            {total === 0 && (
              <Pie data={[{ value: 1 }]} dataKey="value" innerRadius={outer * 0.62} outerRadius={outer} fill="hsl(var(--muted))" stroke="none" isAnimationActive={false} />
            )}
            {total > 0 && (
              <Pie data={rows} dataKey="value" nameKey="label" innerRadius={outer * 0.62} outerRadius={outer} paddingAngle={rows.filter((r) => r.value > 0).length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
                {rows.map((r) => <Cell key={r.id} fill={r.color} />)}
              </Pie>
            )}
            {total > 0 && <RTooltip contentStyle={TOOLTIP_STYLE} />}
          </PieChart>
        )}
        {(options.showTotal ?? true) && !loading && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none tabular-nums text-foreground">{total.toLocaleString("en")}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">{T.total[lang]}</span>
          </div>
        )}
      </div>
      {(options.showLegend ?? true) && (
        <ul className="flex max-h-full shrink-0 flex-col gap-1.5 overflow-y-auto pe-1 text-xs">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="max-w-[9rem] truncate text-muted-foreground">{r.label}</span>
              <span className="ms-auto ps-2 font-semibold tabular-nums text-foreground">{r.value.toLocaleString("en")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
