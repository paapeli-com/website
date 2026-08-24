"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { oilGasConfig } from "@/lib/industries/oil-gas";

export default function OilGasPage() {
  return <IndustryLanding config={oilGasConfig} />;
}
