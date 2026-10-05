import { TriangleAlert } from "lucide-react";
import type { WidgetRenderProps, WidgetRenderer } from "./types";
import { TimeseriesChartWidget } from "./TimeseriesChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { KpiWidget } from "./KpiWidget";

export type { WidgetRenderProps, WidgetRenderer } from "./types";

/**
 * Widget definition `type` → the component that draws it. Adding a widget
 * type the gateway offers is one entry here; a type with no entry still shows
 * up (and can be configured and saved), it just renders a placeholder.
 */
export const WIDGET_RENDERERS: Record<string, WidgetRenderer> = {
  "timeseries-chart": TimeseriesChartWidget,
  "bar-chart": BarChartWidget,
  kpi: KpiWidget,
};

const T = {
  unsupported: { en: "This panel can't draw", ar: "لا يمكن لهذه اللوحة عرض", fa: "این پنل نمی‌تواند این ویجت را نمایش دهد:" },
  unknown: { en: "Unknown widget type", ar: "نوع عنصر غير معروف", fa: "نوع ویجت ناشناخته" },
};

export function WidgetBody(props: WidgetRenderProps) {
  const Renderer = WIDGET_RENDERERS[props.widget.type];
  if (Renderer && props.definition) return <Renderer {...props} />;
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 text-center text-xs text-muted-foreground px-3">
      <TriangleAlert className="h-4 w-4" />
      <span>
        {props.definition ? `${T.unsupported[props.lang]} "${props.definition.name}"` : `${T.unknown[props.lang]}: ${props.widget.type} v${props.widget.schemaVersion}`}
      </span>
    </div>
  );
}
