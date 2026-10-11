import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alarmWorkOrderRuleService,
  useListWorkspaceMembersQuery,
  type AlarmSeverityFloor,
  type WorkOrderApiPriority,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Switch } from "@/features/factory/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useWorkOrderTemplates } from "@/features/factory/hooks/useWorkOrderTasks";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Select needs a non-empty value for "none of them". */
const AUTO = "auto";
const NOBODY = "nobody";
const NO_TEAM = "none";
const ANY_SEVERITY = "any";
const NO_TEMPLATE = "none";

/* The least severe alarm that still raises an order, most severe first. */
const SEVERITY_FLOORS: { value: AlarmSeverityFloor; label: string }[] = [
  { value: "CRITICAL", label: "ruleWoSevCritical" },
  { value: "MAJOR", label: "ruleWoSevMajor" },
  { value: "MINOR", label: "ruleWoSevMinor" },
  { value: "WARNING", label: "ruleWoSevWarning" },
];

const TEAMS = ["mechanical", "electrical", "instrumentation", "operations"] as const;
const TEAM_LABEL: Record<(typeof TEAMS)[number], string> = {
  mechanical: "teamMechanical",
  electrical: "teamElectrical",
  instrumentation: "teamInstrumentation",
  operations: "teamOperations",
};

/** The text of a number field as a whole number within its bounds; null when empty or not one. */
const wholeNumber = (text: string, min: number, max: number): number | null => {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : null;
};

export const ruleWorkOrderQueryKey = (workspaceId: string, alarmRuleId: string) =>
  ["alarmWorkOrderRule", workspaceId, PRODUCT_KEY, alarmRuleId];

interface RuleWorkOrderDialogProps {
  /** The alarm rule being set up; null keeps the dialog closed. */
  rule: { id: string; name: string } | null;
  onClose: () => void;
}

/** Whether an alarm rule raises work orders, for whom, and what keeps their number down. */
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
  const { templates } = useWorkOrderTemplates(open);

  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState<string>(AUTO);
  const [assignee, setAssignee] = useState<string>(NOBODY);
  const [team, setTeam] = useState<string>(NO_TEAM);
  const [template, setTemplate] = useState<string>(NO_TEMPLATE);
  const [minSeverity, setMinSeverity] = useState<string>(ANY_SEVERITY);
  const [mergeRepeats, setMergeRepeats] = useState(true);
  const [cooldown, setCooldown] = useState("0");
  const [dailyLimit, setDailyLimit] = useState("");
  const [saving, setSaving] = useState(false);

  // Fill the form from the stored setting; a rule without one starts enabled.
  useEffect(() => {
    if (!open || setting.isLoading) return;
    const s = setting.data;
    setEnabled(s ? s.enabled : true);
    setPriority(s?.priority ?? AUTO);
    setAssignee(s?.assigneeUserId ?? NOBODY);
    setTeam(s?.assignedTeam ?? NO_TEAM);
    setTemplate(s?.templateId ?? NO_TEMPLATE);
    setMinSeverity(s?.minSeverity ?? ANY_SEVERITY);
    setMergeRepeats(s ? s.mergeRepeats : true);
    setCooldown(String(s?.cooldownMinutes ?? 0));
    setDailyLimit(s?.dailyLimit ? String(s.dailyLimit) : "");
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
          minSeverity: minSeverity === ANY_SEVERITY ? null : (minSeverity as AlarmSeverityFloor),
          mergeRepeats,
          cooldownMinutes: wholeNumber(cooldown, 0, 43200) ?? 0,
          dailyLimit: wholeNumber(dailyLimit, 1, 1000),
          templateId: template === NO_TEMPLATE ? null : template,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
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

              <div>
                <Label className="text-xs">{tt("ruleWoTemplate")}</Label>
                <Select value={template} onValueChange={setTemplate} disabled={busy || !enabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}>{tt("woNoTemplate")}</SelectItem>
                    {templates.map((x) => (
                      <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">{tt("ruleWoTemplateHint")}</p>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-3">
                <div className="text-sm font-medium">{tt("ruleWoLimitsTitle")}</div>
                <div>
                  <Label className="text-xs">{tt("ruleWoMinSeverity")}</Label>
                  <Select value={minSeverity} onValueChange={setMinSeverity} disabled={busy || !enabled}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_SEVERITY}>{tt("ruleWoAnySeverity")}</SelectItem>
                      {SEVERITY_FLOORS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{tt(s.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="rule-work-order-merge" className="text-xs font-medium">
                      {tt("ruleWoMerge")}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">{tt("ruleWoMergeHint")}</p>
                  </div>
                  <Switch
                    id="rule-work-order-merge"
                    checked={mergeRepeats}
                    onCheckedChange={setMergeRepeats}
                    disabled={busy || !enabled}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{tt("ruleWoCooldown")} ({tt("ruleWoMinutes")})</Label>
                    <Input
                      type="number"
                      min={0}
                      max={43200}
                      dir="ltr"
                      value={cooldown}
                      onChange={(e) => setCooldown(e.target.value)}
                      disabled={busy || !enabled}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{tt("ruleWoDailyLimit")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      dir="ltr"
                      value={dailyLimit}
                      placeholder="∞"
                      onChange={(e) => setDailyLimit(e.target.value)}
                      disabled={busy || !enabled}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tt("ruleWoCooldownHint")} {tt("ruleWoDailyLimitHint")}
                </p>
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
