import { useEffect, useMemo } from "react";
import { useGetDeviceTimeSeriesQuery, type EntityFieldItem } from "@paapeli/api";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { currentProductKey } from "@/features/factory/lib/product";
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

/** The data source that reads an energy meter's telemetry (see EnergySource). */
export const ENERGY_SOURCE_ID = "energy";

/** The data source whose widgets count the workspace's alarms. */
export const ALERTS_SOURCE_ID = "alerts";

/** Widget kinds that can show alarm counts — all but text. */
export const ALERTS_WIDGET_KINDS: WidgetKind[] = ["kpi", "line", "bar", "donut", "table"];

export const isAlertsWidget = (kind: WidgetKind, sourceId?: string) =>
  sourceId === ALERTS_SOURCE_ID && ALERTS_WIDGET_KINDS.includes(kind);

/** The data sources a widget of this kind can be bound to. Only Devices,
 *  Energy and Alerts read real data — the rest of DATA_SOURCES is generated
 *  mock data, so it is not offered. Devices and Energy read one device's
 *  telemetry, which a donut can't show; Alerts can feed every chart kind. */
export const sourcesForKind = (kind: WidgetKind) =>
  DATA_SOURCES.filter((d) =>
    ((d.id === DEVICES_SOURCE_ID || d.id === ENERGY_SOURCE_ID) && DEVICE_WIDGET_KINDS.includes(kind)) ||
    (d.id === ALERTS_SOURCE_ID && ALERTS_WIDGET_KINDS.includes(kind)));

/* The history endpoint takes a lookback in hours and clamps it to 1–24, so
   any dashboard range longer than a day shows the last 24 hours, and ranges
   under an hour fetch the hour and are cut down with sliceTelemetry(). */
export const rangeToHours = (range: string) => (range === "1h" || range === "15m" ? 1 : 24);

type Telemetry = Record<string, EntityFieldItem[]>;

/** Only the readings from `since` to `until` (ms), inclusive. */
export const sliceTelemetry = (data: Telemetry | undefined, since: number, until = Infinity): Telemetry | undefined =>
  data && Object.fromEntries(Object.entries(data).map(([k, points]) => [k, points.filter((p) => Number(p.ts) >= since && Number(p.ts) <= until)]));

/** The stretches of [start, end] with no reading: before the first one, after
 *  the last one, and between readings much further apart than the device's
 *  usual spacing. Short pauses are not reported. */
export const noDataSpans = (times: number[], start: number, end: number): [number, number][] => {
  if (!times.length) return [[start, end]];
  const sorted = [...times].sort((a, b) => a - b);
  const steps = sorted.slice(1).map((t, i) => t - sorted[i]).sort((a, b) => a - b);
  const typicalStep = steps.length ? steps[Math.floor(steps.length / 2)] : 0;
  const threshold = Math.max(3 * typicalStep, (end - start) * 0.02, 60_000);
  const spans: [number, number][] = [];
  if (sorted[0] - start > threshold) spans.push([start, sorted[0]]);
  sorted.slice(1).forEach((t, i) => { if (t - sorted[i] > threshold) spans.push([sorted[i], t]); });
  const last = sorted[sorted.length - 1];
  if (end - last > threshold) spans.push([last, end]);
  return spans;
};

/** A device's recent telemetry, keyed by telemetry name. */
export const useDeviceTelemetry = (deviceId: string | undefined, hours: number) => {
  const workspaceId = useWorkspaceId();
  return useGetDeviceTimeSeriesQuery(workspaceId ?? "", currentProductKey(), deviceId ?? "", hours);
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

/* Date parts of an instant in an IANA time zone (undefined = the browser's).
   Formatters are cached per zone: charts and tables format many timestamps. */
const partFormatters = new Map<string, Intl.DateTimeFormat>();
const partsIn = (ms: number, timeZone?: string) => {
  const cacheKey = timeZone ?? "";
  let fmt = partFormatters.get(cacheKey);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    partFormatters.set(cacheKey, fmt);
  }
  const parts = fmt.formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
};

export const fmtDateTime = (ms: number, timeZone?: string) => {
  const p = partsIn(ms, timeZone);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};

/** Month, day and clock time, e.g. "09/14 17:53". */
export const fmtDayTime = (ms: number, timeZone?: string) => {
  const p = partsIn(ms, timeZone);
  return `${p.month}/${p.day} ${p.hour}:${p.minute}`;
};

/** A time-axis tick: clock time within a day and a half, the date beyond. */
export const fmtTimeTick = (spanMs: number, timeZone?: string) => (ms: number) => {
  const p = partsIn(ms, timeZone);
  return spanMs <= 36 * 3_600_000 ? `${p.hour}:${p.minute}` : `${p.month}/${p.day}`;
};

/** A zone's current UTC offset for labels, e.g. "UTC", "UTC+3:30". */
export const utcOffsetLabel = (timeZone: string) => {
  const name = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  return name.replace(/^GMT/, "UTC").replace(/[+-]0$/, "");
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
 *  window [start, end], oldest first. Slices nothing reported in stay as empty
 *  rows, so the axis still runs to `end` and silence shows as missing bars.
 *  Empty when there is no reading at all. */
export const toBucketRows = (
  data: Record<string, EntityFieldItem[]> | undefined,
  keys: string[],
  start: number,
  end: number,
  count = 12,
): TimeRow[] => {
  const series = numericSeries(data, keys);
  if (!series.length) return [];
  const span = end - start || 1;
  const slices = Array.from({ length: count }, (_, i) => ({ t: start + (span * i) / count, sums: {} as Record<string, { sum: number; n: number }> }));
  series.forEach(({ key, points }) => points.forEach((p) => {
    const i = Math.floor(((Number(p.x) - start) / span) * count);
    if (i < 0 || i >= count + 1) return;
    const slice = slices[Math.min(count - 1, i)];
    const acc = (slice.sums[key] ??= { sum: 0, n: 0 });
    acc.sum += p.y;
    acc.n += 1;
  }));
  return slices.map(({ t, sums }) => {
    const row = { t } as TimeRow;
    Object.entries(sums).forEach(([k, { sum, n }]) => { row[k] = round(sum / n); });
    return row;
  });
};

/** Table data: the latest readings of the chosen keys, merged on timestamp,
 *  newest first. Values are shown as sent, so non-numeric ones appear too. */
export const toReadingsTable = (
  data: Record<string, EntityFieldItem[]> | undefined,
  keys: string[],
  timeLabel: string,
  timeZone?: string,
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
    .map(([ts, values]) => [fmtDateTime(ts, timeZone), ...keys.map((k) => values[k] ?? "—")]);
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
