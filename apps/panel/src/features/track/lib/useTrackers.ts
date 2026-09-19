import { useMemo } from "react";
import { useGetProductDeviceTypesQuery, useGetTenantDevicesQuery, type DeviceResponse } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { queryLoad } from "@/shared/hooks/usePageLoad";
import { PRODUCT_KEY } from "@/features/track/lib/product";

/* The tracker list for the active workspace, straight from
 * GET /api/v1/aiot/devices/{workspaceId}/gpsTracking/tenant — mirrors
 * features/factory/hooks/useDevices.ts.
 *
 * Deliberately NOT the mock `Device` type in data/types.ts: that one carries
 * battery, signal, position and an asset kind (pet/person/vehicle), and the
 * device record has none of them. Rather than invent values, the list shows
 * only what the server sends; telemetry-backed fields can join this type once
 * there is an endpoint for them. */

export type Tracker = {
  id: string;
  name: string;
  label: string;
  /** Device-type key from the product catalog, e.g. "zx909". */
  type: string;
  /** The catalog's display label for `type`, falling back to the key. */
  typeLabel: string;
  protocol: string;
  /** Server-reported connectivity — the source for the status pill. */
  status: "online" | "offline";
  createdAt: string;
  /** Last server-side change; the API exposes no separate "last seen". */
  updatedAt: string;
};

/** One page covers the fleet sizes this product carries today. */
const PAGE_SIZE = 200;

const toTracker = (d: DeviceResponse, labelOf: (type: string) => string | undefined): Tracker => ({
  id: d.id,
  name: d.name,
  label: d.label,
  type: d.type,
  typeLabel: labelOf(d.type) || d.type,
  protocol: d.protocol,
  status: d.active ? "online" : "offline",
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export function useTrackers() {
  // null until the shell has picked a workspace, which keeps the query disabled.
  const workspaceId = useActiveWorkspaceId();
  const query = useGetTenantDevicesQuery(workspaceId ?? "", PRODUCT_KEY, 0, PAGE_SIZE);
  const { data: catalogTypes } = useGetProductDeviceTypesQuery(PRODUCT_KEY);

  const trackers = useMemo(() => {
    const labels = new Map((catalogTypes ?? []).map((dt) => [dt.deviceType, dt.label]));
    return (query.data?.data ?? []).map((d) => toTracker(d, (type) => labels.get(type)));
  }, [query.data, catalogTypes]);

  return {
    trackers,
    /** Total on the server — more than `trackers.length` if it outgrew one page. */
    total: query.data?.totalElements ?? 0,
    /** Page-level load state for usePageLoad — see queryLoad. */
    load: queryLoad(query),
    /** No workspace picked yet — the query is disabled, not empty. */
    noWorkspace: !workspaceId,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
