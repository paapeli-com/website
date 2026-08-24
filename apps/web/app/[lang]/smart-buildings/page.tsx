"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { smartBuildingsConfig } from "@/lib/industries/smart-buildings";

export default function SmartBuildingsPage() {
  return <IndustryLanding config={smartBuildingsConfig} />;
}
