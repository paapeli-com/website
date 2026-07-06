"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { edgeHubConfig } from "@/lib/verticals/solution-hubs";

export default function EdgeHubPage() {
  return <VerticalLanding config={edgeHubConfig} />;
}
