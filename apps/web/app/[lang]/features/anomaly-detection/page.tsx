"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { anomalyDetectionConfig } from "@/lib/features/anomaly-detection";

export default function AnomalyDetectionPage() {
  return <FeatureLanding config={anomalyDetectionConfig} />;
}
