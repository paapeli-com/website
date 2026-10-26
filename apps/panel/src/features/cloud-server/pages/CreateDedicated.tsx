import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Check,
  Cpu,
  HardDrive,
  Layers,
  MapPin,
  MemoryStick,
  Network,
  Plus,
  RefreshCw,
  Server,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { HOST_PERIODS, HOST_PLANS, REGIONS, type GpuAvailability, type HostPlan } from "../lib/catalog";
import { addCluster, addHosts, useClusters, type HostRecord } from "../lib/hostStore";
import { CreateFooter, CreatePage, DEDICATED_PATH, PageBreadcrumb, SERVERS_PATH } from "../ui";
import { Note, Pill, RegionPicker, ReviewBlock, ReviewLine, StepBar, StepSection, SummaryLine } from "../wizard";

/* Create dedicated server: the cloud server wizard's frame and pieces, in
 * three steps, since a whole machine has fewer choices than a VM.
 *
 *   Basics   the name, the region, and on one row the cluster it joins and
 *            how many to rent, each with a default; a new cluster is a small
 *            popup, not a page.
 *   Hardware the machines, as cards, with the billing period above them
 *            (longer periods cost less a month).
 *   Review   what was chosen, and auto-renewal, on by default.
 *
 * The price column follows the period and the count. Nothing is sent anywhere
 * yet; see lib/hostStore.ts.
 */

const STEPS = ["Basics", "Hardware", "Review & create"] as const;
const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;
const MAX_COUNT = 5;

const AVAILABILITY: Record<GpuAvailability, { label: string; tone: string }> = {
  available: { label: "Available", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  limited: { label: "Limited", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  soldOut: { label: "Sold out", tone: "bg-muted text-muted-foreground" },
};

export default function CreateDedicated() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const clusters = useClusters();
  const goToList = () => navigate(DEDICATED_PATH);

  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [showErrors, setShowErrors] = useState(false);

  const [name, setName] = useState("dedicated-01");
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [clusterId, setClusterId] = useState(clusters[0]?.id ?? "");
  const [count, setCount] = useState(1);
  const [clusterDialogOpen, setClusterDialogOpen] = useState(false);

  const [planId, setPlanId] = useState(HOST_PLANS.find((p) => p.availability !== "soldOut")!.id);
  const plan = HOST_PLANS.find((p) => p.id === planId) ?? HOST_PLANS[0];
  const [months, setMonths] = useState<1 | 6 | 12>(1);
  const period = HOST_PERIODS.find((p) => p.months === months)!;
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    setVisited((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
  }, [step]);

  const nameOk = NAME_RE.test(name);
  const stepOk = (i: number) => (i === 0 ? nameOk && !!clusterId : true);

  const round = (raw: number) => (currency === "TOMAN" ? Math.round(raw / 1000) * 1000 : Math.round(raw * 100) / 100);
  const monthlyOf = (p: HostPlan) => round(p.monthly[currency] * (1 - period.discount));
  const perMonth = monthlyOf(plan) * count;
  const totalForPeriod = round(perMonth * months);
  const clusterName = clusters.find((c) => c.id === clusterId)?.name ?? "-";

  const create = () => {
    if (!stepOk(0)) {
      setShowErrors(true);
      setStep(0);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    const now = Date.now();
    const hosts: HostRecord[] = Array.from({ length: count }, (_, i) => ({
      id: `host-${now.toString(36)}-${i}`,
      name: count === 1 ? name : `${name}-${i + 1}`,
      clusterId,
      region: region.city,
      zone,
      planId: plan.id,
      model: plan.model,
      cores: plan.cores,
      ramGb: plan.ramGb,
      maxVms: plan.maxVms,
      periodMonths: months,
      autoRenew,
      createdAt: now,
    }));
    addHosts(hosts);
    toast.success(t("{name} is being prepared.", { name: hosts.length === 1 ? hosts[0].name : t("{n} dedicated servers", { n: n(count) }) }));
    goToList();
  };

  const isLast = step === STEPS.length - 1;

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Dedicated Servers"), path: DEDICATED_PATH },
          { label: t("Create dedicated server") },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Create dedicated server")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("A whole physical server for you, to run your own cloud servers on.")}
        </p>
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
              <StepSection icon={ServerCog} title={t("Basics")}>
                <div className="space-y-5">
                  <div>
                    <FieldLabel required htmlFor="host-name">
                      {t("Server name")}
                    </FieldLabel>
                    <Input
                      id="host-name"
                      dir="ltr"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase())}
                      aria-invalid={showErrors && !nameOk}
                      className={cn("max-w-md", showErrors && !nameOk && "border-destructive")}
                    />
                    <p className={cn("mt-1.5 text-xs", showErrors && !nameOk ? "text-destructive" : "text-muted-foreground")}>
                      {showErrors && !nameOk
                        ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
                        : t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}
                    </p>
                  </div>

                  {/* Cluster and count on one row, each with a value from the
                      start. */}
                  <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>{t("Cluster")}</FieldLabel>
                      <div className="flex gap-2">
                        <Select dir="ltr" value={clusterId} onValueChange={setClusterId}>
                          <SelectTrigger className={cn("flex-1", showErrors && !clusterId && "border-destructive")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {clusters.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="shrink-0 gap-1.5" onClick={() => setClusterDialogOpen(true)}>
                          <Plus className="size-4" />
                          {t("New cluster")}
                        </Button>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t("Servers in one cluster share their cloud servers' capacity.")}
                      </p>
                    </div>
                    <div>
                      <FieldLabel required>{t("Number of servers")}</FieldLabel>
                      <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: MAX_COUNT }, (_, i) => i + 1).map((c) => (
                            <SelectItem key={c} value={String(c)}>
                              {c === 1 ? t("1 dedicated server") : t("{n} dedicated servers", { n: n(c) })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      note={t("A server stays in the region it is created in; the region cannot be changed later.")}
                    />
                  </div>
                </div>
              </StepSection>
            )}

            {step === 1 && (
              <StepSection icon={Cpu} title={t("Hardware")}>
                {/* The billing period first: it sets every price below. */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{t("Billing period")}</span>
                  <div className="inline-flex rounded-lg border border-border p-0.5">
                    {HOST_PERIODS.map((p) => (
                      <button
                        key={p.months}
                        type="button"
                        onClick={() => setMonths(p.months)}
                        aria-pressed={months === p.months}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                          months === p.months ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {p.months === 1 ? t("1 month") : t("{n} months", { n: n(p.months) })}
                        {p.discount > 0 && (
                          <span className="rounded bg-emerald-500/10 px-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {t("{n}% off", { n: n(Math.round(p.discount * 100)) })}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div role="radiogroup" className="space-y-3">
                  {HOST_PLANS.map((p) => (
                    <HostCard
                      key={p.id}
                      plan={p}
                      selected={p.id === planId}
                      onSelect={() => p.availability !== "soldOut" && setPlanId(p.id)}
                      price={format(monthlyOf(p))}
                      fullPrice={period.discount > 0 ? format(round(p.monthly[currency])) : undefined}
                    />
                  ))}
                </div>
              </StepSection>
            )}

            {step === 2 && (
              <StepSection icon={Check} title={t("Review & create")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ReviewBlock title={t("Basics")} onEdit={() => setStep(0)}>
                    <ReviewLine label={t("Server name")} value={<span dir="ltr">{name}</span>} />
                    <ReviewLine label={t("Region")} value={`${t(region.city)} · ${zone}`} />
                    <ReviewLine label={t("Cluster")} value={<span dir="ltr">{clusterName}</span>} />
                    <ReviewLine label={t("Number of servers")} value={n(count)} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Hardware")} onEdit={() => setStep(1)}>
                    <ReviewLine label={t("Model")} value={<span dir="ltr">{plan.model}</span>} />
                    <ReviewLine label={t("Processor")} value={<span dir="ltr">{plan.cpu}</span>} />
                    <ReviewLine label={t("RAM")} value={`${n(plan.ramGb)} ${t("GB")}`} />
                    <ReviewLine
                      label={t("Billing period")}
                      value={months === 1 ? t("1 month") : t("{n} months", { n: n(months) })}
                    />
                  </ReviewBlock>
                </div>

                {/* Auto-renewal, on by default and marked as recommended. */}
                <label
                  className={cn(
                    "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    autoRenew ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                  )}
                >
                  <Checkbox checked={autoRenew} onCheckedChange={(v) => setAutoRenew(v === true)} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <RefreshCw className={cn("size-4", autoRenew ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-semibold text-foreground">{t("Auto-renew")}</span>
                      <Pill tone="ok">{t("Recommended")}</Pill>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t("When the period ends, the next one is paid from your wallet and the server keeps running.")}
                    </span>
                  </span>
                </label>
                <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="mt-px size-4 shrink-0" />
                  <span>
                    {t("If the wallet does not cover the renewal, auto-renew stops and the server, with the cloud servers on it, is removed.")}
                  </span>
                </div>
              </StepSection>
            )}
          </Card>
        </div>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Estimated price")}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">{format(perMonth)}</span>
              <span className="text-sm text-muted-foreground">{t("/ month")}</span>
            </div>
            {months > 1 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("{amount} for {n} months", { amount: format(totalForPeriod), n: n(months) })}
              </p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
              <SummaryLine icon={Server} label={t("Server name")} value={<span dir="ltr">{name || "-"}</span>} />
              <SummaryLine icon={MapPin} label={t("Region")} value={`${t(region.city)} · ${zone}`} />
              <SummaryLine icon={Boxes} label={t("Cluster")} value={<span dir="ltr">{clusterName}</span>} />
              <SummaryLine icon={Layers} label={t("Number of servers")} value={n(count)} />
              <SummaryLine icon={ServerCog} label={t("Model")} value={<span dir="ltr">{plan.model}</span>} />
              <SummaryLine
                icon={CalendarClock}
                label={t("Billing period")}
                value={months === 1 ? t("1 month") : t("{n} months", { n: n(months) })}
              />
              <SummaryLine icon={RefreshCw} label={t("Auto-renew")} value={autoRenew ? t("Enabled") : t("Off")} />
            </div>

            <Button onClick={create} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("Create dedicated server")}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToList }}
        back={{ label: t("Back"), onClick: () => (step === 0 ? goToList() : setStep((s) => s - 1)) }}
        primary={{
          label: isLast ? t("Create dedicated server") : t("Next"),
          onClick: isLast ? create : () => setStep((s) => s + 1),
        }}
      />

      <NewClusterDialog
        open={clusterDialogOpen}
        onOpenChange={setClusterDialogOpen}
        onCreated={(id) => setClusterId(id)}
        taken={clusters.map((c) => c.name)}
      />
    </CreatePage>
  );
}

/** One machine: its model and availability, its specs, and its price for the
    chosen period. Our own card; the selected one takes the brand edge. */
function HostCard({
  plan,
  selected,
  onSelect,
  price,
  fullPrice,
}: {
  plan: HostPlan;
  selected: boolean;
  onSelect: () => void;
  price: string;
  fullPrice?: string;
}) {
  const t = useT();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const soldOut = plan.availability === "soldOut";
  const avail = AVAILABILITY[plan.availability];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={soldOut}
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        soldOut
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-primary/50 bg-primary/[0.04]"
            : "border-border hover:border-primary/30 hover:bg-muted/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected && <Check className="size-3" />}
        </span>
        <span className="text-sm font-semibold text-foreground" dir="ltr">
          {plan.model}
        </span>
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", avail.tone)}>{t(avail.label)}</span>
        <span className="ms-auto text-end">
          {fullPrice && <span className="me-2 text-xs text-muted-foreground line-through">{fullPrice}</span>}
          <span className="text-base font-bold text-foreground">{price}</span>
          <span className="ms-1 text-xs text-muted-foreground">{t("/ month")}</span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-3">
        <Spec icon={Cpu} label={t("Processor")} value={<span dir="ltr">{plan.cpu}</span>} sub={t("{n} cores", { n: n(plan.cores) })} />
        <Spec icon={MemoryStick} label={t("RAM")} value={`${n(plan.ramGb)} ${t("GB")}`} />
        <Spec icon={HardDrive} label={t("Disk")} value={<span dir="ltr">{plan.disk}</span>} />
        <Spec icon={Network} label={t("Network")} value={<span dir="ltr">{plan.network}</span>} />
        <Spec icon={Server} label={t("Cloud servers")} value={t("Up to {n}", { n: n(plan.maxVms) })} />
      </div>
    </button>
  );
}

function Spec({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/** A new cluster, in a popup: a name and, if wanted, what it is for. */
function NewClusterDialog({
  open,
  onOpenChange,
  onCreated,
  taken,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
  taken: string[];
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setTried(false);
    }
  }, [open]);

  const error = !NAME_RE.test(name)
    ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
    : taken.includes(name)
      ? t("A cluster with this name already exists.")
      : null;

  const submit = () => {
    setTried(true);
    if (error) return;
    const cluster = addCluster(name, description.trim() || undefined);
    onCreated(cluster.id);
    toast.success(t("Cluster {name} created.", { name }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("New cluster")}</DialogTitle>
          <DialogDescription>{t("Group dedicated servers so their cloud servers can share capacity.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel required htmlFor="cluster-name">
              {t("Cluster name")}
            </FieldLabel>
            <Input
              id="cluster-name"
              dir="ltr"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="production"
              className={cn(tried && error && "border-destructive")}
            />
            {tried && error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
          </div>
          <div>
            <FieldLabel optional htmlFor="cluster-desc">
              {t("Description")}
            </FieldLabel>
            <Textarea id="cluster-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit}>{t("Create cluster")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
