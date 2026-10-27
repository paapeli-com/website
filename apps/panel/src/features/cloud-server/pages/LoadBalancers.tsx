import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Download, Globe, Layers, MoreHorizontal, Pencil, Plus, Split, Trash2, Unlink } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { FLOATING_IP_MONTHLY, REGIONS } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import { useNetworks } from "../lib/networkStore";
import { useGroups } from "../lib/autoscaleStore";
import { allocateFloating, useFloatingIps } from "../lib/floatingStore";
import {
  attachPublicIp,
  deleteLoadBalancers,
  detachPublicIp,
  LB_BUSY_MS,
  operatingStatus,
  provisioningStatus,
  ruleLabel,
  useLoadBalancers,
  type LoadBalancer,
} from "../lib/loadBalancerStore";
import { apiCall } from "../lib/openstackErrors";
import { downloadText } from "../lib/sshKeyGen";
import { MEMBER_TONE, OPERATING_TONE, ruleMembers, StatusDot, useLbText } from "../lbUi";
import {
  ConfirmDialog,
  CREATE_LOAD_BALANCER_PATH,
  groupPath,
  loadBalancerPath,
  networkPath,
  NETWORKS_PATH,
  PageBreadcrumb,
  ProgressStatus,
  SERVERS_PATH,
  TruncatedText,
} from "../ui";
import { Pill } from "../wizard";

/* Load balancers: the account's Octavia load balancers.
 *
 * The standard list: breadcrumb, header with count, the shared toolbar with
 * multi-select bulk actions, fixed columns, pagination, the empty state in
 * place of the rows. Opened, a row shows where it is (network, private and
 * public address) and each traffic rule with the servers behind it and how
 * each is answering, Auto Scale instances among them. Out in the row: edit.
 * In the menu: the public IP, delete. A load balancer an Auto Scale group
 * sends its instances to is not deleted.
 */

type SortKey = "newest" | "nameAsc" | "nameDesc" | "servers";

export default function LoadBalancers() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const text = useLbText();
  const lbs = useLoadBalancers();
  const servers = useServers();
  const networks = useNetworks();
  const groups = useGroups();
  const floating = useFloatingIps();

  const [now, setNow] = useState(Date.now());
  const anyBusy = lbs.some((x) => provisioningStatus(x, now) !== "ACTIVE") || groups.some((g) => g.lb && now - g.changedAt < 8000);
  useEffect(() => {
    if (!anyBusy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyBusy]);
  useEffect(() => setNow(Date.now()), [lbs, groups]);

  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | "ONLINE" | "DEGRADED" | "ERROR" | "OFFLINE">("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publicFor, setPublicFor] = useState<LoadBalancer | null>(null);
  const [detaching, setDetaching] = useState<LoadBalancer | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const ctx = { servers, networks, groups, now };
  /* Every server behind every rule, with its health, and the whole from them. */
  const view = useMemo(
    () =>
      new Map(
        lbs.map((x) => {
          const rules = x.rules.map((r) => ({ rule: r, members: ruleMembers(x, r, ctx) }));
          const all = rules.flatMap((r) => r.members);
          return [x.id, { rules, all, health: operatingStatus(all.map((m) => m.status)) }] as const;
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lbs, servers, networks, groups, now],
  );
  const viewOf = (x: LoadBalancer) => view.get(x.id)!;
  const networkOf = (x: LoadBalancer) => networks.find((n) => n.id === x.networkId);
  const publicIpOf = (x: LoadBalancer) => floating.find((f) => f.id === x.floatingIpId);
  const groupsOf = (x: LoadBalancer) => groups.filter((g) => g.lb?.id === x.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lbs
      .filter(
        (x) =>
          (!q ||
            x.name.toLowerCase().includes(q) ||
            x.vipAddress.includes(q) ||
            (publicIpOf(x)?.address ?? "").includes(q) ||
            x.rules.some((r) => String(r.port) === q)) &&
          (healthFilter === "all" || viewOf(x).health === healthFilter),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "servers":
            return viewOf(b).all.length - viewOf(a).all.length;
          default:
            return b.createdAt - a.createdAt;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbs, search, healthFilter, sortKey, view, floating]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((x) => selected.includes(x.id));

  const exportCsv = () => {
    const header = ["name", "region", "network", "private_ip", "public_ip", "rules", "servers", "health"];
    const rows = filtered.map((x) => [
      x.name,
      x.region,
      networkOf(x)?.name ?? "",
      x.vipAddress,
      publicIpOf(x)?.address ?? "",
      x.rules.map((r) => ruleLabel(r)).join(" "),
      viewOf(x).all.length,
      viewOf(x).health,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText(`load-balancers-${Date.now()}.csv`, csv);
  };

  const filterFields: FilterField[] = [
    {
      key: "health",
      label: t("Health"),
      value: healthFilter,
      onChange: (v) => {
        setHealthFilter(v as typeof healthFilter);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "ONLINE", label: text.operating.ONLINE },
        { value: "DEGRADED", label: text.operating.DEGRADED },
        { value: "ERROR", label: text.operating.ERROR },
        { value: "OFFLINE", label: text.operating.OFFLINE },
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "newest", label: t("Newest first") },
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "servers", label: t("Most servers first") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => navigate(CREATE_LOAD_BALANCER_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create load balancer")}
    </Button>
  );

  const toDelete = lbs.filter((x) => deleteIds?.includes(x.id));
  const blocking = toDelete.filter((x) => groupsOf(x).length > 0);

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Networking"), path: NETWORKS_PATH }, { label: shellT("Load Balancer") }]} />
      <PageHeader title={shellT("Load Balancer")} count={lbs.length} countLabel={t("load balancers")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name, address or port"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: healthFilter !== "all" ? 1 : 0,
              onClear: () => {
                setHealthFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
            <Table className="min-w-[1050px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[19%]" />
                <col className="w-[9%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[120px]" />
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
                              ? Array.from(new Set([...selected, ...pageRows.map((x) => x.id)]))
                              : selected.filter((id) => !pageRows.some((x) => x.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead>{t("Traffic rules")}</TableHead>
                  <TableHead>{t("Servers")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lbs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Split className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No load balancers yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Spread traffic across several servers, and stop sending it to one that stops answering.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <p className="py-12 text-center text-muted-foreground">{t("No load balancers match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((x) => {
                    const isExpanded = expanded.includes(x.id);
                    const toggle = () => setExpanded((prev) => (prev.includes(x.id) ? prev.filter((k) => k !== x.id) : [...prev, x.id]));
                    const v = viewOf(x);
                    const prov = provisioningStatus(x, now);
                    const up = v.all.filter((m) => m.status === "ONLINE" || m.status === "NO_MONITOR").length;
                    const network = networkOf(x);
                    const pub = publicIpOf(x);
                    return (
                      <Fragment key={x.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={selected.includes(x.id)}
                                onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, x.id] : prev.filter((id) => id !== x.id)))}
                                aria-label={x.name}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Split className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <TruncatedText text={x.name} ltr className="font-medium text-foreground" />
                                <span className="block truncate text-xs text-muted-foreground">{t(x.region)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Mono className="text-foreground">{pub ? pub.address : x.vipAddress}</Mono>
                            <span className="block text-xs text-muted-foreground">
                              {pub ? (
                                <>
                                  {t("Private")} <span dir="ltr">{x.vipAddress}</span>
                                </>
                              ) : (
                                t("Private only")
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            {x.rules.length === 0 ? (
                              <span className="text-muted-foreground">{t("None")}</span>
                            ) : (
                              <>
                                <Mono className="text-foreground">{ruleLabel(x.rules[0])}</Mono>
                                {x.rules.length > 1 && (
                                  <span className="block text-xs text-muted-foreground">{t("+{n} more", { n: formatNumber(x.rules.length - 1) })}</span>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums text-foreground">
                            {v.all.length === 0 ? (
                              <span className="text-muted-foreground">{formatNumber(0)}</span>
                            ) : (
                              <>
                                {formatNumber(up)}/{formatNumber(v.all.length)}
                                <span className="block text-xs text-muted-foreground">{t("answering")}</span>
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {prov !== "ACTIVE" ? (
                              <ProgressStatus
                                label={prov === "PENDING_CREATE" ? t("Creating") : t("Applying changes")}
                                startedAt={x.busyUntil - LB_BUSY_MS}
                                durationMs={LB_BUSY_MS}
                                now={now}
                              />
                            ) : (
                              <StatusDot tone={OPERATING_TONE[v.health]} label={text.operating[v.health]} />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <TruncatedText text={formatDateTime(x.createdAt, language)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate(loadBalancerPath(x.id))}>
                                <Pencil className="h-3.5 w-3.5" />
                                {t("Edit")}
                              </Button>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-52 bg-background">
                                  <DropdownMenuItem onClick={() => setPublicFor(x)}>
                                    <Globe className="me-2 h-4 w-4" />
                                    {pub ? t("Change public IP") : t("Attach a public IP")}
                                  </DropdownMenuItem>
                                  {pub && (
                                    <DropdownMenuItem onClick={() => setDetaching(x)}>
                                      <Unlink className="me-2 h-4 w-4" />
                                      {t("Detach public IP")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={groupsOf(x).length > 0}
                                    onClick={() => setDeleteIds([x.id])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {fx("delete")}
                                  </DropdownMenuItem>
                                  {groupsOf(x).length > 0 && (
                                    <p className="px-2 pb-1.5 text-xs text-muted-foreground">{t("An Auto Scale group uses it.")}</p>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={9} className="p-4">
                              {/* Where it is, at a glance. */}
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-background px-4 py-3 md:grid-cols-4">
                                <Detail label={t("Private network")}>
                                  {network ? (
                                    <button type="button" className="text-start hover:text-primary" onClick={() => navigate(networkPath(network.id))}>
                                      <Mono>{network.name}</Mono>
                                      <span className="block text-xs font-normal text-muted-foreground">
                                        <span dir="ltr">{network.cidr}</span>
                                      </span>
                                    </button>
                                  ) : (
                                    "-"
                                  )}
                                </Detail>
                                <Detail label={t("Private address")}>
                                  <Mono>{x.vipAddress}</Mono>
                                </Detail>
                                <Detail label={t("Public IP")}>
                                  {pub ? (
                                    <Mono>{pub.address}</Mono>
                                  ) : (
                                    <button type="button" className="text-primary hover:underline" onClick={() => setPublicFor(x)}>
                                      {t("Attach a public IP")}
                                    </button>
                                  )}
                                </Detail>
                                <Detail label={t("Auto Scale")}>
                                  {groupsOf(x).length === 0
                                    ? t("None")
                                    : groupsOf(x).map((g) => (
                                        <button key={g.id} type="button" className="block text-start hover:text-primary" onClick={() => navigate(groupPath(g.id))}>
                                          <span dir="ltr">{g.name}</span>
                                        </button>
                                      ))}
                                </Detail>
                                {x.description && (
                                  <Detail label={t("Description")} className="col-span-2 md:col-span-4">
                                    <span className="font-normal">{x.description}</span>
                                  </Detail>
                                )}
                              </div>

                              {/* Each rule and who is behind it. */}
                              {v.rules.length === 0 ? (
                                <div className="mt-3 rounded-lg border bg-background px-4 py-4 text-sm text-muted-foreground">
                                  {t("No traffic rule yet. Add one to start sending traffic to your servers.")}{" "}
                                  <button type="button" className="text-primary hover:underline" onClick={() => navigate(loadBalancerPath(x.id))}>
                                    {t("Add a rule")}
                                  </button>
                                </div>
                              ) : (
                                v.rules.map(({ rule, members }) => (
                                  <div key={rule.id} className="mt-3 rounded-lg border bg-background">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-muted-foreground">
                                      <span dir="ltr" className="font-mono text-[13px] font-medium text-foreground">
                                        {ruleLabel(rule)}
                                      </span>
                                      <span>{text.algorithm[rule.algorithm]}</span>
                                      {rule.persistence !== "NONE" && <span>{text.persistence[rule.persistence]}</span>}
                                      <span>
                                        {t("Health check")}: {text.monitor(rule.monitor)}
                                      </span>
                                    </div>
                                    {members.length === 0 ? (
                                      <p className="border-t px-4 py-4 text-sm text-muted-foreground">{t("No server is behind this rule yet.")}</p>
                                    ) : (
                                      <table className="w-full border-t text-sm">
                                        <thead>
                                          <tr className="text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                                            <th>{t("Server")}</th>
                                            <th>{t("Address")}</th>
                                            <th>{t("Weight")}</th>
                                            <th>{t("Health")}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {members.map((m) => (
                                            <tr key={m.key} className="border-t [&>td]:px-4 [&>td]:py-2">
                                              <td>
                                                <button
                                                  type="button"
                                                  className="flex min-w-0 items-center gap-2 text-start hover:text-primary"
                                                  onClick={() => navigate(m.group ? groupPath(m.group.id) : SERVERS_PATH)}
                                                >
                                                  <span dir="ltr" className="truncate font-medium">
                                                    {m.name}
                                                  </span>
                                                  {m.group && (
                                                    <Pill>
                                                      <Layers className="me-1 size-3" />
                                                      {t("Auto Scale")}
                                                    </Pill>
                                                  )}
                                                  {m.backup && <Pill>{t("Backup")}</Pill>}
                                                </button>
                                              </td>
                                              <td>
                                                <span dir="ltr" className="font-mono text-[13px] text-foreground">
                                                  {m.ip}:{rule.targetPort}
                                                </span>
                                              </td>
                                              <td className="tabular-nums text-muted-foreground">{formatNumber(m.weight)}</td>
                                              <td>
                                                <StatusDot tone={MEMBER_TONE[m.status]} label={text.member[m.status]} />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                ))
                              )}
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

      <PublicIpDialog lb={publicFor} onClose={() => setPublicFor(null)} />

      <ConfirmDialog
        open={!!detaching}
        onClose={() => setDetaching(null)}
        title={t("Detach the public IP from {name}?", { name: detaching?.name ?? "" })}
        description={t("The load balancer can no longer be reached from the internet. The public IP stays in your account.")}
        destructive
        confirmLabel={t("Detach")}
        onConfirm={async () => {
          const lb = detaching;
          setDetaching(null);
          if (lb && (await apiCall(() => (detachPublicIp(lb.id), true), t))) toast.success(t("Public IP detached"));
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} load balancers?", { n: formatNumber(toDelete.length) })}
        description={
          blocking.length > 0
            ? t("Auto Scale groups send their instances to these. Change or delete the groups first: {names}", {
                names: blocking.flatMap((x) => groupsOf(x).map((g) => g.name)).join("، "),
              })
            : t("Its traffic rules are deleted with it and traffic stops right away. A public IP on it stays in your account.")
        }
        acknowledge={blocking.length > 0 ? undefined : t("I confirm that traffic to these load balancers stops and they cannot be restored.")}
        blocked={blocking.length > 0}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={async () => {
          const ids = deleteIds ?? [];
          setDeleteIds(null);
          if (await apiCall(() => (deleteLoadBalancers(ids), true), t)) {
            setSelected((prev) => prev.filter((id) => !ids.includes(id)));
            toast.success(t("Load balancers deleted"));
          }
        }}
      />
    </div>
  );
}

/** An address on its own line, left-to-right inside but at the start of the
    line in the page's direction. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block truncate", className)}>
      <span dir="ltr" className="font-mono text-[13px]">
        {children}
      </span>
    </span>
  );
}

function Detail({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

/** A public IP for the load balancer: one of the account's free ones in its
    region, or a new one. */
export function PublicIpDialog({ lb, onClose }: { lb: LoadBalancer | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const free = useFloatingIps().filter((f) => lb && f.region === lb.region && !f.attachedTo);
  const [choice, setChoice] = useState("new");
  useEffect(() => setChoice(free[0]?.id ?? "new"), [lb?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={!!lb} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lb?.floatingIpId ? t("Change public IP") : t("Attach a public IP")}</DialogTitle>
          <DialogDescription>
            {t("Reach {name} from the internet at this address.", { name: lb?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <Select value={choice} onValueChange={setChoice}>
          <SelectTrigger className="h-11" aria-label={t("Public IP")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {free.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span dir="ltr" className="font-mono">
                  {f.address}
                </span>
                {f.description && <span className="text-muted-foreground"> · {f.description}</span>}
              </SelectItem>
            ))}
            <SelectItem value="new">
              {t("A new public IP")} <span className="text-muted-foreground">({format(FLOATING_IP_MONTHLY[currency])} {t("/ month")})</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={async () => {
              if (!lb) return;
              const done = await apiCall(() => {
                const id = choice === "new" ? allocateFloating(lb.region, REGIONS.find((r) => r.city === lb.region)?.zones[0] ?? "AZ-1", lb.name).id : choice;
                attachPublicIp(lb.id, id);
                return true;
              }, t);
              if (!done) return;
              toast.success(t("Public IP attached to {name}", { name: lb.name }));
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
