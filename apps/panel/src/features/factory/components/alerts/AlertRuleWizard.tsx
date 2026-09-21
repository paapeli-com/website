import { useState, useEffect, useMemo, useRef } from "react";
import {
  useCreateAlarmRuleMutation,
  type CreateRule,
  type LeafRule,
  type RuleExpression,
  type RuleOperator,
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
import { Plus, Trash2, ChevronLeft, ChevronRight, DatabaseZap } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AlertRuleWizardStep, ConditionOperator, AlertSeverity, RuleType, LogicOperator } from "@/features/factory/types/alerts";
import type { TranslationKey } from "@/features/factory/i18n/translations";
import { useChannelsStore, useEscalationsStore } from "@/features/factory/hooks/useAlertStore";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useDeviceTelemetry } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { UI_TO_API_SEVERITY } from "./alarmRuleMapping";

/* An empty list the user can fix themselves: says what is missing and, when
   given an action, links to where it's created. Laid out like NoData. */
const EmptyState = ({ message, action }: { message: string; action?: { label: string; onClick: () => void } }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
    <DatabaseZap className="h-7 w-7 text-muted-foreground/40" />
    <p className="text-sm text-muted-foreground">{message}</p>
    {action && (
      <Button variant="outline" size="sm" className="mt-1" onClick={action.onClick}>
        <Plus className="h-3 w-3 me-1" />{action.label}
      </Button>
    )}
  </div>
);

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const STEPS: AlertRuleWizardStep[] = ['scope', 'conditions', 'severity', 'escalation', 'notifications', 'assignment'];

/* What each rule template fills in. The ids match RULE_TEMPLATES in
   AlertTemplates.tsx; a template that names no preset simply opens an empty
   form, which is the old behaviour and no worse than it was. */
const RULE_TEMPLATE_PRESETS: Record<string, { nameKey: string; tag: string; operator: ConditionOperator }> = {
  temperature: { nameKey: "tplHighTempName", tag: "temperature", operator: ">" },
  humidity: { nameKey: "tplHighHumidityName", tag: "humidity", operator: ">" },
};

/* Each rule type paired with the English term it is named after. Threshold,
   Heartbeat and the rest are what the docs and the API call them, so outside
   English the dropdown carries both: the translation to read, and the English
   to recognise it by. */
const RULE_TYPES: { value: RuleType; key: TranslationKey; en: string }[] = [
  { value: 'threshold', key: 'alertTypeThreshold', en: 'Threshold' },
  { value: 'condition', key: 'alertTypeCondition', en: 'Condition' },
  { value: 'time_window', key: 'alertTypeTimeWindow', en: 'Time Window' },
  { value: 'device_state', key: 'alertTypeDeviceState', en: 'Device State' },
  { value: 'heartbeat', key: 'alertTypeHeartbeat', en: 'Heartbeat' },
  { value: 'anomaly', key: 'alertTypeAnomaly', en: 'AI Anomaly' },
  { value: 'cross_device', key: 'alertTypeCrossDevice', en: 'Cross-Device' },
];

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
  operator: ConditionOperator;
  /** The JSON type `value` is sent to the API as. */
  valueType: RuleValueType;
  value: string;
  valueTo: string;
  timeWindow: string;
}

interface ConditionGroupData {
  id: string;
  logic: LogicOperator;
  conditions: ConditionRow[];
}

/* ---- Mapping the builder onto the alarm-rule API ---------------------------
   Only rule name, description, devices, conditions (incl. time window) and
   severity are sent. Rule type, device type, location, escalation,
   notifications and assignment have no API yet and stay mock. */

const OPERATOR_TO_API: Partial<Record<ConditionOperator, RuleOperator>> = {
  '>': 'GT', '<': 'LT', '=': 'EQ', '!=': 'NEQ', '>=': 'GTE', '<=': 'LTE',
};

const VALUE_TYPES: RuleValueType[] = ['NUMBER_LITERAL', 'STRING_LITERAL', 'BOOLEAN_LITERAL', 'NULL'];
const valueTypeLabelKeys: Record<RuleValueType, string> = {
  NUMBER_LITERAL: 'alertValueTypeNumber',
  STRING_LITERAL: 'alertValueTypeString',
  BOOLEAN_LITERAL: 'alertValueTypeBoolean',
  NULL: 'alertValueTypeNull',
};

/* Only numbers can be ordered, ranged or rated; other types compare for equality. */
const isOperatorAllowed = (op: ConditionOperator, valueType: RuleValueType) =>
  valueType === 'NUMBER_LITERAL' || op === '=' || op === '!=';

const isNumber = (v: string) => v.trim() !== '' && Number.isFinite(Number(v));

/* The literal as the JSON type its valueType declares — the API requires the two to agree. */
const literal = (valueType: RuleValueType, raw: string): unknown => {
  switch (valueType) {
    case 'NUMBER_LITERAL': return Number(raw);
    case 'BOOLEAN_LITERAL': return raw === 'true';
    case 'NULL': return null;
    default: return raw;
  }
};

const leaf = (field: string, operator: RuleOperator, valueType: RuleValueType, raw: string): LeafRule => ({
  field, operator, valueType, value: literal(valueType, raw),
});

const conditionExpression = (c: ConditionRow): RuleExpression => {
  const field = c.tag.trim();
  return c.operator === 'between'
    ? { combinator: 'AND', rules: [leaf(field, 'GTE', 'NUMBER_LITERAL', c.value), leaf(field, 'LTE', 'NUMBER_LITERAL', c.valueTo)] }
    : leaf(field, OPERATOR_TO_API[c.operator]!, c.valueType, c.value);
};

/** Whether a condition row is complete for its value type. */
const conditionValid = (c: ConditionRow) => {
  if (!c.tag.trim()) return false;
  switch (c.valueType) {
    case 'NUMBER_LITERAL': return isNumber(c.value) && (c.operator !== 'between' || isNumber(c.valueTo));
    case 'BOOLEAN_LITERAL': return c.value === 'true' || c.value === 'false';
    case 'NULL': return true;
    default: return c.value !== '';
  }
};

/* Conditions inside a group join with that group's AND/OR; each later group
   joins everything before it with its own AND/OR, left to right. */
const toExpression = (groups: ConditionGroupData[]): RuleExpression => {
  const groupExpression = (g: ConditionGroupData): RuleExpression =>
    g.conditions.length === 1
      ? conditionExpression(g.conditions[0])
      : { combinator: g.logic, rules: g.conditions.map(conditionExpression) };
  const nonEmpty = groups.filter(g => g.conditions.length > 0);
  return nonEmpty
    .slice(1)
    .reduce<RuleExpression>((acc, g) => ({ combinator: g.logic, rules: [acc, groupExpression(g)] }), groupExpression(nonEmpty[0]));
};

export const AlertRuleWizard = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated }: AlertRuleWizardProps) => {
  const { t, isRTL, language } = useLanguage();
  const { toast } = useToast();
  const tt = t as (k: string) => string;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceId = useWorkspaceId();
  const { items: devices, isLoading: devicesLoading } = useDevices();
  const createAlarmRule = useCreateAlarmRuleMutation();
  /* Steps 4 and 5 pick from what the user has actually created. They used to
     offer the seeded ESC and CH entries, so a rule could be saved pointing at
     an escalation policy and channels that existed nowhere but this array. */
  const { items: escalationPolicies } = useEscalationsStore();
  const { items: notificationChannels } = useChannelsStore();
  const [currentStep, setCurrentStep] = useState(0);

  /* A template picked on the Rules tab arrives as ?template=. It fills in the
     tag and the comparison and nothing else: the device and the threshold are
     the two things only the reader knows, and the templates page says so. */
  const templateId = searchParams.get("template");
  const preset = templateId ? RULE_TEMPLATE_PRESETS[templateId] : undefined;

  // Step 1: Scope
  const [ruleName, setRuleName] = useState(() => (preset ? tt(preset.nameKey) : ""));
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("threshold");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  // Step 2: Conditions
  const [conditionGroups, setConditionGroups] = useState<ConditionGroupData[]>([
    {
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        tag: preset?.tag ?? '',
        operator: preset?.operator ?? '>',
        valueType: 'NUMBER_LITERAL' as RuleValueType,
        value: '',
        valueTo: '',
        timeWindow: '',
      }],
    },
  ]);

  // Step 3: Severity
  const [severity, setSeverity] = useState<AlertSeverity>("medium");

  // Step 4: Escalation
  const [escalationPolicyId, setEscalationPolicyId] = useState("");

  // Step 5: Notifications. Nothing is pre-selected: the old 'NC-001' default
  // was a sample channel id, counted in the summary though it never existed.
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // Step 6: Assignment
  const [assignedTeam, setAssignedTeam] = useState("");

  const addCondition = (groupId: string) => {
    setConditionGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, conditions: [...g.conditions, { id: `c${Date.now()}`, tag: '', operator: '>' as ConditionOperator, valueType: 'NUMBER_LITERAL' as RuleValueType, value: '', valueTo: '', timeWindow: '' }] }
        : g
    ));
  };

  const removeCondition = (groupId: string, condId: string) => {
    setConditionGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, conditions: g.conditions.filter(c => c.id !== condId) }
        : g
    ));
  };

  const updateCondition = (groupId: string, condId: string, field: keyof ConditionRow, value: string) => {
    setConditionGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, conditions: g.conditions.map(c => c.id === condId ? { ...c, [field]: value } : c) }
        : g
    ));
  };

  // Switching value type resets what no longer fits it: an operator only
  // numbers have, and the typed-in literal.
  const changeValueType = (groupId: string, condId: string, valueType: RuleValueType) => {
    setConditionGroups(prev => prev.map(g =>
      g.id === groupId
        ? {
            ...g,
            conditions: g.conditions.map(c => c.id === condId
              ? {
                  ...c,
                  valueType,
                  operator: isOperatorAllowed(c.operator, valueType) ? c.operator : '=',
                  value: valueType === 'BOOLEAN_LITERAL' ? 'true' : '',
                  valueTo: '',
                }
              : c),
          }
        : g
    ));
  };

  const removeConditionGroup = (groupId: string) => {
    setConditionGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const addConditionGroup = () => {
    setConditionGroups(prev => [...prev, {
      id: `g${Date.now()}`,
      logic: 'OR',
      conditions: [{ id: `c${Date.now()}`, tag: '', operator: '>' as ConditionOperator, valueType: 'NUMBER_LITERAL' as RuleValueType, value: '', valueTo: '', timeWindow: '' }],
    }]);
  };

  const fail = (key: string, step?: number) => {
    toast({ title: tt("error"), description: tt(key), variant: "destructive" });
    if (step !== undefined) setCurrentStep(step);
  };

  const handleCreate = async () => {
    if (!workspaceId) return fail("noWorkspaceSelected");
    if (selectedDevices.length === 0) return fail("alertRuleNeedDevice", 0);
    const conditions = conditionGroups.flatMap(g => g.conditions);
    if (conditions.some(c => c.operator === 'change_rate')) return fail("alertOperatorUnsupported", 1);
    if (conditions.length === 0 || !conditions.every(conditionValid)) return fail("alertRuleInvalidCondition", 1);

    // The API has one trigger per severity. A time window on any condition
    // makes it a DURATION rule held for the longest window (in minutes).
    const windowMinutes = Math.max(0, ...conditions.map(c => Number(c.timeWindow) || 0));
    const rule: CreateRule = {
      type: windowMinutes > 0 ? 'DURATION' : 'SIMPLE',
      expression: toExpression(conditionGroups),
      ...(windowMinutes > 0 ? { duration: Math.ceil(windowMinutes), unit: 'MINUTES' as const } : {}),
    };
    const name = ruleName.trim() || "Untitled Rule";
    // Description is optional here; an empty one is omitted, because the
    // gateway rejects the field when it is present but blank.
    const description = ruleDescription.trim();
    const body = {
      name,
      ...(description ? { description } : {}),
      createRules: { [UI_TO_API_SEVERITY[severity]]: rule },
    };

    // A rule belongs to exactly one device, so each selected device gets its own.
    const results = await Promise.allSettled(
      selectedDevices.map(deviceId => createAlarmRule.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, deviceId, ...body })),
    );
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    const createdCount = results.length - failures.length;
    if (createdCount > 0) {
      toast({ title: t("success") || "Success", description: `${name} — ${tt("alertRulesCreated").replace("{n}", String(createdCount))}` });
    }
    if (failures.length > 0) {
      const reason = failures[0].reason;
      toast({ title: tt("alertRuleCreateFailed"), description: reason instanceof Error ? reason.message : undefined, variant: "destructive" });
      if (createdCount === 0) return;
    }
    if (inline) {
      onCreated?.();
      return;
    }
    onOpenChange?.(false);
    setCurrentStep(0);
    setRuleName('');
    setRuleDescription('');
  };

  const handleClose = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };


  // The parent keeps the action it was handed, so route Create through a ref:
  // it must submit the form as it is now, not as it was when the step changed.
  const handleCreateRef = useRef(handleCreate);
  handleCreateRef.current = handleCreate;

  const isLastStep = currentStep === STEPS.length - 1;
  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: isLastStep
        ? { label: t("alertCreateRule"), onClick: () => { void handleCreateRef.current(); }, disabled: createAlarmRule.isPending }
        : { label: t("next"), onClick: () => setCurrentStep(p => p + 1) },
      secondary: currentStep > 0 ? { label: t("back"), onClick: () => setCurrentStep(p => p - 1) } : undefined,
      tertiary: { label: t("cancel"), onClick: handleClose },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, currentStep, ruleName, ruleType, severity, createAlarmRule.isPending]);

  const stepLabels = [
    t("alertStepScope"),
    t("alertStepConditions"),
    t("alertStepSeverity"),
    t("alertStepEscalation"),
    t("alertStepNotifications"),
    t("alertStepAssignment"),
  ];

  // Keys the first selected device has actually reported come first; the
  // common tags stay available for devices that haven't reported yet.
  const { data: sampleTelemetry } = useDeviceTelemetry(selectedDevices[0], 24);
  const telemetryTags = useMemo(() => {
    const common = ['temperature', 'pressure', 'vibration_rms', 'humidity', 'flow_rate', 'power_consumption', 'device_status', 'heartbeat'];
    return Array.from(new Set([...Object.keys(sampleTelemetry ?? {}).sort(), ...common]));
  }, [sampleTelemetry]);
  const operators: ConditionOperator[] = ['>', '<', '=', '!=', '>=', '<=', 'between', 'change_rate'];

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const inner = (
    /* data-uniform-type on the wizard itself, not just on the page around it:
       the type scale is a property of this form, and it reads the same wherever
       the form is rendered. Without it the unscoped [lang="fa"]/[lang="ar"]
       rules in src/index.css outrank the Tailwind steps and every card here
       comes out a size larger in Persian and Arabic. */
    <div data-uniform-type>
        {!inline && (
          <SheetHeader>
            <SheetTitle>{t("alertCreateRule")}</SheetTitle>
          </SheetHeader>
        )}



        {/* Step Indicators. Each one jumps to its step: Next never gated a
            step either, and the form is checked on Create, which sends you
            back to whichever step is short. The number and the label are one
            button, so the whole thing is a target and reachable by keyboard. */}
        <nav className="flex items-center gap-1 mt-2 mb-4 overflow-x-auto pb-1" aria-label={t("alertCreateRule")}>
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentStep(i)}
                aria-current={i === currentStep ? 'step' : undefined}
                className="flex items-center gap-1 cursor-pointer rounded-full transition-opacity hover:opacity-75 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  i === currentStep ? 'bg-primary text-primary-foreground' :
                  i < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <span className={`text-xs whitespace-nowrap hidden sm:inline ${i === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {stepLabels[i]}
                </span>
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
            </div>
          ))}
        </nav>

        {/* Step Content */}
        <div className="space-y-3">
          {/* Step 1: Scope */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("alertRuleName")}</Label>
                <Input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder={t("alertEnterRuleName")} />
              </div>
              <div className="space-y-2">
                <Label>{t("alertRuleDescription")}</Label>
                <Textarea value={ruleDescription} onChange={e => setRuleDescription(e.target.value)} placeholder={t("alertEnterRuleDescription")} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t("alertRuleType")}</Label>
                <Select value={ruleType} onValueChange={v => setRuleType(v as RuleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map(rt => {
                      const label = t(rt.key);
                      return (
                        <SelectItem key={rt.value} value={rt.value}>
                          {language === 'en' ? label : `${label} (${rt.en})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("alertScopeDevices")}</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {devicesLoading && <span className="text-sm text-muted-foreground">{tt("loading")}</span>}
                  {!devicesLoading && devices.length === 0 && <EmptyState message={tt("alertNoDevicesYet")} />}
                  {devices.map(dev => {
                    const id = dev.id;
                    return (
                      <label key={id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <Checkbox
                          checked={selectedDevices.includes(id)}
                          onCheckedChange={(checked) => {
                            setSelectedDevices(prev => checked ? [...prev, id] : prev.filter(d => d !== id));
                          }}
                        />
                        <span className="text-sm">{dev.label || dev.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Conditions */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* A Label, like every other step opens with. It used to be a
                  muted paragraph, which left this one step reading lighter and
                  greyer than the five around it. */}
              <Label>{t("alertConditionBuilderDesc")}</Label>
              {conditionGroups.map((group, gi) => (
                <div key={group.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  {gi > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={group.logic} onValueChange={v => setConditionGroups(prev => prev.map(g => g.id === group.id ? { ...g, logic: v as LogicOperator } : g))}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">{t("alertConditionGroupLabel")}</span>
                      <Button variant="ghost" size="sm" className="ms-auto text-destructive" onClick={() => removeConditionGroup(group.id)}>
                        <Trash2 className="h-3 w-3 me-1" />{tt("alertRemoveConditionGroup")}
                      </Button>
                    </div>
                  )}
                  {group.conditions.map((cond, ci) => (
                    <div key={cond.id} className="space-y-2 p-2 border rounded bg-card">
                      {ci > 0 && (
                        <Badge variant="outline" className="mb-1">{group.logic}</Badge>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{t("alertTelemetryTag")}</Label>
                          <Select value={cond.tag} onValueChange={v => updateCondition(group.id, cond.id, 'tag', v)}>
                            <SelectTrigger className="h-8"><SelectValue placeholder={t("alertSelectTag")} /></SelectTrigger>
                            <SelectContent>
                              {telemetryTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">{t("alertOperator")}</Label>
                          <Select value={cond.operator} onValueChange={v => updateCondition(group.id, cond.id, 'operator', v)}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {operators.filter(op => isOperatorAllowed(op, cond.valueType)).map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{tt("alertValueType")}</Label>
                          <Select value={cond.valueType} onValueChange={v => changeValueType(group.id, cond.id, v as RuleValueType)}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VALUE_TYPES.map(vt => <SelectItem key={vt} value={vt}>{tt(valueTypeLabelKeys[vt])}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {cond.valueType !== 'NULL' && (
                          <div>
                            <Label className="text-xs">{t("alertValue")}</Label>
                            {cond.valueType === 'BOOLEAN_LITERAL' ? (
                              <Select value={cond.value} onValueChange={v => updateCondition(group.id, cond.id, 'value', v)}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">true</SelectItem>
                                  <SelectItem value="false">false</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input className="h-8" type={cond.valueType === 'NUMBER_LITERAL' ? 'number' : 'text'} value={cond.value} onChange={e => updateCondition(group.id, cond.id, 'value', e.target.value)} />
                            )}
                          </div>
                        )}
                        {cond.operator === 'between' && (
                          <div>
                            <Label className="text-xs">{t("alertValueTo")}</Label>
                            <Input className="h-8" type="number" value={cond.valueTo} onChange={e => updateCondition(group.id, cond.id, 'valueTo', e.target.value)} />
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">{t("alertTimeWindow")}</Label>
                          <Input className="h-8" type="number" value={cond.timeWindow} onChange={e => updateCondition(group.id, cond.id, 'timeWindow', e.target.value)} placeholder={t("alertMinutes")} />
                        </div>
                      </div>
                      {group.conditions.length > 1 && (
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

          {/* Step 3: Severity */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label>{t("alertSelectSeverity")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['critical', 'high', 'medium', 'low'] as AlertSeverity[]).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`p-4 rounded-lg border-2 text-start transition-colors ${
                      severity === sev ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Badge className={`${severityColors[sev]} mb-2`}>
                      {t(`alert${sev.charAt(0).toUpperCase() + sev.slice(1)}` as any)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{t(`alertSeverity${sev.charAt(0).toUpperCase() + sev.slice(1)}Desc` as any)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Escalation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label>{t("alertSelectEscalation")}</Label>
              <div className="space-y-3">
                {escalationPolicies.length === 0 && (
                  <EmptyState
                    message={tt("alertNoEscalationsYet")}
                    action={{ label: t("alertCreateEscalation"), onClick: () => navigate(localizedPath("/alarms/escalation/new", language)) }}
                  />
                )}
                {escalationPolicies.map(policy => (
                  <button
                    key={policy.id}
                    onClick={() => setEscalationPolicyId(policy.id)}
                    className={`w-full p-4 rounded-lg border-2 text-start transition-colors ${
                      escalationPolicyId === policy.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="font-medium">{policy.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{policy.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {policy.levels.map(level => (
                        <Badge key={level.level} variant="outline" className="text-xs">
                          L{level.level}: {level.role} ({level.delayMinutes}min)
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">SLA: {policy.slaMinutes} min</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Notifications */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label>{t("alertSelectChannels")}</Label>
              <div className="space-y-2">
                {notificationChannels.length === 0 && (
                  <EmptyState
                    message={tt("alertNoChannelsYet")}
                    action={{ label: t("alertAddChannel"), onClick: () => navigate(localizedPath("/alarms/channels/new", language)) }}
                  />
                )}
                {notificationChannels.map(channel => (
                  <label key={channel.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={(checked) => {
                        setSelectedChannels(prev => checked ? [...prev, channel.id] : prev.filter(c => c !== channel.id));
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.type.toUpperCase()}</p>
                    </div>
                    <Badge variant={channel.enabled ? "default" : "secondary"}>
                      {channel.enabled ? t("enabled") : t("disabled")}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Assignment */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("alertAssignTeam")}</Label>
                <Select value={assignedTeam} onValueChange={setAssignedTeam}>
                  <SelectTrigger><SelectValue placeholder={t("alertSelectTeam")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations">{t("alertTeamOperations")}</SelectItem>
                    <SelectItem value="maintenance">{t("alertTeamMaintenance")}</SelectItem>
                    <SelectItem value="management">{t("alertTeamManagement")}</SelectItem>
                    <SelectItem value="safety">{t("alertTeamSafety")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2 mt-6">
                <p className="font-medium">{t("alertRuleSummary")}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{t("name")}:</span>
                  <span>{ruleName || '—'}</span>
                  <span className="text-muted-foreground">{t("alertRuleType")}:</span>
                  <span>{ruleType}</span>
                  <span className="text-muted-foreground">{t("alertSeverity")}:</span>
                  <Badge className={`${severityColors[severity]} w-fit`}>{severity}</Badge>
                  <span className="text-muted-foreground">{t("alertStepNotifications")}:</span>
                  <span>{selectedChannels.length} {t("alertChannelsSelected")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {!hideActions && (
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => currentStep === 0 ? handleClose() : setCurrentStep(prev => prev - 1)}
            >
              <BackIcon className="h-4 w-4 me-1" />
              {currentStep === 0 ? t("cancel") : t("back")}
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                {t("next")}
                <NextIcon className="h-4 w-4 ms-1" />
              </Button>
            ) : (
              <Button onClick={() => { void handleCreate(); }} disabled={createAlarmRule.isPending}>{t("alertCreateRule")}</Button>
            )}
          </div>
        )}
    </div>
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

