import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiService,
  type AiAnomalyStatus,
  type AiForecastStatus,
  type AiOpportunityStatus,
  type AiSensitivity,
  type AiSourceKind,
} from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

/* The AI insight pages' data, all from the gateway (/ai/{ws}/{pk}). The
   gateway recomputes on its own clock (anomalies hourly, the rest every few
   hours), so reads refresh every few minutes rather than on a tight poll.
   Every write invalidates the whole AI cache: an anomaly's status shows on
   its list, its details and the dashboards at once. */

const rootKey = (workspaceId: string | null) => ["ai", workspaceId, PRODUCT_KEY] as const;
const REFRESH_MS = 5 * 60_000;

const useScope = () => {
  const workspaceId = useWorkspaceId();
  return { workspaceId, enabled: !!workspaceId, ws: workspaceId ?? "" };
};

export const useAiStatus = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "status"],
    queryFn: () => aiService.status(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: 60_000,
  });
};

export const useAiForecasts = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "forecasts"],
    queryFn: () => aiService.forecasts(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: REFRESH_MS,
  });
};

export const useAiForecast = (deviceId: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "forecasts", deviceId],
    queryFn: () => aiService.forecast(ws, PRODUCT_KEY, deviceId!),
    enabled: enabled && !!deviceId,
    retry: false,
  });
};

export const useAiAnomalies = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "anomalies"],
    queryFn: () => aiService.anomalies(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: REFRESH_MS,
  });
};

export const useAiAnomaly = (id: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "anomalies", id],
    queryFn: () => aiService.anomaly(ws, PRODUCT_KEY, id!),
    enabled: enabled && !!id,
    retry: false,
  });
};

export const useAiTrends = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "trends"],
    queryFn: () => aiService.trends(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: REFRESH_MS,
  });
};

export const useAiTrend = (id: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "trends", id],
    queryFn: () => aiService.trend(ws, PRODUCT_KEY, id!),
    enabled: enabled && !!id,
    retry: false,
  });
};

export const useAiOpportunities = () => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "opportunities"],
    queryFn: () => aiService.opportunities(ws, PRODUCT_KEY),
    enabled,
    refetchInterval: REFRESH_MS,
  });
};

export const useAiOpportunity = (id: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "opportunities", id],
    queryFn: () => aiService.opportunity(ws, PRODUCT_KEY, id!),
    enabled: enabled && !!id,
    retry: false,
  });
};

/** The actions (or steps) marked done on one forecast, anomaly, trend or opportunity. */
export const useAiCompletedActions = (kind: AiSourceKind, sourceId: string | undefined) => {
  const { workspaceId, enabled, ws } = useScope();
  return useQuery({
    queryKey: [...rootKey(workspaceId), "actions", kind, sourceId],
    queryFn: () => aiService.actions(ws, PRODUCT_KEY, kind, sourceId!),
    enabled: enabled && !!sourceId,
  });
};

/** Every AI write, each refreshing the AI cache when it lands. */
export const useAiActions = () => {
  const { workspaceId, ws } = useScope();
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: rootKey(workspaceId) });
  const scoped = <R,>(call: () => Promise<R>) => {
    if (!workspaceId) return Promise.reject(new Error("No workspace selected"));
    return call();
  };

  const setForecastStatus = useMutation({
    mutationFn: (a: { deviceId: string; status: AiForecastStatus }) =>
      scoped(() => aiService.setForecastStatus(ws, PRODUCT_KEY, a.deviceId, a.status)),
    onSuccess,
  });
  const setAnomalyStatus = useMutation({
    mutationFn: (a: { id: string; status: AiAnomalyStatus }) =>
      scoped(() => aiService.setAnomalyStatus(ws, PRODUCT_KEY, a.id, a.status)),
    onSuccess,
  });
  const setOpportunityStatus = useMutation({
    mutationFn: (a: { id: string; status: AiOpportunityStatus }) =>
      scoped(() => aiService.setOpportunityStatus(ws, PRODUCT_KEY, a.id, a.status)),
    onSuccess,
  });
  const toggleAction = useMutation({
    mutationFn: (a: { kind: AiSourceKind; sourceId: string; code: string; done: boolean }) =>
      scoped(() =>
        a.done
          ? aiService.completeAction(ws, PRODUCT_KEY, a.kind, a.sourceId, a.code)
          : aiService.undoAction(ws, PRODUCT_KEY, a.kind, a.sourceId, a.code),
      ),
    onSuccess,
  });
  const analyzeNow = useMutation({
    mutationFn: () => scoped(() => aiService.analyzeNow(ws, PRODUCT_KEY)),
    onSuccess,
  });
  const saveSettings = useMutation({
    mutationFn: (s: { enabled: boolean; sensitivity: AiSensitivity }) =>
      scoped(() => aiService.saveSettings(ws, PRODUCT_KEY, s)),
    onSuccess,
  });

  return { setForecastStatus, setAnomalyStatus, setOpportunityStatus, toggleAction, analyzeNow, saveSettings };
};
