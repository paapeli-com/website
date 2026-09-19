import { useMemo, useState } from "react";
import {
  useDeleteEscalationChainMutation,
  useGetEscalationChainsQueries,
  useGetWorkspaceAlarmRulesQuery,
  type AlarmEscalationChain,
  type AlarmRuleItem,
} from "@paapeli/api";
import type { EscalationPolicy } from "@/features/factory/types/alerts";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Switch } from "@/features/factory/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Plus, Edit, Clock, Users, ArrowRight, Trash2 } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { queryLoad, usePageLoad } from "@/shared/hooks/usePageLoad";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { LoadingOverlay } from "@/shared/components/LoadingOverlay";
import { useToast } from "@/features/factory/hooks/use-toast";

/* The chain API is addressed by rule id, not chain id, so each card keeps it. */
type ChainPolicy = EscalationPolicy & { alarmRuleId: string };

/* Same page the Rules tab reads, so the two share react-query's cache. */
const RULES_PAGE = 0;
const RULES_PAGE_SIZE = 100;

/* A chain belongs to one alarm rule, so the card is named after the rule.
   The API has no SLA, so the card's SLA is the time until the last step
   runs. There is no member lookup endpoint, so a step shows the ids of the
   users it calls where the role used to be. */
const toPolicy = (rule: AlarmRuleItem, chain: AlarmEscalationChain): ChainPolicy => {
  const steps = chain.steps ?? [];
  const totalSeconds = steps.reduce((sum, s) => sum + (s.delaySeconds ?? 0), 0);
  return {
    id: chain.id,
    alarmRuleId: rule.id,
    name: rule.name,
    description: rule.description ?? "",
    levels: steps.map((s, i) => ({
      level: i + 1,
      role: (s.actions ?? []).map((a) => a.userId).join(", "),
      delayMinutes: Math.round((s.delaySeconds ?? 0) / 60),
      notificationChannelIds: [],
    })),
    slaMinutes: Math.round(totalSeconds / 60),
    enabled: chain.enabled,
    createdAt: chain.createdAt,
  };
};

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
  /** Opens the edit form for the chain of this alarm rule. */
  onEditClick?: (alarmRuleId: string) => void;
}

export const EscalationPolicies = ({ onCreateClick, onEditClick }: EscalationPoliciesProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  /* Chains are fetched per alarm rule, so list the workspace's rules and ask
     for each active one's chain (only an active rule can have one). Rules
     without a chain, and failed requests, simply contribute no card. */
  const workspaceId = useWorkspaceId();
  const rulesQuery = useGetWorkspaceAlarmRulesQuery(
    workspaceId ?? "", PRODUCT_KEY, RULES_PAGE, RULES_PAGE_SIZE,
  );
  const rulesPage = rulesQuery.data;
  const rulesLoad = queryLoad(rulesQuery);
  const activeRules = useMemo(
    () => (rulesPage?.data ?? []).filter((r) => r.provisioningState === "ACTIVE"),
    [rulesPage],
  );
  const chainQueries = useGetEscalationChainsQueries(workspaceId ?? "", PRODUCT_KEY, activeRules.map((r) => r.id));
  const chainsLoading = rulesLoad.loading || !workspaceId || chainQueries.some((q) => q.isLoading);
  // Only the rules list can fail the tab; a failed chain request just drops its card.
  const pageLoad = usePageLoad({
    loading: chainsLoading,
    failed: rulesLoad.failed,
    onRetry: rulesQuery.refetch,
  });
  const chainsVersion = chainQueries.map((q) => q.dataUpdatedAt).join(",");
  const policies: ChainPolicy[] = useMemo(
    () => activeRules.flatMap((rule, i) => {
      const chain = chainQueries[i]?.data;
      return chain ? [toPolicy(rule, chain)] : [];
    }),
    // chainQueries is a new array every render; its data changes are what chainsVersion tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeRules, chainsVersion],
  );

  const { toast } = useToast();
  const deleteChain = useDeleteEscalationChainMutation();
  const [confirmDelete, setConfirmDelete] = useState<ChainPolicy | null>(null);
  /* The mutation invalidates this rule's chain query; the refetch answers
     404 → null, which drops the card. */
  const doDelete = async () => {
    if (!confirmDelete || !workspaceId) return;
    const policy = confirmDelete;
    try {
      await deleteChain.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, alarmRuleId: policy.alarmRuleId });
      toast({ title: tt("escalationDeleted"), description: policy.name });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: tt("error"), description: message || tt("error"), variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

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


      {pageLoad.status === "failed" ? (
        <LoadFailed onRetry={pageLoad.retry} />
      ) : pageLoad.status === "loading" ? (
        <div className="relative space-y-4">
          <div className="grid gap-4" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-72 max-w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            ))}
          </div>
          <LoadingOverlay className="items-center pt-0" />
        </div>
      ) : policies.length === 0 && <NoData message={tt("alertNoEscalationsCreateFirst")} />}

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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick?.(policy.alarmRuleId)}
                    disabled={!onEditClick}
                    aria-label={tt("edit")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(policy)}
                    aria-label={tt("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("escalationDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("escalationDeleteDesc")}{" "}
              <span className="font-medium text-foreground">{confirmDelete?.name ?? ""}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doDelete}
              disabled={deleteChain.isPending}
            >
              {tt("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
