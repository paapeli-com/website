"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { useLanguage } from "@/contexts/LanguageContext";
import { edgeHubConfigs } from "@/lib/verticals/solution-hubs-i18n";

export default function EdgeHubPage() {
  const { language } = useLanguage();
  return <VerticalLanding config={edgeHubConfigs[language]} />;
}
