import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  CircleStop,
  Download,
  Expand,
  Eye,
  Info,
  Loader2,
  Microchip,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Power,
  Server,
  ServerCog,
  SquareTerminal,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { OsLogo } from "../lib/osLogos";
import { IMAGES } from "../lib/catalog";
import { powerServer, serverPhase, serverStatus, useServers, type ServerRecord, type ServerStatus } from "../lib/serverStore";
import { CREATE_GPU_SERVER_PATH, CREATE_SERVER_PATH, groupPath, PageBreadcrumb, SERVERS_PATH, CopyButton, TruncatedText } from "../ui";
import { serverPath, ServerState } from "../serverUi";
import { groupInstances, useGroups } from "../lib/autoscaleStore";
import { apiCall } from "../lib/openstackErrors";
import { useFloatingIps } from "../lib/floatingStore";
import { CreateSnapshotDialog } from "../snapshotDialog";
import { DeleteServersDialog, deleteServers, RenameDialog } from "../serverDialogs";
import { useShellT } from "@/shared/i18n/shell";

/* The server list: Smart Factory's device list, piece for piece.
 *
 * Same page header with its count, the same KPI cards that filter the table,
 * the shared list toolbar (search, refresh, filters, sort, bulk actions) with
 * no view switcher, the device table's treatment with row selection and an
 * expandable row, the same row actions at the end, the same delete
 * confirmation and the same pagination. What differs is only what a server
 * has that a device does not.
 *
 * With no servers at all, the page is an empty state whose Create button
 * offers the two ways to make one.
 *
 * GPU Servers is this same page for GPU servers only: they are listed there
 * and nowhere else, as cloud servers are listed only here. Its Create opens
 * the GPU wizard straight away, and the plan column names the GPU.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "status";

export default function Servers({ kind = "cloud" }: { kind?: "cloud" | "gpu" }) {
  const isGpu = kind === "gpu";
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const allServers = useServers();
  const groups = useGroups();
  const floatingIps = useFloatingIps();
  /** A server's public addresses past the primary, with what each is. */
  const moreIps = (s: ServerRecord) => [
    ...(s.extraIps ?? []).map((ip) => ({ address: ip.address, kind: ip.reservedId ? t("Reserved") : t("Additional") })),
    ...floatingIps.filter((f) => f.attachedTo?.serverId === s.id && f.attachedTo.kind !== "loadbalancer").map((f) => ({ address: f.address, kind: t("Floating") })),
  ];

  /* Re-read the clock while anything is being created, so its status turns
     over without a refresh. */
  const [now, setNow] = useState(Date.now());

  /* The account's own servers, then the instances of its Auto Scale groups:
     listed here too so every cloud server is in one place, labelled with
     their group, which manages them. */
  const servers = useMemo(() => {
    const own = allServers.filter((s) => (s.kind ?? "cloud") === kind);
    if (isGpu) return own;
    const fromGroups: ServerRecord[] = groups.flatMap((g) =>
      groupInstances(g, now).map((i) => ({
        id: i.id,
        kind: "cloud" as const,
        name: i.name,
        imageId: g.imageId,
        image: g.image,
        planId: g.planId,
        vcpu: g.vcpu,
        ramGb: g.ramGb,
        diskGb: g.diskGb,
        region: g.region,
        zone: g.zone,
        ipv4: i.publicIp,
        powerOn: true,
        createdAt: i.createdAt,
        groupId: g.id,
        groupName: g.name,
      })),
    );
    return [...own, ...fromGroups];
  }, [allServers, groups, kind, isGpu, now]);
  /** Ids the list can act on: an Auto Scale instance is its group's to manage. */
  const ownIds = (ids: string[]) => ids.filter((id) => !servers.find((s) => s.id === id)?.groupId);
  /* Re-read while anything is being made or worked on. */
  const anyMoving = servers.some((s) => ["creating", "busy"].includes(serverPhase(s, now)));
  useEffect(() => {
    if (!anyMoving) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyMoving]);
  useEffect(() => setNow(Date.now()), [allServers]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServerStatus>("all");
  const [imageFilter, setImageFilter] = useState("all");
  /* Where it runs: the shared cloud, or one of the account's dedicated
     servers. A filter only; it gets no KPI card. */
  const [placementFilter, setPlacementFilter] = useState<"all" | "shared" | "host" | "group">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [renaming, setRenaming] = useState<ServerRecord | null>(null);
  const [snapshotOf, setSnapshotOf] = useState<string | null>(null);

  const statusLabel: Record<ServerStatus, string> = {
    creating: t("Creating"),
    running: t("Running"),
    stopped: t("Powered off"),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return servers
      .filter((s) => {
        const status = serverStatus(s, now);
        return (
          (!q || s.name.toLowerCase().includes(q) || s.ipv4.includes(q) || s.image.toLowerCase().includes(q)) &&
          (statusFilter === "all" || status === statusFilter) &&
          (imageFilter === "all" || s.imageId === imageFilter) &&
          (placementFilter === "all" ||
            (placementFilter === "host" && !!s.hostId) ||
            (placementFilter === "group" && !!s.groupId) ||
            (placementFilter === "shared" && !s.hostId && !s.groupId))
        );
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "status":
            return serverStatus(a, now).localeCompare(serverStatus(b, now));
          default:
            return sortDirection === "desc" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
        }
      });
  }, [servers, search, statusFilter, imageFilter, placementFilter, sortKey, sortDirection, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);

  const comingSoon = () => toast.info(fx("comingSoon"));

  /* Each server on its own: one that is locked, busy or already there is
     refused (and said so) without stopping the rest. */
  const setPower = async (ids: string[], on: boolean) => {
    let done = 0;
    for (const id of ids) {
      const sv = servers.find((x) => x.id === id);
      if (!sv || sv.powerOn === on) continue;
      if (await apiCall(() => (powerServer(id, on), true), t)) done++;
    }
    if (done) toast.success(on ? t("Powering on") : t("Shutting down"));
  };

  const exportCsv = () => {
    const header = ["name", "status", "image", "region", "zone", "ipv4", "plan", "gpu", "dedicatedServer", "created"];
    const rows = filtered.map((s) => [
      s.name,
      serverStatus(s, now),
      s.image,
      s.region,
      s.zone,
      s.ipv4,
      s.planId.toUpperCase(),
      s.gpu ?? "",
      s.hostName ?? "",
      new Date(s.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isGpu ? "gpu-servers" : "servers"}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* One way in, so no menu: the button opens the wizard. Auto Scale groups
     are made from their own section in the sidebar. */
  const createMenu = (
    <Button
      onClick={() => navigate(isGpu ? CREATE_GPU_SERVER_PATH : CREATE_SERVER_PATH)}
      className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" />
      {isGpu ? t("Create GPU server") : t("Create server")}
    </Button>
  );

  // ---- The list ---------------------------------------------------------------
  /* With no servers at all the page keeps its header, cards, toolbar and
     columns, as the gateway list does, and the empty state takes the place of
     the rows. */
  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | ServerStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...(["running", "stopped", "creating"] as ServerStatus[]).map((s) => ({ value: s, label: statusLabel[s] })),
      ],
    },
    {
      key: "image",
      label: t("Operating system"),
      value: imageFilter,
      onChange: (v) => {
        setImageFilter(v);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...IMAGES.filter((i) => servers.some((s) => s.imageId === i.id)).map((i) => ({ value: i.id, label: i.name })),
      ],
    },
    ...(isGpu
      ? []
      : [
          {
            key: "placement",
            label: t("Placement"),
            value: placementFilter,
            onChange: (v: string) => {
              setPlacementFilter(v as "all" | "shared" | "host" | "group");
              setCurrentPage(1);
            },
            options: [
              { value: "all", label: fx("all") },
              { value: "shared", label: t("Shared cloud") },
              { value: "host", label: t("Dedicated server") },
              { value: "group", label: t("Auto Scale group") },
            ],
          },
        ]),
  ];

  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "created", label: t("Newest first") },
    { key: "status", label: fx("sortStatus") },
  ];

  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "on", label: t("Power on"), icon: Play, onSelect: () => void setPower(ownIds(selected), true) },
    { key: "off", label: t("Power off"), icon: CircleStop, onSelect: () => void setPower(ownIds(selected), false) },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(ownIds(selected)) },
  ];

  const counts = {
    all: servers.length,
    running: servers.filter((s) => serverStatus(s, now) === "running").length,
    stopped: servers.filter((s) => serverStatus(s, now) === "stopped").length,
    creating: servers.filter((s) => serverStatus(s, now) === "creating").length,
  };
  const kpis: { key: "all" | ServerStatus; label: string; icon: typeof Server; accent: string; bg: string }[] = [
    { key: "all", label: t("Total servers"), icon: Server, accent: "text-primary", bg: "from-primary/10 to-transparent" },
    { key: "running", label: t("Running"), icon: Play, accent: "text-emerald-500", bg: "from-emerald-50 to-transparent dark:from-emerald-500/10" },
    { key: "stopped", label: t("Powered off"), icon: CircleStop, accent: "text-muted-foreground", bg: "from-muted/40 to-transparent" },
    { key: "creating", label: t("Creating"), icon: Loader2, accent: "text-sky-500", bg: "from-sky-50 to-transparent dark:from-sky-500/10" },
  ];

  const pickable = pageRows.filter((s) => !s.groupId);
  const allOnPageSelected = pickable.length > 0 && pickable.every((s) => selected.includes(s.id));

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: isGpu ? shellT("GPU Servers") : shellT("Cloud Server") },
        ]}
      />
      <PageHeader
        title={isGpu ? t("GPU Servers") : t("Cloud Server")}
        count={servers.length}
        countLabel={t("servers")}
        actions={createMenu}
      />

      <KpiSection storageKey={isGpu ? "gpu-servers" : "cloud-servers"} className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const isActive = statusFilter === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  setStatusFilter(k.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "relative rounded-lg border bg-card bg-gradient-to-br px-3 py-2.5 text-start transition-all hover:shadow-sm",
                  k.bg,
                  isActive ? "border-primary shadow-sm ring-2 ring-primary/20" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">{k.label}</span>
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", k.accent)} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold leading-none text-foreground">{formatNumber(counts[k.key])}</span>
                  <span className="text-[11px] text-muted-foreground">{t("servers")}</span>
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
              placeholder: t("Search by name, IP or image"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [statusFilter, imageFilter, placementFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setStatusFilter("all");
                setImageFilter("all");
                setPlacementFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          {/* The device list's table: same frame, header and row sizes. Fixed
              columns, so nothing shifts as values change; below its minimum
              width the table scrolls sideways, and a value cut short shows in
              full on hover. */}
          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[1100px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col />
                <col className="w-[9%]" />
                <col className="w-[9.8%]" />
                <col className="w-[11.5%]" />
                <col className="w-[10.7%]" />
                <col className="w-[10.7%]" />
                <col className="w-[210px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[44px] text-center">
                    <div className="flex w-5 justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        disabled={pickable.length === 0}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pickable.map((s) => s.id)]))
                              : selected.filter((id) => !pickable.some((s) => s.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[36px]" />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("IP address")}</TableHead>
                  <TableHead>{isGpu ? t("GPU") : t("Plan")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey("created");
                        setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
                      }}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {t("Created")}
                      {sortDirection === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          {isGpu ? <Microchip className="size-7" /> : <Server className="size-7" />}
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">
                          {isGpu ? t("No GPU servers yet") : t("No servers yet")}
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {isGpu
                            ? t("Create a virtual machine with a dedicated NVIDIA GPU, on Linux or Windows.")
                            : t("Create a virtual machine from one of the ready Linux or Windows images.")}
                        </p>
                        {/* Centred under its own button. */}
                        <div className="mt-6">
                          {createMenu}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <p className="py-12 text-center text-muted-foreground">{t("No servers match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((s) => {
                    const status = serverStatus(s, now);
                    const isExpanded = expanded.includes(s.id);
                    const image = IMAGES.find((i) => i.id === s.imageId);
                    const toggle = () =>
                      setExpanded((prev) => (prev.includes(s.id) ? prev.filter((k) => k !== s.id) : [...prev, s.id]));
                    return (
                      <Fragment key={s.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex w-5 justify-center">
                              <Checkbox
                                disabled={!!s.groupId}
                                title={s.groupId ? t("Managed by its Auto Scale group") : undefined}
                                checked={selected.includes(s.id)}
                                onCheckedChange={(c) =>
                                  setSelected((prev) => (c ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                                }
                                aria-label={s.name}
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
                            <div className="flex items-center gap-2">
                              {image ? (
                                <OsLogo
                                  id={image.id}
                                  name={image.name}
                                  color={image.color}
                                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold [&_svg]:size-4"
                                />
                              ) : (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <Server className="h-4 w-4" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {s.groupId ? (
                                    <TruncatedText text={s.name} ltr className="font-medium text-foreground" />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(serverPath(s));
                                      }}
                                      className="min-w-0 text-start hover:text-primary"
                                    >
                                      <TruncatedText text={s.name} ltr className="font-medium text-foreground hover:text-primary" />
                                    </button>
                                  )}
                                  {/* On one of the account's dedicated servers:
                                      named on hover. */}
                                  {s.hostId && (
                                    <span
                                      title={`${t("Dedicated server")}: ${s.hostName ?? ""}`}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-400"
                                    >
                                      <ServerCog className="h-3 w-3" />
                                      {t("Dedicated server")}
                                    </span>
                                  )}
                                  {/* An Auto Scale instance: opens its group. */}
                                  {s.groupId && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(groupPath(s.groupId!));
                                      }}
                                      title={`${t("Auto Scale group")}: ${s.groupName ?? ""}`}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 hover:bg-sky-500/20 dark:text-sky-400"
                                    >
                                      <Expand className="h-3 w-3" />
                                      Auto Scale
                                    </button>
                                  )}
                                </div>
                                <TruncatedText text={s.image} ltr className="text-xs text-muted-foreground" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ServerState server={s} now={now} />
                          </TableCell>
                          <TableCell>
                            <TruncatedText text={`${t(s.region)} / ${s.zone}`} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {status === "creating" ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <div className="min-w-0">
                                <span className="flex min-w-0 items-center gap-1">
                                  <TruncatedText text={s.ipv4} ltr className="text-foreground" />
                                  <CopyButton text={s.ipv4} />
                                </span>
                                {moreIps(s).map((ip) => (
                                  <span key={ip.address} className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                                    <TruncatedText text={ip.address} ltr />
                                    <span className="shrink-0 rounded bg-muted px-1 py-px text-[10px] font-medium">{ip.kind}</span>
                                    <CopyButton text={ip.address} className="size-6" />
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <TruncatedText text={isGpu && s.gpu ? s.gpu : s.planId.toUpperCase()} ltr className="font-medium" />
                            <TruncatedText
                              text={t("{cpu} vCPU · {ram} GB RAM", { cpu: formatNumber(s.vcpu), ram: formatNumber(s.ramGb) })}
                              className="text-xs text-muted-foreground"
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <TruncatedText text={formatDateTime(s.createdAt, language)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => navigate(s.groupId ? groupPath(s.groupId) : serverPath(s))}
                              >
                                <Eye className="h-3.5 w-3.5" /> {fx("view")}
                              </Button>
                              <RowIcon label={t("Console")} onClick={comingSoon} disabled={status === "creating"}>
                                <SquareTerminal className="h-4 w-4" />
                              </RowIcon>
                              <RowIcon
                                label={s.powerOn ? t("Power off") : t("Power on")}
                                onClick={() => void setPower([s.id], !s.powerOn)}
                                disabled={!["running", "stopped"].includes(serverPhase(s, now)) || !!s.groupId || !!s.locked}
                              >
                                <Power className={cn("h-4 w-4", status === "running" && "text-emerald-600")} />
                              </RowIcon>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
                                  {s.groupId ? (
                                    <DropdownMenuItem onClick={() => navigate(groupPath(s.groupId!))}>
                                      <Expand className="me-2 h-4 w-4" />
                                      {t("Open group")}
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                  <DropdownMenuItem onClick={() => navigate(serverPath(s))}>
                                    <Info className="me-2 h-4 w-4" />
                                    {t("Server details")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setRenaming(s)}>
                                    <Pencil className="me-2 h-4 w-4" />
                                    {fx("rename")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSnapshotOf(s.id)}>
                                    <Camera className="me-2 h-4 w-4" />
                                    {t("Create snapshot")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`${serverPath(s)}?labels=1`)}>
                                    <Tag className="me-2 h-4 w-4" />
                                    {t("Labels")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={!!s.locked}
                                    onClick={() => setDeleteIds([s.id])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {t("Delete server")}
                                  </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={9} className="p-4">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <ExpandField label={t("Server ID")} value={s.id} ltr />
                                <ExpandField label={t("Operating system")} value={s.image} ltr />
                                <ExpandField label={t("Disk")} value={`${formatNumber(s.diskGb)} ${t("GB")}`} />
                                <ExpandField label={t("IPv6 address")} value={s.ipv6 ?? "-"} ltr />
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

          {/* Pagination: the device list's, as is. */}
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

      {/* Delete, listing what goes with each server: its addresses and
          disks. A reserved IP is not among them; it goes back to Public IPs. */}
      <DeleteServersDialog
        servers={servers.filter((sv) => deleteIds?.includes(sv.id))}
        onClose={() => setDeleteIds(null)}
        onDeleted={async (ids) => {
          const doomed = servers.filter((sv) => ids.includes(sv.id));
          if (!(await apiCall(() => (deleteServers(doomed), true), t))) return;
          setSelected((prev) => prev.filter((id) => !ids.includes(id)));
          toast.success(t("Servers deleted"));
          setDeleteIds(null);
        }}
      />

      <RenameDialog server={renaming} onClose={() => setRenaming(null)} />
      <CreateSnapshotDialog open={!!snapshotOf} serverId={snapshotOf ?? undefined} onClose={() => setSnapshotOf(null)} />
    </div>
  );
}

function RowIcon({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {children}
    </Button>
  );
}

function ExpandField({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium text-foreground" dir={ltr ? "ltr" : undefined}>
        {value}
      </div>
    </div>
  );
}
