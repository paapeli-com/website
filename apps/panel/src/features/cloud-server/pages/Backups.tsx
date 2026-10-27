import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { BACKUP_GB_MONTHLY } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import {
  BACKUP_BUSY_MS,
  BACKUP_CAPACITY,
  backupNow,
  backupStatus,
  deleteBackups,
  deletePoint,
  nextBackupAt,
  renameBackup,
  restoreFrom,
  setPaused,
  useBackups,
  type BackupPoint,
  type BackupRecord,
  type BackupStatus,
} from "../lib/backupStore";
import { BACKUPS_PATH, ConfirmDialog, CREATE_BACKUP_PATH, PageBreadcrumb, ProgressStatus, SERVERS_PATH, TruncatedText } from "../ui";

/* Backup: one row per backed-up server, its saved backups inside the row.
 *
 * The server list's standard: breadcrumb, header with count, the shared
 * toolbar with multi-select bulk actions, fixed columns with hover tooltips,
 * pagination, the empty state in place of the rows. No KPI cards: the rows
 * already say what there is.
 *
 * Out in the row: a backup now. In the menu: pause or resume the automatic
 * ones, rename, delete. Opened, a row lists its backups, each restorable or
 * deletable. Anything that replaces or deletes data asks first and says what
 * is lost; a backup now with the capacity full says which one it replaces.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "last";

export default function Backups() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const { currency, format } = useBillingCurrency();
  const backups = useBackups();
  const servers = useServers();
  const serverName = (id: string) => servers.find((s) => s.id === id)?.name ?? "-";

  const [now, setNow] = useState(Date.now());
  const anyBusy = backups.some((b) => ["running", "restoring"].includes(backupStatus(b, now)));
  useEffect(() => {
    if (!anyBusy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyBusy]);
  /* A store change (a backup just started) shows at once, not on the next tick. */
  useEffect(() => setNow(Date.now()), [backups]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BackupStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [renaming, setRenaming] = useState<BackupRecord | null>(null);
  const [backingUp, setBackingUp] = useState<BackupRecord | null>(null);
  const [restoring, setRestoring] = useState<{ backup: BackupRecord; point: BackupPoint } | null>(null);
  const [removingPoint, setRemovingPoint] = useState<{ backup: BackupRecord; point: BackupPoint } | null>(null);

  const statusLabel: Record<BackupStatus, string> = {
    active: t("Active"),
    paused: t("Paused"),
    running: t("Backing up"),
    restoring: t("Restoring"),
  };
  const lastOf = (b: BackupRecord) => Math.max(0, ...b.points.map((p) => p.createdAt));
  const date = (ms: number) => formatDateTime(ms, language);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return backups
      .filter(
        (b) =>
          (!q || b.name.toLowerCase().includes(q) || serverName(b.serverId).toLowerCase().includes(q)) &&
          (statusFilter === "all" || backupStatus(b, now) === statusFilter),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "last":
            return lastOf(b) - lastOf(a);
          default:
            return b.createdAt - a.createdAt;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backups, servers, search, statusFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((b) => selected.includes(b.id));

  const exportCsv = () => {
    const header = ["name", "server", "status", "region", "zone", "backups", "capacity", "lastBackup"];
    const rows = filtered.map((b) => [
      b.name,
      serverName(b.serverId),
      backupStatus(b, now),
      b.region,
      b.zone,
      b.points.length,
      BACKUP_CAPACITY,
      b.points.length ? new Date(lastOf(b)).toISOString() : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `backups-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | BackupStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...(["active", "paused", "running", "restoring"] as const).map((s) => ({ value: s, label: statusLabel[s] })),
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "created", label: t("Newest first") },
    { key: "last", label: t("Latest backup first") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => navigate(CREATE_BACKUP_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Enable backup")}
    </Button>
  );

  const toDelete = backups.filter((b) => deleteIds?.includes(b.id));
  const savedToDelete = toDelete.reduce((sum, b) => sum + b.points.length, 0);

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Storage"), path: BACKUPS_PATH }, { label: shellT("Backup") }]} />
      <PageHeader title={shellT("Backup")} count={backups.length} countLabel={t("servers")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by backup or server name"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: statusFilter !== "all" ? 1 : 0,
              onClear: () => {
                setStatusFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[1100px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col />
                <col className="w-[11.8%]" />
                <col className="w-[9.4%]" />
                <col className="w-[9.4%]" />
                <col className="w-[11.8%]" />
                <col className="w-[11.8%]" />
                <col className="w-[8.6%]" />
                <col className="w-[110px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-center">
                    <div className="flex w-5 justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pageRows.map((b) => b.id)]))
                              : selected.filter((id) => !pageRows.some((b) => b.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Server")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Capacity")}</TableHead>
                  <TableHead>{t("Latest backup")}</TableHead>
                  <TableHead>{t("Next automatic backup")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <ArchiveRestore className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No backups yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Back up a server's main disk every week, and restore it from any backup if something goes wrong.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <p className="py-12 text-center text-muted-foreground">{t("No backups match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((b) => {
                    const status = backupStatus(b, now);
                    const busy = status === "running" || status === "restoring";
                    const used = b.points.length;
                    const next = nextBackupAt(b);
                    const isExpanded = expanded.includes(b.id);
                    const points = [...b.points].sort((x, y) => y.createdAt - x.createdAt);
                    const storedGb = b.points.reduce((sum, p) => sum + p.sizeGb, 0);
                    const toggle = () => setExpanded((prev) => (prev.includes(b.id) ? prev.filter((k) => k !== b.id) : [...prev, b.id]));
                    return (
                      <Fragment key={b.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex w-5 justify-center">
                              <Checkbox
                                checked={selected.includes(b.id)}
                                onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, b.id] : prev.filter((id) => id !== b.id)))}
                                aria-label={b.name}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <ArchiveRestore className="h-4 w-4" />
                              </span>
                              <TruncatedText text={b.name} ltr className="font-medium text-foreground" />
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => navigate(SERVERS_PATH)}
                              className="block max-w-full text-start text-foreground hover:text-primary"
                            >
                              <TruncatedText text={serverName(b.serverId)} ltr />
                            </button>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={status} label={statusLabel[status]} backup={b} now={now} />
                          </TableCell>
                          <TableCell>
                            <div className="text-xs tabular-nums text-foreground">
                              {formatNumber(used)} / {formatNumber(BACKUP_CAPACITY)}
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${(used / BACKUP_CAPACITY) * 100}%` }} />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {used ? <TruncatedText text={date(lastOf(b))} /> : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {next ? <TruncatedText text={date(next)} /> : <span>{t("Paused")}</span>}
                          </TableCell>
                          <TableCell>
                            <TruncatedText text={`${t(b.region)} / ${b.zone}`} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={busy}
                                aria-label={t("Back up now")}
                                title={t("Back up now")}
                                onClick={() => setBackingUp(b)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-56 bg-background">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPaused(b.id, !b.paused);
                                      toast.success(b.paused ? t("Automatic backups resumed") : t("Automatic backups paused"));
                                    }}
                                  >
                                    {b.paused ? <Play className="me-2 h-4 w-4" /> : <Pause className="me-2 h-4 w-4" />}
                                    {b.paused ? t("Resume automatic backups") : t("Pause automatic backups")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setRenaming(b)}>
                                    <Pencil className="me-2 h-4 w-4" />
                                    {fx("rename")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={busy}
                                    onClick={() => setDeleteIds([b.id])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {fx("delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* The saved backups, newest first, each restorable. */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={10} className="p-4">
                              <div className="overflow-hidden rounded-lg border bg-background">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                                  <span>
                                    {t("Main disk")}: <span className="font-medium text-foreground">{formatNumber(b.diskGb)} {t("GB")}</span>
                                  </span>
                                  <span>
                                    {t("Kept")}: <span className="font-medium text-foreground">{formatNumber(storedGb)} {t("GB")}</span>
                                  </span>
                                  <span>
                                    {t("Monthly cost")}:{" "}
                                    <span className="font-medium text-foreground">{format(storedGb * BACKUP_GB_MONTHLY[currency])}</span>
                                  </span>
                                </div>
                                {points.length === 0 ? (
                                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    {b.paused
                                      ? t("No backups yet. Automatic backups are paused; back up now to make one.")
                                      : t("No backups yet. The first automatic one is made by {date}.", { date: date(nextBackupAt(b)!) })}
                                  </p>
                                ) : (
                                  /* The row's own table: each value under its own
                                     heading, not under the outer table's columns. */
                                  <Table className="table-fixed">
                                    <colgroup>
                                      <col className="w-[56px]" />
                                      <col className="w-[30%]" />
                                      <col className="w-[16%]" />
                                      <col className="w-[14%]" />
                                      <col className="w-[18%]" />
                                      <col />
                                    </colgroup>
                                    <TableHeader>
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-center">#</TableHead>
                                        <TableHead>{t("Backup date")}</TableHead>
                                        <TableHead>{t("Type")}</TableHead>
                                        <TableHead>{t("Size")}</TableHead>
                                        <TableHead>{fx("status")}</TableHead>
                                        <TableHead className="text-end">{fx("actions")}</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {points.map((p, i) => {
                                        const making = now - p.createdAt < BACKUP_BUSY_MS;
                                        return (
                                          <TableRow key={p.id} className="last:border-b-0 hover:bg-muted/30">
                                            <TableCell className="text-center tabular-nums text-muted-foreground">
                                              {formatNumber(i + 1)}
                                            </TableCell>
                                            <TableCell className="text-foreground">
                                              <TruncatedText text={date(p.createdAt)} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                              {p.kind === "auto" ? t("Automatic") : t("By hand")}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                              {formatNumber(p.sizeGb)} {t("GB")}
                                            </TableCell>
                                            <TableCell>
                                              {making ? (
                                                <ProgressStatus label={t("Backing up")} startedAt={p.createdAt} durationMs={BACKUP_BUSY_MS} now={now} />
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                  {t("Ready")}
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center justify-end gap-1">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 gap-1.5"
                                                  disabled={making || busy}
                                                  onClick={() => setRestoring({ backup: b, point: p })}
                                                >
                                                  <RotateCcw className="h-3.5 w-3.5" />
                                                  {t("Restore")}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                                                  disabled={making || busy}
                                                  aria-label={fx("delete")}
                                                  title={fx("delete")}
                                                  onClick={() => setRemovingPoint({ backup: b, point: p })}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > itemsPerPage && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{fx("rowsPerPage")}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ms-3 text-sm text-muted-foreground">
                  {formatNumber(startIndex + 1)}-{formatNumber(Math.min(endIndex, filtered.length))} {fx("of")}{" "}
                  {formatNumber(filtered.length)}
                </span>
              </div>
              <SmartPagination
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onChange={(p) => p >= 1 && p <= totalPages && setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back up now: with the capacity full, says which backup it replaces. */}
      <ConfirmDialog
        open={!!backingUp}
        onClose={() => setBackingUp(null)}
        title={t("Back up {name} now?", { name: backingUp ? serverName(backingUp.serverId) : "" })}
        description={
          backingUp && backingUp.points.length >= BACKUP_CAPACITY
            ? t("The capacity is full, so this backup takes the place of the oldest one, from {date}.", {
                date: date(Math.min(...backingUp.points.map((p) => p.createdAt))),
              })
            : t("The server's main disk is backed up now. The server keeps running.")
        }
        confirmLabel={t("Back up now")}
        onConfirm={() => {
          if (!backingUp) return;
          backupNow(backingUp.id);
          setExpanded((prev) => (prev.includes(backingUp.id) ? prev : [...prev, backingUp.id]));
          toast.success(t("Backing up {name}", { name: serverName(backingUp.serverId) }));
          setBackingUp(null);
        }}
      />

      {/* Restore: replaces the main disk, so it is ticked before it is offered. */}
      <ConfirmDialog
        open={!!restoring}
        onClose={() => setRestoring(null)}
        title={t("Restore {name}?", { name: restoring ? serverName(restoring.backup.serverId) : "" })}
        description={t(
          "The server's main disk is replaced with the backup from {date}. Anything saved on it after that is lost, and the server restarts.",
          { date: restoring ? date(restoring.point.createdAt) : "" },
        )}
        acknowledge={t("I confirm that data saved after this backup will be lost.")}
        destructive
        confirmLabel={t("Restore")}
        onConfirm={() => {
          if (!restoring) return;
          restoreFrom(restoring.backup.id);
          toast.success(t("Restoring {name}", { name: serverName(restoring.backup.serverId) }));
          setRestoring(null);
        }}
      />

      <ConfirmDialog
        open={!!removingPoint}
        onClose={() => setRemovingPoint(null)}
        title={t("Delete this backup?")}
        description={t("The backup from {date} is deleted and its place freed. This cannot be undone.", {
          date: removingPoint ? date(removingPoint.point.createdAt) : "",
        })}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={() => {
          if (!removingPoint) return;
          deletePoint(removingPoint.backup.id, removingPoint.point.id);
          toast.success(t("Backup deleted"));
          setRemovingPoint(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} backups?", { n: formatNumber(toDelete.length) })}
        description={t("Backup stops for these servers and {n} saved backups are deleted with it. The servers themselves are not touched. This cannot be undone.", {
          n: formatNumber(savedToDelete),
        })}
        acknowledge={savedToDelete > 0 ? t("I confirm that the saved backups will be deleted.") : undefined}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={() => {
          deleteBackups(deleteIds ?? []);
          setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
          toast.success(t("Backups deleted"));
          setDeleteIds(null);
        }}
      />

      <RenameBackupDialog backup={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}

function StatusBadge({ status, label, backup, now }: { status: BackupStatus; label: string; backup: BackupRecord; now: number }) {
  if (status === "running" || status === "restoring") {
    const startedAt =
      status === "running"
        ? Math.max(...backup.points.map((p) => p.createdAt))
        : (backup.restoringUntil ?? now) - BACKUP_BUSY_MS;
    return (
      <ProgressStatus label={label} startedAt={startedAt} durationMs={BACKUP_BUSY_MS} now={now} tone={status === "running" ? "sky" : "amber"} />
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn("h-2 w-2 rounded-full", status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
      {label}
    </span>
  );
}

function RenameBackupDialog({ backup, onClose }: { backup: BackupRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(backup?.name ?? ""), [backup]);
  const ok = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(name);
  return (
    <Dialog open={!!backup} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename backup")}</DialogTitle>
          <DialogDescription>{t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}</DialogDescription>
        </DialogHeader>
        <Input dir="ltr" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (backup) renameBackup(backup.id, name);
              onClose();
            }}
          >
            {fx("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
