import { sampleDataEnabled } from "./sampleData";
import { SAMPLE_OPPORTUNITIES, SAMPLE_TRENDS } from "./sample/trends";
export type TrendDirection = "Increasing" | "Decreasing" | "Stable";

export interface Trend {
  id: string;
  name: string;
  asset: string;
  devId: string;
  assetType: string;
  location: string;
  metric: string;
  direction: TrendDirection;
  changePct: number; // signed, e.g. +18 or -9
  confidence: number; // 0-100
  timeRange: string;
  interpretation: string[];
  factors: { label: string; weight: number }[];
  recommendations: string[];
}

/* Empty until there is an endpoint behind it.

   This array used to hold invented telemetry trends, written by hand and rendered by
   the AI pages exactly as a model's output would be — health scores, remaining
   useful life, confidence percentages, named assets at named plants. Nothing
   on screen distinguished that from a real prediction, so the pages now show
   "no data" instead. Point this at the query when the service lands; the
   consumers already work off whatever length this has.
*/
export const TRENDS: Trend[] = sampleDataEnabled() ? SAMPLE_TRENDS : [];

export type OpportunityCategory =
  | "Energy"
  | "Efficiency"
  | "Maintenance"
  | "Utilization";

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  impactLabel: string; // e.g. "Potential Saving", "Efficiency Gain"
  impactValue: string; // e.g. "11%"
  impactPct: number; // numeric for bars/sort
  confidence: number;
  affectedAssets: string[];
  estimatedSavings: string;
  explanation: string;
  recommendedActions: string[];
  implementationSteps: string[];
}

/* Empty until there is an endpoint behind it.

   This array used to hold invented savings opportunities, written by hand and rendered by
   the AI pages exactly as a model's output would be — health scores, remaining
   useful life, confidence percentages, named assets at named plants. Nothing
   on screen distinguished that from a real prediction, so the pages now show
   "no data" instead. Point this at the query when the service lands; the
   consumers already work off whatever length this has.
*/
export const OPPORTUNITIES: Opportunity[] = sampleDataEnabled() ? SAMPLE_OPPORTUNITIES : [];

export const DIRECTION_BADGE: Record<TrendDirection, string> = {
  Increasing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Decreasing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Stable: "bg-muted text-muted-foreground",
};

export const DIRECTION_ROW_BORDER: Record<TrendDirection, string> = {
  Increasing: "border-s-4 border-red-500",
  Decreasing: "border-s-4 border-blue-500",
  Stable: "border-s-4 border-muted",
};
