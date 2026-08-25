"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { flexibleDeploymentConfig } from "@/lib/features/flexible-deployment";

export default function FlexibleDeploymentPage() {
  return <FeatureLanding config={flexibleDeploymentConfig} />;
}
