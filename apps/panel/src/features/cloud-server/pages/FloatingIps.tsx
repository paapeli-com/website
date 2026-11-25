import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Link2, MoreHorizontal, Pencil, Plus, Repeat, Trash2, Unlink, Wallet } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
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
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import { FLOATING_IP_MONTHLY, REGIONS } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import {
  allocateFloating,
  associateFloating,
  deleteFloating,
  disassociateFloating,
  updateFloating,
  useFloatingIps,
  type FloatingIp,
} from "../lib/floatingStore";
import { LOAD_BALANCERS_PATH, PageBreadcrumb, SERVERS_PATH, CopyButton, TruncatedText } from "../ui";
import { attachPublicIp, forgetPublicIp, useLoadBalancers } from "../lib/loadBalancerStore";
import { apiCall } from "../lib/openstackErrors";

/* Floating IPs: addresses that move between servers without changing.
 *
 * Neutron's floating IP, no more: allocate one from the external network
 * (with a description if wanted), associate it with a server, move it to
 * another, disassociate it, delete it once it is free. The Public IPs page's
 * standard throughout. The price is said before one is created: a floating
 * IP comes with a router to the outside, which is billed too.
 */

type SortKey = "created" | "address";

export default function FloatingIps() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const ips = useFloatingIps();

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | "attached" | "free">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [associating, setAssociating] = useState<FloatingIp | null>(null);
  const [editing, setEditing] = useState<FloatingIp | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ips
      .filter(
        (i) =>
          (!q || i.address.includes(q) || (i.description ?? "").toLowerCase().includes(q) || (i.attachedTo?.serverName ?? "").includes(q)) &&
          (stateFilter === "all" || (stateFilter === "attached") === !!i.attachedTo),
      )
      .sort((a, b) => (sortKey === "address" ? a.address.localeCompare(b.address) : b.createdAt - a.createdAt));
  }, [ips, search, stateFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  /* A floating IP is deleted only when it is free. */
  const pickable = pageRows.filter((i) => !i.attachedTo);
  const allOnPageSelected = pickable.length > 0 && pickable.every((i) => selected.includes(i.id));


  const exportCsv = () => {
    const header = ["address", "description", "attachedTo", "region", "zone", "created"];
    const lines = filtered.map((i) => [i.address, i.description ?? "", i.attachedTo?.serverName ?? "", i.region, i.zone, new Date(i.createdAt).toISOString()]);
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `floating-ips-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "state",
      label: fx("status"),
      value: stateFilter,
      onChange: (v) => {
        setStateFilter(v as "all" | "attached" | "free");
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "attached", label: t("Attached") },
        { value: "free", label: t("Not attached") },
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "created", label: t("Newest first") },
    { key: "address", label: t("By address") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Create floating IP")}
    </Button>
  );

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Networking"), path: `${CLOUD_SERVER_BASE}/public-ips` },
          { label: shellT("Floating IPs") },
        ]}
      />
      <PageHeader title={shellT("Floating IPs")} count={ips.length} countLabel={t("IPs")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by address, description or server"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: stateFilter !== "all" ? 1 : 0,
              onClear: () => {
                setStateFilter("all");
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
                <col className="w-[15.5%]" />
                <col className="w-[10.1%]" />
                <col className="w-[14%]" />
                <col className="w-[10.1%]" />
                <col className="w-[10.9%]" />
                <col className="w-[110px]" />
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
                              ? Array.from(new Set([...selected, ...pickable.map((i) => i.id)]))
                              : selected.filter((id) => !pickable.some((i) => i.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Attached to")}</TableHead>
                  <TableHead>{t("Region / zone")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Repeat className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No floating IPs yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("A fixed address you can move between servers, so the address stays when the server changes.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
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
                  pageRows.map((i) => (
                    <TableRow key={i.id} className="border-b hover:bg-muted/30">
                      <TableCell className="text-center">
                        <div className="flex w-5 justify-center">
                          <Checkbox
                            disabled={!!i.attachedTo}
                            checked={selected.includes(i.id)}
                            onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, i.id] : prev.filter((x) => x !== i.id)))}
                            aria-label={i.address}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex min-w-0 items-center gap-1">
                          <TruncatedText text={i.address} ltr className="font-medium text-foreground" />
                          <CopyButton text={i.address} />
                        </span>
                      </TableCell>
                      <TableCell>
                        {i.description ? <TruncatedText text={i.description} /> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={cn("h-2 w-2 rounded-full", i.attachedTo ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                          {i.attachedTo ? t("Attached") : t("Not attached")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {i.attachedTo ? (
                          <button
                            type="button"
                            onClick={() => navigate(i.attachedTo?.kind === "loadbalancer" ? LOAD_BALANCERS_PATH : SERVERS_PATH)}
                            className="block max-w-full text-start text-foreground hover:text-primary"
                          >
                            <TruncatedText text={i.attachedTo.serverName} ltr />
                            {i.attachedTo.kind === "loadbalancer" && <span className="block text-xs text-muted-foreground">{t("Load balancer")}</span>}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TruncatedText text={`${t(i.region)} / ${i.zone}`} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <TruncatedText text={formatDateTime(i.createdAt, language)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* The one thing a floating IP is for: out in the row. */}
                          {i.attachedTo ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              aria-label={t("Detach")}
                              title={t("Detach")}
                              onClick={() => {
                                disassociateFloating(i.id);
                                forgetPublicIp(i.id);
                                toast.success(t("{ip} detached", { ip: i.address }));
                              }}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              aria-label={t("Attach to a server")}
                              title={t("Attach to a server")}
                              onClick={() => setAssociating(i)}
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
                              {i.attachedTo && (
                                <DropdownMenuItem onClick={() => setAssociating(i)}>
                                  <Repeat className="me-2 h-4 w-4" />
                                  {t("Move to another server")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setEditing(i)}>
                                <Pencil className="me-2 h-4 w-4" />
                                {t("Edit description")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={!!i.attachedTo}
                                onClick={() => setDeleteIds([i.id])}
                              >
                                <Trash2 className="me-2 h-4 w-4" />
                                {fx("delete")}
                              </DropdownMenuItem>
                              {i.attachedTo && (
                                <p className="px-2 pb-1.5 text-xs text-muted-foreground">{t("Detach it first to delete it.")}</p>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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

      <CreateFloatingDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AssociateDialog ip={associating} onClose={() => setAssociating(null)} />
      <DescriptionDialog ip={editing} onClose={() => setEditing(null)} />

      <Dialog open={!!deleteIds} onOpenChange={(o) => !o && setDeleteIds(null)}>
        <DialogContent data-uniform-type className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Delete floating IPs?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {t("{n} floating IPs and their router are deleted, and their cost stops. The same addresses may not be available again.", {
                n: formatNumber(deleteIds?.length ?? 0),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIds(null)}>
              {fx("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteFloating(deleteIds ?? []);
                setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
                toast.success(t("Floating IPs deleted"));
                setDeleteIds(null);
              }}
            >
              {fx("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Create: where, an optional description, and what it costs. */
function CreateFloatingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (open) setDescription("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Create floating IP")}</DialogTitle>
          <DialogDescription>{t("An address that moves between servers. Attach it to a server now or later.")}</DialogDescription>
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
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">
              {t("Description")}
            </p>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("For example, the website's address")} />
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200">
            <Wallet className="mt-px size-4 shrink-0" />
            <span>
              {t("A floating IP comes with a router to the internet, which has a public address of its own. Both are billed: {price} a month.", {
                price: format(FLOATING_IP_MONTHLY[currency]),
              })}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={() => {
              const ip = allocateFloating(region.city, zone, description.trim() || undefined);
              toast.success(t("{ip} created", { ip: ip.address }));
              onClose();
            }}
          >
            {t("Create floating IP")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Attach to, or move to, one of the account's servers in the same region. */
function AssociateDialog({ ip, onClose }: { ip: FloatingIp | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const servers = useServers().filter((s) => ip && s.region === ip.region && s.id !== ip.attachedTo?.serverId);
  const lbs = useLoadBalancers().filter((l) => ip && l.region === ip.region && l.id !== ip.attachedTo?.serverId);
  const [serverId, setServerId] = useState("");
  useEffect(() => setServerId(""), [ip]);

  return (
    <Dialog open={!!ip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ip?.attachedTo ? t("Move to another server") : t("Attach to a server")}</DialogTitle>
          <DialogDescription>
            <span dir="ltr">{ip?.address}</span>
          </DialogDescription>
        </DialogHeader>
        {servers.length === 0 && lbs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No server in this region to attach it to.")}</p>
        ) : (
          <Select value={serverId} onValueChange={setServerId}>
            <SelectTrigger>
              <SelectValue placeholder={t("Choose a server")} />
            </SelectTrigger>
            <SelectContent>
              {servers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span dir="ltr">{s.name}</span> · <span dir="ltr">{s.ipv4}</span>
                </SelectItem>
              ))}
              {lbs.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  <span dir="ltr">{l.name}</span> · <span className="text-muted-foreground">{t("Load balancer")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!serverId}
            onClick={async () => {
              if (!ip) return;
              const lb = lbs.find((l) => l.id === serverId);
              if (lb) {
                if (!(await apiCall(() => (attachPublicIp(lb.id, ip.id), true), t))) return;
                toast.success(t("{ip} attached to {server}", { ip: ip.address, server: lb.name }));
                onClose();
                return;
              }
              const server = servers.find((s) => s.id === serverId);
              if (!server) return;
              forgetPublicIp(ip.id);
              associateFloating(ip.id, server.id, server.name);
              toast.success(t("{ip} attached to {server}", { ip: ip.address, server: server.name }));
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

function DescriptionDialog({ ip, onClose }: { ip: FloatingIp | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [text, setText] = useState("");
  useEffect(() => setText(ip?.description ?? ""), [ip]);
  return (
    <Dialog open={!!ip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Edit description")}</DialogTitle>
          <DialogDescription>
            <span dir="ltr">{ip?.address}</span>
          </DialogDescription>
        </DialogHeader>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={() => {
              if (ip) updateFloating(ip.id, { description: text.trim() || undefined });
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
