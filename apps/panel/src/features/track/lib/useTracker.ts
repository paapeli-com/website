import { useEffect, useMemo } from "react";
import {
  useGetDeviceByIdQuery,
  useGetDeviceCredentialsQuery,
  useGetDeviceTimeSeriesQuery,
  useGetProductDeviceTypesQuery,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { queryLoad } from "@/shared/hooks/usePageLoad";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { TELEMETRY_HOURS } from "@/features/track/lib/telemetry";

/** How often the detail page re-reads telemetry while it is open. */
const TELEMETRY_REFRESH_MS = 30_000;

/* One tracker for the detail page: its record, its type's display label, its
   MQTT identity and its recent telemetry — each from its own endpoint. Only
   the record gates the page; the rest render their own empty states. */
export function useTracker(deviceId: string | undefined) {
  const workspaceId = useActiveWorkspaceId() ?? "";
  const id = deviceId ?? "";

  const deviceQuery = useGetDeviceByIdQuery(workspaceId, PRODUCT_KEY, id);
  const { data: catalogTypes } = useGetProductDeviceTypesQuery(PRODUCT_KEY);
  const { data: credentials } = useGetDeviceCredentialsQuery(workspaceId, PRODUCT_KEY, id);
  const telemetryQuery = useGetDeviceTimeSeriesQuery(workspaceId, PRODUCT_KEY, id, TELEMETRY_HOURS);

  // The query hook takes no refetch interval, so poll from here.
  const { refetch: refetchTelemetry } = telemetryQuery;
  useEffect(() => {
    if (!workspaceId || !id) return;
    const timer = setInterval(() => void refetchTelemetry(), TELEMETRY_REFRESH_MS);
    return () => clearInterval(timer);
  }, [workspaceId, id, refetchTelemetry]);

  const device = deviceQuery.data;
  const typeLabel = useMemo(() => {
    if (!device) return "";
    return catalogTypes?.find((dt) => dt.deviceType === device.type)?.label || device.type;
  }, [device, catalogTypes]);

  /* MQTT_BASIC carries {clientId, userName, password} as a JSON string. The
     password is never surfaced here — it was shown once, at creation. */
  const mqtt = useMemo(() => {
    if (credentials?.credentialType !== "MQTT_BASIC" || !credentials.credentialsValue) return null;
    try {
      const v = JSON.parse(credentials.credentialsValue) as { clientId?: string; userName?: string };
      return { clientId: v.clientId ?? "", username: v.userName ?? "" };
    } catch {
      return null;
    }
  }, [credentials]);

  return {
    workspaceId: workspaceId || null,
    device,
    typeLabel,
    credentialType: credentials?.credentialType,
    mqtt,
    /** Page-level load state for usePageLoad — see queryLoad. */
    load: queryLoad(deviceQuery),
    /** The id matches no device in this workspace — a stale or mistyped link. */
    notFound: (deviceQuery.error as { response?: { status?: number } } | null)?.response?.status === 404,
    refetchDevice: deviceQuery.refetch,
    telemetry: telemetryQuery.data,
    telemetryLoading: telemetryQuery.isLoading,
    telemetryFailed: telemetryQuery.isError && !telemetryQuery.data,
    refetchTelemetry,
  };
}
