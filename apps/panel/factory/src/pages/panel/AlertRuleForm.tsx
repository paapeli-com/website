import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertRuleWizard } from "@/components/alerts/AlertRuleWizard";

type Action = { label: string; onClick: () => void; disabled?: boolean };

const AlertRuleForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const tt = t as (k: string) => string;
  const goBack = (tab?: string) => navigate(lp(tab ? `/alarms?tab=${tab}` : "/alarms"));
  const [actions, setActions] = useState<{ primary: Action; secondary?: Action; tertiary?: Action } | null>(null);

  return (
    <PanelLayout pageTitle={tt("alertCreateRule")}>
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
            <BreadcrumbPage>{tt("alertCreateRule")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{tt("alertCreateRule")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tt("alertConditionBuilderDesc")}</p>
      </div>

      <Card className="p-4">
        <AlertRuleWizard inline hideActions onActionsChange={setActions} onCancel={() => goBack()} onCreated={() => goBack("rules")} />
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
            disabled={!actions?.secondary}
            className="min-w-[100px]"
          >
            {actions?.secondary?.label ?? tt("back")}
          </Button>
          <Button
            onClick={actions?.primary.onClick}
            disabled={actions?.primary.disabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
          >
            {actions?.primary.label ?? tt("create")}
          </Button>
        </div>
      </div>
    </PanelLayout>
  );
};

export default AlertRuleForm;
