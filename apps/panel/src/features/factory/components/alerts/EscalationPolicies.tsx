import { useState } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Switch } from "@/features/factory/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { Plus, Edit, Clock, Users, ArrowRight } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import { useEscalationsStore } from "@/features/factory/hooks/useAlertStore";

const policyI18n: Record<string, { name: string; desc: string }> = {
  "ESC-001": { name: "escPolStandardName", desc: "escPolStandardDesc" },
  "ESC-002": { name: "escPolCriticalName", desc: "escPolCriticalDesc" },
};
const roleI18n: Record<string, string> = {
  Operator: "roleOperator",
  Supervisor: "roleSupervisor",
  Admin: "roleAdmin",
  "External API": "roleExternalApi",
};

interface EscalationPoliciesProps {
  onCreateClick?: () => void;
}

export const EscalationPolicies = ({ onCreateClick }: EscalationPoliciesProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  /* Only what the user actually created (localStorage-backed). The two seeded
     ESC-001/ESC-002 policies that used to be concatenated here were invented —
     there is no escalation endpoint yet, so an empty store means no data. */
  const { items: policies } = useEscalationsStore();

  /* The switch was never persisted for the seeded policies either; this keeps
     it responsive without claiming a write the store cannot make. */
  const [enabledOverrides, setEnabledOverrides] = useState<Record<string, boolean>>({});
  const isEnabled = (id: string, fallback: boolean) => enabledOverrides[id] ?? fallback;
  const togglePolicy = (id: string, current: boolean) => {
    setEnabledOverrides(prev => ({ ...prev, [id]: !current }));
  };

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {policies.length} {t("alertEscalationPoliciesCount")}
        </p>
        <Button size="sm" onClick={onCreateClick} disabled={!onCreateClick} className="h-9 px-4 gap-2">
          <Plus className="h-4 w-4" />
          {t("alertCreateEscalation")}
        </Button>
      </div>


      {policies.length === 0 && <NoData />}

      <div className="grid gap-4">
        {policies.map(policy => {
          const k = policyI18n[policy.id];
          const name = k ? tt(k.name) : policy.name;
          const desc = k ? tt(k.desc) : policy.description;
          return (
          <Card key={policy.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled(policy.id, policy.enabled)}
                    onCheckedChange={() => togglePolicy(policy.id, isEnabled(policy.id, policy.enabled))}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t("alertSlaLabel")}: <strong>{policy.slaMinutes} {t("alertMinutesShort")}</strong></span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {policy.levels.map((level, i) => {
                  const roleKey = roleI18n[level.role];
                  const roleLabel = roleKey ? tt(roleKey) : level.role;
                  return (
                  <div key={level.level} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">L{level.level}: {roleLabel}</p>
                        <p className="text-xs text-muted-foreground">{level.delayMinutes === 0 ? t("alertImmediate") : `+${level.delayMinutes} ${t("alertMinutesShort")}`}</p>
                      </div>
                    </div>
                    {i < policy.levels.length - 1 && <ArrowRight className={`h-4 w-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />}
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
};
