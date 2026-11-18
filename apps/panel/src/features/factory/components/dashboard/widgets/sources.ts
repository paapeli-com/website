import { useQueries } from "@tanstack/react-query";
import {
  alarmService,
  queryDevices,
  telemetryService,
  type AlarmQueryDataSource,
  type DashboardDataSource,
  type DashboardWidget,
  type DeviceQueryDataSource,
  type FormulaDataSource,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";

/* How the widgets resolve the data sources that are not a single device. The
   gateway validates these sources and leaves reading them to the client. */

const PAGE_SIZE = 100;
/** The alarm list pages but does not filter, so the client reads this far and filters. */
const MAX_ALARM_PAGES = 5;
/** A device query is read this far; a table of more devices than this needs a narrower query. */
const MAX_DEVICE_PAGES = 5;

/** The alarms an alarmQuery matches, newest first, among the most recent 500. */
export async function matchAlarms(workspaceId: string, source: AlarmQueryDataSource): Promise<WorkspaceAlarmItem[]> {
  const all: WorkspaceAlarmItem[] = [];
  for (let page = 1; page <= MAX_ALARM_PAGES; page++) {
    const res = await alarmService.getWorkspaceAlarms(workspaceId, currentProductKey(), page, PAGE_SIZE);
    all.push(...res.data);
    if (!res.hasNext) break;
  }
  const severities = source.severities?.length ? new Set<string>(source.severities) : null;
  const statuses = source.statuses?.length ? new Set<string>(source.statuses) : null;
  return all
    .filter(
      (a) =>
        (!severities || severities.has(a.severity)) &&
        (!statuses || statuses.has(a.status)) &&
        (!source.deviceId || a.deviceId === source.deviceId),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** A formula's value: its operation over the inputs that have a numeric latest value, or null with none. */
export async function evaluateFormula(workspaceId: string, source: FormulaDataSource): Promise<number | null> {
  const byDevice = new Map<string, string[]>();
  source.inputs.forEach((i) => byDevice.set(i.deviceId, [...(byDevice.get(i.deviceId) ?? []), i.key]));
  const latest = new Map(
    await Promise.all(
      [...byDevice.entries()].map(
        async ([deviceId, keys]) => [deviceId, await telemetryService.getLatest(workspaceId, currentProductKey(), deviceId, keys)] as const,
      ),
    ),
  );
  const values = source.inputs
    .map((i) => toNumber(latest.get(i.deviceId)?.[i.key]?.[0]?.value))
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  switch (source.operation) {
    case "SUM": return values.reduce((a, b) => a + b, 0);
    case "AVG": return values.reduce((a, b) => a + b, 0) / values.length;
    case "MIN": return Math.min(...values);
    case "MAX": return Math.max(...values);
  }
}

export interface BoundDevice {
  id: string;
  name: string;
  active: boolean;
}

async function devicesOfQuery(workspaceId: string, source: DeviceQueryDataSource): Promise<BoundDevice[]> {
  const { type: _type, ...filters } = source;
  const out: BoundDevice[] = [];
  for (let page = 1; page <= MAX_DEVICE_PAGES; page++) {
    const res = await queryDevices(workspaceId, currentProductKey(), filters, page, PAGE_SIZE);
    out.push(...res.data.map((d) => ({ id: d.deviceId, name: d.label || d.name, active: d.active === true })));
    if (!res.hasNext) break;
  }
  return out;
}

/**
 * Every device a widget's bindings reach: the ones bound one by one, and the
 * ones its deviceQuery sources match (a type, optionally under a location).
 * Each device appears once, in binding order.
 */
export function useBoundDevices(
  widget: DashboardWidget,
  dataSources: Record<string, DashboardDataSource>,
  refreshedAt: number,
): { devices: BoundDevice[]; loading: boolean; bound: boolean } {
  const workspaceId = useWorkspaceId() ?? "";
  const { items } = useDevices();
  const aliases = [...new Set(widget.data.map((d) => d.source))].filter((a) => dataSources[a]);
  const queryAliases = aliases.filter((a) => dataSources[a].type === "deviceQuery");

  const results = useQueries({
    queries: queryAliases.map((alias) => ({
      queryKey: ["deviceQuery", workspaceId, currentProductKey(), dataSources[alias], refreshedAt],
      queryFn: () => devicesOfQuery(workspaceId, dataSources[alias] as DeviceQueryDataSource),
      enabled: !!workspaceId,
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: BoundDevice[]; isLoading: boolean }>;

  const known = new Map(items.map((d) => [d.id, d]));
  const seen = new Map<string, BoundDevice>();
  aliases.forEach((alias) => {
    const source = dataSources[alias];
    if (source.type === "device") {
      const d = known.get(source.deviceId);
      if (!seen.has(source.deviceId)) {
        seen.set(source.deviceId, { id: source.deviceId, name: d?.label || d?.name || source.deviceId, active: d?.active === true });
      }
    } else if (source.type === "deviceQuery") {
      (results[queryAliases.indexOf(alias)]?.data ?? []).forEach((d) => !seen.has(d.id) && seen.set(d.id, d));
    }
  });

  return {
    devices: [...seen.values()],
    loading: results.some((r) => r.isLoading),
    bound: aliases.some((a) => dataSources[a].type === "device" || dataSources[a].type === "deviceQuery"),
  };
}
