import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "@paapeli/brand/session";
import {
  useListWorkspaceMembersQuery,
  type WorkOrderApiSort,
  type WorkOrderApiSource,
  type WorkOrderApiWorkType,
  type WorkOrderListFilter,
} from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { ListPageSkeleton } from "@/features/factory/components/panel/ListPageSkeleton";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Label } from "@/features/factory/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/factory/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  ListToolbar,
  type ActionItem,
  type FilterField,
  type SortOption,
} from "@/features/factory/components/panel/ListToolbar";
import {
  Plus,
  ClipboardList,
  Eye,
  MoreHorizontal,
  Trash2,
  Download,
  Play,
  Pause,
  CheckCircle2,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Flag,
  RefreshCw,
  Clock,
  UserX,
  User,
  Repeat,
  ListChecks,
} from "lucide-react";
import {
  PRIORITY_TO_API,
  STATUS_TO_API,
  isInHand,
  isOverdue,
  useWorkOrderActions,
  useWorkOrderPage,
  useWorkOrderSummary,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/features/factory/hooks/useWorkOrders";
import {
  PRIORITIES,
  PRIORITY_BADGE,
  SOURCES,
  STATUSES,
  STATUS_DOT,
  SearchSelect,
  StatusNoteDialog,
  StatusPill,
  TEAMS,
  WORK_TYPES,
  useWorkOrderLabels,
  type ExplainedStatus,
} from "@/features/factory/components/workOrders/shared";
import { TemplatesDialog } from "@/features/factory/components/workOrders/tasks";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { formatDateTime } from "@/shared/lib/formatDate";
import { apiErrorMessage } from "@/shared/lib/apiError";

/** The KPI cards double as quick filters, as they do on the device list. */
type Quick = "all" | "inHand" | "mine" | "unassigned" | "overdue";

const IN_HAND: WorkOrderStatus[] = ["Open", "In Progress", "On Hold"];
const COLUMNS = 9;

const ExpandField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border bg-background px-4 py-3 text-center">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-sm font-medium truncate">{value}</div>
  </div>
);

const hasPersianText = (value: string) => /[؀-ۿ]/.test(value);
const persianTextClass = (value: string) => (hasPersianText(value) ? "font-vazirmatn" : "");

const WorkOrders = () => {
  const { language, formatNumber, t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const labels = useWorkOrderLabels();
  const lp = (p: string) => localizedPath(p, language);
  const me = useMemo(() => getCurrentUserId() ?? "", []);
  const workspaceId = useWorkspaceId() ?? "";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quick, setQuick] = useState<Quick>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<WorkOrderApiSort>("NEWEST");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"status" | "assign" | "priority" | null>(null);
  const [noteFor, setNoteFor] = useState<{ wo: WorkOrder; target: ExplainedStatus } | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // The list is searched on the server, so wait for a pause in the typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filter = useMemo<WorkOrderListFilter>(() => {
    const out: WorkOrderListFilter = { sort: sortKey };
    if (debouncedSearch) out.search = debouncedSearch;
    if (statusFilter !== "all") out.status = STATUS_TO_API[statusFilter as WorkOrderStatus];
    else if (quick === "inHand" || quick === "mine" || quick === "unassigned") out.status = IN_HAND.map((s) => STATUS_TO_API[s]);
    if (priorityFilter !== "all") out.priority = PRIORITY_TO_API[priorityFilter as WorkOrderPriority];
    if (sourceFilter !== "all") out.source = sourceFilter as WorkOrderApiSource;
    if (typeFilter !== "all") out.workType = typeFilter as WorkOrderApiWorkType;
    if (teamFilter !== "all") out.assignedTeam = teamFilter;
    if (quick === "mine" && me) out.assigneeUserId = me;
    else if (quick === "unassigned") out.unassigned = true;
    else if (assigneeFilter !== "all") out.assigneeUserId = assigneeFilter;
    if (quick === "overdue") out.overdue = true;
    return out;
  }, [debouncedSearch, statusFilter, priorityFilter, sourceFilter, typeFilter, teamFilter, assigneeFilter, quick, sortKey, me]);

  // Anything that changes what the list holds goes back to its first page.
  useEffect(() => { setPage(1); }, [filter, perPage]);

  const isBoard = listView === "board";
  const { items, total, totalPages, isLoading, isFetching, isError, refetch } = useWorkOrderPage(filter, page, perPage, !isBoard);
  const summary = useWorkOrderSummary();
  const actions = useWorkOrderActions();
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);
  const activeMembers = useMemo(
    () => (members.data?.data ?? []).filter((m) => m.status === "ACTIVE"),
    [members.data],
  );
  const memberOptions = useMemo(
    () => activeMembers.map((m) => ({
      value: m.userId,
      label: m.displayName?.trim() || m.email || m.userId,
      hint: m.displayName?.trim() ? m.email ?? undefined : undefined,
    })),
    [activeMembers],
  );

  const counts = summary.data;
  const inHandCount = counts ? counts.open + counts.inProgress + counts.onHold : null;
  const everything = counts ? counts.open + counts.inProgress + counts.onHold + counts.done + counts.cancelled : null;
  const activeFilterCount = [statusFilter, priorityFilter, sourceFilter, assigneeFilter, teamFilter, typeFilter].filter((v) => v !== "all").length;
  const narrowed = activeFilterCount > 0 || quick !== "all" || !!debouncedSearch;
  /* "Nobody has made one yet" and "none match" are different empty states;
     the first needs the unfiltered count, which the summary has. */
  const nothingAtAll = !narrowed ? total === 0 : everything === 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSourceFilter("all");
    setAssigneeFilter("all");
    setTeamFilter("all");
    setTypeFilter("all");
  };

  const fail = (error: unknown) =>
    toast({ title: t("error"), description: apiErrorMessage(error, t("error")), variant: "destructive" });

  const move = async (wo: WorkOrder, status: WorkOrderStatus, title: string, note = "") => {
    try {
      await actions.update(wo.id, { status, holdReason: status === "On Hold" ? note : "" });
      // Why it was cancelled, or what was done, belongs in the order's history.
      if (note && status !== "On Hold") await actions.addNote(wo.id, note);
      toast({ title, description: wo.action });
    } catch (error) {
      fail(error);
    }
  };

  const runBulk = async (request: Omit<Parameters<typeof actions.bulk>[0], "ids">) => {
    try {
      const result = await actions.bulk({ ids: selected, ...request });
      toast({
        title: request.delete ? t("deleted") : t("success"),
        description: [
          (request.delete ? t("workOrdersRemoved") : t("woBulkApplied")).replace("{n}", formatNumber(result.succeeded.length)),
          result.failed.length ? t("woBulkFailed").replace("{n}", formatNumber(result.failed.length)) : "",
        ].filter(Boolean).join(" · "),
        variant: result.failed.length && !result.succeeded.length ? "destructive" : undefined,
      });
      // What failed stays selected, so it can be looked at or tried again.
      setSelected(result.failed);
    } catch (error) {
      fail(error);
    }
  };

  const handleExport = () => {
    const header = ["id", "action", "asset", "location", "priority", "status", "assignee", "assignedTeam", "dueAt", "createdAt"];
    const csv = [
      header.join(","),
      ...items.map((r) => header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "status", label: t("status"), value: statusFilter, onChange: setStatusFilter,
      options: [{ value: "all", label: t("all") }, ...STATUSES.map((s) => ({ value: s, label: labels.status(s) }))],
    },
    {
      key: "priority", label: t("priorityLabel"), value: priorityFilter, onChange: setPriorityFilter,
      options: [{ value: "all", label: t("all") }, ...PRIORITIES.map((p) => ({ value: p, label: labels.priority(p) }))],
    },
    {
      key: "assignee", label: t("woAssignee"), value: assigneeFilter, onChange: setAssigneeFilter,
      options: [{ value: "all", label: t("all") }, ...memberOptions.map((m) => ({ value: m.value, label: m.label }))],
    },
    {
      key: "team", label: t("teamLabel"), value: teamFilter, onChange: setTeamFilter,
      options: [{ value: "all", label: t("all") }, ...TEAMS.map((team) => ({ value: team, label: labels.team(team) }))],
    },
    {
      key: "source", label: t("woSource"), value: sourceFilter, onChange: setSourceFilter,
      options: [{ value: "all", label: t("all") }, ...SOURCES.map((s) => ({ value: s, label: labels.source(s) }))],
    },
    {
      key: "workType", label: t("woWorkType"), value: typeFilter, onChange: setTypeFilter,
      options: [{ value: "all", label: t("all") }, ...WORK_TYPES.map((w) => ({ value: w, label: labels.workType(w) }))],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "NEWEST", label: t("sortMostRecent") },
    { key: "OLDEST", label: t("woSortOldest") },
    { key: "PRIORITY", label: t("sortHighestPriority") },
    { key: "DUE", label: t("woSortDue") },
  ];

  const actionItems: ActionItem[] = [
    { key: "status", label: t("woBulkStatus"), icon: RefreshCw, onSelect: () => setBulkMode("status") },
    { key: "assign", label: t("woBulkAssign"), icon: UserPlus, onSelect: () => setBulkMode("assign") },
    { key: "priority", label: t("woBulkPriority"), icon: Flag, onSelect: () => setBulkMode("priority") },
    { key: "export", label: t("export"), icon: Download, onSelect: handleExport },
    { key: "delete", label: t("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteOpen(true) },
  ];

  const pageIds = items.map((w) => w.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => (checked ? Array.from(new Set([...prev, ...pageIds])) : prev.filter((id) => !pageIds.includes(id))));
  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const kpis: { key: Quick; label: string; value: number | null; icon: typeof Clock; accent: string; bg: string }[] = [
    { key: "inHand", label: t("woKpiInHand"), value: inHandCount, icon: ClipboardList, accent: "text-primary", bg: "from-primary/10 to-transparent" },
    { key: "mine", label: t("woKpiMine"), value: counts?.mine ?? null, icon: User, accent: "text-sky-500", bg: "from-sky-50 to-transparent dark:from-sky-500/10" },
    { key: "unassigned", label: t("woUnassigned"), value: counts?.unassigned ?? null, icon: UserX, accent: "text-amber-500", bg: "from-amber-50 to-transparent dark:from-amber-500/10" },
    { key: "overdue", label: t("woOverdue"), value: counts?.overdue ?? null, icon: Clock, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
  ];

  if (isLoading && !isBoard) return <ListPageSkeleton rows={9} columns={8} toolbarButtons={3} showPrimaryCta />;
  if (isError && !isBoard) return <LoadFailed onRetry={() => { void refetch(); }} />;

  const startIndex = (page - 1) * perPage;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("workOrders")}
        count={everything}
        countLabel={t("workOrdersCountLabel")}
        actions={
          <>
            <Button variant="outline" className="h-10 gap-2 rounded-md" onClick={() => setTemplatesOpen(true)}>
              <ListChecks className="h-4 w-4" /> {t("woTemplates")}
            </Button>
            <Button
              onClick={() => navigate(lp("/work-orders/new"))}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md"
            >
              <Plus className="h-4 w-4" /> {t("newWorkOrder")}
            </Button>
          </>
        }
      />

      <KpiSection storageKey="workOrders" className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon;
            const isActive = quick === k.key;
            return (
              <button
                key={k.key}
                onClick={() => setQuick(isActive ? "all" : k.key)}
                className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} ${isActive ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground leading-none">
                    {k.value === null ? "…" : formatNumber(k.value)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{t("workOrdersCountLabel")}</span>
                </div>
              </button>
            );
          })}
        </div>
        {counts && counts.createdLast30 + counts.doneLast30 > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t("woLast30")}</span>
            <span>{t("woCreated30")}: <b className="text-foreground">{formatNumber(counts.createdLast30)}</b></span>
            <span>{t("woDone30")}: <b className="text-foreground">{formatNumber(counts.doneLast30)}</b></span>
            {counts.doneOnTimeLast30 + counts.doneLateLast30 > 0 && (
              <>
                <span>{t("woOnTime")}: <b className="text-emerald-600">{formatNumber(counts.doneOnTimeLast30)}</b></span>
                <span>{t("woLate")}: <b className="text-red-600">{formatNumber(counts.doneLateLast30)}</b></span>
              </>
            )}
            {counts.averageHoursToDone != null && (
              <span>
                {t("woAvgHours")}:{" "}
                <b className="text-foreground">
                  {t("woHoursShort").replace("{n}", formatNumber(Math.round(counts.averageHoursToDone * 10) / 10))}
                </b>
              </span>
            )}
          </div>
        )}
      </KpiSection>

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: t("searchWorkOrders") }}
            view={{ value: listView, onChange: setListView, available: ["table", "board"] }}
            onRefresh={() => { void refetch(); void summary.refetch(); }}
            isRefreshing={isFetching}
            filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: clearFilters }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as WorkOrderApiSort) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          {isBoard ? (
            <BoardView
              filter={filter}
              onOpen={(id) => navigate(lp(`/work-orders/${id}`))}
              onMove={(wo, status) => {
                if (status === "On Hold" || status === "Cancelled") setNoteFor({ wo, target: status });
                else void move(wo, status, status === "Done" ? t("completedToast") : status === "Open" ? t("reopenedToast") : t("startedToast"));
              }}
            />
          ) : (
            <>
              {/* The columns stay on screen when the list is empty: the empty
                  state goes in the body, not in place of the table. */}
              <div className="rounded-lg border overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[44px] text-center">
                        <div className="flex justify-center">
                          <Checkbox checked={allOnPage} onCheckedChange={(c) => toggleAll(!!c)} />
                        </div>
                      </TableHead>
                      <TableHead className="w-[36px]"></TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("priorityLabel")}</TableHead>
                      <TableHead>{t("woEquipment")}</TableHead>
                      <TableHead>{t("woAssignee")}</TableHead>
                      <TableHead>{t("woDue")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNS}>
                          {nothingAtAll ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-16">
                              <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                              <div className="text-center">
                                <p className="font-medium">{t("noWorkOrdersYet")}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t("noWorkOrdersDesc")}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => navigate(lp("/work-orders/new"))}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                  <Plus className="h-4 w-4 me-2" /> {t("newWorkOrder")}
                                </Button>
                                <Button variant="outline" onClick={() => navigate(lp("/aiot/detect-anomalies"))}>
                                  {t("detectAnomalies")}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="py-12 text-center text-muted-foreground">{t("noWorkOrdersMatch")}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : items.map((w) => {
                      const isExpanded = expanded.includes(w.id);
                      const late = isOverdue(w);
                      return (
                        <Fragment key={w.id}>
                          <TableRow className="cursor-pointer hover:bg-muted/30 border-b" onClick={() => toggleExpand(w.id)}>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <Checkbox checked={selected.includes(w.id)} onCheckedChange={(c) => toggleOne(w.id, !!c)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 font-medium min-w-0">
                                <span className="h-7 w-7 shrink-0 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                                  <ClipboardList className="h-4 w-4" />
                                </span>
                                <span className={`text-sm truncate max-w-[280px] ${persianTextClass(w.action)}`}>{w.action}</span>
                                {!!w.repeatCount && (
                                  <span
                                    className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                    title={t("woRepeats").replace("{n}", formatNumber(w.repeatCount))}
                                  >
                                    <Repeat className="h-3 w-3" />
                                    {formatNumber(w.repeatCount)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell><StatusPill status={w.status} /></TableCell>
                            <TableCell>
                              <Badge className={`${PRIORITY_BADGE[w.priority]} text-[10px]`}>{labels.priority(w.priority)}</Badge>
                            </TableCell>
                            <TableCell className={`text-sm ${persianTextClass(w.asset)}`}>{w.asset || "—"}</TableCell>
                            <TableCell className="text-sm">
                              {w.assignee || <span className="text-muted-foreground">{t("woUnassigned")}</span>}
                            </TableCell>
                            <TableCell className={`text-sm whitespace-nowrap ${late ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                              {w.dueAt ? formatDateTime(w.dueAt, language) : "—"}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate(lp(`/work-orders/${w.id}`))}>
                                  <Eye className="h-3.5 w-3.5" /> {t("view")}
                                </Button>
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-background z-[100] w-48">
                                    <DropdownMenuItem onClick={() => navigate(lp(`/work-orders/${w.id}/edit`))}>
                                      <Pencil className="h-4 w-4 me-2" />{t("edit")}
                                    </DropdownMenuItem>
                                    {(w.status === "Open" || w.status === "On Hold") && (
                                      <DropdownMenuItem onClick={() => move(w, "In Progress", t("startedToast"))}>
                                        <Play className="h-4 w-4 me-2" />{w.status === "On Hold" ? t("woResumeAction") : t("startAction")}
                                      </DropdownMenuItem>
                                    )}
                                    {(w.status === "Open" || w.status === "In Progress") && (
                                      <DropdownMenuItem onClick={() => setNoteFor({ wo: w, target: "On Hold" })}>
                                        <Pause className="h-4 w-4 me-2" />{t("woHoldAction")}
                                      </DropdownMenuItem>
                                    )}
                                    {isInHand(w.status) && (
                                      <DropdownMenuItem onClick={() => setNoteFor({ wo: w, target: "Done" })}>
                                        <CheckCircle2 className="h-4 w-4 me-2" />{t("markDone")}
                                      </DropdownMenuItem>
                                    )}
                                    {isInHand(w.status) ? (
                                      <DropdownMenuItem onClick={() => setNoteFor({ wo: w, target: "Cancelled" })}>
                                        <X className="h-4 w-4 me-2" />{t("cancel")}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => move(w, "Open", t("reopenedToast"))}>
                                        <Play className="h-4 w-4 me-2" />{t("reopenAction")}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => { setSelected([w.id]); setDeleteOpen(true); }}
                                    >
                                      <Trash2 className="h-4 w-4 me-2" />{t("delete")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={COLUMNS} className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <ExpandField label={t("location")} value={w.location ? <LocationCell path={w.location} /> : "—"} />
                                  <ExpandField label={t("teamLabel")} value={w.assignedTeam ? labels.team(w.assignedTeam) : "—"} />
                                  <ExpandField
                                    label={t("woSource")}
                                    value={`${labels.source(w.source)}${w.workType ? ` · ${labels.workType(w.workType)}` : ""}`}
                                  />
                                  <ExpandField label={t("created")} value={formatDateTime(w.createdAt, language)} />
                                </div>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="rounded-lg border bg-background px-4 py-3">
                                    <div className="text-xs text-muted-foreground mb-2">{t("descriptionLabel")}</div>
                                    {w.notes ? (
                                      <div dir="auto" className={`text-sm whitespace-pre-wrap break-words ${persianTextClass(w.notes)}`}>{w.notes}</div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground italic">—</div>
                                    )}
                                  </div>
                                  <div className="rounded-lg border bg-background px-4 py-3">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {w.status === "On Hold" ? t("woHoldReason") : t("workOrderIdLabel")}
                                    </div>
                                    {w.status === "On Hold" ? (
                                      <div dir="auto" className="text-sm whitespace-pre-wrap break-words">{w.holdReason || "—"}</div>
                                    ) : (
                                      <div className="font-mono text-xs break-all" dir="ltr">{w.id}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {total > Math.min(perPage, 10) && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
                    <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                      <SelectTrigger className="w-[72px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ms-3">
                      {formatNumber(startIndex + 1)}-{formatNumber(Math.min(startIndex + perPage, total))} {t("of")} {formatNumber(total)}
                    </span>
                  </div>
                  <SmartPagination currentPage={page} totalPages={Math.max(totalPages, 1)} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("deleteWorkOrders")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {t("deleteWorkOrdersConfirm").replace("{n}", formatNumber(selected.length))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => { setDeleteOpen(false); void runBulk({ delete: true }); }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkDialog
        mode={bulkMode}
        count={selected.length}
        memberOptions={memberOptions}
        onClose={() => setBulkMode(null)}
        onApply={(request) => { setBulkMode(null); void runBulk(request); }}
      />

      <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />

      <StatusNoteDialog
        target={noteFor?.target ?? null}
        onClose={() => setNoteFor(null)}
        onConfirm={(status, note) =>
          noteFor
            ? move(
                noteFor.wo,
                status,
                status === "Done" ? t("completedToast") : status === "Cancelled" ? t("cancelledToast") : t("woOnHoldToast"),
                note,
              )
            : undefined
        }
      />
    </div>
  );
};

/** One choice, applied to every selected order: a status, an assignee or a priority. */
const BulkDialog = ({
  mode,
  count,
  memberOptions,
  onClose,
  onApply,
}: {
  mode: "status" | "assign" | "priority" | null;
  count: number;
  memberOptions: { value: string; label: string; hint?: string }[];
  onClose: () => void;
  onApply: (request: {
    status?: ReturnType<typeof toApiStatus>;
    priority?: (typeof PRIORITY_TO_API)[WorkOrderPriority];
    assigneeUserId?: string;
    unassign?: boolean;
  }) => void;
}) => {
  const { t, isRTL, formatNumber } = useLanguage();
  const labels = useWorkOrderLabels();
  const [status, setStatus] = useState<WorkOrderStatus>("In Progress");
  const [priority, setPriority] = useState<WorkOrderPriority>("High");
  const [assignee, setAssignee] = useState("");

  useEffect(() => { if (mode) setAssignee(""); }, [mode]);

  const title = mode === "status" ? t("woBulkStatus") : mode === "assign" ? t("woBulkAssign") : t("woBulkPriority");
  const apply = () => {
    if (mode === "status") onApply({ status: toApiStatus(status) });
    else if (mode === "priority") onApply({ priority: PRIORITY_TO_API[priority] });
    else onApply(assignee ? { assigneeUserId: assignee } : { unassign: true });
  };

  return (
    <Dialog open={!!mode} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("woBulkDesc").replace("{n}", formatNumber(count))}</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">{title}</Label>
          {mode === "status" && (
            <Select value={status} onValueChange={(v) => setStatus(v as WorkOrderStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{labels.status(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {mode === "priority" && (
            <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{labels.priority(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {mode === "assign" && (
            <SearchSelect
              value={assignee}
              onChange={setAssignee}
              options={memberOptions}
              placeholder={t("woUnassigned")}
              searchPlaceholder={t("woSearchMember")}
              emptyLabel={t("woNothingFound")}
              noneLabel={t("woUnassigned")}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={apply}>{t("woApply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const toApiStatus = (status: WorkOrderStatus) => STATUS_TO_API[status];

/* Finished and cancelled orders pile up for ever, so the board keeps to the
   work still in hand plus what was finished; cancelled ones are a filter away
   in the table. */
const BOARD_COLUMNS: WorkOrderStatus[] = ["Open", "In Progress", "On Hold", "Done"];
const BOARD_BATCH = 20;

interface BoardProps {
  filter: WorkOrderListFilter;
  onOpen: (id: string) => void;
  onMove: (wo: WorkOrder, status: WorkOrderStatus) => void;
}

const BoardView = ({ filter, onOpen, onMove }: BoardProps) => {
  const [dragged, setDragged] = useState<WorkOrder | null>(null);
  const [over, setOver] = useState<WorkOrderStatus | null>(null);
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {BOARD_COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            filter={filter}
            dragged={dragged}
            isOver={over === status}
            setDragged={setDragged}
            setOver={setOver}
            onOpen={onOpen}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
};

/** One status of the board, read from the server a batch at a time. */
const BoardColumn = ({
  status,
  filter,
  dragged,
  isOver,
  setDragged,
  setOver,
  onOpen,
  onMove,
}: BoardProps & {
  status: WorkOrderStatus;
  dragged: WorkOrder | null;
  isOver: boolean;
  setDragged: (wo: WorkOrder | null) => void;
  setOver: (status: WorkOrderStatus | null) => void;
}) => {
  const { t, formatNumber, language } = useLanguage();
  const labels = useWorkOrderLabels();
  const [size, setSize] = useState(BOARD_BATCH);
  const columnFilter = useMemo(() => ({ ...filter, status: STATUS_TO_API[status] }), [filter, status]);
  const { items, total } = useWorkOrderPage(columnFilter, 1, size);

  return (
    <div
      className={`w-72 shrink-0 rounded-lg border bg-muted/30 flex flex-col ${isOver ? "ring-2 ring-primary" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!isOver) setOver(status); }}
      onDragLeave={() => { if (isOver) setOver(null); }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(null);
        if (dragged && dragged.status !== status) onMove(dragged, status);
        setDragged(null);
      }}
    >
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-sm font-semibold">{labels.status(status)}</span>
        <span className="text-xs text-muted-foreground ms-auto">{formatNumber(total)}</span>
      </div>
      <div className="p-2 flex flex-col gap-2 min-h-[200px] max-h-[70vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-[11px] text-muted-foreground/70 text-center py-6 px-2 border border-dashed rounded-md">
            {t("boardEmptyColumn")}
          </div>
        ) : (
          <>
            {items.map((w) => (
              <div
                key={w.id}
                draggable
                onDragStart={(e) => { setDragged(w); e.dataTransfer.effectAllowed = "move"; }}
                onDragEnd={() => { setDragged(null); setOver(null); }}
                onClick={() => onOpen(w.id)}
                className={`bg-card rounded-md border p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm transition ${dragged?.id === w.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium leading-snug line-clamp-2">{w.action}</div>
                  <Badge className={`${PRIORITY_BADGE[w.priority]} text-[10px] shrink-0`}>{labels.priority(w.priority)}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 truncate">{w.asset}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                  <span className="truncate">{w.assignee || t("woUnassigned")}</span>
                  {w.dueAt && (
                    <span className={`shrink-0 ms-2 ${isOverdue(w) ? "text-red-600 font-medium" : ""}`}>
                      {formatDateTime(w.dueAt, language)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {items.length < total && size < 100 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSize((s) => Math.min(s + BOARD_BATCH, 100))}>
                {t("woLoadMore")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkOrders;
