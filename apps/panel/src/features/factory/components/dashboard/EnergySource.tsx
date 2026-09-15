import type { SeriesPoint, WidgetKind } from "@/features/factory/lib/dashboardData";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import { DeviceSourceFields, ENERGY_SOURCE_ID, type TimeRow } from "./DeviceTelemetrySource";

/* The Energy data source reads a real meter: one device and one of its
   telemetry keys. The API has no energy, tariff or emission endpoints, so
   consumption and peak demand are derived here from the raw readings, and
   cost and CO₂ from a price and an emission factor set on the widget. */

/** Widget kinds that can show a meter. A donut would need several meters to
 *  split, so the Energy source isn't offered for it. */
export const ENERGY_WIDGET_KINDS: WidgetKind[] = ["kpi", "line", "bar", "table"];

export const isEnergyWidget = (kind: WidgetKind, sourceId?: string) =>
  sourceId === ENERGY_SOURCE_ID && ENERGY_WIDGET_KINDS.includes(kind);

/** What the telemetry key holds: a running energy counter, or instantaneous power. */
export type EnergyReading = "kwh" | "wh" | "kw" | "w";

export const ENERGY_READINGS: { v: EnergyReading; k: string }[] = [
  { v: "kwh", k: "readingKwh" },
  { v: "wh", k: "readingWh" },
  { v: "kw", k: "readingKw" },
  { v: "w", k: "readingW" },
];

/** The metric keys of the Energy source in dashboardData. */
export type EnergyMetric = "kwh" | "cost" | "peak" | "co2";

export interface EnergySettings {
  /** Price of one kWh, in `currency`. */
  tariff?: number;
  /** Kilograms of CO₂ per kWh. */
  co2Factor?: number;
}

/** Energy used between two consecutive readings, and the power over that gap. */
interface EnergyInterval {
  to: number;
  kwh: number;
  kw: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** The energy used between consecutive readings, oldest first. A counter
 *  counts its increase; a drop means it was reset, so the new reading is all
 *  that has been counted since. Power is integrated reading to reading, and a
 *  gap much longer than the meter's usual spacing is skipped, since the power
 *  during it is unknown. */
export const toEnergyIntervals = (series: SeriesPoint[], reading: EnergyReading): EnergyInterval[] => {
  const scale = reading === "wh" || reading === "w" ? 0.001 : 1;
  const counter = reading === "kwh" || reading === "wh";
  const points = series.map((p) => ({ t: Number(p.x), v: p.y * scale }));
  const steps = points.slice(1).map((p, i) => p.t - points[i].t).sort((a, b) => a - b);
  const typicalStep = steps.length ? steps[Math.floor(steps.length / 2)] : 0;
  const maxGap = Math.max(3 * typicalStep, 5 * 60_000);

  const intervals: EnergyInterval[] = [];
  points.slice(1).forEach((cur, i) => {
    const prev = points[i];
    const hours = (cur.t - prev.t) / 3_600_000;
    if (hours <= 0) return;
    if (counter) {
      const kwh = cur.v >= prev.v ? cur.v - prev.v : cur.v;
      intervals.push({ to: cur.t, kwh, kw: kwh / hours });
    } else if (cur.t - prev.t <= maxGap) {
      intervals.push({ to: cur.t, kwh: ((prev.v + cur.v) / 2) * hours, kw: Math.max(prev.v, cur.v) });
    }
  });
  return intervals;
};

/** The translation key of the setting a metric still needs, if any. */
export const missingEnergySetting = (metric: string, s: EnergySettings) =>
  metric === "cost" && !s.tariff ? "needTariff" : metric === "co2" && !s.co2Factor ? "needCo2" : null;

/** One metric over a set of intervals: consumption, cost and CO₂ add up, peak
 *  demand is the highest power. Undefined when there is nothing to measure or
 *  a needed setting is missing. */
export const energyMetric = (intervals: EnergyInterval[], metric: string, s: EnergySettings): number | undefined => {
  if (!intervals.length || missingEnergySetting(metric, s)) return undefined;
  const kwh = intervals.reduce((sum, iv) => sum + iv.kwh, 0);
  if (metric === "peak") return round(Math.max(...intervals.map((iv) => iv.kw)));
  if (metric === "cost") return round(kwh * s.tariff!);
  if (metric === "co2") return round(kwh * s.co2Factor!);
  return round(kwh);
};

/** The chosen metrics over `count` equal slices of [start, end], oldest first.
 *  Each interval counts in the slice it ends in; a slice with none stays an
 *  empty row, so the time axis still covers the whole window. */
export const energyBucketRows = (
  intervals: EnergyInterval[],
  metrics: string[],
  s: EnergySettings,
  start: number,
  end: number,
  count: number,
): TimeRow[] => {
  const span = end - start || 1;
  const slices = Array.from({ length: count }, () => [] as EnergyInterval[]);
  intervals.forEach((iv) => {
    const i = Math.floor(((iv.to - start) / span) * count);
    if (i >= 0 && i <= count) slices[Math.min(count - 1, i)].push(iv);
  });
  return slices.map((slice, i) => {
    const row = { t: start + (span * i) / count } as TimeRow;
    metrics.forEach((m) => {
      const value = energyMetric(slice, m, s);
      if (value !== undefined) row[m] = value;
    });
    return row;
  });
};

type EnergyPatch = {
  deviceId?: string;
  telemetryKey?: string;
  energyReading?: EnergyReading;
  tariff?: number;
  currency?: string;
  co2Factor?: number;
};

interface EnergyFieldsProps extends EnergySettings {
  deviceId?: string;
  telemetryKey?: string;
  energyReading?: EnergyReading;
  currency?: string;
  hours: number;
  tt: (key: string) => string;
  onChange: (patch: EnergyPatch) => void;
}

const toOptionalNumber = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Meter, reading type, price and emission factor for a widget on the Energy source. */
export function EnergySourceFields({ deviceId, telemetryKey, energyReading, tariff, currency, co2Factor, hours, tt, onChange }: EnergyFieldsProps) {
  return (
    <>
      <DeviceSourceFields deviceId={deviceId} telemetryKey={telemetryKey} hours={hours} tt={tt} onChange={onChange} />

      <div>
        <Label className="text-sm">{tt("energyReading")}</Label>
        <Select value={energyReading ?? "kwh"} onValueChange={(v) => onChange({ energyReading: v as EnergyReading })}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENERGY_READINGS.map((r) => <SelectItem key={r.v} value={r.v}>{tt(r.k)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">{tt("tariff")}</Label>
          <Input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={tariff ?? ""}
            onChange={(e) => onChange({ tariff: toOptionalNumber(e.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-sm">{tt("currency")}</Label>
          <Input
            value={currency ?? ""}
            maxLength={8}
            placeholder="$"
            onChange={(e) => onChange({ currency: e.target.value || undefined })}
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm">{tt("co2Factor")}</Label>
        <Input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={co2Factor ?? ""}
          onChange={(e) => onChange({ co2Factor: toOptionalNumber(e.target.value) })}
          className="mt-1.5"
        />
      </div>
    </>
  );
}
