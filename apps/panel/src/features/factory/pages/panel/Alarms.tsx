import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { AlertList } from "@/features/factory/components/alerts/AlertList";
import { AlertRulesList } from "@/features/factory/components/alerts/AlertRulesList";
import { AlertAnalytics } from "@/features/factory/components/alerts/AlertAnalytics";
import { EscalationPolicies } from "@/features/factory/components/alerts/EscalationPolicies";
import { NotificationChannels } from "@/features/factory/components/alerts/NotificationChannels";
import { AlertTemplates } from "@/features/factory/components/alerts/AlertTemplates";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { mockAlerts } from "@/features/factory/data/mockAlertData";
import { FileText } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const Alarms = () => {
  const { t, language } = useLanguage();
  const tt = t as (k: string) => string;
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== activeTab) {
      setActiveTab(t);
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const activeAlarmCount = mockAlerts.filter(
    (a) => a.status === "active" || a.status === "escalated"
  ).length;

  const goCreateRule = () => navigate(lp("/alarms/rules/new"));
  const goCreateEscalation = () => navigate(lp("/alarms/escalation/new"));
  const goCreateChannel = () => navigate(lp("/alarms/channels/new"));

  return (
    <>
      <PageHeader
        title={tt("alarms")}
        count={activeAlarmCount}
        countLabel={tt("activeAlarmsLabel") || "Active Alarms"}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-transparent border-b rounded-none h-auto p-0 gap-6">
            <TabsTrigger value="all" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {(t as any)("alertTabAll")}
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {t("alertTabRules")}
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {t("alertTabEscalation")}
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {t("alertTabChannels")}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {t("alertTabAnalytics")}
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              <FileText className="h-3.5 w-3.5" />
              {t("alertTabTemplates")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all"><AlertList /></TabsContent>

        <TabsContent value="rules"><AlertRulesList onCreateRule={goCreateRule} /></TabsContent>
        <TabsContent value="escalation"><EscalationPolicies onCreateClick={goCreateEscalation} /></TabsContent>
        <TabsContent value="channels"><NotificationChannels onCreateClick={goCreateChannel} /></TabsContent>
        <TabsContent value="analytics"><AlertAnalytics /></TabsContent>
        <TabsContent value="templates"><AlertTemplates onUseTemplate={goCreateRule} /></TabsContent>
      </Tabs>
    </>
  );
};

export default Alarms;
