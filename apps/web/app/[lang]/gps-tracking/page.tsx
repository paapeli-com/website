"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { gpsTrackingConfig } from "@/lib/verticals/gps-tracking";

export default function GpsTrackingPage() {
  return <VerticalLanding config={gpsTrackingConfig} />;
}
