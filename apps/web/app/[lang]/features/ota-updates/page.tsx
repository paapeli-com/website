"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { otaUpdatesConfig } from "@/lib/features/ota-updates";

export default function OtaUpdatesPage() {
  return <FeatureLanding config={otaUpdatesConfig} />;
}
