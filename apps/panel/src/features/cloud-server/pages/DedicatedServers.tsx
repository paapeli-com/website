import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  ServerCog,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
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
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { HOST_PLANS } from "../lib/catalog";
import { hostStatus, PROVISIONING_MS, removeHosts, updateHost, useClusters, useHosts, type HostRecord, type HostStatus } from "../lib/hostStore";
import { useServers } from "../lib/serverStore";
import { CREATE_DEDICATED_PATH, CREATE_SERVER_PATH, DEDICATED_PATH, deletePhraseOk, PageBreadcrumb, ProgressStatus, SERVERS_PATH, TruncatedText, TypeToConfirm } from "../ui";

/* Dedicated Servers: the physical machines this account rents, and how many
 * of its cloud servers each one carries.
 *
 * The server list's standard: breadcrumb, header with count, KPI cards that
 * filter, the shared toolbar with multi-select bulk actions, fixed columns
 * with hover tooltips, pagination, the empty state in place of the rows.
 *
 * Out in the row: making a cloud server on this machine, which opens the
 * cloud wizard with the machine already chosen. In the menu: rename,
 * auto-renew on or off, delete. A machine still carrying cloud servers is
 * not deleted; the confirmation says which and why.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "load";

export default function DedicatedServers() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const hosts = useHosts();
  const clusters = useClusters();
  const servers = useServers();

  const vmsOn = (id: string) => servers.filter((s) => s.hostId === id).length;
  const clusterName = (id: string) => clusters.find((c) => c.id === id)?.name ?? "-";

  const [now, setNow] = useState(Date.now());
  const anyProvisioning = hosts.some((h) => hostStatus(h, now) === "provisioning");
  useEffect(() => {
    if (!anyProvisioning) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyProvisioning]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HostStatus>("all");
  const [clusterFilter, setClusterFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [phrase, setPhrase] = useState("");
  useEffect(() => setPhrase(""), [deleteIds]);
  const [renaming, setRenaming] = useState<HostRecord | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const statusLabel: Record<HostStatus, string> = { provisioning: t("Preparing"), active: t("Active") };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hosts
      .filter(
        (h) =>
          (!q || h.name.toLowerCase().includes(q) || h.model.toLowerCase().includes(q)) &&
          (statusFilter === "all" || hostStatus(h, now) === statusFilter) &&
          (clusterFilter === "all" || h.clusterId === clusterFilter),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "load":
            return vmsOn(b.id) / b.maxVms - vmsOn(a.id) / a.maxVms;
          default:
            return b.createdAt - a.createdAt;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, servers, search, statusFilter, clusterFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((h) => selected.includes(h.id));

  const exportCsv = () => {
    const header = ["name", "status", "cluster", "region", "zone", "model", "cores", "ramGb", "cloudServers", "maxCloudServers", "periodMonths", "autoRenew"];
    const rows = filtered.map((h) => [
      h.name,
      hostStatus(h, now),
      clusterName(h.clusterId),
      h.region,
      h.zone,
      h.model,
      h.cores,
      h.ramGb,
      vmsOn(h.id),
      h.maxVms,
      h.periodMonths,
      h.autoRenew,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dedicated-servers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | HostStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "active", label: statusLabel.active },
        { value: "provisioning", label: statusLabel.provisioning },
      ],
    },
    {
      key: "cluster",
      label: t("Cluster"),
      value: clusterFilter,
      onChange: (v) => {
        setClusterFilter(v);
        setCurrentPage(1);
      },
      options: [{ value: "all", label: fx("all") }, ...clusters.map((c) => ({ value: c.id, label: c.name }))],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "created", label: t("Newest first") },
    { key: "load", label: t("Busiest first") },
  ];

  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const totalVms = hosts.reduce((sum, h) => sum + vmsOn(h.id), 0);
  const kpis: { key: "all" | HostStatus | "vms"; label: string; value: number; icon: typeof Server; accent: string; bg: string; unit: string }[] = [
    { key: "all", label: t("Total dedicated servers"), value: hosts.length, icon: ServerCog, accent: "text-primary", bg: "from-primary/10 to-transparent", unit: t("servers") },
    {
      key: "active",
      label: t("Active"),
      value: hosts.filter((h) => hostStatus(h, now) === "active").length,
      icon: CheckCircle2,
      accent: "text-emerald-500",
      bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
      unit: t("servers"),
    },
    {
      key: "provisioning",
      label: t("Preparing"),
      value: hosts.filter((h) => hostStatus(h, now) === "provisioning").length,
      icon: Loader2,
      accent: "text-sky-500",
      bg: "from-sky-50 to-transparent dark:from-sky-500/10",
      unit: t("servers"),
    },
    { key: "vms", label: t("Cloud servers on them"), value: totalVms, icon: Server, accent: "text-violet-500", bg: "from-violet-50 to-transparent dark:from-violet-500/10", unit: t("servers") },
  ];

  const createButton = (
    <Button
      onClick={() => navigate(CREATE_DEDICATED_PATH)}
      className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" />
      {t("Create dedicated server")}
    </Button>
  );

  /* Machines in the delete set that still carry cloud servers. */
  const blocking = (deleteIds ?? []).map((id) => hosts.find((h) => h.id === id)).filter((h): h is HostRecord => !!h && vmsOn(h.id) > 0);

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Dedicated Servers"), path: DEDICATED_PATH },
        ]}
      />
      <PageHeader title={shellT("Dedicated Servers")} count={hosts.length} countLabel={t("servers")} actions={createButton} />

      <KpiSection storageKey="dedicated-servers" className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const filterable = k.key !== "vms";
            const isActive = filterable && statusFilter === k.key;
            return (
              <button
                key={k.key}
                type="button"
                disabled={!filterable}
                onClick={() => {
                  if (!filterable) return;
                  setStatusFilter(k.key as "all" | HostStatus);
                  setCurrentPage(1);
                }}
                className={cn(
                  "relative rounded-lg border bg-card bg-gradient-to-br px-3 py-2.5 text-start transition-all",
                  filterable && "hover:shadow-sm",
                  k.bg,
                  isActive ? "border-primary shadow-sm ring-2 ring-primary/20" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">{k.label}</span>
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", k.accent)} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold leading-none text-foreground">{formatNumber(k.value)}</span>
                  <span className="text-[11px] text-muted-foreground">{k.unit}</span>
                </div>
              </button>
            );
          })}
        </div>
      </KpiSection>

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name or model"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [statusFilter, clusterFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setStatusFilter("all");
                setClusterFilter("all");
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
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[10%]" />
                <col className="w-[11.6%]" />
                <col className="w-[9.3%]" />
                <col className="w-[10.8%]" />
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
                              ? Array.from(new Set([...selected, ...pageRows.map((h) => h.id)]))
                              : selected.filter((id) => !pageRows.some((h) => h.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Cluster")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("Cloud servers")}</TableHead>
                  <TableHead>{t("Billing period")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hosts.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <ServerCog className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No dedicated servers yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Rent a whole physical server and run your own cloud servers on it.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <p className="py-12 text-center text-muted-foreground">{t("No servers match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((h) => {
                    const status = hostStatus(h, now);
                    const used = vmsOn(h.id);
                    const load = Math.min(1, used / h.maxVms);
                    const isExpanded = expanded.includes(h.id);
                    const plan = HOST_PLANS.find((p) => p.id === h.planId);
                    const renewsAt = new Date(h.createdAt);
                    renewsAt.setMonth(renewsAt.getMonth() + h.periodMonths);
                    const toggle = () =>
                      setExpanded((prev) => (prev.includes(h.id) ? prev.filter((k) => k !== h.id) : [...prev, h.id]));
                    return (
                      <Fragment key={h.id}>
                      <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex w-5 justify-center">
                            <Checkbox
                              checked={selected.includes(h.id)}
                              onCheckedChange={(c) =>
                                setSelected((prev) => (c ? [...prev, h.id] : prev.filter((id) => id !== h.id)))
                              }
                              aria-label={h.name}
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
                              <ServerCog className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <TruncatedText text={h.name} ltr className="font-medium text-foreground" />
                              <TruncatedText text={h.model} ltr className="text-xs text-muted-foreground" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {status === "provisioning" ? (
                            <ProgressStatus label={statusLabel.provisioning} startedAt={h.createdAt} durationMs={PROVISIONING_MS} now={now} />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {statusLabel.active}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={clusterName(h.clusterId)} ltr />
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={`${t(h.region)} / ${h.zone}`} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="tabular-nums text-foreground">
                              {formatNumber(used)} / {formatNumber(h.maxVms)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", load > 0.85 ? "bg-amber-500" : "bg-violet-500")}
                              style={{ width: `${load * 100}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {h.periodMonths === 1 ? t("1 month") : t("{n} months", { n: formatNumber(h.periodMonths) })}
                          </div>
                          <div className="text-xs text-muted-foreground">{h.autoRenew ? t("Auto-renew on") : t("Auto-renew off")}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <TruncatedText text={formatDateTime(h.createdAt, language)} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              disabled={status !== "active" || used >= h.maxVms}
                              aria-label={t("Create a cloud server on it")}
                              title={t("Create a cloud server on it")}
                              onClick={() => navigate(CREATE_SERVER_PATH, { state: { hostId: h.id } })}
                            >
                              <Server className="h-4 w-4" />
                            </Button>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
                                <DropdownMenuItem onClick={() => setRenaming(h)}>
                                  <Pencil className="me-2 h-4 w-4" />
                                  {fx("rename")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    updateHost(h.id, { autoRenew: !h.autoRenew });
                                    toast.success(h.autoRenew ? t("Auto-renew off") : t("Auto-renew on"));
                                  }}
                                >
                                  <RefreshCw className="me-2 h-4 w-4" />
                                  {h.autoRenew ? t("Turn auto-renew off") : t("Turn auto-renew on")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteIds([h.id])}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {t("Delete dedicated server")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* The machine itself, out of the row: its hardware and
                          when it renews. */}
                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={10} className="p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <ExpandField label={t("Model")} value={h.model} ltr />
                              <ExpandField
                                label={t("Processor")}
                                value={`${plan?.cpu ?? "-"} · ${t("{n} cores", { n: formatNumber(h.cores) })}`}
                              />
                              <ExpandField label={t("RAM")} value={`${formatNumber(h.ramGb)} ${t("GB")}`} />
                              <ExpandField label={t("Disk")} value={plan?.disk ?? "-"} ltr />
                              <ExpandField label={t("Network")} value={plan?.network ?? "-"} ltr />
                              <ExpandField label={t("Cloud servers")} value={t("Up to {n}", { n: formatNumber(h.maxVms) })} />
                              <ExpandField
                                label={h.autoRenew ? t("Renews on") : t("Ends on")}
                                value={formatDate(renewsAt, language)}
                              />
                              <ExpandField label={t("Server ID")} value={h.id} ltr />
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

      <Dialog open={!!deleteIds} onOpenChange={(open) => !open && setDeleteIds(null)}>
        <DialogContent data-uniform-type className="sm:max-w-[440px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Delete dedicated servers?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {blocking.length > 0
                ? t("These still run cloud servers. Delete or move those first: {names}", {
                    names: blocking.map((h) => `${h.name} (${formatNumber(vmsOn(h.id))})`).join("، "),
                  })
                : t("{n} dedicated servers will be released. This cannot be undone.", {
                    n: formatNumber(deleteIds?.length ?? 0),
                  })}
            </DialogDescription>
          </DialogHeader>
          {blocking.length === 0 && <TypeToConfirm value={phrase} onChange={setPhrase} />}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteIds(null)}>
              {fx("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={blocking.length > 0 || !deletePhraseOk(phrase)}
              onClick={() => {
                removeHosts(deleteIds ?? []);
                setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
                toast.success(t("Dedicated servers deleted"));
                setDeleteIds(null);
              }}
            >
              {fx("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RenameHostDialog host={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}

function RenameHostDialog({ host, onClose }: { host: HostRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(host?.name ?? ""), [host]);
  const ok = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(name);

  return (
    <Dialog open={!!host} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename server")}</DialogTitle>
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
              if (host) updateHost(host.id, { name });
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

function ExpandField({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium text-foreground" dir={ltr ? "ltr" : undefined} title={value}>
        {value}
      </div>
    </div>
  );
}
