import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  Archive,
  Camera,
  ChevronDown,
  HardDrive,
  LayoutGrid,
  LifeBuoy,
  Lock,
  LockOpen,
  MapPin,
  Network,
  Pencil,
  Plus,
  PowerOff,
  RotateCcw,
  Server,
  ServerCog,
  Shield,
  SquareTerminal,
  Tag,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { DISK_GB_MONTHLY, IMAGES, PLANS } from "../lib/catalog";
import { OsLogo } from "../lib/osLogos";
import {
  bootDiskGb,
  confirmResize,
  MAX_TAGS,
  powerServer,
  rebootServer,
  revertResize,
  serverPhase,
  setLocked,
  setTags,
  shelveServer,
  tagProblem,
  unrescueServer,
  unshelveServer,
  useServers,
  type ServerRecord,
} from "../lib/serverStore";
import { networksOf, useNetworks } from "../lib/networkStore";
import { useFloatingIps } from "../lib/floatingStore";
import { useSshKeys } from "../lib/sshKeyStore";
import { groupsOf, useFirewalls } from "../lib/firewallStore";
import { useVolumes } from "../lib/volumeStore";
import { useBackups } from "../lib/backupStore";
import { apiCall } from "../lib/openstackErrors";
import { CreateSnapshotDialog } from "../snapshotDialog";
import { DeleteServersDialog, deleteServers, RenameDialog } from "../serverDialogs";
import { ServerState } from "../serverUi";
import { ConfirmDialog, CopyButton, GPU_SERVERS_PATH, PageBreadcrumb, SERVERS_PATH } from "../ui";
import { BackupsTab, DisksTab, FirewallTab, MaintenanceTab, NetworkTab, PasswordReveal } from "./serverTabs";

/* One cloud server: a header, then seven tabs.
 *
 *   Header       name, state, plan, where, its address, labels; the power
 *                switch, the console, the lock, and a menu for the rest
 *                (reboot, forced power off, shelve, snapshot, delete).
 *   Overview     what it is and where, its addresses, the latest activity.
 *   Monitoring   CPU, disk and network over a chosen time.
 *   Network      public addresses with reverse DNS, floating IPs, private
 *                networks, the load balancers it is behind.
 *   Firewall     the firewalls applied to it.
 *   Disks        the boot disk and the cloud disks attached.
 *   Backups      the automatic backup and the snapshots, with restore.
 *   Maintenance  change plan, rebuild, rescue, root password.
 *
 * Work under way, a plan change waiting for a confirm, rescue mode and a
 * shelved server each show as a strip under the header, with what can be
 * done about it. Every action goes through the store, which refuses it as
 * Nova would (locked, busy, wrong state) and the refusal is a toast in the
 * person's language. Auto Scale instances are their group's and open there.
 */

const tabTriggerClass =
  "gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0";

const TABS = ["overview", "monitoring", "network", "firewall", "disks", "backups", "maintenance"] as const;
type TabKey = (typeof TABS)[number];

export default function ServerDetail({ kind = "cloud" }: { kind?: "cloud" | "gpu" }) {
  const { serverId } = useParams();
  const server = useServers().find((s) => s.id === serverId && (s.kind ?? "cloud") === kind);
  const t = useT();
  const navigate = useNavigate();
  if (!server)
    return (
      <div data-uniform-type className="p-4 lg:p-6">
        <p className="py-16 text-center text-muted-foreground">{t("This server no longer exists.")}</p>
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate(kind === "gpu" ? GPU_SERVERS_PATH : SERVERS_PATH)}>
            {t("Back to servers")}
          </Button>
        </div>
      </div>
    );
  return <ServerPage server={server} />;
}

function ServerPage({ server: s }: { server: ServerRecord }) {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const { isRTL, formatNumber } = useLanguage();
  const [params, setParams] = useSearchParams();
  const listPath = s.kind === "gpu" ? GPU_SERVERS_PATH : SERVERS_PATH;

  /* The clock, read again while anything is under way. */
  const [now, setNow] = useState(Date.now());
  const phase = serverPhase(s, now);
  const moving = phase === "creating" || phase === "busy";
  useEffect(() => {
    if (!moving) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [moving]);
  useEffect(() => setNow(Date.now()), [s]);

  const tab: TabKey = TABS.includes(params.get("tab") as TabKey) ? (params.get("tab") as TabKey) : "overview";
  const setTab = (v: string) => setParams((p) => (v === "overview" ? (p.delete("tab"), p) : (p.set("tab", v), p)), { replace: true });

  const [renaming, setRenaming] = useState(false);
  const [labels, setLabels] = useState(params.get("labels") === "1");
  const [shuttingDown, setShuttingDown] = useState<"soft" | "hard" | null>(null);
  const [rebooting, setRebooting] = useState<"soft" | "hard" | null>(null);
  const [shelving, setShelving] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plan = PLANS.find((p) => p.id === s.planId);
  const image = IMAGES.find((i) => i.id === s.imageId);
  const running = phase === "running";
  const off = phase === "stopped";
  const canPower = (running || off) && !s.locked;

  const run = async (fn: () => unknown, done?: string) => {
    if ((await apiCall(() => (fn(), true), t)) && done) toast.success(done);
  };

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: s.kind === "gpu" ? shellT("GPU Servers") : shellT("Cloud Server"), path: listPath },
          { label: s.name },
        ]}
      />

      {/* Header */}
      <Card className="p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {image ? (
              <OsLogo
                id={image.id}
                name={image.name}
                color={image.color}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold [&_svg]:size-6"
              />
            ) : (
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Server className="size-6" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="truncate text-2xl font-bold text-foreground" dir="ltr">
                  {s.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t("Rename server")}
                  title={t("Rename server")}
                >
                  <Pencil className="size-3.5" />
                </button>
                <ServerState server={s} now={now} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span dir="ltr" className="font-medium text-foreground">
                  {s.kind === "gpu" && s.gpu ? s.gpu : s.planId.toUpperCase()}
                </span>
                <span>{t("{cpu} vCPU Â· {ram} GB RAM", { cpu: formatNumber(s.vcpu), ram: formatNumber(s.ramGb) })}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {`${t(s.region)} / ${s.zone}`}
                </span>
                {s.hostId && (
                  <span className="inline-flex items-center gap-1">
                    <ServerCog className="size-3.5" />
                    <span dir="ltr">{s.hostName}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <span dir="ltr" className="text-foreground">
                    {s.ipv4}
                  </span>
                  <CopyButton text={s.ipv4} />
                </span>
              </div>
              {/* Labels */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(s.tags ?? []).map((tag) => (
                  <span key={tag} dir="ltr" className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setLabels(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {s.tags?.length ? <Pencil className="size-3" /> : <Plus className="size-3" />}
                  {s.tags?.length ? t("Edit labels") : t("Add labels")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => run(() => setLocked(s.id, !s.locked), s.locked ? t("Server unlocked") : t("Server locked"))}
              aria-label={s.locked ? t("Unlock") : t("Lock")}
              title={s.locked ? t("Unlock: allow changes and deletion again") : t("Lock: refuse changes and deletion")}
            >
              {s.locked ? <Lock className="size-4 text-amber-600" /> : <LockOpen className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              disabled={!running}
              onClick={() => toast.info(t("The console opens in a new tab once Cloud Server's API is connected."))}
              aria-label={t("Console")}
              title={t("Console")}
            >
              <SquareTerminal className="size-4" />
            </Button>
            <label
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border border-border px-2.5 text-sm",
                !canPower && "cursor-not-allowed opacity-60",
              )}
              title={s.locked ? t("This server is locked. Unlock it first.") : undefined}
            >
              <span className={cn("font-medium", running ? "text-emerald-600" : "text-muted-foreground")}>{running ? t("On") : t("Off")}</span>
              <Switch
                checked={s.powerOn && !s.shelved}
                disabled={!canPower}
                onCheckedChange={(on) => (on ? run(() => powerServer(s.id, true), t("Powering on")) : setShuttingDown("soft"))}
                aria-label={running ? t("Power off") : t("Power on")}
              />
            </label>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-1.5">
                  {t("Actions")}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-56 bg-background">
                <DropdownMenuItem disabled={!running || s.locked} onClick={() => setRebooting("soft")}>
                  <RotateCcw className="me-2 h-4 w-4" />
                  {t("Reboot")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!(running || off) || s.locked} onClick={() => setRebooting("hard")}>
                  <Zap className="me-2 h-4 w-4" />
                  {t("Hard reboot")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!running || s.locked} onClick={() => setShuttingDown("hard")}>
                  <PowerOff className="me-2 h-4 w-4" />
                  {t("Force power off")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {phase === "shelved" ? (
                  <DropdownMenuItem disabled={s.locked} onClick={() => run(() => unshelveServer(s.id), t("Unshelving"))}>
                    <Archive className="me-2 h-4 w-4" />
                    {t("Unshelve")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled={!(running || off) || s.locked} onClick={() => setShelving(true)}>
                    <Archive className="me-2 h-4 w-4" />
                    {t("Shelve")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled={phase === "creating"} onClick={() => setSnapshot(true)}>
                  <Camera className="me-2 h-4 w-4" />
                  {t("Create snapshot")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={s.locked} onClick={() => setDeleting(true)}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t("Delete server")}
                </DropdownMenuItem>
                {s.locked && <p className="px-2 pb-1.5 text-xs text-muted-foreground">{t("Unlock the server to change or delete it.")}</p>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* What the server is in the middle of, or waiting for. */}
      {phase === "busy" && s.task && (
        <Strip tone="sky" icon={Wrench}>
          <div className="w-full max-w-md">
            <ServerState server={s} now={now} />
          </div>
        </Strip>
      )}
      {phase === "verifyResize" && s.resizedFrom && (
        <Strip
          tone="amber"
          icon={AlertTriangle}
          actions={
            <>
              <Button size="sm" variant="outline" disabled={s.locked} onClick={() => run(() => revertResize(s.id), t("Reverting plan change"))}>
                {t("Revert to {plan}", { plan: s.resizedFrom.planId.toUpperCase() })}
              </Button>
              <Button size="sm" disabled={s.locked} onClick={() => run(() => confirmResize(s.id), t("Plan change confirmed"))}>
                {t("Confirm")}
              </Button>
            </>
          }
        >
          {t("The server now runs on {plan}. Check that it works, then confirm the change or go back.", { plan: s.planId.toUpperCase() })}
        </Strip>
      )}
      {phase === "rescue" && s.rescue && (
        <Strip
          tone="amber"
          icon={LifeBuoy}
          actions={
            <Button size="sm" variant="outline" disabled={s.locked} onClick={() => run(() => unrescueServer(s.id), t("Ending rescue"))}>
              {t("End rescue")}
            </Button>
          }
        >
          <span className="block">{t("Booted from {image} in rescue mode. Its own disk is attached as a second disk.", { image: s.rescue.image })}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            {t("Root password")}: <PasswordReveal value={s.rescue.password} />
          </span>
        </Strip>
      )}
      {phase === "shelved" && (
        <Strip
          tone="gray"
          icon={Archive}
          actions={
            <Button size="sm" disabled={s.locked} onClick={() => run(() => unshelveServer(s.id), t("Unshelving"))}>
              {t("Unshelve")}
            </Button>
          }
        >
          {t("Shelved: its CPU and RAM are released and not billed. Disks and addresses are kept.")}
        </Strip>
      )}
      {s.locked && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          {t("Locked: changes and deletion are refused until it is unlocked.")}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto w-auto min-w-full gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
            <TabsTrigger value="overview" className={tabTriggerClass}>
              <LayoutGrid className="h-3.5 w-3.5" />
              {t("Overview")}
            </TabsTrigger>
            <TabsTrigger value="monitoring" className={tabTriggerClass}>
              <Activity className="h-3.5 w-3.5" />
              {t("Monitoring")}
            </TabsTrigger>
            <TabsTrigger value="network" className={tabTriggerClass}>
              <Network className="h-3.5 w-3.5" />
              {t("Network")}
            </TabsTrigger>
            <TabsTrigger value="firewall" className={tabTriggerClass}>
              <Shield className="h-3.5 w-3.5" />
              {t("Firewall")}
            </TabsTrigger>
            <TabsTrigger value="disks" className={tabTriggerClass}>
              <HardDrive className="h-3.5 w-3.5" />
              {t("Disks")}
            </TabsTrigger>
            <TabsTrigger value="backups" className={tabTriggerClass}>
              <Archive className="h-3.5 w-3.5" />
              {t("Backups & snapshots")}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className={tabTriggerClass}>
              <Wrench className="h-3.5 w-3.5" />
              {t("Maintenance")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab s={s} plan={plan} onShow={setTab} />
        </TabsContent>
        <TabsContent value="monitoring" className="mt-0">
          <MonitoringTab s={s} />
        </TabsContent>
        <TabsContent value="network" className="mt-0">
          <NetworkTab s={s} />
        </TabsContent>
        <TabsContent value="firewall" className="mt-0">
          <FirewallTab s={s} />
        </TabsContent>
        <TabsContent value="disks" className="mt-0">
          <DisksTab s={s} />
        </TabsContent>
        <TabsContent value="backups" className="mt-0">
          <BackupsTab s={s} now={now} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-0">
          <MaintenanceTab s={s} now={now} />
        </TabsContent>
      </Tabs>

      <RenameDialog server={renaming ? s : null} onClose={() => setRenaming(false)} />
      <LabelsDialog
        server={labels ? s : null}
        onClose={() => {
          setLabels(false);
          if (params.get("labels")) setParams((p) => (p.delete("labels"), p), { replace: true });
        }}
      />
      <CreateSnapshotDialog open={snapshot} serverId={s.id} onClose={() => setSnapshot(false)} />

      <ConfirmDialog
        open={!!shuttingDown}
        onClose={() => setShuttingDown(null)}
        title={shuttingDown === "hard" ? t("Force {name} off?", { name: s.name }) : t("Shut down {name}?", { name: s.name })}
        description={
          shuttingDown === "hard"
            ? t("The power is cut at once, as pulling the plug. Unsaved data may be lost, and the disk may need a check on the next start.")
            : t("The operating system is asked to shut down. A server that is off is still billed for its plan.")
        }
        acknowledge={shuttingDown === "hard" ? t("I confirm that unsaved data on this server may be lost.") : undefined}
        destructive={shuttingDown === "hard"}
        confirmLabel={shuttingDown === "hard" ? t("Force power off") : t("Shut down")}
        onConfirm={() => {
          const hard = shuttingDown === "hard";
          setShuttingDown(null);
          void run(() => powerServer(s.id, false, hard), t("Shutting down"));
        }}
      />
      <ConfirmDialog
        open={!!rebooting}
        onClose={() => setRebooting(null)}
        title={rebooting === "hard" ? t("Hard reboot {name}?", { name: s.name }) : t("Reboot {name}?", { name: s.name })}
        description={
          rebooting === "hard"
            ? t("The server is restarted at once, without waiting for the operating system. Use it when it no longer answers.")
            : t("The operating system is asked to restart. The server is unreachable for a minute or two.")
        }
        acknowledge={rebooting === "hard" ? t("I confirm that unsaved data on this server may be lost.") : undefined}
        destructive={rebooting === "hard"}
        confirmLabel={rebooting === "hard" ? t("Hard reboot") : t("Reboot")}
        onConfirm={() => {
          const hard = rebooting === "hard";
          setRebooting(null);
          void run(() => rebootServer(s.id, hard), t("Rebooting"));
        }}
      />
      <ConfirmDialog
        open={shelving}
        onClose={() => setShelving(false)}
        title={t("Shelve {name}?", { name: s.name })}
        description={t(
          "The server is shut down and its CPU and RAM released, so they are no longer billed. Its disks and addresses are kept. Unshelving it can take a few minutes, and may not be possible right away if its zone is full.",
        )}
        confirmLabel={t("Shelve")}
        onConfirm={() => {
          setShelving(false);
          void run(() => shelveServer(s.id), t("Shelving"));
        }}
      />
      <DeleteServersDialog
        servers={deleting ? [s] : []}
        onClose={() => setDeleting(false)}
        onDeleted={async () => {
          if (!(await apiCall(() => (deleteServers([s]), true), t))) return;
          setDeleting(false);
          toast.success(t("Servers deleted"));
          navigate(listPath);
        }}
      />
    </div>
  );
}

/** A strip under the header: what the server is doing or waiting for. */
function Strip({ tone, icon: Icon, actions, children }: { tone: "sky" | "amber" | "gray"; icon: typeof Wrench; actions?: ReactNode; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        tone === "amber" && "border-amber-500/30 bg-amber-500/[0.06]",
        tone === "sky" && "border-sky-500/30 bg-sky-500/[0.05]",
        tone === "gray" && "border-border bg-muted/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5 text-foreground">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            tone === "amber" ? "text-amber-600" : tone === "sky" ? "text-sky-600" : "text-muted-foreground",
          )}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---- Overview ---------------------------------------------------------------------

function OverviewTab({ s, plan, onShow }: { s: ServerRecord; plan?: (typeof PLANS)[number]; onShow: (tab: string) => void }) {
  const t = useT();
  const { language, formatNumber } = useLanguage();
  const { currency, format } = useBillingCurrency();
  const networks = useNetworks();
  const floating = useFloatingIps().filter((f) => f.attachedTo?.serverId === s.id);
  const key = useSshKeys().find((k) => k.id === s.sshKeyId);
  const firewalls = groupsOf(useFirewalls(), s.id);
  const volumes = useVolumes().filter((v) => v.attachedTo?.serverId === s.id && !v.madeWithServerId);
  const backup = useBackups().find((b) => b.serverId === s.id);
  const [allEvents, setAllEvents] = useState(false);
  const { isRTL } = useLanguage();

  const boot = bootDiskGb(s);
  const extraGb = Math.max(0, boot - (plan?.diskGb ?? boot));
  const monthly = s.hostId || !plan ? 0 : plan.monthly[currency] + extraGb * DISK_GB_MONTHLY[currency];
  const priv = networksOf(networks, s.id);
  const events = s.events ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="p-5 xl:col-span-2">
        <h2 className="mb-2 text-base font-semibold text-foreground">{t("Details")}</h2>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div>
            <Line label={t("Plan")} value={<span dir="ltr">{s.kind === "gpu" && s.gpu ? s.gpu : s.planId.toUpperCase()}</span>} />
            <Line label={t("vCPU")} value={formatNumber(s.vcpu)} />
            <Line label={t("RAM")} value={`${formatNumber(s.ramGb)} ${t("GB")}`} />
            <Line label={t("Boot disk")} value={`${formatNumber(boot)} ${t("GB")}`} />
            <Line label={t("Operating system")} value={<span dir="ltr">{s.image}</span>} />
            <Line
              label={t("Price")}
              value={s.hostId ? t("Included in your dedicated server") : `${format(monthly)} ${t("/ month")}`}
            />
          </div>
          <div>
            <Line label={t("Region / zone")} value={`${t(s.region)} / ${s.zone}`} />
            <Line label={t("Placement")} value={s.hostId ? <span dir="ltr">{s.hostName}</span> : t("Shared cloud")} />
            <Line label={t("SSH key")} value={key ? <span dir="ltr">{key.name}</span> : t("None")} />
            <Line
              label={t("Firewall")}
              value={
                firewalls.length ? (
                  <button type="button" className="hover:text-primary" onClick={() => onShow("firewall")}>
                    <span dir="ltr">{firewalls.map((f) => f.name).join(", ")}</span>
                  </button>
                ) : (
                  t("None")
                )
              }
            />
            <Line
              label={t("Backup")}
              value={
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-primary" onClick={() => onShow("backups")}>
                  <span className={cn("h-2 w-2 rounded-full", backup && !backup.paused ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                  {backup ? (backup.paused ? t("Paused") : t("Enabled")) : t("Off")}
                </button>
              }
            />
            <Line label={t("Created")} value={formatDateTime(s.createdAt, language)} />
          </div>
        </div>

        <h2 className="mb-2 mt-5 text-base font-semibold text-foreground">{t("Addresses")}</h2>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div>
            <Line label={t("Public IPv4")} value={<span dir="ltr">{s.ipv4}</span>} />
            {s.ipv6 && <Line label={t("Public IPv6")} value={<span dir="ltr">{s.ipv6}</span>} />}
            {(s.extraIps ?? []).map((ip) => (
              <Line key={ip.address} label={t("Additional IP")} value={<span dir="ltr">{ip.address}</span>} />
            ))}
            {floating.map((f) => (
              <Line key={f.id} label={t("Floating IP")} value={<span dir="ltr">{f.address}</span>} />
            ))}
          </div>
          <div>
            {priv.length === 0 ? (
              <Line label={t("Private network")} value={t("None")} />
            ) : (
              priv.map(({ network, port }) => (
                <Line key={port.id} label={<span dir="ltr">{network.name}</span>} value={<span dir="ltr">{port.ip}</span>} />
              ))
            )}
            <Line label={t("Cloud disks")} value={volumes.length ? formatNumber(volumes.length) : t("None")} />
            <Line label={t("Server ID")} value={<span dir="ltr">{s.id}</span>} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{t("Activity")}</h2>
          {events.length > 5 && (
            <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setAllEvents(true)}>
              {t("View all")}
            </button>
          )}
        </div>
        <EventList events={events.slice(0, 5)} />
      </Card>

      <Sheet open={allEvents} onOpenChange={setAllEvents}>
        <SheetContent side={isRTL ? "left" : "right"} data-uniform-type className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("Activity")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <EventList events={events} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EventList({ events }: { events: NonNullable<ServerRecord["events"]> }) {
  const t = useT();
  const { language } = useLanguage();
  if (events.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{t("Nothing yet.")}</p>;
  return (
    <ul className="divide-y divide-border">
      {events.map((e) => (
        <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{t(e.action)}</p>
            {e.details && <p className="truncate text-xs text-muted-foreground">{t(e.details, e.vars)}</p>}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(e.at, language)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Line({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-end font-medium text-foreground">{value}</span>
    </div>
  );
}

// ---- Monitoring -------------------------------------------------------------------

/* Recent windows only: a quarter, half an hour, an hour, three hours. */
const RANGES = {
  m15: { points: 45, stepMs: 20_000 },
  m30: { points: 60, stepMs: 30_000 },
  h1: { points: 60, stepMs: 60_000 },
  h3: { points: 90, stepMs: 2 * 60_000 },
} as const;
type RangeKey = keyof typeof RANGES;

/** Repeatable numbers for one server and time: the same chart on every visit. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* Until Gnocchi is connected: believable figures that are zero while the
   server is off, made from the server's id and the time. */
function metrics(s: ServerRecord, range: RangeKey, now: number) {
  const { points, stepMs } = RANGES[range];
  const end = Math.floor(now / stepMs) * stepMs;
  const out = [];
  for (let i = points - 1; i >= 0; i--) {
    const at = end - i * stepMs;
    const r = seeded(`${s.id}:${at}`);
    const up = at >= s.createdAt && (s.powerOn || at < now - 60_000) && !s.shelved;
    const busy = r() < 0.12;
    out.push({
      at,
      cpu: up ? Math.round((busy ? 30 + r() * 50 : 2 + r() * 10) * 10) / 10 : 0,
      read: up ? Math.round(busy ? 200 + r() * 1800 : r() * 60) : 0,
      write: up ? Math.round(busy ? 300 + r() * 2500 : 10 + r() * 90) : 0,
      inbound: up ? Math.round((busy ? 5 + r() * 40 : 0.2 + r() * 2) * 10) / 10 : 0,
      outbound: up ? Math.round((busy ? 3 + r() * 25 : 0.1 + r() * 1.5) * 10) / 10 : 0,
    });
  }
  return out;
}

function MonitoringTab({ s }: { s: ServerRecord }) {
  const t = useT();
  const language = useAppLanguage();
  const [range, setRange] = useState<RangeKey>("h1");
  const [now, setNow] = useState(Date.now());
  /* Every window is recent: the chart moves on with each new point. */
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), RANGES[range].stepMs);
    return () => window.clearInterval(timer);
  }, [range]);
  const data = useMemo(() => metrics(s, range, now), [s, range, now]);
  const n = (v: number | string) => localizeDigits(language, v);
  const time = (at: number) => {
    const d = new Date(at);
    const two = (x: number) => String(x).padStart(2, "0");
    return n(`${two(d.getHours())}:${two(d.getMinutes())}`);
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">{t("Measured every few seconds by the cloud, without anything installed on the server.")}</p>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="m15">{t("Last 15 minutes")}</SelectItem>
            <SelectItem value="m30">{t("Last 30 minutes")}</SelectItem>
            <SelectItem value="h1">{t("Last hour")}</SelectItem>
            <SelectItem value="h3">{t("Last 3 hours")}</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Chart
        title={t("CPU")}
        note={t("100% is every vCPU fully busy")}
        data={data}
        series={[{ key: "cpu", label: t("CPU"), color: "hsl(var(--primary))" }]}
        unit="%"
        time={time}
        n={n}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Chart
          title={t("Disk")}
          data={data}
          series={[
            { key: "read", label: t("Read"), color: "#0ea5e9" },
            { key: "write", label: t("Write"), color: "#f59e0b" },
          ]}
          unit="KB/s"
          time={time}
          n={n}
        />
        <Chart
          title={t("Network")}
          data={data}
          series={[
            { key: "inbound", label: t("In"), color: "#10b981" },
            { key: "outbound", label: t("Out"), color: "#8b5cf6" },
          ]}
          unit="Mbps"
          time={time}
          n={n}
        />
      </div>
    </div>
  );
}

function Chart({
  title,
  note,
  data,
  series,
  unit,
  time,
  n,
}: {
  title: string;
  note?: string;
  data: Record<string, number>[];
  series: { key: string; label: string; color: string }[];
  unit: string;
  time: (at: number) => string;
  n: (v: number | string) => string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {note && <span>{note}</span>}
          {series.length > 1 &&
            series.map((x) => (
              <span key={x.key} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-3 rounded-full" style={{ background: x.color }} />
                {x.label}
              </span>
            ))}
        </div>
      </div>
      {/* Time runs left to right in every language. */}
      <div dir="ltr" className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="at" tickFormatter={time} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={40} />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={56} tickFormatter={(v) => `${n(v)} ${unit}`} />
            <RTooltip
              labelFormatter={(v) => time(Number(v))}
              formatter={(v: number, key: string) => [`${n(v)} ${unit}`, series.find((x) => x.key === key)?.label ?? key]}
              contentStyle={{ fontSize: 12 }}
            />
            {series.map((x) => (
              <Area key={x.key} type="monotone" dataKey={x.key} stroke={x.color} fill={x.color} fillOpacity={0.12} strokeWidth={1.5} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---- Labels -----------------------------------------------------------------------

function LabelsDialog({ server, onClose }: { server: ServerRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const [tags, setDraftTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setDraftTags(server?.tags ?? []);
    setDraft("");
  }, [server]);
  const problem = draft.trim() ? tagProblem(draft, tags) : undefined;
  const add = () => {
    if (!draft.trim() || problem || tags.length >= MAX_TAGS) return;
    setDraftTags([...tags, draft.trim()]);
    setDraft("");
  };

  return (
    <Dialog open={!!server} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Labels")}</DialogTitle>
          <DialogDescription>{t("Short words to find and group your servers by, such as production or web.")}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-9 flex-wrap gap-1.5">
          {tags.length === 0 && <span className="text-sm text-muted-foreground">{t("No labels yet.")}</span>}
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
              <span dir="ltr">{tag}</span>
              <button
                type="button"
                onClick={() => setDraftTags(tags.filter((x) => x !== tag))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("Remove")}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="production"
              disabled={tags.length >= MAX_TAGS}
              aria-label={t("New label")}
              className={cn("h-9", problem && "border-destructive")}
            />
            <Button variant="outline" className="h-9 gap-1" onClick={add} disabled={!draft.trim() || !!problem || tags.length >= MAX_TAGS}>
              <Tag className="size-3.5" />
              {t("Add")}
            </Button>
          </div>
          <p className={cn("mt-1.5 text-xs", problem ? "text-destructive" : "text-muted-foreground")}>
            {problem ? t(problem, { n: formatNumber(60) }) : t("Up to {n} labels; press Enter to add.", { n: formatNumber(MAX_TAGS) })}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={async () => {
              if (!server) return;
              if (await apiCall(() => (setTags(server.id, tags), true), t)) {
                toast.success(t("Labels saved"));
                onClose();
              }
            }}
          >
            {fx("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

