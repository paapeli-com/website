import type { AlertSeverity } from "@/features/factory/types/alerts";

/* The alarm-rule API keys each rule's conditions by ThingsBoard alarm severity,
   which has five levels (CRITICAL > MAJOR > MINOR > WARNING > INDETERMINATE).
   The panel shows four, so the lowest two share "low". */
export const UI_TO_API_SEVERITY: Record<AlertSeverity, string> = {
  critical: "CRITICAL",
  high: "MAJOR",
  medium: "MINOR",
  low: "WARNING",
};

export const apiSeverityToUi = (severity: string): AlertSeverity => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": return "critical";
    case "MAJOR": return "high";
    case "MINOR": return "medium";
    default: return "low";
  }
};

export const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
