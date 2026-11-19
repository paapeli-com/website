import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cropCycleService,
  cropService,
  greenhouseService,
  type CropCycleFilter,
  type CropMetric,
} from "@paapeli/api";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

/* Everything Smart Greenhouse reads, under one query-key prefix so a change
   anywhere (a crop planted, a stage moved, a zone added) refreshes every view
   of it at once. */
const ROOT = "greenhouse";

const key = (workspaceId: string, ...rest: unknown[]) => [ROOT, workspaceId, currentProductKey(), ...rest];

export function useGreenhouseWorkspace() {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  /** Refetches every greenhouse view, and the location tree they are drawn from. */
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [ROOT, workspaceId] }),
      queryClient.invalidateQueries({ queryKey: ["productAssetTree", workspaceId] }),
    ]);
  }, [queryClient, workspaceId]);
  return { workspaceId, productKey: currentProductKey(), refresh };
}

export function useGreenhouses() {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: key(workspaceId, "list"),
    queryFn: () => greenhouseService.list(workspaceId, currentProductKey()),
    enabled: !!workspaceId,
  });
}

export function useCropLibrary() {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: key(workspaceId, "library"),
    queryFn: () => cropService.library(workspaceId, currentProductKey()),
    enabled: !!workspaceId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCropProfiles(includeArchived = false) {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: key(workspaceId, "crops", includeArchived),
    queryFn: () => cropService.list(workspaceId, currentProductKey(), includeArchived),
    enabled: !!workspaceId,
  });
}

export function useCropCycles(filter: CropCycleFilter = {}) {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: key(workspaceId, "cycles", filter),
    queryFn: () => cropCycleService.list(workspaceId, currentProductKey(), filter),
    enabled: !!workspaceId,
  });
}

export function useCropCycleEvents(cropCycleId?: string) {
  const { workspaceId } = useGreenhouseWorkspace();
  return useQuery({
    queryKey: key(workspaceId, "cycles", cropCycleId, "events"),
    queryFn: () => cropCycleService.events(workspaceId, currentProductKey(), cropCycleId!),
    enabled: !!workspaceId && !!cropCycleId,
  });
}

/** The unit each target metric's bounds are in. */
export const METRIC_UNITS: Record<CropMetric, string> = {
  TEMPERATURE: "°C",
  HUMIDITY: "%",
  VPD: "kPa",
  CO2: "ppm",
  DLI: "mol/m²/d",
  SUBSTRATE_MOISTURE: "%",
  PH: "",
  EC: "mS/cm",
};

export const METRICS = Object.keys(METRIC_UNITS) as CropMetric[];

/** Whole days from a yyyy-MM-dd date (or an instant) to today, never negative. */
export function daysSince(value: string): number {
  const start = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86_400_000));
}

/** Whole days from today to a yyyy-MM-dd date; negative once it has passed. */
export function daysUntil(value: string): number {
  return Math.round((new Date(`${value}T00:00:00`).getTime() - startOfToday()) / 86_400_000);
}

function startOfToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

/** Today as yyyy-MM-dd in the reader's own time zone. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
