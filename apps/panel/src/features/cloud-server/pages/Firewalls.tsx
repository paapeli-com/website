import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Trash2,
  X,
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
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { useServers } from "../lib/serverStore";
import {
  deleteFirewalls,
  detachServer,
  duplicateFirewall,
  groupsOf,
  setFirewallServers,
  useFirewalls,
  type FirewallGroup,
} from "../lib/firewallStore";
import { RuleTable } from "../firewallUi";
import { apiCall } from "../lib/openstackErrors";
import { ConfirmDialog, CREATE_FIREWALL_PATH, FIREWALLS_PATH, firewallPath, PageBreadcrumb, SERVERS_PATH, TruncatedText } from "../ui";
import { Pill, ServerOption } from "../wizard";

/* Firewall: the account's firewalls, each a set of inbound and outbound rules
 * applied to servers.
 *
 * The standard list: breadcrumb, header with count, the shared toolbar with
 * multi-select bulk actions, fixed columns with hover tooltips, pagination,
 * the empty state in place of the rows. No KPI cards: what they would count
 * (firewalls, rules, servers) is already in the columns.
 *
 * Opened, a row shows its rules both ways and the servers it is on, each
 * taken off with one click (asked first). Out in the row: edit. In the menu:
 * apply to servers, duplicate, delete. A firewall still on a server, or the
 * default one, is not deleted; the dialog says which and why.
 */

type SortKey = "updated" | "nameAsc" | "nameDesc" | "servers";

export default function Firewalls() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const groups = useFirewalls();
  const servers = useServers();
  const serverName = (id: string) => servers.find((s) => s.id === id)?.name ?? "-";

  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applying, setApplying] = useState<FirewallGroup | null>(null);
  const [duplicating, setDuplicating] = useState<FirewallGroup | null>(null);
  const [detaching, setDetaching] = useState<{ group: FirewallGroup; serverId: string } | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter(
        (g) =>
          (!q || g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q)) &&
          (usageFilter === "all" || (usageFilter === "used") === g.serverIds.length > 0),
      )
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "servers":
            return b.serverIds.length - a.serverIds.length;
          default:
            return b.updatedAt - a.updatedAt;
        }
      });
  }, [groups, search, usageFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((g) => selected.includes(g.id));

  const exportCsv = () => {
    const header = ["name", "description", "inboundRules", "outboundRules", "servers", "updated"];
    const rows = filtered.map((g) => [
      g.name,
      g.description ?? "",
      g.inbound.length,
      g.outbound.length,
      g.serverIds.map(serverName).join(" "),
      new Date(g.updatedAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `firewalls-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "usage",
      label: t("Applied to servers"),
      value: usageFilter,
      onChange: (v) => {
        setUsageFilter(v as "all" | "used" | "unused");
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "used", label: t("In use") },
        { value: "unused", label: t("Not in use") },
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "updated", label: t("Recently changed") },
    { key: "servers", label: t("Most servers first") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => navigate(CREATE_FIREWALL_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create firewall")}
    </Button>
  );

  const toDelete = groups.filter((g) => deleteIds?.includes(g.id));
  const blocking = toDelete.filter((g) => g.isDefault || g.serverIds.length > 0);
  /* Taking a server off its last firewall leaves it closed to all inbound traffic. */
  const lastOne = detaching ? groupsOf(groups, detaching.serverId).length === 1 : false;

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Security"), path: FIREWALLS_PATH }, { label: shellT("Firewall") }]} />
      <PageHeader title={shellT("Firewall")} count={groups.length} countLabel={t("firewalls")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name or description"),
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
                <col className="w-[23.2%]" />
                <col className="w-[12.5%]" />
                <col className="w-[9.8%]" />
                <col className="w-[12.5%]" />
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
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Rules")}</TableHead>
                  <TableHead>{t("Servers")}</TableHead>
                  <TableHead>{t("Updated")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <ShieldCheck className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No firewalls yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Decide which traffic can reach your servers and where they can connect to.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <p className="py-12 text-center text-muted-foreground">{t("No firewalls match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((g) => {
                    const isExpanded = expanded.includes(g.id);
                    const toggle = () => setExpanded((prev) => (prev.includes(g.id) ? prev.filter((k) => k !== g.id) : [...prev, g.id]));
                    return (
                      <Fragment key={g.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex w-5 justify-center">
                              <Checkbox
                                checked={selected.includes(g.id)}
                                onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, g.id] : prev.filter((id) => id !== g.id)))}
                                aria-label={g.name}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                              </span>
                              <TruncatedText text={g.name} ltr className="font-medium text-foreground" />
                              {g.isDefault && <Pill>{t("Default")}</Pill>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {g.description ? <TruncatedText text={t(g.description)} /> : "-"}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-3 text-sm text-foreground">
                              <span className="inline-flex items-center gap-1" title={t("Inbound rules")}>
                                <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatNumber(g.inbound.length)}
                              </span>
                              <span className="inline-flex items-center gap-1" title={t("Outbound rules")}>
                                <ArrowUpFromLine className="h-3.5 w-3.5 text-muted-foreground" />
                                {g.outbound.length ? formatNumber(g.outbound.length) : t("All")}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums text-foreground">{formatNumber(g.serverIds.length)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <TruncatedText text={formatDateTime(g.updatedAt, language)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate(firewallPath(g.id))}>
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
                                  <DropdownMenuItem onClick={() => setApplying(g)}>
                                    <Server className="me-2 h-4 w-4" />
                                    {t("Apply to servers")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDuplicating(g)}>
                                    <Copy className="me-2 h-4 w-4" />
                                    {t("Duplicate")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={g.isDefault || g.serverIds.length > 0}
                                    onClick={() => setDeleteIds([g.id])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {fx("delete")}
                                  </DropdownMenuItem>
                                  {(g.isDefault || g.serverIds.length > 0) && (
                                    <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                                      {g.isDefault ? t("The default firewall cannot be deleted.") : t("Take it off its servers first to delete it.")}
                                    </p>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* The rules both ways, and the servers it is on. */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <RulesBox
                                  title={t("Inbound rules")}
                                  icon={ArrowDownToLine}
                                  empty={t("No inbound rule: all inbound traffic is blocked.")}
                                  group={g}
                                  direction="inbound"
                                />
                                <RulesBox
                                  title={t("Outbound rules")}
                                  icon={ArrowUpFromLine}
                                  empty={t("No outbound rule: all outbound traffic is allowed.")}
                                  group={g}
                                  direction="outbound"
                                />
                              </div>
                              <div className="mt-3 rounded-lg border bg-background px-4 py-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">{t("Applied to")}</span>
                                  <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setApplying(g)}>
                                    <Plus className="size-3.5" />
                                    {t("Apply to servers")}
                                  </Button>
                                </div>
                                {g.serverIds.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">{t("Not applied to any server yet.")}</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {g.serverIds.map((id) => (
                                      <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs">
                                        <Server className="size-3.5 text-muted-foreground" />
                                        <button type="button" dir="ltr" className="text-foreground hover:text-primary" onClick={() => navigate(SERVERS_PATH)}>
                                          {serverName(id)}
                                        </button>
                                        <button
                                          type="button"
                                          aria-label={t("Take off")}
                                          title={t("Take off")}
                                          className="text-muted-foreground hover:text-destructive"
                                          onClick={() => setDetaching({ group: g, serverId: id })}
                                        >
                                          <X className="size-3.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
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

      <ApplyDialog group={applying} onClose={() => setApplying(null)} />
      <DuplicateDialog group={duplicating} onClose={() => setDuplicating(null)} />

      <ConfirmDialog
        open={!!detaching}
        onClose={() => setDetaching(null)}
        title={t("Take {name} off {server}?", {
          name: detaching?.group.name ?? "",
          server: detaching ? serverName(detaching.serverId) : "",
        })}
        description={
          lastOne
            ? t("This is the server's only firewall. Without one, all inbound traffic to it is blocked.")
            : t("The server loses the access this firewall allows, right away.")
        }
        destructive={lastOne}
        confirmLabel={t("Take off")}
        onConfirm={() => {
          if (!detaching) return;
          detachServer(detaching.group.id, detaching.serverId);
          toast.success(t("{name} taken off {server}", { name: detaching.group.name, server: serverName(detaching.serverId) }));
          setDetaching(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} firewalls?", { n: formatNumber(toDelete.length) })}
        description={
          blocking.length > 0
            ? t("These cannot be deleted now. Take them off their servers first; the default firewall is never deleted: {names}", {
                names: blocking.map((g) => g.name).join("، "),
              })
            : t("The firewalls and their rules are deleted. This cannot be undone.")
        }
        blocked={blocking.length > 0}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={async () => {
          const ids = deleteIds ?? [];
          setDeleteIds(null);
          if (!(await apiCall(() => (deleteFirewalls(ids), true), t))) return;
          setSelected((prev) => prev.filter((id) => !ids.includes(id)));
          toast.success(t("Firewalls deleted"));
        }}
      />
    </div>
  );
}

function RulesBox({
  title,
  icon: Icon,
  empty,
  group,
  direction,
}: {
  title: string;
  icon: typeof ArrowDownToLine;
  empty: string;
  group: FirewallGroup;
  direction: "inbound" | "outbound";
}) {
  const rules = group[direction];
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </p>
      {rules.length === 0 ? (
        <p className="py-1.5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <RuleTable rules={rules} direction={direction} />
      )}
    </div>
  );
}

/** Which servers it is on: tick or untick, then save. A server it is the only
    firewall of is marked, since taking it off closes that server. */
function ApplyDialog({ group, onClose }: { group: FirewallGroup | null; onClose: () => void }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const servers = useServers();
  const groups = useFirewalls();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(group?.serverIds ?? []), [group]);
  const removed = group ? group.serverIds.filter((id) => !ids.includes(id)) : [];
  const closing = removed.filter((id) => groupsOf(groups, id).length === 1);

  return (
    <Dialog open={!!group} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Apply to servers")}</DialogTitle>
          <DialogDescription>
            <span dir="ltr">{group?.name}</span>
          </DialogDescription>
        </DialogHeader>
        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No servers yet.")}</p>
        ) : (
          <div className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {servers.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/30">
                <Checkbox
                  checked={ids.includes(s.id)}
                  onCheckedChange={(c) => setIds((prev) => (c ? [...prev, s.id] : prev.filter((x) => x !== s.id)))}
                />
                <ServerOption server={s} />
              </label>
            ))}
          </div>
        )}
        {closing.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("{n} servers would be left with no firewall, and closed to all inbound traffic.", { n: formatNumber(closing.length) })}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={() => {
              if (!group) return;
              setFirewallServers(group.id, ids);
              toast.success(t("{name} now applies to {n} servers", { name: group.name, n: formatNumber(ids.length) }));
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

function DuplicateDialog({ group, onClose }: { group: FirewallGroup | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const groups = useFirewalls();
  const [name, setName] = useState("");
  useEffect(() => setName(group ? `${group.name}-copy` : ""), [group]);
  const taken = groups.some((g) => g.name === name);
  const ok = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(name) && !taken;
  return (
    <Dialog open={!!group} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Duplicate firewall")}</DialogTitle>
          <DialogDescription>{t("A copy with the same rules, applied to no server.")}</DialogDescription>
        </DialogHeader>
        <Input dir="ltr" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} className={cn(taken && "border-destructive")} />
        {taken && <p className="-mt-2 text-xs text-destructive">{t("A firewall with this name already exists.")}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (!group) return;
              duplicateFirewall(group.id, name);
              toast.success(t("{name} created", { name }));
              onClose();
            }}
          >
            {t("Duplicate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
