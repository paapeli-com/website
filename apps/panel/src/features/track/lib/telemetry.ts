import type { DeviceTimeSeriesResponse, EntityFieldItem } from "@paapeli/api";
import type { TrackPoint } from "@/features/track/data/types";

/* Reading a tracker's telemetry (GET /timeseries/.../history/{deviceId}).
 *
 * The endpoint returns whatever keys the device reported, each as points in
 * ascending ts order. Nothing in the API fixes which key a tracker uses for
 * its position or battery, so each reading below accepts the common spellings
 * and takes the first one present. A tracker using some other name still
 * shows up in full on the Telemetry tab — only these summaries miss it. */

const LAT_KEYS = ["latitude", "lat"];
const LNG_KEYS = ["longitude", "lng", "lon", "long"];
const BATTERY_KEYS = ["battery", "batteryLevel", "battery_level", "bat"];
const SPEED_KEYS = ["speed", "speedKmh", "speed_kmh"];

/** Lookback window, in hours — the endpoint clamps it to 1–24. */
export const TELEMETRY_HOURS = 24;

export type TelemetryRow = { key: string; value: string; ts: number };

const seriesFor = (data: DeviceTimeSeriesResponse, keys: string[]): EntityFieldItem[] | undefined => {
  for (const k of keys) if (data[k]?.length) return data[k];
  return undefined;
};

const toNumber = (v: string): number | null => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

/** Every key's newest value, most recently updated first. */
export function latestRows(data: DeviceTimeSeriesResponse | undefined): TelemetryRow[] {
  return Object.entries(data ?? {})
    .flatMap(([key, points]) => {
      const last = points[points.length - 1];
      return last ? [{ key, value: last.value, ts: last.ts }] : [];
    })
    .sort((a, b) => b.ts - a.ts);
}

/** The newest numeric reading under any of `keys`. */
function latestNumber(data: DeviceTimeSeriesResponse | undefined, keys: string[]) {
  const series = data && seriesFor(data, keys);
  for (let i = (series?.length ?? 0) - 1; i >= 0; i--) {
    const n = toNumber(series![i].value);
    if (n !== null) return { value: n, ts: series![i].ts };
  }
  return null;
}

export const latestBattery = (data?: DeviceTimeSeriesResponse) => latestNumber(data, BATTERY_KEYS);
export const latestSpeed = (data?: DeviceTimeSeriesResponse) => latestNumber(data, SPEED_KEYS);

/** Position fixes, oldest first — latitude and longitude paired on timestamp.
    A 0,0 fix is what many trackers report with no GPS lock, so it is dropped. */
export function positionTrail(data: DeviceTimeSeriesResponse | undefined): TrackPoint[] {
  const lat = data && seriesFor(data, LAT_KEYS);
  const lng = data && seriesFor(data, LNG_KEYS);
  if (!lat || !lng) return [];
  const lngAt = new Map(lng.map((p) => [p.ts, toNumber(p.value)]));
  return lat.flatMap((p) => {
    const la = toNumber(p.value);
    const lo = lngAt.get(p.ts);
    if (la === null || lo == null) return [];
    if (Math.abs(la) > 90 || Math.abs(lo) > 180 || (la === 0 && lo === 0)) return [];
    return [{ lat: la, lng: lo, at: new Date(p.ts).toISOString() }];
  });
}
