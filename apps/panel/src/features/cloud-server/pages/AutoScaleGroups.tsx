import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Download, Expand, Eye, HeartPulse, Layers, Loader2, MoreHorizontal, Pause, Play, Plus, Server, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { useLoadBalancers } from "../lib/loadBalancerStore";
import { groupLb } from "../lbUi";
import {
  groupHealth,
  removeGroups,
  runningCount,
  updateGroup,
  useGroups,
  type AutoScaleGroup,
  type GroupHealth,
  type ScalingMode,
} from "../lib/autoscaleStore";
import { AUTOSCALE_PATH, CREATE_AUTOSCALE_PATH, deletePhraseOk, groupPath, PageBreadcrumb, SERVERS_PATH, TruncatedText, TypeToConfirm } from "../ui";
import { CapacityDialog, HealthBadge, PauseDialog } from "../autoscaleUi";

/* Auto Scale: the account's groups of cloud servers that grow and shrink.
 *
 * The server list's standard: breadcrumb, header with count and Create, KPI
 * cards that filter, the shared toolbar with multi-select bulk actions, fixed
 * columns with hover tooltips, View and a menu at the row's end, pagination,
 * the empty state in place of the rows. A group's name opens its page.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "size";

export default function AutoScaleGroups() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const groups = useGroups();
  const lbs = useLoadBalancers();

  const [now, setNow] = useState(Date.now());
  const anyScaling = groups.some((g) => groupHealth(g, now) === "scaling");
  useEffect(() => {
    if (!anyScaling) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyScaling]);

  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | GroupHealth>("all");
  const [modeFilter, setModeFilter] = useState<"all" | ScalingMode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [phrase, setPhrase] = useState("");
  useEffect(() => setPhrase(""), [deleteIds]);
  const [capacityFor, setCapacityFor] = useState<AutoScaleGroup | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [pauseFor, setPauseFor] = useState<AutoScaleGroup | null>(null);

  const modeLabel = (g: AutoScaleGroup) => (g.mode === "manual" ? t("Manual") : g.paused ? t("Paused") : t("Automatic"));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter(
        (g) =>
          (!q || g.name.toLowerCase().includes(q) || (g.loadBalancer ?? "").toLowerCase().includes(q)) &&
          (healthFilter === "all" || groupHealth(g, now) === healthFilter) &&
          (modeFilter === "all" || g.mode === modeFilter),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "size":
            return b.desired - a.desired;
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [groups, search, healthFilter, modeFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((g) => selected.includes(g.id));

  const exportCsv = () => {
    const header = ["name", "mode", "region", "zone", "min", "desired", "max", "running", "loadBalancer", "health", "created"];
    const rows = filtered.map((g) => [
      g.name,
      g.mode,
      g.region,
      g.zone,
      g.min,
      g.desired,
      g.max,
      runningCount(g, now),
      g.loadBalancer ?? "",
      groupHealth(g, now),
      new Date(g.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `auto-scale-groups-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "health",
      label: t("Health"),
      value: healthFilter,
      onChange: (v) => {
        setHealthFilter(v as "all" | GroupHealth);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "healthy", label: t("Healthy") },
        { value: "scaling", label: t("Scaling") },
      ],
    },
    {
      key: "mode",
      label: t("Scaling mode"),
      value: modeFilter,
      onChange: (v) => {
        setModeFilter(v as "all" | ScalingMode);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "automatic", label: t("Automatic") },
        { value: "manual", label: t("Manual") },
      ],
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

  const kpis: { key: "all" | GroupHealth | "instances"; label: string; value: number; icon: typeof Server; accent: string; bg: string; unit: string }[] = [
    { key: "all", label: t("Groups"), value: groups.length, icon: Layers, accent: "text-primary", bg: "from-primary/10 to-transparent", unit: t("groups") },
    {
      key: "instances",
      label: t("Running instances"),
      value: groups.reduce((sum, g) => sum + runningCount(g, now), 0),
      icon: Server,
      accent: "text-emerald-500",
      bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
      unit: t("servers"),
    },
    {
      key: "healthy",
      label: t("Healthy"),
      value: groups.filter((g) => groupHealth(g, now) === "healthy").length,
      icon: HeartPulse,
      accent: "text-emerald-500",
      bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
      unit: t("groups"),
    },
    {
      key: "scaling",
      label: t("Scaling"),
      value: groups.filter((g) => groupHealth(g, now) === "scaling").length,
      icon: Loader2,
      accent: "text-sky-500",
      bg: "from-sky-50 to-transparent dark:from-sky-500/10",
      unit: t("groups"),
    },
  ];

  const createButton = (
    <Button
      onClick={() => navigate(CREATE_AUTOSCALE_PATH)}
      className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" />
      {t("Create group")}
    </Button>
  );

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Auto Scale"), path: AUTOSCALE_PATH },
        ]}
      />
      <PageHeader title={shellT("Auto Scale")} count={groups.length} countLabel={t("groups")} actions={createButton} />

      <KpiSection storageKey="auto-scale" className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const filterable = k.key !== "instances";
            const isActive = filterable && healthFilter === k.key;
            return (
              <button
                key={k.key}
                type="button"
                disabled={!filterable}
                onClick={() => {
                  if (!filterable) return;
                  setHealthFilter(k.key as "all" | GroupHealth);
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
              placeholder: t("Search by name or load balancer"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [healthFilter, modeFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setHealthFilter("all");
                setModeFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[1060px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col />
                <col className="w-[9%]" />
                <col className="w-[9.9%]" />
                <col className="w-[10.7%]" />
                <col className="w-[10.7%]" />
                <col className="w-[8.2%]" />
                <col className="w-[10.7%]" />
                <col className="w-[120px]" />
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
                              ? Array.from(new Set([...selected, ...pageRows.map((g) => g.id)]))
                              : selected.filter((id) => !pageRows.some((g) => g.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Scaling mode")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("Running / desired")}</TableHead>
                  <TableHead>{t("Load balancer")}</TableHead>
                  <TableHead>{t("Health")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Expand className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No Auto Scale groups yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("A group keeps enough cloud servers running for the load, adding and removing them by your rules.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10}>
                      <p className="py-12 text-center text-muted-foreground">{t("No groups match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((g) => {
                    const health = groupHealth(g, now);
                    const running = runningCount(g, now);
                    const isExpanded = expanded.includes(g.id);
                    const toggle = () =>
                      setExpanded((prev) => (prev.includes(g.id) ? prev.filter((k) => k !== g.id) : [...prev, g.id]));
                    return (
                      <Fragment key={g.id}>
                      <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex w-5 justify-center">
                            <Checkbox
                              checked={selected.includes(g.id)}
                              onCheckedChange={(c) =>
                                setSelected((prev) => (c ? [...prev, g.id] : prev.filter((id) => id !== g.id)))
                              }
                              aria-label={g.name}
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
                              <Expand className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(groupPath(g.id));
                                }}
                                className="block max-w-full text-start font-medium text-foreground hover:text-primary"
                              >
                                <TruncatedText text={g.name} ltr />
                              </button>
                              <TruncatedText text={g.image} ltr className="text-xs text-muted-foreground" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{modeLabel(g)}</TableCell>
                        <TableCell>
                          <TruncatedText text={`${t(g.region)} / ${g.zone}`} />
                        </TableCell>
                        <TableCell>
                          <div className="tabular-nums text-foreground">
                            {formatNumber(running)} / {formatNumber(g.desired)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("min {min} · max {max}", { min: formatNumber(g.min), max: formatNumber(g.max) })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {groupLb(g, lbs).name ? (
                            <TruncatedText text={groupLb(g, lbs).name!} ltr />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <HealthBadge health={health} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <TruncatedText text={formatDateTime(g.createdAt, language)} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate(groupPath(g.id))}>
                              <Eye className="h-3.5 w-3.5" /> {fx("view")}
                            </Button>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-48 bg-background">
                                <DropdownMenuItem onClick={() => setCapacityFor(g)}>
                                  <SlidersHorizontal className="me-2 h-4 w-4" />
                                  {t("Change capacity")}
                                </DropdownMenuItem>
                                {g.mode === "automatic" && (
                                  <DropdownMenuItem
                                    onClick={() => setPauseFor(g)}
                                  >
                                    {g.paused ? <Play className="me-2 h-4 w-4" /> : <Pause className="me-2 h-4 w-4" />}
                                    {g.paused ? t("Resume scaling") : t("Pause scaling")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteIds([g.id])}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {t("Delete group")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* The template and how the group behaves, out of the row. */}
                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={10} className="p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <ExpandField label={t("Image")} value={g.image} ltr />
                              <ExpandField
                                label={t("Instance size")}
                                value={t("{cpu} vCPU · {ram} GB RAM", { cpu: formatNumber(g.vcpu), ram: formatNumber(g.ramGb) })}
                              />
                              <ExpandField label={t("Boot disk")} value={`${formatNumber(g.diskGb)} ${t("GB")}`} />
                              <ExpandField label={t("Firewall")} value={g.firewall} ltr />
                              <ExpandField label={t("Scaling rules")} value={g.mode === "automatic" ? formatNumber(g.rules.length) : "-"} />
                              <ExpandField label={t("Cooldown")} value={t("{n} min", { n: formatNumber(g.cooldownMin) })} />
                              <ExpandField
                                label={t("Replace failed instances")}
                                value={
                                  !g.health.autoReplace
                                    ? t("Off")
                                    : g.health.source === "lb"
                                      ? t("Load balancer health check")
                                      : t("Instance status")
                                }
                              />
                              <ExpandField
                                label={t("Text members when the group scales")}
                                value={g.notify?.sms ? t("{n} members", { n: formatNumber(g.notify.userIds.length) }) : t("Off")}
                              />
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
        <DialogContent data-uniform-type className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Delete groups?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {(deleteIds?.length ?? 0) === 1
                ? t("This group will be deleted with all its resources, including its virtual machines, disks and IPs. This cannot be undone.")
                : t("{n} groups will be deleted with all their resources, including their virtual machines, disks and IPs. This cannot be undone.", {
                    n: formatNumber(deleteIds?.length ?? 0),
                  })}
            </DialogDescription>
          </DialogHeader>
          <TypeToConfirm value={phrase} onChange={setPhrase} />
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteIds(null)}>
              {fx("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!deletePhraseOk(phrase)}
              onClick={() => {
                removeGroups(deleteIds ?? []);
                setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
                toast.success(t("Groups deleted"));
                setDeleteIds(null);
              }}
            >
              {fx("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CapacityDialog group={capacityFor} onClose={() => setCapacityFor(null)} />
      <PauseDialog group={pauseFor} onClose={() => setPauseFor(null)} />
    </div>
  );
}

function ExpandField({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="mb-1 truncate text-xs text-muted-foreground" title={label}>
        {label}
      </div>
      <div className="truncate text-sm font-medium text-foreground" dir={ltr ? "ltr" : undefined} title={value}>
        {value}
      </div>
    </div>
  );
}
