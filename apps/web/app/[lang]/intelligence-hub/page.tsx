"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { intelligenceHubConfig } from "@/lib/verticals/solution-hubs";

export default function IntelligenceHubPage() {
  return <VerticalLanding config={intelligenceHubConfig} />;
}
