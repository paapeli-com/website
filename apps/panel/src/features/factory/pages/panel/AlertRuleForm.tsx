import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetWorkspaceAlarmRulesQuery } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { AlertRuleWizard } from "@/features/factory/components/alerts/AlertRuleWizard";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { currentProductKey } from "@/features/factory/lib/product";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { LoadFailed } from "@/shared/components/LoadFailed";

type Action = { label: string; onClick: () => void; disabled?: boolean };

/* Creates a rule, or edits one at /alarms/rules/:alarmRuleId/edit. The rule is
   read from the same workspace list the Rules tab shows (one page of 100), so
   arriving from that tab costs no request. */
const AlertRuleForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const tt = t as (k: string) => string;
  const goBack = (tab?: string) => navigate(lp(tab ? `/alarms?tab=${tab}` : "/alarms"));
  const [actions, setActions] = useState<{ primary: Action; secondary?: Action; tertiary?: Action } | null>(null);

  const { alarmRuleId } = useParams();
  const workspaceId = useWorkspaceId();
  const rulesQuery = useGetWorkspaceAlarmRulesQuery(workspaceId ?? "", currentProductKey(), 0, 100, { enabled: !!alarmRuleId });
  const editRule = alarmRuleId ? rulesQuery.data?.data.find((r) => r.id === alarmRuleId) : undefined;
  const title = alarmRuleId ? tt("alertEditRule") : tt("alertCreateRule");

  let body: ReactNode;
  if (!alarmRuleId) {
    body = <AlertRuleWizard inline hideActions onActionsChange={setActions} onCancel={() => goBack()} onCreated={() => goBack("rules")} />;
  } else if (rulesQuery.isError) {
    body = <LoadFailed onRetry={() => { void rulesQuery.refetch(); }} />;
  } else if (!rulesQuery.data) {
    body = <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  } else if (!editRule) {
    body = <p className="py-12 text-center text-sm text-muted-foreground">{tt("alertRuleNotFound")}</p>;
  } else if (editRule.provisioningState !== "ACTIVE") {
    body = <p className="py-12 text-center text-sm text-muted-foreground">{tt("alertRuleEditNotActive")}</p>;
  } else {
    body = (
      <AlertRuleWizard
        key={editRule.id}
        editRule={editRule}
        inline
        hideActions
        onActionsChange={setActions}
        onCancel={() => goBack("rules")}
        onCreated={() => goBack("rules")}
      />
    );
  }
  const formReady = !alarmRuleId || (editRule?.provisioningState === "ACTIVE");

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads
       at those steps in every language, like Cloud Management's pages. */
    <div data-uniform-type>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/alarms"))} className="cursor-pointer">
              {tt("alarms")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => goBack()} className="cursor-pointer">
              {tt("alertTabRules")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tt("alertConditionBuilderDesc")}</p>
      </div>

      <Card className="p-4">
        {body}
      </Card>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            variant="ghost"
            onClick={actions?.tertiary?.onClick ?? (() => goBack())}
            className="min-w-[100px]"
          >
            {actions?.tertiary?.label ?? tt("cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={actions?.secondary?.onClick}
            disabled={!formReady || !actions?.secondary}
            className="min-w-[100px]"
          >
            {actions?.secondary?.label ?? tt("back")}
          </Button>
          <Button
            onClick={actions?.primary.onClick}
            disabled={!formReady || actions?.primary.disabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
          >
            {actions?.primary.label ?? tt("create")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertRuleForm;
