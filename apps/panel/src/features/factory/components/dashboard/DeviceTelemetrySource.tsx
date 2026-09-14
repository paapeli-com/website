import { useEffect, useMemo } from "react";
import { useGetDeviceTimeSeriesQuery, type EntityFieldItem } from "@paapeli/api";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import {
  DATA_SOURCES,
  type BreakdownItem, type SeriesPoint, type TableData, type WidgetKind,
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
const fmtDateTime = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm(ms)}:${pad(d.getSeconds())}`;
};

/** A KPI from one series: the latest reading and its change since the first. */
export const toKPI = (series: SeriesPoint[]) => {
  const first = series[0].y;
  const last = series[series.length - 1].y;
  const change = first === 0 ? 0 : Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
  return { value: round(last), change };
};

/** Bar data: the average of a series over `count` equal time slices, oldest
 *  first, labelled by each slice's start time. Empty slices are dropped. */
export const toTimeBuckets = (series: SeriesPoint[], count = 8): BreakdownItem[] => {
  if (!series.length) return [];
  const t0 = Number(series[0].x);
  const span = Number(series[series.length - 1].x) - t0 || 1;
  const slices = Array.from({ length: count }, () => ({ sum: 0, n: 0 }));
  series.forEach((p) => {
    const s = slices[Math.min(count - 1, Math.floor(((Number(p.x) - t0) / span) * count))];
    s.sum += p.y;
    s.n += 1;
  });
  return slices.flatMap((s, i) => (s.n ? [{ label: hhmm(t0 + (span * i) / count), value: round(s.sum / s.n) }] : []));
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
  hours: number;
  tt: (key: string) => string;
  onChange: (patch: FieldsPatch) => void;
}

/** Device + telemetry-key pickers for a widget bound to the Devices source. */
export function DeviceSourceFields({ deviceId, telemetryKey, telemetryKeys, multiple, hours, tt, onChange }: FieldsProps) {
  const { items: devices, isLoading: devicesLoading } = useDevices();
  const { data, isLoading: keysLoading } = useDeviceTelemetry(deviceId, hours);
  const keys = useMemo(() => Object.keys(data ?? {}).sort(), [data]);

  // Pick the first key(s) once a newly chosen device's telemetry arrives, so
  // the widget isn't left blank. Keys the user already chose are never replaced.
  useEffect(() => {
    if (!deviceId || !keys.length) return;
    if (multiple && !telemetryKeys) onChange({ telemetryKeys: keys.slice(0, 3) });
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
