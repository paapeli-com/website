import { useMemo } from "react";
import type {
  AiAnomalyStatus,
  AiForecastStatus,
  AiOpportunityStatus,
  AiRisk,
  AiSignalCategory,
  AiTrend,
  AiTrendDirection,
} from "@paapeli/api";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useWorkOrders, type WorkOrder } from "@/features/factory/hooks/useWorkOrders";

/* What the AI insight pages share: badge colours, the status names the pages
   have always shown against the gateway's, and device locations. */

export type Risk = AiRisk;

export const RISK_BADGE: Record<Risk, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export const ROW_BORDER: Record<Risk, string> = {
  Critical: "border-s-4 border-red-500",
  High: "border-s-4 border-orange-500",
  Medium: "border-s-4 border-yellow-500",
  Low: "border-s-4 border-blue-400",
};

export const RISK_COLOR: Record<Risk, string> = {
  Critical: "hsl(0 84% 60%)",
  High: "hsl(25 95% 53%)",
  Medium: "hsl(45 93% 47%)",
  Low: "hsl(210 80% 55%)",
};

export const RISK_RANK: Record<Risk, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export const STATUS_BADGE: Record<AiAnomalyStatus, string> = {
  OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ACKNOWLEDGED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  INVESTIGATING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  DISMISSED: "bg-muted text-muted-foreground",
  FALSE_POSITIVE: "bg-muted text-muted-foreground",
};

export const OPPORTUNITY_STATUS_BADGE: Record<AiOpportunityStatus, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PLANNED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  IMPLEMENTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  DISMISSED: "bg-muted text-muted-foreground",
};

export const ACTIVE_ANOMALY: AiAnomalyStatus[] = ["OPEN", "ACKNOWLEDGED", "INVESTIGATING"];

/** The translation key each status has always been shown with. */
export const FORECAST_STATUS_KEY: Record<AiForecastStatus, string> = {
  OPEN: "fcStatusOpen",
  ACKNOWLEDGED: "fcStatusAcknowledged",
  INVESTIGATING: "fcStatusInvestigating",
  RESOLVED: "fcStatusResolved",
  DISMISSED: "fcStatusDismissed",
};

export const ANOMALY_STATUS_KEY: Record<AiAnomalyStatus, string> = {
  OPEN: "chipOpen",
  ACKNOWLEDGED: "alertStatusAcknowledged",
  INVESTIGATING: "chipInvestigating",
  RESOLVED: "chipResolved",
  DISMISSED: "chipDismissed",
  FALSE_POSITIVE: "chipFalsePositive",
};

export const OPPORTUNITY_STATUS_KEY: Record<AiOpportunityStatus, string> = {
  NEW: "statusNew",
  PLANNED: "statusPlanned",
  IN_PROGRESS: "statusInProgressOpp",
  IMPLEMENTED: "statusImplemented",
  DISMISSED: "statusDismissedOpt",
};

/** Each location's full path, by asset ID. */
export const useLocationPath = () => {
  const { options } = useAssetLocations();
  return useMemo(() => {
    const paths = new Map(options.map((o) => [o.id, o.path]));
    return (assetId?: string | null) => (assetId ? paths.get(assetId) ?? "" : "");
  }, [options]);
};

/** The top level of a location path: the filter the lists offer. */
export const siteOf = (path: string) => path.split(" > ").slice(0, 2).join(" > ");

/** The work orders raised from one insight (its ID is the order's external reference). */
export const useWorkOrdersFor = (sourceId: string | undefined): WorkOrder[] => {
  const { items } = useWorkOrders();
  return useMemo(
    () => (sourceId ? (items ?? []).filter((w) => w.anomalyId === sourceId) : []),
    [items, sourceId],
  );
};

/** Distinct, sorted, non-empty: filter options from the rows themselves. */
export const optionsOf = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));

export const DIRECTION_BADGE: Record<AiTrendDirection, string> = {
  Increasing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Decreasing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Stable: "bg-muted text-muted-foreground",
};

export const DIRECTION_ROW_BORDER: Record<AiTrendDirection, string> = {
  Increasing: "border-s-4 border-red-500",
  Decreasing: "border-s-4 border-blue-500",
  Stable: "border-s-4 border-muted",
};

/* Whether a move is good news depends on what moved. */
const MORE_IS_BETTER: AiSignalCategory[] = ["EFFICIENCY", "THROUGHPUT", "UTILIZATION"];
const LESS_IS_BETTER: AiSignalCategory[] = ["POWER", "TEMPERATURE", "VIBRATION", "CURRENT", "PRESSURE"];

export const isImproving = (t: AiTrend) =>
  (t.direction === "Increasing" && MORE_IS_BETTER.includes(t.category)) ||
  (t.direction === "Decreasing" && LESS_IS_BETTER.includes(t.category));
export const isDeteriorating = (t: AiTrend) =>
  (t.direction === "Increasing" && LESS_IS_BETTER.includes(t.category)) ||
  (t.direction === "Decreasing" && [...MORE_IS_BETTER, "FLOW"].includes(t.category));
