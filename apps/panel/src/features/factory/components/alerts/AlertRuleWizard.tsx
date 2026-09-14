import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateAlarmRuleMutation,
  type CreateRule,
  type DurationUnit,
  type LeafRule,
  type RuleExpression,
  type RuleOperator,
  type RuleTriggerType,
  type RuleValueType,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Badge } from "@/features/factory/components/ui/badge";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { AlertSeverity, ConditionOperator, LogicOperator } from "@/features/factory/types/alerts";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useDeviceTelemetry } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { UI_TO_API_SEVERITY } from "./alarmRuleMapping";

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

/* Only what the alarm-rule API can store. Escalation, notification and
   assignment steps used to follow, but the API has nowhere to keep them. */
const STEPS = ["scope", "conditions", "severity"] as const;

/* The API compares with GT/LT/EQ/NEQ/GTE/LTE; "between" is sent as GTE AND LTE.
   There is no rate-of-change operator, so it isn't offered. */
type WizardOperator = Exclude<ConditionOperator, "change_rate">;
const OPERATORS: WizardOperator[] = [">", "<", "=", "!=", ">=", "<=", "between"];

/* Only numbers can be ordered or ranged; the other value types can only be
   compared for equality. */
const operatorsFor = (valueType: RuleValueType): WizardOperator[] =>
  valueType === "NUMBER_LITERAL" ? OPERATORS : ["=", "!="];

const VALUE_TYPES: RuleValueType[] = ["NUMBER_LITERAL", "STRING_LITERAL", "BOOLEAN_LITERAL", "NULL"];
const valueTypeLabelKeys: Record<RuleValueType, string> = {
  NUMBER_LITERAL: "alertValueTypeNumber",
  STRING_LITERAL: "alertValueTypeString",
  BOOLEAN_LITERAL: "alertValueTypeBoolean",
  NULL: "alertValueTypeNull",
};
const OPERATOR_TO_API: Record<Exclude<WizardOperator, "between">, RuleOperator> = {
  ">": "GT", "<": "LT", "=": "EQ", "!=": "NEQ", ">=": "GTE", "<=": "LTE",
};

const TRIGGER_TYPES: RuleTriggerType[] = ["SIMPLE", "DURATION", "REPEATING"];
const triggerLabelKeys: Record<RuleTriggerType, string> = {
  SIMPLE: "alertTriggerSimple",
  DURATION: "alertTriggerDuration",
  REPEATING: "alertTriggerRepeating",
};

const UNITS: DurationUnit[] = ["SECONDS", "MINUTES", "HOURS", "DAYS"];
const unitLabelKeys: Partial<Record<DurationUnit, string>> = {
  SECONDS: "alertUnitSeconds",
  MINUTES: "alertUnitMinutes",
  HOURS: "alertUnitHours",
  DAYS: "alertUnitDays",
};

interface AlertRuleWizardProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  hideActions?: boolean;
  onActionsChange?: (a: {
    primary: { label: string; onClick: () => void; disabled?: boolean };
    secondary?: { label: string; onClick: () => void };
    tertiary?: { label: string; onClick: () => void };
  }) => void;
  onCancel?: () => void;
  onCreated?: () => void;
}

interface ConditionRow {
  id: string;
  tag: string;
  operator: WizardOperator;
  /** The JSON type `value` is sent as. */
  valueType: RuleValueType;
  value: string;
  valueTo: string;
}

interface ConditionGroupData {
  id: string;
  logic: LogicOperator;
  conditions: ConditionRow[];
}

const newCondition = (): ConditionRow => ({ id: `c${Date.now()}${Math.random().toString(36).slice(2, 5)}`, tag: "", operator: ">", valueType: "NUMBER_LITERAL", value: "", valueTo: "" });

const isNumber = (v: string) => v.trim() !== "" && Number.isFinite(Number(v));
const isPositiveInt = (v: string) => Number.isInteger(Number(v)) && Number(v) > 0;

/* The literal as the JSON type its valueType declares — the API requires the
   two to agree. */
const literal = (valueType: RuleValueType, raw: string): unknown => {
  switch (valueType) {
    case "NUMBER_LITERAL": return Number(raw);
    case "BOOLEAN_LITERAL": return raw === "true";
    case "NULL": return null;
    default: return raw;
  }
};

const leaf = (field: string, operator: RuleOperator, valueType: RuleValueType, raw: string): LeafRule => ({
  field, operator, valueType, value: literal(valueType, raw),
});

const conditionExpression = (c: ConditionRow): RuleExpression => {
  const field = c.tag.trim();
  return c.operator === "between"
    ? { combinator: "AND", rules: [leaf(field, "GTE", "NUMBER_LITERAL", c.value), leaf(field, "LTE", "NUMBER_LITERAL", c.valueTo)] }
    : leaf(field, OPERATOR_TO_API[c.operator], c.valueType, c.value);
};

/** Whether a condition row is complete for its value type. */
const conditionValid = (c: ConditionRow) => {
  if (!c.tag.trim()) return false;
  switch (c.valueType) {
    case "NUMBER_LITERAL": return isNumber(c.value) && (c.operator !== "between" || isNumber(c.valueTo));
    case "BOOLEAN_LITERAL": return c.value === "true" || c.value === "false";
    case "NULL": return true;
    default: return c.value !== "";
  }
};

/* Conditions inside a group join with that group's AND/OR. Each later group
   joins everything before it with its own AND/OR, left to right. */
const toExpression = (groups: ConditionGroupData[]): RuleExpression => {
  const groupExpression = (g: ConditionGroupData): RuleExpression =>
    g.conditions.length === 1
      ? conditionExpression(g.conditions[0])
      : { combinator: g.logic, rules: g.conditions.map(conditionExpression) };
  return groups
    .slice(1)
    .reduce<RuleExpression>((acc, g) => ({ combinator: g.logic, rules: [acc, groupExpression(g)] }), groupExpression(groups[0]));
};

export const AlertRuleWizard = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated }: AlertRuleWizardProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();
  const { items: devices, isLoading: devicesLoading } = useDevices();
  const createAlarmRule = useCreateAlarmRuleMutation();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Scope
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  // Step 2: Conditions
  const [triggerType, setTriggerType] = useState<RuleTriggerType>("SIMPLE");
  const [duration, setDuration] = useState("5");
  const [unit, setUnit] = useState<DurationUnit>("MINUTES");
  const [count, setCount] = useState("3");
  const [conditionGroups, setConditionGroups] = useState<ConditionGroupData[]>([
    { id: "g1", logic: "AND", conditions: [newCondition()] },
  ]);

  // Step 3: Severity
  const [severity, setSeverity] = useState<AlertSeverity>("medium");

  // Suggest telemetry keys the first selected device has actually reported.
  const { data: sampleTelemetry } = useDeviceTelemetry(selectedDevices[0], 24);
  const telemetryKeys = useMemo(() => Object.keys(sampleTelemetry ?? {}).sort(), [sampleTelemetry]);

  const addCondition = (groupId: string) => {
    setConditionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, conditions: [...g.conditions, newCondition()] } : g)));
  };

  const removeCondition = (groupId: string, condId: string) => {
    setConditionGroups((prev) => prev
      .map((g) => (g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== condId) } : g))
      .filter((g) => g.conditions.length > 0));
  };

  const updateCondition = (groupId: string, condId: string, field: keyof ConditionRow, value: string) => {
    setConditionGroups((prev) => prev.map((g) =>
      g.id === groupId ? { ...g, conditions: g.conditions.map((c) => (c.id === condId ? { ...c, [field]: value } : c)) } : g,
    ));
  };

  // Switching value type resets what no longer fits it: an ordering operator
  // (only numbers have one) and the typed-in literal.
  const changeValueType = (groupId: string, condId: string, valueType: RuleValueType) => {
    setConditionGroups((prev) => prev.map((g) =>
      g.id === groupId
        ? {
            ...g,
            conditions: g.conditions.map((c) => (c.id === condId
              ? {
                  ...c,
                  valueType,
                  operator: operatorsFor(valueType).includes(c.operator) ? c.operator : "=",
                  value: valueType === "BOOLEAN_LITERAL" ? "true" : "",
                  valueTo: "",
                }
              : c)),
          }
        : g,
    ));
  };

  const addConditionGroup = () => {
    setConditionGroups((prev) => [...prev, { id: `g${Date.now()}`, logic: "OR", conditions: [newCondition()] }]);
  };

  const fail = (key: string, step?: number) => {
    toast({ title: tt("error"), description: tt(key), variant: "destructive" });
    if (step !== undefined) setCurrentStep(step);
  };

  const handleCreate = async () => {
    if (!workspaceId) return fail("noWorkspaceSelected");
    if (!ruleName.trim()) return fail("alertRuleNeedName", 0);
    if (selectedDevices.length === 0) return fail("alertRuleNeedDevice", 0);
    const conditions = conditionGroups.flatMap((g) => g.conditions);
    if (conditions.length === 0 || !conditions.every(conditionValid)) return fail("alertRuleInvalidCondition", 1);
    if ((triggerType === "DURATION" && !isPositiveInt(duration)) || (triggerType === "REPEATING" && !isPositiveInt(count))) {
      return fail("alertRuleInvalidTrigger", 1);
    }

    const rule: CreateRule = {
      type: triggerType,
      expression: toExpression(conditionGroups),
      ...(triggerType === "DURATION" ? { duration: Number(duration), unit } : {}),
      ...(triggerType === "REPEATING" ? { count: Number(count) } : {}),
    };
    const body = {
      name: ruleName.trim(),
      description: ruleDescription.trim(),
      createRules: { [UI_TO_API_SEVERITY[severity]]: rule },
    };

    // A rule belongs to exactly one device, so each selected device gets its own.
    const results = await Promise.allSettled(
      selectedDevices.map((deviceId) => createAlarmRule.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, deviceId, ...body })),
    );
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    const created = results.length - failures.length;
    if (created > 0) {
      toast({ title: tt("success") || "Success", description: tt("alertRulesCreated").replace("{n}", String(created)) });
    }
    if (failures.length > 0) {
      const reason = failures[0].reason;
      toast({
        title: tt("alertRuleCreateFailed"),
        description: reason instanceof Error ? reason.message : undefined,
        variant: "destructive",
      });
      if (created === 0) return;
    }

    if (inline) {
      onCreated?.();
      return;
    }
    onOpenChange?.(false);
    setCurrentStep(0);
    setRuleName("");
    setRuleDescription("");
    setSelectedDevices([]);
  };

  const handleClose = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };

  // The parent keeps the action it was handed; route it through a ref so the
  // Create button always submits the form as it is now, not as it was when
  // the step last changed.
  const handleCreateRef = useRef(handleCreate);
  handleCreateRef.current = handleCreate;

  const isLastStep = currentStep === STEPS.length - 1;
  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: isLastStep
        ? { label: t("alertCreateRule"), onClick: () => { void handleCreateRef.current(); }, disabled: createAlarmRule.isPending }
        : { label: t("next"), onClick: () => setCurrentStep((p) => p + 1) },
      secondary: currentStep > 0 ? { label: t("back"), onClick: () => setCurrentStep((p) => p - 1) } : undefined,
      tertiary: { label: t("cancel"), onClick: handleClose },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, currentStep, createAlarmRule.isPending]);

  const stepLabels = [t("alertStepScope"), t("alertStepConditions"), t("alertStepSeverity")];

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const inner = (
    <>
      {!inline && (
        <SheetHeader>
          <SheetTitle>{t("alertCreateRule")}</SheetTitle>
        </SheetHeader>
      )}

      {/* Step Indicators */}
      <div className="flex items-center gap-1 mt-2 mb-4 overflow-x-auto pb-1">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              i === currentStep ? "bg-primary text-primary-foreground" :
              i < currentStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap hidden sm:inline ${i === currentStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {stepLabels[i]}
            </span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {/* Step 1: Scope */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("alertRuleName")}</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder={t("alertEnterRuleName")} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>{t("alertRuleDescription")}</Label>
              <Textarea value={ruleDescription} onChange={(e) => setRuleDescription(e.target.value)} placeholder={t("alertEnterRuleDescription")} rows={2} maxLength={500} />
            </div>
            <div className="space-y-2">
              <Label>{t("alertScopeDevices")}</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                {devicesLoading ? (
                  <p className="text-sm text-muted-foreground py-1">{tt("loading")}</p>
                ) : devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">{tt("alertNoDevices")}</p>
                ) : devices.map((dev) => (
                  <label key={dev.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={selectedDevices.includes(dev.id)}
                      onCheckedChange={(checked) => {
                        setSelectedDevices((prev) => (checked ? [...prev, dev.id] : prev.filter((d) => d !== dev.id)));
                      }}
                    />
                    <span className="text-sm">{dev.label || dev.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{tt("alertRulePerDevice")}</p>
            </div>
          </div>
        )}

        {/* Step 2: Conditions */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("alertConditionBuilderDesc")}</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tt("triggerType")}</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as RuleTriggerType)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((tp) => <SelectItem key={tp} value={tp}>{tt(triggerLabelKeys[tp])}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {triggerType === "REPEATING" && (
                <div className="space-y-1">
                  <Label className="text-xs">{tt("alertRepeatCount")}</Label>
                  <Input className="h-8" type="number" min={1} step={1} value={count} onChange={(e) => setCount(e.target.value)} dir="ltr" />
                </div>
              )}
            </div>
            {triggerType === "DURATION" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{tt("alertDurationValue")}</Label>
                  <Input className="h-8" type="number" min={1} step={1} value={duration} onChange={(e) => setDuration(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{tt("alertDurationUnit")}</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as DurationUnit)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{tt(unitLabelKeys[u] ?? u)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <datalist id="alert-rule-telemetry-keys">
              {telemetryKeys.map((k) => <option key={k} value={k} />)}
            </datalist>

            {conditionGroups.map((group, gi) => (
              <div key={group.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                {gi > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={group.logic} onValueChange={(v) => setConditionGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, logic: v as LogicOperator } : g)))}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">{t("alertConditionGroupLabel")}</span>
                  </div>
                )}
                {group.conditions.map((cond, ci) => (
                  <div key={cond.id} className="space-y-2 p-2 border rounded bg-card">
                    {ci > 0 && <Badge variant="outline" className="mb-1">{group.logic}</Badge>}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t("alertTelemetryTag")}</Label>
                        <Input
                          className="h-8"
                          list="alert-rule-telemetry-keys"
                          value={cond.tag}
                          onChange={(e) => updateCondition(group.id, cond.id, "tag", e.target.value)}
                          placeholder={t("alertSelectTag")}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("alertOperator")}</Label>
                        <Select value={cond.operator} onValueChange={(v) => updateCondition(group.id, cond.id, "operator", v)}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {operatorsFor(cond.valueType).map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{tt("alertValueType")}</Label>
                        <Select value={cond.valueType} onValueChange={(v) => changeValueType(group.id, cond.id, v as RuleValueType)}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {VALUE_TYPES.map((vt) => <SelectItem key={vt} value={vt}>{tt(valueTypeLabelKeys[vt])}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {cond.valueType !== "NULL" && (
                        <div>
                          <Label className="text-xs">{t("alertValue")}</Label>
                          {cond.valueType === "BOOLEAN_LITERAL" ? (
                            <Select value={cond.value} onValueChange={(v) => updateCondition(group.id, cond.id, "value", v)}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">true</SelectItem>
                                <SelectItem value="false">false</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              className="h-8"
                              type={cond.valueType === "NUMBER_LITERAL" ? "number" : "text"}
                              value={cond.value}
                              onChange={(e) => updateCondition(group.id, cond.id, "value", e.target.value)}
                              dir="ltr"
                            />
                          )}
                        </div>
                      )}
                      {cond.operator === "between" && (
                        <div>
                          <Label className="text-xs">{t("alertValueTo")}</Label>
                          <Input className="h-8" type="number" value={cond.valueTo} onChange={(e) => updateCondition(group.id, cond.id, "valueTo", e.target.value)} dir="ltr" />
                        </div>
                      )}
                    </div>
                    {(group.conditions.length > 1 || conditionGroups.length > 1) && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeCondition(group.id, cond.id)}>
                        <Trash2 className="h-3 w-3 me-1" />{t("delete")}
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addCondition(group.id)}>
                  <Plus className="h-3 w-3 me-1" />{t("alertAddCondition")}
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addConditionGroup}>
              <Plus className="h-3 w-3 me-1" />{t("alertAddConditionGroup")}
            </Button>
          </div>
        )}

        {/* Step 3: Severity + summary */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Label>{t("alertSelectSeverity")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["critical", "high", "medium", "low"] as AlertSeverity[]).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`p-4 rounded-lg border-2 text-start transition-colors ${
                    severity === sev ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <Badge className={`${severityColors[sev]} mb-2`}>
                    {tt(`alert${sev.charAt(0).toUpperCase() + sev.slice(1)}`)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{tt(`alertSeverity${sev.charAt(0).toUpperCase() + sev.slice(1)}Desc`)}</p>
                </button>
              ))}
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-2 mt-6">
              <p className="font-medium">{t("alertRuleSummary")}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">{t("name")}:</span>
                <span>{ruleName || "—"}</span>
                <span className="text-muted-foreground">{tt("triggerType")}:</span>
                <span>{tt(triggerLabelKeys[triggerType])}</span>
                <span className="text-muted-foreground">{t("alertSeverity")}:</span>
                <Badge className={`${severityColors[severity]} w-fit`}>{tt(`alert${severity.charAt(0).toUpperCase() + severity.slice(1)}`)}</Badge>
                <span className="text-muted-foreground">{t("alertScopeDevices")}:</span>
                <span>{tt("devicesCount").replace("{n}", String(selectedDevices.length))}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {!hideActions && (
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => (currentStep === 0 ? handleClose() : setCurrentStep((prev) => prev - 1))}>
            <BackIcon className="h-4 w-4 me-1" />
            {currentStep === 0 ? t("cancel") : t("back")}
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep((prev) => prev + 1)}>
              {t("next")}
              <NextIcon className="h-4 w-4 ms-1" />
            </Button>
          ) : (
            <Button onClick={() => { void handleCreate(); }} disabled={createAlarmRule.isPending}>{t("alertCreateRule")}</Button>
          )}
        </div>
      )}
    </>
  );

  if (inline) {
    return <div className="space-y-2">{inner}</div>;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-lg overflow-y-auto">
        {inner}
      </SheetContent>
    </Sheet>
  );
};
