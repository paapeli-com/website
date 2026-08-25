"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { alertsEventsConfig } from "@/lib/features/alerts-events";

export default function AlertsEventsPage() {
  return <FeatureLanding config={alertsEventsConfig} />;
}
