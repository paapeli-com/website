import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { Plus, Copy } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import type { AlertSeverity, AlertTemplate } from "@/features/factory/types/alerts";

const severityColors: Record<AlertSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

interface AlertTemplatesProps {
  onUseTemplate: () => void;
}

const tplI18n: Record<string, { name: string; desc: string; category: string }> = {
  "ATPL-001": { name: "tplTempThresholdName", desc: "tplTempThresholdDesc", category: "tplCatTemperature" },
  "ATPL-002": { name: "tplVibrationName", desc: "tplVibrationDesc", category: "tplCatVibration" },
  "ATPL-003": { name: "tplHeartbeatName", desc: "tplHeartbeatDesc", category: "tplCatConnectivity" },
  "ATPL-004": { name: "tplPressureName", desc: "tplPressureDesc", category: "tplCatPressure" },
};

const severityLabelKey: Record<AlertSeverity, string> = {
  critical: "alertCritical",
  high: "alertHigh",
  medium: "alertMedium",
  low: "alertLow",
};

const ruleTypeKey: Record<string, string> = {
  threshold: "ruleTypeThreshold",
  heartbeat: "ruleTypeHeartbeat",
};

export const AlertTemplates = ({ onUseTemplate }: AlertTemplatesProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;

  /* The four ATPL-* templates that used to render here were invented, and
     "Use template" never carried the choice into the rule form anyway — it
     just navigates. Nothing serves templates yet, so the tab says so. */
  const templates: AlertTemplate[] = [];

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("alertTemplatesDesc")}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 me-1" />
              {t("alertCreateTemplate")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
        </Tooltip>
      </div>

      {templates.length === 0 && <NoData />}

      <div className="grid sm:grid-cols-2 gap-4">
        {templates.map(template => {
          const k = tplI18n[template.id];
          const name = k ? tt(k.name) : template.name;
          const desc = k ? tt(k.desc) : template.description;
          const category = k ? tt(k.category) : template.category;
          const ruleType = ruleTypeKey[template.ruleType] ? tt(ruleTypeKey[template.ruleType]) : template.ruleType;
          return (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
                <Badge className={severityColors[template.severity]}>{tt(severityLabelKey[template.severity])}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{ruleType}</Badge>
                <Badge variant="outline" className="text-xs">{category}</Badge>
              </div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {template.conditionGroups[0]?.conditions.map(c => (
                  <span key={c.id} className="font-mono">
                    {c.telemetryTag} {c.operator} {c.value}
                  </span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={onUseTemplate}>
                <Copy className="h-3 w-3 me-1" />
                {t("alertUseTemplate")}
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
};
