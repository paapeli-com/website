import { useCallback, useEffect, useState } from "react";
import type { WidgetKind } from "@/features/factory/lib/dashboardData";

export interface Widget {
  id: string;
  kind: WidgetKind;
  title: string;
  // Grid position (12-col)
  x: number;
  y: number;
  w: number;
  h: number;
  // Data binding
  dataSourceId: string;
  metricKey?: string;
  metricKeys?: string[]; // for table
  dimensionKey?: string; // for breakdown / donut / bar
  deviceId?: string; // for the "devices" source: the device to chart
  telemetryKey?: string; // for the "devices" source: which telemetry series
  telemetryKeys?: string[]; // for the "devices" source in a table: its columns
  energyReading?: "kwh" | "wh" | "kw" | "w"; // for the "energy" source: what telemetryKey holds
  tariff?: number; // for the "energy" source: price of one kWh
  currency?: string; // for the "energy" source: the tariff's currency label
  co2Factor?: number; // for the "energy" source: kg of CO₂ per kWh
  text?: string; // for text widget
}

const KEY = (dashboardId: string) => `paapeli-canvas-${dashboardId}-v1`;

const defaultLayout = (): Widget[] => [
  { id: "w1", kind: "kpi", title: "Units Produced", x: 0, y: 0, w: 3, h: 2, dataSourceId: "production", metricKey: "units" },
  { id: "w2", kind: "kpi", title: "OEE", x: 3, y: 0, w: 3, h: 2, dataSourceId: "production", metricKey: "oee" },
  { id: "w3", kind: "kpi", title: "Energy Cost", x: 6, y: 0, w: 3, h: 2, dataSourceId: "energy", metricKey: "cost" },
  { id: "w4", kind: "kpi", title: "Critical Alerts", x: 9, y: 0, w: 3, h: 2, dataSourceId: "alerts", metricKey: "critical" },
  { id: "w5", kind: "line", title: "Production Trend", x: 0, y: 2, w: 8, h: 4, dataSourceId: "production", metricKey: "units" },
  { id: "w6", kind: "donut", title: "Alerts by Severity", x: 8, y: 2, w: 4, h: 4, dataSourceId: "alerts", dimensionKey: "severity" },
];

export const useDashboardCanvas = (dashboardId: string) => {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    try {
      const raw = localStorage.getItem(KEY(dashboardId));
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultLayout();
  });

  useEffect(() => {
    try { localStorage.setItem(KEY(dashboardId), JSON.stringify(widgets)); } catch {}
  }, [widgets, dashboardId]);

  const addWidget = useCallback((w: Omit<Widget, "id" | "x" | "y">) => {
    setWidgets((prev) => {
      // place at first empty row at x=0
      const maxY = prev.reduce((m, p) => Math.max(m, p.y + p.h), 0);
      const nw: Widget = { ...w, id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: 0, y: maxY };
      return [...prev, nw];
    });
  }, []);

  const updateWidget = useCallback((id: string, patch: Partial<Widget>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const setAll = useCallback((next: Widget[]) => setWidgets(next), []);

  // Tidies the existing widgets into a gap-free grid; it never adds or removes any.
  const resetLayout = useCallback(() => setWidgets((prev) => packLayout(prev)), []);

  return { widgets, addWidget, updateWidget, removeWidget, setAll, resetLayout };
};

// ============ Snap-to-grid + collision resolution ============

const COLS = 12;

const collides = (a: Widget, b: Widget) =>
  a.id !== b.id &&
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

// Push down any widget that overlaps `moved`. Repeat until stable.
export const resolveCollisions = (list: Widget[], movedId: string): Widget[] => {
  const out = list.map((w) => ({ ...w }));
  const moved = out.find((w) => w.id === movedId);
  if (!moved) return out;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    for (const w of out) {
      if (w.id === movedId) continue;
      if (collides(moved, w)) {
        w.y = moved.y + moved.h;
        changed = true;
      }
    }
    // chain: re-resolve newly-moved widgets
    for (const a of out) {
      for (const b of out) {
        if (a.id === b.id) continue;
        if (collides(a, b) && a.y <= b.y) {
          b.y = a.y + a.h;
          changed = true;
        }
      }
    }
  }
  return out;
};

// Re-place every widget, in reading order (top to bottom, then left to right),
// at the first free spot at or after the previous widget's position. Gaps
// close, but no widget jumps ahead of one that came before it. Sizes are kept
// (widths clamped to the grid), so only the arrangement changes.
export const packLayout = (list: Widget[]): Widget[] => {
  const ordered = [...list].sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: Widget[] = [];
  let cursor = { x: 0, y: 0 };
  for (const widget of ordered) {
    const w = Math.min(widget.w, COLS);
    let spot: Widget | null = null;
    for (let y = cursor.y; !spot; y++) {
      for (let x = y === cursor.y ? cursor.x : 0; x + w <= COLS; x++) {
        const candidate = { ...widget, x, y, w };
        if (!placed.some((p) => collides(candidate, p))) { spot = candidate; break; }
      }
    }
    placed.push(spot!);
    cursor = { x: spot!.x, y: spot!.y };
  }
  // Keep the caller's original order so React keys stay stable.
  return list.map((w) => placed.find((p) => p.id === w.id)!);
};

export const snapPosition = (x: number, y: number, w: number) => {
  const sx = Math.max(0, Math.min(COLS - w, Math.round(x)));
  const sy = Math.max(0, Math.round(y));
  return { x: sx, y: sy };
};

export const GRID_COLS = COLS;
