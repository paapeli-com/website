import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  Expand,
  Eye,
  HeartPulse,
  Layers,
  ListOrdered,
  Loader2,
  MapPin,
  MinusCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Server,
  Settings2,
  SlidersHorizontal,
  Split,
  SquareTerminal,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Label } from "@/features/factory/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { IMAGES } from "../lib/catalog";
import { OsLogo } from "../lib/osLogos";
import {
  groupHealth,
  groupInstances,
  removeGroups,
  runningCount,
  setDesired,
  updateGroup,
  useGroups,
  type AutoScaleGroup,
  type EventType,
  type HealthSource,
  type ScalingRule,
} from "../lib/autoscaleStore";
import { AUTOSCALE_PATH, PageBreadcrumb, SERVERS_PATH, TruncatedText } from "../ui";
import { Note, OptionCard, SettingRow } from "../wizard";
import { CapacityDialog, HealthBadge, StatCard, Stepper } from "../autoscaleUi";
import { RulesEditor, newScheduledRule } from "./CreateAutoScale";

/* One Auto Scale group: its header, then five tabs.
 *
 *   Overview      the four numbers that matter, the architecture (load
 *                 balancer, group, instances) drawn to stay readable at any
 *                 size, the group's details, and the latest events.
 *   Instances     the instances, in the server list's table.
 *   Scaling rules capacity limits, mode and rules, edited in place.
 *   Health        how failures are found and replaced, and each instance.
 *   Activity      everything that happened, filterable.
 *
 * Edits save from the tab they are made in; every change is logged.
 */

const tabTriggerClass =
  "gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0";

/** Instance tiles drawn before the rest fold into "+N". */
const VISIBLE_TILES = 5;

const EVENT_META: Record<EventType, { label: string; icon: typeof ArrowUp; tone: string }> = {
  created: { label: "Group created", icon: Plus, tone: "bg-primary/10 text-primary" },
  scaleOut: { label: "Scale out", icon: ArrowUp, tone: "bg-emerald-500/10 text-emerald-600" },
  manual: { label: "Scale out", icon: ArrowUp, tone: "bg-emerald-500/10 text-emerald-600" },
  scaleIn: { label: "Scale in", icon: ArrowDown, tone: "bg-sky-500/10 text-sky-600" },
  edited: { label: "Group edited", icon: Settings2, tone: "bg-muted text-muted-foreground" },
  repair: { label: "Health repair", icon: Wrench, tone: "bg-amber-500/10 text-amber-600" },
};

export default function AutoScaleGroup() {
  const { groupId } = useParams();
  const group = useGroups().find((g) => g.id === groupId);
  if (!group) return <Navigate to={AUTOSCALE_PATH} replace />;
  return <GroupPage group={group} />;
}

function GroupPage({ group: g }: { group: AutoScaleGroup }) {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const [now, setNow] = useState(Date.now());
  const scaling = groupHealth(g, now) === "scaling";
  useEffect(() => {
    if (!scaling) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [scaling]);

  const [tab, setTab] = useState("overview");
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const modeText = g.mode === "manual" ? t("Manual") : g.paused ? t("Paused") : t("Automatic");

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Auto Scale"), path: AUTOSCALE_PATH },
          { label: g.name },
        ]}
      />

      {/* Header: name and health, where it runs and how, then the actions. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground" dir="ltr">
              {g.name}
            </h1>
            <HealthBadge health={groupHealth(g, now)} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {t("Region")}: <span className="text-foreground">{`${t(g.region)} / ${g.zone}`}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="size-4" />
              {t("Scaling mode")}: <span className="text-foreground">{modeText}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Split className="size-4" />
              {t("Load balancer")}:{" "}
              <span className="text-foreground" dir="ltr">
                {g.loadBalancer ?? "-"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCapacityOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <SlidersHorizontal className="size-4" />
            {t("Change capacity")}
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("More")}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
              {g.mode === "automatic" && (
                <DropdownMenuItem
                  onClick={() => {
                    updateGroup(g.id, { paused: !g.paused }, g.paused ? "Scaling resumed" : "Scaling paused");
                    toast.success(g.paused ? t("Scaling resumed") : t("Scaling paused"));
                  }}
                >
                  {g.paused ? <Play className="me-2 h-4 w-4" /> : <Pause className="me-2 h-4 w-4" />}
                  {g.paused ? t("Resume scaling") : t("Pause scaling")}
                </DropdownMenuItem>
              )}
              {g.mode === "automatic" && <DropdownMenuSeparator />}
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="me-2 h-4 w-4" />
                {t("Delete group")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto w-auto min-w-full gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
            <TabsTrigger value="overview" className={tabTriggerClass}>
              <Layers className="h-3.5 w-3.5" />
              {t("Overview")}
            </TabsTrigger>
            <TabsTrigger value="instances" className={tabTriggerClass}>
              <Server className="h-3.5 w-3.5" />
              {t("Instances")}
            </TabsTrigger>
            <TabsTrigger value="rules" className={tabTriggerClass}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t("Scaling rules")}
            </TabsTrigger>
            <TabsTrigger value="health" className={tabTriggerClass}>
              <HeartPulse className="h-3.5 w-3.5" />
              {t("Health")}
            </TabsTrigger>
            <TabsTrigger value="activity" className={tabTriggerClass}>
              <Activity className="h-3.5 w-3.5" />
              {t("Activity")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab g={g} now={now} onShow={setTab} />
        </TabsContent>
        <TabsContent value="instances" className="mt-0">
          <InstancesTab g={g} now={now} />
        </TabsContent>
        <TabsContent value="rules" className="mt-0">
          <RulesTab g={g} />
        </TabsContent>
        <TabsContent value="health" className="mt-0">
          <HealthTab g={g} now={now} />
        </TabsContent>
        <TabsContent value="activity" className="mt-0">
          <ActivityTab g={g} />
        </TabsContent>
      </Tabs>

      <CapacityDialog group={capacityOpen ? g : null} onClose={() => setCapacityOpen(false)} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent data-uniform-type className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Delete groups?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {t("{n} groups and every instance in them will be deleted. This cannot be undone.", { n: 1 })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeGroups([g.id]);
                toast.success(t("Groups deleted"));
                navigate(AUTOSCALE_PATH);
              }}
            >
              {t("Delete group")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Overview ------------------------------------------------------------------

function OverviewTab({ g, now, onShow }: { g: AutoScaleGroup; now: number; onShow: (tab: string) => void }) {
  const t = useT();
  const { formatNumber } = useLanguage();
  const instances = groupInstances(g, now);
  const running = runningCount(g, now);
  const health = groupHealth(g, now);
  const image = IMAGES.find((i) => i.id === g.imageId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("Desired capacity")} value={formatNumber(g.desired)} icon={Layers} accent="text-primary" bg="from-primary/10 to-transparent" />
        <StatCard label={t("Running instances")} value={formatNumber(running)} icon={Server} accent="text-emerald-500" bg="from-emerald-50 to-transparent dark:from-emerald-500/10" />
        <StatCard
          label={t("Scaling mode")}
          value={g.mode === "manual" ? t("Manual") : g.paused ? t("Paused") : t("Automatic")}
          icon={Settings2}
          accent="text-sky-500"
          bg="from-sky-50 to-transparent dark:from-sky-500/10"
        />
        <StatCard
          label={t("Health")}
          value={health === "healthy" ? t("Healthy") : t("Scaling")}
          icon={HeartPulse}
          accent="text-emerald-500"
          bg="from-emerald-50 to-transparent dark:from-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* The architecture, drawn to read at any size: at most a handful of
            instance tiles, the rest folded into "+N", and a dashed tile for
            the room left up to the maximum. */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground">{t("Architecture")}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {g.mode === "automatic"
              ? t("The group adds and removes instances by its rules.")
              : t("The group keeps the number of instances you set.")}
          </p>

          <div className="flex flex-col items-center">
            {g.loadBalancer && (
              <>
                <DiagramBox icon={Split} title={t("Load balancer")} sub={g.loadBalancer} />
                <ArrowDown className="my-1.5 size-4 text-muted-foreground" />
              </>
            )}
            <div className="w-full rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Expand className="size-4 text-primary" />
                  {t("Auto Scale group")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("min {min} · desired {desired} · max {max}", {
                    min: formatNumber(g.min),
                    desired: formatNumber(g.desired),
                    max: formatNumber(g.max),
                  })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {instances.slice(0, VISIBLE_TILES).map((i) => (
                  <div key={i.id} className="flex flex-col items-center rounded-lg border border-border bg-card px-2 py-3 text-center">
                    {i.status === "creating" ? (
                      <Loader2 className="size-5 animate-spin text-sky-500" />
                    ) : (
                      <Server className="size-5 text-emerald-600" />
                    )}
                    <TruncatedText text={i.name} ltr className="mt-1.5 max-w-full text-xs font-medium text-foreground" />
                    <span className={cn("text-[11px]", i.status === "creating" ? "text-sky-600" : "text-emerald-600")}>
                      {i.status === "creating" ? t("Creating") : t("Running")}
                    </span>
                  </div>
                ))}
                {instances.length > VISIBLE_TILES && (
                  <button
                    type="button"
                    onClick={() => onShow("instances")}
                    className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-2 py-3 text-center transition-colors hover:border-primary/40"
                  >
                    <span className="text-lg font-bold text-foreground">+{formatNumber(instances.length - VISIBLE_TILES)}</span>
                    <span className="text-[11px] text-muted-foreground">{t("See all")}</span>
                  </button>
                )}
                {g.mode === "automatic" && g.desired < g.max && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-2 py-3 text-center">
                    <Plus className="size-5 text-muted-foreground" />
                    <span className="mt-1.5 text-xs font-medium text-foreground">
                      {t("Up to {n} more", { n: formatNumber(g.max - g.desired) })}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{t("Made when needed")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">{t("Group details")}</h2>
          <DetailLine label={t("Group name")} value={<span dir="ltr">{g.name}</span>} />
          <DetailLine label={t("Region")} value={`${t(g.region)} / ${g.zone}`} />
          <DetailLine label={t("Load balancer")} value={<span dir="ltr">{g.loadBalancer ?? "-"}</span>} />
          <DetailLine label={t("Cooldown")} value={t("{n} min", { n: formatNumber(g.cooldownMin) })} />
          <p className="mb-1 mt-4 text-sm font-semibold text-foreground">{t("Template")}</p>
          <DetailLine
            label={t("Image")}
            value={
              <span dir="ltr" className="inline-flex items-center gap-1.5">
                {image && (
                  <OsLogo
                    id={image.id}
                    name={image.name}
                    color={image.color}
                    className="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold [&_svg]:size-3.5"
                  />
                )}
                {g.image}
              </span>
            }
          />
          <DetailLine
            label={t("Instance size")}
            value={t("{cpu} vCPU · {ram} GB RAM", { cpu: formatNumber(g.vcpu), ram: formatNumber(g.ramGb) })}
          />
          <DetailLine label={t("Boot disk")} value={`${formatNumber(g.diskGb)} ${t("GB")}`} />
          <DetailLine label={t("Firewall")} value={<span dir="ltr">{g.firewall}</span>} />
        </Card>
      </div>

    </div>
  );
}

function DiagramBox({ icon: Icon, title, sub }: { icon: typeof Split; title: string; sub: string }) {
  return (
    <div className="flex min-w-[220px] items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5">
      <Icon className="size-4 text-primary" />
      <div className="text-start">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {sub}
        </p>
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-end font-medium text-foreground">{value}</span>
    </div>
  );
}

// ---- Instances --------------------------------------------------------------------

function InstancesTab({ g, now }: { g: AutoScaleGroup; now: number }) {
  const t = useT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const instances = groupInstances(g, now);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const shown = instances.filter((i) => !search || i.name.includes(search.toLowerCase()) || i.publicIp.includes(search));
  const canRemove = g.desired > g.min;

  const remove = (count: number) => {
    setDesired(g.id, g.desired - count);
    setSelected([]);
    toast.success(t("Capacity set to {n}", { n: formatNumber(Math.max(g.min, g.desired - count)) }));
  };
  const copy = (v: string) =>
    void navigator.clipboard?.writeText(v).then(
      () => toast.success(t("Copied")),
      () => toast.error(t("Could not copy")),
    );

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("Instances")} ({formatNumber(instances.length)} / {formatNumber(g.max)})
          </h2>
          <p className="text-sm text-muted-foreground">{t("Removing an instance lowers the desired capacity by one.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by name or IP")}
            className="h-9 w-56 rounded-full text-xs"
          />
          <Button
            variant="outline"
            className="h-9 gap-2 text-xs"
            disabled={selected.length === 0 || !canRemove}
            onClick={() => remove(Math.min(selected.length, g.desired - g.min))}
          >
            <MinusCircle className="size-4" />
            {t("Remove from group")}
            {selected.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                {formatNumber(selected.length)}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
        <Table className="min-w-[960px] table-fixed">
          <colgroup>
            <col className="w-[44px]" />
            <col className="w-[20%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[130px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={shown.length > 0 && shown.every((i) => selected.includes(i.id))}
                    onCheckedChange={(c) => setSelected(c ? shown.map((i) => i.id) : [])}
                    aria-label={t("Select all")}
                  />
                </div>
              </TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{fx("status")}</TableHead>
              <TableHead>{t("Private IP")}</TableHead>
              <TableHead>{t("Public IP")}</TableHead>
              <TableHead>{t("Image")}</TableHead>
              <TableHead>{t("Created")}</TableHead>
              <TableHead className="text-end">{fx("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((i) => (
              <TableRow key={i.id} className="border-b hover:bg-muted/30">
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={selected.includes(i.id)}
                      onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, i.id] : prev.filter((id) => id !== i.id)))}
                      aria-label={i.name}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <TruncatedText text={i.name} ltr className="font-medium text-foreground" />
                  <TruncatedText text={t("{cpu} vCPU · {ram} GB RAM", { cpu: formatNumber(g.vcpu), ram: formatNumber(g.ramGb) })} className="text-xs text-muted-foreground" />
                </TableCell>
                <TableCell>
                  {i.status === "creating" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("Creating")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {t("Running")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <TruncatedText text={i.privateIp} ltr mono className="text-foreground" />
                </TableCell>
                <TableCell>
                  {i.status === "creating" ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1">
                      <TruncatedText text={i.publicIp} ltr mono className="text-foreground" />
                      <button
                        type="button"
                        onClick={() => copy(i.publicIp)}
                        aria-label={t("Copy")}
                        title={t("Copy")}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <TruncatedText text={g.image} ltr />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <TruncatedText text={formatDateTime(i.createdAt, language)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => toast.info(fx("comingSoon"))}>
                      <Eye className="h-3.5 w-3.5" /> {fx("view")}
                    </Button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
                        <DropdownMenuItem onClick={() => toast.info(fx("comingSoon"))} disabled={i.status === "creating"}>
                          <SquareTerminal className="me-2 h-4 w-4" />
                          {t("Console")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={!canRemove}
                          onClick={() => remove(1)}
                        >
                          <MinusCircle className="me-2 h-4 w-4" />
                          {t("Remove from group")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!canRemove && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("The group is at its minimum of {n}; lower the minimum under Scaling rules to remove more.", { n: formatNumber(g.min) })}
        </p>
      )}
    </Card>
  );
}

// ---- Scaling rules ------------------------------------------------------------------

function RulesTab({ g }: { g: AutoScaleGroup }) {
  const t = useT();
  const { formatNumber } = useLanguage();
  const [min, setMin] = useState(g.min);
  const [max, setMax] = useState(g.max);
  const [cooldown, setCooldown] = useState(g.cooldownMin);
  const [rules, setRules] = useState<ScalingRule[]>(g.rules);
  useEffect(() => {
    setMin(g.min);
    setMax(g.max);
    setCooldown(g.cooldownMin);
    setRules(g.rules);
  }, [g.min, g.max, g.cooldownMin, g.rules]);

  const dirty = min !== g.min || max !== g.max || cooldown !== g.cooldownMin || JSON.stringify(rules) !== JSON.stringify(g.rules);

  const save = () => {
    updateGroup(g.id, { min, max, cooldownMin: cooldown, rules }, "Scaling settings changed, min {min} max {max}", { min, max });
    toast.success(t("Saved"));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("Minimum")} value={formatNumber(g.min)} icon={Layers} accent="text-primary" bg="from-primary/10 to-transparent" />
        <StatCard label={t("Desired")} value={formatNumber(g.desired)} icon={Server} accent="text-emerald-500" bg="from-emerald-50 to-transparent dark:from-emerald-500/10" />
        <StatCard label={t("Maximum")} value={formatNumber(g.max)} icon={Layers} accent="text-sky-500" bg="from-sky-50 to-transparent dark:from-sky-500/10" />
        <StatCard label={t("Cooldown")} value={t("{n} min", { n: formatNumber(g.cooldownMin) })} icon={Clock} accent="text-violet-500" bg="from-violet-50 to-transparent dark:from-violet-500/10" />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">{t("Scaling mode")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("How the group sets its number of instances.")}</p>
        <div role="radiogroup" className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          <OptionCard
            selected={g.mode === "automatic"}
            onSelect={() => g.mode !== "automatic" && updateGroup(g.id, { mode: "automatic" }, "Scaling mode set to automatic")}
          >
            <div className="flex items-center gap-2.5">
              <Settings2 className={cn("size-4", g.mode === "automatic" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold text-foreground">{t("Automatic")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("Adds and removes instances by your rules.")}</p>
          </OptionCard>
          <OptionCard
            selected={g.mode === "manual"}
            onSelect={() => g.mode !== "manual" && updateGroup(g.id, { mode: "manual" }, "Scaling mode set to manual")}
          >
            <div className="flex items-center gap-2.5">
              <User className={cn("size-4", g.mode === "manual" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold text-foreground">{t("Manual")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("Keeps the number you set, and replaces failed ones.")}</p>
          </OptionCard>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">{t("Capacity and rules")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("Changes apply when you save.")}</p>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("Minimum")}</p>
            <Stepper value={min} min={1} max={max} onChange={setMin} label={t("Minimum")} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("Maximum")}</p>
            <Stepper value={max} min={min} max={20} onChange={setMax} label={t("Maximum")} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("Cooldown")}</p>
            <Select value={String(cooldown)} onValueChange={(v) => setCooldown(Number(v))}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 10, 15].map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    {t("{n} min", { n: formatNumber(c) })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          {g.mode === "automatic" ? (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{t("Scaling rules")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRules((all) => [
                      ...all,
                      newScheduledRule(`r-${Date.now().toString(36)}`),
                    ])
                  }
                >
                  <Plus className="me-1.5 size-4" />
                  {t("Add rule")}
                </Button>
              </div>
              <RulesEditor
                rules={rules}
                onChange={(id, patch) => setRules((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
                onRemove={(id) => setRules((all) => all.filter((r) => r.id !== id))}
              />
            </>
          ) : (
            <Note>{t("Manual mode keeps the desired number; scaling rules are not applied.")}</Note>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={!dirty}
            onClick={() => {
              setMin(g.min);
              setMax(g.max);
              setCooldown(g.cooldownMin);
              setRules(g.rules);
            }}
          >
            {t("Discard")}
          </Button>
          <Button disabled={!dirty} onClick={save}>
            {t("Save changes")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---- Health -------------------------------------------------------------------------

function HealthTab({ g, now }: { g: AutoScaleGroup; now: number }) {
  const t = useT();
  const { isRTL, language, formatNumber } = useLanguage();
  const [source, setSource] = useState<HealthSource>(g.health.source);
  const [autoReplace, setAutoReplace] = useState(g.health.autoReplace);
  const [grace, setGrace] = useState(g.health.graceMin);
  useEffect(() => {
    setSource(g.health.source);
    setAutoReplace(g.health.autoReplace);
    setGrace(g.health.graceMin);
  }, [g.health]);
  const dirty = source !== g.health.source || autoReplace !== g.health.autoReplace || grace !== g.health.graceMin;
  const instances = groupInstances(g, now);
  const replaced = g.events.filter((e) => e.type === "repair").length;
  const sourceLabel = (s: HealthSource) => (s === "lb" ? t("Load balancer health check") : t("Instance status"));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("Group health")}
          value={groupHealth(g, now) === "healthy" ? t("Healthy") : t("Scaling")}
          icon={HeartPulse}
          accent="text-emerald-500"
          bg="from-emerald-50 to-transparent dark:from-emerald-500/10"
        />
        <StatCard label={t("Running instances")} value={formatNumber(runningCount(g, now))} icon={Server} accent="text-emerald-500" bg="from-emerald-50 to-transparent dark:from-emerald-500/10" />
        <StatCard label={t("Replaced instances")} value={formatNumber(replaced)} icon={Wrench} accent="text-amber-500" bg="from-amber-50 to-transparent dark:from-amber-500/10" />
        <StatCard
          label={t("Replace failed instances")}
          value={g.health.autoReplace ? t("Enabled") : t("Off")}
          icon={AlertTriangle}
          accent="text-sky-500"
          bg="from-sky-50 to-transparent dark:from-sky-500/10"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">{t("Health settings")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("How a failed instance is noticed and replaced.")}</p>
        <div className="space-y-3">
          <SettingRow
            icon={HeartPulse}
            title={t("Replace failed instances")}
            description={t("A failed instance is removed and a new one made in its place.")}
            control={<Switch checked={autoReplace} onCheckedChange={setAutoReplace} aria-label={t("Replace failed instances")} />}
          />
          {autoReplace && (
            <div className="rounded-xl border border-border p-4">
              <p className="mb-2 text-sm font-medium text-foreground">{t("How a failure is noticed")}</p>
              <RadioGroup dir={isRTL ? "rtl" : "ltr"} value={source} onValueChange={(v) => setSource(v as HealthSource)} className="space-y-2">
                {(["infra", "lb"] as HealthSource[]).map((s) => {
                  const disabled = s === "lb" && !g.loadBalancer;
                  return (
                    <div key={s} className={cn("flex items-start gap-2.5", disabled && "opacity-50")}>
                      <RadioGroupItem value={s} id={`hs-${s}`} disabled={disabled} className="mt-0.5" />
                      <Label htmlFor={`hs-${s}`} className="cursor-pointer font-normal">
                        <span className="block text-sm font-medium text-foreground">{sourceLabel(s)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s === "infra"
                            ? t("The server stops or errors.")
                            : g.loadBalancer
                              ? t("The application stops answering the load balancer.")
                              : t("Needs a load balancer.")}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-foreground">{t("Grace period")}</span>
                <Select value={String(grace)} onValueChange={(v) => setGrace(Number(v))}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 5, 10].map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {t("{n} min", { n: formatNumber(v) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{t("A new instance is not judged before this.")}</span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={!dirty}
            onClick={() => {
              setSource(g.health.source);
              setAutoReplace(g.health.autoReplace);
              setGrace(g.health.graceMin);
            }}
          >
            {t("Discard")}
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              updateGroup(g.id, { health: { source, autoReplace, graceMin: grace } }, "Health settings changed");
              toast.success(t("Saved"));
            }}
          >
            {t("Save changes")}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">{t("Instance health")}</h2>
        <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Health")}</TableHead>
                <TableHead>{t("Last check")}</TableHead>
                <TableHead>{t("Checked by")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((i) => (
                <TableRow key={i.id} className="border-b hover:bg-muted/30">
                  <TableCell>
                    <TruncatedText text={i.name} ltr className="font-medium text-foreground" />
                  </TableCell>
                  <TableCell>
                    {i.status === "creating" ? (
                      <span className="text-muted-foreground">{t("Within grace period")}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {t("Healthy")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <TruncatedText text={formatDateTime(now - 20_000, language, { seconds: true })} />
                  </TableCell>
                  <TableCell>{sourceLabel(g.health.source)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ---- Activity -----------------------------------------------------------------------

function ActivityTab({ g }: { g: AutoScaleGroup }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const [range, setRange] = useState<"24h" | "7d" | "all">("7d");
  const [type, setType] = useState<"all" | "out" | "in" | "edited" | "repair">("all");
  const [search, setSearch] = useState("");

  const since = range === "24h" ? Date.now() - 86_400_000 : range === "7d" ? Date.now() - 7 * 86_400_000 : 0;
  const inRange = g.events.filter((e) => e.at >= since);
  const kindOf = (e: EventType) => (e === "scaleOut" || e === "manual" || e === "created" ? "out" : e === "scaleIn" ? "in" : e);
  const events = useMemo(
    () =>
      inRange.filter(
        (e) =>
          (type === "all" || kindOf(e.type) === type) &&
          (!search || t(e.details, e.vars).toLowerCase().includes(search.toLowerCase()) || t(e.trigger).toLowerCase().includes(search.toLowerCase())),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inRange, type, search],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("Events")} value={formatNumber(inRange.length)} icon={ListOrdered} accent="text-primary" bg="from-primary/10 to-transparent" />
        <StatCard label={t("Scale out")} value={formatNumber(inRange.filter((e) => kindOf(e.type) === "out").length)} icon={ArrowUp} accent="text-emerald-500" bg="from-emerald-50 to-transparent dark:from-emerald-500/10" />
        <StatCard label={t("Scale in")} value={formatNumber(inRange.filter((e) => e.type === "scaleIn").length)} icon={ArrowDown} accent="text-sky-500" bg="from-sky-50 to-transparent dark:from-sky-500/10" />
        <StatCard label={t("Failed actions")} value={formatNumber(inRange.filter((e) => !e.ok).length)} icon={AlertTriangle} accent="text-red-500" bg="from-red-50 to-transparent dark:from-red-500/10" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t("Last 24 hours")}</SelectItem>
              <SelectItem value="7d">{t("Last 7 days")}</SelectItem>
              <SelectItem value="all">{t("All time")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All events")}</SelectItem>
              <SelectItem value="out">{t("Scale out")}</SelectItem>
              <SelectItem value="in">{t("Scale in")}</SelectItem>
              <SelectItem value="edited">{t("Group edited")}</SelectItem>
              <SelectItem value="repair">{t("Health repair")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search events")}
            className="h-9 min-w-[200px] flex-1 rounded-full text-xs"
          />
        </div>
        <EventsTable events={events} empty={fx("noData")} />
      </Card>
    </div>
  );
}

/** The activity log's table: when, what, why, what it did, how it went. */
function EventsTable({ events, empty }: { events: AutoScaleGroup["events"]; empty?: string }) {
  const t = useT();
  const { language } = useLanguage();
  return (
    <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
      <Table className="min-w-[760px] table-fixed">
        <colgroup>
          <col className="w-[17%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
          <col className="w-[33%]" />
          <col className="w-[12%]" />
        </colgroup>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t("Time")}</TableHead>
            <TableHead>{t("Event")}</TableHead>
            <TableHead>{t("Trigger")}</TableHead>
            <TableHead>{t("Details")}</TableHead>
            <TableHead>{t("Result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5}>
                <p className="py-8 text-center text-muted-foreground">{empty ?? "-"}</p>
              </TableCell>
            </TableRow>
          ) : (
            events.map((e) => {
              const meta = EVENT_META[e.type];
              const Icon = meta.icon;
              return (
                <TableRow key={e.id} className="border-b hover:bg-muted/30">
                  <TableCell className="text-muted-foreground">
                    <TruncatedText text={formatDateTime(e.at, language)} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                        <Icon className="size-3.5" />
                      </span>
                      <TruncatedText text={t(meta.label)} className="text-foreground" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <TruncatedText text={t(e.trigger)} className="text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <TruncatedText text={t(e.details, e.vars)} className="text-foreground" />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", e.ok ? "bg-emerald-500" : "bg-red-500")} />
                      {e.ok ? t("Succeeded") : t("Failed")}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
