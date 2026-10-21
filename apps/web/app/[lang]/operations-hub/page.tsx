"use client";

import { VerticalLanding } from "@/components/vertical/VerticalLanding";
import { useLanguage } from "@/contexts/LanguageContext";
import { operationsHubConfigs } from "@/lib/verticals/solution-hubs-i18n";

export default function OperationsHubPage() {
  const { language } = useLanguage();
  return <VerticalLanding config={operationsHubConfigs[language]} />;
}
