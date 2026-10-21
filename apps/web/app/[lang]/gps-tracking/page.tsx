"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { PanelPreview } from "@/components/vertical/PanelPreview";
import { useLanguage } from "@/contexts/LanguageContext";
import { gpsTrackingConfigs } from "@/lib/verticals/gps-tracking-i18n";

export default function GpsTrackingPage() {
  const { language } = useLanguage();
  return <VerticalLanding config={gpsTrackingConfigs[language]} beforeCta={<PanelPreview />} />;
}
