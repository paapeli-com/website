"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { operationsHubConfig } from "@/lib/verticals/solution-hubs";

export default function OperationsHubPage() {
  return <VerticalLanding config={operationsHubConfig} />;
}
