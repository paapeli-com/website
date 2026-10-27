import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Expand, HardDrive, Link2, Loader2, MoreHorizontal, Pencil, Plus, Trash2, Unlink } from "lucide-react";
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
import { apiCall } from "../lib/openstackErrors";
import { DISK_GROW_SIZES, DISK_TYPES, PRICE_LIST, roundMoney, type DiskTypeId } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import {
  attachVolume,
  deleteVolumes,
  detachVolume,
  extendVolume,
  nextDevicePath,
  renameVolume,
  useVolumes,
  VOLUME_BUSY_MS,
  volumeStatus,
  type VolumeRecord,
  type VolumeStatus,
} from "../lib/volumeStore";
import { ConfirmDialog, CREATE_VOLUME_PATH, PageBreadcrumb, ProgressStatus, SERVERS_PATH, TruncatedText, VOLUMES_PATH } from "../ui";

/* Cloud Disks: every disk the account has, attached or not.
 *
 * The standard list: breadcrumb, header with count, the shared toolbar with
 * multi-select bulk actions, fixed columns with hover tooltips, pagination,
 * the empty state in place of the rows. No KPI cards.
 *
 * Out in the row: attach or detach. In the menu: make larger, rename,
 * delete. A disk is deleted only once detached, and made larger only, never
 * smaller. Detaching and deleting ask first; the delete dialog names any
 * disk still attached instead of deleting it.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "size";

export default function Volumes() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const { currency, format } = useBillingCurrency();
  const volumes = useVolumes();
  const servers = useServers();
  const serverName = (id: string) => servers.find((s) => s.id === id)?.name ?? "-";

  const [now, setNow] = useState(Date.now());
  const anyBusy = volumes.some((v) => ["creating", "extending"].includes(volumeStatus(v, now)));
  useEffect(() => {
    if (!anyBusy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyBusy]);
  useEffect(() => setNow(Date.now()), [volumes]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VolumeStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DiskTypeId>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attaching, setAttaching] = useState<VolumeRecord | null>(null);
  const [detaching, setDetaching] = useState<VolumeRecord | null>(null);
  const [extending, setExtending] = useState<VolumeRecord | null>(null);
  const [renaming, setRenaming] = useState<VolumeRecord | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const statusLabel: Record<VolumeStatus, string> = {
    creating: t("Creating"),
    extending: t("Extending"),
    inUse: t("In use"),
    available: t("Not attached"),
  };
  const typeName = (id: DiskTypeId) => t(DISK_TYPES.find((d) => d.id === id)!.name);
  const monthlyOf = (v: VolumeRecord) => roundMoney(v.sizeGb * PRICE_LIST[DISK_TYPES.find((d) => d.id === v.type)!.price][currency], currency);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return volumes
      .filter(
        (v) =>
          (!q || v.name.toLowerCase().includes(q) || (v.attachedTo && serverName(v.attachedTo.serverId).toLowerCase().includes(q))) &&
          (statusFilter === "all" || volumeStatus(v, now) === statusFilter) &&
          (typeFilter === "all" || v.type === typeFilter),
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
  }, [volumes, servers, search, statusFilter, typeFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((v) => selected.includes(v.id));

  const exportCsv = () => {
    const header = ["name", "type", "sizeGb", "status", "attachedTo", "path", "region", "zone", "created"];
    const rows = filtered.map((v) => [
      v.name,
      v.type,
      v.sizeGb,
      volumeStatus(v, now),
      v.attachedTo ? serverName(v.attachedTo.serverId) : "",
      v.attachedTo?.path ?? "",
      v.region,
      v.zone,
      new Date(v.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `disks-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | VolumeStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...(["inUse", "available", "creating", "extending"] as const).map((s) => ({ value: s, label: statusLabel[s] })),
      ],
    },
    {
      key: "type",
      label: t("Disk type"),
      value: typeFilter,
      onChange: (v) => {
        setTypeFilter(v as "all" | DiskTypeId);
        setCurrentPage(1);
      },
      options: [{ value: "all", label: fx("all") }, ...DISK_TYPES.map((d) => ({ value: d.id, label: t(d.name) }))],
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
    <Button onClick={() => navigate(CREATE_VOLUME_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create disk")}
    </Button>
  );

  const toDelete = volumes.filter((v) => deleteIds?.includes(v.id));
  const blocking = toDelete.filter((v) => v.attachedTo || volumeStatus(v, now) !== "available");

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Storage"), path: VOLUMES_PATH }, { label: shellT("Cloud Disks") }]} />
      <PageHeader title={shellT("Cloud Disks")} count={volumes.length} countLabel={t("disks")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by disk or server name"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [statusFilter, typeFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setStatusFilter("all");
                setTypeFilter("all");
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
                <col className="w-[80px]" />
                <col />
                <col className="w-[7.3%]" />
                <col className="w-[8.2%]" />
                <col className="w-[10%]" />
                <col className="w-[16.4%]" />
                <col className="w-[10%]" />
                <col className="w-[11.8%]" />
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
                              ? Array.from(new Set([...selected, ...pageRows.map((v) => v.id)]))
                              : selected.filter((id) => !pageRows.some((v) => v.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Disk type")}</TableHead>
                  <TableHead>{t("Size")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Attached to")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumes.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <HardDrive className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No disks yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Add space to a server with a disk that keeps its data, and move it to another server when needed.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <p className="py-12 text-center text-muted-foreground">{t("No disks match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((v) => {
                    const status = volumeStatus(v, now);
                    const busy = status === "creating" || status === "extending";
                    return (
                      <TableRow key={v.id} className="border-b hover:bg-muted/30">
                        <TableCell className="text-center">
                          <div className="flex w-5 justify-center">
                            <Checkbox
                              checked={selected.includes(v.id)}
                              onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, v.id] : prev.filter((id) => id !== v.id)))}
                              aria-label={v.name}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <HardDrive className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <TruncatedText text={v.name} ltr className="font-medium text-foreground" />
                              <TruncatedText text={`${format(monthlyOf(v))} ${t("/ month")}`} className="text-xs text-muted-foreground" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">{typeName(v.type)}</span>
                        </TableCell>
                        <TableCell className="tabular-nums text-foreground">
                          {formatNumber(v.sizeGb)} {t("GB")}
                        </TableCell>
                        <TableCell>
                          {busy ? (
                            <ProgressStatus
                              label={statusLabel[status]}
                              startedAt={status === "creating" ? v.createdAt : (v.extendingUntil ?? now) - VOLUME_BUSY_MS}
                              durationMs={VOLUME_BUSY_MS}
                              now={now}
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className={cn("h-2 w-2 rounded-full", status === "inUse" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                              {statusLabel[status]}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {v.attachedTo ? (
                            <button
                              type="button"
                              onClick={() => navigate(SERVERS_PATH)}
                              className="block max-w-full text-start text-foreground hover:text-primary"
                            >
                              <TruncatedText text={serverName(v.attachedTo.serverId)} ltr />
                              <TruncatedText text={v.attachedTo.path} ltr mono className="text-xs text-muted-foreground" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={`${t(v.region)} / ${v.zone}`} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <TruncatedText text={formatDateTime(v.createdAt, language)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {v.attachedTo ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={busy}
                                aria-label={t("Detach")}
                                title={t("Detach")}
                                onClick={() => setDetaching(v)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={busy}
                                aria-label={t("Attach to a server")}
                                title={t("Attach to a server")}
                                onClick={() => setAttaching(v)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-52 bg-background">
                                <DropdownMenuItem disabled={busy} onClick={() => setExtending(v)}>
                                  <Expand className="me-2 h-4 w-4" />
                                  {t("Make larger")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRenaming(v)}>
                                  <Pencil className="me-2 h-4 w-4" />
                                  {fx("rename")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  disabled={!!v.attachedTo || busy}
                                  onClick={() => setDeleteIds([v.id])}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {fx("delete")}
                                </DropdownMenuItem>
                                {v.attachedTo && (
                                  <p className="px-2 pb-1.5 text-xs text-muted-foreground">{t("Detach it first to delete it.")}</p>
                                )}
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
                  onValueChange={(x) => {
                    setItemsPerPage(Number(x));
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

      <AttachDialog volume={attaching} onClose={() => setAttaching(null)} />
      <ExtendDialog volume={extending} onClose={() => setExtending(null)} />
      <RenameVolumeDialog volume={renaming} onClose={() => setRenaming(null)} />

      <ConfirmDialog
        open={!!detaching}
        onClose={() => setDetaching(null)}
        title={t("Detach {name}?", { name: detaching?.name ?? "" })}
        description={t("Unmount it inside {server} first; data still being written to it may be lost. The disk and its data are kept.", {
          server: detaching?.attachedTo ? serverName(detaching.attachedTo.serverId) : "",
        })}
        confirmLabel={t("Detach")}
        onConfirm={() => {
          if (!detaching) return;
          detachVolume(detaching.id);
          toast.success(t("{name} detached", { name: detaching.name }));
          setDetaching(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} disks?", { n: formatNumber(toDelete.length) })}
        description={
          blocking.length > 0
            ? t("These are attached or busy. Detach them, or wait until they are ready: {names}", {
                names: blocking.map((v) => v.name).join("، "),
              })
            : t("The disks and all the data on them are deleted, and their cost stops. This cannot be undone.")
        }
        acknowledge={blocking.length > 0 ? undefined : t("I confirm that the data on these disks will be deleted.")}
        blocked={blocking.length > 0}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={async () => {
          const ids = deleteIds ?? [];
          setDeleteIds(null);
          if (!(await apiCall(() => (deleteVolumes(ids), true), t))) return;
          setSelected((prev) => prev.filter((id) => !ids.includes(id)));
          toast.success(t("Disks deleted"));
        }}
      />
    </div>
  );
}

/** Attach to a server in the disk's zone; a local disk, to one on its machine. */
function AttachDialog({ volume, onClose }: { volume: VolumeRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const volumes = useVolumes();
  const servers = useServers().filter(
    (s) => volume && s.region === volume.region && s.zone === volume.zone && (volume.type !== "local" || s.hostId === volume.hostId),
  );
  const [serverId, setServerId] = useState("");
  useEffect(() => setServerId(""), [volume]);
  const server = servers.find((s) => s.id === serverId);

  return (
    <Dialog open={!!volume} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Attach to a server")}</DialogTitle>
          <DialogDescription>
            <span dir="ltr">{volume?.name}</span>
          </DialogDescription>
        </DialogHeader>
        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {volume?.type === "local" ? t("No server runs on this disk's dedicated server.") : t("No server in this zone to attach it to.")}
          </p>
        ) : (
          <div>
            <Select value={serverId} onValueChange={setServerId}>
              <SelectTrigger>
                <SelectValue placeholder={t("Choose a server")} />
              </SelectTrigger>
              <SelectContent>
                {servers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span dir="ltr">{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {server && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("It shows up in the server as {path}.", { path: nextDevicePath(server, volumes) })}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!server}
            onClick={() => {
              if (!volume || !server) return;
              attachVolume(volume.id, server.id, nextDevicePath(server, volumes));
              toast.success(t("{name} attached to {server}", { name: volume.name, server: server.name }));
              onClose();
            }}
          >
            {t("Attach")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Larger only: the next round sizes, or any size up to the type's limit. */
function ExtendDialog({ volume, onClose }: { volume: VolumeRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const type = DISK_TYPES.find((d) => d.id === volume?.type) ?? DISK_TYPES[0];
  const [draft, setDraft] = useState("");
  useEffect(() => setDraft(volume ? String(volume.sizeGb) : ""), [volume]);
  const size = Math.round(Number(draft) || 0);
  const ok = !!volume && size > volume.sizeGb && size <= type.maxGb && (!type.fixedSizes || type.fixedSizes.includes(size));
  const fixed = type.fixedSizes;
  const presets = volume ? (fixed ?? DISK_GROW_SIZES).filter((gb) => gb > volume.sizeGb && gb <= type.maxGb).slice(0, 4) : [];
  const perGb = PRICE_LIST[type.price][currency];

  return (
    <Dialog open={!!volume} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Make {name} larger", { name: volume?.name ?? "" })}</DialogTitle>
          <DialogDescription>
            {t("Now {size} GB. A disk can be made larger, not smaller.", { size: formatNumber(volume?.sizeGb ?? 0) })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {presets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presets.map((gb) => (
                <button
                  key={gb}
                  type="button"
                  onClick={() => setDraft(String(gb))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    size === gb ? "border-primary/50 bg-primary/[0.04] font-semibold" : "border-border hover:border-primary/30",
                  )}
                >
                  {formatNumber(gb)} {t("GB")}
                </button>
              ))}
            </div>
          )}
          {fixed ? (
            presets.length === 0 && <p className="text-sm text-muted-foreground">{t("This is already the largest local disk.")}</p>
          ) : (
            <div className="flex items-center gap-2">
              <Input dir="ltr" type="number" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-9 w-32" />
              <span className="text-sm text-muted-foreground">{t("GB")}</span>
              <span className="text-xs text-muted-foreground">{t("Up to {max} GB", { max: formatNumber(type.maxGb) })}</span>
            </div>
          )}
          {ok && (
            <p className="text-sm text-foreground">
              {t("New price: {amount} a month", { amount: format(roundMoney(size * perGb, currency)) })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("After it grows, extend the partition and file system inside the server to use the new space.")}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (!volume) return;
              extendVolume(volume.id, size);
              toast.success(t("{name} is being extended to {size} GB", { name: volume.name, size: formatNumber(size) }));
              onClose();
            }}
          >
            {t("Make larger")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameVolumeDialog({ volume, onClose }: { volume: VolumeRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const volumes = useVolumes();
  const [name, setName] = useState("");
  useEffect(() => setName(volume?.name ?? ""), [volume]);
  const ok = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(name) && !volumes.some((v) => v.name === name && v.id !== volume?.id);
  return (
    <Dialog open={!!volume} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename disk")}</DialogTitle>
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
              if (volume) renameVolume(volume.id, name);
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
