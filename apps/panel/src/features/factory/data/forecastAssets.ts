import { sampleDataEnabled } from "./sampleData";
import { SAMPLE_FORECAST_ASSETS } from "./sample/forecastAssets";
export type ForecastRisk = "Critical" | "High" | "Medium" | "Low";

export interface ForecastAsset {
  id: string;
  devId: string;
  type: string;
  location: string;
  health: number;
  risk: ForecastRisk;
  date: string;
  rulDays: number;
  cause: string;
  recommendedActions: string[];
}

/* Empty until there is an endpoint behind it.

   This array used to hold invented failure forecasts, written by hand and rendered by
   the AI pages exactly as a model's output would be — health scores, remaining
   useful life, confidence percentages, named assets at named plants. Nothing
   on screen distinguished that from a real prediction, so the pages now show
   "no data" instead. Point this at the query when the service lands; the
   consumers already work off whatever length this has.
*/
export const FORECAST_ASSETS: ForecastAsset[] = sampleDataEnabled() ? SAMPLE_FORECAST_ASSETS : [];

export const RISK_BADGE: Record<ForecastRisk, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export const ROW_BORDER: Record<ForecastRisk, string> = {
  Critical: "border-s-4 border-red-500",
  High: "border-s-4 border-orange-500",
  Medium: "border-s-4 border-yellow-500",
  Low: "border-s-4 border-blue-400",
};

export const RISK_COLOR: Record<ForecastRisk, string> = {
  Critical: "hsl(0 84% 60%)",
  High: "hsl(25 95% 53%)",
  Medium: "hsl(45 93% 47%)",
  Low: "hsl(210 80% 55%)",
};
