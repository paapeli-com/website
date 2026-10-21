"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { useLanguage } from "@/contexts/LanguageContext";
import { intelligenceHubConfigs } from "@/lib/verticals/solution-hubs-i18n";

export default function IntelligenceHubPage() {
  const { language } = useLanguage();
  return <VerticalLanding config={intelligenceHubConfigs[language]} />;
}
