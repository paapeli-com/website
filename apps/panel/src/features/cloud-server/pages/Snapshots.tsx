import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Download, Loader2, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { useServers } from "../lib/serverStore";
import {
  deleteSnapshots,
  renameSnapshot,
  restoreSnapshot,
  SNAPSHOT_BUSY_MS,
  snapshotStatus,
  useSnapshots,
  type SnapshotRecord,
  type SnapshotStatus,
} from "../lib/snapshotStore";
import { CreateSnapshotDialog } from "../snapshotDialog";
import { ConfirmDialog, PageBreadcrumb, ProgressStatus, SERVERS_PATH, SNAPSHOTS_PATH, TruncatedText } from "../ui";

/* Snapshots: copies of servers' main disks, taken by hand.
 *
 * Backup's standard, one level flatter: a snapshot is a row of its own, with
 * no schedule and no capacity, so nothing to open. No KPI cards. Made in a
 * popup (a server and a name); out in the row, restoring; in the menu, rename
 * and delete. Restoring replaces the server's main disk, so it asks for a
 * tick first, and one server is restored from one snapshot at a time.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "size";

export default function Snapshots() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const snapshots = useSnapshots();
  const servers = useServers();
  const serverName = (id: string) => servers.find((s) => s.id === id)?.name ?? "-";

  const [now, setNow] = useState(Date.now());
  const anyBusy = snapshots.some((s) => snapshotStatus(s, now) !== "ready");
  useEffect(() => {
    if (!anyBusy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyBusy]);
  useEffect(() => setNow(Date.now()), [snapshots]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SnapshotStatus>("all");
  const [serverFilter, setServerFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [restoring, setRestoring] = useState<SnapshotRecord | null>(null);
  const [renaming, setRenaming] = useState<SnapshotRecord | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const statusLabel: Record<SnapshotStatus, string> = { creating: t("Creating"), ready: t("Ready"), restoring: t("Restoring") };
  /* A server being restored, from any of its snapshots, takes no other restore. */
  const serverBusy = (serverId: string) => snapshots.some((s) => s.serverId === serverId && snapshotStatus(s, now) === "restoring");
  const date = (ms: number) => formatDateTime(ms, language);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshots
      .filter(
        (s) =>
          (!q || s.name.toLowerCase().includes(q) || serverName(s.serverId).toLowerCase().includes(q)) &&
          (statusFilter === "all" || snapshotStatus(s, now) === statusFilter) &&
          (serverFilter === "all" || s.serverId === serverFilter),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "size":
            return b.sizeGb - a.sizeGb;
          default:
            return b.createdAt - a.createdAt;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshots, servers, search, statusFilter, serverFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((s) => selected.includes(s.id));

  const exportCsv = () => {
    const header = ["name", "server", "status", "sizeGb", "region", "zone", "created"];
    const rows = filtered.map((s) => [
      s.name,
      serverName(s.serverId),
      snapshotStatus(s, now),
      s.sizeGb,
      s.region,
      s.zone,
      new Date(s.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshots-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const snapshotServers = servers.filter((sv) => snapshots.some((s) => s.serverId === sv.id));
  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | SnapshotStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...(["ready", "creating", "restoring"] as const).map((s) => ({ value: s, label: statusLabel[s] })),
      ],
    },
    {
      key: "server",
      label: t("Server"),
      value: serverFilter,
      onChange: (v) => {
        setServerFilter(v);
        setCurrentPage(1);
      },
      options: [{ value: "all", label: fx("all") }, ...snapshotServers.map((sv) => ({ value: sv.id, label: sv.name }))],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "created", label: t("Newest first") },
    { key: "size", label: t("Largest first") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create snapshot")}
    </Button>
  );

  /* Snapshots in use can't be deleted until they're done. */
  const toDelete = snapshots.filter((s) => deleteIds?.includes(s.id));
  const busyInDelete = toDelete.filter((s) => snapshotStatus(s, now) !== "ready");

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Storage"), path: SNAPSHOTS_PATH }, { label: shellT("Snapshots") }]} />
      <PageHeader title={shellT("Snapshots")} count={snapshots.length} countLabel={t("snapshots")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by snapshot or server name"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [statusFilter, serverFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setStatusFilter("all");
                setServerFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
            <Table className="min-w-[1000px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[22%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[150px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pageRows.map((s) => s.id)]))
                              : selected.filter((id) => !pageRows.some((s) => s.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Server")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Size")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Camera className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No snapshots yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Take a snapshot before a risky change, and restore the server to it if something goes wrong.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <p className="py-12 text-center text-muted-foreground">{t("No snapshots match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((s) => {
                    const status = snapshotStatus(s, now);
                    const serverGone = !servers.some((sv) => sv.id === s.serverId);
                    return (
                      <TableRow key={s.id} className="border-b hover:bg-muted/30">
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={selected.includes(s.id)}
                              onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, s.id] : prev.filter((id) => id !== s.id)))}
                              aria-label={s.name}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Camera className="h-4 w-4" />
                            </span>
                            <TruncatedText text={s.name} ltr className="font-medium text-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => navigate(SERVERS_PATH)}
                            className="block max-w-full text-start text-foreground hover:text-primary"
                          >
                            <TruncatedText text={serverName(s.serverId)} ltr />
                          </button>
                        </TableCell>
                        <TableCell>
                          {status === "ready" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {statusLabel.ready}
                            </span>
                          ) : (
                            <ProgressStatus
                              label={statusLabel[status]}
                              startedAt={status === "creating" ? s.createdAt : (s.restoringUntil ?? now) - SNAPSHOT_BUSY_MS}
                              durationMs={SNAPSHOT_BUSY_MS}
                              now={now}
                              tone={status === "creating" ? "sky" : "amber"}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatNumber(s.sizeGb)} {t("GB")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <TruncatedText text={date(s.createdAt)} />
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={`${t(s.region)} / ${s.zone}`} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5"
                              disabled={status !== "ready" || serverGone || serverBusy(s.serverId)}
                              onClick={() => setRestoring(s)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {t("Restore")}
                            </Button>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
                                <DropdownMenuItem onClick={() => setRenaming(s)}>
                                  <Pencil className="me-2 h-4 w-4" />
                                  {fx("rename")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  disabled={status !== "ready"}
                                  onClick={() => setDeleteIds([s.id])}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {fx("delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
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

      <CreateSnapshotDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={!!restoring}
        onClose={() => setRestoring(null)}
        title={t("Restore {name}?", { name: restoring ? serverName(restoring.serverId) : "" })}
        description={t(
          "The server's main disk is replaced with the snapshot from {date}. Anything saved on it after that is lost, and the server restarts.",
          { date: restoring ? date(restoring.createdAt) : "" },
        )}
        acknowledge={t("I confirm that data saved after this snapshot will be lost.")}
        destructive
        confirmLabel={t("Restore")}
        onConfirm={() => {
          if (!restoring) return;
          restoreSnapshot(restoring.id);
          toast.success(t("Restoring {name}", { name: serverName(restoring.serverId) }));
          setRestoring(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={
          toDelete.length === 1
            ? t("Delete {name}?", { name: toDelete[0].name })
            : t("Delete {n} snapshots?", { n: formatNumber(toDelete.length) })
        }
        description={
          busyInDelete.length > 0
            ? t("These are still being made or restored. Try again once they are ready: {names}", {
                names: busyInDelete.map((s) => s.name).join("، "),
              })
            : t("The snapshots are deleted and their cost stops. The servers themselves are not touched. This cannot be undone.")
        }
        destructive
        confirmLabel={fx("delete")}
        blocked={busyInDelete.length > 0}
        onConfirm={() => {
          deleteSnapshots(deleteIds ?? []);
          setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
          toast.success(t("Snapshots deleted"));
          setDeleteIds(null);
        }}
      />

      <RenameSnapshotDialog snapshot={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}

function RenameSnapshotDialog({ snapshot, onClose }: { snapshot: SnapshotRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(snapshot?.name ?? ""), [snapshot]);
  const ok = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(name);
  return (
    <Dialog open={!!snapshot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename snapshot")}</DialogTitle>
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
              if (snapshot) renameSnapshot(snapshot.id, name);
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
