import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGateways } from "@/hooks/useGateways";
import { LocationCell } from "@/components/panel/LocationCell";
import { PageHeader } from "@/components/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SmartPagination } from "@/components/SmartPagination";
import { ListToolbar, type FilterField, type SortOption, type ActionItem } from "@/components/panel/ListToolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Router,
  Upload,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  CheckCheck,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { KpiSection } from "@/components/panel/KpiSection";


interface Gateway {
  id: string;
  name: string;
  gatewayId: string;
  protocol: string;
  location: string;
  status: "online" | "offline" | "error";
  connectedDevices: number;
  lastSeen: string;
  createdAt: string;
}

const MOCK_GATEWAYS: Gateway[] = [
  { id: "gw-001", name: "GW-North-01",  gatewayId: "GW-N01-A1", protocol: "MQTT",     location: "Factory A > Line 1",     status: "online",  connectedDevices: 12, lastSeen: new Date(Date.now() - 30 * 1000).toISOString(),                createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "gw-002", name: "GW-East-02",   gatewayId: "GW-E02-B2", protocol: "LoRaWAN",  location: "Factory A > Sulfonation", status: "online",  connectedDevices: 8,  lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),           createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "gw-003", name: "GW-South-03",  gatewayId: "GW-S03-C3", protocol: "HTTP",     location: "Factory B > Boiler",     status: "offline", connectedDevices: 0,  lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "gw-004", name: "GW-West-04",   gatewayId: "GW-W04-D4", protocol: "ZigBee",   location: "Factory B > Packaging",  status: "online",  connectedDevices: 15, lastSeen: new Date(Date.now() - 10 * 1000).toISOString(),               createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "gw-005", name: "GW-Edge-05",   gatewayId: "GW-E05-E5", protocol: "MQTT",     location: "Factory C > WTP",        status: "error",   connectedDevices: 4,  lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "gw-006", name: "GW-Edge-06",   gatewayId: "GW-E06-F6", protocol: "OPC-UA",   location: "Factory A > Utilities",  status: "online",  connectedDevices: 6,  lastSeen: new Date(Date.now() - 45 * 1000).toISOString(),               createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

import { formatRelativeTime } from "@/lib/relativeTime";

const statusVariant = (s: Gateway["status"]) =>
  s === "online" ? "default" : s === "offline" ? "secondary" : "destructive";

const Gateways = () => {
  const { t, isRTL, language, formatNumber } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const { items: userGateways, remove: removeUserGateway } = useGateways();
  const [mockGateways, setMockGateways] = useState<Gateway[]>(MOCK_GATEWAYS);

  const gateways = useMemo<Gateway[]>(() => {
    const mapped: Gateway[] = userGateways.map((g) => ({
      id: g.id,
      name: g.name,
      gatewayId: g.gatewayId,
      protocol: g.protocol,
      location: g.location || "—",
      status: (g.status as Gateway["status"]) || "offline",
      connectedDevices: g.connectedDevices ?? 0,
      lastSeen: g.lastSeen || g.createdAt,
      createdAt: g.createdAt,
    }));
    return [...mapped, ...mockGateways];
  }, [userGateways, mockGateways]);


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortKey, setSortKey] = useState("updated");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ name: string; gatewayId: string; pairingKey: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Show credentials returned from GatewayForm
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("paapeli.newGatewayCredentials");
      if (stored) {
        const c = JSON.parse(stored);
        setCredentials(c);
        setCredentialsOpen(true);
        // Gateway already persisted by form; just clear filters if needed
        if (searchParams.get("created") === "1") {
          setSearchParams({}, { replace: true });
        }
        sessionStorage.removeItem("paapeli.newGatewayCredentials");
      }
    } catch {}
  }, []);

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t("success"), description: t("devicesRefreshed") || "Refreshed" });
    }, 500);
  };

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {}
  };

  const filtered = gateways.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || g.gatewayId.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    const matchProtocol = protocolFilter === "all" || g.protocol === protocolFilter;
    const matchLocation = locationFilter === "all" || g.location.toLowerCase().includes(locationFilter);
    return matchSearch && matchStatus && matchProtocol && matchLocation;
  }).sort((a, b) => {
    switch (sortKey) {
      case "nameAsc": return a.name.localeCompare(b.name);
      case "nameDesc": return b.name.localeCompare(a.name);
      case "status": return a.status.localeCompare(b.status);
      case "devices": return b.connectedDevices - a.connectedDevices;
      default:
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    }
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const allLocations = Array.from(new Set(gateways.map((g) => g.location)));
  const allProtocols = Array.from(new Set(gateways.map((g) => g.protocol)));

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: t("status") || "Status",
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(1); },
      options: [
        { value: "all", label: t("all") || "All" },
        { value: "online", label: t("online") },
        { value: "offline", label: t("offline") },
        { value: "error", label: t("errorStatus") },
      ],
    },
    {
      key: "protocol",
      label: t("protocol") || "Protocol",
      value: protocolFilter,
      onChange: (v) => { setProtocolFilter(v); setPage(1); },
      options: [{ value: "all", label: t("all") || "All" }, ...allProtocols.map((p) => ({ value: p, label: p }))],
    },
    {
      key: "location",
      label: t("location") || "Location",
      value: locationFilter,
      onChange: (v) => { setLocationFilter(v); setPage(1); },
      options: [{ value: "all", label: t("all") || "All" }, ...allLocations.map((l) => ({ value: l.toLowerCase(), label: l }))],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "updated", label: t("sortLastSeen") },
    { key: "nameAsc", label: t("sortNameAsc") },
    { key: "nameDesc", label: t("sortNameDesc") },
    { key: "status", label: t("sortStatus") },
    { key: "devices", label: t("sortConnectedDevices") },
  ];

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (protocolFilter !== "all" ? 1 : 0) + (locationFilter !== "all" ? 1 : 0);

  const actionItems: ActionItem[] = [
    { key: "delete", label: t("delete") || "Delete", icon: Trash2, onSelect: () => setDeleteOpen(true), disabled: selected.length === 0, destructive: true },
  ];

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? paged.map((g) => g.gatewayId) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const confirmDelete = () => {
    selected.forEach((id) => removeUserGateway(id));
    setMockGateways((prev) => prev.filter((g) => !selected.includes(g.gatewayId)));
    toast({ title: t("success"), description: `${formatNumber(selected.length)} ${t("gatewaysUnit")} ${t("deleted")}` });
    setSelected([]);
    setDeleteOpen(false);
  };

  return (
    <>
      <PageHeader
        title={t("gateways")}
        count={gateways.length}
        countLabel={t("gatewaysUnit")}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
                <Plus className="h-4 w-4" />
                {t("addGateway")}
                <ChevronDown className="h-4 w-4 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-52">
              <DropdownMenuItem onClick={() => navigate(lp("/devices/gateways/new"))}>
                <Plus className="h-4 w-4 me-2" />
                {t("addGateway")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: t("comingSoon") || "Coming soon" })}>
                <Upload className="h-4 w-4 me-2" />
                {t("importGateways")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />



      {(() => {
        const total = gateways.length;
        const online = gateways.filter((g) => g.status === "online").length;
        const offline = gateways.filter((g) => g.status === "offline").length;
        const errors = gateways.filter((g) => g.status === "error").length;
        const connected = gateways.reduce((s, g) => s + (g.connectedDevices || 0), 0);
        const kpis = [
          { label: t("totalGateways"), value: total, icon: Router, accent: "text-primary", bg: "from-primary/10 to-transparent", onClick: () => setStatusFilter("all"), isTotal: true },
          { label: t("online"), value: online, icon: Wifi, accent: "text-emerald-500", bg: "from-emerald-50 to-transparent dark:from-emerald-500/10", onClick: () => setStatusFilter("online"), isTotal: false },
          { label: t("offline"), value: offline, icon: WifiOff, accent: "text-muted-foreground", bg: "from-muted/40 to-transparent", onClick: () => setStatusFilter("offline"), isTotal: false },
          { label: t("errorsLabel"), value: errors, icon: AlertTriangle, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10", onClick: () => setStatusFilter("error"), isTotal: false },
        ];
        return (
          <KpiSection storageKey="gateways" className="mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k, i) => {
                const Icon = k.icon;
                return (
                  <button
                    key={i}
                    onClick={() => { k.onClick(); setPage(1); }}
                    className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} border-border`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground leading-none">{formatNumber(k.value)}</span>
                      <span className="text-[11px] text-muted-foreground">{k.isTotal ? `${formatNumber(connected)} ${t('devicesUnit')}` : t('gatewaysUnit')}</span>

                    </div>
                  </button>
                );
              })}
            </div>
          </KpiSection>
        );
      })()}

      <Card>

        <CardContent className="pt-6">
          <ListToolbar
            search={{ value: searchQuery, onChange: (v) => { setSearchQuery(v); setPage(1); }, placeholder: t("searchGatewaysPlaceholder") }}
            view={{ value: "table", onChange: () => {}, available: ["table"] }}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: activeFilterCount,
              onClear: () => { setStatusFilter("all"); setProtocolFilter("all"); setLocationFilter("all"); setPage(1); },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          {gateways.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Router className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noGatewaysYet")}</p>
              <Button onClick={() => navigate(lp("/devices/gateways/new"))} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 me-2" />
                {t("addGateway")}
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noGatewaysMatch") || "No gateways match the current filters"}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden mt-4 text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paged.length > 0 && selected.length === paged.length}
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </TableHead>
                    <TableHead>{t("name") || "Name"}</TableHead>
                    <TableHead>{t("gatewayId") || "Gateway ID"}</TableHead>
                    <TableHead>{t("protocol") || "Protocol"}</TableHead>
                    <TableHead>{t("location") || "Location"}</TableHead>
                    <TableHead>{t("status") || "Status"}</TableHead>
                    <TableHead className="text-center">{t("devices") || "Devices"}</TableHead>
                    <TableHead>{t("lastSeen") || "Last seen"}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>

                </TableHeader>
                <TableBody>
                  {paged.map((g) => (
                    <TableRow key={g.id} className="cursor-pointer" onClick={() => navigate(lp(`/devices/gateways/${g.gatewayId}`))}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(g.gatewayId)}
                          onCheckedChange={(c) => toggleOne(g.gatewayId, !!c)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          <span className="h-7 w-7 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                            <Router className="h-4 w-4" />
                          </span>
                          <span className="text-sm">{g.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{g.gatewayId}</TableCell>
                      <TableCell className="text-sm">{g.protocol}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}><LocationCell path={g.location} /></TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={`h-2 w-2 rounded-full ${g.status === "online" ? "bg-emerald-500" : g.status === "offline" ? "bg-muted-foreground/50" : "bg-red-500"}`} />
                          {g.status === "online" ? t("online") : g.status === "offline" ? t("offline") : t("errorStatus")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(g.connectedDevices)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatRelativeTime(g.lastSeen, t, formatNumber)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => navigate(lp(`/devices/gateways/${g.gatewayId}`))}
                          >
                            <Eye className="h-3.5 w-3.5" /> {t("view")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(lp(`/devices/gateways/${g.gatewayId}`))}>
                                <Eye className="h-4 w-4 me-2" /> {t("view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(lp(`/devices/gateways/${g.gatewayId}`))}>
                                <Pencil className="h-4 w-4 me-2" /> {t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => { setSelected([g.gatewayId]); setDeleteOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4 me-2" /> {t("delete")}
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <SmartPagination currentPage={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDelete") || "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteGateways")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("cancel") || "Cancel"}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t("delete") || "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials dialog after creation */}
      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gatewayCreated")}</DialogTitle>
            <DialogDescription>{t("saveCredentialsGateway")}</DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">{t("name")}</div>
                <Input value={credentials.name} readOnly />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">{t("gatewayId")}</div>
                <div className="flex gap-2">
                  <Input value={credentials.gatewayId} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => copy(credentials.gatewayId, "id")}>
                    {copiedField === "id" ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">{t("pairingKey")}</div>
                <div className="flex gap-2">
                  <Input value={credentials.pairingKey} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => copy(credentials.pairingKey, "key")}>
                    {copiedField === "key" ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentialsOpen(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {t("iHaveSavedTheCredentials")}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gateways;
