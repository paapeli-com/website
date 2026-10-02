import type { ComponentType } from "react";
import type { DashboardDataSource, DashboardWidget, WidgetDefinition } from "@paapeli/api";

export type WidgetLang = "en" | "ar" | "fa";

/** What every widget renderer gets. */
export interface WidgetRenderProps {
  widget: DashboardWidget;
  definition: WidgetDefinition | undefined;
  dataSources: Record<string, DashboardDataSource>;
  /** [start, end] in ms this widget shows (its own window, or the dashboard's). */
  window: [number, number];
  /** IANA zone to show times in. */
  timeZone: string;
  lang: WidgetLang;
  /** Drag-select on a time axis zooms the whole dashboard to [from, to]. */
  onZoom?: (from: number, to: number) => void;
}

export type WidgetRenderer = ComponentType<WidgetRenderProps>;
