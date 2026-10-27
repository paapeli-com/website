import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
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
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Label } from "@/features/factory/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { DEFAULT_IMAGE, DEFAULT_PLAN_ID, IMAGES, PLANS, REGIONS } from "../lib/catalog";
import { DEFAULT_FIREWALL_ID, inboundSummary, useFirewalls } from "../lib/firewallStore";
import { OsLogo } from "../lib/osLogos";
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
import { getCurrentUserId } from "@paapeli/brand/session";
import { AUTOSCALE_PATH, CreateFooter, CreatePage, PageBreadcrumb, SERVERS_PATH, groupPath } from "../ui";
import { FieldBox, Note, OptionCard, RegionBox, ReviewBlock, ReviewLine, SettingRow, StepBar, StepSection, SummaryLine } from "../wizard";
import { Stepper } from "../autoscaleUi";

/* Create Auto Scale group: the server wizard's frame and pieces, five steps.
 *
 *   Basics           name, region, and whether the group scales itself or
 *                    holds a number you set.
 *   Template         what every instance is made from: image, size, firewall.
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

  const [imageId, setImageId] = useState(DEFAULT_IMAGE.imageId);
  const [versions, setVersions] = useState<Record<string, string>>(() =>
    Object.fromEntries(IMAGES.map((i) => [i.id, i.id === DEFAULT_IMAGE.imageId ? DEFAULT_IMAGE.version : i.versions[0]])),
  );
  const image = IMAGES.find((i) => i.id === imageId) ?? IMAGES[0];
  const sizes = PLANS.filter((p) => p.family === "shared" || p.family === "dedicated");
  const [planId, setPlanId] = useState(DEFAULT_PLAN_ID);
  const [sizeFamily, setSizeFamily] = useState<"shared" | "dedicated">("shared");
  const plan = sizes.find((p) => p.id === planId) ?? sizes[0];
  const FIREWALLS = useFirewalls();
  const [firewallId, setFirewallId] = useState(DEFAULT_FIREWALL_ID);

  const [min, setMin] = useState(2);
  const [desired, setDesired] = useState(2);
  const [max, setMax] = useState(6);
  const [cooldownMin, setCooldownMin] = useState(5);
  const [rules, setRules] = useState<ScalingRule[]>(DEFAULT_RULES);

  const [withLb, setWithLb] = useState(true);
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

  const nameOk = NAME_RE.test(name);
  const stepOk = (i: number) => (i === 0 ? nameOk : true);
  const lbName = `lb-${name}`;

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

  const create = () => {
    if (!stepOk(0)) {
      setShowErrors(true);
      setStep(0);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    const group = addGroup({
      name,
      region: region.city,
      zone,
      mode,
      imageId,
      image: `${image.name} ${versions[imageId]}`,
      planId: plan.id,
      vcpu: plan.vcpu,
      ramGb: plan.ramGb,
      diskGb: plan.diskGb,
      firewall: FIREWALLS.find((f) => f.id === firewallId)?.name ?? "",
      min,
      desired,
      max,
      cooldownMin,
      rules: mode === "automatic" ? rules : [],
      loadBalancer: withLb ? lbName : undefined,
      health: { source: healthSource, autoReplace, graceMin, check: healthSource === "lb" ? check : undefined },
      notify: mode === "automatic" && notify.sms && notify.userIds.length > 0 ? notify : undefined,
    });
    toast.success(t("{name} is being created.", { name }));
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
                <div className="space-y-6">
                  <div>
                    <FieldLabel required>{t("Operating system")}</FieldLabel>
                    {/* Small tiles, and one version list for the chosen image,
                        so the size and firewall below stay in view. */}
                    <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {IMAGES.map((img) => {
                        const on = img.id === imageId;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setImageId(img.id)}
                            className={cn(
                              "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                              on ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                            )}
                          >
                            <OsLogo
                              id={img.id}
                              name={img.name}
                              color={img.color}
                              className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold [&_svg]:size-4"
                            />
                            <span className="truncate text-sm font-medium text-foreground" title={img.name}>
                              {img.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{t("Version")}</span>
                      <Select
                        dir="ltr"
                        value={versions[imageId]}
                        onValueChange={(v) => setVersions((prev) => ({ ...prev, [imageId]: v }))}
                      >
                        <SelectTrigger className="h-9 w-48" aria-label={t("Version")} dir="ltr">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {image.versions.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <FieldLabel required className="mb-0">
                        {t("Instance size")}
                      </FieldLabel>
                      <div className="inline-flex rounded-lg border border-border p-0.5">
                        {(["shared", "dedicated"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            aria-pressed={sizeFamily === f}
                            onClick={() => {
                              setSizeFamily(f);
                              if (plan.family !== f) setPlanId(sizes.find((p) => p.family === f)!.id);
                            }}
                            className={cn(
                              "rounded-md px-3 py-1 text-xs transition-colors",
                              sizeFamily === f ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {f === "shared" ? t("Shared vCPU") : t("Dedicated vCPU")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <RadioGroup dir={isRTL ? "rtl" : "ltr"} value={planId} onValueChange={setPlanId} className="block">
                      <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableHead className="w-[44px]" aria-label={t("Choose plan")} />
                              <TableHead>{t("Plan")}</TableHead>
                              <TableHead>{t("vCPU")}</TableHead>
                              <TableHead>{t("RAM")}</TableHead>
                              <TableHead>{t("Boot disk")}</TableHead>
                              <TableHead className="text-end">{t("Price per instance")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sizes.filter((p) => p.family === sizeFamily).map((p) => (
                              <TableRow
                                key={p.id}
                                onClick={() => setPlanId(p.id)}
                                className={cn(
                                  "cursor-pointer border-b",
                                  p.id === planId ? "bg-primary/[0.04] hover:bg-primary/[0.06]" : "hover:bg-muted/30",
                                )}
                              >
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <RadioGroupItem value={p.id} aria-label={p.id.toUpperCase()} />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium" dir="ltr">
                                  {p.id.toUpperCase()}
                                </TableCell>
                                <TableCell>{n(p.vcpu)}</TableCell>
                                <TableCell>
                                  {n(p.ramGb)} {t("GB")}
                                </TableCell>
                                <TableCell>
                                  {n(p.diskGb)} {t("GB")}
                                </TableCell>
                                <TableCell className="text-end font-medium">
                                  {format(p.monthly[currency])} {t("/ month")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <FieldLabel required>{t("Firewall")}</FieldLabel>
                    <Select dir="ltr" value={firewallId} onValueChange={setFirewallId}>
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIREWALLS.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                            {f.inbound.length > 0 && <span className="text-muted-foreground"> ({inboundSummary(f)})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                    <div role="radiogroup" className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                      <OptionCard selected={withLb} onSelect={() => setWithLb(true)}>
                        <div className="flex items-center gap-2.5">
                          <Split className={cn("size-4", withLb ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("New load balancer")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span dir="ltr">{lbName}</span> · {t("Spreads traffic across the instances.")}
                        </p>
                      </OptionCard>
                      <OptionCard selected={!withLb} onSelect={() => setWithLb(false)}>
                        <div className="flex items-center gap-2.5">
                          <Server className={cn("size-4", !withLb ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("No load balancer")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("For workers that take jobs from a queue.")}</p>
                      </OptionCard>
                    </div>
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
                    <ReviewLine label={t("Operating system")} value={<span dir="ltr">{`${image.name} ${versions[imageId]}`}</span>} />
                    <ReviewLine label={t("Instance size")} value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })} />
                    <ReviewLine label={t("Firewall")} value={<span dir="ltr">{FIREWALLS.find((f) => f.id === firewallId)?.name}</span>} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Scaling")} onEdit={() => setStep(2)}>
                    <ReviewLine label={t("Capacity")} value={t("min {min} · desired {desired} · max {max}", { min: n(min), desired: n(desired), max: n(max) })} />
                    {mode === "automatic" && <ReviewLine label={t("Scaling rules")} value={n(rules.length)} />}
                  </ReviewBlock>
                  <ReviewBlock title={t("Network & health")} onEdit={() => setStep(3)}>
                    <ReviewLine label={t("Load balancer")} value={withLb ? <span dir="ltr">{lbName}</span> : t("None")} />
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
              <SummaryLine icon={Disc} label={t("Image")} value={<span dir="ltr">{`${image.name} ${versions[imageId]}`}</span>} />
              <SummaryLine icon={Cpu} label={t("Instance size")} value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })} />
              <SummaryLine icon={Layers} label={t("Capacity")} value={`${n(min)} · ${n(desired)} · ${n(max)}`} />
              <SummaryLine icon={Settings2} label={t("Scaling mode")} value={mode === "automatic" ? t("Automatic") : t("Manual")} />
              <SummaryLine icon={Split} label={t("Load balancer")} value={withLb ? <span dir="ltr">{lbName}</span> : t("None")} />
              <SummaryLine icon={ShieldCheck} label={t("Firewall")} value={<span dir="ltr">{FIREWALLS.find((f) => f.id === firewallId)?.name}</span>} />
            </div>

            <Button onClick={create} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("Create group")}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToList }}
        back={{ label: t("Back"), onClick: () => (step === 0 ? goToList() : setStep((s) => s - 1)) }}
        primary={{ label: isLast ? t("Create group") : t("Next"), onClick: isLast ? create : () => setStep((s) => s + 1) }}
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
