"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { predictiveAnalyticsConfig } from "@/lib/features/predictive-analytics";

export default function PredictiveAnalyticsPage() {
  return <FeatureLanding config={predictiveAnalyticsConfig} />;
}
