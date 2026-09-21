import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetWorkspaceAlarmRulesQuery } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Button } from "@/features/factory/components/ui/button";
import { AlertList } from "@/features/factory/components/alerts/AlertList";
import { AlertRulesList } from "@/features/factory/components/alerts/AlertRulesList";
import { AlertAnalytics } from "@/features/factory/components/alerts/AlertAnalytics";
import { AlertSettings, type SettingsView } from "@/features/factory/components/alerts/AlertSettings";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { BarChart3, Bell, Plus, SlidersHorizontal, Settings2 } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";

/* Four tabs, not six.
 *
 * Channels and Escalation were tabs of their own, which put four entries in
 * front of anyone looking for their alarms and buried the two that matter.
 * Both answer the same question — what happens once an alarm fires — so they
 * sit behind Alert Settings, a door each. Templates left the strip too: it is
 * a way to start a rule, so it belongs to the Rules tab rather than beside it.
 *
 * The old tab names still work as ?tab= values, so links that were sent or
 * bookmarked land where they always did. */
const TABS = ["all", "rules", "analytics", "settings"] as const;
type TabValue = (typeof TABS)[number];

/* Same query and page size the Rules tab uses, so the count on the tab and
   the list below it come from one request. */
const RULES_PAGE = 0;
const RULES_PAGE_SIZE = 100;

const tabTriggerClass =
  "gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0";

const Alarms = () => {
  const { t, language, formatNumber } = useLanguage();
  const tt = t as (k: string) => string;
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  /* Which door of the Settings tab is open, and whether the Rules tab is
     showing its templates. Both live here so a ?tab= link can open one. */
  const [settingsView, setSettingsView] = useState<SettingsView>("menu");
  const [rulesTemplates, setRulesTemplates] = useState(false);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (!param) return;
    if (param === "channels" || param === "escalation") {
      setActiveTab("settings");
      setSettingsView(param);
    } else if (param === "templates") {
      setActiveTab("rules");
      setRulesTemplates(true);
    } else if ((TABS as readonly string[]).includes(param)) {
      setActiveTab(param as TabValue);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("tab");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const workspaceId = useWorkspaceId();
  const { data: rulesData } = useGetWorkspaceAlarmRulesQuery(
    workspaceId ?? "", PRODUCT_KEY, RULES_PAGE, RULES_PAGE_SIZE,
  );
  const ruleCount = rulesData?.totalElements ?? rulesData?.data?.length ?? null;

  /* No alarms endpoint yet — the header used to count a fixed set of invented
     alarms. PageHeader hides the count entirely when it is null, and the
     Alert Center tab below says "no data" in its place. */
  const activeAlarmCount = null;

  /* A template rides along as a query param so the rule form opens with the
     tag and comparison already set — picking one has to change something. */
  const goCreateRule = (templateId?: string) =>
    navigate(lp(`/alarms/rules/new${templateId ? `?template=${templateId}` : ""}`));
  const goCreateEscalation = () => navigate(lp("/alarms/escalation/new"));
  const goEditEscalation = (alarmRuleId: string) => navigate(lp(`/alarms/escalation/${alarmRuleId}/edit`));
  const goCreateChannel = () => navigate(lp("/alarms/channels/new"));

  /* Creating a rule is the page's one primary action, so it sits in the
     header rather than inside a list. Not on Settings, which is about what
     happens to an alarm rather than about writing one. */
  const showCreate = activeTab === "all" || activeTab === "rules";

  return (
    <>
      <PageHeader
        title={tt("alarms")}
        count={activeAlarmCount}
        countLabel={tt("activeAlarmsLabel") || "Active Alarms"}
        actions={
          showCreate ? (
            <Button onClick={goCreateRule} className="h-9 gap-2 bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {tt("alertCreateRule")}
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto w-auto min-w-full gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
            <TabsTrigger value="all" className={tabTriggerClass}>
              <Bell className="h-3.5 w-3.5" />
              {tt("alertTabCenter")}
            </TabsTrigger>
            <TabsTrigger value="rules" className={tabTriggerClass}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {tt("alertTabRules")}
              {/* The count rides on the tab so the strip says how much is set
                  up without anyone having to open it. */}
              {ruleCount !== null && (
                <span className="ms-1 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {formatNumber(ruleCount)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className={tabTriggerClass}>
              <BarChart3 className="h-3.5 w-3.5" />
              {tt("alertTabAnalytics")}
            </TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass}>
              <Settings2 className="h-3.5 w-3.5" />
              {tt("alertTabSettings")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          <AlertList ruleCount={ruleCount} onViewRules={() => setActiveTab("rules")} />
        </TabsContent>

        <TabsContent value="rules">
          <AlertRulesList
            onCreateRule={goCreateRule}
            showTemplates={rulesTemplates}
            onShowTemplatesChange={setRulesTemplates}
          />
        </TabsContent>

        <TabsContent value="analytics"><AlertAnalytics /></TabsContent>

        <TabsContent value="settings">
          <AlertSettings
            view={settingsView}
            onViewChange={setSettingsView}
            onCreateChannel={goCreateChannel}
            onCreateEscalation={goCreateEscalation}
            onEditEscalation={goEditEscalation}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Alarms;
