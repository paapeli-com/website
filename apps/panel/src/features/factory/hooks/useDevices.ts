import { useCallback, useMemo } from "react";
import {
  useCreateDeviceMutation,
  useDeleteDeviceMutation,
  useGetTenantDevicesQuery,
  type CreateDeviceRequest,
  type DeviceResponse,
} from "@paapeli/api";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useAssetLocations } from "./useAssetLocations";
import { queryLoad } from "@/shared/hooks/usePageLoad";

/**
 * The device list for the active workspace, straight from
 * GET /api/v1/aiot/devices/{workspaceId}/{productKey}/tenant.
 *
 * This used to be a localStorage store seeded with eight sample devices; it is
 * now the real listing. Two consequences for callers:
 *   - `create` and `remove` are async — they are HTTP calls.
 *   - `apiKey` is not part of a device. Credentials live behind their own
 *     per-device endpoint; read them with useGetDeviceCredentialsQuery.
 */
export interface UserDevice {
  id: string;
  /** The server has one identifier; kept as `deviceId` for existing call sites. */
  deviceId: string;
  name: string;
  /** The API's `label` as sent — the device's tags, comma-separated. */
  label?: string;
  /** Tags, comma-separated: stored in the API's `label` (see DeviceForm). */
  tags?: string;
  /** Saved on create/edit; read back only once the list endpoint returns it. */
  description?: string;
  type?: string;
  protocol: string;
  /** Server-reported connectivity — the source for the status pill. */
  active: boolean;
  /** Asset the device hangs off, i.e. the location tree node id. */
  assetId?: string;
  /** Breadcrumb resolved from `assetId` against the product asset tree. */
  location?: string;
  createdAt: string;
  /** Last server-side change; the API exposes no separate "last seen". */
  lastActivity?: string;

  /* ---------------------------------------------------------------------
     No endpoint backs any of the fields below — the gateway has no
     gateway-assignment, sharing or OTA surface, and credentials are their own
     per-device call rather than part of the device record. They stay on the
     type so the pages reading them keep compiling, and they are always
     undefined, so those pages render blanks instead of invented data. When an
     endpoint appears, populate it in `toUserDevice` and delete the field here.
     --------------------------------------------------------------------- */
  /** Use useGetDeviceCredentialsQuery — not part of the device record. */
  apiKey?: undefined;
  externalId?: undefined;
  gateway?: undefined;
  sharedUsers?: undefined;
  useSsl?: undefined;
  useOta?: undefined;
  useMonitoring?: undefined;
  authMethod?: undefined;
  authClientId?: undefined;
  authUsername?: undefined;
  sslCert?: undefined;
}

/** One page covers the device counts these products carry today. */
const DEVICE_PAGE_SIZE = 200;

const toUserDevice = (
  d: DeviceResponse,
  locationOf: (assetId: string) => string | undefined,
): UserDevice => ({
  id: d.id,
  deviceId: d.id,
  name: d.name,
  label: d.label,
  tags: d.label || undefined,
  description: d.description || undefined,
  type: d.type,
  protocol: d.protocol,
  active: d.active,
  assetId: d.assetId,
  location: d.assetId ? locationOf(d.assetId) : undefined,
  createdAt: d.createdAt,
  lastActivity: d.updatedAt,
});

export const useDevices = () => {
  // Every device endpoint is scoped to /{workspaceId}/{productKey}; null until
  // the host has picked a workspace, which keeps the query disabled.
  const workspaceId = useWorkspaceId();
  const { options: locations } = useAssetLocations();

  const query = useGetTenantDevicesQuery(
    workspaceId ?? "",
    currentProductKey(),
    0,
    DEVICE_PAGE_SIZE,
  );
  const createDevice = useCreateDeviceMutation();
  const deleteDevice = useDeleteDeviceMutation();

  const items = useMemo(() => {
    const paths = new Map(locations.map((l) => [l.id, l.path]));
    return (query.data?.data ?? []).map((d) =>
      toUserDevice(d, (assetId) => paths.get(assetId)),
    );
  }, [query.data, locations]);

  const create = useCallback(
    async (req: CreateDeviceRequest) => {
      if (!workspaceId) throw new Error("No workspace selected");
      return createDevice.mutateAsync({
        workspaceId,
        productKey: currentProductKey(),
        ...req,
      });
    },
    [createDevice, workspaceId],
  );

  const remove = useCallback(
    async (deviceId: string) => {
      if (!workspaceId) throw new Error("No workspace selected");
      return deleteDevice.mutateAsync({
        workspaceId,
        productKey: currentProductKey(),
        deviceId,
      });
    },
    [deleteDevice, workspaceId],
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    /** Page-level load state for usePageLoad — see queryLoad. */
    load: queryLoad(query),
    /** No workspace picked yet — the query is disabled, not empty. */
    noWorkspace: !workspaceId,
    refetch: query.refetch,
    totalElements: query.data?.totalElements ?? 0,
    create,
    isCreating: createDevice.isPending,
    remove,
    isRemoving: deleteDevice.isPending,
  };
};
