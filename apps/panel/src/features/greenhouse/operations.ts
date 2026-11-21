import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  deviceService,
  telemetryService,
  useGetWorkspaceAlarmsQueries,
  workOrderService,
  type DeviceResponse,
  type Greenhouse,
  type WorkOrderResponse,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { currentProductKey } from "@/features/factory/lib/product";
import { needsAttention } from "@/shared/lib/alarmStatus";
import { useGreenhouseWorkspace } from "./hooks";

/* What is happening in each greenhouse, read from the platform's own device,
   alarm, work-order and telemetry services: a device belongs to a greenhouse
   when it is placed on the greenhouse, one of its zones or one of their beds.
   Nothing here is stored or made up; what the services do not know is
   reported as unknown. */

const PAGE = 100;

async function allDevices(workspaceId: string): Promise<DeviceResponse[]> {
  const devices: DeviceResponse[] = [];
  for (let page = 0; page < 50; page++) {
    const res = await deviceService.getTenantDevices(workspaceId, currentProductKey(), page, PAGE);
    devices.push(...res.data);
    if (!res.hasNext) break;
  }
  return devices;
}

export function useProductDevices() {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: ["greenhouse", workspaceId, currentProductKey(), "devices"],
    queryFn: () => allDevices(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 60_000,
  });
}

export function useProductAlarms() {
  const { workspaceId } = useGreenhouseWorkspace();
  const [query] = useGetWorkspaceAlarmsQueries(workspaceId, [currentProductKey()], !!workspaceId);
  return query;
}

/** Work that is still in hand: open, in progress or on hold. */
export function useOpenWorkOrders() {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: ["workOrders", workspaceId, currentProductKey(), "greenhouse-open"],
    queryFn: async () =>
      (await workOrderService.list(workspaceId, currentProductKey(), { status: ["OPEN", "IN_PROGRESS", "ON_HOLD"] }, 1, PAGE)).data,
    enabled: !!workspaceId,
  });
}

export interface GreenhouseOps {
  devices: DeviceResponse[];
  online: number;
  /** Alarms nobody has acknowledged or cleared yet. */
  alarms: WorkspaceAlarmItem[];
  workOrders: WorkOrderResponse[];
  /** Devices by the zone (or bed's zone) they sit in; the greenhouse's own under its id. */
  devicesByPlace: Map<string, DeviceResponse[]>;
}

/** Which greenhouse, and which zone in it, each location id belongs to. */
function placeIndex(houses: Greenhouse[]) {
  const index = new Map<string, { house: string; zone: string }>();
  houses.forEach((house) => {
    index.set(house.id, { house: house.id, zone: house.id });
    house.zones.forEach((zone) => {
      index.set(zone.id, { house: house.id, zone: zone.id });
      zone.beds.forEach((bed) => index.set(bed.id, { house: house.id, zone: zone.id }));
    });
  });
  return index;
}

/**
 * Each greenhouse's devices, how many are online, its alarms and its open work
 * orders. `known` is false until the services have answered, so a card can
 * say "unknown" rather than "0".
 */
export function useGreenhouseOps(houses: Greenhouse[]) {
  const devices = useProductDevices();
  const alarms = useProductAlarms();
  const workOrders = useOpenWorkOrders();

  const byHouse = useMemo(() => {
    const index = placeIndex(houses);
    const deviceHouse = new Map<string, string>();
    const result = new Map<string, GreenhouseOps>();
    houses.forEach((h) => result.set(h.id, { devices: [], online: 0, alarms: [], workOrders: [], devicesByPlace: new Map() }));
    (devices.data ?? []).forEach((device) => {
      const place = index.get(device.assetId);
      if (!place) return;
      const ops = result.get(place.house)!;
      ops.devices.push(device);
      if (device.active) ops.online++;
      ops.devicesByPlace.set(place.zone, [...(ops.devicesByPlace.get(place.zone) ?? []), device]);
      deviceHouse.set(device.id, place.house);
    });
    (alarms.data ?? []).forEach((alarm) => {
      if (!needsAttention(alarm.status)) return;
      const house = (alarm.assetId && index.get(alarm.assetId)?.house) || deviceHouse.get(alarm.deviceId);
      if (house) result.get(house)!.alarms.push(alarm);
    });
    (workOrders.data ?? []).forEach((order) => {
      const house = (order.assetId && index.get(order.assetId)?.house) || (order.deviceId && deviceHouse.get(order.deviceId));
      if (house) result.get(house)!.workOrders.push(order);
    });
    return result;
  }, [houses, devices.data, alarms.data, workOrders.data]);

  return {
    byHouse,
    devicesKnown: !!devices.data,
    alarmsKnown: !!alarms.data,
    workOrdersKnown: !!workOrders.data,
  };
}

/* ---- Environment ------------------------------------------------------- */

export type EnvMetric = "TEMPERATURE" | "HUMIDITY" | "SUBSTRATE_MOISTURE" | "CO2" | "VPD";

/** Which telemetry key a reading of each measurement goes by; devices name them their own way. */
const MATCHERS: [EnvMetric, RegExp, RegExp?][] = [
  ["SUBSTRATE_MOISTURE", /(moist|vwc|(soil|substrate|media).*(hum|water)|(hum|water).*(soil|substrate|media))/i],
  ["CO2", /co2/i],
  ["VPD", /vpd/i],
  ["TEMPERATURE", /temp/i, /(soil|substrate|water|leaf|media|cpu|board)/i],
  ["HUMIDITY", /(hum|rh$|^rh)/i, /(soil|substrate|media)/i],
];

export function metricOfKey(key: string): EnvMetric | null {
  for (const [metric, include, exclude] of MATCHERS) {
    if (include.test(key) && !(exclude && exclude.test(key))) return metric;
  }
  return null;
}

/** A reading counts as current for this long; older ones are shown as stale. */
export const FRESH_MS = 30 * 60 * 1000;
/** Devices read per greenhouse, so a large house does not flood the server. */
const MAX_DEVICES = 12;

export interface Reading {
  deviceId: string;
  metric: EnvMetric;
  value: number;
  ts: number;
}

/** The latest environmental readings of these devices, one per device and measurement. */
export function useEnvironment(devices: DeviceResponse[], enabled = true) {
  const { workspaceId } = useGreenhouseWorkspace();
  const watched = devices.slice(0, MAX_DEVICES);
  const queries = useQueries({
    queries: watched.map((device) => ({
      queryKey: ["greenhouse", workspaceId, currentProductKey(), "env", device.id],
      queryFn: async (): Promise<Reading[]> => {
        const keys = (await telemetryService.getKeys(workspaceId, currentProductKey(), device.id)).filter((k) => metricOfKey(k));
        if (!keys.length) return [];
        const latest = await telemetryService.getLatest(workspaceId, currentProductKey(), device.id, keys);
        const readings: Reading[] = [];
        const seen = new Set<EnvMetric>();
        keys.forEach((key) => {
          const metric = metricOfKey(key)!;
          const point = latest[key]?.[0];
          const value = point ? Number(point.value) : NaN;
          if (!point || !Number.isFinite(value) || seen.has(metric)) return;
          seen.add(metric);
          readings.push({ deviceId: device.id, metric, value, ts: point.ts });
        });
        return readings;
      },
      enabled: enabled && !!workspaceId,
      staleTime: 60_000,
      refetchInterval: 120_000,
      retry: false,
    })),
  });
  const readings = queries.flatMap((q) => q.data ?? []);
  const loading = queries.some((q) => q.isLoading);
  return { readings, loading, partial: devices.length > MAX_DEVICES };
}

export interface MetricSummary {
  min: number;
  max: number;
  devices: number;
  /** The newest reading's time. */
  latest: number;
  /** No reading of it is recent enough to trust. */
  stale: boolean;
}

/** Per measurement: the range across devices (not an average), and how fresh it is. */
export function summarize(readings: Reading[], now = Date.now()): Partial<Record<EnvMetric, MetricSummary>> {
  const out: Partial<Record<EnvMetric, MetricSummary>> = {};
  readings.forEach((r) => {
    const fresh = now - r.ts <= FRESH_MS;
    const cur = out[r.metric];
    if (!cur) {
      out[r.metric] = { min: r.value, max: r.value, devices: 1, latest: r.ts, stale: !fresh };
      return;
    }
    // Fresh readings win over stale ones; stale ones only count when nothing is fresh.
    if (cur.stale && fresh) {
      out[r.metric] = { min: r.value, max: r.value, devices: 1, latest: r.ts, stale: false };
    } else if (cur.stale === !fresh) {
      cur.min = Math.min(cur.min, r.value);
      cur.max = Math.max(cur.max, r.value);
      cur.devices++;
      cur.latest = Math.max(cur.latest, r.ts);
    }
  });
  return out;
}
