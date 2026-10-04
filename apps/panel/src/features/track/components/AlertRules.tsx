import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Loader2, Plus, Trash2, Zap } from "lucide-react";
import {
  useCreateAlarmRuleMutation,
  useDeleteAlarmRuleMutation,
  useDeviceTelemetryKeysQuery,
  useGetWorkspaceAlarmRulesQuery,
  type AlarmRuleItem,
  type AlarmRuleProvisioningState,
  type CreateRule,
  type RuleOperator,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import type { TranslationKey } from "@/features/track/i18n/translations";
import { Button } from "@/features/track/components/ui/button";
import { Modal } from "@/features/track/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/track/components/ui/select";
import { NoData } from "@/features/track/components/NoData";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { useTrackers } from "@/features/track/lib/useTrackers";
import { cn } from "@/shared/lib/utils";

/* Alarm rules for this product's trackers — the same endpoints the Smart
   Factory rules use (GET /alarms/{ws}/gpsTracking/rule, POST and DELETE
   /alarms/{ws}/gpsTracking/rule/.../device/{deviceId}). A rule belongs to one
   device and fires on one telemetry reading crossing a number. */

/* One page covers a workspace: the API clamps the size to 1–100, pages count from 1. */
const RULES_PAGE = 1;
const RULES_PAGE_SIZE = 100;

/* The readings trackers commonly report (see lib/telemetry.ts). Offered only
   for a tracker that has not reported anything yet. */
const COMMON_KEYS = ["speed", "battery", "temperature", "altitude", "satellites"];

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "GT", label: ">" },
  { value: "GTE", label: "≥" },
  { value: "LT", label: "<" },
  { value: "LTE", label: "≤" },
  { value: "EQ", label: "=" },
  { value: "NEQ", label: "≠" },
];

/* ThingsBoard severities, most urgent first. */
const SEVERITIES: { value: string; label: TranslationKey; tone: string }[] = [
  { value: "CRITICAL", label: "sevCritical", tone: "bg-destructive/10 text-destructive" },
  { value: "MAJOR", label: "sevMajor", tone: "bg-destructive/10 text-destructive" },
  { value: "MINOR", label: "sevMinor", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: "WARNING", label: "sevWarning", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
];

const STATE_LABEL: Record<AlarmRuleProvisioningState, TranslationKey> = {
  PROVISIONING: "ruleStateProvisioning",
  ACTIVE: "ruleStateActive",
  FAILED: "ruleStateFailed",
  DELETING: "ruleStateDeleting",
};

const STATE_TONE: Record<AlarmRuleProvisioningState, string> = {
  PROVISIONING: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  DELETING: "bg-muted text-muted-foreground",
};

/** The most severe level a rule defines, with its stored trigger. */
const topLevel = (r: AlarmRuleItem) => {
  const levels = Object.entries(r.alarmRules ?? {});
  const rank = (s: string) => {
    const i = SEVERITIES.findIndex((x) => x.value === s.toUpperCase());
    return i === -1 ? SEVERITIES.length : i;
  };
  levels.sort(([a], [b]) => rank(a) - rank(b));
  const [severity, rule] = levels[0] ?? [];
  return severity ? { severity: severity.toUpperCase(), rule } : null;
};

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export function AlertRules() {
  const { t } = useLanguage();
  const workspaceId = useActiveWorkspaceId();
  const { trackers } = useTrackers();
  const trackerName = (id: string) => trackers.find((d) => d.id === id)?.name ?? t("unknownDevice");

  // Creating and deleting are asynchronous server-side, so poll while any
  // rule is on its way in or out.
  const [inFlight, setInFlight] = useState(false);
  const rulesQuery = useGetWorkspaceAlarmRulesQuery(workspaceId ?? "", PRODUCT_KEY, RULES_PAGE, RULES_PAGE_SIZE, {
    refetchInterval: inFlight ? 5000 : false,
  });
  const rules = useMemo(() => rulesQuery.data?.data ?? [], [rulesQuery.data]);
  useEffect(() => {
    setInFlight(rules.some((r) => r.provisioningState === "PROVISIONING" || r.provisioningState === "DELETING"));
  }, [rules]);

  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<AlarmRuleItem | null>(null);
  const deleteRule = useDeleteAlarmRuleMutation();

  const doDelete = async () => {
    if (!confirm || !workspaceId) return;
    try {
      await deleteRule.mutateAsync({
        workspaceId, productKey: PRODUCT_KEY, alarmRuleId: confirm.id, deviceId: confirm.deviceId,
      });
      toast.success(t("ruleDeleted"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("ruleDeleted")));
    } finally {
      setConfirm(null);
    }
  };

  if (rulesQuery.isError) return <LoadFailed onRetry={() => void rulesQuery.refetch()} />;
  const loading = rulesQuery.isLoading || !workspaceId;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          {t("newRule")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        {!loading && rules.length === 0 && <NoData size="lg" className="rounded-2xl border border-border bg-card" />}
        {!loading &&
          rules.map((r) => {
            const top = topLevel(r);
            const sev = SEVERITIES.find((s) => s.value === top?.severity);
            const TriggerIcon = top?.rule.triggerType === "DURATION" ? Clock : Zap;
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", sev?.tone ?? "bg-muted text-muted-foreground")}>
                  <TriggerIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-sm font-semibold">{r.name}</p>
                  <p dir="auto" className="truncate text-xs text-muted-foreground">{trackerName(r.deviceId)}</p>
                  {top?.rule.triggerExpression && (
                    <p dir="ltr" className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                      {top.rule.triggerExpression.replace(/^return\s*/, "")}
                      {top.rule.triggerType === "DURATION" && top.rule.value ? ` · ${top.rule.value} ${t("minutes")}` : ""}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {sev && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sev.tone)}>{t(sev.label)}</span>
                    )}
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATE_TONE[r.provisioningState])}>
                      {t(STATE_LABEL[r.provisioningState])}
                    </span>
                  </div>
                  {r.provisioningState === "FAILED" && r.lastError && (
                    <p className="mt-1 text-xs text-destructive">{r.lastError}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  disabled={r.provisioningState === "DELETING"}
                  onClick={() => setConfirm(r)}
                  aria-label={t("deleteRule")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
      </div>

      <RuleForm open={formOpen} onClose={() => setFormOpen(false)} />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={t("deleteRule")}>
        <p className="text-sm text-muted-foreground">
          {t("deleteRuleConfirm")} <span dir="auto" className="font-medium text-foreground">{confirm?.name}</span>
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>{t("cancel")}</Button>
          <Button variant="destructive" onClick={doDelete} disabled={deleteRule.isPending}>{t("deleteRule")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function RuleForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const workspaceId = useActiveWorkspaceId();
  const { trackers } = useTrackers();
  const createRule = useCreateAlarmRuleMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [field, setField] = useState("speed");
  const [operator, setOperator] = useState<RuleOperator>("GT");
  const [value, setValue] = useState("");
  const [severity, setSeverity] = useState("MAJOR");
  const [durationOn, setDurationOn] = useState(false);
  const [minutes, setMinutes] = useState("5");

  // Start on the first tracker; reset everything each time the form opens.
  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setDeviceId(trackers[0]?.id ?? "");
    setField("speed");
    setOperator("GT");
    setValue("");
    setSeverity("MAJOR");
    setDurationOn(false);
    setMinutes("5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const keysQuery = useDeviceTelemetryKeysQuery(workspaceId ?? "", PRODUCT_KEY, deviceId, open);
  const reported = keysQuery.data ?? [];
  const keyOptions = reported.length > 0 ? reported : COMMON_KEYS;
  // A key the newly chosen tracker does not report cannot stay selected.
  useEffect(() => {
    if (!keyOptions.includes(field)) setField(keyOptions[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyOptions.join(",")]);

  const numeric = value.trim() !== "" && Number.isFinite(Number(value));
  const durationValid = !durationOn || (Number.isInteger(Number(minutes)) && Number(minutes) > 0);
  const valid = !!name.trim() && !!deviceId && !!field.trim() && numeric && durationValid;

  const submit = async () => {
    if (!valid || !workspaceId) return void toast.error(t("ruleIncomplete"));
    const rule: CreateRule = {
      expression: { field: field.trim(), operator, value: Number(value), valueType: "NUMBER_LITERAL" },
      type: durationOn ? "DURATION" : "SIMPLE",
      ...(durationOn ? { duration: Number(minutes), unit: "MINUTES" as const } : {}),
    };
    try {
      await createRule.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        deviceId,
        name: name.trim(),
        // The gateway requires a description and rejects a blank or missing
        // one with a bare 400, so an empty box sends the rule's own name.
        description: description.trim() || name.trim(),
        createRules: { [severity]: rule },
      });
      toast.success(t("ruleCreated"));
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, t("ruleCreateFailed")));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("newRule")} className="max-w-lg" closeOnBackdrop={false}>
      {trackers.length === 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{t("noTrackersForRule")}</p>
          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="rule-name" className="mb-1.5 block text-sm font-medium">{t("ruleName")}</label>
            <input id="rule-name" dir="auto" value={name} maxLength={255} onChange={(e) => setName(e.target.value)}
              placeholder={t("ruleNamePlaceholder")} className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("ruleDevice")}</label>
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {trackers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("ruleCondition")}</label>
            <div dir="ltr" className="grid grid-cols-[1fr_auto_1fr] gap-2">
              {/* The readings this tracker has actually sent. Until it has sent
                  any (or while they load) the common ones are offered. */}
              <Select value={field} onValueChange={setField}>
                <SelectTrigger className="h-11 rounded-xl font-mono text-xs" aria-label={t("telemetryKey")}>
                  <SelectValue placeholder={t("telemetryKey")} />
                </SelectTrigger>
                <SelectContent>
                  {keyOptions.map((k) => <SelectItem key={k} value={k} className="font-mono text-xs">{k}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={operator} onValueChange={(v) => setOperator(v as RuleOperator)}>
                <SelectTrigger className="h-11 w-16 rounded-xl" aria-label="operator"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
                aria-label={t("ruleValue")} placeholder={t("ruleValue")} className={cn(inputClass, "font-mono text-xs")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("severity")}</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{t(s.label)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("ruleTrigger")}</label>
              <div className="flex gap-2">
                <Select value={durationOn ? "duration" : "now"} onValueChange={(v) => setDurationOn(v === "duration")}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">{t("triggerImmediate")}</SelectItem>
                    <SelectItem value="duration">{t("triggerDuration")}</SelectItem>
                  </SelectContent>
                </Select>
                {durationOn && (
                  <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
                    aria-label={t("minutes")} className={cn(inputClass, "w-20 text-center")} />
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="rule-desc" className="mb-1.5 block text-sm font-medium">
              {t("description")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
            </label>
            <textarea id="rule-desc" dir="auto" rows={2} maxLength={500} value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-w-0 resize-y rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={createRule.isPending}>{t("cancel")}</Button>
            <Button onClick={submit} disabled={!valid || createRule.isPending}>
              {createRule.isPending && <Loader2 className="size-4 animate-spin" />}
              {createRule.isPending ? t("creating") : t("create")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
