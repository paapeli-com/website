"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { energyMonitoringConfig } from "@/lib/industries/energy-monitoring";

export default function EnergyMonitoringPage() {
  return <IndustryLanding config={energyMonitoringConfig} />;
}
