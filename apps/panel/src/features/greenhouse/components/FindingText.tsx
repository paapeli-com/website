import { useRangeText } from "./CropCycleSheet";
import { METRIC_UNITS } from "../hooks";
import type { Finding } from "../evaluation";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

/**
 * A finding as a grower reads it, and as a work order raised from it is
 * titled: "Zone 2: Humidity 84% is above the Flowering target (60 to 70 %)".
 */
export function useFindingText() {
  const { g, named, formatNumber } = useGreenhouseText();
  const range = useRangeText();
  return (f: Finding) =>
    g(f.direction === "high" ? "findingHigh" : "findingLow", {
      zone: f.zoneName,
      metric: g(`metric_${f.metric}` as GreenhouseTextKey),
      value: `${formatNumber(Math.round(f.value * 10) / 10)}${METRIC_UNITS[f.metric] ? ` ${METRIC_UNITS[f.metric]}` : ""}`,
      stage: named(f.cycle.stage.names, f.cycle.stage.name),
      range: range(f.target),
    });
}
