import { useEffect, useMemo } from "react";
import { useGetDeviceTimeSeriesQuery, type EntityFieldItem } from "@paapeli/api";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import {
  DATA_SOURCES,
  type SeriesPoint, type TableData, type WidgetKind,
} from "@/features/factory/lib/dashboardData";
import { Label } from "@/features/factory/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";

/** The dashboard data source whose widgets read real device telemetry. */
export const DEVICES_SOURCE_ID = "devices";

/** Widget kinds that can show one device's telemetry. A donut can't show a
 *  single series, so the Devices source isn't offered for it. */
export const DEVICE_WIDGET_KINDS: WidgetKind[] = ["kpi", "line", "bar", "table"];

export const isDeviceWidget = (kind: WidgetKind, sourceId?: string) =>
  sourceId === DEVICES_SOURCE_ID && DEVICE_WIDGET_KINDS.includes(kind);

/** The data sources a widget of this kind can be bound to. */
export const sourcesForKind = (kind: WidgetKind) =>
  DATA_SOURCES.filter((d) => d.id !== DEVICES_SOURCE_ID || DEVICE_WIDGET_KINDS.includes(kind));

/* The history endpoint takes a lookback in hours and clamps it to 1–24, so
   any dashboard range longer than a day shows the last 24 hours. */
export const rangeToHours = (range: string) => (range === "1h" ? 1 : 24);

/** A device's recent telemetry, keyed by telemetry name. */
export const useDeviceTelemetry = (deviceId: string | undefined, hours: number) => {
  const workspaceId = useWorkspaceId();
  return useGetDeviceTimeSeriesQuery(workspaceId ?? "", PRODUCT_KEY, deviceId ?? "", hours);
};

/** A telemetry value as a number, or null when it can't be plotted. The spec
 *  types values as strings, but numbers are accepted too; non-numeric values
 *  (e.g. "true", "good") and blanks are rejected. */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/* Every plottable point of one series, oldest first. */
export const toSeries = (points: EntityFieldItem[] = []): SeriesPoint[] =>
  [...points]
    .sort((a, b) => Number(a.ts) - Number(b.ts))
    .flatMap((p) => {
      const y = toNumber(p.value);
      return y === null ? [] : [{ x: String(p.ts), y }];
    });

const round = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtDateTime = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm(ms)}:${pad(d.getSeconds())}`;
};

/** A time-axis tick: clock time within a day and a half, the date beyond. */
export const fmtTimeTick = (spanMs: number) => (ms: number) => {
  if (spanMs <= 36 * 3_600_000) return hhmm(ms);
  const d = new Date(ms);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};

/** A chart row on a time axis: `t` in ms plus one numeric field per series. */
export type TimeRow = { t: number } & Record<string, number>;

/** The telemetry keys a line / bar / table widget plots. Older widgets saved a
 *  single `telemetryKey`, which is read as a one-key list. Undefined until
 *  something is chosen, so the pickers can pre-select a default. */
export const widgetTelemetryKeys = (w: { telemetryKey?: string; telemetryKeys?: string[] }) =>
  w.telemetryKeys ?? (w.telemetryKey ? [w.telemetryKey] : undefined);

/** A KPI from one series: the latest reading and its change since the first. */
export const toKPI = (series: SeriesPoint[]) => {
  const first = series[0].y;
  const last = series[series.length - 1].y;
  const change = first === 0 ? 0 : Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
  return { value: round(last), change };
};

const numericSeries = (data: Record<string, EntityFieldItem[]> | undefined, keys: string[]) =>
  keys.map((k) => ({ key: k, points: toSeries(data?.[k]) })).filter((s) => s.points.length);

/** Line data: every plottable reading of the chosen keys, merged on timestamp,
 *  oldest first. A row only carries the keys that reported at that instant. */
export const toTimeRows = (data: Record<string, EntityFieldItem[]> | undefined, keys: string[]): TimeRow[] => {
  const byTs = new Map<number, TimeRow>();
  numericSeries(data, keys).forEach(({ key, points }) => points.forEach((p) => {
    const t = Number(p.x);
    const row = byTs.get(t) ?? ({ t } as TimeRow);
    row[key] = p.y;
    byTs.set(t, row);
  }));
  return [...byTs.values()].sort((a, b) => a.t - b.t);
};

/** Bar data: each chosen key averaged over `count` equal time slices of the
 *  shared time span, oldest first. Slices no key reported in are dropped. */
export const toBucketRows = (data: Record<string, EntityFieldItem[]> | undefined, keys: string[], count = 8): TimeRow[] => {
  const series = numericSeries(data, keys);
  const all = series.flatMap((s) => s.points.map((p) => Number(p.x)));
  if (!all.length) return [];
  const t0 = Math.min(...all);
  const span = Math.max(...all) - t0 || 1;
  const slices = Array.from({ length: count }, (_, i) => ({ t: t0 + (span * i) / count, sums: {} as Record<string, { sum: number; n: number }> }));
  series.forEach(({ key, points }) => points.forEach((p) => {
    const slice = slices[Math.min(count - 1, Math.floor(((Number(p.x) - t0) / span) * count))];
    const acc = (slice.sums[key] ??= { sum: 0, n: 0 });
    acc.sum += p.y;
    acc.n += 1;
  }));
  return slices.flatMap(({ t, sums }) => {
    const entries = Object.entries(sums);
    if (!entries.length) return [];
    const row = { t } as TimeRow;
    entries.forEach(([k, { sum, n }]) => { row[k] = round(sum / n); });
    return [row];
  });
};

/** Table data: the latest readings of the chosen keys, merged on timestamp,
 *  newest first. Values are shown as sent, so non-numeric ones appear too. */
export const toReadingsTable = (
  data: Record<string, EntityFieldItem[]> | undefined,
  keys: string[],
  timeLabel: string,
  limit = 50,
): TableData => {
  const byTs = new Map<number, Record<string, string>>();
  keys.forEach((k) => (data?.[k] ?? []).forEach((p) => {
    const ts = Number(p.ts);
    byTs.set(ts, { ...byTs.get(ts), [k]: p.value });
  }));
  const rows = [...byTs.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([ts, values]) => [fmtDateTime(ts), ...keys.map((k) => values[k] ?? "—")]);
  return { columns: [timeLabel, ...keys], rows };
};

type FieldsPatch = { deviceId?: string; telemetryKey?: string; telemetryKeys?: string[] };

interface FieldsProps {
  deviceId?: string;
  telemetryKey?: string;
  telemetryKeys?: string[];
  /** Pick several telemetry keys (checkboxes) instead of one, e.g. for tables. */
  multiple?: boolean;
  /** How many keys `multiple` pre-selects for a newly chosen device. */
  defaultCount?: number;
  hours: number;
  tt: (key: string) => string;
  onChange: (patch: FieldsPatch) => void;
}

/** Device + telemetry-key pickers for a widget bound to the Devices source. */
export function DeviceSourceFields({ deviceId, telemetryKey, telemetryKeys, multiple, defaultCount = 1, hours, tt, onChange }: FieldsProps) {
  const { items: devices, isLoading: devicesLoading } = useDevices();
  const { data, isLoading: keysLoading } = useDeviceTelemetry(deviceId, hours);
  const keys = useMemo(() => Object.keys(data ?? {}).sort(), [data]);

  // Pick the first key(s) once a newly chosen device's telemetry arrives, so
  // the widget isn't left blank. Keys the user already chose are never replaced.
  useEffect(() => {
    if (!deviceId || !keys.length) return;
    if (multiple && !telemetryKeys) onChange({ telemetryKeys: keys.slice(0, defaultCount) });
    if (!multiple && !telemetryKey) onChange({ telemetryKey: keys[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, telemetryKey, telemetryKeys, multiple, keys]);

  const keysPlaceholder = !deviceId ? tt("selectDevice") : keysLoading ? tt("loading") : keys.length === 0 ? tt("noTelemetry") : tt("telemetryKey");

  return (
    <>
      <div>
        <Label className="text-sm">{tt("device")}</Label>
        <Select
          value={deviceId ?? ""}
          onValueChange={(v) => onChange({ deviceId: v, telemetryKey: undefined, telemetryKeys: undefined })}
          disabled={devicesLoading || devices.length === 0}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue
              placeholder={devicesLoading ? tt("loading") : devices.length === 0 ? tt("noDevices") : tt("selectDevice")}
            />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.label || d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {multiple ? (
        <div>
          <Label className="text-sm">{tt("telemetryKey")}</Label>
          <div className="mt-2 space-y-1.5 border border-border rounded-md p-2">
            {keys.length === 0 || keysLoading ? (
              <p className="text-sm text-muted-foreground">{keysPlaceholder}</p>
            ) : (
              keys.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!telemetryKeys?.includes(k)}
                    onChange={(e) => {
                      const cur = new Set(telemetryKeys || []);
                      if (e.target.checked) cur.add(k); else cur.delete(k);
                      onChange({ telemetryKeys: keys.filter((x) => cur.has(x)) });
                    }}
                  />
                  {k}
                </label>
              ))
            )}
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-sm">{tt("telemetryKey")}</Label>
          <Select
            value={telemetryKey ?? ""}
            onValueChange={(v) => onChange({ telemetryKey: v })}
            disabled={!deviceId || keysLoading || keys.length === 0}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={keysPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
