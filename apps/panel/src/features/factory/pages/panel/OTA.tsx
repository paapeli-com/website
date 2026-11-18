import { useEffect, useMemo, useState } from "react";
import { dateLocale, formatDate, formatTime } from "@/shared/lib/formatDate";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useGetProductDeviceTypesQuery,
  type OtaDeployment,
  type OtaDeploymentStatus,
  type OtaDevice,
  type OtaDeviceStatus,
  type OtaEvent,
  type OtaFirmware,
  type OtaFirmwareStatus,
  type OtaRolloutMode,
  type OtaSettings,
  type OtaTargetGroup,
} from "@paapeli/api";
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
  Pencil, Copy, Trash2, Upload, Download, RefreshCw, RotateCw, X, Settings as SettingsIcon, Rocket, FileText, Check,
} from "lucide-react";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { NoData } from "@/features/factory/components/NoData";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { currentProductKey } from "@/features/factory/lib/product";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import {
  useOtaActions,
  useOtaDeploymentEvents,
  useOtaDeploymentPreview,
  useOtaDeployments,
  useOtaDeviceHistory,
  useOtaDevices,
  useOtaFirmware,
  useOtaSettings,
} from "@/features/factory/hooks/useOta";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Firmware, rollouts, the fleet and the OTA policy, all from the gateway
   (/api/v1/aiot/ota/{ws}/{pk}). Firmware files become ThingsBoard OTA
   packages; a rollout assigns them to devices batch by batch and follows
   what each device reports, so the progress shown here is the devices' own. */

// ------------------- Helpers -------------------
const fmtBytes = (b?: number) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1024/1024).toFixed(2)} MB`;
};

const useFmtDate = () => {
  const { language } = useLanguage();
  return (iso?: string | null) => {
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
  const { t, formatNumber } = useLanguage();
  const fmtDateLocal = useFmtDate();
  return (iso?: string | null) => {
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

type AnyStatus = OtaFirmwareStatus | OtaDeploymentStatus | OtaDeviceStatus;

const STATUS_KEY: Record<AnyStatus, string> = {
  DRAFT: "otaStatusDraft",
  ACTIVE: "otaStatusActive",
  COMPLETED: "otaStatusCompleted",
  FAILED: "otaStatusFailed",
  AWAITING_APPROVAL: "otaStatusAwaitingApproval",
  SCHEDULED: "otaStatusScheduled",
  IN_PROGRESS: "otaStatusInProgress",
  PAUSED: "otaStatusPaused",
  CANCELLED: "otaStatusCancelled",
  UP_TO_DATE: "otaStatusUpToDate",
  UPDATE_AVAILABLE: "otaStatusUpdateAvailable",
  PENDING: "otaStatusPending",
  UPDATING: "otaStatusUpdating",
  UNKNOWN: "otaStatusUnknown",
};

const GREEN = "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
const BLUE = "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
const RED = "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
const AMBER = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
const MUTED = "bg-muted text-muted-foreground border-border";

const STATUS_CLASS: Record<AnyStatus, string> = {
  DRAFT: MUTED,
  ACTIVE: GREEN,
  COMPLETED: BLUE,
  FAILED: RED,
  AWAITING_APPROVAL: AMBER,
  SCHEDULED: MUTED,
  IN_PROGRESS: AMBER,
  PAUSED: MUTED,
  CANCELLED: MUTED,
  UP_TO_DATE: GREEN,
  UPDATE_AVAILABLE: AMBER,
  PENDING: MUTED,
  UPDATING: BLUE,
  UNKNOWN: MUTED,
};

const useStatusBadge = () => {
  const { t } = useLanguage();
  return (s: AnyStatus) => (
    <Badge variant="outline" className={`${STATUS_CLASS[s] || ""} font-medium`}>
      {t((STATUS_KEY[s] || s) as any)}
    </Badge>
  );
};

/* Device type keys are the product's own; the label is what people read. */
const useDeviceTypeLabel = () => {
  const { data } = useGetProductDeviceTypesQuery(currentProductKey());
  const labels = useMemo(() => new Map((data ?? []).map((d) => [d.deviceType, d.label])), [data]);
  return {
    label: (type: string) => labels.get(type) || type,
    types: data ?? [],
  };
};

const useLocationPath = () => {
  const { options } = useAssetLocations();
  const pathOf = useMemo(() => {
    const paths = new Map(options.map((o) => [o.id, o.path]));
    return (assetId?: string | null) => (assetId ? paths.get(assetId) ?? "" : "");
  }, [options]);
  return { pathOf, options };
};

const EVENT_KEY: Record<OtaEvent["type"], string> = {
  CREATED: "otaEventCreated",
  APPROVED: "otaEventApproved",
  SCHEDULED: "otaEventScheduled",
  STARTED: "otaEventStarted",
  BATCH_SENT: "otaEventBatchSent",
  DEVICE_UPDATED: "otaEventDeviceUpdated",
  DEVICE_FAILED: "otaEventDeviceFailed",
  DEVICE_RETRIED: "otaEventDeviceRetried",
  PAUSED: "otaEventPaused",
  RESUMED: "otaEventResumed",
  RETRIED: "otaEventRetried",
  THRESHOLD_EXCEEDED: "otaEventThresholdExceeded",
  CANCELLED: "otaEventCancelled",
  COMPLETED: "otaEventCompleted",
  FAILED: "otaEventFailed",
};

const useEventText = () => {
  const { t, formatNumber } = useLanguage();
  return (e: OtaEvent) => {
    const text = t(EVENT_KEY[e.type] as any)
      .replace("{device}", e.deviceName ?? "")
      .replace("{n}", formatNumber(e.deviceCount ?? 0))
      .replace("{detail}", e.detail ?? "");
    // A plain event that carries a reason shows it.
    return e.detail && !text.includes(e.detail) ? `${text} — ${e.detail}` : text;
  };
};

const isLive = (s: OtaDeploymentStatus) =>
  s === "AWAITING_APPROVAL" || s === "SCHEDULED" || s === "IN_PROGRESS" || s === "PAUSED";

const downloadCsv = (name: string, header: string[], rows: unknown[][]) => {
  const csv = [header.join(","), ...rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${name}-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

/** Runs an OTA write and says how it went. */
const useRun = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  return async <R,>(action: () => Promise<R>, success?: (result: R) => string | undefined) => {
    try {
      const result = await action();
      const title = success?.(result);
      if (title) toast({ title });
      return result;
    } catch (error) {
      toast({ title: apiErrorMessage(error, t("otaActionFailed")), variant: "destructive" });
      return undefined;
    }
  };
};

// ------------------- Page -------------------
const OTAPage = () => {
  const { t, isRTL, language, formatNumber } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtDateL = useFmtDate();
  const { label: typeLabel } = useDeviceTypeLabel();
  const { toast } = useToast();
  const navigate = useNavigate();
  const run = useRun();
  const actions = useOtaActions();
  const lp = (p: string) => localizedPath(p, language);
  const goToCreate = () => navigate(lp("/firmware/new"));
  const goToEdit = (u: OtaFirmware) => navigate(lp(`/firmware/${u.id}/edit`));
  const goToDuplicate = (u: OtaFirmware) => navigate(lp(`/firmware/new?from=${u.id}`));

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
  const firmwareQuery = useOtaFirmware();
  const deploymentsQuery = useOtaDeployments();
  const firmware = firmwareQuery.data ?? [];
  const deployments = deploymentsQuery.data ?? [];

  // dialogs / panels
  const [deployFor, setDeployFor] = useState<OtaFirmware | null>(null);
  const [updateDetailsId, setUpdateDetailsId] = useState<string | null>(null);
  const [deploymentDetailsId, setDeploymentDetailsId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  // Shown from the lists, so they follow refreshes.
  const updateDetails = firmware.find(f => f.id === updateDetailsId) ?? null;
  const deploymentDetails = deployments.find(d => d.id === deploymentDetailsId) ?? null;

  // ---- KPIs
  const activeUpdates = firmware.filter(u => u.status === "ACTIVE").length;
  const failedUpdates = firmware.filter(u => u.status === "FAILED").length;
  const devicesUpdated = deployments.reduce((s, d) => s + d.updated, 0);

  const deleteFirmware = async (ids: string[]) => {
    let deleted = 0;
    for (const id of ids) {
      const done = await run(() => actions.deleteFirmware.mutateAsync(id));
      if (done) deleted++;
    }
    if (deleted > 0) toast({ title: t("deleted") });
  };

  return (
    <>
      <PageHeader
        title={t("otaPageTitle")}
        count={firmware.length}
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
        <KpiCard icon={Package} label={t("totalUpdates")} value={formatNumber(firmware.length)} sublabel={t("allFirmwareUpdates")} tone="primary" />
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
                updates={firmware}
                isLoading={firmwareQuery.isLoading}
                isRefreshing={firmwareQuery.isFetching}
                onRefresh={() => firmwareQuery.refetch()}
                onCreate={goToCreate}
                onEdit={goToEdit}
                onDeploy={(u) => setDeployFor(u)}
                onView={(u) => setUpdateDetailsId(u.id)}
                onDelete={(ids) => setConfirmDelete(ids)}
                onDuplicate={goToDuplicate}
              />
            </div>
            <RightSidePanel
              deployments={deployments}
              onViewAll={() => setTab("deployments")}
              onCreate={goToCreate}
              onStartDeployment={() => {
                const first = firmware[0];
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
            isLoading={deploymentsQuery.isLoading}
            isRefreshing={deploymentsQuery.isFetching}
            onRefresh={() => deploymentsQuery.refetch()}
            onView={(d) => setDeploymentDetailsId(d.id)}
          />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>

      {/* Update details drawer */}
      <Sheet open={!!updateDetails} onOpenChange={(o) => !o && setUpdateDetailsId(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {updateDetails && (
            <>
              <SheetHeader><SheetTitle>{updateDetails.name}</SheetTitle><SheetDescription>{updateDetails.version} · {typeLabel(updateDetails.deviceType)}</SheetDescription></SheetHeader>
              <div className="space-y-3 mt-6 text-sm">
                <DetailRow label={t("status")} value={statusBadge(updateDetails.status)} />
                <DetailRow label={t("devices")} value={formatNumber(updateDetails.installedDevices)} />
                <DetailRow label={t("createdByCol")} value={updateDetails.createdByName || "—"} />
                <DetailRow label={t("createdAt")} value={fmtDateL(updateDetails.createdAt)} />
                <DetailRow label={t("firmwareFile")} value={`${updateDetails.fileName} (${fmtBytes(updateDetails.fileSize)})`} />
                <DetailRow label={t("checksum")} value={<code className="text-xs break-all" dir="ltr">{updateDetails.checksum}</code>} />
                {updateDetails.releaseNotes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("releaseNotes")}</div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{updateDetails.releaseNotes}</div>
                  </div>
                )}
                <div className="pt-3">
                  <Button className="w-full" onClick={() => { setDeployFor(updateDetails); setUpdateDetailsId(null); }}>
                    <Rocket className="h-4 w-4 me-2" /> {t("startDeploymentAction")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Deployment details drawer */}
      <Sheet open={!!deploymentDetails} onOpenChange={(o) => !o && setDeploymentDetailsId(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {deploymentDetails && <DeploymentDetails deployment={deploymentDetails} />}
        </SheetContent>
      </Sheet>

      {/* Start Deployment panel */}
      <StartDeploymentPanel
        open={!!deployFor}
        firmware={deployFor}
        onClose={() => setDeployFor(null)}
      />

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{(confirmDelete?.length || 0) > 1 ? t("deleteUpdatesTitle") : t("deleteUpdateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {((confirmDelete?.length || 0) > 1 ? t("deleteUpdatesDesc") : t("deleteUpdateDesc"))
                .replace("{n}", formatNumber(confirmDelete?.length || 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDelete) return;
                void deleteFirmware(confirmDelete);
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
    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-end min-w-0">{value}</span>
  </div>
);

const ListLoading = () => (
  <div className="py-12 flex justify-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin" /></div>
);

// ---------- Updates Tab ----------
const UpdatesTab = ({
  updates, isLoading, isRefreshing, onRefresh, onCreate, onEdit, onDeploy, onView, onDelete, onDuplicate,
}: {
  updates: OtaFirmware[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (u: OtaFirmware) => void;
  onDeploy: (u: OtaFirmware) => void;
  onView: (u: OtaFirmware) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (u: OtaFirmware) => void;
}) => {
  const { t, formatNumber, isRTL } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtDateL = useFmtDate();
  const { label: typeLabel, types } = useDeviceTypeLabel();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [createdByF, setCreatedByF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const perPage = 5;

  // Drop selections that were deleted.
  useEffect(() => {
    setSelected((s) => s.filter((id) => updates.some((u) => u.id === id)));
  }, [updates]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = updates.filter(u =>
      (u.name.toLowerCase().includes(q) || u.version.toLowerCase().includes(q)) &&
      (statusF === "all" || u.status === statusF) &&
      (typeF === "all" || u.deviceType === typeF) &&
      (createdByF === "all" || (u.createdByName ?? "") === createdByF)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "nameAsc": return a.name.localeCompare(b.name);
        case "version": return b.version.localeCompare(a.version, undefined, { numeric: true });
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

  const handleExport = () => downloadCsv(
    "ota-updates",
    ["name", "version", "deviceType", "devices", "status", "createdBy", "createdAt", "checksum"],
    filtered.map(u => [u.name, u.version, u.deviceType, u.installedDevices, u.status, u.createdByName, u.createdAt, u.checksum]),
  );

  const typeOptions = Array.from(new Set([...types.map(d => d.deviceType), ...updates.map(u => u.deviceType)]));
  const filterFields: FilterField[] = [
    { key: "status", label: t("status"), value: statusF, onChange: (v) => { setStatusF(v); setPage(1); }, options: [
      { value: "all", label: t("all") },
      { value: "ACTIVE", label: t("otaStatusActive") },
      { value: "COMPLETED", label: t("otaStatusCompleted") },
      { value: "FAILED", label: t("otaStatusFailed") },
      { value: "DRAFT", label: t("otaStatusDraft") },
    ] },
    { key: "type", label: t("targetTypeFilter"), value: typeF, onChange: (v) => { setTypeF(v); setPage(1); }, options: [
      { value: "all", label: t("all") }, ...typeOptions.map(d => ({ value: d, label: typeLabel(d) })),
    ] },
    { key: "createdBy", label: t("createdByFilter"), value: createdByF, onChange: (v) => { setCreatedByF(v); setPage(1); }, options: [
      { value: "all", label: t("all") },
      ...Array.from(new Set(updates.map(u => u.createdByName).filter((n): n is string => !!n))).map(n => ({ value: n, label: n })),
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

        {isLoading ? <ListLoading /> : paged.length === 0 ? (
          updates.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noUpdatesFound")}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-x-auto text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
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
                    <TableCell dir="ltr">{u.version}</TableCell>
                    <TableCell>{typeLabel(u.deviceType)}</TableCell>
                    <TableCell>{formatNumber(u.installedDevices)}</TableCell>
                    <TableCell>{statusBadge(u.status)}</TableCell>
                    <TableCell>{u.createdByName || "—"}</TableCell>
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
  deployments: OtaDeployment[];
  onViewAll: () => void;
  onCreate: () => void;
  onStartDeployment: () => void;
  onSettings: () => void;
}) => {
  const { t, formatNumber } = useLanguage();
  const fmtRel = useFmtRel();
  const active = deployments.filter(d => isLive(d.status)).slice(0, 3);
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
          {recent.map(d => (
            <div key={d.id} className="space-y-2">
              <div>
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">{t("startedAtRelative").replace("{when}", fmtRel(d.startedAt ?? d.createdAt))}</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Progress value={d.progressPct} className="flex-1 me-3" />
                <span className="font-medium">{formatNumber(d.progressPct)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("devicesUpdatedFraction").replace("{updated}", formatNumber(d.updated)).replace("{target}", formatNumber(d.totalDevices))}</span>
                <span>{t("failedCountSuffix").replace("{n}", formatNumber(d.failed))}</span>
              </div>
            </div>
          ))}
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

// ---------- Deployment details ----------
const DeploymentDetails = ({ deployment: d }: { deployment: OtaDeployment }) => {
  const { t, formatNumber } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtDateL = useFmtDate();
  const eventText = useEventText();
  const { data: events, isLoading } = useOtaDeploymentEvents(d.id);
  return (
    <>
      <SheetHeader><SheetTitle>{d.name}</SheetTitle><SheetDescription dir="ltr">{d.firmwareVersion}</SheetDescription></SheetHeader>
      <div className="space-y-3 mt-6 text-sm">
        <DetailRow label={t("status")} value={statusBadge(d.status)} />
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t("progressLabel")}</div>
          <Progress value={d.progressPct} />
          <div className="text-xs text-muted-foreground mt-1">{formatNumber(d.updated + d.failed)}/{formatNumber(d.totalDevices)} {t("devicesShortLabel")}</div>
        </div>
        <DetailRow label={t("updatedLabel")} value={formatNumber(d.updated)} />
        <DetailRow label={t("failedLabel")} value={formatNumber(d.failed)} />
        <DetailRow label={t("inFlightLabel")} value={formatNumber(d.inFlight)} />
        <DetailRow label={t("pendingLabel")} value={formatNumber(d.pending)} />
        {d.cancelled > 0 && <DetailRow label={t("otaStatusCancelled")} value={formatNumber(d.cancelled)} />}
        {d.scheduledAt && <DetailRow label={t("scheduleAtLabel")} value={`${fmtDateL(d.scheduledAt)} ${formatTime(d.scheduledAt)}`} />}
        <DetailRow label={t("startedAt")} value={d.startedAt ? fmtDateL(d.startedAt) : "—"} />
        {d.completedAt && <DetailRow label={t("completedAt")} value={fmtDateL(d.completedAt)} />}
        <DetailRow label={t("createdByCol")} value={d.createdByName || "—"} />
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t("logsLabel")}</div>
          <div className="rounded-md border bg-muted/30 p-3 space-y-1 max-h-72 overflow-y-auto">
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            {(events ?? []).map((e) => (
              <div key={e.id} className="text-xs flex gap-2">
                <span className="text-muted-foreground shrink-0">{formatTime(e.createdAt)}</span>
                <span className="break-words min-w-0">{eventText(e)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ---------- Deployments Tab ----------
const DeploymentsTab = ({ deployments, isLoading, isRefreshing, onRefresh, onView }: {
  deployments: OtaDeployment[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onView: (d: OtaDeployment) => void;
}) => {
  const { t, isRTL, formatNumber } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtRel = useFmtRel();
  const { label: typeLabel } = useDeviceTypeLabel();
  const run = useRun();
  const { deploymentAction } = useOtaActions();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = useMemo(() => {
    let list = deployments.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusF === "all" || d.status === statusF) &&
      (typeF === "all" || d.deviceType === typeF)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "nameAsc": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [deployments, search, statusF, typeF, sort]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const act = (d: OtaDeployment, action: "approve" | "pause" | "resume" | "cancel" | "retry-failed") =>
    run(() => deploymentAction.mutateAsync({ id: d.id, action }), () => t("deploymentUpdatedToast"));

  const handleExport = () => downloadCsv(
    "ota-deployments",
    ["name", "version", "targetDevices", "updated", "failed", "pending", "status", "startedAt", "completedAt"],
    filtered.map(d => [d.name, d.firmwareVersion, d.totalDevices, d.updated, d.failed, d.pending, d.status, d.startedAt, d.completedAt]),
  );
  const actions: ActionItem[] = [
    { key: "export", label: t("exportListAction"), icon: Download, onSelect: handleExport },
  ];
  const statuses: OtaDeploymentStatus[] = ["AWAITING_APPROVAL", "SCHEDULED", "IN_PROGRESS", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"];
  const types = Array.from(new Set(deployments.map(d => d.deviceType)));

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
              ...statuses.map(s => ({ value: s, label: t(STATUS_KEY[s] as any) })),
            ] },
            { key: "type", label: t("targetTypeFilter"), value: typeF, onChange: (v) => { setTypeF(v); setPage(1); }, options: [{ value: "all", label: t("all") }, ...types.map(d => ({ value: d, label: typeLabel(d) }))] },
          ], activeCount: [statusF, typeF].filter(v => v !== "all").length, onClear: () => { setStatusF("all"); setTypeF("all"); setPage(1); } }}
          sort={{ options: [
            { key: "newest", label: t("sortNewest") }, { key: "oldest", label: t("sortOldest") }, { key: "nameAsc", label: t("sortNameAsc") }, { key: "status", label: t("status") },
          ], value: sort, onChange: setSort }}
          actions={actions}
        />

        {isLoading ? <ListLoading /> : paged.length === 0 ? (
          deployments.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noDeploymentsFound")}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-x-auto text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
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
                {paged.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell dir="ltr">{d.firmwareVersion}</TableCell>
                    <TableCell>{formatNumber(d.totalDevices)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={d.progressPct} className="flex-1" />
                        <span className="text-xs w-9 text-end">{formatNumber(d.progressPct)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(d.status)}</TableCell>
                    <TableCell>{d.startedAt ? fmtRel(d.startedAt) : "—"}</TableCell>
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
                            {d.status === "AWAITING_APPROVAL" && <DropdownMenuItem onClick={() => act(d, "approve")}><Check className="h-4 w-4 me-2" />{t("approveAction")}</DropdownMenuItem>}
                            {d.status === "IN_PROGRESS" && <DropdownMenuItem onClick={() => act(d, "pause")}><Pause className="h-4 w-4 me-2" />{t("pauseAction")}</DropdownMenuItem>}
                            {d.status === "PAUSED" && <DropdownMenuItem onClick={() => act(d, "resume")}><Play className="h-4 w-4 me-2" />{t("resumeAction")}</DropdownMenuItem>}
                            {d.failed > 0 && d.status !== "CANCELLED" && d.firmwareId && <DropdownMenuItem onClick={() => act(d, "retry-failed")}><RotateCw className="h-4 w-4 me-2" />{t("retryFailedAction")}</DropdownMenuItem>}
                            {isLive(d.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => act(d, "cancel")}>
                                  <X className="h-4 w-4 me-2" />{t("cancelAction")}
                                </DropdownMenuItem>
                              </>
                            )}
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

// ---------- Devices Tab ----------
const DevicesTab = () => {
  const { t, isRTL } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtRel = useFmtRel();
  const { label: typeLabel } = useDeviceTypeLabel();
  const { pathOf } = useLocationPath();
  const run = useRun();
  const { updateDevice, retryDevice } = useOtaActions();
  const devicesQuery = useOtaDevices();
  const devices = devicesQuery.data ?? [];
  const [logsFor, setLogsFor] = useState<OtaDevice | null>(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [locF, setLocF] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const rows = useMemo(() => devices.map(d => ({ ...d, location: pathOf(d.assetId) })), [devices, pathOf]);
  const deviceLocations = useMemo(
    () => Array.from(new Set(rows.map(d => d.location).filter(Boolean))).sort(),
    [rows],
  );
  const deviceTypes = useMemo(() => Array.from(new Set(rows.map(d => d.deviceType))), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = rows.filter(d =>
      (d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)) &&
      (statusF === "all" || d.status === statusF) &&
      (typeF === "all" || d.deviceType === typeF) &&
      (locF === "all" || d.location === locF)
    );
    const time = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return time(a.lastUpdated) - time(b.lastUpdated);
        case "nameAsc": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        default: return time(b.lastUpdated) - time(a.lastUpdated);
      }
    });
    return list;
  }, [rows, search, statusF, typeF, locF, sort]);
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => downloadCsv(
    "ota-devices",
    ["name", "location", "type", "currentFw", "targetFw", "status", "lastUpdated"],
    filtered.map(d => [d.name, d.location, d.deviceType, d.currentVersion, d.targetVersion, d.status, d.lastUpdated]),
  );
  const actions: ActionItem[] = [
    { key: "export", label: t("exportListAction"), icon: Download, onSelect: handleExport },
  ];
  const statuses: OtaDeviceStatus[] = ["UP_TO_DATE", "UPDATE_AVAILABLE", "UPDATING", "FAILED", "PENDING", "UNKNOWN"];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{t("devicesTitle")}</CardTitle></CardHeader>
      <CardContent>
        <ListToolbar
          search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: t("searchDevicesPlaceholder") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={() => devicesQuery.refetch()}
          isRefreshing={devicesQuery.isFetching}
          filter={{ fields: [
            { key: "status", label: t("otaStatus"), value: statusF, onChange: (v) => { setStatusF(v); setPage(1); }, options: [
              { value: "all", label: t("all") },
              ...statuses.map(s => ({ value: s, label: t(STATUS_KEY[s] as any) })),
            ] },
            { key: "type", label: t("deviceTypeFilter"), value: typeF, onChange: (v) => { setTypeF(v); setPage(1); }, options: [{ value: "all", label: t("all") }, ...deviceTypes.map(d => ({ value: d, label: typeLabel(d) }))] },
            { key: "loc", label: t("location"), value: locF, onChange: (v) => { setLocF(v); setPage(1); }, options: [{ value: "all", label: t("all") }, ...deviceLocations.map(l => ({ value: l, label: l }))] },
          ], activeCount: [statusF, typeF, locF].filter(v => v !== "all").length, onClear: () => { setStatusF("all"); setTypeF("all"); setLocF("all"); setPage(1); } }}
          sort={{ options: [
            { key: "newest", label: t("sortNewest") }, { key: "oldest", label: t("sortOldest") }, { key: "nameAsc", label: t("sortNameAsc") }, { key: "status", label: t("status") },
          ], value: sort, onChange: setSort }}
          actions={actions}
        />

        {devicesQuery.isLoading ? <ListLoading /> : paged.length === 0 ? (
          devices.length === 0 ? <NoData size="lg" />
            : <div className="text-center py-12 text-muted-foreground text-sm">{t("noDevicesFound") || t("noDevicesYet")}</div>
        ) : (
          <div dir={isRTL ? "rtl" : "ltr"} className="rounded-lg border overflow-x-auto text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
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
                        <div className="min-w-0">
                          <div>{d.name}</div>
                          <div className="text-[11px] text-muted-foreground font-normal">{typeLabel(d.deviceType)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{d.location ? <LocationCell path={d.location} /> : "—"}</TableCell>
                    <TableCell dir="ltr">{d.currentVersion || "—"}</TableCell>
                    <TableCell dir="ltr">{d.targetVersion || "—"}</TableCell>
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
                            {d.status === "UPDATE_AVAILABLE" && (
                              <DropdownMenuItem onClick={() => run(() => updateDevice.mutateAsync({ id: d.id }), () => t("updateStartedToast"))}>
                                <RefreshCw className="h-4 w-4 me-2" />{t("updateDeviceAction")}
                              </DropdownMenuItem>
                            )}
                            {d.status === "FAILED" && (
                              <DropdownMenuItem onClick={() => run(() => retryDevice.mutateAsync(d.id), () => t("updateStartedToast"))}>
                                <RotateCw className="h-4 w-4 me-2" />{t("retryUpdateAction")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setLogsFor(d)}>
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

      <Sheet open={!!logsFor} onOpenChange={(o) => !o && setLogsFor(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {logsFor && <DeviceHistory device={logsFor} />}
        </SheetContent>
      </Sheet>
    </Card>
  );
};

const DeviceHistory = ({ device }: { device: OtaDevice }) => {
  const { t } = useLanguage();
  const statusBadge = useStatusBadge();
  const fmtDateL = useFmtDate();
  const eventText = useEventText();
  const { data, isLoading } = useOtaDeviceHistory(device.id);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{device.name}</SheetTitle>
        <SheetDescription>{t("deviceHistoryTitle")}</SheetDescription>
      </SheetHeader>
      <div className="space-y-3 mt-6 text-sm">
        <DetailRow label={t("otaStatus")} value={statusBadge(device.status)} />
        <DetailRow label={t("currentVersionLabel")} value={<span dir="ltr">{device.currentVersion || "—"}</span>} />
        <DetailRow label={t("targetFirmware")} value={<span dir="ltr">{device.targetVersion || "—"}</span>} />
        {device.lastError && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("lastErrorLabel")}</div>
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs break-words">{device.lastError}</div>
          </div>
        )}
        <div className="space-y-2 pt-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isLoading && (data ?? []).length === 0 && <div className="text-xs text-muted-foreground">{t("noHistoryYet")}</div>}
          {(data ?? []).map((e) => (
            <div key={e.id} className="border-b border-border/60 pb-2">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span dir="ltr">{e.firmwareName} {e.firmwareVersion}</span>
                <span>{fmtDateL(e.createdAt)} {formatTime(e.createdAt)}</span>
              </div>
              <div className="text-xs mt-0.5 break-words">{eventText(e)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ---------- Settings Tab ----------
const timeZones = (): string[] => {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  const zones = supported ? supported("timeZone") : [];
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
};
const browserTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
};

const SettingsTab = () => {
  const { t, isRTL } = useLanguage();
  const run = useRun();
  const { saveSettings } = useOtaActions();
  const { data: settings, isLoading } = useOtaSettings();
  const [local, setLocal] = useState<OtaSettings | null>(null);
  const zones = useMemo(timeZones, []);
  useEffect(() => {
    if (!settings) return;
    // A product that never set a window gets this browser's zone, for the first save.
    const unset = !settings.maintenanceStart && settings.timeZone === "UTC";
    setLocal({ ...settings, timeZone: unset ? browserTimeZone() : settings.timeZone });
  }, [settings]);

  if (isLoading || !local) return <ListLoading />;
  const update = <K extends keyof OtaSettings>(k: K, v: OtaSettings[K]) => setLocal({ ...local, [k]: v });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="max-w-3xl space-y-4 me-auto">
      <Card>
        <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm font-semibold">{t("defaultOtaPolicy")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-3">
          <ToggleRow label={t("allowAutoUpdate")} description={t("allowAutoUpdateDesc")} value={local.allowAuto} onChange={(v) => update("allowAuto", v)} />
          <ToggleRow label={t("requireManualApproval")} description={t("requireManualApprovalDesc")} value={local.requireApproval} onChange={(v) => update("requireApproval", v)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm font-semibold">{t("updateSafety")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-3">
          <ToggleRow label={t("retryFailedUpdates")} value={local.retryFailed} onChange={(v) => update("retryFailed", v)} />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("maxRetryCount")}</Label>
            <Input className="h-8 max-w-[160px]" type="number" min={0} max={10} disabled={!local.retryFailed} value={local.maxRetry}
              onChange={(e) => update("maxRetry", Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
            <p className="text-xs text-muted-foreground">{t("maxRetryDesc")}</p>
          </div>
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-muted-foreground">{t("maintenanceWindowLabel")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("maintenanceStartLabel")}</Label>
                <Input className="h-8" type="time" dir="ltr" value={local.maintenanceStart ?? ""} onChange={(e) => update("maintenanceStart", e.target.value || null)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("maintenanceEndLabel")}</Label>
                <Input className="h-8" type="time" dir="ltr" value={local.maintenanceEnd ?? ""} onChange={(e) => update("maintenanceEnd", e.target.value || null)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("timeZoneLabel")}</Label>
                <Select value={local.timeZone} onValueChange={(v) => update("timeZone", v)}>
                  <SelectTrigger className="h-8" dir="ltr"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {(zones.includes(local.timeZone) ? zones : [local.timeZone, ...zones]).map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("maintenanceWindowDesc")}</p>
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
        <Button size="sm" disabled={saveSettings.isPending}
          onClick={() => run(() => saveSettings.mutateAsync(local), () => t("settingsSaved"))}>
          {t("saveSettingsBtn")}
        </Button>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

// ---------- Start Deployment Panel ----------
/* datetime-local wants local "YYYY-MM-DDTHH:mm". */
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StartDeploymentPanel = ({ open, firmware, onClose }: {
  open: boolean;
  firmware: OtaFirmware | null;
  onClose: () => void;
}) => {
  const { isRTL, t, formatNumber } = useLanguage();
  const run = useRun();
  const { createDeployment } = useOtaActions();
  const { pathOf, options: locations } = useLocationPath();
  const [targetGroup, setTargetGroup] = useState<OtaTargetGroup>("ALL");
  const [locationSel, setLocationSel] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [rolloutMode, setRolloutMode] = useState<OtaRolloutMode>("ALL");
  const [batchSize, setBatchSize] = useState(50);
  const [failureThreshold, setFailureThreshold] = useState(10);

  useEffect(() => {
    if (!open) return;
    setTargetGroup("ALL"); setLocationSel(""); setPicked([]); setDeviceSearch("");
    setScheduleLater(false); setScheduleAt(toLocalInput(new Date(Date.now() + 3600_000)));
    setRolloutMode("ALL"); setBatchSize(50); setFailureThreshold(10);
  }, [open]);

  // Every device the firmware can go to: the picker's list and the ALL count.
  const eligible = useOtaDeploymentPreview(open && firmware ? { firmwareId: firmware.id, targetGroup: "ALL" } : null);
  const atLocation = useOtaDeploymentPreview(
    open && firmware && targetGroup === "LOCATION" && locationSel
      ? { firmwareId: firmware.id, targetGroup: "LOCATION", assetId: locationSel }
      : null,
  );

  if (!firmware) return null;
  const eligibleDevices = eligible.data ?? [];
  const deviceCount = targetGroup === "ALL" ? eligibleDevices.length
    : targetGroup === "LOCATION" ? (locationSel ? atLocation.data?.length ?? 0 : 0)
    : picked.length;
  const shownDevices = eligibleDevices.filter(d => d.name.toLowerCase().includes(deviceSearch.toLowerCase()));
  const scheduleValid = !scheduleLater || (!!scheduleAt && new Date(scheduleAt).getTime() > Date.now());
  const canStart = deviceCount > 0 && scheduleValid && !createDeployment.isPending
    && (rolloutMode === "ALL" || (batchSize >= 1 && failureThreshold >= 0 && failureThreshold <= 100));

  const start = async () => {
    const result = await run(
      () => createDeployment.mutateAsync({
        firmwareId: firmware.id,
        targetGroup,
        assetId: targetGroup === "LOCATION" ? locationSel : null,
        deviceIds: targetGroup === "DEVICES" ? picked : undefined,
        rolloutMode,
        batchSize: rolloutMode === "BATCH" ? batchSize : null,
        failureThresholdPct: rolloutMode === "BATCH" ? failureThreshold : null,
        scheduledAt: scheduleLater ? new Date(scheduleAt).toISOString() : null,
      }),
      (d) => d.status === "AWAITING_APPROVAL" ? t("deploymentAwaitingApprovalToast")
        : d.status === "SCHEDULED" ? t("deploymentScheduledToast")
        : t("deploymentStartedToast"),
    );
    if (result) onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("startDeploymentAction")}</SheetTitle>
          <SheetDescription>{firmware.name} {firmware.version}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("updatePackageLabel")}</Label>
            <Input value={`${firmware.name} ${firmware.version}`} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("targetGroupRequired")}</Label>
            <Select value={targetGroup} onValueChange={(v) => setTargetGroup(v as OtaTargetGroup)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allDevicesOfType")}</SelectItem>
                <SelectItem value="DEVICES">{t("selectedDevicesLabel")}</SelectItem>
                <SelectItem value="LOCATION">{t("selectedLocationLabel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetGroup === "LOCATION" && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("location")}</Label>
              <Select value={locationSel} onValueChange={setLocationSel}>
                <SelectTrigger><SelectValue placeholder={t("location")} /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.path}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {targetGroup === "DEVICES" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("pickDevicesLabel")}</Label>
                <span className="text-xs text-muted-foreground">{t("devicesPickedCount").replace("{n}", formatNumber(picked.length))}</span>
              </div>
              <Input className="h-8" value={deviceSearch} onChange={(e) => setDeviceSearch(e.target.value)} placeholder={t("searchDevicesPlaceholder")} />
              <div className="rounded-md border max-h-56 overflow-y-auto divide-y">
                {eligible.isLoading && <div className="p-3"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
                {!eligible.isLoading && eligibleDevices.length === 0 && <div className="p-3 text-xs text-muted-foreground">{t("noEligibleDevices")}</div>}
                {shownDevices.map(d => (
                  <label key={d.id} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-muted/40">
                    <Checkbox
                      checked={picked.includes(d.id)}
                      onCheckedChange={(c) => setPicked(c ? [...picked, d.id] : picked.filter(id => id !== d.id))}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{d.name}</span>
                      {d.assetId && <span className="block text-[11px] text-muted-foreground truncate">{pathOf(d.assetId)}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {t("targetDevicesLabel")}: <span className="font-semibold">{formatNumber(deviceCount)}</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("scheduleLabel")}</Label>
            <div className="flex gap-2">
              <Button variant={!scheduleLater ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setScheduleLater(false)}>{t("startNowBtn")}</Button>
              <Button variant={scheduleLater ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setScheduleLater(true)}>{t("scheduleBtn")}</Button>
            </div>
            {scheduleLater && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("scheduleAtLabel")}</Label>
                <Input type="datetime-local" dir="ltr" value={scheduleAt} min={toLocalInput(new Date())} onChange={(e) => setScheduleAt(e.target.value)} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("rolloutModeLabel")}</Label>
            <div className="flex gap-2">
              <Button variant={rolloutMode === "ALL" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRolloutMode("ALL")}>{t("allAtOnceBtn")}</Button>
              <Button variant={rolloutMode === "BATCH" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRolloutMode("BATCH")}>{t("batchRolloutBtn")}</Button>
            </div>
          </div>
          {rolloutMode === "BATCH" && (
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
            <Button className="flex-1" disabled={!canStart} onClick={start}>
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
