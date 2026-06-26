import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { PageHeader } from "@/components/PageHeader";
import { LocationCell } from "@/components/panel/LocationCell";
import { SmartPagination } from "@/components/SmartPagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListToolbar,
  type ActionItem,
  type FilterField,
  type SortOption,
} from "@/components/panel/ListToolbar";
import {
  Plus,
  ClipboardList,
  Eye,
  MoreHorizontal,
  Trash2,
  Download,
  Play,
  CheckCircle2,
  X,
  Pencil,
} from "lucide-react";
import {
  useWorkOrders,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/hooks/useWorkOrders";

const PRIORITY_BADGE: Record<WorkOrderPriority, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const STATUS_BADGE: Record<WorkOrderStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Cancelled: "bg-muted text-muted-foreground",
};

const WorkOrders = () => {
  const { language, formatNumber, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const { items, update, removeMany } = useWorkOrders();

  const priorityLabel = (p: WorkOrderPriority) =>
    ({
      Critical: t("woPriorityCritical"),
      High: t("woPriorityHigh"),
      Medium: t("woPriorityMedium"),
      Low: t("woPriorityLow"),
    }[p]);

  const statusLabel = (s: WorkOrderStatus) =>
    ({
      Open: t("woStatusOpen"),
      "In Progress": t("woStatusInProgress"),
      Done: t("woStatusDone"),
      Cancelled: t("woStatusCancelled"),
    }[s]);

  const teamLabel = (team: string) =>
    ({
      mechanical: t("teamMechanical"),
      electrical: t("teamElectrical"),
      instrumentation: t("teamInstrumentation"),
      operations: t("teamOperations"),
    }[team] || team);

  const formatRelative = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("justNow");
    if (m < 60) return t("minutesAgoShort").replace("{n}", formatNumber(m));
    const h = Math.floor(m / 60);
    if (h < 24) return t("hoursAgoShort").replace("{n}", formatNumber(h));
    return t("daysAgoShort").replace("{n}", formatNumber(Math.floor(h / 24)));
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortKey, setSortKey] = useState("recent");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<WorkOrderStatus | null>(null);

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const allTeams = useMemo(
    () => Array.from(new Set(items.map((w) => w.assignedTeam))).filter(Boolean),
    [items],
  );

  const filtered = useMemo(() => {
    const rank: Record<WorkOrderPriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const now = Date.now();
    const dayMs = 86400000;
    const dateThreshold =
      dateFilter === "today" ? now - dayMs :
      dateFilter === "week" ? now - 7 * dayMs :
      dateFilter === "month" ? now - 30 * dayMs : 0;
    const list = items
      .filter((w) => {
        const q = search.toLowerCase();
        if (q && !`${w.id} ${w.asset} ${w.action} ${w.location}`.toLowerCase().includes(q)) return false;
        if (statusFilter !== "all" && w.status !== statusFilter) return false;
        if (priorityFilter !== "all" && w.priority !== priorityFilter) return false;
        if (teamFilter !== "all" && w.assignedTeam !== teamFilter) return false;
        if (dateThreshold && new Date(w.createdAt).getTime() < dateThreshold) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "priority":
            return rank[b.priority] - rank[a.priority];
          case "asset":
            return a.asset.localeCompare(b.asset);
          case "status":
            return a.status.localeCompare(b.status);
          case "recent":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
    return list;
  }, [items, search, statusFilter, priorityFilter, teamFilter, dateFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: t("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v);
        setPage(1);
      },
      options: [
        { value: "all", label: t("all") },
        { value: "Open", label: t("woStatusOpen") },
        { value: "In Progress", label: t("woStatusInProgress") },
        { value: "Done", label: t("woStatusDone") },
        { value: "Cancelled", label: t("woStatusCancelled") },
      ],
    },
    {
      key: "priority",
      label: t("priorityLabel"),
      value: priorityFilter,
      onChange: (v) => {
        setPriorityFilter(v);
        setPage(1);
      },
      options: [
        { value: "all", label: t("all") },
        { value: "Critical", label: t("woPriorityCritical") },
        { value: "High", label: t("woPriorityHigh") },
        { value: "Medium", label: t("woPriorityMedium") },
        { value: "Low", label: t("woPriorityLow") },
      ],
    },
    {
      key: "team",
      label: t("teamLabel"),
      value: teamFilter,
      onChange: (v) => {
        setTeamFilter(v);
        setPage(1);
      },
      options: [
        { value: "all", label: t("all") },
        ...allTeams.map((tm) => ({ value: tm, label: teamLabel(tm) })),
      ],
    },
    {
      key: "date",
      label: t("dateRange"),
      value: dateFilter,
      onChange: (v) => {
        setDateFilter(v as typeof dateFilter);
        setPage(1);
      },
      options: [
        { value: "all", label: t("dateAll") },
        { value: "today", label: t("dateToday") },
        { value: "week", label: t("dateLastWeek") },
        { value: "month", label: t("dateLastMonth") },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "recent", label: t("sortMostRecent") },
    { key: "priority", label: t("sortHighestPriority") },
    { key: "asset", label: t("sortAssetAZ") },
    { key: "status", label: t("sortStatus") },
  ];

  const handleExport = () => {
    const header = ["id", "asset", "location", "action", "priority", "status", "assignedTeam", "createdAt", "createdBy"];
    const csv = [
      header.join(","),
      ...filtered.map((r) =>
        header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionItems: ActionItem[] = [
    { key: "export", label: t("exportCsv"), icon: Download, onSelect: handleExport },
    {
      key: "delete",
      label: t("delete"),
      icon: Trash2,
      destructive: true,
      disabled: selected.length === 0,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (teamFilter !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? paged.map((w) => w.id) : []);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const confirmDelete = () => {
    removeMany(selected);
    toast({
      title: t("deleted"),
      description: t("workOrdersRemoved").replace("{n}", formatNumber(selected.length)),
    });
    setSelected([]);
    setDeleteOpen(false);
  };

  const advance = (wo: WorkOrder, status: WorkOrderStatus, title: string) => {
    update(wo.id, { status });
    toast({ title, description: `${wo.id} · ${wo.action}` });
  };

  return (
    <PanelLayout>
      <PageHeader
        title={t("workOrders")}
        count={items.length}
        countLabel={t("workOrdersCountLabel")}
        actions={
          <Button
            onClick={() => navigate(lp("/work-orders/new"))}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md"
          >
            <Plus className="h-4 w-4" /> {t("newWorkOrder")}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: t("searchWorkOrders"),
            }}
            view={{ value: listView, onChange: setListView, available: ["table", "board"] }}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: activeFilterCount,
              onClear: () => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setTeamFilter("all");
                setDateFilter("all");
                setPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">{t("noWorkOrdersYet")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("noWorkOrdersDesc")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(lp("/work-orders/new"))}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("newWorkOrder")}
                </Button>
                <Button variant="outline" onClick={() => navigate(lp("/aiot/detect-anomalies"))}>
                  {t("detectAnomalies")}
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noWorkOrdersMatch")}</p>
            </div>
          ) : listView === "board" ? (
            <BoardView
              items={filtered}
              dragId={dragId}
              setDragId={setDragId}
              dragOverCol={dragOverCol}
              setDragOverCol={setDragOverCol}
              onDrop={(id, status) => {
                const wo = filtered.find((x) => x.id === id);
                if (wo && wo.status !== status) {
                  update(id, { status });
                  toast({
                    title:
                      status === "Open"
                        ? t("reopenedToast")
                        : status === "In Progress"
                        ? t("startedToast")
                        : status === "Done"
                        ? t("completedToast")
                        : t("cancelledToast"),
                    description: `${wo.id} · ${wo.action}`,
                  });
                }
              }}
              onOpen={(id) => navigate(lp(`/work-orders/${id}`))}
              priorityLabel={priorityLabel}
              statusLabel={statusLabel}
              teamLabel={teamLabel}
              formatRelative={formatRelative}
              t={t}
            />
          ) : (
            <div className="rounded-lg border overflow-hidden mt-4 text-xs [&_th]:text-xs [&_td]:text-xs [&_th]:h-10 [&_td]:p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paged.length > 0 && selected.length === paged.length}
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>{t("assetLabel")}</TableHead>
                    <TableHead>{t("actionLabel")}</TableHead>
                    <TableHead>{t("location")}</TableHead>
                    <TableHead>{t("priorityLabel")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("teamLabel")}</TableHead>
                    <TableHead>{t("created")}</TableHead>
                    <TableHead className="text-end">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((w) => (
                    <TableRow
                      key={w.id}
                      className="cursor-pointer"
                      onClick={() => navigate(lp(`/work-orders/${w.id}`))}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(w.id)}
                          onCheckedChange={(c) => toggleOne(w.id, !!c)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{w.id}</TableCell>
                      <TableCell className="font-medium">{w.asset}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{w.action}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <LocationCell path={w.location} />
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PRIORITY_BADGE[w.priority]} text-[10px]`}>{priorityLabel(w.priority)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_BADGE[w.status]} text-[10px]`}>{statusLabel(w.status)}</Badge>
                      </TableCell>
                      <TableCell>{teamLabel(w.assignedTeam)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatRelative(w.createdAt)}</TableCell>
                      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => navigate(lp(`/work-orders/${w.id}`))}
                          >
                            <Eye className="h-3.5 w-3.5" /> {t("view")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(lp(`/work-orders/${w.id}`))}>
                                <Eye className="h-4 w-4 me-2" /> {t("view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(lp(`/work-orders/${w.id}/edit`))}>
                                <Pencil className="h-4 w-4 me-2" /> {t("edit")}
                              </DropdownMenuItem>
                              {w.status === "Open" && (
                                <DropdownMenuItem onClick={() => advance(w, "In Progress", t("startedToast"))}>
                                  <Play className="h-4 w-4 me-2" /> {t("startAction")}
                                </DropdownMenuItem>
                              )}
                              {w.status !== "Done" && w.status !== "Cancelled" && (
                                <DropdownMenuItem onClick={() => advance(w, "Done", t("completedToast"))}>
                                  <CheckCircle2 className="h-4 w-4 me-2" /> {t("markDone")}
                                </DropdownMenuItem>
                              )}
                              {w.status !== "Cancelled" && w.status !== "Done" && (
                                <DropdownMenuItem onClick={() => advance(w, "Cancelled", t("cancelledToast"))}>
                                  <X className="h-4 w-4 me-2" /> {t("cancel")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelected([w.id]);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 me-2" /> {t("delete")}
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

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <SmartPagination currentPage={safePage} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteWorkOrders")}</DialogTitle>
            <DialogDescription>
              {t("deleteWorkOrdersConfirm").replace("{n}", formatNumber(selected.length))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelLayout>
  );
};

const BOARD_COLUMNS: { status: WorkOrderStatus; dot: string }[] = [
  { status: "Open", dot: "bg-red-500" },
  { status: "In Progress", dot: "bg-blue-500" },
  { status: "Done", dot: "bg-emerald-500" },
  { status: "Cancelled", dot: "bg-muted-foreground" },
];

interface BoardViewProps {
  items: WorkOrder[];
  dragId: string | null;
  setDragId: (id: string | null) => void;
  dragOverCol: WorkOrderStatus | null;
  setDragOverCol: (s: WorkOrderStatus | null) => void;
  onDrop: (id: string, status: WorkOrderStatus) => void;
  onOpen: (id: string) => void;
  priorityLabel: (p: WorkOrderPriority) => string;
  statusLabel: (s: WorkOrderStatus) => string;
  teamLabel: (t: string) => string;
  formatRelative: (iso: string) => string;
  t: (k: string) => string;
}

const BoardView = ({
  items,
  dragId,
  setDragId,
  dragOverCol,
  setDragOverCol,
  onDrop,
  onOpen,
  priorityLabel,
  statusLabel,
  teamLabel,
  formatRelative,
  t,
}: BoardViewProps) => {
  const BATCH = 20;
  const [visible, setVisible] = useState<Record<WorkOrderStatus, number>>({
    Open: BATCH,
    "In Progress": BATCH,
    Done: BATCH,
    Cancelled: BATCH,
  });
  const onColScroll = (status: WorkOrderStatus, total: number) => (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && visible[status] < total) {
      setVisible((v) => ({ ...v, [status]: Math.min(v[status] + BATCH, total) }));
    }
  };
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {BOARD_COLUMNS.map((col) => {
          const colItems = items.filter((w) => w.status === col.status);
          const shown = Math.min(visible[col.status], colItems.length);
          const visibleItems = colItems.slice(0, shown);
          const hasMore = shown < colItems.length;
          const isOver = dragOverCol === col.status;
          return (
            <div
              key={col.status}
              className={`w-72 shrink-0 rounded-lg border bg-muted/30 flex flex-col ${
                isOver ? "ring-2 ring-primary" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== col.status) setDragOverCol(col.status);
              }}
              onDragLeave={() => {
                if (dragOverCol === col.status) setDragOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                if (dragId) {
                  onDrop(dragId, col.status);
                  setDragId(null);
                }
              }}
            >
              <div className="px-3 py-2 border-b flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold">{statusLabel(col.status)}</span>
                <span className="text-xs text-muted-foreground ms-auto">{colItems.length}</span>
              </div>
              <div
                className="p-2 flex flex-col gap-2 min-h-[200px] max-h-[70vh] overflow-y-auto"
                onScroll={onColScroll(col.status, colItems.length)}
              >
                {colItems.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/70 text-center py-6 px-2 border border-dashed rounded-md">
                    {t("boardEmptyColumn")}
                  </div>
                ) : (
                  <>
                    {visibleItems.map((w) => (
                      <div
                        key={w.id}
                        draggable
                        onDragStart={(e) => {
                          setDragId(w.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => onOpen(w.id)}
                        className={`bg-card rounded-md border p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm transition ${
                          dragId === w.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-medium leading-snug line-clamp-2">{w.action}</div>
                          <Badge className={`${PRIORITY_BADGE[w.priority]} text-[10px] shrink-0`}>
                            {priorityLabel(w.priority)}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 truncate">{w.asset}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{w.location}</div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                          <span className="truncate">{teamLabel(w.assignedTeam)}</span>
                          <span className="shrink-0 ms-2">{formatRelative(w.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="text-[10px] text-muted-foreground/70 text-center py-2">
                        …
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkOrders;
