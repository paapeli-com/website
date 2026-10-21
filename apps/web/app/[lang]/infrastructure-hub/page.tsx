"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { useLanguage } from "@/contexts/LanguageContext";
import { infrastructureHubConfigs } from "@/lib/verticals/solution-hubs-i18n";

export default function InfrastructureHubPage() {
  const { language } = useLanguage();
  return <VerticalLanding config={infrastructureHubConfigs[language]} />;
}
