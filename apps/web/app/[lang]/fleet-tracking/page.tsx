"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { fleetTrackingConfig } from "@/lib/industries/fleet-tracking";

export default function FleetTrackingPage() {
  return <IndustryLanding config={fleetTrackingConfig} />;
}
