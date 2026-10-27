import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Download, Layers, Link2, MoreHorizontal, Pencil, Plus, Split, Trash2, Unlink, Waypoints } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
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
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { serverStatus, useServers } from "../lib/serverStore";
import {
  connectServer,
  deleteNetworks,
  disconnectServer,
  fixedIpProblem,
  freeAddresses,
  setPortSecurity,
  useNetworks,
  type NetworkPort,
  type PrivateNetwork,
} from "../lib/networkStore";
import { apiCall } from "../lib/openstackErrors";
import { useGroups } from "../lib/autoscaleStore";
import { loadBalancersOf, releaseServersFromLoadBalancers, useLoadBalancers } from "../lib/loadBalancerStore";
import { downloadText } from "../lib/sshKeyGen";
import { ConfirmDialog, CREATE_NETWORK_PATH, groupPath, loadBalancerPath, networkPath, NETWORKS_PATH, PageBreadcrumb, SERVERS_PATH, TruncatedText } from "../ui";
import { Pill, ServerOption } from "../wizard";

/* Private Networks: the account's own networks between its servers.
 *
 * The standard list: breadcrumb, header with count, the shared toolbar with
 * multi-select bulk actions, fixed columns, pagination, the empty state in
 * place of the rows. Opened, a row shows the subnet's settings and the
 * servers on it, each with its address and port security; servers are
 * connected and disconnected there. Out in the row: edit. In the menu:
 * connect a server, delete. A network with servers on it is not deleted.
 *
 * Every change goes through apiCall, so a refusal (an address already used,
 * no address left) is a toast in the person's language.
 */

type SortKey = "newest" | "nameAsc" | "nameDesc" | "servers";

export default function PrivateNetworks() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const networks = useNetworks();
  const servers = useServers();
  const groups = useGroups();
  const lbs = useLoadBalancers();
  const groupsOn = (x: PrivateNetwork) => groups.filter((g) => g.network?.id === x.id);

  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connecting, setConnecting] = useState<PrivateNetwork | null>(null);
  const [disconnecting, setDisconnecting] = useState<{ network: PrivateNetwork; port: NetworkPort } | null>(null);
  const [securityOff, setSecurityOff] = useState<{ network: PrivateNetwork; port: NetworkPort } | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const serverName = (id: string) => servers.find((s) => s.id === id)?.name ?? "-";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return networks
      .filter(
        (x) =>
          (!q || x.name.toLowerCase().includes(q) || x.cidr.includes(q) || x.ports.some((p) => p.ip.includes(q))) &&
          (usageFilter === "all" || (usageFilter === "used") === x.ports.length > 0),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "servers":
            return b.ports.length - a.ports.length;
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [networks, search, usageFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((x) => selected.includes(x.id));

  const exportCsv = () => {
    const header = ["name", "region", "subnet", "gateway", "dhcp", "dns", "mtu", "servers"];
    const rows = filtered.map((x) => [
      x.name,
      x.region,
      x.cidr,
      x.gatewayIp ?? "",
      x.dhcp ? x.pools.map((p) => `${p.start}-${p.end}`).join(" ") : "off",
      x.dns.join(" "),
      x.mtu,
      x.ports.map((p) => `${serverName(p.serverId)}=${p.ip}`).join(" "),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText(`private-networks-${Date.now()}.csv`, csv);
  };

  const filterFields: FilterField[] = [
    {
      key: "usage",
      label: t("Servers"),
      value: usageFilter,
      onChange: (v) => {
        setUsageFilter(v as "all" | "used" | "unused");
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "used", label: t("With servers") },
        { value: "unused", label: t("Without servers") },
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
    <Button onClick={() => navigate(CREATE_NETWORK_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create private network")}
    </Button>
  );

  const toDelete = networks.filter((x) => deleteIds?.includes(x.id));
  const blocking = toDelete.filter((x) => x.ports.length > 0 || groupsOn(x).length > 0);
  /* Load balancers the server being disconnected is behind, on this network. */
  const behind = disconnecting ? loadBalancersOf(lbs, disconnecting.port.serverId).filter((l) => l.networkId === disconnecting.network.id) : [];

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Networking"), path: NETWORKS_PATH }, { label: shellT("Private Networks") }]} />
      <PageHeader title={shellT("Private Networks")} count={networks.length} countLabel={t("networks")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name, subnet or address"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: usageFilter !== "all" ? 1 : 0,
              onClear: () => {
                setUsageFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[1000px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[14%]" />
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
                  <TableHead>{t("Subnet")}</TableHead>
                  <TableHead>{t("Gateway")}</TableHead>
                  <TableHead>DHCP</TableHead>
                  <TableHead>{t("Servers")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Waypoints className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No private networks yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Connect your servers to each other on a network of your own, closed to the internet and free of charge.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <p className="py-12 text-center text-muted-foreground">{t("No networks match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((x) => {
                    const isExpanded = expanded.includes(x.id);
                    const toggle = () => setExpanded((prev) => (prev.includes(x.id) ? prev.filter((k) => k !== x.id) : [...prev, x.id]));
                    return (
                      <Fragment key={x.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex w-5 justify-center">
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
                                <Waypoints className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <TruncatedText text={x.name} ltr className="font-medium text-foreground" />
                                <span className="block text-xs text-muted-foreground">{t(x.region)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span dir="ltr" className="font-mono text-[13px] text-foreground">
                              {x.cidr}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {x.gatewayIp ? (
                              <span dir="ltr" className="font-mono text-[13px]">
                                {x.gatewayIp}
                              </span>
                            ) : (
                              t("None")
                            )}
                          </TableCell>
                          <TableCell>{x.dhcp ? <Pill tone="ok">{t("On")}</Pill> : <Pill>{t("Off")}</Pill>}</TableCell>
                          <TableCell className="tabular-nums text-foreground">{formatNumber(x.ports.length)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <TruncatedText text={formatDateTime(x.createdAt, language)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate(networkPath(x.id))}>
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
                                  <DropdownMenuItem onClick={() => setConnecting(x)}>
                                    <Link2 className="me-2 h-4 w-4" />
                                    {t("Connect a server")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={x.ports.length > 0 || groupsOn(x).length > 0}
                                    onClick={() => setDeleteIds([x.id])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {fx("delete")}
                                  </DropdownMenuItem>
                                  {(x.ports.length > 0 || groupsOn(x).length > 0) && (
                                    <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                                      {x.ports.length > 0 ? t("Disconnect its servers first to delete it.") : t("An Auto Scale group uses it.")}
                                    </p>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={9} className="p-4">
                              {/* The subnet's settings, read at a glance. */}
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-background px-4 py-3 md:grid-cols-4 xl:grid-cols-7">
                                <Detail label={t("Subnet")}>
                                  <Mono>{x.cidr}</Mono>
                                </Detail>
                                <Detail label={t("Gateway")}>{x.gatewayIp ? <Mono>{x.gatewayIp}</Mono> : t("None")}</Detail>
                                <Detail label="DHCP">{x.dhcp ? <Pill tone="ok">{t("On")}</Pill> : <Pill>{t("Off")}</Pill>}</Detail>
                                <Detail label={t("Address range")}>
                                  {x.pools.map((p, i) => (
                                    <Mono key={i}>
                                      {p.start} - {p.end}
                                    </Mono>
                                  ))}
                                </Detail>
                                <Detail label="DNS">{x.dns.length ? x.dns.map((d) => <Mono key={d}>{d}</Mono>) : "-"}</Detail>
                                <Detail label={t("Static routes")}>
                                  {x.routes.length
                                    ? x.routes.map((r) => (
                                        <Mono key={r.destination}>
                                          {r.destination} → {r.nexthop}
                                        </Mono>
                                      ))
                                    : t("None")}
                                </Detail>
                                <Detail label={t("MTU")}>
                                  <span className="tabular-nums">{formatNumber(x.mtu)}</span>
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    {t("{n} free addresses", { n: formatNumber(freeAddresses(x)) })}
                                  </span>
                                </Detail>
                              </div>

                              {/* The servers on it. */}
                              <div className="mt-3 rounded-lg border bg-background">
                                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                                  <span className="text-xs font-medium text-muted-foreground">{t("Connected servers")}</span>
                                  <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setConnecting(x)}>
                                    <Link2 className="size-3.5" />
                                    {t("Connect a server")}
                                  </Button>
                                </div>
                                {x.ports.length === 0 ? (
                                  <p className="border-t px-4 py-4 text-sm text-muted-foreground">{t("No server is connected yet.")}</p>
                                ) : (
                                  <table className="w-full border-t text-sm">
                                    <thead>
                                      <tr className="text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                                        <th>{t("Server")}</th>
                                        <th>{t("Private IP")}</th>
                                        <th>{t("Status")}</th>
                                        <th>{t("Port security")}</th>
                                        <th className="w-12" />
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {x.ports.map((p) => {
                                        if (p.device)
                                          return (
                                            <tr key={p.id} className="border-t [&>td]:px-4 [&>td]:py-2">
                                              <td>
                                                <button
                                                  type="button"
                                                  className="flex items-center gap-2.5 text-start hover:text-primary"
                                                  onClick={() => navigate(loadBalancerPath(p.device!.id))}
                                                >
                                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <Split className="size-3.5" />
                                                  </span>
                                                  <span className="min-w-0">
                                                    <span dir="ltr" className="block truncate text-sm font-medium text-foreground">
                                                      {p.device.name}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">{t("Load balancer")}</span>
                                                  </span>
                                                </button>
                                              </td>
                                              <td>
                                                <span dir="ltr" className="font-mono text-[13px] text-foreground">
                                                  {p.ip}
                                                </span>
                                              </td>
                                              <td className="text-muted-foreground">-</td>
                                              <td className="text-muted-foreground">-</td>
                                              <td />
                                            </tr>
                                          );
                                        const s = servers.find((sv) => sv.id === p.serverId);
                                        const status = s ? serverStatus(s) : null;
                                        return (
                                          <tr key={p.id} className="border-t [&>td]:px-4 [&>td]:py-2">
                                            <td>
                                              {s ? (
                                                <button type="button" className="hover:text-primary" onClick={() => navigate(SERVERS_PATH)}>
                                                  <ServerOption server={s} />
                                                </button>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td>
                                              <span dir="ltr" className="font-mono text-[13px] text-foreground">
                                                {p.ip}
                                              </span>
                                            </td>
                                            <td className="text-muted-foreground">
                                              {status === "running" ? t("Running") : status === "stopped" ? t("Stopped") : status ? t("Creating") : "-"}
                                            </td>
                                            <td>
                                              <Switch
                                                checked={p.portSecurity}
                                                onCheckedChange={(on) =>
                                                  on
                                                    ? void apiCall(() => setPortSecurity(x.id, p.serverId, true), t)
                                                    : setSecurityOff({ network: x, port: p })
                                                }
                                                aria-label={t("Port security")}
                                              />
                                            </td>
                                            <td className="text-end">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                aria-label={t("Disconnect")}
                                                title={t("Disconnect")}
                                                onClick={() => setDisconnecting({ network: x, port: p })}
                                              >
                                                <Unlink className="size-4" />
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                                {groupsOn(x).map((g) => (
                                  <p key={g.id} className="flex items-center gap-1.5 border-t px-4 py-2.5 text-xs text-muted-foreground">
                                    <Layers className="size-3.5 shrink-0" />
                                    <span>
                                      {t("The instances of Auto Scale group {name} are on this network too.", { name: g.name })}{" "}
                                      <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(groupPath(g.id))}>
                                        {t("Open group")}
                                      </button>
                                    </span>
                                  </p>
                                ))}
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

      <ConnectDialog network={connecting} onClose={() => setConnecting(null)} />

      <ConfirmDialog
        open={!!disconnecting}
        onClose={() => setDisconnecting(null)}
        title={t("Disconnect {server} from {name}?", {
          server: disconnecting ? serverName(disconnecting.port.serverId) : "",
          name: disconnecting?.network.name ?? "",
        })}
        description={
          t("The server loses its address {ip} on this network right away, and can no longer reach the other servers on it.", {
            ip: disconnecting?.port.ip ?? "",
          }) +
          (behind.length > 0
            ? " " + t("It is also taken out of these load balancers: {names}", { names: behind.map((l) => l.name).join("، ") })
            : "")
        }
        destructive
        confirmLabel={t("Disconnect")}
        onConfirm={async () => {
          if (!disconnecting) return;
          const { network, port } = disconnecting;
          setDisconnecting(null);
          if (
            await apiCall(() => {
              disconnectServer(network.id, port.serverId);
              releaseServersFromLoadBalancers([port.serverId], network.id);
              return true;
            }, t)
          )
            toast.success(t("{server} disconnected from {name}", { server: serverName(port.serverId), name: network.name }));
        }}
      />

      <ConfirmDialog
        open={!!securityOff}
        onClose={() => setSecurityOff(null)}
        title={t("Turn off port security for {server}?", { server: securityOff ? serverName(securityOff.port.serverId) : "" })}
        description={t(
          "Firewalls stop applying to this server's traffic on this network, and it may send traffic from any address. Turn it off only for a server that routes for others, such as a VPN or firewall server.",
        )}
        acknowledge={t("I confirm that this server needs port security off.")}
        destructive
        confirmLabel={t("Turn off")}
        onConfirm={async () => {
          if (!securityOff) return;
          const { network, port } = securityOff;
          setSecurityOff(null);
          await apiCall(() => setPortSecurity(network.id, port.serverId, false), t);
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} networks?", { n: formatNumber(toDelete.length) })}
        description={
          blocking.length > 0
            ? t("These still have servers, load balancers or Auto Scale groups on them. Remove those first: {names}", {
                names: blocking.map((x) => x.name).join("، "),
              })
            : t("The networks and their settings are deleted. This cannot be undone.")
        }
        blocked={blocking.length > 0}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={async () => {
          const ids = deleteIds ?? [];
          setDeleteIds(null);
          if (await apiCall(() => (deleteNetworks(ids), true), t)) {
            setSelected((prev) => prev.filter((id) => !ids.includes(id)));
            toast.success(t("Networks deleted"));
          }
        }}
      />
    </div>
  );
}

/** An address on its own line: left-to-right inside, but placed at the start
    of the line in the page's direction, so in Persian it sits on the right. */
function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="block">
      <span dir="ltr" className="font-mono text-[13px]">
        {children}
      </span>
    </span>
  );
}

function Detail({ label, ltr, children }: { label: string; ltr?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div dir={ltr ? "ltr" : undefined} className={cn("mt-0.5 break-words text-sm font-medium text-foreground", ltr && "text-start font-mono text-[13px]")}>
        {children}
      </div>
    </div>
  );
}

/** A server joins the network: any server in its region not on it yet, with
    the next free address or one chosen, checked as it is typed. */
function ConnectDialog({ network, onClose }: { network: PrivateNetwork | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const networks = useNetworks();
  const live = network ? networks.find((x) => x.id === network.id) ?? network : null;
  const candidates = useServers().filter((s) => live && s.region === live.region && !live.ports.some((p) => p.serverId === s.id));
  const [serverId, setServerId] = useState("");
  const [mode, setMode] = useState<"auto" | "fixed">("auto");
  const [ip, setIp] = useState("");

  useEffect(() => {
    setServerId("");
    setMode("auto");
    setIp("");
  }, [network?.id]);

  const problem = live && mode === "fixed" && ip ? fixedIpProblem(live, ip) : undefined;
  const ok = !!serverId && (mode === "auto" || (!!ip && !problem));

  return (
    <Dialog open={!!network} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Connect a server")}</DialogTitle>
          <DialogDescription>
            <span dir="ltr">
              {live?.name} · {live?.cidr}
            </span>
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Every server in this region is already on this network.")}</p>
        ) : (
          <div className="space-y-4">
            <Select value={serverId} onValueChange={setServerId}>
              <SelectTrigger className="h-11" aria-label={t("Server")}>
                {serverId ? <ServerOption server={candidates.find((s) => s.id === serverId)!} /> : <SelectValue placeholder={t("Choose a server")} />}
              </SelectTrigger>
              <SelectContent>
                {candidates.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <ServerOption server={s} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("Private IP")}</p>
              <div className="inline-flex rounded-lg border border-border p-0.5">
                {(
                  [
                    ["auto", t("Next free address")],
                    ["fixed", t("A chosen address")],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMode(v)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      mode === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "fixed" && (
                <>
                  <Input
                    dir="ltr"
                    value={ip}
                    onChange={(e) => setIp(e.target.value.trim())}
                    placeholder={live?.pools[0]?.start ?? "10.0.0.20"}
                    aria-invalid={!!problem}
                    className={cn("h-10 font-mono", problem && "border-destructive")}
                  />
                  {problem && <p className="text-xs text-destructive">{t(problem.text, problem.vars)}</p>}
                </>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={async () => {
              if (!live) return;
              const port = await apiCall(() => connectServer(live.id, serverId, mode === "fixed" ? ip : undefined), t);
              if (!port) return;
              toast.success(t("Connected with the address {ip}", { ip: port.ip }));
              onClose();
            }}
          >
            {t("Connect")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
