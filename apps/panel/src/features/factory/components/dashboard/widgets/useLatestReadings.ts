import { useQueries } from "@tanstack/react-query";
import { telemetryService, type DashboardDataSource, type DashboardWidget } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

/**
 * The latest value of each of a widget's device bindings, in binding order,
 * read one request per device. `refreshedAt` is the window's end, which moves
 * on every dashboard refresh; keying on it re-reads then.
 */
export function useLatestReadings(
  widget: DashboardWidget,
  dataSources: Record<string, DashboardDataSource>,
  refreshedAt: number,
) {
  const workspaceId = useWorkspaceId() ?? "";
  const byDevice = new Map<string, string[]>();
  const deviceOf = (item: DashboardWidget["data"][number]) => {
    const source = dataSources[item.source];
    return source?.type === "device" && item.key ? source.deviceId : "";
  };
  widget.data.forEach((item) => {
    const deviceId = deviceOf(item);
    if (deviceId) byDevice.set(deviceId, [...new Set([...(byDevice.get(deviceId) ?? []), item.key as string])]);
  });
  const devices = [...byDevice.entries()].map(([deviceId, keys]) => ({ deviceId, keys: [...keys].sort() }));

  const results = useQueries({
    queries: devices.map(({ deviceId, keys }) => ({
      queryKey: ["latestReadings", workspaceId, PRODUCT_KEY, deviceId, keys.join(","), refreshedAt],
      queryFn: () => telemetryService.getLatest(workspaceId, PRODUCT_KEY, deviceId, keys),
      enabled: !!workspaceId,
      // Keep the last values on screen while they refresh.
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: Record<string, Array<{ value?: unknown }>>; isLoading: boolean; isError: boolean; error: unknown }>;

  const latestOf = new Map(devices.map((d, i) => [d.deviceId, results[i]?.data]));
  return {
    values: widget.data.map((item) => latestOf.get(deviceOf(item))?.[item.key as string]?.[0]?.value),
    bound: devices.length > 0,
    loading: results.some((r) => r.isLoading),
    failed: results.length > 0 && results.every((r) => r.isError),
    error: results.find((r) => r.isError)?.error,
  };
}
