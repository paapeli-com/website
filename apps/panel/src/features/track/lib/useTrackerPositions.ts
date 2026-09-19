import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { timeseriesService } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { latestBattery, latestSpeed, positionTrail, TELEMETRY_HOURS } from "@/features/track/lib/telemetry";

/* Each tracker's last known position, for the Live Map.
 *
 * The API has no bulk or "latest values" telemetry endpoint — only per-device
 * history — so this is one request per tracker, polled. The query key matches
 * useGetDeviceTimeSeriesQuery's, so the detail page reuses what the map
 * already fetched and vice versa. With a large fleet this is a lot of
 * requests; a workspace-wide latest-position endpoint would replace it. */

const REFRESH_MS = 60_000;

export type TrackerFix = {
  lat: number;
  lng: number;
  /** ISO time of the fix. */
  at: string;
  battery: number | null;
  speed: number | null;
};

export function useTrackerPositions(workspaceId: string | null, deviceIds: string[]) {
  const results = useQueries({
    queries: deviceIds.map((id) => ({
      queryKey: ["deviceTimeSeries", workspaceId ?? "", PRODUCT_KEY, id, TELEMETRY_HOURS],
      queryFn: () => timeseriesService.getDeviceTimeSeries(workspaceId!, PRODUCT_KEY, id, TELEMETRY_HOURS),
      enabled: !!workspaceId,
      refetchInterval: REFRESH_MS,
    })),
  });

  // useQueries returns a new array every render; key the memo on the data.
  const dataStamp = results.map((r) => r.dataUpdatedAt).join(",");
  const fixes = useMemo(() => {
    const byId = new Map<string, TrackerFix>();
    results.forEach((r, i) => {
      const trail = positionTrail(r.data);
      const last = trail[trail.length - 1];
      if (!last) return;
      byId.set(deviceIds[i], {
        lat: last.lat,
        lng: last.lng,
        at: last.at,
        battery: latestBattery(r.data)?.value ?? null,
        speed: latestSpeed(r.data)?.value ?? null,
      });
    });
    return byId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataStamp, deviceIds.join(",")]);

  return {
    fixes,
    /** Still waiting on the first answer for at least one tracker. */
    loading: results.some((r) => r.isLoading),
  };
}
