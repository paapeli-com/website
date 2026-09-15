import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { CreateEscalationDialog } from "@/features/factory/components/alerts/CreateEscalationDialog";
import { localizedPath } from "@/features/factory/lib/localizedPath";

type Action = { label: string; onClick: () => void; disabled?: boolean };

const EscalationForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const tt = t as (k: string) => string;
  const goBack = (tab?: string) => navigate(lp(tab ? `/alarms?tab=${tab}` : "/alarms"));
  const [actions, setActions] = useState<{ primary: Action; secondary?: Action } | null>(null);
  // Present on /alarms/escalation/:alarmRuleId/edit — the same form, prefilled.
  const { alarmRuleId } = useParams<{ alarmRuleId?: string }>();
  const title = tt(alarmRuleId ? "escalationEdit" : "alertCreateEscalation");

  return (
    <>
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
              {tt("alertTabEscalation")}
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
        <p className="text-sm text-muted-foreground mt-1">
          {tt("escalationFormDesc")}
        </p>
      </div>

      <Card className="p-4 max-w-3xl">
        <CreateEscalationDialog
          key={alarmRuleId ?? "new"}
          inline
          hideActions
          editAlarmRuleId={alarmRuleId}
          onActionsChange={setActions}
          onCancel={() => goBack()}
          onCreated={() => goBack("escalation")}
        />
      </Card>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={actions?.secondary?.onClick ?? (() => goBack())}>
            {actions?.secondary?.label ?? tt("cancel")}
          </Button>
          <Button
            onClick={actions?.primary.onClick}
            disabled={actions?.primary.disabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {actions?.primary.label ?? tt(alarmRuleId ? "save" : "create")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default EscalationForm;
