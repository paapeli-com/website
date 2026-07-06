"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { infrastructureHubConfig } from "@/lib/verticals/solution-hubs";

export default function InfrastructureHubPage() {
  return <VerticalLanding config={infrastructureHubConfig} />;
}
