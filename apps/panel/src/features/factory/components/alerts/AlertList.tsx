import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/features/factory/components/ui/dropdown-menu";
import {
  Search, Bell, AlertOctagon, Users, Zap, User, Clock,
  Bookmark, Archive, CheckCircle2, MoreHorizontal, ChevronLeft, ChevronRight, Eye,
  CircleDot, ListFilter, Download, Pencil, UserPlus, Trash2,
} from "lucide-react";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { NoData } from "@/features/factory/components/NoData";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import type { Alert, AlertSeverity, AlertStatus } from "@/features/factory/types/alerts";
import { cn } from "@/shared/lib/utils";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import {
  useAckAlarmMutation,
  useClearAlarmMutation,
  useGetWorkspaceAlarmsQuery,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useToast } from "@/features/factory/hooks/use-toast";
import { TableRowsSkeleton } from "@/features/factory/components/panel/DetailPageSkeleton";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { apiSeverityToUi } from "./alarmRuleMapping";

const severityBadge: Record<AlertSeverity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
};

const severityBar: Record<AlertSeverity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const severityDot: Record<AlertSeverity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const statusDot: Record<AlertStatus, string> = {
  active: "bg-red-500",
  acknowledged: "bg-blue-500",
  resolved: "bg-emerald-500",
  suppressed: "bg-muted-foreground",
  escalated: "bg-purple-500",
  archived: "bg-muted-foreground",
};

const statusLabel = (s: AlertStatus, tt: (k: string) => string): string => {
  const map: Record<AlertStatus, string> = {
    active: tt("alertStatusActive"),
    acknowledged: tt("alertStatusAcknowledged"),
    resolved: tt("alertStatusResolved"),
    suppressed: tt("alertStatusSuppressed"),
    escalated: tt("alertStatusEscalated"),
    archived: tt("alertStatusArchived"),
  };
  return map[s];
};

/* Gateway alarm statuses are ThingsBoard's: ACTIVE_UNACK, ACTIVE_ACK,
   CLEARED_UNACK, CLEARED_ACK. A cleared alarm is resolved whether or not
   anyone acknowledged it first. */
const toStatus = (raw: string): AlertStatus => {
  const v = raw?.toUpperCase() ?? "";
  if (v.startsWith("CLEARED")) return "resolved";
  if (v === "ACTIVE_ACK") return "acknowledged";
  return "active";
};

const formatElapsed = (ms: number) => {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

/* Each alarm carries its own device and asset. `locationPath` is the asset's
   full breadcrumb from the asset tree, when it has loaded; otherwise the bare
   asset name stands in. The API gives no clear time, so a resolved alarm has
   no duration. */
const toAlert = (a: WorkspaceAlarmItem, locationPath: string | undefined): Alert => {
  const status = toStatus(a.status);
  const created = new Date(a.createdAt).getTime();
  return {
    id: a.id,
    ruleId: "",
    ruleName: a.alarmName,
    severity: apiSeverityToUi(a.severity),
    status,
    deviceId: a.deviceId,
    deviceName: a.deviceName ?? a.deviceId,
    locationId: a.assetId ?? "",
    locationName: locationPath ?? a.assetName ?? "",
    assignedTo: a.assignedTo?.displayName || a.assignedTo?.email || undefined,
    triggerCondition: "",
    startTime: new Date(created).toISOString(),
    duration: status === "resolved" ? "" : formatElapsed(Date.now() - created),
    notes: [],
  };
};

type StatusChip = "active" | "unacknowledged" | "acknowledged" | "escalated" | "archived";

export const AlertList = () => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;

  const { toast } = useToast();
  const workspaceId = useWorkspaceId();
  const { options: assetLocations } = useAssetLocations();

  /* One workspace-product list covers every device's alarms. Every filter,
     KPI and export below works off this one array. Without a workspace the
     query is disabled, which still counts as loading. */
  const alarmsQuery = useGetWorkspaceAlarmsQuery(workspaceId ?? "", PRODUCT_KEY);
  const alertsLoading = alarmsQuery.isLoading || !workspaceId;
  // A failed load surfaces as a toast, once per failure, rather than as inline
  // text; the table just renders empty.
  useEffect(() => {
    if (!alarmsQuery.isError) return;
    toast({ title: tt("error"), description: apiErrorMessage(alarmsQuery.error, tt("alertsLoadFailed")), variant: "destructive" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmsQuery.isError]);
  const alerts: Alert[] = useMemo(() => {
    const pathById = new Map(assetLocations.map((o) => [o.id, o.path]));
    return (alarmsQuery.data ?? []).map((a) => toAlert(a, a.assetId ? pathById.get(a.assetId) : undefined));
  }, [alarmsQuery.data, assetLocations]);

  const ackAlarm = useAckAlarmMutation();
  const clearAlarm = useClearAlarmMutation();
  /* Both mutations invalidate the device's ['deviceAlarms', …] queries, so the
     row's status updates from the server rather than being patched locally. */
  const runAlarmAction = async (kind: "ack" | "clear", alert: Alert) => {
    if (!workspaceId) {
      toast({ title: tt("error"), description: tt("noWorkspaceSelected"), variant: "destructive" });
      return;
    }
    try {
      await (kind === "ack" ? ackAlarm : clearAlarm).mutateAsync({
        workspaceId, productKey: PRODUCT_KEY, alarmId: alert.id, deviceId: alert.deviceId,
      });
      toast({ title: tt(kind === "ack" ? "alarmAcknowledged" : "alarmCleared"), description: alert.ruleName });
    } catch (error) {
      toast({ title: tt("error"), description: error instanceof Error ? error.message : tt("error"), variant: "destructive" });
    }
  };

  const [activeKpi, setActiveKpi] = useState<"active" | "unacknowledged" | "critical" | "escalated">("active");
  const [statusChip, setStatusChip] = useState<StatusChip | "all">("all");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [location, setLocation] = useState("all");
  const [device, setDevice] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [sortKey, setSortKey] = useState<string>("severity");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void alarmsQuery.refetch().finally(() => setIsRefreshing(false));
  };

  // Counts for KPIs and chips
  const counts = useMemo(() => {
    const all = alerts;
    return {
      active: all.filter(a => a.status === "active").length,
      unacknowledged: all.filter(a => a.status === "active" || a.status === "escalated").length,
      critical: all.filter(a => a.severity === "critical" && a.status !== "resolved" && a.status !== "archived").length,
      escalated: all.filter(a => a.status === "escalated").length,
      acknowledged: all.filter(a => a.status === "acknowledged").length,
      archived: all.filter(a => a.status === "archived").length,
    };
  }, [alerts]);

  const locations = useMemo(() => Array.from(new Set(alerts.map(a => a.locationId).filter(Boolean))), [alerts]);
  const devices = useMemo(() => Array.from(new Set(alerts.map(a => a.deviceId))), [alerts]);
  const assignees = useMemo(() => Array.from(new Set(alerts.map(a => a.assignedTo).filter(Boolean))) as string[], [alerts]);

  const filtered = useMemo(() => {
    const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return alerts.filter(a => {
      if (activeKpi === "active" && a.status !== "active") return false;
      if (activeKpi === "unacknowledged" && a.status !== "active" && a.status !== "escalated") return false;
      if (activeKpi === "critical" && a.severity !== "critical") return false;
      if (activeKpi === "escalated" && a.status !== "escalated") return false;

      if (statusChip !== "all") {
        if (statusChip === "unacknowledged" && a.status !== "active" && a.status !== "escalated") return false;
        if (statusChip !== "unacknowledged" && a.status !== statusChip) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        if (!a.ruleName.toLowerCase().includes(q) &&
            !a.deviceName.toLowerCase().includes(q) &&
            !a.id.toLowerCase().includes(q)) return false;
      }
      if (severity !== "all" && a.severity !== severity) return false;
      if (location !== "all" && a.locationId !== location) return false;
      if (device !== "all" && a.deviceId !== device) return false;
      if (assignee !== "all" && a.assignedTo !== assignee) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      const dA = new Date(a.startTime).getTime();
      const dB = new Date(b.startTime).getTime();
      switch (sortKey) {
        case "newest": return dB - dA;
        case "oldest": return dA - dB;
        case "severity":
        default: return (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0);
      }
    });
  }, [alerts, activeKpi, statusChip, search, severity, location, device, assignee, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? paged.map(a => a.id) : []);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const opened = openId ? alerts.find(a => a.id === openId) || null : null;

  const clearFilters = () => {
    setActiveKpi("active"); setStatusChip("all"); setSearch("");
    setSeverity("all"); setLocation("all"); setDevice("all"); setAssignee("all");
  };

  const kpis = [
    { key: "active" as const, label: tt("kpiActiveAlarms"), value: counts.active, trend: "12", icon: Zap, accent: "text-orange-500", bg: "from-orange-50 to-transparent dark:from-orange-500/10" },
    { key: "unacknowledged" as const, label: tt("kpiUnacknowledged"), value: counts.unacknowledged, trend: "5", icon: Bell, accent: "text-amber-500", bg: "from-amber-50 to-transparent dark:from-amber-500/10" },
    { key: "critical" as const, label: tt("kpiCritical"), value: counts.critical, trend: "2", icon: AlertOctagon, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
    { key: "escalated" as const, label: tt("kpiEscalated"), value: counts.escalated, trend: "1", icon: Users, accent: "text-purple-500", bg: "from-purple-50 to-transparent dark:from-purple-500/10" },
  ];

  const chips: { key: StatusChip; label: string; count: number; color: string }[] = [
    { key: "active", label: tt("chipActive"), count: counts.active, color: "bg-orange-500" },
    { key: "unacknowledged", label: tt("chipUnacknowledged"), count: counts.unacknowledged, color: "bg-red-500" },
    { key: "acknowledged", label: tt("chipAcknowledged"), count: counts.acknowledged, color: "bg-blue-500" },
    { key: "escalated", label: tt("chipEscalated"), count: counts.escalated, color: "bg-purple-500" },
    { key: "archived", label: tt("chipArchived"), count: counts.archived, color: "bg-muted-foreground" },
  ];

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>

      {/* KPI cards - compact */}
      <KpiSection storageKey="alerts">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          const isActive = activeKpi === k.key;
          return (
            <button
              key={k.key}
              onClick={() => { setActiveKpi(k.key); setPage(1); }}
              className={cn(
                "relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm",
                "bg-gradient-to-br",
                k.bg,
                isActive ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                <Icon className={cn("h-3.5 w-3.5 shrink-0", k.accent)} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground leading-none">{k.value}</span>
              </div>
            </button>
          );
        })}
      </div>
      </KpiSection>



      {/* Standardized toolbar */}
      {(() => {
        const filterFields: FilterField[] = [
          {
            key: "severity", label: tt("alertSeverity"), value: severity,
            onChange: (v) => { setSeverity(v); setPage(1); },
            options: [
              { value: "all", label: tt("all") },
              { value: "critical", label: tt("alertCritical") },
              { value: "high", label: tt("alertHigh") },
              { value: "medium", label: tt("alertMedium") },
              { value: "low", label: tt("alertLow") },
            ],
          },
          {
            key: "location", label: tt("location"), value: location,
            onChange: (v) => { setLocation(v); setPage(1); },
            options: [
              { value: "all", label: tt("all") },
              ...locations.map(l => ({ value: l, label: alerts.find(a => a.locationId === l)?.locationName || l })),
            ],
          },
          {
            key: "assignee", label: tt("alertAssignee"), value: assignee,
            onChange: (v) => { setAssignee(v); setPage(1); },
            options: [
              { value: "all", label: tt("all") },
              ...assignees.map(a => ({ value: a, label: a })),
            ],
          },
          {
            key: "status", label: tt("status"), value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            options: [
              { value: "all", label: tt("all") },
              { value: "active", label: tt("alertStatusActive") },
              { value: "acknowledged", label: tt("alertStatusAcknowledged") },
              { value: "resolved", label: tt("alertStatusResolved") },
              { value: "escalated", label: tt("alertStatusEscalated") },
              { value: "archived", label: tt("alertStatusArchived") },
            ],
          },
        ];
        const sortOptions: SortOption[] = [
          { key: "severity", label: tt("sortSeverity") },
          { key: "newest", label: tt("sortNewest") },
          { key: "oldest", label: tt("sortOldest") },
        ];
        const activeFilterCount = [severity, location, assignee, statusFilter].filter(v => v !== "all").length;
        const handleExport = () => {
          const header = ["id", "ruleName", "severity", "status", "deviceName", "locationName", "assignedTo"];
          const csv = [header.join(","), ...filtered.map(a => header.map(h => `"${String((a as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url; link.download = `alarms-${Date.now()}.csv`; link.click();
          URL.revokeObjectURL(url);
        };
        const actionItems: ActionItem[] = [
          { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
          { key: "bulkAssign", label: tt("bulkAssign"), icon: UserPlus, comingSoon: true },
          { key: "archive", label: tt("archive"), icon: Archive, comingSoon: true },
          { key: "delete", label: tt("delete"), icon: Trash2, destructive: true, comingSoon: true },
        ];
        return (
          <ListToolbar
            search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: tt("alertSearchPlaceholder") }}
            view={{ value: listView, onChange: setListView, available: ["table"] }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setSeverity("all"); setLocation("all"); setAssignee("all"); setStatusFilter("all"); setPage(1); } }}
            sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
            actions={actionItems}
            selectionCount={selected.length}
          />
        );
      })()}


      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 px-2">
                <div className="flex justify-center">
                  <Checkbox
                    checked={paged.length > 0 && paged.every(a => selected.includes(a.id))}
                    onCheckedChange={(c) => toggleAll(!!c)}
                  />
                </div>
              </TableHead>
              <TableHead className="w-1"></TableHead>
              <TableHead>{tt("alertAlarm")}</TableHead>
              <TableHead>{tt("alertSeverity")}</TableHead>
              <TableHead>{tt("alertStatus")}</TableHead>
              <TableHead>{tt("devices")}</TableHead>
              <TableHead>{tt("locations")}</TableHead>
              <TableHead>{tt("alertDuration")}</TableHead>
              <TableHead>{tt("alertAssignedTo")}</TableHead>
              <TableHead className="text-end">{tt("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertsLoading && alerts.length === 0 ? (
              <TableRowsSkeleton rows={5} columns={10} />
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  {/* Nothing to show at all is "no data"; nothing matching the
                      current filters keeps the clearable empty state. */}
                  {alerts.length === 0 ? (
                    <NoData size="lg" />
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Bell className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="font-medium text-foreground">{tt("alertNoAlarmsTitle")}</div>
                      <div className="text-sm text-muted-foreground mt-1">{tt("alertNoAlarmsDesc")}</div>
                      <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                        {tt("alertClearFilters")}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : paged.map(a => {
              const isOpen = openId === a.id;
              const isAck = a.status === "acknowledged" || a.status === "resolved";
              return (
                <TableRow
                  key={a.id}
                  data-state={isOpen ? "selected" : undefined}
                  className={cn("cursor-pointer relative", isOpen && "bg-muted/50")}
                  onClick={() => setOpenId(a.id)}
                >
                  <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={selected.includes(a.id)}
                        onCheckedChange={(c) => toggleOne(a.id, !!c)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-0 w-1">
                    <div className={cn("w-1 h-12", severityBar[a.severity])} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{a.ruleName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{a.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", severityBadge[a.severity])}>
                      {tt(`alert${a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 text-sm">
                      <span className={cn("h-2 w-2 rounded-full", statusDot[a.status])} />
                      <span className="text-foreground">{statusLabel(a.status, tt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{a.deviceName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{a.deviceId}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <LocationCell path={a.locationName} />
                  </TableCell>
                  <TableCell className="text-sm">{a.duration || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">
                    {a.assignedTo || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isAck ? (
                        <Button variant="outline" size="sm" className="h-7 px-3" onClick={() => setOpenId(a.id)}>
                          <Eye className="h-3.5 w-3.5 me-1" />{tt("alertView")}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-500/30 dark:hover:bg-orange-500/10"
                          onClick={() => runAlarmAction("ack", a)}
                          disabled={ackAlarm.isPending}
                        >
                          {tt("alertAcknowledge")}
                        </Button>
                      )}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background z-[100] w-48">
                          <DropdownMenuItem onClick={() => setOpenId(a.id)}>
                            <Eye className="h-4 w-4 me-2" />{tt("alertView")}
                          </DropdownMenuItem>
                          {a.status !== "resolved" && (
                            <DropdownMenuItem onClick={() => runAlarmAction("clear", a)} disabled={clearAlarm.isPending}>
                              <CheckCircle2 className="h-4 w-4 me-2" />{tt("clearAlarm")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 me-2" />{tt("alertAssign")}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 me-2" />{tt("alertArchive")}
                          </DropdownMenuItem>
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

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{tt("alertRowsPerPage")}</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} {tt("alertOf")} {filtered.length}
            </span>
          </div>
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {/* Detail side panel */}
      <Sheet open={!!opened} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md p-0 overflow-y-auto">
          {opened && (
            <AlertDetailPanel
              alert={opened}
              tt={tt}
              busy={ackAlarm.isPending || clearAlarm.isPending}
              onAck={() => runAlarmAction("ack", opened)}
              onClear={() => runAlarmAction("clear", opened)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const AlertDetailPanel = ({ alert, tt, busy, onAck, onClear }: {
  alert: Alert;
  tt: (k: string) => string;
  busy: boolean;
  onAck: () => void;
  onClear: () => void;
}) => {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b">
        <SheetTitle className="text-lg">{alert.ruleName}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className="gap-1.5 border-red-200 text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30">
            <CircleDot className="h-3 w-3" />{statusLabel(alert.status, tt)}
          </Badge>
          <Badge variant="outline" className={cn("font-medium", severityBadge[alert.severity])}>
            {tt(`alert${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}`)}
          </Badge>
          <span className="ms-auto text-xs font-mono text-muted-foreground">{alert.id}</span>
        </div>
      </SheetHeader>

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-3 justify-start bg-transparent border-b rounded-none h-auto p-0 gap-4">
          <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-0">
            {tt("alertDetailsTab")}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-0">
            {tt("alertTimelineTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="px-6 py-4 space-y-4">
          <DetailRow label={tt("alertDescription")} value={alert.triggerCondition || "—"} />
          <DetailRow label={tt("devices")} value={<>
            <div>{alert.deviceName}</div>
            <div className="text-xs font-mono text-muted-foreground">{alert.deviceId}</div>
          </>} />
          <DetailRow label={tt("locations")} value={alert.locationName || tt("noData")} />
          <DetailRow label={tt("alertTriggerCondition")} value={alert.triggerCondition || "—"} />
          <DetailRow label={tt("alertStartTime")} value={<span dir="ltr">{new Date(alert.startTime).toLocaleString()}</span>} />
          <DetailRow label={tt("alertDuration")} value={alert.duration || "—"} />
          <DetailRow label={tt("alertAssignedTo")} value={alert.assignedTo || "—"} />
          <DetailRow label={tt("alertEscalationLevel")} value={alert.status === "escalated" ? "L2" : "L1"} />
          <DetailRow label={tt("alertRule")} value={alert.ruleName} />
          <DetailRow label={tt("alertCreatedBy")} value="System" />
        </TabsContent>

        <TabsContent value="timeline" className="px-6 py-4">
          <TimelineItem time={alert.startTime} title={tt("alertTimelineTriggered")} user="System" />
          {alert.status === "escalated" && <TimelineItem time={alert.startTime} title={tt("alertTimelineEscalated")} user="System" />}
          {alert.assignedTo && <TimelineItem time={alert.startTime} title={tt("alertTimelineAssigned")} user={alert.assignedTo} />}
          {alert.acknowledgedAt && <TimelineItem time={alert.acknowledgedAt} title={tt("alertTimelineAcknowledged")} user={alert.acknowledgedBy || ""} />}
          {alert.resolvedAt && <TimelineItem time={alert.resolvedAt} title={tt("alertTimelineClosed")} user={alert.resolvedBy || ""} />}
        </TabsContent>
      </Tabs>

      <div className="border-t p-4 space-y-2 bg-background">
        {alert.status === "active" && (
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={onAck} disabled={busy}>
            {tt("alertAcknowledgeAlarm")}
          </Button>
        )}
        {alert.status !== "resolved" && (
          <Button variant="outline" className="w-full" onClick={onClear} disabled={busy}>
            {tt("clearAlarm")}
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">{tt("alertAssign")}</Button>
          <Button variant="outline" size="sm">{tt("alertArchive")}</Button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button variant="outline" size="sm">{tt("alertCreateWorkOrder")}</Button>
          <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
    <div className="text-muted-foreground">{label}</div>
    <div className="text-foreground">{value}</div>
  </div>
);

const TimelineItem = ({ time, title, user }: { time: string; title: string; user: string }) => (
  <div className="flex gap-3 pb-4 relative">
    <div className="relative">
      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
      <div className="absolute top-4 start-1 bottom-0 w-px bg-border" />
    </div>
    <div className="flex-1 -mt-0.5">
      <div className="font-medium text-sm text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground"><span dir="ltr">{new Date(time).toLocaleString()}</span> {user && `· ${user}`}</div>
    </div>
  </div>
);
