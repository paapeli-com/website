// Mock data registry for dashboard widgets.
// Each data source exposes metrics; each metric can be rendered as KPI / chart / table.

export type WidgetKind = "kpi" | "line" | "bar" | "donut" | "table" | "text";

export interface MetricOption {
  key: string;
  label: string;
  unit?: string;
}

export interface DataSource {
  id: string;
  label: string;
  metrics: MetricOption[];
  // categorical dimensions (for breakdowns)
  dimensions: { key: string; label: string; values: string[] }[];
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: "production",
    label: "Production",
    metrics: [
      { key: "units", label: "Units Produced", unit: "" },
      { key: "oee", label: "OEE", unit: "%" },
      { key: "yield", label: "Yield", unit: "%" },
      { key: "downtime", label: "Downtime", unit: "min" },
    ],
    dimensions: [
      { key: "line", label: "Line", values: ["Line 1", "Line 2", "Line 3", "Line 4"] },
      { key: "shift", label: "Shift", values: ["Morning", "Evening", "Night"] },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    metrics: [
      { key: "kwh", label: "Consumption", unit: "kWh" },
      { key: "cost", label: "Cost", unit: "$" },
      { key: "peak", label: "Peak Demand", unit: "kW" },
      { key: "co2", label: "CO₂ Emissions", unit: "kg" },
    ],
    dimensions: [
      { key: "site", label: "Site", values: ["Factory A", "Factory B", "Factory C"] },
    ],
  },
  {
    id: "devices",
    label: "Devices",
    metrics: [
      { key: "online", label: "Online", unit: "" },
      { key: "offline", label: "Offline", unit: "" },
      { key: "total", label: "Total", unit: "" },
      { key: "uptime", label: "Uptime", unit: "%" },
    ],
    dimensions: [
      { key: "type", label: "Type", values: ["PLC", "Sensor", "Gateway", "Meter"] },
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    metrics: [
      { key: "critical", label: "Critical", unit: "" },
      { key: "warning", label: "Warning", unit: "" },
      { key: "info", label: "Info", unit: "" },
      { key: "open", label: "Open", unit: "" },
    ],
    dimensions: [
      { key: "severity", label: "Severity", values: ["Critical", "Warning", "Info"] },
    ],
  },
  {
    id: "assets",
    label: "Assets Health",
    metrics: [
      { key: "healthy", label: "Healthy", unit: "" },
      { key: "degraded", label: "Degraded", unit: "" },
      { key: "critical", label: "Critical", unit: "" },
      { key: "score", label: "Health Score", unit: "%" },
    ],
    dimensions: [
      { key: "status", label: "Status", values: ["Healthy", "Degraded", "Critical"] },
    ],
  },
];

export const findDataSource = (id?: string) =>
  DATA_SOURCES.find((d) => d.id === id) ?? DATA_SOURCES[0];

const seed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967295;
  };
};

export interface KPIValue { value: number; unit: string; change: number; }
export interface SeriesPoint { x: string; y: number; }
export interface BreakdownItem { label: string; value: number; }
export interface TableData { columns: string[]; rows: (string | number)[][]; }

export const getKPI = (sourceId: string, metricKey: string, salt = ""): KPIValue => {
  const src = findDataSource(sourceId);
  const m = src.metrics.find((x) => x.key === metricKey) ?? src.metrics[0];
  const r = seed(`${sourceId}-${m.key}-${salt}`);
  const base = Math.floor(r() * 9000 + 100);
  const change = Math.round((r() * 40 - 20) * 10) / 10;
  return { value: base, unit: m.unit || "", change };
};

export const getSeries = (sourceId: string, metricKey: string, points = 12, salt = ""): SeriesPoint[] => {
  const r = seed(`${sourceId}-${metricKey}-${salt}-series`);
  const out: SeriesPoint[] = [];
  let v = r() * 80 + 20;
  for (let i = 0; i < points; i++) {
    v += (r() - 0.5) * 20;
    v = Math.max(5, Math.min(120, v));
    out.push({ x: `${i + 1}`, y: Math.round(v * 10) / 10 });
  }
  return out;
};

export const getBreakdown = (sourceId: string, dimensionKey?: string, salt = ""): BreakdownItem[] => {
  const src = findDataSource(sourceId);
  const dim = src.dimensions.find((d) => d.key === dimensionKey) ?? src.dimensions[0];
  const r = seed(`${sourceId}-${dim.key}-${salt}-bd`);
  return dim.values.map((v) => ({ label: v, value: Math.round(r() * 100) }));
};

export const getTable = (sourceId: string, metricKeys: string[], salt = ""): TableData => {
  const src = findDataSource(sourceId);
  const dim = src.dimensions[0];
  const metrics = src.metrics.filter((m) => metricKeys.includes(m.key));
  const cols = [dim.label, ...metrics.map((m) => m.label + (m.unit ? ` (${m.unit})` : ""))];
  const r = seed(`${sourceId}-${salt}-table`);
  const rows = dim.values.map((v) => [v, ...metrics.map(() => Math.round(r() * 9000 + 100))]);
  return { columns: cols, rows };
};
