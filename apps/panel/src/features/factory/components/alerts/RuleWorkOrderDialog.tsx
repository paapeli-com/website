import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alarmWorkOrderRuleService,
  useListWorkspaceMembersQuery,
  type WorkOrderApiPriority,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Label } from "@/features/factory/components/ui/label";
import { Switch } from "@/features/factory/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Select needs a non-empty value for "none of them". */
const AUTO = "auto";
const NOBODY = "nobody";
const NO_TEAM = "none";

const TEAMS = ["mechanical", "electrical", "instrumentation", "operations"] as const;
const TEAM_LABEL: Record<(typeof TEAMS)[number], string> = {
  mechanical: "teamMechanical",
  electrical: "teamElectrical",
  instrumentation: "teamInstrumentation",
  operations: "teamOperations",
};

export const ruleWorkOrderQueryKey = (workspaceId: string, alarmRuleId: string) =>
  ["alarmWorkOrderRule", workspaceId, PRODUCT_KEY, alarmRuleId];

interface RuleWorkOrderDialogProps {
  /** The alarm rule being set up; null keeps the dialog closed. */
  rule: { id: string; name: string } | null;
  onClose: () => void;
}

/** Whether an alarm rule raises a work order each time it fires, and for whom. */
export const RuleWorkOrderDialog = ({ rule, onClose }: RuleWorkOrderDialogProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId() ?? "";
  const open = !!rule;

  const setting = useQuery({
    queryKey: ruleWorkOrderQueryKey(workspaceId, rule?.id ?? ""),
    queryFn: () => alarmWorkOrderRuleService.get(workspaceId, PRODUCT_KEY, rule!.id),
    enabled: open && !!workspaceId,
  });
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100, open);
  const activeMembers = (members.data?.data ?? []).filter((m) => m.status === "ACTIVE");

  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState<string>(AUTO);
  const [assignee, setAssignee] = useState<string>(NOBODY);
  const [team, setTeam] = useState<string>(NO_TEAM);
  const [saving, setSaving] = useState(false);

  // Fill the form from the stored setting; a rule without one starts enabled.
  useEffect(() => {
    if (!open || setting.isLoading) return;
    const s = setting.data;
    setEnabled(s ? s.enabled : true);
    setPriority(s?.priority ?? AUTO);
    setAssignee(s?.assigneeUserId ?? NOBODY);
    setTeam(s?.assignedTeam ?? NO_TEAM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule?.id, setting.isLoading, setting.dataUpdatedAt]);

  const handleSave = async () => {
    if (!rule || saving) return;
    setSaving(true);
    try {
      // Turning it off for a rule that never had it leaves nothing to store.
      if (enabled || setting.data) {
        await alarmWorkOrderRuleService.put(workspaceId, PRODUCT_KEY, rule.id, {
          enabled,
          priority: priority === AUTO ? null : (priority as WorkOrderApiPriority),
          assigneeUserId: assignee === NOBODY ? null : assignee,
          assignedTeam: team === NO_TEAM ? null : team,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ruleWorkOrderQueryKey(workspaceId, rule.id) });
      toast({ title: tt("ruleWorkOrderSaved") });
      onClose();
    } catch (error) {
      toast({ title: tt("error"), description: apiErrorMessage(error, tt("error")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const busy = setting.isLoading || saving;
  // A team stored by hand through the API still shows, as it was written.
  const knownTeam = team === NO_TEAM || (TEAMS as readonly string[]).includes(team);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{tt("ruleWorkOrderTitle")}</DialogTitle>
          <DialogDescription>{rule?.name}</DialogDescription>
        </DialogHeader>

        {setting.isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            {apiErrorMessage(setting.error, tt("error"))}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="rule-work-order-enabled" className="text-sm font-medium">
                  {tt("ruleWorkOrderEnable")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{tt("ruleWorkOrderHint")}</p>
              </div>
              <Switch
                id="rule-work-order-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={busy}
              />
            </div>

            <div className={enabled ? "space-y-4" : "pointer-events-none space-y-4 opacity-50"}>
              <div>
                <Label className="text-xs">{tt("priority")}</Label>
                <Select value={priority} onValueChange={setPriority} disabled={busy || !enabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO}>{tt("ruleWorkOrderPriorityAuto")}</SelectItem>
                    <SelectItem value="CRITICAL">{tt("woPriorityCritical")}</SelectItem>
                    <SelectItem value="HIGH">{tt("woPriorityHigh")}</SelectItem>
                    <SelectItem value="MEDIUM">{tt("woPriorityMedium")}</SelectItem>
                    <SelectItem value="LOW">{tt("woPriorityLow")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{tt("ruleWorkOrderAssignee")}</Label>
                <Select value={assignee} onValueChange={setAssignee} disabled={busy || !enabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NOBODY}>{tt("ruleWorkOrderUnassigned")}</SelectItem>
                    {activeMembers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.displayName?.trim() || m.email || m.userId}
                      </SelectItem>
                    ))}
                    {/* Someone assigned earlier who is no longer listed stays selectable. */}
                    {assignee !== NOBODY && !activeMembers.some((m) => m.userId === assignee) && (
                      <SelectItem value={assignee}>{assignee}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{tt("assignedTeam")}</Label>
                <Select value={team} onValueChange={setTeam} disabled={busy || !enabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEAM}>{tt("ruleWorkOrderNoTeam")}</SelectItem>
                    {TEAMS.map((key) => (
                      <SelectItem key={key} value={key}>{tt(TEAM_LABEL[key])}</SelectItem>
                    ))}
                    {!knownTeam && <SelectItem value={team}>{team}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tt("cancel")}</Button>
          <Button onClick={handleSave} disabled={busy || setting.isError}>
            {saving ? tt("saving") : tt("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
