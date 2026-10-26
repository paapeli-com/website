import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
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
import { DEFAULT_FIREWALL_ID, DEFAULT_IMAGE, DEFAULT_PLAN_ID, FIREWALLS, IMAGES, PLANS, REGIONS } from "../lib/catalog";
import { OsLogo } from "../lib/osLogos";
import { addGroup, DEFAULT_RULES, type HealthSource, type Metric, type ScalingMode, type ScalingRule } from "../lib/autoscaleStore";
import { AUTOSCALE_PATH, CreateFooter, CreatePage, PageBreadcrumb, SERVERS_PATH, groupPath } from "../ui";
import { Note, OptionCard, RegionPicker, ReviewBlock, ReviewLine, SettingRow, StepBar, StepSection, SummaryLine } from "../wizard";
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
  const plan = sizes.find((p) => p.id === planId) ?? sizes[0];
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
      health: { source: healthSource, autoReplace, graceMin },
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
                  <div>
                    <FieldLabel required htmlFor="group-name">
                      {t("Group name")}
                    </FieldLabel>
                    <Input
                      id="group-name"
                      dir="ltr"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase())}
                      aria-invalid={showErrors && !nameOk}
                      className={cn("max-w-md", showErrors && !nameOk && "border-destructive")}
                    />
                    <p className={cn("mt-1.5 text-xs", showErrors && !nameOk ? "text-destructive" : "text-muted-foreground")}>
                      {showErrors && !nameOk
                        ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
                        : t("Instances are named after the group: {name}-01, {name}-02 and on.", { name: name || "group" })}
                    </p>
                  </div>

                  <div>
                    <FieldLabel required>{t("Scaling mode")}</FieldLabel>
                    <div role="radiogroup" className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
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

                  <div className="border-t border-border pt-5">
                    <RegionPicker
                      regionId={regionId}
                      zone={zone}
                      onChange={(r, z) => {
                        setRegionId(r);
                        setZone(z);
                      }}
                      note={t("A group stays in the region it is created in; the region cannot be changed later.")}
                    />
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
                    <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {IMAGES.map((img) => (
                        <OptionCard key={img.id} selected={img.id === imageId} onSelect={() => setImageId(img.id)}>
                          <div className="flex items-center gap-3">
                            <OsLogo id={img.id} name={img.name} color={img.color} />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{img.name}</span>
                          </div>
                          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <Select
                              dir="ltr"
                              value={versions[img.id]}
                              onValueChange={(v) => {
                                setVersions((prev) => ({ ...prev, [img.id]: v }));
                                setImageId(img.id);
                              }}
                            >
                              <SelectTrigger className="h-9" aria-label={t("Version")} dir="ltr">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {img.versions.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </OptionCard>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>{t("Instance size")}</FieldLabel>
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
                            {sizes.map((p) => (
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
                            {f.name} ({f.rules})
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
                                { id: `r-${++ruleSeq}`, direction: "out", metric: "memory", threshold: 80, durationMin: 5, step: 1 },
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
                      <div className="rounded-xl border border-border p-4">
                        <p className="mb-2 text-sm font-medium text-foreground">{t("How a failure is noticed")}</p>
                        <RadioGroup
                          dir={isRTL ? "rtl" : "ltr"}
                          value={healthSource}
                          onValueChange={(v) => setHealthSource(v as HealthSource)}
                          className="space-y-2"
                        >
                          <HealthOption value="infra" title={t("Instance status")} description={t("The server stops or errors.")} />
                          <HealthOption
                            value="lb"
                            title={t("Load balancer health check")}
                            description={withLb ? t("The application stops answering the load balancer.") : t("Needs a load balancer.")}
                            disabled={!withLb}
                          />
                        </RadioGroup>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="text-sm text-foreground">{t("Grace period")}</span>
                          <Select value={String(graceMin)} onValueChange={(v) => setGraceMin(Number(v))}>
                            <SelectTrigger className="h-9 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 5, 10].map((g) => (
                                <SelectItem key={g} value={String(g)}>
                                  {t("{n} min", { n: n(g) })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground">{t("A new instance is not judged before this.")}</span>
                        </div>
                      </div>
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

/** Each rule on one row: direction, metric, threshold, how long, how many. */
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
          <Select value={r.direction} onValueChange={(v) => onChange(r.id, { direction: v as "out" | "in" })}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
