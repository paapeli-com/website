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

/* A new dashboard starts empty. It used to be seeded with sample KPI, trend
   and severity charts bound to sources that have no data for a fresh account,
   so a new dashboard opened full of empty charts; the canvas page shows a
   "create your first chart" state instead. Dashboards that already have a
   saved layout are unaffected — only a missing layout falls back to this. */
const defaultLayout = (): Widget[] => [];

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

  /** Adds a widget below everything, or at `at` (e.g. where the canvas's
   *  "Add chart" tile sat), pushing down anything it then overlaps. */
  const addWidget = useCallback((w: Omit<Widget, "id" | "x" | "y">, at?: { x: number; y: number }) => {
    setWidgets((prev) => {
      const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (!at) {
        // place at first empty row at x=0
        const maxY = prev.reduce((m, p) => Math.max(m, p.y + p.h), 0);
        return [...prev, { ...w, id, x: 0, y: maxY }];
      }
      const x = Math.max(0, Math.min(COLS - w.w, at.x));
      return resolveCollisions([...prev, { ...w, id, x, y: at.y }], id);
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
