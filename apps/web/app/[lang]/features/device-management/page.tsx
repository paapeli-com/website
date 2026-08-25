"use client";

import { FeatureLanding } from "@/components/feature/FeatureLanding";
import { deviceManagementConfig } from "@/lib/features/device-management";

export default function DeviceManagementPage() {
  return <FeatureLanding config={deviceManagementConfig} />;
}
