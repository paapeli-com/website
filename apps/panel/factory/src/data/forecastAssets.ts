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

export const FORECAST_ASSETS: ForecastAsset[] = [
  {
    id: "Pump P101",
    devId: "DEV-101",
    type: "Pump",
    location: "Qazvin > Factory A > Sulfonation > Line 1",
    health: 43,
    risk: "Critical",
    date: "Jun 14, 2026",
    rulDays: 3,
    cause: "Bearing vibration",
    recommendedActions: ["Inspect bearing", "Lubricate shaft", "Schedule maintenance window"],
  },
  {
    id: "Boiler Pump BP-2",
    devId: "DEV-810",
    type: "Pump",
    location: "Qazvin > Factory A > Boiler > Line 1",
    health: 48,
    risk: "Critical",
    date: "Jun 15, 2026",
    rulDays: 4,
    cause: "Cavitation",
    recommendedActions: ["Check suction pressure", "Inspect impeller", "Reduce throughput"],
  },
  {
    id: "Compressor C3",
    devId: "DEV-205",
    type: "Compressor",
    location: "Qazvin > Factory A > Sulfonation > Line 2",
    health: 56,
    risk: "High",
    date: "Jun 17, 2026",
    rulDays: 6,
    cause: "Vibration anomaly",
    recommendedActions: ["Lubricate shaft", "Re-balance rotor", "Schedule inspection"],
  },
  {
    id: "Motor M12",
    devId: "DEV-322",
    type: "Motor",
    location: "Qazvin > Factory B > Processing > Line 1",
    health: 61,
    risk: "High",
    date: "Jun 20, 2026",
    rulDays: 9,
    cause: "Temperature rise",
    recommendedActions: ["Inspect cooling system", "Verify load", "Schedule thermal check"],
  },
  {
    id: "Heat Exchanger HX-7",
    devId: "DEV-705",
    type: "Heat Exchanger",
    location: "Qazvin > Factory B > Processing > Line 2",
    health: 65,
    risk: "High",
    date: "Jun 28, 2026",
    rulDays: 14,
    cause: "Fouling",
    recommendedActions: ["Plan chemical cleaning", "Inspect tube bundle", "Monitor pressure drop"],
  },
  {
    id: "Furnace Fan F2",
    devId: "DEV-411",
    type: "Fan",
    location: "Qazvin > Factory A > Furnace > Line 3",
    health: 72,
    risk: "Medium",
    date: "Jul 1, 2026",
    rulDays: 18,
    cause: "Current instability",
    recommendedActions: ["Inspect electrical supply", "Check winding insulation"],
  },
  {
    id: "Conveyor CV-04",
    devId: "DEV-508",
    type: "Conveyor",
    location: "Qazvin > Factory B > Packaging > Line 2",
    health: 75,
    risk: "Medium",
    date: "Jul 7, 2026",
    rulDays: 24,
    cause: "Belt wear",
    recommendedActions: ["Inspect belt", "Adjust tensioner"],
  },
  {
    id: "Valve V-21",
    devId: "DEV-612",
    type: "Valve",
    location: "Qazvin > Factory A > Sulfonation > Line 1",
    health: 81,
    risk: "Low",
    date: "Aug 12, 2026",
    rulDays: 60,
    cause: "Seal degradation",
    recommendedActions: ["Plan seal replacement"],
  },
];

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
