import { useState, useEffect, Fragment as FragmentWithKey } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { DeviceDetailsContent } from "@/features/factory/components/DeviceDetailsContent";
import { EditDeviceDialog, SendCommandDialog } from "@/features/factory/pages/panel/DeviceDetails";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Search, Filter, LayoutGrid, Smartphone, Copy, CheckCheck, Plus, RefreshCw, Trash2, ArrowUpDown, X, ChevronDown, ChevronUp, Eye, MoreHorizontal, Info, Box, Upload, Download, Pencil, UserPlus, Archive } from "lucide-react";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ListPageSkeleton } from "@/features/factory/components/panel/ListPageSkeleton";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { deviceCredentialsService } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/factory/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { NoDataValue } from "@/features/factory/components/NoData";
import { AddFirst } from "@/features/factory/components/AddFirst";
import { apiErrorMessage } from "@/shared/lib/apiError";


interface Device {
  id?: string;
  _id?: string;
  name: string;
  deviceId?: string;
  device_id?: string;
  deviceID?: string;
  protocol: string;
  /** Server-reported connectivity; drives the online/offline status. */
  active?: boolean;
  location?: string;
  gateway?: string;
  tags?: string;
  description?: string;
  externalId?: string;
  lastActivity?: string;
  last_activity?: string;
  lastSeen?: string;
  createdAt?: string;
  created_at?: string;
  created?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface DeviceCredentials {
  deviceId: string;
  apiKey: string;
  name: string;
  protocol: string;
  location?: string;
  gateway?: string;
  tags?: string;
  description?: string;
  externalId?: string;
  useSsl: boolean;
  authMethod?: "accessToken" | "basic" | "ssl";
  clientId?: string;
  username?: string;
  password?: string;
}

/* -------- Display metadata for the list --------
   These columns used to be derived from a hash of the device's name and id:
   a sensor type, an online/offline/error status, a plant location, a gateway
   and a live reading like "24.3°C". They were stable per device, so they
   looked like real telemetry — a device you had just created appeared to be
   online in Qazvin reporting a temperature. Only what the API actually
   returns is shown now — status comes from the API's `active` flag; the rest
   reads "no data" until there is a source. */
const hasPersianText = (value: string) => /[\u0600-\u06FF]/.test(value);
const persianTextClass = (value: string) => hasPersianText(value) ? "font-vazirmatn" : "";

const getDeviceMeta = (device: Device, t: (k: any) => string) => {
  const noData = t("noData");
  return {
    // No telemetry endpoint, so no sensor type or last reading.
    sensorType: noData,
    statusLabel: device.active ? t("online") : t("offline"),
    statusColor: device.active ? "bg-emerald-500" : "bg-muted-foreground/50",
    lastValue: noData,
    location: device.location || noData,
    gateway: device.gateway || noData,
    // The device-type key the device was created with (see DeviceForm step 1).
    deviceType: (device as any).type || noData,
    tags: device.tags ? device.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    description: device.description || '',
    externalId: device.externalId || '',
  };
};


const formatRelative = (iso: string | undefined, t: (k: any) => string, fmt?: (n: number | string) => string) => {
  if (!iso) return t('noData');
  const d = new Date(iso).getTime();
  if (!d) return t('noData');
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  const num = (n: number) => (fmt ? fmt(n) : String(n));
  if (s < 5) return t('justNow');
  if (s < 60) return t('secAgo').replace('{n}', num(s));
  const m = Math.floor(s / 60);
  if (m < 60) return t('minAgo').replace('{n}', num(m));
  const h = Math.floor(m / 60);
  if (h < 24) return (h === 1 ? t('hourAgo') : t('hoursAgo').replace('{n}', num(h)));
  return new Date(iso).toLocaleDateString();
};

const ExpandField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-background px-4 py-3 text-center">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-sm font-medium truncate">{value}</div>
  </div>
);

// Pagination now uses shared SmartPagination component

const Devices = () => {
  const { t, isRTL, language, formatNumber } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const goToAddDevice = () => navigate(lp("/devices/new"));
  const [searchParams, setSearchParams] = useSearchParams();
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [prefillLocation, setPrefillLocation] = useState<string | null>(null);
  const workspaceId = useWorkspaceId();
  const { options: locationOptions } = useAssetLocations();
  const {
    items: userDevices,
    create: createUserDevice,
    remove: removeUserDevice,
    refetch: refetchDevices,
    isLoading: devicesLoading,
    noWorkspace,
  } = useDevices();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [newDeviceCredentials, setNewDeviceCredentials] = useState<DeviceCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [wizardStep, setWizardStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<'blank' | null>('blank');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [listView, setListView] = useState<'table' | 'grid' | 'compact' | 'board'>('table');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('updated');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<any | null>(null);
  const [sendCmdDevice, setSendCmdDevice] = useState<any | null>(null);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc'); // desc = newest first
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Form state
  const [deviceName, setDeviceName] = useState("");
  const [protocol, setProtocol] = useState("MQTT");
  const [label, setLabel] = useState("");
  const [useSsl, setUseSsl] = useState(false);

  // Handle URL params from Locations page (?location=..., ?action=add)
  useEffect(() => {
    const loc = searchParams.get("location");
    const action = searchParams.get("action");
    if (loc) {
      setPrefillLocation(loc);
      setSearchQuery(loc.split(" / ").pop() || loc);
      setCurrentPage(1);
    }
    if (action === "add") {
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
      navigate(lp("/devices/new"));
    }

    if (searchParams.get("created") === "1") {
      setSearchQuery("");
      setProtocolFilter("all");
      setStatusFilter("all");
      setDeviceTypeFilter("all");
      setLocationFilter("all");
      setCurrentPage(1);
      const next = new URLSearchParams(searchParams);
      next.delete("created");
      setSearchParams(next, { replace: true });
    }

    // Show credentials dialog if we just returned from creating a device
    try {
      const stored = sessionStorage.getItem("paapeli.newDeviceCredentials");
      if (stored) {
        // The form already created the device server-side and its mutation
        // invalidated this list. All that is left is to show the access token
        // once, since it can never be read back afterwards.
        const creds = JSON.parse(stored) as DeviceCredentials;
        setNewDeviceCredentials(creds);
        setCredentialsDialogOpen(true);
        sessionStorage.removeItem("paapeli.newDeviceCredentials");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useDevices loads and caches the list; this only re-runs the request behind
  // the toolbar's refresh button.
  const fetchDevices = async (showRefreshToast = false) => {
    setIsRefreshing(true);
    try {
      await refetchDevices();
      if (showRefreshToast) {
        toast({ title: t("success"), description: t("devicesRefreshed") });
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      toast({
        title: t("error"),
        description: t("deviceNameRequired"),
        variant: "destructive",
      });
      return;
    }

    // Every device must hang off an asset. This quick-add panel has no location
    // picker, so it uses the node it was opened from and falls back to the tree
    // root — /devices/new is where a location is actually chosen.
    const assetId =
      locationOptions.find((l) => l.path === prefillLocation)?.id ?? locationOptions[0]?.id;
    if (!assetId) {
      toast({ title: t("error"), description: t("locationRequired"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const name = deviceName.trim();
      const created = await createUserDevice({
        name,
        label: name,
        type: "default",
        assetId,
        credentialType: "ACCESS_TOKEN",
      });

      // ACCESS_TOKEN is minted server-side, so read it back to show it once.
      let apiKey: string | undefined;
      if (workspaceId) {
        try {
          const creds = await deviceCredentialsService.getDeviceCredentials(
            workspaceId,
            PRODUCT_KEY,
            created.id,
          );
          apiKey = creds.credentialsId;
        } catch (error) {
          console.warn("Unable to read the new device credentials", error);
        }
      }

      setNewDeviceCredentials({
        deviceId: created.id,
        apiKey: apiKey ?? "",
        name: created.name,
        protocol,
        useSsl,
      });
      setCredentialsDialogOpen(true);

      // Reset form and close
      setDeviceName("");
      setProtocol("MQTT");
      setLabel("");
      setUseSsl(false);
      setAddPanelOpen(false);
    } catch (error) {
      console.error("Device registration error:", error);
      toast({
        title: t("error"),
        description: apiErrorMessage(error, t("failedToAddDevice")),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceLocation = (d: Device) => d.location || (d as any).label || '';
  /* The API reports connectivity as the boolean `active`; there is no third
     "error" state behind it. */
  const getDeviceStatus = (d: Device): 'online' | 'offline' =>
    d.active ? 'online' : 'offline';

  const getDeviceTypeStr = (d: Device) => String((d as any).deviceType || (d as any).sensorType || (d as any).type || '');

  const mergedDevices: Device[] = [
    ...userDevices.map((u) => ({
      id: u.id,
      deviceId: u.deviceId,
      name: u.name,
      protocol: u.protocol,
      active: u.active,
      gateway: u.gateway,
      tags: u.tags,
      description: u.description,
      externalId: u.externalId,
      created_at: u.createdAt,
      last_activity: u.lastActivity || u.createdAt,
      ...(u.location ? { location: u.location } : {}),
    } as Device)),
  ];

  const filteredDevices = mergedDevices.filter(device => {
    const deviceId = device.deviceId || device.device_id || device.deviceID || device.id || device._id || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = device.name.toLowerCase().includes(q) || deviceId.toLowerCase().includes(q);
    const matchesProtocol = protocolFilter === 'all' || device.protocol === protocolFilter;
    const matchesStatus = statusFilter === 'all' || getDeviceStatus(device) === statusFilter;
    const matchesType = deviceTypeFilter === 'all' || getDeviceTypeStr(device).toLowerCase() === deviceTypeFilter;
    const matchesLocation = locationFilter === 'all' || getDeviceLocation(device).toLowerCase().includes(locationFilter);
    return matchesSearch && matchesProtocol && matchesStatus && matchesType && matchesLocation;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || a.created || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || b.created || 0).getTime();
    switch (sortKey) {
      case 'nameAsc': return a.name.localeCompare(b.name);
      case 'nameDesc': return b.name.localeCompare(a.name);
      case 'status': return getDeviceStatus(a).localeCompare(getDeviceStatus(b));
      case 'updated':
      default:
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const resetAddDeviceForm = () => {
    setDeviceName("");
    setProtocol("MQTT");
    setLabel("");
    setUseSsl(false);
    setWizardStep('template');
    setSelectedTemplate('blank');
  };

  const handleDeviceClick = (deviceId: string) => {
    navigate(lp(`/devices/${deviceId}`));
  };


  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDeviceId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(paginatedDevices.map(d => d.deviceId || d.device_id || d.deviceID || d.id || d._id || ''));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId]);
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  const handleDeleteSelected = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    // Each delete is its own request; the mutation invalidates the list, so the
    // table ends up reflecting whatever actually succeeded.
    const results = await Promise.allSettled(selectedDevices.map((id) => removeUserDevice(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    toast(
      failed
        ? { title: t("error"), description: t("failedToDeleteDevices"), variant: "destructive" }
        : {
            title: t("deleted") || "Deleted",
            description: `${formatNumber(selectedDevices.length)} ${t("devicesUnit") || "devices"} ${t("deleted") || "deleted"}`,
          },
    );
    setSelectedDevices([]);
    setDeleteDialogOpen(false);
  };

  // Available protocols for sorting
  const availableProtocols = ["MQTT", "HTTP", "CoAP", "WebSocket", "LoRaWAN", "BLE", "ZigBee", "OPC-UA", "LTE", "5G"];
  
  const handleResetSort = () => {
    setProtocolFilter('all');
    setCurrentPage(1);
    setSortPopoverOpen(false);
  };

  return (
    <>
      {devicesLoading || noWorkspace ? (
        <ListPageSkeleton rows={9} columns={8} toolbarButtons={3} showPrimaryCta />
      ) : viewMode === 'details' && selectedDeviceId ? (
        <DeviceDetailsContent deviceId={selectedDeviceId} onBack={handleBackToList} />
      ) : (
        <div className="space-y-4">
          {(() => {
            const filterFields: FilterField[] = [
              {
                key: 'status', label: t('status'), value: statusFilter,
                onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
                options: [
                  { value: 'all', label: t('all') },
                  ...Array.from(new Set(mergedDevices.map(getDeviceStatus))).map((s) => ({ value: s, label: t(s) })),
                ],
              },
              {
                key: 'location', label: t('location'), value: locationFilter,
                onChange: (v) => { setLocationFilter(v); setCurrentPage(1); },
                options: [
                  { value: 'all', label: t('all') },
                  ...Array.from(new Set(mergedDevices.map(getDeviceLocation).filter(Boolean))).map((s) => ({ value: s.toLowerCase(), label: s })),
                ],
              },
              {
                key: 'deviceType', label: t('deviceType'), value: deviceTypeFilter,
                onChange: (v) => { setDeviceTypeFilter(v); setCurrentPage(1); },
                options: [
                  { value: 'all', label: t('all') },
                  ...Array.from(new Set(mergedDevices.map(getDeviceTypeStr).filter(Boolean))).map((s) => ({ value: s.toLowerCase(), label: s })),
                ],
              },
              {
                key: 'protocol', label: t('protocol'), value: protocolFilter,
                onChange: (v) => { setProtocolFilter(v); setCurrentPage(1); },
                options: [
                  { value: 'all', label: t('allProtocols') || t('all') },
                  ...availableProtocols.map((p) => ({ value: p, label: p })),
                ],
              },
            ];

            const sortOptions: SortOption[] = [
              { key: 'nameAsc', label: t('sortNameAsc') },
              { key: 'nameDesc', label: t('sortNameDesc') },
              { key: 'updated', label: t('sortLastUpdated') },
              { key: 'status', label: t('sortStatus') },
            ];

            const activeFilterCount = [statusFilter, locationFilter, deviceTypeFilter, protocolFilter].filter(v => v !== 'all').length;

            const handleExport = () => {
              const rows = filteredDevices.map((d) => ({
                name: d.name,
                id: d.deviceId || d.device_id || d.id || '',
                protocol: d.protocol || '',
                status: getDeviceStatus(d),
                location: getDeviceLocation(d),
                type: getDeviceTypeStr(d),
              }));
              const header = ['name','id','protocol','status','location','type'];
              const csv = [header.join(','), ...rows.map(r => header.map(h => `"${String((r as any)[h] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `devices-${Date.now()}.csv`; a.click();
              URL.revokeObjectURL(url);
            };

            const actionItems: ActionItem[] = [
              { key: 'export', label: t('export'), icon: Download, onSelect: handleExport },
              { key: 'bulkEdit', label: t('bulkEdit'), icon: Pencil, comingSoon: true },
              { key: 'bulkAssign', label: t('bulkAssign'), icon: UserPlus, comingSoon: true },
              { key: 'archive', label: t('archive'), icon: Archive, comingSoon: true },
              { key: 'delete', label: t('delete'), icon: Trash2, destructive: true, onSelect: handleDeleteSelected },
            ];

            return (
              <>
                <PageHeader
                  title={t('devices')}
                  count={mergedDevices.length}
                  countLabel={t('devicesUnit')}
                  actions={
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
                            <Plus className="h-4 w-4" />
                            {t('addDevice')}
                            <ChevronDown className="h-4 w-4 opacity-80" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52">
                          <DropdownMenuItem onClick={() => { goToAddDevice(); }}>
                            <Plus className="h-4 w-4 me-2" />
                            {t('addNewDevice')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { try { (document.getElementById('device-import-input') as HTMLInputElement | null)?.click(); } catch {} }}>
                            <Upload className="h-4 w-4 me-2" />
                            {t('importDevice')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <input id="device-import-input" type="file" accept=".csv,.json,.xlsx" className="hidden" onChange={() => { toast({ title: t('comingSoon') }); }} />
                    </>
                  }
                />

                {(() => {
                  /* Total, online and offline are real counts from the API's
                     `active` flag. Errors has no source — the API reports no
                     error state — so it stays "no data" rather than a 0. */
                  const total = mergedDevices.length;
                  const countOf = (name: string) =>
                    mergedDevices.filter((d) => getDeviceStatus(d) === name).length;

                  const kpis: { label: string; value: number | null; icon: typeof Box; accent: string; bg: string; filter: string }[] = [
                    { label: t('totalDevices') || 'Total Devices', value: total, icon: Box, accent: 'text-primary', bg: 'from-primary/10 to-transparent', filter: 'all' },
                    { label: t('online') || 'Online', value: countOf('online'), icon: Wifi, accent: 'text-emerald-500', bg: 'from-emerald-50 to-transparent dark:from-emerald-500/10', filter: 'online' },
                    { label: t('offline') || 'Offline', value: countOf('offline'), icon: WifiOff, accent: 'text-muted-foreground', bg: 'from-muted/40 to-transparent', filter: 'offline' },
                    { label: t('errorStatus') || 'Errors', value: null, icon: AlertTriangle, accent: 'text-red-500', bg: 'from-red-50 to-transparent dark:from-red-500/10', filter: 'error' },
                  ];
                  return (
                    <KpiSection storageKey="devices" className="mb-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {kpis.map((k, i) => {
                          const Icon = k.icon;
                          const isActive = statusFilter === k.filter;
                          return (
                            <button
                              key={i}
                              onClick={() => { setStatusFilter(k.filter); setCurrentPage(1); }}
                              className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} ${isActive ? 'border-primary ring-2 ring-primary/20 shadow-sm' : 'border-border'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                                <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
                              </div>
                              <div className="mt-1 flex items-baseline gap-2">
                                {k.value === null ? (
                                  <NoDataValue />
                                ) : (
                                  <>
                                    <span className="text-xl font-bold text-foreground leading-none">{k.value}</span>
                                    <span className="text-[11px] text-muted-foreground">{t('devicesUnit') || 'devices'}</span>
                                  </>
                                )}
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
                      search={{ value: searchQuery, onChange: (v) => { setSearchQuery(v); setCurrentPage(1); }, placeholder: t('searchInDevices') }}
                      view={{ value: listView, onChange: setListView, available: ['table'] }}
                      onRefresh={() => fetchDevices(true)}
                      isRefreshing={isRefreshing}
                      filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setStatusFilter('all'); setLocationFilter('all'); setDeviceTypeFilter('all'); setProtocolFilter('all'); setCurrentPage(1); } }}
                      sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
                      actions={actionItems}
                      selectionCount={selectedDevices.length}
                    />

              {/* Table. The columns stay on screen when the list is empty —
                  the empty state goes in the body, not in place of it. */}
              <div className="rounded-lg border overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[44px] text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedDevices.length === paginatedDevices.length && paginatedDevices.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[36px]"></TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("sensorType")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("location")}</TableHead>
                      <TableHead>{t("protocol")}</TableHead>
                      <TableHead>
                        <button
                          onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {t("updated")}
                          {sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedDevices.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={9}>
                          <AddFirst icon={Smartphone} label={t("addYourFirstDevice")} onAction={goToAddDevice} />
                        </TableCell>
                      </TableRow>
                    ) : filteredDevices.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={9}>
                          <p className="py-12 text-center text-muted-foreground">{t("noDevicesFound")}</p>
                        </TableCell>
                      </TableRow>
                    ) : paginatedDevices.map((device) => {
                      const deviceId = device.deviceId || device.device_id || device.deviceID || device.id || device._id || '';
                      const rowKey = device.id || device._id || deviceId;
                      const createdAt = device.created_at || device.createdAt || device.created;
                      const lastActivity = device.last_activity || device.lastActivity || device.lastSeen;
                      const meta = getDeviceMeta(device, t);
                      const isExpanded = expandedRows.includes(rowKey);
                      const toggleExpand = () =>
                        setExpandedRows((prev) => prev.includes(rowKey) ? prev.filter(k => k !== rowKey) : [...prev, rowKey]);
                      const formattedUpdated = formatRelative(lastActivity || createdAt, t, formatNumber);

                      return (
                        <FragmentWithKey key={rowKey}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/30 border-b"
                            onClick={toggleExpand}
                          >
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={selectedDevices.includes(deviceId)}
                                  onCheckedChange={(checked) => handleSelectDevice(deviceId, checked as boolean)}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 font-medium">
                                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                                  <Box className="h-4 w-4" />
                                </span>
                                <span className={`text-sm ${persianTextClass(device.name)}`}>{device.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{meta.sensorType}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 text-sm">
                                <span className={`h-2 w-2 rounded-full ${meta.statusColor}`} />
                                {meta.statusLabel}
                              </span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <LocationCell path={device.location} />
                            </TableCell>
                            <TableCell className="text-sm">{device.protocol}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formattedUpdated}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleDeviceClick(deviceId)}>
                                  <Eye className="h-3.5 w-3.5" /> {t("view")}

                                </Button>
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-background z-[100] w-48">
                                    <DropdownMenuItem onClick={() => setSendCmdDevice(device)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />{t("sendCommand") || "Send Command"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(lp("/firmware?tab=devices"))}>
                                      <ArrowUpDown className="h-4 w-4 mr-2" />{t("updateFirmware") || "Update Firmware"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditDevice(device)}>
                                      <Pencil className="h-4 w-4 mr-2" />{t("editDevice") || "Edit Device"}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => { setSelectedDevices([deviceId]); setDeleteDialogOpen(true); }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />{t("deleteDevice") || "Delete Device"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${rowKey}-expand`} className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={9} className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <ExpandField label={t("deviceId")} value={deviceId || t('noData')} />
                                  <ExpandField label={t("deviceTypeLabel")} value={meta.deviceType} />
                                  <ExpandField label={t("gateway")} value={meta.gateway} />
                                  <ExpandField label={t("channels")} value={meta.sensorType} />
                                </div>
                                <div className="mt-3">
                                  <div className="rounded-lg border bg-background px-4 py-3">
                                    <div className="text-xs text-muted-foreground mb-2">{t("tagsLabel")}</div>
                                    {meta.tags.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {meta.tags.map((tag) => (
                                          <span key={tag} className={`inline-flex items-center rounded bg-primary/10 text-primary px-2 py-0.5 text-xs ${persianTextClass(tag)}`}>{tag}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground italic">—</div>
                                    )}
                                  </div>
                                </div>
                                {meta.description && (
                                  <div className="mt-3 rounded-lg border bg-background px-4 py-3">
                                    <div className="text-xs text-muted-foreground mb-1">{t("descriptionLabel")}</div>
                                    <div className={`text-sm ${persianTextClass(meta.description)}`}>{meta.description}</div>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </FragmentWithKey>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredDevices.length > itemsPerPage && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-[72px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ml-3">
                      {startIndex + 1}-{Math.min(endIndex, filteredDevices.length)} {t("of")} {filteredDevices.length}
                    </span>
                  </div>
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={Math.max(totalPages, 1)}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* Device Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
            <DialogTitle className="text-base">{t("deviceCreatedSuccessfully")}</DialogTitle>
            <DialogDescription className="text-sm pt-1">
              {t("saveCredentialsWarning")}
            </DialogDescription>
          </DialogHeader>

          {newDeviceCredentials && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("deviceName")}</Label>
                <Input value={newDeviceCredentials.name} readOnly className="font-medium h-9" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("deviceId")}</Label>
                <div className="flex items-center gap-2">
                  <Input value={newDeviceCredentials.deviceId} readOnly className="font-mono text-sm h-9" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(newDeviceCredentials.deviceId, 'deviceId')}
                  >
                    {copiedField === 'deviceId' ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Only show the Access Token when that credentials type was selected. */}
              {(newDeviceCredentials.authMethod || "accessToken") === "accessToken" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("accessTokenUsername")}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={newDeviceCredentials.apiKey} readOnly className="font-mono text-sm h-9" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => copyToClipboard(newDeviceCredentials.apiKey, 'apiKey')}
                    >
                      {copiedField === 'apiKey' ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {newDeviceCredentials.authMethod === "basic" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("clientId")}</Label>
                    <Input value={newDeviceCredentials.clientId || t('noData')} readOnly className="font-mono text-sm h-9" dir="ltr" />
                  </div>
                  {newDeviceCredentials.username ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t("username")}</Label>
                      <Input value={newDeviceCredentials.username} readOnly className="font-mono text-sm h-9" dir="ltr" />
                    </div>
                  ) : null}
                </>
              )}

              {newDeviceCredentials.authMethod === "ssl" && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t("sslCredHint")}
                </div>
              )}

              {(() => {
                const auth = newDeviceCredentials.authMethod || "accessToken";
                // Protocols available depend on the chosen credentials type (ThingsBoard-style):
                // access token → HTTP/MQTT/CoAP, X.509 (SSL/TLS) → MQTT/CoAP, MQTT Basic → MQTT only.
                const protos = auth === "basic" ? ["MQTT"] : auth === "ssl" ? ["MQTT", "CoAP"] : ["MQTT", "HTTP", "CoAP"];
                const token = newDeviceCredentials.apiKey;
                const did = newDeviceCredentials.deviceId;
                const tls = !!newDeviceCredentials.useSsl || auth === "ssl";
                const httpBase = tls ? "https://api.paapeli.com:8443" : "http://api.paapeli.com:8080";
                const blocks: Record<string, string> = {
                  HTTP: [
                    `curl -v -X POST ${httpBase}/api/v1/${token}/telemetry \\`,
                    `  --header "Content-Type:application/json" \\`,
                    `  --data "{\\"temperature\\":25}"`,
                  ].join("\n"),
                  MQTT: (auth === "basic"
                    ? [
                        `mqtt_server = "mqtt.paapeli.com";`,
                        `mqtt_port   = ${tls ? 8883 : 1883};`,
                        `client_id   = "${newDeviceCredentials.clientId || did}";`,
                        `username    = "${newDeviceCredentials.username || ""}";`,
                        `password    = "${newDeviceCredentials.password || ""}";`,
                        `topic       = "v1/devices/me/telemetry";`,
                      ]
                    : auth === "ssl"
                    ? [
                        `mqtt_server = "mqtt.paapeli.com";`,
                        `mqtt_port   = 8883;`,
                        `client_id   = "${did}";`,
                        `ca_cert     = "ca-root.pem";`,
                        `client_cert = "client.pem";`,
                        `client_key  = "client.key";`,
                        `topic       = "v1/devices/me/telemetry";`,
                      ]
                    : [
                        `mqtt_server = "mqtt.paapeli.com";`,
                        `mqtt_port   = ${tls ? 8883 : 1883};`,
                        `client_id   = "${did}";`,
                        `username    = "${token}";`,
                        `password    = "";`,
                        `topic       = "v1/devices/me/telemetry";`,
                      ]).join("\n"),
                  CoAP: (auth === "ssl"
                    ? [
                        `coap-client-openssl -m POST coaps://coap.paapeli.com/api/v1/telemetry \\`,
                        `  -c client.pem -k client.key \\`,
                        `  -t json -e "{\\"temperature\\":25}"`,
                      ]
                    : [
                        `coap-client -m POST coap://coap.paapeli.com/api/v1/${token}/telemetry \\`,
                        `  -t json -e "{\\"temperature\\":25}"`,
                      ]).join("\n"),
                };
                return (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("sendTelemetryInstructions")}</Label>
                    <Tabs defaultValue={protos[0]}>
                      <TabsList className="w-full">
                        {protos.map((p) => (
                          <TabsTrigger key={p} value={p} className="flex-1">{p}</TabsTrigger>
                        ))}
                      </TabsList>
                      {protos.map((p) => (
                        <TabsContent key={p} value={p} className="mt-2">
                          <div className="relative">
                            <pre dir="ltr" className="bg-muted rounded-lg p-3 pe-10 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre text-left">{blocks[p]}</pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 absolute top-2 end-2"
                              onClick={() => copyToClipboard(blocks[p], `cmd-${p}`)}
                            >
                              {copiedField === `cmd-${p}` ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                );
              })()}

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ {t("apiKeyWarning")}
                </p>
              </div>
            </div>
          )}

          <div className="px-6 py-3 border-t border-border bg-background shrink-0 flex justify-end">
            <Button
              onClick={() => {
                setCredentialsDialogOpen(false);
                setNewDeviceCredentials(null);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("iHaveSavedTheCredentials")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? 'text-right' : ''}>
            <DialogTitle className={isRTL ? 'text-right' : ''}>{t("confirmDelete") || "Confirm Delete"}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : ''}>
              {t("confirmDeleteMessage") || `Are you sure you want to delete ${selectedDevices.length} device(s)? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              {t("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editDevice && (
        <EditDeviceDialog
          open={!!editDevice}
          onOpenChange={(o: boolean) => { if (!o) setEditDevice(null); }}
          device={editDevice}
        />
      )}
      {sendCmdDevice && (
        <SendCommandDialog
          open={!!sendCmdDevice}
          onOpenChange={(o: boolean) => { if (!o) setSendCmdDevice(null); }}
          device={sendCmdDevice}
        />
      )}
    </>
  );
};


export default Devices;
