"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { solutionTemplatesConfig } from "@/lib/features/solution-templates";

export default function SolutionTemplatesPage() {
  return <FeatureLanding config={solutionTemplatesConfig} />;
}
