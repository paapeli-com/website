import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Link2,
  ShieldAlert,
  Waypoints,
  Clock,
  Cpu,
  Disc,
  Expand,
  HeartPulse,
  Layers,
  MapPin,
  Network,
  Plus,
  Server,
  Settings2,
  ShieldCheck,
  Split,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { REGIONS } from "../lib/catalog";
import { useSshKeys } from "../lib/sshKeyStore";
import { newDraft, resolveTemplate, TemplateFields, TemplateImage, useTemplateInfo, type TemplateDraft } from "../autoscaleTemplate";
import {
  addGroup,
  DEFAULT_CHECK,
  DEFAULT_RULES,
  type HealthCheck,
  type HealthSource,
  type Metric,
  type ScalingMode,
  type ScalingRule,
} from "../lib/autoscaleStore";
import { HealthSettings, SmsNotify } from "../autoscaleHealthNotify";
import { useNetworks } from "../lib/networkStore";
import { createLoadBalancer, defaultMonitor, MONITOR_TYPES, newRule, ruleLabel, useLoadBalancers, type HealthMonitor } from "../lib/loadBalancerStore";
import { apiCall } from "../lib/openstackErrors";
import { useLbText } from "../lbUi";
import { getCurrentUserId } from "@paapeli/brand/session";
import { AUTOSCALE_PATH, CREATE_NETWORK_PATH, CreateFooter, CreatePage, PageBreadcrumb, SERVERS_PATH, groupPath } from "../ui";
import { FieldBox, Note, OptionCard, RegionBox, ReviewBlock, ReviewLine, SettingRow, StepBar, StepSection, SummaryLine } from "../wizard";
import { Stepper } from "../autoscaleUi";

/* Create Auto Scale group: the server wizard's frame and pieces, five steps.
 *
 *   Basics           name, region, and whether the group scales itself or
 *                    holds a number you set.
 *   Template         what every instance is made from: image (a system one,
 *                    or the account's own image or snapshot), size, sign-in,
 *                    firewall and a startup script; see autoscaleTemplate.tsx.
 *   Scaling          min, desired and max, the cooldown, and (automatic) the
 *                    rules: a metric over a window, and how many to add or
 *                    remove.
 *   Network & health a load balancer in front, or none, and how failed
 *                    instances are found and replaced.
 *   Review & create
 *
 * Every field starts from a value that works, so the group can be created
 * from any step. Only what OpenStack (Heat, Aodh, Octavia) carries out is
 * offered; see lib/autoscaleStore.ts.
 */

const STEPS = ["Basics", "Template", "Scaling", "Network & health", "Review & create"] as const;
const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;
const MAX_INSTANCES = 20;
const COOLDOWNS = [3, 5, 10, 15];
const DURATIONS = [1, 5, 10, 15];

let ruleSeq = 0;

export default function CreateAutoScale() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const goToList = () => navigate(AUTOSCALE_PATH);

  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [showErrors, setShowErrors] = useState(false);

  const [name, setName] = useState("web-group");
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [mode, setMode] = useState<ScalingMode>("automatic");

  /* The template: image, size, sign-in, firewall and startup script. */
  const hasKeys = useSshKeys().some((k) => k.type === "ssh");
  const [draft, setDraft] = useState<TemplateDraft>(() => newDraft(hasKeys));
  const patchDraft = (patch: Partial<TemplateDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const tpl = useTemplateInfo(draft, region.city, zone);
  const plan = tpl.plan;

  const [min, setMin] = useState(2);
  const [desired, setDesired] = useState(2);
  const [max, setMax] = useState(6);
  const [cooldownMin, setCooldownMin] = useState(5);
  const [rules, setRules] = useState<ScalingRule[]>(DEFAULT_RULES);

  /* The load balancer in front: a new one made with the group, one of the
     region's own, or none; and the private network the instances are on. */
  const networks = useNetworks();
  const lbs = useLoadBalancers();
  const lbText = useLbText();
  const regionNetworks = networks.filter((x) => x.region === region.city);
  const regionLbs = lbs.filter((x) => x.region === region.city);
  const [lbChoice, setLbChoice] = useState<"new" | "existing" | "none">("new");
  const withLb = lbChoice !== "none";
  const [networkId, setNetworkId] = useState(() => regionNetworks[0]?.id ?? "");
  const [listenProtocol, setListenProtocol] = useState<"HTTP" | "TCP">("HTTP");
  const [listenPort, setListenPort] = useState(80);
  const [appPort, setAppPort] = useState(80);
  const [existingLbId, setExistingLbId] = useState(() => regionLbs[0]?.id ?? "");
  const [existingRuleId, setExistingRuleId] = useState("");
  const existingLb = regionLbs.find((x) => x.id === existingLbId);
  const existingRule = existingLb?.rules.find((r) => r.id === existingRuleId);
  const network = networks.find((x) => x.id === (lbChoice === "existing" ? existingLb?.networkId : networkId));
  const [healthSource, setHealthSource] = useState<HealthSource>("infra");
  const [autoReplace, setAutoReplace] = useState(true);
  const [graceMin, setGraceMin] = useState(5);
  const [check, setCheck] = useState<HealthCheck>(DEFAULT_CHECK);
  /* Off by default; the creator is the first one ticked when it is turned on. */
  const [notify, setNotify] = useState<{ sms: boolean; userIds: string[] }>(() => ({
    sms: false,
    userIds: getCurrentUserId() ? [getCurrentUserId()!] : [],
  }));

  useEffect(() => {
    setVisited((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
  }, [step]);

  /* The load balancer's health check needs a load balancer. */
  useEffect(() => {
    if (!withLb && healthSource === "lb") setHealthSource("infra");
  }, [withLb, healthSource]);

  /* A chosen load balancer starts on its first rule. */
  useEffect(() => {
    if (existingLb && !existingRule) setExistingRuleId(existingLb.rules[0]?.id ?? "");
  }, [existingLb, existingRule]);

  const nameOk = NAME_RE.test(name);
  const lbName = `lb-${name}`;
  const portOk = (p: number) => Number.isInteger(p) && p >= 1 && p <= 65535;
  /* What step 4 still needs, as a sentence to show under it. */
  const networkProblem = withLb && !network ? t("Choose a private network for the load balancer.") : undefined;
  const lbProblem =
    lbChoice === "new"
      ? lbs.some((x) => x.name === lbName && x.region === region.city)
        ? t("A load balancer named {name} already exists. Choose it as an existing one, or rename the group.", { name: lbName })
        : !portOk(listenPort) || !portOk(appPort)
          ? t("Enter a port from 1 to 65535.")
          : undefined
      : lbChoice === "existing"
        ? !existingLb
          ? t("Choose a load balancer.")
          : !existingRule
            ? t("This load balancer has no rule yet. Add one on its page first.")
            : undefined
        : undefined;
  const stepOk = (i: number) => (i === 0 ? nameOk : i === 1 ? tpl.ok : i === 3 ? !networkProblem && !lbProblem : true);
  const lbDisplayName = lbChoice === "new" ? lbName : lbChoice === "existing" ? existingLb?.name : undefined;
  /* The port the instances serve on, and whether the template's firewall opens it. */
  const servePort = lbChoice === "existing" ? existingRule?.targetPort : lbChoice === "new" ? appPort : undefined;
  const servesUdp = lbChoice === "existing" && existingRule?.protocol === "UDP";
  const templateFirewall = tpl.firewall;
  const firewallClosed =
    servePort !== undefined &&
    !!templateFirewall &&
    !templateFirewall.inbound.some(
      (x) =>
        (x.protocol === "any" || x.protocol === (servesUdp ? "udp" : "tcp")) &&
        (x.portFrom === undefined || (servePort >= x.portFrom && servePort <= (x.portTo ?? x.portFrom))),
    );

  /* The new load balancer's check, from the health settings when they use it. */
  const monitorFromCheck = (): HealthMonitor => {
    const base = defaultMonitor(listenProtocol);
    if (healthSource !== "lb") return base;
    const types = MONITOR_TYPES[listenProtocol];
    return {
      ...base,
      type: types.includes(check.protocol) ? check.protocol : types[0],
      path: check.path,
      codes: check.codes,
      delay: check.intervalSec,
      timeout: Math.min(check.timeoutSec, check.intervalSec),
      maxRetriesDown: check.unhealthyAfter,
      maxRetries: check.healthyAfter,
    };
  };

  const monthlyFor = (count: number) => plan.monthly[currency] * count;

  /* Keep min ≤ desired ≤ max whichever moves. */
  const changeMin = (v: number) => {
    setMin(v);
    if (desired < v) setDesired(v);
    if (max < v) setMax(v);
  };
  const changeDesired = (v: number) => setDesired(Math.min(max, Math.max(min, v)));
  const changeMax = (v: number) => {
    setMax(v);
    if (desired > v) setDesired(v);
    if (min > v) setMin(v);
  };

  const updateRule = (id: string, patch: Partial<ScalingRule>) => setRules((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const create = async () => {
    const bad = [0, 1, 3].find((i) => !stepOk(i));
    if (bad !== undefined) {
      setShowErrors(true);
      setStep(bad);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    /* A new load balancer first: if it is refused, no group is made. */
    let lbRef: { id: string; ruleId: string } | undefined;
    if (lbChoice === "new") {
      const rule = { ...newRule([], listenProtocol), port: listenPort, targetPort: appPort, monitor: monitorFromCheck() };
      const made = await apiCall(
        () => createLoadBalancer({ name: lbName, description: "", region: region.city, networkId, vipAddress: "", rules: [rule] }),
        t,
      );
      if (!made) return;
      lbRef = { id: made.id, ruleId: rule.id };
    } else if (lbChoice === "existing" && existingLb && existingRule) {
      lbRef = { id: existingLb.id, ruleId: existingRule.id };
    }
    /* A chosen snapshot is saved as an image now, once nothing else can refuse. */
    const { savedImage, ...template } = resolveTemplate(draft, tpl, region.city);
    const group = addGroup({
      name,
      region: region.city,
      zone,
      mode,
      ...template,
      min,
      desired,
      max,
      cooldownMin,
      rules: mode === "automatic" ? rules : [],
      loadBalancer: lbDisplayName,
      lb: lbRef,
      network: network ? { id: network.id, name: network.name, cidr: network.cidr } : undefined,
      health: { source: healthSource, autoReplace, graceMin, check: healthSource === "lb" && lbChoice === "new" ? check : undefined },
      notify: mode === "automatic" && notify.sms && notify.userIds.length > 0 ? notify : undefined,
    });
    toast.success(t("{name} is being created.", { name }));
    if (savedImage) toast.info(t("The snapshot was saved as the image {name}.", { name: savedImage }));
    navigate(groupPath(group.id));
  };

  const isLast = step === STEPS.length - 1;

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Auto Scale"), path: AUTOSCALE_PATH },
          { label: t("Create group") },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Create Auto Scale group")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Cloud servers that grow and shrink with the load.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Card className="p-4">
            <StepBar
              current={step}
              labels={STEPS.map((s) => t(s))}
              done={(i) => i !== step && visited.has(i) && stepOk(i)}
              invalid={(i) => showErrors && !stepOk(i)}
              onSelect={setStep}
            />

            {step === 0 && (
              <StepSection icon={Expand} title={t("Basics")}>
                <div className="space-y-5">
                  {/* Where and the name, as equal boxes; the mode cards below sit on
                      the same two columns. */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <RegionBox
                      regionId={regionId}
                      zone={zone}
                      onChange={(r, z) => {
                        setRegionId(r);
                        setZone(z);
                        const city = REGIONS.find((x) => x.id === r)!.city;
                        setNetworkId(networks.find((x) => x.region === city)?.id ?? "");
                        setExistingLbId(lbs.find((x) => x.region === city)?.id ?? "");
                        setExistingRuleId("");
                      }}
                      description={t("A group stays in the region it is created in; the region cannot be changed later.")}
                    />
                    <FieldBox
                      title={t("Group name")}
                      required
                      description={t("Instances are named after the group: {name}-01, {name}-02 and on.", { name: name || "group" })}
                    >
                      <Input
                        id="group-name"
                        dir="ltr"
                        value={name}
                        onChange={(e) => setName(e.target.value.toLowerCase())}
                        aria-label={t("Group name")}
                        aria-invalid={showErrors && !nameOk}
                        className={cn("h-12", showErrors && !nameOk && "border-destructive")}
                      />
                      {showErrors && !nameOk && (
                        <p className="mt-1.5 text-xs text-destructive">{t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")}</p>
                      )}
                    </FieldBox>
                  </div>

                  <div>
                    <FieldLabel required>{t("Scaling mode")}</FieldLabel>
                    <div role="radiogroup" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <OptionCard selected={mode === "automatic"} onSelect={() => setMode("automatic")}>
                        <div className="flex items-center gap-2.5">
                          <Settings2 className={cn("size-4", mode === "automatic" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("Automatic")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("Adds and removes instances by your rules.")}</p>
                      </OptionCard>
                      <OptionCard selected={mode === "manual"} onSelect={() => setMode("manual")}>
                        <div className="flex items-center gap-2.5">
                          <User className={cn("size-4", mode === "manual" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("Manual")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("Keeps the number you set, and replaces failed ones.")}</p>
                      </OptionCard>
                    </div>
                  </div>

                </div>
              </StepSection>
            )}

            {step === 1 && (
              <StepSection icon={Layers} title={t("Template")}>
                <p className="-mt-3 mb-4 text-sm text-muted-foreground">{t("Every instance in the group is made from this.")}</p>
                <TemplateFields draft={draft} onChange={patchDraft} info={tpl} region={region.city} zone={zone} showErrors={showErrors} />
              </StepSection>
            )}

            {step === 2 && (
              <StepSection icon={Settings2} title={t("Scaling")}>
                <div className="space-y-6">
                  {/* Capacity: three steppers that keep min ≤ desired ≤ max. */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        [t("Minimum"), min, 1, MAX_INSTANCES, changeMin],
                        [t("Desired"), desired, min, max, changeDesired],
                        [t("Maximum"), max, 1, MAX_INSTANCES, changeMax],
                      ] as const
                    ).map(([label, value, lo, hi, onChange]) => (
                      <div key={label} className="rounded-xl border border-border p-4">
                        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
                        <Stepper value={value} min={lo} max={hi} onChange={onChange} label={label} />
                      </div>
                    ))}
                  </div>
                  <p className="-mt-3 text-xs text-muted-foreground">
                    {t("The group starts with the desired number and never goes below the minimum or above the maximum.")}
                  </p>

                  {mode === "automatic" ? (
                    <>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <FieldLabel className="mb-0">{t("Scaling rules")}</FieldLabel>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRules((all) => [
                                ...all,
                                newScheduledRule(`r-${++ruleSeq}`),
                              ])
                            }
                          >
                            <Plus className="me-1.5 size-4" />
                            {t("Add rule")}
                          </Button>
                        </div>
                        <RulesEditor rules={rules} onChange={updateRule} onRemove={(id) => setRules((all) => all.filter((r) => r.id !== id))} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <FieldLabel className="mb-0">{t("Cooldown")}</FieldLabel>
                        <Select value={String(cooldownMin)} onValueChange={(v) => setCooldownMin(Number(v))}>
                          <SelectTrigger className="h-9 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COOLDOWNS.map((c) => (
                              <SelectItem key={c} value={String(c)}>
                                {t("{n} min", { n: n(c) })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">{t("The wait after a change before the next one.")}</span>
                      </div>
                      <SmsNotify value={notify} onChange={setNotify} />
                    </>
                  ) : (
                    <Note>{t("Manual mode keeps the desired number; scaling rules are not applied.")}</Note>
                  )}
                </div>
              </StepSection>
            )}

            {step === 3 && (
              <StepSection icon={Network} title={t("Network & health")}>
                <div className="space-y-6">
                  <div>
                    <FieldLabel>{t("Load balancer")}</FieldLabel>
                    <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <OptionCard selected={lbChoice === "new"} onSelect={() => setLbChoice("new")}>
                        <div className="flex items-center gap-2.5">
                          <Split className={cn("size-4", lbChoice === "new" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("New load balancer")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span dir="ltr">{lbName}</span> · {t("Made with the group.")}
                        </p>
                      </OptionCard>
                      <OptionCard
                        selected={lbChoice === "existing"}
                        onSelect={() => {
                          setLbChoice("existing");
                          if (!existingLb) setExistingLbId(regionLbs[0]?.id ?? "");
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Link2 className={cn("size-4", lbChoice === "existing" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("Existing load balancer")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {regionLbs.length > 0 ? t("Instances join one of its rules.") : t("None in this region yet.")}
                        </p>
                      </OptionCard>
                      <OptionCard selected={lbChoice === "none"} onSelect={() => setLbChoice("none")}>
                        <div className="flex items-center gap-2.5">
                          <Server className={cn("size-4", lbChoice === "none" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("No load balancer")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("For workers that take jobs from a queue.")}</p>
                      </OptionCard>
                    </div>

                    {lbChoice === "new" && (
                      <div className="mt-4 rounded-xl border border-border p-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <LbField label={t("Protocol")}>
                            <Select value={listenProtocol} onValueChange={(v) => setListenProtocol(v as "HTTP" | "TCP")}>
                              <SelectTrigger className="h-9 w-28" dir="ltr">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HTTP">HTTP</SelectItem>
                                <SelectItem value="TCP" disabled>
                                  TCP
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </LbField>
                          <LbField label={t("Port")}>
                            <PortInput value={listenPort} onChange={setListenPort} label={t("Port")} />
                          </LbField>
                          {isRTL ? <ArrowLeft className="mb-2.5 size-4 text-muted-foreground" /> : <ArrowRight className="mb-2.5 size-4 text-muted-foreground" />}
                          <LbField label={t("Instances' port")}>
                            <PortInput value={appPort} onChange={setAppPort} label={t("Instances' port")} />
                          </LbField>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {t("More rules, servers of your own and a public IP can be added on the load balancer's page later.")}
                        </p>
                      </div>
                    )}

                    {lbChoice === "existing" && regionLbs.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                        <LbField label={t("Load balancer")}>
                          <Select
                            value={existingLbId}
                            onValueChange={(v) => {
                              setExistingLbId(v);
                              setExistingRuleId("");
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={t("Choose a load balancer")} />
                            </SelectTrigger>
                            <SelectContent>
                              {regionLbs.map((x) => (
                                <SelectItem key={x.id} value={x.id}>
                                  <span dir="ltr">{x.name}</span>{" "}
                                  <span dir="ltr" className="text-xs text-muted-foreground">
                                    {x.vipAddress}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </LbField>
                        <LbField label={t("Traffic rule")}>
                          <Select value={existingRuleId} onValueChange={setExistingRuleId} disabled={!existingLb || existingLb.rules.length === 0}>
                            <SelectTrigger className="h-10" dir="ltr">
                              <SelectValue placeholder={t("Choose a rule")} />
                            </SelectTrigger>
                            <SelectContent>
                              {existingLb?.rules.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  <span dir="ltr">{ruleLabel(r)}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </LbField>
                        {existingRule && (
                          <p className="text-xs text-muted-foreground sm:col-span-2">
                            {t("Instances join on port {port}. The rule's health check: {check}.", {
                              port: existingRule.targetPort,
                              check: lbText.monitor(existingRule.monitor),
                            })}
                          </p>
                        )}
                      </div>
                    )}
                    {showErrors && lbProblem && <p className="mt-2 text-xs text-destructive">{lbProblem}</p>}
                  </div>

                  <div>
                    <FieldLabel required={withLb}>{t("Private network")}</FieldLabel>
                    {lbChoice === "existing" ? (
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        <Waypoints className="size-4 text-muted-foreground" />
                        {network ? <span dir="ltr">{`${network.name} · ${network.cidr}`}</span> : "-"}
                        <span className="text-xs text-muted-foreground">{t("The load balancer's network.")}</span>
                      </p>
                    ) : regionNetworks.length === 0 ? (
                      <Note>
                        {t("No private network in this region yet. A load balancer reaches the instances over one.")}{" "}
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(CREATE_NETWORK_PATH)}>
                          {t("Create private network")}
                        </button>
                      </Note>
                    ) : (
                      <Select value={networkId || "none"} onValueChange={(v) => setNetworkId(v === "none" ? "" : v)}>
                        <SelectTrigger className={cn("h-10 w-full sm:w-80", showErrors && networkProblem && "border-destructive")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {!withLb && <SelectItem value="none">{t("None")}</SelectItem>}
                          {regionNetworks.map((x) => (
                            <SelectItem key={x.id} value={x.id}>
                              <span dir="ltr">{x.name}</span>{" "}
                              <span dir="ltr" className="text-xs text-muted-foreground">
                                {x.cidr}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {showErrors && networkProblem ? (
                      <p className="mt-1.5 text-xs text-destructive">{networkProblem}</p>
                    ) : (
                      lbChoice !== "existing" && <p className="mt-1.5 text-xs text-muted-foreground">{t("Instances get their private address here.")}</p>
                    )}
                    {firewallClosed && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                        <ShieldAlert className="size-3.5 shrink-0" />
                        {t("The firewall {name} does not let port {port} in, so the load balancer cannot reach the instances. Choose another in the template.", {
                          name: templateFirewall!.name,
                          port: servePort!,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <FieldLabel className="mb-0">{t("Health")}</FieldLabel>
                    <SettingRow
                      icon={HeartPulse}
                      title={t("Replace failed instances")}
                      description={t("A failed instance is removed and a new one made in its place.")}
                      control={<Switch checked={autoReplace} onCheckedChange={setAutoReplace} aria-label={t("Replace failed instances")} />}
                    />
                    {autoReplace && (
                      <HealthSettings
                        source={healthSource}
                        onSource={setHealthSource}
                        hasLb={withLb}
                        hidePort={lbChoice === "new"}
                        monitorNote={
                          lbChoice === "existing" && existingRule ? (
                            <p className="text-sm text-muted-foreground">
                              {t("The rule's own health check is used: {check}.", { check: lbText.monitor(existingRule.monitor) })}
                            </p>
                          ) : undefined
                        }
                        check={check}
                        onCheck={setCheck}
                        graceMin={graceMin}
                        onGrace={setGraceMin}
                      />
                    )}
                  </div>
                </div>
              </StepSection>
            )}

            {step === 4 && (
              <StepSection icon={Check} title={t("Review & create")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ReviewBlock title={t("Basics")} onEdit={() => setStep(0)}>
                    <ReviewLine label={t("Group name")} value={<span dir="ltr">{name}</span>} />
                    <ReviewLine label={t("Region")} value={`${t(region.city)} · ${zone}`} />
                    <ReviewLine label={t("Scaling mode")} value={mode === "automatic" ? t("Automatic") : t("Manual")} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Template")} onEdit={() => setStep(1)}>
                    <ReviewLine
                      label={t("Image")}
                      value={<TemplateImage source={draft.source === "mine" ? "custom" : "os"} imageId={draft.osId} label={tpl.imageLabel || "-"} />}
                    />
                    <ReviewLine label={t("Instance size")} value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })} />
                    <ReviewLine
                      label={t("Sign-in")}
                      value={tpl.access === "ssh" ? <span dir="ltr">{tpl.key?.name ?? "-"}</span> : t("Password")}
                    />
                    <ReviewLine label={t("Firewall")} value={<span dir="ltr">{tpl.firewall?.name}</span>} />
                    <ReviewLine label={t("Startup script")} value={draft.script.trim() ? t("{n} lines", { n: n(draft.script.trim().split("\n").length) }) : t("None")} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Scaling")} onEdit={() => setStep(2)}>
                    <ReviewLine label={t("Capacity")} value={t("min {min} · desired {desired} · max {max}", { min: n(min), desired: n(desired), max: n(max) })} />
                    {mode === "automatic" && <ReviewLine label={t("Scaling rules")} value={n(rules.length)} />}
                  </ReviewBlock>
                  <ReviewBlock title={t("Network & health")} onEdit={() => setStep(3)}>
                    <ReviewLine
                      label={t("Load balancer")}
                      value={
                        lbDisplayName ? (
                          <span dir="ltr">
                            {lbDisplayName}
                            {lbChoice === "existing" && existingRule ? ` · ${ruleLabel(existingRule)}` : ` · ${listenProtocol} :${listenPort} → :${appPort}`}
                          </span>
                        ) : (
                          t("None")
                        )
                      }
                    />
                    <ReviewLine label={t("Private network")} value={network ? <span dir="ltr">{network.name}</span> : t("None")} />
                    <ReviewLine label={t("Replace failed instances")} value={autoReplace ? t("Enabled") : t("Off")} />
                    {autoReplace && (
                      <ReviewLine
                        label={t("Checked by")}
                        value={healthSource === "lb" ? <span dir="ltr">{`${check.protocol} :${check.port}${check.protocol === "TCP" ? "" : ` ${check.path}`}`}</span> : t("Instance status")}
                      />
                    )}
                  </ReviewBlock>
                </div>
              </StepSection>
            )}
          </Card>
        </div>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Estimated price")}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">{format(monthlyFor(desired))}</span>
              <span className="text-sm text-muted-foreground">{t("/ month")}</span>
            </div>
            {mode === "automatic" && min !== max && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("{from} to {to} as it scales", { from: format(monthlyFor(min)), to: format(monthlyFor(max)) })}
              </p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
              <SummaryLine icon={Expand} label={t("Group name")} value={<span dir="ltr">{name || "-"}</span>} />
              <SummaryLine icon={MapPin} label={t("Region")} value={`${t(region.city)} · ${zone}`} />
              <SummaryLine icon={Disc} label={t("Image")} value={<span dir="ltr">{tpl.imageLabel || "-"}</span>} />
              <SummaryLine icon={Cpu} label={t("Instance size")} value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })} />
              <SummaryLine icon={Layers} label={t("Capacity")} value={`${n(min)} · ${n(desired)} · ${n(max)}`} />
              <SummaryLine icon={Settings2} label={t("Scaling mode")} value={mode === "automatic" ? t("Automatic") : t("Manual")} />
              <SummaryLine icon={Split} label={t("Load balancer")} value={lbDisplayName ? <span dir="ltr">{lbDisplayName}</span> : t("None")} />
              <SummaryLine icon={Waypoints} label={t("Private network")} value={network ? <span dir="ltr">{network.name}</span> : t("None")} />
              <SummaryLine icon={ShieldCheck} label={t("Firewall")} value={<span dir="ltr">{tpl.firewall?.name}</span>} />
            </div>

            <Button onClick={() => void create()} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("Create group")}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToList }}
        back={{ label: t("Back"), onClick: () => (step === 0 ? goToList() : setStep((s) => s - 1)) }}
        primary={{ label: isLast ? t("Create group") : t("Next"), onClick: isLast ? () => void create() : () => setStep((s) => s + 1) }}
      />
    </CreatePage>
  );
}

/** A new rule starts at a set time, the first kind in the list. */
export const newScheduledRule = (id: string): ScalingRule => ({
  id,
  direction: "schedule",
  metric: "cpu",
  threshold: 70,
  durationMin: 5,
  step: 1,
  time: "09:00",
  repeat: "daily",
  scheduleAction: "add",
});

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Each rule on one row. A scheduled one: when, how often, add or remove how
    many. A metric one: which metric, above or below what, for how long, add
    or remove how many. */
export function RulesEditor({
  rules,
  onChange,
  onRemove,
}: {
  rules: ScalingRule[];
  onChange: (id: string, patch: Partial<ScalingRule>) => void;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  if (rules.length === 0) return <Note>{t("No rules. Add one so the group can scale by itself.")}</Note>;
  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm">
          <Select
            value={r.direction}
            onValueChange={(v) => {
              const direction = v as ScalingRule["direction"];
              onChange(
                r.id,
                direction === "schedule"
                  ? { direction, time: r.time ?? "09:00", repeat: r.repeat ?? "daily", scheduleAction: r.scheduleAction ?? "add" }
                  : { direction },
              );
            }}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5 text-violet-600" />
                  {t("At a set time")}
                </span>
              </SelectItem>
              <SelectItem value="out">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUp className="size-3.5 text-emerald-600" />
                  {t("Scale out")}
                </span>
              </SelectItem>
              <SelectItem value="in">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowDown className="size-3.5 text-sky-600" />
                  {t("Scale in")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {r.direction === "schedule" ? (
            <>
              <span className="text-muted-foreground">{t("at")}</span>
              <Input
                type="time"
                dir="ltr"
                value={r.time ?? "09:00"}
                onChange={(e) => onChange(r.id, { time: e.target.value || "09:00" })}
                className="h-9 w-28"
                aria-label={t("Time")}
              />
              <Select
                value={r.repeat ?? "daily"}
                onValueChange={(v) => onChange(r.id, { repeat: v as "daily" | "once", date: v === "once" ? (r.date ?? todayIso()) : r.date })}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("Every day")}</SelectItem>
                  <SelectItem value="once">{t("Once, on")}</SelectItem>
                </SelectContent>
              </Select>
              {r.repeat === "once" && (
                <Input
                  type="date"
                  dir="ltr"
                  value={r.date ?? todayIso()}
                  onChange={(e) => onChange(r.id, { date: e.target.value })}
                  className="h-9 w-40"
                  aria-label={t("Date")}
                />
              )}
              <Select
                value={r.scheduleAction ?? "add"}
                onValueChange={(v) => onChange(r.id, { scheduleAction: v as "add" | "remove" })}
              >
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">{t("add")}</SelectItem>
                  <SelectItem value="remove">{t("remove")}</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
          <span className="text-muted-foreground">{t("when")}</span>
          <Select value={r.metric} onValueChange={(v) => onChange(r.id, { metric: v as Metric })}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpu">{t("Average CPU")}</SelectItem>
              <SelectItem value="memory">{t("Average memory")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground" dir="ltr">
            {r.direction === "out" ? ">" : "<"}
          </span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              dir="ltr"
              min={1}
              max={99}
              value={r.threshold}
              onChange={(e) => onChange(r.id, { threshold: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
              className="h-9 w-20"
              aria-label={t("Threshold")}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <span className="text-muted-foreground">{t("for")}</span>
          <Select value={String(r.durationMin)} onValueChange={(v) => onChange(r.id, { durationMin: Number(v) })}>
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {t("{n} min", { n: n(d) })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">{r.direction === "out" ? t("add") : t("remove")}</span>
            </>
          )}
          <Stepper value={r.step} min={1} max={5} onChange={(v) => onChange(r.id, { step: v })} label={t("Instances")} />
          <Button
            variant="ghost"
            size="icon"
            className="ms-auto size-8 text-muted-foreground hover:text-destructive"
            aria-label={t("Remove rule")}
            onClick={() => onRemove(r.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function LbField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function PortInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const bad = !(Number.isInteger(value) && value >= 1 && value <= 65535);
  return (
    <Input
      inputMode="numeric"
      value={Number.isNaN(value) ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value.replace(/\D/g, "")))}
      aria-label={label}
      aria-invalid={bad}
      className={cn("h-9 w-24 text-sm", bad && "border-destructive")}
    />
  );
}

function HealthOption({ value, title, description, disabled }: { value: string; title: string; description: string; disabled?: boolean }) {
  const id = `health-${value}`;
  return (
    <div className={cn("flex items-start gap-2.5", disabled && "opacity-50")}>
      <RadioGroupItem value={value} id={id} disabled={disabled} className="mt-0.5" />
      <Label htmlFor={id} className={cn("font-normal", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </Label>
    </div>
  );
}
