import { useEffect, useMemo, useState } from "react";
import { dateLocale, formatDate, formatTime } from "@/shared/lib/formatDate";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { ListToolbar, type FilterField, type SortOption, type ActionItem } from "@/features/factory/components/panel/ListToolbar";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { Progress } from "@/features/factory/components/ui/progress";
import { Badge } from "@/features/factory/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/features/factory/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/features/factory/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/features/factory/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import {
  Plus, Package, Activity, AlertTriangle, Smartphone, Eye, MoreHorizontal, Play, Pause,
  Pencil, Copy, Trash2, Upload, Download, RefreshCw, RotateCw, X, Settings as SettingsIcon, Rocket, FileText,
} from "lucide-react";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { NoData } from "@/features/factory/components/NoData";
import { localizedPath } from "@/features/factory/lib/localizedPath";

// ------------------- Types -------------------
type UpdateStatus = "Active" | "Completed" | "Failed" | "Draft";
type DeploymentStatus = "In Progress" | "Completed" | "Failed" | "Paused";
type DeviceOtaStatus = "Up to date" | "Update available" | "Updating" | "Failed" | "Pending";
type TargetType = "Temperature Sensors" | "Pressure Sensors" | "Vibration Sensors" | "Flow Meters" | "Gateways" | "Energy Meters";

interface FirmwareUpdate {
  id: string;
  name: string;
  version: string;
  targetType: TargetType;
  targetKind: "Device" | "Gateway";
  devices: number;
  status: UpdateStatus;
  createdBy: string;
  createdAt: string;
  fileName?: string;
  fileSize?: number;
  releaseNotes?: string;
  checksum?: string;
  isDefault?: boolean;
}

interface Deployment {
  id: string;
  name: string;
  updateId: string;
  version: string;
  targetDevices: number;
  updated: number;
  failed: number;
  pending: number;
  status: DeploymentStatus;
  startedAt: string;
  completedAt?: string;
  logs: { ts: string; msg: string }[];
}

interface OtaDevice {
  id: string;
  name: string;
  location: string;
  type: TargetType;
  currentFw: string;
  targetFw: string;
  status: DeviceOtaStatus;
  lastUpdated: string;
}

interface OtaSettings {
  allowAuto: boolean;
  requireApproval: boolean;
  retryFailed: boolean;
  maxRetry: number;
  maintenanceWindow: string;
  notifySuccess: boolean;
  notifyFailure: boolean;
}

// ------------------- Storage -------------------
const LS = {
  updates: "paapeli.ota.updates",
  deployments: "paapeli.ota.deployments",
  devices: "paapeli.ota.devices",
  settings: "paapeli.ota.settings",
};

const loadLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
};
const saveLS = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

/* Firmware, deployments and devices come from localStorage — what the user
   uploaded and deployed in this browser. There is no OTA endpoint yet, so the
   three lists start empty and each tab says so, rather than opening on five
   invented firmware images, three in-flight rollouts and eighteen fabricated
   devices that looked exactly like a live fleet.

   The fixed LOCATIONS list went with them: the location filter and the deploy
   dialog now offer the locations the devices themselves report, so the options
   can never name a plant that isn't in the fleet. */

/* The device taxonomy the product supports — a closed set, not data. */
const DEV_TYPES: TargetType[] = ["Temperature Sensors", "Pressure Sensors", "Vibration Sensors", "Flow Meters", "Energy Meters", "Gateways"];

const DEFAULT_SETTINGS: OtaSettings = {
  allowAuto: true,
  requireApproval: true,
  retryFailed: true,
  maxRetry: 3,
  maintenanceWindow: "02:00 - 04:00",
  notifySuccess: false,
  notifyFailure: true,
};

// ------------------- Helpers -------------------
const fmtBytes = (b?: number) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1024/1024).toFixed(2)} MB`;
};
const fmtDate = (iso?: string) => formatDate(iso);

const useFmtDate = () => {
  const { language } = useLanguage();
  return (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    /* ar-EG was Gregorian with Arabic digits — localised digits on the
       wrong year. dateLocale carries the calendar too. */
    try {
      return new Intl.DateTimeFormat(dateLocale(language), { year: "numeric", month: "numeric", day: "numeric" }).format(d);
    } catch {
      return formatDate(d, language);
    }
  };
};

const useFmtRel = () => {
  const { t, formatNumber, language } = useLanguage();
  const fmtDateLocal = useFmtDate();
  return (iso?: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("justNow");
    if (m < 60) return t("minAgo").replace("{n}", formatNumber(m));
    const h = Math.floor(m / 60);
    if (h < 24) return h === 1 ? t("hourAgo") : t("hoursAgo").replace("{n}", formatNumber(h));
    return fmtDateLocal(iso);
  };
};

const STATUS_KEY_MAP: Record<string, string> = {
  "Active": "otaStatusActive",
  "Completed": "otaStatusCompleted",
  "Failed": "otaStatusFailed",
  "Draft": "otaStatusDraft",
  "In Progress": "otaStatusInProgress",
  "Paused": "otaStatusPaused",
  "Up to date": "otaStatusUpToDate",
  "Update available": "otaStatusUpdateAvailable",
  "Updating": "otaStatusUpdating",
  "Pending": "otaStatusPending",
};

const STATUS_CLASS_MAP: Record<string, string> = {
  "Active": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  "Completed": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Failed": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  "Draft": "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Paused": "bg-muted text-muted-foreground border-border",
  "Up to date": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  "Update available": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Updating": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Pending": "bg-muted text-muted-foreground border-border",
};

const useStatusBadge = () => {
  const { t } = useLanguage();
  return (s: UpdateStatus | DeploymentStatus | DeviceOtaStatus) => (
    <Badge variant="outline" className={`${STATUS_CLASS_MAP[s] || ""} font-medium`}>
      {t((STATUS_KEY_MAP[s] || s) as any)}
    </Badge>
  );
};

const TARGET_TYPE_KEY: Record<TargetType, string> = {
  "Temperature Sensors": "tempSensors",
  "Pressure Sensors": "pressureSensors",
  "Vibration Sensors": "vibrationSensors",
  "Flow Meters": "flowMeters",
  "Gateways": "gateways",
  "Energy Meters": "energyMeters",
};
const useTargetTypeLabel = () => {
  const { t } = useLanguage();
  return (typ: TargetType) => t((TARGET_TYPE_KEY[typ] || typ) as any) || typ;
};

// ------------------- Page -------------------
const OTAPage = () => {
  const { t, isRTL, language, formatNumber } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtRel = useFmtRel();
  const fmtDateL = useFmtDate();
  const targetTypeLabel = useTargetTypeLabel();
  const { toast } = useToast();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const goToCreate = () => navigate(lp("/firmware/new"));
  const goToEdit = (u: FirmwareUpdate) => navigate(lp(`/firmware/${u.id}/edit`));

  // tabs (also synced with ?tab= URL param)
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["updates", "deployments", "devices", "settings"] as const;
  const initialTab = (validTabs.includes(tabParam as any) ? tabParam : "updates") as typeof validTabs[number];
  const [tab, setTabState] = useState<typeof validTabs[number]>(initialTab);
  const setTab = (v: typeof validTabs[number]) => {
    setTabState(v);
    const next = new URLSearchParams(searchParams);
    if (v === "updates") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as any) && tabParam !== tab) setTabState(tabParam as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // data
  const [updates, setUpdates] = useState<FirmwareUpdate[]>(() => loadLS<FirmwareUpdate[]>(LS.updates, []));
  const [deployments, setDeployments] = useState<Deployment[]>(() => loadLS<Deployment[]>(LS.deployments, []));
  const [devices, setDevices] = useState<OtaDevice[]>(() => loadLS<OtaDevice[]>(LS.devices, []));
  const [settings, setSettings] = useState<OtaSettings>(() => loadLS(LS.settings, DEFAULT_SETTINGS));

  useEffect(() => saveLS(LS.updates, updates), [updates]);
  useEffect(() => saveLS(LS.deployments, deployments), [deployments]);
  useEffect(() => saveLS(LS.devices, devices), [devices]);
  useEffect(() => saveLS(LS.settings, settings), [settings]);

  // dialogs / panels
  const [deployFor, setDeployFor] = useState<FirmwareUpdate | null>(null);
  const [updateDetails, setUpdateDetails] = useState<FirmwareUpdate | null>(null);
  const [deploymentDetails, setDeploymentDetails] = useState<Deployment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "update" | "updateBulk"; ids: string[] } | null>(null);

  // ---- KPIs
  const totalUpdates = updates.length;
  const activeUpdates = updates.filter(u => u.status === "Active").length;
  const failedUpdates = updates.filter(u => u.status === "Failed").length;
  const devicesUpdated = deployments.reduce((s, d) => s + d.updated, 0);

  return (
    <>
      <PageHeader
        title={t("otaPageTitle")}
        count={updates.length}
        countLabel={t("otaCountLabel")}
        actions={
          <Button onClick={goToCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
            <Plus className="h-4 w-4" /> {t("createNewUpdateBtn")}
          </Button>
        }
      />

      

      {/* KPI cards */}
      <KpiSection storageKey="ota" className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label={t("totalUpdates")} value={formatNumber(totalUpdates)} sublabel={t("allFirmwareUpdates")} tone="primary" />
        <KpiCard icon={Activity} label={t("activeUpdates")} value={formatNumber(activeUpdates)} sublabel={t("currentlyRollingOut")} tone="amber" />
        <KpiCard icon={AlertTriangle} label={t("failedUpdates")} value={formatNumber(failedUpdates)} sublabel={t("needAttention")} tone="red" />
        <KpiCard icon={Smartphone} label={t("devicesUpdated")} value={formatNumber(devicesUpdated)} sublabel={t("acrossDeployments")} tone="blue" />
      </div>
      </KpiSection>


      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates"><Package className="h-4 w-4 me-2" />{t("updatesTab")}</TabsTrigger>
          <TabsTrigger value="deployments"><Rocket className="h-4 w-4 me-2" />{t("deploymentsTab")}</TabsTrigger>
          <TabsTrigger value="devices"><Smartphone className="h-4 w-4 me-2" />{t("devicesTab")}</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 me-2" />{t("settingsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="updates">
          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
            <div className="min-w-0">
              <UpdatesTab
                updates={updates}
                setUpdates={setUpdates}
                onCreate={goToCreate}
                onEdit={(u) => goToEdit(u)}
                onDeploy={(u) => setDeployFor(u)}
                onView={(u) => setUpdateDetails(u)}
                onDelete={(ids) => setConfirmDelete({ kind: ids.length > 1 ? "updateBulk" : "update", ids })}
                onDuplicate={(u) => {
                  const dup = { ...u, id: `fw-${Date.now()}`, name: `${u.name} (Copy)`, status: "Draft" as UpdateStatus, createdAt: new Date().toISOString(), devices: 0, isDefault: false };
                  setUpdates([dup, ...updates]);
                  toast({ title: t("updateDuplicated") });
                }}
              />
            </div>
            <RightSidePanel
              deployments={deployments}
              onViewAll={() => setTab("deployments")}
              onCreate={goToCreate}
              onStartDeployment={() => {
                const first = updates[0];
                if (first) setDeployFor(first);
                else toast({ title: t("createUpdateFirstToast") });
              }}
              onSettings={() => setTab("settings")}
            />
          </div>
        </TabsContent>


        <TabsContent value="deployments">
          <DeploymentsTab
            deployments={deployments}
            setDeployments={setDeployments}
            onView={(d) => setDeploymentDetails(d)}
          />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab
            devices={devices}
            setDevices={setDevices}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>


      {/* Update details drawer */}
      <Sheet open={!!updateDetails} onOpenChange={(o) => !o && setUpdateDetails(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {updateDetails && (
            <>
              <SheetHeader><SheetTitle>{updateDetails.name}</SheetTitle><SheetDescription>{updateDetails.version} · {targetTypeLabel(updateDetails.targetType)}</SheetDescription></SheetHeader>
              <div className="space-y-3 mt-6 text-sm">
                <DetailRow label={t("status")} value={statusBadge(updateDetails.status)} />
                <DetailRow label={t("devices")} value={formatNumber(updateDetails.devices)} />
                <DetailRow label={t("createdByCol")} value={updateDetails.createdBy} />
                <DetailRow label={t("createdAt")} value={fmtDateL(updateDetails.createdAt)} />
                <DetailRow label={t("firmwareFile")} value={`${updateDetails.fileName || "—"} (${fmtBytes(updateDetails.fileSize)})`} />
                {updateDetails.checksum && <DetailRow label={t("checksum")} value={<code className="text-xs" dir="ltr">{updateDetails.checksum}</code>} />}
                {updateDetails.releaseNotes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("releaseNotes")}</div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{updateDetails.releaseNotes}</div>
                  </div>
                )}
                <div className="pt-3">
                  <Button className="w-full" onClick={() => { setDeployFor(updateDetails); setUpdateDetails(null); }}>
                    <Rocket className="h-4 w-4 me-2" /> {t("startDeploymentAction")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Deployment details drawer */}
      <Sheet open={!!deploymentDetails} onOpenChange={(o) => !o && setDeploymentDetails(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {deploymentDetails && (
            <>
              <SheetHeader><SheetTitle>{deploymentDetails.name}</SheetTitle><SheetDescription>{deploymentDetails.version}</SheetDescription></SheetHeader>
              <div className="space-y-3 mt-6 text-sm">
                <DetailRow label={t("status")} value={statusBadge(deploymentDetails.status)} />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("progressLabel")}</div>
                  <Progress value={Math.round((deploymentDetails.updated / Math.max(deploymentDetails.targetDevices,1)) * 100)} />
                  <div className="text-xs text-muted-foreground mt-1">{formatNumber(deploymentDetails.updated)}/{formatNumber(deploymentDetails.targetDevices)} {t("devicesShortLabel")}</div>
                </div>
                <DetailRow label={t("updatedLabel")} value={formatNumber(deploymentDetails.updated)} />
                <DetailRow label={t("failedLabel")} value={formatNumber(deploymentDetails.failed)} />
                <DetailRow label={t("pendingLabel")} value={formatNumber(deploymentDetails.pending)} />
                <DetailRow label={t("startedAt")} value={fmtDateL(deploymentDetails.startedAt)} />
                {deploymentDetails.completedAt && <DetailRow label={t("completedAt")} value={fmtDateL(deploymentDetails.completedAt)} />}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("logsLabel")}</div>
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1 max-h-60 overflow-y-auto">
                    {deploymentDetails.logs.map((l, i) => (
                      <div key={i} className="text-xs flex gap-2"><span className="text-muted-foreground">{formatTime(l.ts)}</span><span>{l.msg}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Start Deployment dialog */}
      <StartDeploymentPanel
        open={!!deployFor}
        update={deployFor}
        devices={devices}
        onClose={() => setDeployFor(null)}
        onStart={(payload) => {
          if (!deployFor) return;
          const dep: Deployment = {
            id: `dep-${Date.now()}`,
            name: `${deployFor.name} ${deployFor.version}`,
            updateId: deployFor.id,
            version: deployFor.version,
            targetDevices: payload.deviceCount,
            updated: 0,
            failed: 0,
            pending: payload.deviceCount,
            status: payload.scheduleLater ? "Paused" : "In Progress",
            startedAt: new Date().toISOString(),
            logs: [{ ts: new Date().toISOString(), msg: payload.scheduleLater ? "Deployment scheduled" : "Deployment started" }],
          };
          setDeployments([dep, ...deployments]);
          // Mark update as active
          setUpdates(updates.map(u => u.id === deployFor.id ? { ...u, status: "Active" } : u));
          toast({ title: t("deploymentStartedToast"), description: dep.name });
          setDeployFor(null);
        }}
      />

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{(confirmDelete?.ids.length || 0) > 1 ? t("deleteUpdatesTitle") : t("deleteUpdateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {((confirmDelete?.ids.length || 0) > 1 ? t("deleteUpdatesDesc") : t("deleteUpdateDesc"))
                .replace("{n}", formatNumber(confirmDelete?.ids.length || 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDelete) return;
                setUpdates(updates.filter(u => !confirmDelete.ids.includes(u.id)));
                toast({ title: t("deleted") });
                setConfirmDelete(null);
              }}
            >{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OTAPage;

// ------------------- Subcomponents -------------------

const KpiCard = ({ icon: Icon, label, value, sublabel, tone }: { icon: any; label: string; value: string | number; sublabel?: string; tone: "primary" | "amber" | "red" | "blue" | "green" | "violet" }) => {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-emerald-500/10 text-emerald-600",
    violet: "bg-violet-500/10 text-violet-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold leading-tight mt-0.5">{value}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value}</span>
  </div>
);

// ---------- Updates Tab ----------
const UpdatesTab = ({
  updates, setUpdates, onCreate, onEdit, onDeploy, onView, onDelete, onDuplicate,
}: {
  updates: FirmwareUpdate[];
  setUpdates: (u: FirmwareUpdate[]) => void;
  onCreate: () => void;
  onEdit: (u: FirmwareUpdate) => void;
  onDeploy: (u: FirmwareUpdate) => void;
  onView: (u: FirmwareUpdate) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (u: FirmwareUpdate) => void;
}) => {
  const { t, formatNumber, isRTL } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtDateL = useFmtDate();
  const targetTypeLabel = useTargetTypeLabel();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [createdByF, setCreatedByF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 600); };
  const perPage = 5;

  const filtered = useMemo(() => {
    let list = updates.filter(u =>
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.version.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === "all" || u.status === statusF) &&
      (typeF === "all" || u.targetType === typeF) &&
      (createdByF === "all" || u.createdBy === createdByF)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "nameAsc": return a.name.localeCompare(b.name);
        case "version": return b.version.localeCompare(a.version);
        case "status": return a.status.localeCompare(b.status);
        case "newest":
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [updates, search, statusF, typeF, createdByF, sort]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const activeFilters = [statusF, typeF, createdByF].filter(v => v !== "all").length;

  const handleExport = () => {
    const header = ["name", "version", "type", "devices", "status", "createdBy", "createdAt"];
    const rows = filtered.map(u => [u.name, u.version, u.targetType, u.devices, u.status, u.createdBy, u.createdAt]);
    const csv = [header.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ota-updates-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    { key: "status", label: t("status"), value: statusF, onChange: (v) => { setStatusF(v); setPage(1); }, options: [
      { value: "all", label: t("all") },
      { value: "Active", label: t("otaStatusActive") },
      { value: "Completed", label: t("otaStatusCompleted") },
      { value: "Failed", label: t("otaStatusFailed") },
      { value: "Draft", label: t("otaStatusDraft") },
    ] },
    { key: "type", label: t("targetTypeFilter"), value: typeF, onChange: (v) => { setTypeF(v); setPage(1); }, options: [
      { value: "all", label: t("all") }, ...DEV_TYPES.map(d => ({ value: d, label: targetTypeLabel(d) })),
    ] },
    { key: "createdBy", label: t("createdByFilter"), value: createdByF, onChange: (v) => { setCreatedByF(v); setPage(1); }, options: [
      { value: "all", label: t("all") }, ...Array.from(new Set(updates.map(u => u.createdBy))).map(n => ({ value: n, label: n })),
    ] },
  ];
  const sortOpts: SortOption[] = [
    { key: "newest", label: t("sortNewest") },
    { key: "oldest", label: t("sortOldest") },
    { key: "nameAsc", label: t("sortNameAsc") },
    { key: "version", label: t("version") },
    { key: "status", label: t("status") },
  ];
  const actions: ActionItem[] = [
    { key: "upload", label: t("uploadFirmwareAction"), icon: Upload, onSelect: onCreate },
    { key: "export", label: t("exportListAction"), icon: Download, onSelect: handleExport },
    { key: "delete", label: t("deleteSelectedAction"), icon: Trash2, destructive: true, disabled: selected.length === 0, onSelect: () => onDelete(selected) },
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{t("firmwareUpdatesTitle")}</CardTitle></CardHeader>
      <CardContent>
        <ListToolbar
          search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: t("searchUpdatesPlaceholder") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          filter={{ fields: filterFields, activeCount: activeFilters, onClear: () => { setStatusF("all"); setTypeF("all"); setCreatedByF("all"); setPage(1); } }}
          sort={{ options: sortOpts, value: sort, onChange: setSort }}
          actions={actions}
          selectionCount={selected.length}
        />

        {paged.length === 0 ? (
          updates.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noUpdatesFound")}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-hidden text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[44px]">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={selected.length === paged.length && paged.length > 0}
                        onCheckedChange={(c) => setSelected(c ? paged.map(p => p.id) : [])}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("updateName")}</TableHead>
                  <TableHead>{t("version")}</TableHead>
                  <TableHead>{t("targetType")}</TableHead>
                  <TableHead>{t("devicesCol")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("createdByCol")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selected.includes(u.id)}
                          onCheckedChange={(c) => setSelected(c ? [...selected, u.id] : selected.filter(id => id !== u.id))}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-7 w-7 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                          <Package className="h-4 w-4" />
                        </span>
                        <span>{u.name}</span>
                        {u.isDefault && <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 ms-1">{t("defaultLabel")}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{u.version}</TableCell>
                    <TableCell>{targetTypeLabel(u.targetType)}</TableCell>
                    <TableCell>{formatNumber(u.devices)}</TableCell>
                    <TableCell>{statusBadge(u.status)}</TableCell>
                    <TableCell>{u.createdBy}</TableCell>
                    <TableCell>{fmtDateL(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onView(u)}>
                          <Eye className="h-3.5 w-3.5" /> {t("viewBtn")}
                        </Button>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 z-[100]">
                            <DropdownMenuItem onClick={() => onView(u)}><Eye className="h-4 w-4 me-2" />{t("viewDetailsAction")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeploy(u)}><Rocket className="h-4 w-4 me-2" />{t("startDeploymentAction")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(u)}><Pencil className="h-4 w-4 me-2" />{t("edit")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(u)}><Copy className="h-4 w-4 me-2" />{t("duplicateAction")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete([u.id])}>
                              <Trash2 className="h-4 w-4 me-2" />{t("deleteAction")}
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
        )}

        <PaginationFooter total={filtered.length} page={page} perPage={perPage} totalPages={totalPages} onChange={setPage} />
      </CardContent>
    </Card>
  );
};

// ---------- Right side panel (Updates tab) ----------
const RightSidePanel = ({ deployments, onViewAll, onCreate, onStartDeployment, onSettings }: {
  deployments: Deployment[];
  onViewAll: () => void;
  onCreate: () => void;
  onStartDeployment: () => void;
  onSettings: () => void;
}) => {
  const { t } = useLanguage();
  const fmtRel = useFmtRel();
  const active = deployments.filter(d => d.status === "In Progress" || d.status === "Paused").slice(0, 3);
  const recent = active.length > 0 ? active : deployments.slice(0, 3);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t("activeDeploymentsTitle")}</CardTitle>
          <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={onViewAll}>{t("viewAllBtn")}</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recent.length === 0 && <div className="text-sm text-muted-foreground">{t("noDeploymentsYet")}</div>}
          {recent.map(d => {
            const pct = Math.round((d.updated / Math.max(d.targetDevices, 1)) * 100);
            return (
              <div key={d.id} className="space-y-2">
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{t("startedAtRelative").replace("{when}", fmtRel(d.startedAt))}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Progress value={pct} className="flex-1 me-3" />
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("devicesUpdatedFraction").replace("{updated}", String(d.updated)).replace("{target}", String(d.targetDevices))}</span>
                  <span>{t("failedCountSuffix").replace("{n}", String(d.failed))}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("quickActionsTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={onCreate}><Plus className="h-4 w-4 me-2" />{t("createNewUpdateBtn")}</Button>
          <Button variant="outline" className="w-full justify-start" onClick={onStartDeployment}><Rocket className="h-4 w-4 me-2" />{t("startDeploymentAction")}</Button>
          <Button variant="outline" className="w-full justify-start" onClick={onSettings}><SettingsIcon className="h-4 w-4 me-2" />{t("otaSettingsBtn")}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- Deployments Tab ----------
const DeploymentsTab = ({ deployments, setDeployments, onView }: {
  deployments: Deployment[];
  setDeployments: (d: Deployment[]) => void;
  onView: (d: Deployment) => void;
}) => {
  const { t, isRTL } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtRel = useFmtRel();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 600); };
  const perPage = 5;

  const filtered = useMemo(() => {
    let list = deployments.filter(d =>
      (d.name.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === "all" || d.status === statusF)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        case "nameAsc": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        default: return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
    });
    return list;
  }, [deployments, search, statusF, sort]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = (id: string, status: DeploymentStatus) => {
    setDeployments(deployments.map(d => d.id === id ? { ...d, status, completedAt: status === "Completed" ? new Date().toISOString() : d.completedAt } : d));
  };
  const retryFailed = (id: string) => {
    setDeployments(deployments.map(d => {
      if (d.id !== id) return d;
      const newUpdated = d.updated + d.failed;
      return { ...d, updated: newUpdated, failed: 0, pending: d.targetDevices - newUpdated, status: newUpdated >= d.targetDevices ? "Completed" : "In Progress", logs: [...d.logs, { ts: new Date().toISOString(), msg: "Retried failed devices" }] };
    }));
  };

  const handleExport = () => {
    const header = ["name", "version", "targetDevices", "updated", "failed", "pending", "status", "startedAt"];
    const rows = filtered.map(d => [d.name, d.version, d.targetDevices, d.updated, d.failed, d.pending, d.status, d.startedAt]);
    const csv = [header.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ota-deployments-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const actions: ActionItem[] = [
    { key: "export", label: t("exportListAction"), icon: Download, onSelect: handleExport },
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{t("deploymentsTitle")}</CardTitle></CardHeader>
      <CardContent>
        <ListToolbar
          search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: t("searchDeploymentsPlaceholder") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          filter={{ fields: [
            { key: "status", label: t("status"), value: statusF, onChange: (v) => { setStatusF(v); setPage(1); }, options: [
              { value: "all", label: t("all") },
              { value: "In Progress", label: t("otaStatusInProgress") },
              { value: "Completed", label: t("otaStatusCompleted") },
              { value: "Failed", label: t("otaStatusFailed") },
              { value: "Paused", label: t("otaStatusPaused") },
            ] },
            { key: "type", label: t("targetTypeFilter"), value: typeF, onChange: setTypeF, options: [{ value: "all", label: t("all") }, ...DEV_TYPES.map(d => ({ value: d, label: d }))] },
          ], activeCount: [statusF, typeF].filter(v => v !== "all").length, onClear: () => { setStatusF("all"); setTypeF("all"); setPage(1); } }}
          sort={{ options: [
            { key: "newest", label: t("sortNewest") }, { key: "oldest", label: t("sortOldest") }, { key: "nameAsc", label: t("sortNameAsc") }, { key: "status", label: t("status") },
          ], value: sort, onChange: setSort }}
          actions={actions}
        />

        {paged.length === 0 ? (
          deployments.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noDeploymentsFound")}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-hidden text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("deployment")}</TableHead>
                  <TableHead>{t("version")}</TableHead>
                  <TableHead>{t("targetDevices")}</TableHead>
                  <TableHead className="w-[180px]">{t("progressLabel")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("startedAt")}</TableHead>
                  <TableHead>{t("completedAt")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((d) => {
                  const pct = Math.round((d.updated / Math.max(d.targetDevices, 1)) * 100);
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.version}</TableCell>
                      <TableCell>{d.targetDevices}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="flex-1" />
                          <span className="text-xs w-9 text-end">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>{fmtRel(d.startedAt)}</TableCell>
                      <TableCell>{d.completedAt ? fmtRel(d.completedAt) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onView(d)}>
                            <Eye className="h-3.5 w-3.5" /> {t("viewBtn")}
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 z-[100]">
                              <DropdownMenuItem onClick={() => onView(d)}><Eye className="h-4 w-4 me-2" />{t("viewDetailsAction")}</DropdownMenuItem>
                              {d.status === "In Progress" && <DropdownMenuItem onClick={() => updateStatus(d.id, "Paused")}><Pause className="h-4 w-4 me-2" />{t("pauseAction")}</DropdownMenuItem>}
                              {d.status === "Paused" && <DropdownMenuItem onClick={() => updateStatus(d.id, "In Progress")}><Play className="h-4 w-4 me-2" />{t("resumeAction")}</DropdownMenuItem>}
                              {d.failed > 0 && <DropdownMenuItem onClick={() => retryFailed(d.id)}><RotateCw className="h-4 w-4 me-2" />{t("retryFailedAction")}</DropdownMenuItem>}
                              {(d.status === "In Progress" || d.status === "Paused") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => updateStatus(d.id, "Failed")}>
                                    <X className="h-4 w-4 me-2" />{t("cancelAction")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <PaginationFooter total={filtered.length} page={page} perPage={perPage} totalPages={totalPages} onChange={setPage} />
      </CardContent>
    </Card>
  );
};

// ---------- Devices Tab ----------
const DevicesTab = ({ devices, setDevices }: { devices: OtaDevice[]; setDevices: (d: OtaDevice[]) => void; }) => {
  const deviceLocations = useMemo(
    () => Array.from(new Set(devices.map(d => d.location).filter(Boolean))).sort(),
    [devices],
  );
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const statusBadge = useStatusBadge();
  const fmtRel = useFmtRel();
  const targetTypeLabel = useTargetTypeLabel();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [locF, setLocF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 600); };
  const perPage = 8;

  const filtered = useMemo(() => {
    let list = devices.filter(d =>
      (d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === "all" || d.status === statusF) &&
      (typeF === "all" || d.type === typeF) &&
      (locF === "all" || d.location === locF)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "nameAsc": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        default: return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });
    return list;
  }, [devices, search, statusF, typeF, locF, sort]);
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const setStatus = (id: string, status: DeviceOtaStatus) => {
    setDevices(devices.map(d => d.id === id ? { ...d, status, lastUpdated: new Date().toISOString(), currentFw: status === "Up to date" ? d.targetFw : d.currentFw } : d));
  };

  const handleExport = () => {
    const header = ["name", "location", "type", "currentFw", "targetFw", "status", "lastUpdated"];
    const rows = filtered.map(d => [d.name, d.location, d.type, d.currentFw, d.targetFw, d.status, d.lastUpdated]);
    const csv = [header.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ota-devices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const actions: ActionItem[] = [
    { key: "export", label: t("exportListAction"), icon: Download, onSelect: handleExport },
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{t("devicesTitle")}</CardTitle></CardHeader>
      <CardContent>
        <ListToolbar
          search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: t("searchDevicesPlaceholder") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          filter={{ fields: [
            { key: "status", label: t("otaStatus"), value: statusF, onChange: (v) => { setStatusF(v); setPage(1); }, options: [
              { value: "all", label: t("all") },
              { value: "Up to date", label: t("otaStatusUpToDate") },
              { value: "Update available", label: t("otaStatusUpdateAvailable") },
              { value: "Updating", label: t("otaStatusUpdating") },
              { value: "Failed", label: t("otaStatusFailed") },
              { value: "Pending", label: t("otaStatusPending") },
            ] },
            { key: "type", label: t("deviceTypeFilter"), value: typeF, onChange: (v) => { setTypeF(v); setPage(1); }, options: [{ value: "all", label: t("all") }, ...DEV_TYPES.map(d => ({ value: d, label: targetTypeLabel(d) }))] },
            { key: "loc", label: t("location"), value: locF, onChange: (v) => { setLocF(v); setPage(1); }, options: [{ value: "all", label: t("all") }, ...deviceLocations.map(l => ({ value: l, label: l }))] },
          ], activeCount: [statusF, typeF, locF].filter(v => v !== "all").length, onClear: () => { setStatusF("all"); setTypeF("all"); setLocF("all"); setPage(1); } }}
          sort={{ options: [
            { key: "newest", label: t("sortNewest") }, { key: "oldest", label: t("sortOldest") }, { key: "nameAsc", label: t("sortNameAsc") }, { key: "status", label: t("status") },
          ], value: sort, onChange: setSort }}
          actions={actions}
        />

        {paged.length === 0 ? (
          devices.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noDevicesFound") || t("noDevicesYet") || "No devices found"}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-hidden text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("device")}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>{t("currentFirmware")}</TableHead>
                  <TableHead>{t("targetFirmware")}</TableHead>
                  <TableHead>{t("otaStatus")}</TableHead>
                  <TableHead>{t("lastUpdated")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-7 w-7 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                          <Smartphone className="h-4 w-4" />
                        </span>
                        {d.name}
                      </div>
                    </TableCell>
                    <TableCell><LocationCell path={d.location} /></TableCell>
                    <TableCell>{d.currentFw}</TableCell>
                    <TableCell>{d.targetFw}</TableCell>
                    <TableCell>{statusBadge(d.status)}</TableCell>
                    <TableCell>{fmtRel(d.lastUpdated)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 z-[100]">
                            {(d.status === "Update available" || d.status === "Pending") && (
                              <DropdownMenuItem onClick={() => { setStatus(d.id, "Updating"); toast({ title: t("updateStartedToast"), description: d.name }); setTimeout(() => setStatus(d.id, "Up to date"), 1500); }}>
                                <RefreshCw className="h-4 w-4 me-2" />{t("updateDeviceAction")}
                              </DropdownMenuItem>
                            )}
                            {d.status === "Failed" && (
                              <DropdownMenuItem onClick={() => { setStatus(d.id, "Updating"); setTimeout(() => setStatus(d.id, "Up to date"), 1500); }}>
                                <RotateCw className="h-4 w-4 me-2" />{t("retryUpdateAction")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toast({ title: t("logsLabel"), description: t("logsToastDesc").replace("{name}", d.name) })}>
                              <FileText className="h-4 w-4 me-2" />{t("viewLogsAction")}
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
        )}

        <PaginationFooter total={filtered.length} page={page} perPage={perPage} totalPages={totalPages} onChange={setPage} />
      </CardContent>
    </Card>
  );
};

// ---------- Settings Tab ----------
const SettingsTab = ({ settings, setSettings }: { settings: OtaSettings; setSettings: (s: OtaSettings) => void; }) => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [local, setLocal] = useState(settings);
  useEffect(() => setLocal(settings), [settings]);
  const update = <K extends keyof OtaSettings>(k: K, v: OtaSettings[K]) => setLocal({ ...local, [k]: v });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="max-w-3xl space-y-4 me-auto">
      <Card>
        <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm font-semibold">{t("defaultOtaPolicy")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-2.5">
          <ToggleRow label={t("allowAutoUpdate")} value={local.allowAuto} onChange={(v) => update("allowAuto", v)} />
          <ToggleRow label={t("requireManualApproval")} value={local.requireApproval} onChange={(v) => update("requireApproval", v)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm font-semibold">{t("updateSafety")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-3">
          <ToggleRow label={t("retryFailedUpdates")} value={local.retryFailed} onChange={(v) => update("retryFailed", v)} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("maxRetryCount")}</Label>
              <Input className="h-8" type="number" min={0} max={10} value={local.maxRetry} onChange={(e) => update("maxRetry", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("maintenanceWindowLabel")}</Label>
              <Input className="h-8" dir="ltr" value={local.maintenanceWindow} onChange={(e) => update("maintenanceWindow", e.target.value)} placeholder="02:00 - 04:00" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm font-semibold">{t("notificationsTitle")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-2.5">
          <ToggleRow label={t("notifyOnSuccess")} value={local.notifySuccess} onChange={(v) => update("notifySuccess", v)} />
          <ToggleRow label={t("notifyOnFailure")} value={local.notifyFailure} onChange={(v) => update("notifyFailure", v)} />
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setSettings(local); toast({ title: t("settingsSaved") }); }}>{t("saveSettingsBtn")}</Button>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <Label className="text-sm">{label}</Label>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

// ---------- Create / Edit Update Panel ----------
const CreateUpdatePanel = ({ open, editing, onClose, onSave }: {
  open: boolean;
  editing: FirmwareUpdate | null;
  onClose: () => void;
  onSave: (payload: Partial<FirmwareUpdate>) => void;
}) => {
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [targetKind, setTargetKind] = useState<"Device" | "Gateway">("Device");
  const [targetType, setTargetType] = useState<TargetType>("Temperature Sensors");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [checksum, setChecksum] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setVersion(editing.version); setTargetKind(editing.targetKind);
      setTargetType(editing.targetType); setReleaseNotes(editing.releaseNotes || ""); setChecksum(editing.checksum || "");
      setIsDefault(!!editing.isDefault); setFileMeta(editing.fileName ? { name: editing.fileName, size: editing.fileSize || 0 } : null);
    } else if (open) {
      setName(""); setVersion(""); setTargetKind("Device"); setTargetType("Temperature Sensors");
      setReleaseNotes(""); setChecksum(""); setIsDefault(false); setFileMeta(null);
    }
  }, [editing, open]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const ok = /\.(bin|hex|zip)$/i.test(f.name);
    if (!ok) { toast({ title: t("unsupportedFileType"), description: t("unsupportedFileTypeDesc"), variant: "destructive" }); return; }
    setFileMeta({ name: f.name, size: f.size });
  };

  const handleSubmit = () => {
    if (!name.trim() || !version.trim() || !targetType || !fileMeta) {
      toast({ title: t("fillAllRequiredFields"), variant: "destructive" }); return;
    }
    onSave({
      name: name.trim(), version: version.trim(), targetKind, targetType,
      fileName: fileMeta.name, fileSize: fileMeta.size,
      releaseNotes: releaseNotes.trim() || undefined,
      checksum: checksum.trim() || undefined, isDefault,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? t("editUpdate") : t("createNewUpdate")}</SheetTitle>
          <SheetDescription>{t("createUpdateDescription")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("updateNameRequired")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("firmwareNamePlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("versionRequired")}</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v2.1.0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("targetRequired")}</Label>
              <Select value={targetKind} onValueChange={(v) => setTargetKind(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Device">{t("deviceKind")}</SelectItem><SelectItem value="Gateway">{t("gatewayKind")}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("deviceProfileRequired")}</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEV_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("firmwareFileLabel")}</Label>
            <label className="border-2 border-dashed rounded-lg p-5 text-center hover:bg-accent/50 cursor-pointer transition-colors block">
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              {fileMeta ? (
                <div className="text-sm">
                  <div className="font-medium truncate">{fileMeta.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtBytes(fileMeta.size)} · {t("fileReady")}</div>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium">{t("chooseFirmwareFile")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("firmwareFileExts")}</div>
                </>
              )}
              <input type="file" accept=".bin,.hex,.zip" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("releaseNotes")}</Label>
            <Textarea rows={3} value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} placeholder={t("releaseNotesPlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("checksum")}</Label>
            <Input value={checksum} onChange={(e) => setChecksum(e.target.value)} placeholder={t("checksumPlaceholder")} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t("markAsDefaultLabel")}</Label>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>{t("cancel")}</Button>
            <Button className="flex-1" onClick={handleSubmit}>{editing ? t("save") : t("createBtn")}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ---------- Start Deployment Panel ----------
const StartDeploymentPanel = ({ open, update, devices, onClose, onStart }: {
  open: boolean;
  update: FirmwareUpdate | null;
  devices: OtaDevice[];
  onClose: () => void;
  onStart: (payload: { deviceCount: number; scheduleLater: boolean }) => void;
}) => {
  const { isRTL, t } = useLanguage();
  const [targetGroup, setTargetGroup] = useState<"all" | "selected" | "location">("all");
  const deployLocations = useMemo(
    () => Array.from(new Set(devices.map(d => d.location).filter(Boolean))).sort(),
    [devices],
  );
  const [locationSel, setLocationSel] = useState("");
  const [scheduleLater, setScheduleLater] = useState(false);
  const [rolloutMode, setRolloutMode] = useState<"all" | "batch">("all");
  const [batchSize, setBatchSize] = useState(50);
  const [failureThreshold, setFailureThreshold] = useState(10);

  useEffect(() => { if (open) { setTargetGroup("all"); setLocationSel(deployLocations[0] ?? ""); setScheduleLater(false); setRolloutMode("all"); setBatchSize(50); setFailureThreshold(10); } }, [open]);

  if (!update) return null;
  const eligibleDevices = devices.filter(d => d.type === update.targetType);
  /* Count what is actually eligible. This used to floor each branch at an
     invented number (50 / 10 / 25), so an empty fleet still promised devices. */
  const deviceCount = targetGroup === "location"
    ? eligibleDevices.filter(d => d.location === locationSel).length
    : eligibleDevices.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("startDeploymentAction")}</SheetTitle>
          <SheetDescription>{update.name} {update.version}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("updatePackageLabel")}</Label>
            <Input value={`${update.name} ${update.version}`} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("targetGroupRequired")}</Label>
            <Select value={targetGroup} onValueChange={(v) => setTargetGroup(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDevicesOfType")}</SelectItem>
                <SelectItem value="selected">{t("selectedDevicesLabel")}</SelectItem>
                <SelectItem value="location">{t("selectedLocationLabel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetGroup === "location" && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("location")}</Label>
              <Select value={locationSel} onValueChange={setLocationSel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{deployLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {t("targetDevicesLabel")}: <span className="font-semibold">{deviceCount}</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("scheduleLabel")}</Label>
            <div className="flex gap-2">
              <Button variant={!scheduleLater ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setScheduleLater(false)}>{t("startNowBtn")}</Button>
              <Button variant={scheduleLater ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setScheduleLater(true)}>{t("scheduleBtn")}</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("rolloutModeLabel")}</Label>
            <div className="flex gap-2">
              <Button variant={rolloutMode === "all" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRolloutMode("all")}>{t("allAtOnceBtn")}</Button>
              <Button variant={rolloutMode === "batch" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRolloutMode("batch")}>{t("batchRolloutBtn")}</Button>
            </div>
          </div>
          {rolloutMode === "batch" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("batchSizeLabel")}</Label>
                <Input type="number" min={1} value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("failureThresholdLabel")}</Label>
                <Input type="number" min={0} max={100} value={failureThreshold} onChange={(e) => setFailureThreshold(Number(e.target.value))} />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>{t("cancel")}</Button>
            <Button className="flex-1" onClick={() => onStart({ deviceCount, scheduleLater })}>
              <Rocket className="h-4 w-4 me-2" /> {t("startBtn")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ---------- Pagination footer ----------
const PaginationFooter = ({ total, page, perPage, totalPages, onChange }: {
  total: number; page: number; perPage: number; totalPages: number; onChange: (p: number) => void;
}) => {
  const { t, formatNumber } = useLanguage();
  if (total <= perPage) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div className="text-xs text-muted-foreground">
        {t("showingNToM").replace("{start}", formatNumber(start)).replace("{end}", formatNumber(end)).replace("{total}", formatNumber(total))}
      </div>
      <SmartPagination currentPage={page} totalPages={totalPages} onChange={onChange} />
    </div>
  );
};
