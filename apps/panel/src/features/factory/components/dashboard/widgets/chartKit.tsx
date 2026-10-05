import { useEffect, useState } from "react";

/* What the chart widgets share: the series palette, axis type, a sized box to
   draw into and the centred hint shown in place of a chart. */

export const SERIES_COLORS = ["hsl(var(--primary))", "#0077B6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
export const AXIS_TEXT = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
export const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
};

/**
 * The element's content size, once it has one. Charts are drawn at this exact
 * size instead of through ResponsiveContainer, whose first render uses a -1×-1
 * placeholder and logs a size warning for every chart it mounts.
 */
export function useBoxSize<T extends HTMLElement>() {
  // A callback ref (element in state), so observing starts whenever the element
  // mounts, including after an early-return hint is replaced by the chart.
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

export const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full flex items-center justify-center text-center text-xs text-muted-foreground px-3">{children}</div>
);
