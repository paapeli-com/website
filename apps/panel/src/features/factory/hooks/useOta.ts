import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  otaService,
  type OtaCreateDeploymentRequest,
  type OtaDeployment,
  type OtaFirmwareRequest,
  type OtaSettings,
} from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

/* The OTA page's data, all from the gateway (/ota/{ws}/{pk}). Every write
   invalidates the whole OTA cache: one rollout changes the firmware's status,
   the deployments list and the fleet at once. */

const rootKey = (workspaceId: string | null) => ["ota", workspaceId, PRODUCT_KEY] as const;

/** A rollout under way moves on its own; poll while one is. */
const LIVE_REFRESH_MS = 10_000;
const isLive = (d: OtaDeployment) =>
  d.status === "IN_PROGRESS" || d.status === "PAUSED" || d.status === "SCHEDULED" || d.status === "AWAITING_APPROVAL";

const useScope = () => {
  const workspaceId = useWorkspaceId();
  return { workspaceId, enabled: !!workspaceId, ws: workspaceId ?? "" };
};

export const useOtaFirmware = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "firmware"],
    queryFn: () => otaService.listFirmware(ws, PRODUCT_KEY),
    enabled,
  });
};

export const useOtaFirmwareOne = (firmwareId: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "firmware", firmwareId],
    queryFn: () => otaService.getFirmware(ws, PRODUCT_KEY, firmwareId!),
    enabled: enabled && !!firmwareId,
  });
};

export const useOtaDeployments = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "deployments"],
    queryFn: () => otaService.listDeployments(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: (q) => ((q.state.data ?? []).some(isLive) ? LIVE_REFRESH_MS : false),
  });
};

export const useOtaDeploymentEvents = (deploymentId: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "deployments", deploymentId, "events"],
    queryFn: () => otaService.deploymentEvents(ws, PRODUCT_KEY, deploymentId!),
    enabled: enabled && !!deploymentId,
    refetchInterval: LIVE_REFRESH_MS,
  });
};

export const useOtaDevices = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "devices"],
    queryFn: () => otaService.listDevices(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: (q) =>
      (q.state.data ?? []).some((d) => d.status === "UPDATING" || d.status === "PENDING") ? LIVE_REFRESH_MS : false,
  });
};

export const useOtaDeviceHistory = (deviceId: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "devices", deviceId, "history"],
    queryFn: () => otaService.deviceHistory(ws, PRODUCT_KEY, deviceId!),
    enabled: enabled && !!deviceId,
  });
};

export const useOtaSettings = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "settings"],
    queryFn: () => otaService.getSettings(ws, PRODUCT_KEY),
    enabled,
  });
};

/** The devices a rollout would reach; null while there is nothing to ask. */
export const useOtaDeploymentPreview = (
  request: Pick<OtaCreateDeploymentRequest, "firmwareId" | "targetGroup" | "assetId" | "deviceIds"> | null,
) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "preview", request],
    queryFn: () => otaService.previewDeployment(ws, PRODUCT_KEY, request!),
    enabled: enabled && !!request,
    retry: false,
  });
};

type DeploymentAction = "approve" | "pause" | "resume" | "cancel" | "retry-failed";

/** Every OTA write, each refreshing the OTA cache when it lands. */
export const useOtaActions = () => {
  const { workspaceId, ws } = useScope();
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: rootKey(workspaceId) });
  const scoped = <R,>(call: () => Promise<R>) => {
    if (!workspaceId) return Promise.reject(new Error("No workspace selected"));
    return call();
  };

  const createFirmware = useMutation({
    mutationFn: (a: { request: OtaFirmwareRequest; file: File }) =>
      scoped(() => otaService.createFirmware(ws, PRODUCT_KEY, a.request, a.file)),
    onSuccess,
  });
  const updateFirmware = useMutation({
    mutationFn: (a: { id: string; request: OtaFirmwareRequest; file?: File | null }) =>
      scoped(() => otaService.updateFirmware(ws, PRODUCT_KEY, a.id, a.request, a.file)),
    onSuccess,
  });
  const deleteFirmware = useMutation({
    mutationFn: (id: string) => scoped(() => otaService.deleteFirmware(ws, PRODUCT_KEY, id)),
    onSuccess,
  });
  const createDeployment = useMutation({
    mutationFn: (request: OtaCreateDeploymentRequest) =>
      scoped(() => otaService.createDeployment(ws, PRODUCT_KEY, request)),
    onSuccess,
  });
  const deploymentAction = useMutation({
    mutationFn: (a: { id: string; action: DeploymentAction }) =>
      scoped(() => otaService.deploymentAction(ws, PRODUCT_KEY, a.id, a.action)),
    onSuccess,
  });
  const updateDevice = useMutation({
    mutationFn: (a: { id: string; firmwareId?: string }) =>
      scoped(() => otaService.updateDevice(ws, PRODUCT_KEY, a.id, a.firmwareId)),
    onSuccess,
  });
  const retryDevice = useMutation({
    mutationFn: (id: string) => scoped(() => otaService.retryDevice(ws, PRODUCT_KEY, id)),
    onSuccess,
  });
  const saveSettings = useMutation({
    mutationFn: (settings: OtaSettings) => scoped(() => otaService.saveSettings(ws, PRODUCT_KEY, settings)),
    onSuccess,
  });

  return {
    createFirmware,
    updateFirmware,
    deleteFirmware,
    createDeployment,
    deploymentAction,
    updateDevice,
    retryDevice,
    saveSettings,
  };
};
