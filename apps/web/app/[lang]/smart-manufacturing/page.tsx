"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { smartManufacturingConfig } from "@/lib/industries/smart-manufacturing";

export default function SmartManufacturingPage() {
  return <IndustryLanding config={smartManufacturingConfig} />;
}
