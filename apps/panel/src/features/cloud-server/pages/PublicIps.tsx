import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Globe, Link2, Lock, MoreHorizontal, Plus, ShieldCheck, Trash2, Unlink } from "lucide-react";
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
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import { REGIONS } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import { groupInstances, useGroups } from "../lib/autoscaleStore";
import {
  HOLD_DAYS,
  MAX_RESERVED,
  canRelease,
  releasableAt,
  releaseIps,
  reserveIp,
  useReservedIps,
  type ReservedIp,
} from "../lib/ipStore";
import { GPU_SERVERS_PATH, PageBreadcrumb, SERVERS_PATH, TruncatedText, groupPath } from "../ui";

/* Public IPs: every public address the account has.
 *
 * The addresses of its servers (primary IPv4, IPv6, an additional IPv4),
 * Auto Scale instances included, and the standalone IPs it reserves here.
 * The server list's standard: breadcrumb, header with count, KPI cards that
 * filter, the shared toolbar with multi-select, fixed columns with hover
 * tooltips, pagination, the empty state in place of the rows.
 *
 * Reserving is a small popup that says the two rules up front: at most
 * three, and none released in its first three days. A reserved IP that is
 * attached, or still in those days, cannot be released, and says why.
 */

type IpType = "primary" | "additional" | "reserved";

interface IpRow {
  key: string;
  address: string;
  version: "IPv4" | "IPv6";
  type: IpType;
  attachedName?: string;
  attachedPath?: string;
  region: string;
  zone: string;
  createdAt: number;
  reserved?: ReservedIp;
}

type SortKey = "created" | "address";

export default function PublicIps() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const servers = useServers();
  const groups = useGroups();
  const reserved = useReservedIps();

  const rows = useMemo<IpRow[]>(() => {
    const out: IpRow[] = [];
    for (const s of servers) {
      const path = s.kind === "gpu" ? GPU_SERVERS_PATH : SERVERS_PATH;
      const base = { attachedName: s.name, attachedPath: path, region: s.region, zone: s.zone, createdAt: s.createdAt };
      out.push({ key: `${s.id}-v4`, address: s.ipv4, version: "IPv4", type: "primary", ...base });
      if (s.ipv6) out.push({ key: `${s.id}-v6`, address: s.ipv6, version: "IPv6", type: "primary", ...base });
      for (const ip of s.extraIps ?? []) {
        if (!ip.reservedId) out.push({ key: `${s.id}-${ip.address}`, address: ip.address, version: "IPv4", type: "additional", ...base });
      }
    }
    for (const g of groups) {
      for (const i of groupInstances(g)) {
        out.push({
          key: `${i.id}-v4`,
          address: i.publicIp,
          version: "IPv4",
          type: "primary",
          attachedName: i.name,
          attachedPath: groupPath(g.id),
          region: g.region,
          zone: g.zone,
          createdAt: i.createdAt,
        });
      }
    }
    for (const r of reserved) {
      out.push({
        key: r.id,
        address: r.address,
        version: "IPv4",
        type: "reserved",
        attachedName: r.attachedTo?.serverName,
        attachedPath: r.attachedTo ? SERVERS_PATH : undefined,
        region: r.region,
        zone: r.zone,
        createdAt: r.createdAt,
        reserved: r,
      });
    }
    return out;
  }, [servers, groups, reserved]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | IpType>("all");
  const [attachFilter, setAttachFilter] = useState<"all" | "attached" | "free">("all");
  const [versionFilter, setVersionFilter] = useState<"all" | "IPv4" | "IPv6">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [releaseIds, setReleaseIds] = useState<string[] | null>(null);

  const typeLabel: Record<IpType, string> = { primary: t("Primary"), additional: t("Additional"), reserved: t("Reserved") };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (!q || r.address.includes(q) || (r.attachedName ?? "").toLowerCase().includes(q)) &&
          (typeFilter === "all" || r.type === typeFilter) &&
          (versionFilter === "all" || r.version === versionFilter) &&
          (attachFilter === "all" || (attachFilter === "attached") === !!r.attachedName),
      )
      .sort((a, b) => (sortKey === "address" ? a.address.localeCompare(b.address) : b.createdAt - a.createdAt));
  }, [rows, search, typeFilter, versionFilter, attachFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  /* Only a releasable reserved IP can be picked for the bulk action. */
  const selectable = (r: IpRow) => !!r.reserved && canRelease(r.reserved);
  const pickable = pageRows.filter(selectable);
  const allOnPageSelected = pickable.length > 0 && pickable.every((r) => selected.includes(r.key));
  const full = reserved.length >= MAX_RESERVED;

  const copy = (v: string) =>
    void navigator.clipboard?.writeText(v).then(
      () => toast.success(t("Copied")),
      () => toast.error(t("Could not copy")),
    );

  const exportCsv = () => {
    const header = ["address", "version", "type", "attachedTo", "region", "zone", "created"];
    const lines = filtered.map((r) => [r.address, r.version, r.type, r.attachedName ?? "", r.region, r.zone, new Date(r.createdAt).toISOString()]);
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `public-ips-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "type",
      label: t("Type"),
      value: typeFilter,
      onChange: (v) => {
        setTypeFilter(v as "all" | IpType);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "primary", label: typeLabel.primary },
        { value: "additional", label: typeLabel.additional },
        { value: "reserved", label: typeLabel.reserved },
      ],
    },
    {
      key: "version",
      label: t("Version"),
      value: versionFilter,
      onChange: (v) => {
        setVersionFilter(v as "all" | "IPv4" | "IPv6");
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "IPv4", label: "IPv4" },
        { value: "IPv6", label: "IPv6" },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "created", label: t("Newest first") },
    { key: "address", label: t("By address") },
  ];

  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "release", label: t("Release"), icon: Trash2, destructive: true, onSelect: () => setReleaseIds(selected) },
  ];

  const kpis: { key: "all" | "attached" | "free" | "reserved"; label: string; value: React.ReactNode; icon: typeof Globe; accent: string; bg: string }[] = [
    { key: "all", label: t("Total IPs"), value: formatNumber(rows.length), icon: Globe, accent: "text-primary", bg: "from-primary/10 to-transparent" },
    {
      key: "attached",
      label: t("Attached"),
      value: formatNumber(rows.filter((r) => r.attachedName).length),
      icon: Link2,
      accent: "text-emerald-500",
      bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
    },
    {
      key: "free",
      label: t("Not attached"),
      value: formatNumber(rows.filter((r) => !r.attachedName).length),
      icon: Unlink,
      accent: "text-muted-foreground",
      bg: "from-muted/40 to-transparent",
    },
    {
      key: "reserved",
      label: t("Reserved"),
      value: `${formatNumber(reserved.length)} / ${formatNumber(MAX_RESERVED)}`,
      icon: ShieldCheck,
      accent: "text-violet-500",
      bg: "from-violet-50 to-transparent dark:from-violet-500/10",
    },
  ];

  const reserveButton = (
    <Button
      onClick={() => setReserveOpen(true)}
      disabled={full}
      title={full ? t("You already have {n} reserved IPs.", { n: formatNumber(MAX_RESERVED) }) : undefined}
      className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" />
      {t("Reserve an IP")}
    </Button>
  );

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Networking"), path: `${CLOUD_SERVER_BASE}/public-ips` },
          { label: shellT("Public IPs") },
        ]}
      />
      <PageHeader title={shellT("Public IPs")} count={rows.length} countLabel={t("IPs")} actions={reserveButton} />

      <KpiSection storageKey="public-ips" className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const isActive =
              (k.key === "all" && typeFilter === "all" && attachFilter === "all") ||
              (k.key === "reserved" && typeFilter === "reserved") ||
              ((k.key === "attached" || k.key === "free") && attachFilter === k.key);
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  setTypeFilter(k.key === "reserved" ? "reserved" : "all");
                  setAttachFilter(k.key === "attached" || k.key === "free" ? k.key : "all");
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
                <div className="mt-1 text-xl font-bold leading-none text-foreground">{k.value}</div>
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
              placeholder: t("Search by address or server"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [typeFilter, versionFilter, attachFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setTypeFilter("all");
                setVersionFilter("all");
                setAttachFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[980px] table-fixed">
              <colgroup>
                <col className="w-[80px]" />
                <col />
                <col className="w-[7.7%]" />
                <col className="w-[10.2%]" />
                <col className="w-[17.1%]" />
                <col className="w-[11.1%]" />
                <col className="w-[11.9%]" />
                <col className="w-[96px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-center">
                    <div className="flex w-5 justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        disabled={pickable.length === 0}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pickable.map((r) => r.key)]))
                              : selected.filter((k) => !pickable.some((r) => r.key === k)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead>{t("Version")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Attached to")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Globe className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No public IPs yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Your servers' addresses appear here. You can also reserve up to {n} IPs of your own.", {
                            n: formatNumber(MAX_RESERVED),
                          })}
                        </p>
                        <div className="mt-6">{reserveButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <p className="py-12 text-center text-muted-foreground">{t("No IPs match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r) => {
                    const held = r.reserved && !r.reserved.attachedTo && !canRelease(r.reserved);
                    return (
                      <TableRow key={r.key} className="border-b hover:bg-muted/30">
                        <TableCell className="text-center">
                          <div className="flex w-5 justify-center">
                            <Checkbox
                              disabled={!selectable(r)}
                              checked={selected.includes(r.key)}
                              onCheckedChange={(c) =>
                                setSelected((prev) => (c ? [...prev, r.key] : prev.filter((k) => k !== r.key)))
                              }
                              aria-label={r.address}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex min-w-0 items-center gap-1">
                            <TruncatedText text={r.address} ltr mono className="font-medium text-foreground" />
                            <button
                              type="button"
                              onClick={() => copy(r.address)}
                              aria-label={t("Copy")}
                              title={t("Copy")}
                              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Copy className="size-3.5" />
                            </button>
                          </span>
                        </TableCell>
                        <TableCell>{r.version}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              r.type === "reserved"
                                ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                                : r.type === "additional"
                                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {typeLabel[r.type]}
                          </span>
                        </TableCell>
                        <TableCell>
                          {r.attachedName ? (
                            <button
                              type="button"
                              onClick={() => r.attachedPath && navigate(r.attachedPath)}
                              className="block max-w-full text-start text-foreground hover:text-primary"
                            >
                              <TruncatedText text={r.attachedName} ltr />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">{t("Not attached")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={`${t(r.region)} / ${r.zone}`} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <TruncatedText text={formatDateTime(r.createdAt, language)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {held && (
                              <span
                                className="flex size-8 items-center justify-center text-muted-foreground"
                                title={t("Can be released from {date}", { date: formatDate(releasableAt(r.reserved!), language) })}
                              >
                                <Lock className="size-4" />
                              </span>
                            )}
                            {r.reserved ? (
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-56 bg-background">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={!canRelease(r.reserved)}
                                    onClick={() => setReleaseIds([r.key])}
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {t("Release")}
                                  </DropdownMenuItem>
                                  {!canRelease(r.reserved) && (
                                    <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                                      {r.reserved.attachedTo
                                        ? t("Attached to a server; delete or change the server first.")
                                        : t("Can be released from {date}", { date: formatDate(releasableAt(r.reserved), language) })}
                                    </p>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="w-8" />
                            )}
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

      <ReserveIpDialog open={reserveOpen} onClose={() => setReserveOpen(false)} used={reserved.length} />

      <Dialog open={!!releaseIds} onOpenChange={(o) => !o && setReleaseIds(null)}>
        <DialogContent data-uniform-type className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Release IPs?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {t("{n} reserved IPs go back to the pool. The same addresses may not be available again.", {
                n: formatNumber(releaseIds?.length ?? 0),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseIds(null)}>
              {fx("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                releaseIps(releaseIds ?? []);
                setSelected((prev) => prev.filter((k) => !releaseIds?.includes(k)));
                toast.success(t("IPs released"));
                setReleaseIds(null);
              }}
            >
              {t("Release")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Reserve a standalone IP: where, the two rules, and a tick that they are
    understood. */
function ReserveIpDialog({ open, onClose, used }: { open: boolean; onClose: () => void; used: number }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);
  const left = MAX_RESERVED - used;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Reserve an IP")}</DialogTitle>
          <DialogDescription>{t("A public IPv4 of your own, not tied to any server. Attach it to a server when you create one.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">{t("Region")}</p>
              <Select
                value={regionId}
                onValueChange={(v) => {
                  setRegionId(v);
                  setZone(REGIONS.find((r) => r.id === v)!.zones[0]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {t(r.countryName)} · {t(r.city)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">{t("Availability zone")}</p>
              <Select dir="ltr" value={zone} onValueChange={setZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {region.zones.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* The two rules, said before anything is reserved. */}
          <ul className="space-y-1.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200">
            <li>
              {t("You can hold up to {max} reserved IPs; {left} left.", { max: formatNumber(MAX_RESERVED), left: formatNumber(left) })}
            </li>
            <li>{t("By regulation, a reserved IP cannot be released for {n} days after it is reserved.", { n: formatNumber(HOLD_DAYS) })}</li>
          </ul>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
            <span>{t("I confirm that it cannot be deleted for {n} days.", { n: formatNumber(HOLD_DAYS) })}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!agreed || left <= 0}
            onClick={() => {
              const ip = reserveIp(region.city, zone);
              if (ip) toast.success(t("{ip} reserved", { ip: ip.address }));
              onClose();
            }}
          >
            {t("Reserve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
