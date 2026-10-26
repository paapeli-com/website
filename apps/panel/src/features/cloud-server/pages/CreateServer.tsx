import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArchiveRestore,
  ArrowRight,
  Check,
  Cpu,
  Disc,
  Globe,
  HardDrive,
  Info,
  KeyRound,
  Lock,
  MapPin,
  Microchip,
  Pencil,
  Plus,
  Repeat,
  Server,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Slider } from "@/features/factory/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
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
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import {
  CREATE_GPU_SERVER_PATH,
  CreateFooter,
  CreateHeader,
  CreatePage,
  GPU_SERVERS_PATH,
  NEW_SERVER_PATH,
  SERVERS_PATH,
  SERVER_CREATED_PATH,
} from "../ui";
import {
  clearQuickCreate,
  loadQuickCreate,
  saveQuickCreate,
  type CreateMode,
  type CreatedServer,
} from "../lib/quickCreate";
import { OsLogo } from "../lib/osLogos";
import { addServer, sampleAddresses } from "../lib/serverStore";
import { CountryFlag, CountryOutline } from "../lib/regionArt";
import {
  ADDITIONAL_DISK_MAX_GB,
  BOOT_DISK_MAX_GB,
  DEFAULT_FIREWALL_ID,
  DEFAULT_IMAGE,
  DEFAULT_GPU_PLAN_ID,
  DEFAULT_PLAN_ID,
  BACKUP_RATE,
  adminUser,
  DISK_GB_MONTHLY,
  FIREWALLS,
  FLOATING_IPS,
  HOURS_PER_MONTH,
  IMAGES,
  PLANS,
  REGIONS,
  SSH_KEYS,
  type GpuAvailability,
  type Plan,
  type PlanFamily,
  type SshKey,
} from "../lib/catalog";

/* Create cloud server: the seven-step wizard.
 *
 * Built on the panel's own pieces so it reads like the rest of it: the
 * Smart Factory form kit (Input, Select, FieldLabel), the device list's table
 * treatment for the plan list, and the sticky footer every Smart Factory form
 * ends on (Cancel, Back, then the step's primary action), so the buttons sit
 * in the same place on every step and never scroll away.
 *
 * Every step opens on a default that works, so a server can be created from
 * any point: the step bar jumps anywhere, and Create checks the whole form,
 * returning you to the first step that is short. Brand orange is kept for the
 * primary button and the current step; a selection is a light tint, not a
 * block of colour.
 *
 * GPU servers use the same wizard in GPU mode: the same steps and the same
 * VM underneath, with the plan step listing GPU plans only, the drivers
 * offered with the image, and the price shown by the hour, the way GPU time
 * is usually counted. In cloud mode the GPU plan card stays, and points to
 * the GPU wizard instead of listing plans, so a GPU server is made one way.
 *
 * Nothing is sent anywhere yet. See lib/catalog.ts.
 */

const STEPS = ["Basics", "Image", "Plan", "Disk", "Network", "Security", "Review & create"] as const;
const SECURITY_STEP = 5;
const REVIEW_STEP = 6;

const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;
const looksLikePublicKey = (k: string) => /^(ssh-(ed25519|rsa|dss)|ecdsa-sha2-\S+|sk-\S+)\s+\S{20,}/.test(k.trim());

const FAMILY_ICON: Record<PlanFamily, LucideIcon> = { shared: Cpu, dedicated: Server, gpu: Microchip };
const FAMILY_TEXT: Record<PlanFamily, [string, string]> = {
  shared: ["Shared vCPU", "Good for websites, development and most workloads."],
  dedicated: ["Dedicated vCPU", "Cores reserved for you, for steady high load."],
  gpu: ["GPU", "For training, inference and rendering."],
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  const out = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  /* Guarantee a digit and a letter, whatever the draw was. */
  return `${out.slice(0, 14)}7k`;
}

let diskSeq = 0;

/** Where a disk shows up inside the server. On Linux the boot disk is sda,
    then sdb, sdc and on; on Windows it is drive C:, then D:, E: and on. */
const devicePath = (index: number, family: "linux" | "windows") =>
  family === "windows" ? `${String.fromCharCode(67 + index)}:` : `/dev/sd${String.fromCharCode(97 + index)}`;

/* The boot disk slider runs on a log scale: from 25 GB to 1 TB, a linear one
   puts 50, 100 and 200 GB in the first sliver of the track. On a log scale
   each doubling takes the same distance, so the marks are evenly readable. */
const SLIDER_STEPS = 1000;
const toSlider = (gb: number, min: number) =>
  Math.round((SLIDER_STEPS * Math.log(gb / min)) / Math.log(BOOT_DISK_MAX_GB / min));
const fromSlider = (pos: number, min: number) => {
  const raw = min * Math.pow(BOOT_DISK_MAX_GB / min, pos / SLIDER_STEPS);
  const snap = raw < 100 ? 5 : raw < 500 ? 10 : 50;
  return Math.round(raw / snap) * snap;
};
/** The marks under the slider: the plan's own size, then round sizes. */
const sliderMarks = (min: number) => [
  min,
  ...[50, 100, 200, 500, 1000].filter((gb) => gb <= BOOT_DISK_MAX_GB && gb / min >= 1.3),
];

const AVAILABILITY: Record<GpuAvailability, { label: string; tone: string }> = {
  available: { label: "Available", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  limited: { label: "Limited", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  soldOut: { label: "Sold out", tone: "bg-muted text-muted-foreground" },
};

export default function CreateServer({ mode = "cloud" }: { mode?: CreateMode }) {
  const isGpu = mode === "gpu";
  const t = useT();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const goToServers = () => navigate(isGpu ? GPU_SERVERS_PATH : SERVERS_PATH);

  // ---- Form state -------------------------------------------------------
  /* Settings kept from an earlier create, when the user asked for that.
     Anything that no longer exists in the catalogue falls back to its
     default. */
  const [saved] = useState(() => loadQuickCreate(mode));
  const [keepSettings, setKeepSettings] = useState(!!saved);
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [showErrors, setShowErrors] = useState(false);

  const [name, setName] = useState(isGpu ? "gpu-server-01" : "server-01");
  const [regionId, setRegionId] = useState(
    REGIONS.some((r) => r.id === saved?.regionId) ? saved!.regionId : REGIONS[0].id,
  );
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones.includes(saved?.zone ?? "") ? saved!.zone : region.zones[0]);

  const savedImage = IMAGES.find((i) => i.id === saved?.imageId && i.versions.includes(saved.version));
  const startImage = savedImage ? { imageId: savedImage.id, version: saved!.version } : DEFAULT_IMAGE;
  const [imageId, setImageId] = useState(startImage.imageId);
  const [versions, setVersions] = useState<Record<string, string>>(() =>
    Object.fromEntries(IMAGES.map((i) => [i.id, i.id === startImage.imageId ? startImage.version : i.versions[0]])),
  );
  const image = IMAGES.find((i) => i.id === imageId) ?? IMAGES[0];

  /* Only this mode's plans, and never one that is sold out. */
  const modePlans = PLANS.filter((p) => (p.family === "gpu") === isGpu);
  const [planId, setPlanId] = useState(() =>
    modePlans.some((p) => p.id === saved?.planId && p.availability !== "soldOut")
      ? saved!.planId
      : isGpu
        ? DEFAULT_GPU_PLAN_ID
        : DEFAULT_PLAN_ID,
  );
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const [family, setFamily] = useState<PlanFamily>(plan.family);

  const startBoot = Math.min(BOOT_DISK_MAX_GB, Math.max(plan.diskGb, saved?.bootGb ?? plan.diskGb));
  const [bootGb, setBootGb] = useState(startBoot);
  const [bootDraft, setBootDraft] = useState(String(startBoot));
  const [extraDisks, setExtraDisks] = useState<{ id: number; sizeGb: number }[]>(() =>
    (saved?.extraDisks ?? []).slice(0, 8).map((sizeGb) => ({ id: ++diskSeq, sizeGb })),
  );

  const [ipv6, setIpv6] = useState(saved?.ipv6 ?? true);
  const [floatingIpId, setFloatingIpId] = useState("none");

  /* A generated password is the default: it needs nothing from someone who
     has no SSH key yet, and is shown once the server is ready. */
  const [access, setAccess] = useState<"ssh" | "password">(saved?.access ?? "password");
  const [keys, setKeys] = useState<SshKey[]>(SSH_KEYS);
  const [sshKeyId, setSshKeyId] = useState(
    SSH_KEYS.some((k) => k.id === saved?.sshKeyId) ? saved!.sshKeyId! : (SSH_KEYS[0]?.id ?? ""),
  );
  const [firewallId, setFirewallId] = useState(
    FIREWALLS.some((f) => f.id === saved?.firewallId) ? saved!.firewallId : DEFAULT_FIREWALL_ID,
  );
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const [backup, setBackup] = useState(saved?.backup ?? true);
  const [installDrivers, setInstallDrivers] = useState(saved?.installDrivers ?? true);
  const [powerOn, setPowerOn] = useState(saved?.powerOn ?? true);
  const [script, setScript] = useState("");

  useEffect(() => {
    setVisited((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
  }, [step]);

  // ---- Validation ---------------------------------------------------------
  const nameOk = NAME_RE.test(name);
  const accessOk = access === "password" || !!sshKeyId;
  const stepOk = (i: number) => (i === 0 ? nameOk : i === SECURITY_STEP ? accessOk : true);

  // ---- Price ----------------------------------------------------------------
  const extraGb = extraDisks.reduce((sum, d) => sum + d.sizeGb, 0);
  const roundMoney = (raw: number) => (currency === "TOMAN" ? Math.round(raw / 1000) * 1000 : Math.round(raw * 100) / 100);
  const serverMonthly = plan.monthly[currency] + (bootGb - plan.diskGb + extraGb) * DISK_GB_MONTHLY[currency];
  /* Backup is a share of what it protects: the server and every disk. */
  const backupMonthly = roundMoney(serverMonthly * BACKUP_RATE);
  const monthly = useMemo(
    () => roundMoney(serverMonthly) + (backup ? backupMonthly : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverMonthly, backup, backupMonthly, currency],
  );
  const hourly = currency === "TOMAN" ? Math.round(monthly / HOURS_PER_MONTH) : Math.round((monthly / HOURS_PER_MONTH) * 1000) / 1000;

  // ---- Actions ------------------------------------------------------------
  const choosePlan = (p: Plan) => {
    setPlanId(p.id);
    /* The boot disk can never be smaller than what the plan includes. */
    if (bootGb < p.diskGb) {
      setBootGb(p.diskGb);
      setBootDraft(String(p.diskGb));
    }
  };

  const chooseFamily = (f: PlanFamily) => {
    setFamily(f);
    /* GPU here only shows the way to the GPU wizard; the chosen plan stays. */
    if (f !== "gpu" && plan.family !== f) choosePlan(PLANS.find((p) => p.family === f)!);
  };

  const setBoot = (gb: number) => {
    const clamped = Math.min(BOOT_DISK_MAX_GB, Math.max(plan.diskGb, Math.round(gb)));
    setBootGb(clamped);
    setBootDraft(String(clamped));
  };

  const create = () => {
    const firstBad = [0, SECURITY_STEP].find((i) => !stepOk(i));
    if (firstBad !== undefined) {
      setShowErrors(true);
      setStep(firstBad);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    if (keepSettings) {
      saveQuickCreate(mode, {
        regionId,
        zone,
        imageId,
        version: versions[imageId],
        planId,
        bootGb,
        extraDisks: extraDisks.map((d) => d.sizeGb),
        backup,
        installDrivers,
        ipv6,
        access,
        sshKeyId: access === "ssh" ? sshKeyId : undefined,
        firewallId,
        powerOn,
      });
    } else {
      clearQuickCreate(mode);
    }
    const id = `srv-${Date.now().toString(36)}`;
    const addresses = sampleAddresses(id);
    /* Into the server list straight away, as a server being created. */
    addServer({
      id,
      kind: mode,
      gpu: plan.gpu,
      name,
      imageId,
      image: `${image.name} ${versions[imageId]}`,
      planId: plan.id,
      vcpu: plan.vcpu,
      ramGb: plan.ramGb,
      diskGb: bootGb + extraGb,
      region: region.city,
      zone,
      ipv4: addresses.ipv4,
      ipv6: ipv6 ? addresses.ipv6 : undefined,
      powerOn,
      createdAt: Date.now(),
    });
    const created: CreatedServer = {
      kind: mode,
      gpu: plan.gpu,
      osFamily: image.family,
      name,
      image: `${image.name} ${versions[imageId]}`,
      spec: `${plan.vcpu} vCPU · ${plan.ramGb} GB RAM`,
      ipv6,
      ipv4Address: addresses.ipv4,
      username: adminUser(image.family),
      ipv6Address: addresses.ipv6,
      access,
      sshKeyName: access === "ssh" ? keys.find((k) => k.id === sshKeyId)?.name : undefined,
      password: access === "password" ? generatePassword() : undefined,
      powerOn,
    };
    toast.success(t("{name} is being created.", { name }));
    navigate(SERVER_CREATED_PATH, { state: created });
  };

  const isLast = step === REVIEW_STEP;

  // ---- Render ---------------------------------------------------------------
  return (
    <CreatePage>
      <CreateHeader
        gpu={isGpu}
        title={isGpu ? t("Create GPU server") : undefined}
        description={isGpu ? t("A virtual machine with a dedicated GPU") : t("Set up a virtual machine in a few steps.")}
      />

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
              <StepSection icon={Server} title={t("Basics")}>
                <div className="space-y-5">
                  <div>
                    <FieldLabel required htmlFor="server-name">
                      {t("Server name")}
                    </FieldLabel>
                    <Input
                      id="server-name"
                      dir="ltr"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase())}
                      aria-invalid={showErrors && !nameOk}
                      className={cn("max-w-md", showErrors && !nameOk && "border-destructive focus-visible:ring-destructive/40")}
                    />
                    <p className={cn("mt-1.5 text-xs", showErrors && !nameOk ? "text-destructive" : "text-muted-foreground")}>
                      {showErrors && !nameOk
                        ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
                        : t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}
                    </p>
                  </div>

                  {/* Region and zone: a card per region, with the zone picked
                      inside the card it belongs to. One region for now; the
                      grid takes more as they open. */}
                  <div className="border-t border-border pt-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <MapPin className="size-[18px]" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{t("Region and availability zone")}</h3>
                        <p className="text-xs text-muted-foreground">{t("Choose where your server will be located.")}</p>
                      </div>
                    </div>

                    <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {REGIONS.map((r) => {
                        const selected = r.id === regionId;
                        return (
                          <OptionCard
                            key={r.id}
                            selected={selected}
                            onSelect={() => {
                              if (r.id === regionId) return;
                              setRegionId(r.id);
                              setZone(r.zones[0]);
                            }}
                          >
                            <div className="relative">
                              <CountryOutline
                                country={r.country}
                                className={cn(
                                  "pointer-events-none absolute -top-1 start-0 h-16 w-20",
                                  selected ? "text-primary/15" : "text-muted",
                                )}
                              />
                              <div className="relative ps-24">
                                <CountryFlag country={r.country} className="h-3.5 w-6 rounded-[2px]" />
                                <p className="mt-1.5 text-base font-semibold text-foreground">{t(r.countryName)}</p>
                                <p className="text-xs text-muted-foreground">{t(r.city)}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {r.tags.map((tag) => (
                                    <Pill key={tag} tone="ok">
                                      {t(tag)}
                                    </Pill>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                              <p className="mb-1.5 text-xs font-medium text-foreground">{t("Availability zone")}</p>
                              <Select
                                dir="ltr"
                                value={selected ? zone : r.zones[0]}
                                onValueChange={(v) => {
                                  setRegionId(r.id);
                                  setZone(v);
                                }}
                              >
                                <SelectTrigger className="h-9" dir="ltr">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {r.zones.map((z, i) => (
                                    <SelectItem key={z} value={z}>
                                      {i === 0 ? `${z} (${t("Default")})` : z}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </OptionCard>
                        );
                      })}
                    </div>

                    <Note className="mt-4">
                      {t("A server stays in the region it is created in; the region cannot be changed later.")}
                    </Note>
                  </div>

                </div>
              </StepSection>
            )}

            {step === 1 && (
              <StepSection icon={Disc} title={t("Operating system")}>
                <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {IMAGES.map((img) => (
                    <OptionCard key={img.id} selected={img.id === imageId} onSelect={() => setImageId(img.id)}>
                      <div className="flex items-center gap-3">
                        <OsLogo id={img.id} name={img.name} color={img.color} />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{img.name}</span>
                        {img.id === DEFAULT_IMAGE.imageId && <Pill tone="ok">{t("Recommended")}</Pill>}
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
                {isGpu && (
                  <label
                    className={cn(
                      "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                      installDrivers ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                    )}
                  >
                    <Checkbox checked={installDrivers} onCheckedChange={(v) => setInstallDrivers(v === true)} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {image.family === "windows" ? t("Install NVIDIA driver") : t("Install NVIDIA driver and CUDA")}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t("Ready on first boot, so the GPU works without setting anything up.")}
                      </span>
                    </span>
                  </label>
                )}
                <Note className="mt-4">
                  {t("Custom images you upload under Images & Operating Systems will appear here.")}
                </Note>
              </StepSection>
            )}

            {step === 2 && (
              <StepSection icon={isGpu ? Microchip : Cpu} title={t("Plan")}>
                {isGpu ? (
                  <GpuPlanTable plans={modePlans} planId={planId} onChoose={choosePlan} />
                ) : (
                  <>
                <div role="radiogroup" className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(Object.keys(FAMILY_TEXT) as PlanFamily[]).map((f) => {
                    const Icon = FAMILY_ICON[f];
                    return (
                      <OptionCard key={f} selected={family === f} onSelect={() => chooseFamily(f)}>
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("size-4 shrink-0", family === f ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t(FAMILY_TEXT[f][0])}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t(FAMILY_TEXT[f][1])}</p>
                      </OptionCard>
                    );
                  })}
                </div>


                    {family === "gpu" ? (
                      /* GPU servers have their own section and wizard; this
                         card leads there rather than listing plans twice. */
                      <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Microchip className="size-6" />
                        </span>
                        <p className="mt-4 text-base font-semibold text-foreground">{t("Need a GPU?")}</p>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("GPU servers have their own section, with the GPU models, their availability and the drivers.")}
                        </p>
                        <Button className="mt-5 gap-2" onClick={() => navigate(CREATE_GPU_SERVER_PATH)}>
                          {t("Create a GPU server")}
                          <ArrowRight className="size-4 rtl:rotate-180" />
                        </Button>
                      </div>
                    ) : (
                      <>
                {/* The device list's table treatment, so a list reads the same
                    in every product. One plan is chosen, so a radio rather than
                    the device list's checkboxes. */}
                <RadioGroup
                  dir={isRTL ? "rtl" : "ltr"}
                  value={planId}
                  onValueChange={(v) => choosePlan(PLANS.find((p) => p.id === v)!)}
                  className="mt-4 block"
                >
                  <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-[44px]" aria-label={t("Choose plan")} />
                          <TableHead>{t("Plan")}</TableHead>
                          <TableHead>{t("vCPU")}</TableHead>
                          <TableHead>{t("RAM")}</TableHead>
                          <TableHead>{t("Boot disk")}</TableHead>
                          <TableHead>{t("Traffic")}</TableHead>
                          <TableHead className="text-end">{t("Monthly price")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PLANS.filter((p) => p.family === family).map((p) => {
                          const selected = p.id === planId;
                          return (
                            <TableRow
                              key={p.id}
                              onClick={() => choosePlan(p)}
                              className={cn("cursor-pointer border-b", selected ? "bg-primary/[0.04] hover:bg-primary/[0.06]" : "hover:bg-muted/30")}
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
                              <TableCell>
                                {n(p.trafficTb)} {t("TB")}
                              </TableCell>
                              <TableCell className="text-end font-medium">{format(p.monthly[currency])}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </RadioGroup>
                      </>
                    )}
                  </>
                )}
              </StepSection>
            )}

            {step === 3 && (
              <StepSection icon={HardDrive} title={t("Disk")}>
                <div className="space-y-6">
                  <div>
                    <FieldLabel required>{t("Boot disk size")}</FieldLabel>
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="min-w-[200px] flex-1 px-1 pt-3">
                        <Slider
                          dir={isRTL ? "rtl" : "ltr"}
                          min={0}
                          max={SLIDER_STEPS}
                          step={1}
                          value={[toSlider(bootGb, plan.diskGb)]}
                          onValueChange={([v]) => setBoot(fromSlider(v, plan.diskGb))}
                          aria-label={t("Boot disk size")}
                          aria-valuetext={`${bootGb} GB`}
                        />
                        {/* Each mark sets the size it names. */}
                        <div className="relative mt-2 h-6">
                          {sliderMarks(plan.diskGb).map((gb, i, marks) => {
                            const pos = toSlider(gb, plan.diskGb) / SLIDER_STEPS;
                            /* A mark at either end hangs inward from its point
                               rather than centring on it, so its label stays
                               inside the card. */
                            const edge = pos <= 0.02 ? "start" : pos >= 0.98 ? "end" : "middle";
                            return (
                            <button
                              key={gb}
                              type="button"
                              onClick={() => setBoot(gb)}
                              style={{ insetInlineStart: `${pos * 100}%` }}
                              className={cn(
                                "absolute top-0 flex flex-col gap-0.5 whitespace-nowrap text-[11px] transition-colors",
                                edge === "start" && "items-start",
                                edge === "middle" && "-translate-x-1/2 items-center rtl:translate-x-1/2",
                                edge === "end" && "-translate-x-full items-end rtl:translate-x-full",
                                bootGb === gb ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <span aria-hidden className="h-1.5 w-px bg-border" />
                              {/* The unit in the page's language, as everywhere
                                  else here: a Latin "GB" beside Persian digits
                                  lands on the wrong side of the number. */}
                              {gb >= 1000 ? `${n(gb / 1000)} ${t("TB")}` : `${n(gb)} ${t("GB")}`}
                            </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          dir="ltr"
                          inputMode="numeric"
                          min={plan.diskGb}
                          max={BOOT_DISK_MAX_GB}
                          value={bootDraft}
                          onChange={(e) => setBootDraft(e.target.value)}
                          onBlur={() => setBoot(Number(bootDraft) || plan.diskGb)}
                          onKeyDown={(e) => e.key === "Enter" && setBoot(Number(bootDraft) || plan.diskGb)}
                          className="h-9 w-24"
                          aria-label={t("Boot disk size")}
                        />
                        <span className="text-sm text-muted-foreground">{t("GB")}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("The plan includes {n} GB. Extra space is billed per GB.", { n: n(plan.diskGb) })}
                    </p>
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <FieldLabel optional className="mb-0">
                          {t("Additional disks")}
                        </FieldLabel>
                        <p className="text-xs text-muted-foreground">{t("Extra SSD volumes for data, databases or backups.")}</p>
                      </div>
                      {extraDisks.length < 8 && (
                        <Button variant="outline" size="sm" onClick={() => setExtraDisks((d) => [...d, { id: ++diskSeq, sizeGb: 100 }])}>
                          <Plus className="me-1.5 size-4" />
                          {t("Add disk")}
                        </Button>
                      )}
                    </div>

                    {/* Every disk the server will have, the boot disk first, in
                        the device list's table treatment. The path is where the
                        disk appears inside the server. */}
                    <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>{t("Disk")}</TableHead>
                            <TableHead>{t("Size")}</TableHead>
                            <TableHead>{t("Path in the server")}</TableHead>
                            <TableHead className="w-[52px]" aria-label={t("Remove disk")} />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-b hover:bg-muted/30">
                            <TableCell>
                              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                <HardDrive className="size-4 text-muted-foreground" />
                                {t("Boot disk")}
                              </span>
                            </TableCell>
                            <TableCell>
                              {n(bootGb)} {t("GB")}
                            </TableCell>
                            <TableCell>
                              <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                                {devicePath(0, image.family)}
                              </code>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          {extraDisks.map((d, i) => (
                            <TableRow key={d.id} className="border-b hover:bg-muted/30">
                              <TableCell>
                                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                  <HardDrive className="size-4 text-muted-foreground" />
                                  {t("Additional disk {n}", { n: n(i + 1) })}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    dir="ltr"
                                    min={10}
                                    max={ADDITIONAL_DISK_MAX_GB}
                                    value={d.sizeGb}
                                    aria-label={t("Size")}
                                    onChange={(e) =>
                                      setExtraDisks((all) =>
                                        all.map((x) =>
                                          x.id === d.id
                                            ? { ...x, sizeGb: Math.min(ADDITIONAL_DISK_MAX_GB, Math.max(10, Number(e.target.value) || 10)) }
                                            : x,
                                        ),
                                      )
                                    }
                                    className="h-8 w-24"
                                  />
                                  <span className="text-muted-foreground">{t("GB")}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                                  {devicePath(i + 1, image.family)}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  aria-label={t("Remove disk")}
                                  onClick={() => setExtraDisks((all) => all.filter((x) => x.id !== d.id))}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Backup, on by default. A checklist row rather than a
                      switch, so what it includes is read before it is turned
                      off; the whole row is the target. */}
                  <div className="border-t border-border pt-5">
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        backup ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                      )}
                    >
                      <Checkbox checked={backup} onCheckedChange={(v) => setBackup(v === true)} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ArchiveRestore className={cn("size-4", backup ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("Enable backup")}</span>
                          {backup ? <Pill tone="ok">{t("Enabled")}</Pill> : <Pill>{t("Off")}</Pill>}
                          <span className="ms-auto text-sm font-medium text-foreground">
                            +{format(backupMonthly)} <span className="font-normal text-muted-foreground">{t("/ month")}</span>
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("Automatic backups of the whole server and its disks, so you can get it back if something goes wrong.")}
                        </p>
                        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-foreground sm:grid-cols-3">
                          {["A backup every day, automatically", "The last 7 days are kept", "Restore the whole server or one disk"].map(
                            (line) => (
                              <li key={line} className="flex items-center gap-1.5">
                                <Check className={cn("size-3.5 shrink-0", backup ? "text-emerald-600" : "text-muted-foreground")} />
                                {t(line)}
                              </li>
                            ),
                          )}
                        </ul>
                        {!backup && (
                          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                            {t("Without backup, data lost on this server cannot be recovered.")}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </StepSection>
            )}

            {step === 4 && (
              <StepSection icon={Globe} title={t("Network")}>
                <div className="space-y-3">
                  <SettingRow
                    icon={Globe}
                    title={t("Public IPv4")}
                    description={t("A fixed public IPv4 address is assigned to every server.")}
                    control={<Pill>{t("Included")}</Pill>}
                  />
                  <SettingRow
                    icon={Globe}
                    title={t("IPv6")}
                    description={t("Assign a public IPv6 address as well.")}
                    control={<Switch checked={ipv6} onCheckedChange={setIpv6} aria-label={t("IPv6")} />}
                  />
                  <SettingRow icon={Repeat} title={t("Floating IP")} description={t("A static address you can move between servers.")}>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Select value={floatingIpId} onValueChange={setFloatingIpId}>
                        <SelectTrigger className="h-9 w-full sm:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("None")}</SelectItem>
                          {FLOATING_IPS.map((ip) => (
                            <SelectItem key={ip.id} value={ip.id}>
                              {ip.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {FLOATING_IPS.length === 0 && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`${CLOUD_SERVER_BASE}/floating-ips`)}>
                          {t("Create a floating IP")}
                        </Button>
                      )}
                    </div>
                    {FLOATING_IPS.length === 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("No floating IP yet. Create one under Floating IPs, then attach it here or later.")}
                      </p>
                    )}
                  </SettingRow>
                </div>
              </StepSection>
            )}

            {step === 5 && (
              <StepSection icon={ShieldCheck} title={t("Security")}>
                <div className="space-y-6">
                  <div>
                    <FieldLabel required>{t("Access method")}</FieldLabel>
                    <div role="radiogroup" className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <OptionCard selected={access === "password"} onSelect={() => setAccess("password")}>
                        <div className="flex items-center gap-2.5">
                          <Lock className={cn("size-4", access === "password" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("Password")}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("Generated automatically and shown once the server is ready.")}
                        </p>
                      </OptionCard>
                      <OptionCard selected={access === "ssh"} onSelect={() => setAccess("ssh")}>
                        <div className="flex items-center gap-2.5">
                          <KeyRound className={cn("size-4", access === "ssh" ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold text-foreground">{t("SSH key")}</span>
                          <Pill tone="ok">{t("More secure")}</Pill>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("More secure, no password to leak.")}</p>
                      </OptionCard>
                    </div>
                  </div>

                  {access === "ssh" && (
                    <div>
                      <FieldLabel required>{t("SSH key")}</FieldLabel>
                      <div className="flex flex-wrap items-center gap-3">
                        <Select dir="ltr" value={sshKeyId} onValueChange={setSshKeyId}>
                          <SelectTrigger
                            className={cn("w-full sm:w-72", showErrors && !accessOk && "border-destructive")}
                            aria-invalid={showErrors && !accessOk}
                          >
                            <SelectValue placeholder={t("Choose an SSH key.")} />
                          </SelectTrigger>
                          <SelectContent>
                            {keys.map((k) => (
                              <SelectItem key={k.id} value={k.id}>
                                {k.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => setKeyDialogOpen(true)}>
                          <Plus className="me-1.5 size-4" />
                          {t("Add SSH key")}
                        </Button>
                      </div>
                      {showErrors && !accessOk && <p className="mt-1.5 text-xs text-destructive">{t("Choose an SSH key.")}</p>}
                    </div>
                  )}

                  <div className="border-t border-border pt-5">
                    <FieldLabel required>{t("Firewall")}</FieldLabel>
                    <p className="mb-2 text-xs text-muted-foreground">{t("Controls which traffic can reach the server.")}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select dir="ltr" value={firewallId} onValueChange={setFirewallId}>
                        <SelectTrigger className="w-full sm:w-72">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIREWALLS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              <span dir="ltr">
                                {f.name} <span className="text-muted-foreground">({f.rules})</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" onClick={() => navigate(`${CLOUD_SERVER_BASE}/security-groups`)}>
                        {t("Manage firewalls")}
                      </Button>
                    </div>
                  </div>
                </div>
              </StepSection>
            )}

            {step === 6 && (
              <StepSection icon={Check} title={t("Review & create")}>
                <div className="space-y-3">
                  <SettingRow
                    icon={Server}
                    title={t("Power on after creation")}
                    description={t("Start the server as soon as it is ready.")}
                    control={<Switch checked={powerOn} onCheckedChange={setPowerOn} aria-label={t("Power on after creation")} />}
                  />
                  <SettingRow icon={Disc} title={<>{t("Startup script")} <span className="font-normal text-muted-foreground">({t("Optional")})</span></>} description={t("Runs once on first boot (cloud-init).")}>
                    <Textarea
                      dir="ltr"
                      rows={5}
                      spellCheck={false}
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder={"#!/bin/bash\napt-get update -y"}
                      className="mt-3 font-mono text-xs"
                    />
                  </SettingRow>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ReviewBlock title={t("Basics")} onEdit={() => setStep(0)}>
                    <ReviewLine label={t("Server name")} value={<span dir="ltr">{name}</span>} />
                    <ReviewLine label={t("Region")} value={`${t(region.city)} · ${zone}`} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Image")} onEdit={() => setStep(1)}>
                    <ReviewLine label={t("Operating system")} value={<span dir="ltr">{`${image.name} ${versions[image.id]}`}</span>} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Plan")} onEdit={() => setStep(2)}>
                    <ReviewLine label={t("Plan")} value={<span dir="ltr">{plan.id.toUpperCase()}</span>} />
                    <ReviewLine
                      label={t("Resources")}
                      value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })}
                    />
                    {plan.gpu && <ReviewLine label={t("GPU")} value={<span dir="ltr">{plan.gpu}</span>} />}
                  </ReviewBlock>
                  <ReviewBlock title={t("Disk")} onEdit={() => setStep(3)}>
                    <ReviewLine label={t("Boot disk")} value={`${n(bootGb)} ${t("GB")}`} />
                    <ReviewLine
                      label={t("Additional disks")}
                      value={extraDisks.length ? extraDisks.map((d) => n(d.sizeGb)).join(" + ") + ` ${t("GB")}` : t("None")}
                    />
                    <ReviewLine label={t("Backup")} value={backup ? t("Daily") : t("Off")} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Network")} onEdit={() => setStep(4)}>
                    <ReviewLine label={t("Public IPv4")} value={t("Included")} />
                    <ReviewLine label={t("IPv6")} value={ipv6 ? t("Enabled") : t("Off")} />
                    <ReviewLine label={t("Floating IP")} value={t("None")} />
                  </ReviewBlock>
                  <ReviewBlock title={t("Security")} onEdit={() => setStep(SECURITY_STEP)}>
                    <ReviewLine
                      label={t("Access")}
                      value={access === "ssh" ? <span dir="ltr">{keys.find((k) => k.id === sshKeyId)?.name ?? "-"}</span> : t("Password")}
                    />
                    <ReviewLine label={t("Firewall")} value={<span dir="ltr">{FIREWALLS.find((f) => f.id === firewallId)?.name}</span>} />
                  </ReviewBlock>
                </div>
              </StepSection>
            )}
          </Card>
        </div>

        {/* The running total and what it is for. Sticky on wide screens so
            the price stays in view while the steps scroll. */}
        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Estimated price")}</p>
            {/* GPU time is counted by the hour, so a GPU server leads with
                the hourly figure. */}
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold text-foreground tabular-nums">{format(isGpu ? hourly : monthly)}</span>
              <span className="text-sm text-muted-foreground">{isGpu ? t("/ hour") : t("/ month")}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isGpu
                ? t("about {amount} / month", { amount: format(monthly) })
                : t("about {amount} / hour", { amount: format(hourly) })}
            </p>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
              <SummaryLine icon={Server} label={t("Server name")} value={<span dir="ltr">{name || "-"}</span>} />
              <SummaryLine icon={MapPin} label={t("Region")} value={`${t(region.city)} · ${zone}`} />
              <SummaryLine
                icon={Disc}
                label={t("Image")}
                value={
                  <span dir="ltr" className="inline-flex items-center gap-1.5">
                    <OsLogo
                      id={image.id}
                      name={image.name}
                      color={image.color}
                      className="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold [&_svg]:size-3.5"
                    />
                    {`${image.name} ${versions[image.id]}`}
                  </span>
                }
              />
              {isGpu && plan.gpu && (
                <SummaryLine icon={Microchip} label={t("GPU")} value={<span dir="ltr">{plan.gpu}</span>} />
              )}
              <SummaryLine
                icon={Cpu}
                label={t("Plan")}
                /* One translated phrase rather than pieces: a Latin "vCPU"
                   between Persian digits scrambles their order. */
                value={t("{cpu} vCPU · {ram} GB RAM", { cpu: n(plan.vcpu), ram: n(plan.ramGb) })}
              />
              {isGpu && (
                <SummaryLine icon={Disc} label={t("Driver")} value={installDrivers ? t("Enabled") : t("Off")} />
              )}
              <SummaryLine icon={HardDrive} label={t("Boot disk")} value={`${n(bootGb)} ${t("GB")}`} />
              {extraGb > 0 && <SummaryLine icon={HardDrive} label={t("Additional disk")} value={`${n(extraGb)} ${t("GB")}`} />}
              <SummaryLine icon={ArchiveRestore} label={t("Backup")} value={backup ? t("Daily") : t("Off")} />
              <SummaryLine icon={Globe} label={t("Network")} value={ipv6 ? "IPv4 · IPv6" : "IPv4"} />
              <SummaryLine
                icon={KeyRound}
                label={t("Access")}
                value={access === "ssh" ? <span dir="ltr">{keys.find((k) => k.id === sshKeyId)?.name ?? "-"}</span> : t("Password")}
              />
              <SummaryLine
                icon={ShieldCheck}
                label={t("Firewall")}
                value={<span dir="ltr">{FIREWALLS.find((f) => f.id === firewallId)?.name}</span>}
              />
            </div>

            {/* Create from any step: every step starts from a working default,
                and a short one sends you back to it. */}
            <Button onClick={create} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("Quick create server")}
            </Button>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={keepSettings}
                onCheckedChange={(v) => setKeepSettings(v === true)}
                className="mt-px"
              />
              <span>{t("Keep these settings for quick create next time")}</span>
            </label>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToServers }}
        /* On the first step, Back returns to the choice of one machine or an
           Auto Scale group. */
        back={{
          label: t("Back"),
          onClick: () => (step === 0 ? (isGpu ? goToServers() : navigate(NEW_SERVER_PATH)) : setStep((s) => s - 1)),
        }}
        primary={{ label: isLast ? t("Create server") : t("Next"), onClick: isLast ? create : () => setStep((s) => s + 1) }}
      />

      <AddKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        onAdd={(key) => {
          setKeys((all) => [...all, key]);
          setSshKeyId(key.id);
        }}
      />
    </CreatePage>
  );
}

// ---- Pieces ------------------------------------------------------------------

/** The GPU plans, in the device list's table treatment. A sold-out plan is
    shown, so the range is visible, but cannot be chosen. */
function GpuPlanTable({ plans, planId, onChoose }: { plans: Plan[]; planId: string; onChoose: (p: Plan) => void }) {
  const t = useT();
  const { isRTL } = useLanguage();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const hourlyOf = (p: Plan) => {
    const raw = p.monthly[currency] / HOURS_PER_MONTH;
    return currency === "TOMAN" ? Math.round(raw) : Math.round(raw * 100) / 100;
  };
  return (
    <RadioGroup
      dir={isRTL ? "rtl" : "ltr"}
      value={planId}
      onValueChange={(v) => onChoose(plans.find((p) => p.id === v)!)}
      className="block"
    >
      <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[44px]" aria-label={t("Choose plan")} />
              <TableHead>{t("GPU model")}</TableHead>
              <TableHead>{t("GPUs")}</TableHead>
              <TableHead>{t("GPU memory")}</TableHead>
              <TableHead>{t("vCPU")}</TableHead>
              <TableHead>{t("RAM")}</TableHead>
              <TableHead>{t("Boot disk")}</TableHead>
              <TableHead>{t("Availability")}</TableHead>
              <TableHead className="text-end">{t("Price")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => {
              const selected = p.id === planId;
              const soldOut = p.availability === "soldOut";
              const avail = AVAILABILITY[p.availability ?? "available"];
              return (
                <TableRow
                  key={p.id}
                  onClick={() => !soldOut && onChoose(p)}
                  aria-disabled={soldOut}
                  className={cn(
                    "border-b",
                    soldOut
                      ? "cursor-not-allowed opacity-60 hover:bg-transparent"
                      : selected
                        ? "cursor-pointer bg-primary/[0.04] hover:bg-primary/[0.06]"
                        : "cursor-pointer hover:bg-muted/30",
                  )}
                >
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <RadioGroupItem value={p.id} disabled={soldOut} aria-label={p.gpu} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium" dir="ltr">
                    NVIDIA {p.gpuModel}
                  </TableCell>
                  <TableCell>{n(p.gpuCount ?? 1)}</TableCell>
                  <TableCell>
                    {n(p.vramGb ?? 0)} {t("GB")}
                  </TableCell>
                  <TableCell>{n(p.vcpu)}</TableCell>
                  <TableCell>
                    {n(p.ramGb)} {t("GB")}
                  </TableCell>
                  <TableCell>
                    {n(p.diskGb)} {t("GB")}
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium", avail.tone)}>
                      {t(avail.label)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="font-medium">
                      {format(hourlyOf(p))} {t("/ hour")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(p.monthly[currency])} {t("/ month")}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </RadioGroup>
  );
}

/** The alert rule wizard's step indicator, mark for mark: small numbered
    dots with the label beside them and a short rule between. Any step can be
    opened. A step left short after a Create attempt is marked red. */
function StepBar({
  current,
  labels,
  done,
  invalid,
  onSelect,
}: {
  current: number;
  labels: string[];
  done: (i: number) => boolean;
  invalid: (i: number) => boolean;
  onSelect: (i: number) => void;
}) {
  const language = useAppLanguage();
  const { isRTL } = useLanguage();
  return (
    <nav className="mb-5 mt-1 flex items-center gap-1 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const isCurrent = i === current;
        const isDone = done(i);
        const isBad = invalid(i);
        return (
          <div key={label} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex cursor-pointer items-center gap-1 rounded-full outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  isBad
                    ? "bg-destructive/10 text-destructive"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {isDone && !isBad ? <Check className="h-3.5 w-3.5" /> : localizeDigits(language, i + 1)}
              </span>
              <span
                className={cn(
                  /* A step larger in Persian and Arabic, whose script reads
                     smaller at the same size; the alert rule wizard does the
                     same. */
                  "hidden whitespace-nowrap sm:inline",
                  isRTL ? "text-sm" : "text-xs",
                  isBad ? "text-destructive" : isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
          </div>
        );
      })}
    </nav>
  );
}

function StepSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-[18px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A choosable card. Selected is a thin brand edge and a faint tint. */
function OptionCard({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "relative cursor-pointer rounded-xl border p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30 hover:bg-muted/30",
      )}
    >
      {selected && (
        <span className="absolute end-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
      <div className="pe-5">{children}</div>
    </div>
  );
}

/** One setting: icon, what it is, and its control on the far side. */
function SettingRow({
  icon: Icon,
  title,
  description,
  control,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description: string;
  control?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children && <div className="ps-7">{children}</div>}
    </div>
  );
}

/** Neutral, not blue: an aside, not an alert. */
function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "ok" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        tone === "ok" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t("Edit")}
        </Button>
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-end font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ms-auto min-w-0 truncate text-end font-medium text-foreground">{value}</span>
    </div>
  );
}

function AddKeyDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: SshKey) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [tried, setTried] = useState(false);
  const keyOk = looksLikePublicKey(key);
  const ok = !!name.trim() && keyOk;

  useEffect(() => {
    if (open) {
      setName("");
      setKey("");
      setTried(false);
    }
  }, [open]);

  const submit = () => {
    setTried(true);
    if (!ok) return;
    const body = key.trim().split(/\s+/)[1] ?? "";
    onAdd({ id: `key-${Date.now()}`, name: name.trim(), fingerprint: `SHA256:${body.slice(0, 4)}…${body.slice(-4)}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-uniform-type className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Add SSH key")}</DialogTitle>
          <DialogDescription>{t("Paste a public key, for example the contents of ~/.ssh/id_ed25519.pub.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel required htmlFor="key-name">
              {t("Key name")}
            </FieldLabel>
            <Input id="key-name" dir="ltr" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FieldLabel required htmlFor="key-body">
              {t("Public key")}
            </FieldLabel>
            <Textarea
              id="key-body"
              dir="ltr"
              rows={4}
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ssh-ed25519 AAAA…"
              className={cn("font-mono text-xs", tried && !keyOk && "border-destructive")}
            />
            {tried && !keyOk && <p className="mt-1.5 text-xs text-destructive">{t("This does not look like a public key.")}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit}>{t("Add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
