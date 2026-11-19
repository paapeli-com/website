import type { CropCycle, CropMetric, CropTarget, Greenhouse } from "@paapeli/api";
import { FRESH_MS, summarize, type GreenhouseOps, type Reading } from "./operations";

/* Crop-aware evaluation: what each zone's sensors read now, against the
   targets of the stage its crop is in. Only fresh readings count, and only
   targets the grower's crop profile sets; a zone with neither is not judged. */

export interface Finding {
  zoneId: string;
  zoneName: string;
  cycle: CropCycle;
  metric: CropMetric;
  /** The reading furthest outside the range, across the zone's sensors. */
  value: number;
  target: CropTarget;
  direction: "high" | "low";
}

/** Day or night where the greenhouse is: 06:00 to 18:00 local time is day. */
export function periodNow(timeZone?: string | null, now = new Date()): "DAY" | "NIGHT" {
  let hour = now.getHours();
  if (timeZone) {
    try {
      hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone }).format(now)) % 24;
    } catch {
      /* an unknown zone falls back to the reader's own clock */
    }
  }
  return hour >= 6 && hour < 18 ? "DAY" : "NIGHT";
}

/** The target that applies now for a metric: the day or night one, else the one for both. */
function targetNow(targets: CropTarget[], metric: CropMetric, period: "DAY" | "NIGHT") {
  return targets.find((t) => t.metric === metric && t.period === period) ?? targets.find((t) => t.metric === metric && t.period === "ALL");
}

export function evaluate(house: Greenhouse, ops: GreenhouseOps | undefined, readings: Reading[], now = Date.now()): Finding[] {
  if (!ops) return [];
  const period = periodNow(house.timeZone, new Date(now));
  const findings: Finding[] = [];
  house.zones.forEach((zone) => {
    const cycle = zone.cycle;
    if (!cycle || !cycle.stage.targets.length) return;
    const ids = new Set((ops.devicesByPlace.get(zone.id) ?? []).map((d) => d.id));
    const fresh = readings.filter((r) => ids.has(r.deviceId) && now - r.ts <= FRESH_MS);
    const summary = summarize(fresh, now);
    (Object.keys(summary) as CropMetric[]).forEach((metric) => {
      const s = summary[metric as keyof typeof summary];
      const target = targetNow(cycle.stage.targets, metric, period);
      if (!s || !target) return;
      if (target.max != null && s.max > target.max) {
        findings.push({ zoneId: zone.id, zoneName: zone.name, cycle, metric, value: s.max, target, direction: "high" });
      } else if (target.min != null && s.min < target.min) {
        findings.push({ zoneId: zone.id, zoneName: zone.name, cycle, metric, value: s.min, target, direction: "low" });
      }
    });
  });
  return findings;
}
