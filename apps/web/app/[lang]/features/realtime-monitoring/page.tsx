"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { realtimeMonitoringConfig } from "@/lib/features/realtime-monitoring";

export default function RealtimeMonitoringPage() {
  return <FeatureLanding config={realtimeMonitoringConfig} />;
}
