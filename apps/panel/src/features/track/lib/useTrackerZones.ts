import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { deviceZonesService, type Zone } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/track/lib/product";

/* Every tracker's zone, for the Safe Zones page.
 *
 * Zones are per device and there is no list endpoint, so this is one GET per
 * tracker. The query key matches useGetDeviceZoneQuery's, so the save/delete
 * mutations' invalidation refreshes the right entry.
 *
 * The endpoint answers 404 when a tracker has no zone and 409 when its device
 * type can't have one — both are states to show, not failures, so neither is
 * retried. */

export type TrackerZoneState =
  | { status: "loading" }
  | { status: "zone"; zone: Zone }
  | { status: "none" }
  | { status: "unsupported" }
  | { status: "error" };

const statusOf = (e: unknown) => (e as { response?: { status?: number } } | null)?.response?.status;

export function useTrackerZones(workspaceId: string | null, deviceIds: string[]) {
  const results = useQueries({
    queries: deviceIds.map((id) => ({
      queryKey: ["deviceZone", workspaceId ?? "", PRODUCT_KEY, id],
      queryFn: () => deviceZonesService.getZone(workspaceId!, PRODUCT_KEY, id),
      enabled: !!workspaceId,
      retry: (count: number, error: unknown) => {
        const s = statusOf(error);
        return s !== 404 && s !== 409 && count < 2;
      },
    })),
  });

  const stamp = results.map((r) => `${r.status}:${r.dataUpdatedAt}:${r.errorUpdatedAt}`).join(",");
  return useMemo(() => {
    const byId = new Map<string, TrackerZoneState>();
    results.forEach((r, i) => {
      const id = deviceIds[i];
      // A failed refetch keeps the previous data, so after a delete the stale
      // zone would linger next to the fresh 404 — the newer answer wins.
      const errorIsNewer = r.isError && r.errorUpdatedAt >= r.dataUpdatedAt;
      if (r.data && !errorIsNewer) byId.set(id, { status: "zone", zone: r.data });
      else if (r.isLoading) byId.set(id, { status: "loading" });
      else if (r.isError) {
        const s = statusOf(r.error);
        byId.set(id, { status: s === 404 ? "none" : s === 409 ? "unsupported" : "error" });
      } else byId.set(id, { status: "none" });
    });
    return byId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp, deviceIds.join(",")]);
}
