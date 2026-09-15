import { useState, useEffect, useMemo, useRef } from "react";
import {
  useGetEscalationChainsQueries,
  useGetWorkspaceAlarmRulesQuery,
  usePutEscalationChainMutation,
} from "@paapeli/api";
import { getCurrentUser, getCurrentUserId } from "@paapeli/brand/session";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/features/factory/components/ui/dialog";
import { Badge } from "@/features/factory/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useToast } from "@/features/factory/hooks/use-toast";

/* One step of the chain: whom to call, and how long to wait before calling. */
interface EscalationLevel {
  level: number;
  userId: string;
  /** "" while the field is cleared mid-edit; saved as 0. */
  delayMinutes: number | "";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Same page the Rules and Escalation tabs read, so they share the cache. */
const RULES_PAGE = 0;
const RULES_PAGE_SIZE = 100;

interface CreateEscalationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  hideActions?: boolean;
  onActionsChange?: (a: { primary: { label: string; onClick: () => void; disabled?: boolean }; secondary?: { label: string; onClick: () => void } }) => void;
  onCancel?: () => void;
  onCreated?: () => void;
  /** Edit mode: the rule whose existing chain is loaded and replaced. */
  editAlarmRuleId?: string;
}

export const CreateEscalationDialog = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated, editAlarmRuleId }: CreateEscalationDialogProps) => {
  const isEdit = !!editAlarmRuleId;

  const { t } = useLanguage();
  const tt = t as (k: string) => string;
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();

  /* A chain hangs off an alarm rule, and only an active rule accepts one. */
  const { data: rulesPage } = useGetWorkspaceAlarmRulesQuery(
    workspaceId ?? "", PRODUCT_KEY, RULES_PAGE, RULES_PAGE_SIZE,
  );
  const activeRules = useMemo(
    () => (rulesPage?.data ?? []).filter((r) => r.provisioningState === "ACTIVE"),
    [rulesPage],
  );
  const putChain = usePutEscalationChainMutation();

  /* With no member-list endpoint, the signed-in user is the only person a
     step can call — read once from the session token. */
  const currentUserId = useMemo(() => getCurrentUserId() ?? "", []);
  const currentUserLabel = useMemo(() => {
    const user = getCurrentUser();
    const who = user?.name || user?.email;
    return who ? `${tt("you")} · ${who}` : tt("you");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [alarmRuleId, setAlarmRuleId] = useState(editAlarmRuleId ?? "");

  /* Edit mode: load the rule's current chain and seed the form from it once,
     so a later refetch doesn't overwrite what the user has typed. Saving is
     the same PUT as creating — it replaces the chain atomically. */
  const [editChainQuery] = useGetEscalationChainsQueries(
    workspaceId ?? "", PRODUCT_KEY, editAlarmRuleId ? [editAlarmRuleId] : [],
  );
  const editChain = editChainQuery?.data;
  const seeded = useRef(false);
  /* Name, description and SLA are not stored by the API; they stay on the
     form as before but are not sent. */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slaMinutes, setSlaMinutes] = useState("60");
  const [levels, setLevels] = useState<EscalationLevel[]>([
    { level: 1, userId: currentUserId, delayMinutes: 0 },
  ]);

  useEffect(() => {
    if (!isEdit || seeded.current) return;
    const rule = activeRules.find((r) => r.id === editAlarmRuleId);
    if (!editChain || !rule) return;
    seeded.current = true;
    setName(rule.name);
    setDescription(rule.description ?? "");
    const steps = editChain.steps ?? [];
    if (steps.length > 0) {
      setLevels(steps.map((s, i) => ({
        level: i + 1,
        userId: s.actions?.[0]?.userId ?? currentUserId,
        delayMinutes: Math.round((s.delaySeconds ?? 0) / 60),
      })));
      setSlaMinutes(String(Math.round(steps.reduce((sum, s) => sum + (s.delaySeconds ?? 0), 0) / 60)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editChain, activeRules]);

  const handleAddLevel = () => {
    setLevels([...levels, { level: levels.length + 1, userId: currentUserId, delayMinutes: 15 }]);
  };

  const handleRemoveLevel = (level: number) => {
    setLevels(levels.filter(l => l.level !== level));
  };

  const handleUpdateLevel = (level: number, field: string, value: string | number) => {
    setLevels(levels.map(l => l.level === level ? { ...l, [field]: value } : l));
  };

  const handleCreate = async () => {
    if (!workspaceId) {
      toast({ title: tt("error"), description: tt("noWorkspaceSelected"), variant: "destructive" });
      return;
    }
    if (levels.some((l) => !UUID_RE.test(l.userId.trim()))) {
      toast({ title: tt("error"), description: tt("escalationInvalidUserId"), variant: "destructive" });
      return;
    }
    try {
      // Steps run in the order listed; each step's delay is the wait before it.
      await putChain.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        alarmRuleId,
        enabled: true,
        steps: levels.map((l) => ({
          delaySeconds: Math.max(0, Number(l.delayMinutes) || 0) * 60,
          actions: [{ actionType: "CALL", userId: l.userId.trim() }],
        })),
      });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: tt("error"), description: message || tt("escalationSaveFailed"), variant: "destructive" });
      return;
    }
    const ruleName = activeRules.find((r) => r.id === alarmRuleId)?.name ?? name.trim();
    toast(isEdit
      ? { title: tt("escalationUpdated"), description: ruleName }
      : { title: t("success"), description: t("alertCreatedToast").replace("{name}", ruleName) });
    if (inline) { onCreated?.(); return; }
    onOpenChange?.(false);
    setAlarmRuleId("");
    setName("");
    setDescription("");
    setSlaMinutes("60");
    setLevels([{ level: 1, userId: currentUserId, delayMinutes: 0 }]);
  };

  const handleCancel = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };

  const submitDisabled =
    !alarmRuleId || levels.length === 0 || levels.some((l) => !l.userId.trim()) || putChain.isPending;

  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: { label: isEdit ? tt("save") : t("create"), onClick: () => void handleCreate(), disabled: submitDisabled },
      secondary: { label: t("cancel"), onClick: handleCancel },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, alarmRuleId, name, levels, description, slaMinutes, submitDisabled, workspaceId, activeRules]);

  const inner = (
    <>
      {!inline && (
        <DialogHeader>
          <DialogTitle>{t("alertCreateEscalation")}</DialogTitle>
          <DialogDescription>
            {t("alertEscalationDescription")}
          </DialogDescription>
        </DialogHeader>
      )}

      <div className="space-y-3">
          {/* Alarm rule the chain is attached to */}
          <div className="space-y-2">
            <Label>{tt("alertRule")}</Label>
            <Select value={alarmRuleId} onValueChange={setAlarmRuleId} disabled={isEdit || activeRules.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={tt(activeRules.length === 0 ? "escalationNoActiveRules" : "escalationSelectRule")} />
              </SelectTrigger>
              <SelectContent>
                {activeRules.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input
              placeholder={t("alertEnterRuleName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t("alertRuleDescription")}</Label>
            <Textarea
              placeholder={t("alertEnterRuleDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* SLA */}
          <div className="space-y-2">
            <Label>SLA ({t("alertMinutes")})</Label>
            <Input
              type="number"
              value={slaMinutes}
              onChange={(e) => setSlaMinutes(e.target.value)}
            />
          </div>

          {/* Escalation Levels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("alertEscalationPoliciesCount")}</Label>
              <Button size="sm" variant="outline" onClick={handleAddLevel}>
                <Plus className="h-3 w-3 me-1" />
                {t("add")}
              </Button>
            </div>

            {levels.map((level, idx) => (
              <div key={level.level} className="grid grid-cols-3 gap-2 p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">{t("alertLevel")}</Label>
                  <div className="text-sm font-medium">{level.level}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{tt("escalationUserId")}</Label>
                  <Select
                    value={level.userId}
                    onValueChange={(v) => handleUpdateLevel(level.level, "userId", v)}
                    disabled={!currentUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tt("escalationCurrentUserUnavailable")} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserId && <SelectItem value={currentUserId}>{currentUserLabel}</SelectItem>}
                      {/* A loaded chain can call someone else; keep them selectable so saving doesn't drop them. */}
                      {level.userId && level.userId !== currentUserId && (
                        <SelectItem value={level.userId}>{level.userId.slice(0, 8)}…</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("alertMinutes")}</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={level.delayMinutes}
                      min={0}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleUpdateLevel(level.level, "delayMinutes", v === "" ? "" : Math.max(0, parseInt(v, 10) || 0));
                      }}
                      className="flex-1"
                    />
                    {idx > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveLevel(level.level)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="text-xs font-medium">{t("alertRuleSummary")}</p>
            <div className="flex flex-wrap gap-2">
              {levels.map(l => (
                <Badge key={l.level} variant="outline">
                  L{l.level}: {!l.userId ? "—" : l.userId === currentUserId ? currentUserLabel : `${l.userId.slice(0, 8)}…`} ({l.delayMinutes || 0}m)
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("slaUnit").replace("{n}", slaMinutes)}</p>
          </div>
      </div>

      {inline ? (
        hideActions ? null : (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>{t("cancel")}</Button>
            <Button onClick={() => void handleCreate()} disabled={submitDisabled}>{isEdit ? tt("save") : t("create")}</Button>
          </div>
        )
      ) : (
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{t("cancel")}</Button>
          <Button onClick={() => void handleCreate()} disabled={submitDisabled}>{isEdit ? tt("save") : t("create")}</Button>
        </DialogFooter>
      )}
    </>
  );

  if (inline) {
    return <div className="space-y-2">{inner}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {inner}
      </DialogContent>
    </Dialog>
  );
};

