"use client";

import { IndustryLanding } from "@/components/industry/IndustryLanding";
import { smartAgricultureConfig } from "@/lib/industries/smart-agriculture";

export default function SmartAgriculturePage() {
  return <IndustryLanding config={smartAgricultureConfig} />;
}
