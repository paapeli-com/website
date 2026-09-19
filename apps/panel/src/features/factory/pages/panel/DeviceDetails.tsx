import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useDevices, UserDevice } from "@/features/factory/hooks/useDevices";
import { useGateways } from "@/features/factory/hooks/useGateways";
import { useToast } from "@/features/factory/hooks/use-toast";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import { Separator } from "@/features/factory/components/ui/separator";
import { Switch } from "@/features/factory/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/features/factory/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  DetailPageSkeleton,
  TableRowsSkeleton,
} from "@/features/factory/components/panel/DetailPageSkeleton";
import { queryLoad, usePageLoad } from "@/shared/hooks/usePageLoad";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/factory/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { LineChart, Line, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import {
  ArrowLeft, Edit, Play, MoreHorizontal, Eye, RefreshCw, Upload, MapPin,
  Trash2, Wifi, WifiOff, Clock, Network, Bell, Activity, Thermometer, Gauge,
  Droplet, Zap, Waves, Wind, ChevronDown, ChevronRight, ChevronLeft, Copy, CheckCheck,
  Search, Download, Plus, AlertTriangle, ShieldCheck, Sparkles, Cpu,
  Brain, X as XIcon, Calendar, Settings as SettingsIcon, FileText,
  Lock, KeyRound, ChevronsUpDown, ChevronsLeft, ChevronsRight, LayoutGrid, ArrowUp, ArrowDown,
} from "lucide-react";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { useDashboards } from "@/features/factory/hooks/useDashboards";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import {
  PROFILE_CHANNELS, guessProfile, profileLabel, generateSeries, lastValue,
  type Channel, type DeviceProfileKey,
} from "@/features/factory/lib/deviceProfiles";
import { SecurityConfig, type SecurityValue } from "@/features/factory/components/panel/SecurityConfig";
import { ShareWithUsers } from "@/features/factory/components/panel/ShareWithUsers";
import { getLocationOptions } from "@/features/factory/lib/locations";

const hasPersian = (v: string) => /[\u0600-\u06FF]/.test(v || "");
const fa = (v: string) => (hasPersian(v) ? "font-vazirmatn" : "");

import { formatRelativeTime } from "@/features/factory/lib/relativeTime";
import {
  useGetDeviceActivitiesQuery,
  useGetDeviceByIdQuery,
  useGetDeviceCredentialsQuery,
  useEditDeviceMutation,
  useSendDeviceCommandMutation,
  useGetProductDeviceCommandsQuery,
  useGetDeviceAlarmsQuery,
  useAckAlarmMutation,
  useClearAlarmMutation,
  useGetDeviceTimeSeriesQuery,
  useCreateProductDeviceCommandMutation,
  useEditProductDeviceCommandMutation,
  useDeleteProductDeviceCommandMutation,
  type PaapeliProductDeviceCommand,
  type EntityFieldItem,
  type PaapeliAlarmListItem,
  type DeviceActivityResponse,
} from "@paapeli/api";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { localizedPath } from "@/features/factory/lib/localizedPath";

/** One page of a device's activity is all either table on this page shows. */
const ACTIVITY_PAGE_SIZE = 50;

/* The feed carries its own server-rendered description; the enum is the
   fallback when one is missing. These strings arrive from the gateway as-is
   and are not translated. */
const activityLabel = (a: DeviceActivityResponse) =>
  a.description || a.type.replace(/_/g, " ").toLowerCase();

const channelIcon = (key: string) => {
  switch (key) {
    case "temperature": return Thermometer;
    case "humidity": return Droplet;
    case "pressure": return Gauge;
    case "voltage": case "current": case "power": case "energy": return Zap;
    case "rms": case "peak": case "frequency": return Waves;
    case "flow_rate": case "total_volume": return Wind;
    default: return Activity;
  }
};

// Translate telemetry channel labels and device-profile (type) labels.
const CHANNEL_LABEL_KEY: Record<string, string> = {
  value: "chValue", temperature: "chTemperature", humidity: "chHumidity",
  voltage: "chVoltage", current: "chCurrent", power: "chPower", energy: "chEnergy",
  pressure: "chPressure", rms: "chRms", peak: "chPeak", frequency: "chFrequency",
  flow_rate: "chFlowRate", total_volume: "chTotalVolume",
};
const chLabel = (ch: Channel, t: (k: any) => string) =>
  CHANNEL_LABEL_KEY[ch.key] ? t(CHANNEL_LABEL_KEY[ch.key]) : ch.label;

const PROFILE_LABEL_KEY: Record<string, string> = {
  temperature: "profileTemperature", temperature_humidity: "profileTempHumidity",
  energy_meter: "profileEnergyMeter", pressure: "profilePressure", vibration: "profileVibration",
  flow_meter: "profileFlowMeter", humidity: "profileHumidity", voltage: "profileVoltage", generic: "profileGeneric",
};
const profileLabelT = (p: string, t: (k: any) => string) =>
  PROFILE_LABEL_KEY[p] ? t(PROFILE_LABEL_KEY[p]) : p;

// The API reports connectivity as a boolean; there is no third "error" state
// behind it, so a device is either online or it is not.
const deviceStatus = (d: UserDevice): "online" | "offline" =>
  d.active ? "online" : "offline";

const StatCard = ({
  icon: Icon, label, value, tone = "primary", trailing, onClick,
}: any) => {
  return (
  <Card
    className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
    onClick={onClick}
  >
    {/* No flex-row-reverse in RTL: a row already runs right to left there, so
        reversing it flipped the card back and put the icon on the far left,
        away from the title it belongs to. Plain `row` gives the icon beside
        the title on the right and leaves the chevron out on the left. */}
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
        tone === "primary" ? "bg-primary/10 text-primary"
          : tone === "blue" ? "bg-sky-500/10 text-sky-500"
          : tone === "violet" ? "bg-violet-500/10 text-violet-500"
          : tone === "rose" ? "bg-rose-500/10 text-rose-500"
          : tone === "emerald" ? "bg-emerald-500/10 text-emerald-500"
          : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-base font-semibold truncate">{value}</div>
      </div>
      {trailing}
    </CardContent>
  </Card>
  );
};

/** One page of alarms is all this page shows. */
const ALARM_PAGE_SIZE = 50;

/* `severity` and `status` come back as free strings — the spec documents no
   enum for either — so these map the values the backend actually emits onto
   the three buckets the badges render, and pass anything unrecognised through
   rather than silently mislabelling it. */
const normalizeSeverity = (raw: string): string => {
  switch (raw?.toUpperCase()) {
    case "CRITICAL":
    case "MAJOR":
    case "HIGH":
      return "High";
    case "MINOR":
    case "WARNING":
    case "MEDIUM":
      return "Medium";
    case "INDETERMINATE":
    case "LOW":
      return "Low";
    default:
      return raw;
  }
};

const normalizeAlarmStatus = (raw: string): string => {
  const v = raw?.toUpperCase() ?? "";
  if (v.startsWith("CLEARED")) return "Cleared";
  if (v.endsWith("_ACK") || v === "ACKNOWLEDGED") return "Acknowledged";
  if (v.startsWith("ACTIVE")) return "Active";
  return raw;
};

/** The row shape the alarm tables render, mapped from PaapeliAlarmListItem. */
interface AlarmRow {
  id: string;
  name: string;
  /** creationTime is epoch millis; the table formatter wants an ISO string. */
  time: string;
  severity: string;
  status: string;
}

const toAlarmRow = (a: PaapeliAlarmListItem): AlarmRow => ({
  id: a.id,
  name: a.name,
  time: new Date(a.creationTime).toISOString(),
  severity: normalizeSeverity(a.severity),
  status: normalizeAlarmStatus(a.status),
});

/** Alarms for one device, shared by the overview card and the alarms tab. */
const useDeviceAlarmRows = (deviceId: string | undefined, enabled = true) => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetDeviceAlarmsQuery(
    workspaceId ?? "", PRODUCT_KEY, deviceId ?? "", 0, ALARM_PAGE_SIZE, enabled,
  );
  const rows = useMemo(() => (data?.data ?? []).map(toAlarmRow), [data]);
  return { rows, isLoading };
};





const DeviceDetails = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { language, isRTL, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { items: devices, remove: removeDevice } = useDevices();
  const { items: gateways } = useGateways();
  const workspaceId = useWorkspaceId();
  const { options: locationOptions } = useAssetLocations();
  // The device's own audit trail.
  const { data: activityPage, isLoading: activitiesLoading } = useGetDeviceActivitiesQuery(
    workspaceId ?? "", PRODUCT_KEY, deviceId ?? "", 0, ACTIVITY_PAGE_SIZE,
  );
  const events = activityPage?.data ?? [];
  const { rows: alarms } = useDeviceAlarmRows(deviceId);

  const { data: credentials } = useGetDeviceCredentialsQuery(
    workspaceId ?? "", PRODUCT_KEY, deviceId ?? "",
  );
  const lp = (p: string) => localizedPath(p, language);

  // Prefer the row already in the cached list; otherwise fetch this one device,
  // which is what a deep link or a page reload hits.
  const listed = devices.find((d) => d.id === deviceId || d.deviceId === deviceId);
  const deviceQuery = useGetDeviceByIdQuery(
    workspaceId ?? "",
    PRODUCT_KEY,
    deviceId ?? "",
    !listed,
  );
  const fetched = deviceQuery.data;
  /* A 4xx means the server looked and there is no such device for us, which a
     retry won't change — that is "not found". Anything else (5xx, network,
     timeout) is a load failure worth retrying. 408/429 are transient. */
  const fetchStatus = (deviceQuery.error as { response?: { status?: number } } | null)?.response?.status;
  const fetchNotFound = !!fetchStatus && fetchStatus >= 400 && fetchStatus < 500 && fetchStatus !== 408 && fetchStatus !== 429;
  const deviceLoad = queryLoad(deviceQuery);
  // Without a workspace the query is disabled — that is still loading, not missing.
  const pageLoad = usePageLoad({
    loading: !listed && (deviceLoad.loading || !workspaceId),
    failed: !listed && deviceLoad.failed && !fetchNotFound,
    onRetry: deviceQuery.refetch,
  });

  const device = useMemo<UserDevice | null>(() => {
    if (listed) return listed;
    if (!fetched) return null;
    return {
      id: fetched.id,
      deviceId: fetched.id,
      name: fetched.name,
      label: fetched.label,
      type: fetched.type,
      protocol: fetched.protocol,
      active: fetched.active,
      assetId: fetched.assetId,
      location: locationOptions.find((l) => l.id === fetched.assetId)?.path,
      createdAt: fetched.createdAt,
      lastActivity: fetched.updatedAt,
    };
  }, [listed, fetched, locationOptions]);

  const { rows: latestTelemetry, isLoading: telemetryLoading } = useLatestTelemetryRows(
    device?.id, OVERVIEW_RANGE_H,
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [firmwareOpen, setFirmwareOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [insightDetail, setInsightDetail] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!device) {
    // Don't call it missing until the fetch has actually come back.
    if (pageLoad.status === "loading") {
      return <DetailPageSkeleton />;
    }
    if (pageLoad.status === "failed") {
      return <LoadFailed onRetry={pageLoad.retry} />;
    }
    return (
      <>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">{t("deviceNotFound")}</p>
          <Button onClick={() => navigate(lp("/devices"))}>
            <ArrowLeft className="h-4 w-4 me-2" /> {t("backToDevices")}
          </Button>
        </div>
      </>
    );
  }

  // The gateway exposes no tag surface for devices, so these render empty
  // rather than showing invented labels. Populate from the API when one exists.
  const deviceTags: string[] = [];
  const profile: DeviceProfileKey = guessProfile(device.name, "");
  const channels: Channel[] = PROFILE_CHANNELS[profile];
  const status = deviceStatus(device);
  const statusLabel = status === "online" ? t("online") : status === "offline" ? t("offline") : t("error");
  const statusDot = status === "online" ? "bg-emerald-500" : status === "offline" ? "bg-muted-foreground/50" : "bg-rose-500";
  const seed = (device.id?.charCodeAt(0) || 1) * 7;

  // Read-only view of the credentials/security method chosen at creation.
  // Credentials are their own endpoint, not part of the device record.
  // MQTT_BASIC returns its clientId/userName as a JSON string in credentialsValue.
  const basic = (() => {
    if (credentials?.credentialType !== "MQTT_BASIC" || !credentials.credentialsValue) return null;
    try {
      return JSON.parse(credentials.credentialsValue) as { clientId?: string; userName?: string };
    } catch {
      return null;
    }
  })();
  const securityView: SecurityValue = {
    method:
      credentials?.credentialType === "X509_CERTIFICATE"
        ? "ssl"
        : credentials?.credentialType === "MQTT_BASIC"
          ? "basic"
          : "accessToken",
    accessToken: credentials?.credentialsId ?? "",
    clientId: basic?.clientId ?? "",
    username: basic?.userName ?? "",
    password: "",
    sslCert: credentials?.credentialType === "X509_CERTIFICATE" ? credentials.credentialsValue ?? "" : "",
  };

  // Health metrics (deterministic)
  const healthScore = 60 + ((seed * 13) % 38);
  const failureRisk = healthScore > 80 ? t("low") : healthScore > 60 ? t("medium") : t("high");
  const failureRiskKey = healthScore > 80 ? "Low" : healthScore > 60 ? "Medium" : "High";

  const rulDays = 30 + ((seed * 5) % 180);

  const aiInsights = [
    {
      id: "ai-bearing",
      title: "Bearing Wear Detected",
      icon: Cpu,
      confidence: 87,
      severity: "warning",
      summary: "Vibration RMS trending upward over the last 72h.",
      recommendation: "Inspect bearing lubrication. Schedule maintenance within 2 weeks.",
      details: [
        "Vibration RMS increased 23% over 7 days.",
        "Frequency spectrum shows new peak at 47Hz.",
        "Correlated with ambient temperature rise of 4°C.",
      ],
    },
    {
      id: "ai-drift",
      title: "Sensor Calibration Drift",
      icon: Sparkles,
      confidence: 64,
      severity: "info",
      summary: "Slow baseline drift suggests recalibration in 14 days.",
      recommendation: "Run calibration routine during next maintenance window.",
      details: [
        "Baseline shifted +1.2% in 30 days.",
        "Within tolerance but trending.",
      ],
    },
    {
      id: "ai-cycle",
      title: "Duty Cycle Optimization",
      icon: Brain,
      confidence: 78,
      severity: "success",
      summary: "Operating profile suggests 8% energy saving potential.",
      recommendation: "Reduce reporting interval from 5s to 15s during idle periods.",
      details: [
        "Idle periods detected between 02:00–05:00.",
        "Estimated savings: 8% / month.",
      ],
    },
  ];

  const copy = async (val: string, key: string) => {
    try { await navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  // remove() is an HTTP call — await it, or a failed delete still reports
  // success and navigates away while the device is still there.
  const onDelete = async () => {
    try {
      await removeDevice(device.id);
      toast({ title: t("deleted") || "Device deleted", description: device.name });
      navigate(lp("/devices"));
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToDeleteDevices"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <TooltipProvider>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/devices"))} className="cursor-pointer">{t("assets")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/devices"))} className="cursor-pointer">{t("devices")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className={fa(device.name)}>{device.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header card */}
        <Card className="mb-4">
          <CardContent className="p-5 flex flex-wrap items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Thermometer className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold truncate ${fa(device.name)}`}>{device.name}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`gap-1.5 ${status === "online" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : status === "offline" ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  {statusLabel}
                </Badge>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <LocationCell path={device.location} />
                </span>
                {deviceTags.map((tg: string) => (
                  <Badge key={tg} variant="outline" className="text-xs font-normal">{tg}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCommandOpen(true)}>
                <Play className="h-4 w-4 me-2" /> {t("sendCommand")}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 me-2" /> {t("edit")}
              </Button>
              <Button variant="outline" onClick={() => setRestartOpen(true)}>
                <RefreshCw className="h-4 w-4 me-2" /> {t("restart")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><ChevronDown className="h-4 w-4 me-1" /> {t("more")} <MoreHorizontal className="h-4 w-4 ms-2" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(lp("/firmware?tab=devices"))}><Upload className="h-4 w-4 me-2" /> {t("firmwareUpdate")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 me-2" /> {t("deleteDevice")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>


        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Wifi} label={t("status")} value={statusLabel} tone={status === "online" ? "emerald" : "rose"} />
          <StatCard icon={Clock} label={t("lastUpdate")} value={formatRelativeTime(device.lastActivity || device.createdAt, t, formatNumber)} tone="blue" />
          <StatCard icon={Network} label={t("gateway")} value={device.gateway || t("noData")} tone="violet" />
          <StatCard
            icon={Bell}
            label={t("activeAlarms")}
            value={alarms.filter((a) => a.status === "Active").length}
            tone="rose"
            trailing={isRTL ? <ChevronLeft className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            onClick={() => setActiveTab("alarms")}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-2">
            {[
              { v: "overview", label: t("overview"), icon: Activity },
              { v: "telemetry", label: language === "fa" ? "آخرین داده" : language === "ar" ? "أحدث البيانات" : "Latest Data", icon: Waves },
              { v: "alarms", label: t("alarms"), icon: Bell, badge: alarms.filter((a) => a.status === "Active").length },
              
              { v: "events", label: t("events"), icon: Calendar },
              { v: "settings", label: t("settings"), icon: SettingsIcon },
            ].map(({ v, label, icon: I, badge }) => (
              <TabsTrigger key={v} value={v}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-4 py-2.5 gap-2">
                <I className="h-4 w-4" />
                {label}
                {badge ? <Badge className="h-5 px-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/10">{badge}</Badge> : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Device Information */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("deviceInformation")}</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <InfoRow label={t("deviceId")} value={device.deviceId} />
                  <InfoRow label={t("type")} value={profileLabelT(profile, t)} />
                  <InfoRow label={t("protocol")} value={device.protocol} />
                  <InfoRow label={t("gateway")} value={device.gateway || "—"} />
                  <InfoRow label={t("location")} value={<LocationCell path={device.location} />} />
                  <InfoRow label={t("created")} value={formatDate(device.createdAt, language)} />
                  {/* Through InfoRow like every other row, rather than a
                      hand-rolled copy of it that missed the RTL handling and
                      left this one line running the wrong way. */}
                  <InfoRow
                    label={t("tags")}
                    value={
                      <span className={`flex flex-wrap gap-1 ${isRTL ? "justify-end" : ""}`}>
                        {deviceTags.length === 0
                          ? <span className="text-muted-foreground">—</span>
                          : deviceTags.map((tg) => (
                            <Badge key={tg} variant="secondary" className={fa(tg)}>{tg}</Badge>
                          ))}
                      </span>
                    }
                  />
                  <InfoRow label={t("description")} value={device.description || "—"} className={fa(device.description || "")} />
                </CardContent>
              </Card>


              {/* Latest Values — last 5 telemetry keys (same data as the Latest Data tab) */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("latestValues")}</CardTitle></CardHeader>
                <CardContent>
                  {status === "offline" ? <OfflineNotice /> : (
                    <>
                      <div className="divide-y divide-border">
                        {telemetryLoading ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">…</div>
                        ) : latestTelemetry.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">{t("noData")}</div>
                        ) : latestTelemetry
                          // The five newest readings, whichever keys they came
                          // from, so a device reporting one key still fills the card.
                          .flatMap((r) => r.points.map((p, i) => ({ id: `${r.key}|${p.ts}|${i}`, key: r.key, value: p.value, at: Number(p.ts) })))
                          .sort((a, b) => b.at - a.at)
                          .slice(0, 5)
                          .map((r) => (
                            <div key={r.id} className={`flex items-center justify-between gap-3 py-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className="min-w-0">
                                <span className="block text-sm text-muted-foreground truncate">{r.key}</span>
                                <span className="block text-xs text-muted-foreground/70">{fmtDateTime(r.at, language)}</span>
                              </span>
                              <span className="text-sm font-semibold text-foreground shrink-0 tabular-nums">{r.value}</span>
                            </div>
                          ))}
                      </div>
                      <Button variant="link" className="text-primary w-full mt-2" onClick={() => setActiveTab("telemetry")}>{t("viewAllData")}</Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Device Health */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("deviceHealth")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {status === "offline" ? <OfflineNotice /> : (<>
                  <HealthGauge score={healthScore} />
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className={isRTL ? "text-right" : ""}>
                      <div className="text-xs text-muted-foreground mb-1">{t("failureRisk")}</div>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <ShieldCheck className={`h-4 w-4 ${failureRiskKey === "Low" ? "text-emerald-500" : failureRiskKey === "Medium" ? "text-amber-500" : "text-rose-500"}`} />
                        <span className="text-sm font-medium">{failureRisk}</span>
                      </div>
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <div className="text-xs text-muted-foreground mb-1">{t("remainingUsefulLife")}</div>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Calendar className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-medium">{rulDays} {t("days")}</span>
                      </div>
                    </div>
                  </div>
                  </>)}
                </CardContent>
              </Card>
            </div>


            {/* Recent rows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">{t("recentActivity")}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("time")}</TableHead><TableHead>{t("event")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.slice(0, 5).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-muted-foreground">{formatRelativeTime(e.occurredAt, t, formatNumber)}</TableCell>
                          <TableCell>{activityLabel(e)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="link" className="text-primary w-full mt-2" onClick={() => setActiveTab("events")}>{t("viewAllActivity")}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{t("recentAlarms")}</CardTitle>
                  <Button variant="link" className="text-primary h-auto p-0" onClick={() => setActiveTab("alarms")}>{t("viewAll")}</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("time")}</TableHead><TableHead>{t("severity")}</TableHead><TableHead>{t("rule")}</TableHead><TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alarms.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">{t("noAlarms")}</TableCell></TableRow>
                      ) : alarms.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-muted-foreground">{formatRelativeTime(a.time, t, formatNumber)}</TableCell>
                          <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                          <TableCell>{a.name}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

            </div>

            <div className="text-xs text-muted-foreground px-1">
              {t("created")}: {formatDateTime(device.createdAt, language)} &nbsp;·&nbsp;
              {t("lastUpdate")}: {formatRelativeTime(device.lastActivity || device.createdAt, t, formatNumber)}
            </div>
          </TabsContent>


          {/* TELEMETRY */}
          <TabsContent value="telemetry" className="space-y-4 mt-4">
            <TelemetryTab deviceId={device.id} />
          </TabsContent>

          {/* ALARMS */}
          <TabsContent value="alarms" className="space-y-4 mt-4">
            <DeviceAlarms device={device} />
          </TabsContent>


          {/* EVENTS */}
          <TabsContent value="events" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("activityHistory")}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
                    <Search className={`h-4 w-4 absolute ${isRTL ? "right-2.5" : "start-2.5"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
                    <Input placeholder={t("searchEvents")} className={`${isRTL ? "pr-8 w-56 h-9 text-right placeholder:text-right" : "ps-8 w-56 h-9 text-left placeholder:text-left"}`} />
                  </div>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> {t("export")}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("time")}</TableHead><TableHead>{t("activity")}</TableHead><TableHead>{t("triggeredBy")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activitiesLoading ? (
                      <TableRowsSkeleton rows={4} columns={3} />
                    ) : events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">{t("noActivityYet")}</TableCell>
                      </TableRow>
                    ) : events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(e.occurredAt, t, formatNumber)}</TableCell>
                        <TableCell>{activityLabel(e)}</TableCell>
                        <TableCell className="text-muted-foreground">{e.actorName || e.actorType}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("basicSettings")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4 me-2" /> {t("edit")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label={t("name")} value={device.name} />
                <InfoRow label={t("description")} value={device.description || t("noData")} />
                <InfoRow label={t("tags")} value={
                  <div className="flex flex-wrap gap-1">
                    {(deviceTags.length ? deviceTags : [t("noData")]).map((tg, i) =>
                      tg === t("noData") ? <span key={i} className="text-muted-foreground">{tg}</span> :
                      <Badge key={i} variant="secondary" className={fa(tg)}>{tg.trim()}</Badge>
                    )}
                  </div>
                } />
                <InfoRow label={t("location")} value={<LocationCell path={device.location} />} />
                <InfoRow label={t("gateway")} value={device.gateway || t("noData")} />
                <div className="flex gap-2 pt-2">
                  {/* No endpoint moves a device between locations yet. */}
                  <Button variant="outline" size="sm" disabled><MapPin className="h-4 w-4 me-2" /> {t("moveLocation")}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> {t("credentialsSecurity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SecurityConfig value={securityView} readOnly />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("shareWithUsers")}</CardTitle></CardHeader>
              <CardContent>
                <ShareWithUsers value={device.sharedUsers || []} readOnly />
              </CardContent>
            </Card>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4" /> {t("advancedSettings")}
                    </CardTitle>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <CredentialRow label={t("deviceId")} value={device.deviceId} onCopy={() => copy(device.deviceId, "did")} copied={copied === "did"} />
                    <CredentialRow label={t("accessToken")} value={device.apiKey} mask onCopy={() => copy(device.apiKey, "tok")} copied={copied === "tok"} />
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <CredentialRow label={t("mqttHost")} value="mqtt.paapeli.com" />
                      <CredentialRow label={t("mqttPort")} value={device.useSsl ? "8883" : "1883"} />
                      <CredentialRow label={t("mqttUsername")} value={device.deviceId} />
                      <CredentialRow label={t("mqttPassword")} value={device.apiKey} mask />
                    </div>
                  </CardContent>

                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>
        </Tabs>

        {/* === DIALOGS === */}
        <EditDeviceDialog open={editOpen} onOpenChange={setEditOpen} device={device} />
        <SendCommandDialog open={commandOpen} onOpenChange={setCommandOpen} device={device} />
        <FirmwareDialog open={firmwareOpen} onOpenChange={setFirmwareOpen} />
        <MoveLocationDialog open={moveOpen} onOpenChange={setMoveOpen} device={device} />
        <RawDataDialog open={rawOpen} onOpenChange={setRawOpen} channels={channels} seed={seed} />
        <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("restartThisDevice")}</AlertDialogTitle>
              <AlertDialogDescription>{t("restartDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => toast({ title: t("restart"), description: device.name })}>
                {t("restart")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteDeviceQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                "<span className={fa(device.name)}>{device.name}</span>" {t("deleteDevicePermanent")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {/* AI insight detail */}
        <Dialog open={!!insightDetail} onOpenChange={(v) => !v && setInsightDetail(null)}>
          <DialogContent className="max-w-lg">
            {insightDetail && (
              <>
                <DialogHeader>
                  <DialogTitle>{insightDetail.title}</DialogTitle>
                  <DialogDescription>Confidence {insightDetail.confidence}%</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm">{insightDetail.summary}</p>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Signals</h4>
                    <ul className="list-disc ps-5 space-y-1 text-sm text-muted-foreground">
                      {insightDetail.details.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                    <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">Recommendation</div>
                    <p className="text-sm">{insightDetail.recommendation}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInsightDetail(null)}>Close</Button>
                  <Button onClick={() => { toast({ title: "Work order created" }); setInsightDetail(null); }}>
                    Create Work Order
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </>
  );
};

// ============ Sub-components ============

const OfflineNotice = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-2 ${compact ? "py-6" : "py-10"}`}>
      <WifiOff className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">{t("offlineMetricsTitle")}</p>
      <p className="text-xs text-muted-foreground max-w-[16rem]">{t("offlineMetricsDesc")}</p>
    </div>
  );
};

const InfoRow = ({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) => {
  const { language, isRTL } = useLanguage();
  const size = language === "en" ? "text-sm" : "text-[15px]";
  return (
    <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""} ${size}`}>
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className={`flex-1 ${isRTL ? "text-right" : ""} ${className}`}>{value}</span>
    </div>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const { t } = useLanguage();
  const cls = severity === "High" ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
    : severity === "Medium" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
    : "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10";
  const label = severity === "High" ? t("high") : severity === "Medium" ? t("medium") : t("low");
  return <Badge className={cls}><AlertTriangle className="h-3 w-3 me-1" />{label}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  const cls = status === "Active" ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
    : status === "Acknowledged" ? "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10"
    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10";
  const label = status === "Active" ? t("active") : status === "Acknowledged" ? t("acknowledged") : t("cleared");
  return <Badge className={cls}>{label}</Badge>;
};

const HealthGauge = ({ score }: { score: number }) => {
  const { t } = useLanguage();
  const tone = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500";
  const label = score >= 80 ? t("excellent") : score >= 60 ? t("good") : t("needsAttention");
  const stroke = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#F43F5E";
  const r = 60, c = Math.PI * r, off = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d="M 20 90 A 70 70 0 0 1 160 90" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <path d="M 20 90 A 70 70 0 0 1 160 90" stroke={stroke} strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(0)" pathLength={c} />
        <text x="90" y="78" textAnchor="middle" className={`text-3xl font-bold ${tone}`} fill="currentColor">{score}%</text>
      </svg>
      <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-1 px-2">
        <span>0</span><span className={`font-medium ${tone}`}>{label}</span><span>100</span>
      </div>
    </div>
  );
};

const CredentialRow = ({ label, value, mask, onCopy, copied }: { label: string; value?: string; mask?: boolean; onCopy?: () => void; copied?: boolean }) => {
  const [show, setShow] = useState(false);
  // A credential the API never returns (e.g. the access token after creation)
  // arrives undefined; showing a dash beats crashing on its length.
  const text = value ?? "";
  const display = !text ? "—" : mask && !show ? "•".repeat(Math.min(text.length, 20)) : text;
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input value={display} readOnly className="font-mono text-xs" dir="ltr" />
        {mask && !!text && <Button variant="outline" size="icon" onClick={() => setShow(!show)}><KeyRound className="h-4 w-4" /></Button>}
        {onCopy && !!text && <Button variant="outline" size="icon" onClick={onCopy}>{copied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</Button>}
      </div>
    </div>
  );
};

/* Latest-telemetry tab (ThingsBoard-style): key/value table with select,
   pagination, delete strategy, and "show on widget → add to dashboard".
   Rows come from the device's time-series history endpoint. */

/* Telemetry timestamps, down to the second, in the reader's own calendar —
   this used to assemble a Gregorian YYYY-MM-DD by hand. */
const fmtDateTime = (ms: number, language: string) => formatDateTime(ms, language, { seconds: true });

/* The export keeps that Gregorian YYYY-MM-DD. A CSV is read by a spreadsheet
   as often as by a person, and a Jalali date in a date column parses as
   nothing at all — the calendar belongs on screen, not in the file. */
const fmtDateTimeIso = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/* Lookback windows offered on the Latest Data tab, in minutes. The history
   endpoint only takes whole hours (it clamps to 1–24), so the hour is fetched
   and the shorter windows are trimmed from it here. */
const TELEMETRY_RANGES_MIN = [1, 15, 60] as const;
const DEFAULT_TELEMETRY_RANGE_MIN = 60;
/** Hours to ask the API for, to cover a window given in minutes. */
const rangeHours = (minutes: number) => Math.max(1, Math.ceil(minutes / 60));
/* The Overview card looks a full day back, so a device that has been quiet for
   a few hours still shows its last readings. */
const OVERVIEW_RANGE_H = 24;

export interface TelemetryRow {
  key: string;
  value: string;
  updatedAt: number;
  /** Every point for this key in the lookback window, newest first. */
  points: EntityFieldItem[];
}

/* Latest telemetry rows (key/value/updatedAt) — shared by the Latest Data
   tab and the Overview "Latest Values" card so both show the same data.
   The history endpoint returns each key's points in ascending ts order, so
   the last point of every series is that key's latest value. */
const useLatestTelemetryRows = (deviceId: string | undefined, hours: number) => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading, isError } = useGetDeviceTimeSeriesQuery(
    workspaceId ?? "", PRODUCT_KEY, deviceId ?? "", hours,
  );
  const rows = useMemo<TelemetryRow[]>(
    () => Object.entries(data ?? {}).flatMap(([key, points]) => {
      const last = points[points.length - 1];
      return last ? [{ key, value: last.value, updatedAt: last.ts, points: [...points].reverse() }] : [];
    }),
    [data],
  );
  return { rows, isLoading, isError };
};

const TELE_WIDGETS = ["Tables", "Charts", "Cards", "Analogue gauges", "Alarm widgets"] as const;

const TELE_L = {
  en: { actions: "Actions", addToWidget: "Add to Widget", title: "Latest Data", lastUpdate: "Last update time", key: "Key", value: "Value", selected: "telemetry units selected", showOnWidget: "Show on widget", del: "Delete", deleteStrategy: "Delete strategy", strategy: "Strategy", delAll: "Delete all data", delExcept: "Delete all data except latest value", delLatest: "Delete latest value", delPeriod: "Delete all data for time period", cancel: "Cancel", itemsPerPage: "Items per page:", of: "of", timeSeriesTable: "Time series table", realtime: "Realtime - last 1 hour", timestamp: "Timestamp", addToDashboard: "Add to dashboard", addWidget: "Add widget to dashboard", selectExisting: "Select existing dashboard", createNew: "Create new dashboard", dashboard: "Dashboard", newTitle: "New dashboard title", openDashboard: "Open dashboard", add: "Add", deleted: "Telemetry deleted", added: "Widget added to dashboard", empty: "No telemetry", search: "Search keys", export: "Export", widget: "Widget", noDashboards: "No dashboards available", deleteOneTitle: "Delete telemetry?", deleteOneDesc: "This telemetry key will be permanently removed:", exported: "Data exported", range1m: "Last 1 minute", range15m: "Last 15 minutes", range60m: "Last 1 hour" },
  fa: { actions: "عملیات", addToWidget: "افزودن به ویجت", title: "آخرین داده", lastUpdate: "زمان آخرین به‌روزرسانی", key: "کلید", value: "مقدار", selected: "تله‌متری انتخاب شد", showOnWidget: "نمایش در ویجت", del: "حذف", deleteStrategy: "راهبرد حذف", strategy: "راهبرد", delAll: "حذف همه‌ی داده‌ها", delExcept: "حذف همه‌ی داده‌ها به‌جز آخرین مقدار", delLatest: "حذف آخرین مقدار", delPeriod: "حذف داده‌ها برای یک بازه‌ی زمانی", cancel: "انصراف", itemsPerPage: "تعداد در هر صفحه:", of: "از", timeSeriesTable: "جدول سری‌زمانی", realtime: "زنده - یک ساعت اخیر", timestamp: "زمان", addToDashboard: "افزودن به داشبورد", addWidget: "افزودن ویجت به داشبورد", selectExisting: "انتخاب داشبورد موجود", createNew: "ایجاد داشبورد جدید", dashboard: "داشبورد", newTitle: "عنوان داشبورد جدید", openDashboard: "باز کردن داشبورد", add: "افزودن", deleted: "تله‌متری حذف شد", added: "ویجت به داشبورد اضافه شد", empty: "تله‌متری وجود ندارد", search: "جستجوی کلید", export: "خروجی", widget: "ویجت", noDashboards: "داشبوردی وجود ندارد", deleteOneTitle: "این داده حذف شود؟", deleteOneDesc: "این کلید تله‌متری برای همیشه حذف می‌شود:", exported: "خروجی داده‌ها گرفته شد", range1m: "۱ دقیقه اخیر", range15m: "۱۵ دقیقه اخیر", range60m: "۱ ساعت اخیر" },
  ar: { actions: "إجراءات", addToWidget: "إضافة إلى وِدجت", title: "أحدث البيانات", lastUpdate: "وقت آخر تحديث", key: "المفتاح", value: "القيمة", selected: "وحدة قياس محددة", showOnWidget: "عرض في وِدجت", del: "حذف", deleteStrategy: "استراتيجية الحذف", strategy: "الاستراتيجية", delAll: "حذف كل البيانات", delExcept: "حذف كل البيانات عدا آخر قيمة", delLatest: "حذف آخر قيمة", delPeriod: "حذف البيانات لفترة زمنية", cancel: "إلغاء", itemsPerPage: "عناصر لكل صفحة:", of: "من", timeSeriesTable: "جدول السلاسل الزمنية", realtime: "مباشر - آخر ساعة", timestamp: "الطابع الزمني", addToDashboard: "إضافة إلى اللوحة", addWidget: "إضافة وِدجت إلى اللوحة", selectExisting: "اختر لوحة موجودة", createNew: "إنشاء لوحة جديدة", dashboard: "اللوحة", newTitle: "عنوان اللوحة الجديدة", openDashboard: "فتح اللوحة", add: "إضافة", deleted: "تم حذف القياس", added: "تمت إضافة الوِدجت", empty: "لا توجد قياسات", search: "بحث المفاتيح", export: "تصدير", widget: "وِدجت", noDashboards: "لا توجد لوحات", deleteOneTitle: "حذف هذا القياس؟", deleteOneDesc: "سيتم حذف مفتاح القياس هذا نهائيًا:", exported: "تم تصدير البيانات", range1m: "آخر دقيقة", range15m: "آخر ١٥ دقيقة", range60m: "آخر ساعة" },
} as const;

const WIDGET_COLORS = ["hsl(28 100% 50%)", "hsl(197 100% 40%)", "hsl(160 84% 39%)", "hsl(280 70% 55%)", "hsl(340 80% 55%)"];
const PREVIEW_ALARMS = [
  { sev: "bg-rose-500", msg: "High temperature", time: "2m ago" },
  { sev: "bg-amber-500", msg: "Vibration warning", time: "18m ago" },
  { sev: "bg-rose-500", msg: "Pressure critical", time: "1h ago" },
  { sev: "bg-sky-500", msg: "Device reconnected", time: "3h ago" },
];
/** One telemetry point as the Latest Data tab lists it. */
type PreviewRow = { key: string; value: string; updatedAt: number };

/** The newest point for a key. */
const latestRow = (rows: PreviewRow[], k: string) =>
  rows.reduce<PreviewRow | undefined>((best, r) => (r.key === k && (!best || r.updatedAt > best.updatedAt) ? r : best), undefined);

const numVal = (rows: PreviewRow[], k: string) => toNumber(latestRow(rows, k)?.value);

function TeleGauge({ label, pct, value }: { label: string; pct: number; value: string }) {
  const C = Math.PI * 40;
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div className="flex flex-col items-center rounded-xl border border-border p-3">
      <svg viewBox="0 0 100 58" className="w-full max-w-[130px]">
        <path d="M10 54 A40 40 0 0 1 90 54" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" strokeLinecap="round" />
        <path d="M10 54 A40 40 0 0 1 90 54" fill="none" stroke="hsl(28 100% 50%)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={on ? C * (1 - pct / 100) : C} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <p className="-mt-1 text-lg font-bold text-primary">{value}</p>
      <p className="w-full truncate text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* Preview shown in the "Add to Widget" dialog — switches on the chosen
   widget bundle (Tables / Charts / Cards / Analogue gauges / Alarm widgets). */
function TeleWidgetPreview({ type, keys, rows, timestampLabel }: { type: string; keys: string[]; rows: PreviewRow[]; timestampLabel: string }) {
  const { language } = useLanguage();
  const numericKeys = keys.filter((k) => rows.some((r) => r.key === k && toNumber(r.value) !== null));
  // The real points of the selected keys, merged on timestamp, oldest first.
  const series = useMemo(() => {
    const byTs = new Map<number, Record<string, number>>();
    rows.forEach((r) => {
      if (!numericKeys.includes(r.key)) return;
      const y = toNumber(r.value);
      if (y === null) return;
      const point = byTs.get(r.updatedAt) ?? { t: r.updatedAt };
      point[r.key] = y;
      byTs.set(r.updatedAt, point);
    });
    return [...byTs.values()].sort((a, b) => a.t - b.t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, keys.join(",")]);
  // Distinct timestamps of the selected keys, newest first, for the table preview.
  const tableTimes = [...new Set(rows.filter((r) => keys.includes(r.key)).map((r) => r.updatedAt))]
    .sort((a, b) => b - a)
    .slice(0, 50);

  if (type === "Charts") {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <defs>
              {numericKeys.map((k, i) => (
                <linearGradient key={k} id={`tg-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={WIDGET_COLORS[i % WIDGET_COLORS.length]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={WIDGET_COLORS[i % WIDGET_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="t" hide />
            <YAxis width={32} tick={{ fontSize: 11 }} />
            <RTooltip labelFormatter={(ts) => fmtDateTime(Number(ts), language)} />
            {numericKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} connectNulls stroke={WIDGET_COLORS[i % WIDGET_COLORS.length]} strokeWidth={2} fill={`url(#tg-${i})`} isAnimationActive animationDuration={900} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "Cards") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {keys.map((k, i) => (
          <div key={k} className="rounded-xl border border-border p-4">
            <p className="truncate text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{latestRow(rows, k)?.value ?? "—"}</p>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <Area type="monotone" dataKey={numericKeys.includes(k) ? k : numericKeys[0]} stroke={WIDGET_COLORS[i % WIDGET_COLORS.length]} strokeWidth={1.5} fill={WIDGET_COLORS[i % WIDGET_COLORS.length]} fillOpacity={0.15} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "Analogue gauges") {
    const gk = (numericKeys.length ? numericKeys : keys).slice(0, 6);
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {gk.map((k) => {
          const base = numVal(rows, k) ?? 60;
          const pct = Math.max(4, Math.min(100, base > 100 ? base % 100 : base));
          return <TeleGauge key={k} label={k} pct={pct} value={latestRow(rows, k)?.value ?? "—"} />;
        })}
      </div>
    );
  }

  if (type === "Alarm widgets") {
    return (
      <div className="divide-y divide-border rounded-lg border border-border">
        {PREVIEW_ALARMS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${a.sev}`} />
            <span className="flex-1">{a.msg}</span>
            <span className="text-xs text-muted-foreground">{a.time}</span>
          </div>
        ))}
      </div>
    );
  }

  // Tables (default)
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{timestampLabel}</TableHead>
            {keys.map((k) => <TableHead key={k}>{k}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableTimes.map((ts) => (
            <TableRow key={ts}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(ts, language)}</TableCell>
              {keys.map((k) => <TableCell key={k}>{rows.find((x) => x.key === k && x.updatedAt === ts)?.value ?? "—"}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const TelemetryTab = ({ deviceId }: { deviceId: string }) => {
  const { language, isRTL, t } = useLanguage();
  const L = TELE_L[(language as "en" | "fa" | "ar")] ?? TELE_L.en;
  const { toast } = useToast();
  const { items: dashboards } = useDashboards();

  // The range is in minutes; the API is asked for whole hours around it.
  const [range, setRange] = useState(String(DEFAULT_TELEMETRY_RANGE_MIN));
  const { rows: fetchedRows, isLoading } = useLatestTelemetryRows(deviceId, rangeHours(Number(range)));

  // There is no telemetry delete endpoint yet, so deletes only hide rows locally.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  // One row per data point the API returned, not one per key, kept to the
  // chosen window since the API's shortest lookback is an hour.
  const rows = useMemo(
    () => {
      const since = Date.now() - Number(range) * 60_000;
      return fetchedRows
        .flatMap((r) => r.points.map((p, i) => ({ id: `${r.key}|${p.ts}|${i}`, key: r.key, value: p.value, updatedAt: p.ts })))
        .filter((r) => r.updatedAt >= since && !removedIds.has(r.id));
    },
    [fetchedRows, removedIds, range],
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [strategy, setStrategy] = useState("all");
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetType, setWidgetType] = useState<string>(TELE_WIDGETS[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [dashMode, setDashMode] = useState<"existing" | "new">("existing");
  const [existingDash, setExistingDash] = useState("");
  const [newDash, setNewDash] = useState("");
  const [openDash, setOpenDash] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...rows]
      .filter((r) => !q || r.key.toLowerCase().includes(q))
      .sort((a, b) => (sortAsc ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)) || b.updatedAt - a.updatedAt);
  }, [rows, sortAsc, query]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const allOnPageChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allOnPageChecked) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    return next;
  });
  const toggleOne = (k: string) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  // Bulk delete keeps the strategy dialog; single-row delete is a plain confirm.
  const confirmBulkDelete = () => {
    const ids = [...selected];
    setRemovedIds((prev) => new Set([...prev, ...ids]));
    setSelected(new Set());
    setDeleteOpen(false);
    toast({ title: L.deleted });
  };
  const confirmRowDelete = () => {
    if (!confirmKey) return;
    const k = confirmKey;
    setRemovedIds((prev) => new Set(prev).add(k));
    setSelected((prev) => { const n = new Set(prev); n.delete(k); return n; });
    setConfirmKey(null);
    toast({ title: L.deleted });
  };

  const exportCsv = () => {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const header = [L.timestamp, L.key, L.value].map(esc).join(",");
    const body = filtered.map((r) => [fmtDateTimeIso(r.updatedAt), r.key, r.value].map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "latest-data.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: L.exported });
  };

  // The widget preview works per telemetry key, whichever of its rows were ticked.
  const selectedKeys = [...new Set(rows.filter((r) => selected.has(r.id)).map((r) => r.key))];
  const confirmRow = rows.find((r) => r.id === confirmKey);
  const confirmAdd = () => { setAddOpen(false); toast({ title: L.added }); };

  return (
    <>
      {/* dir spelled out on the card rather than left to inherit: the tab's
          contents were rendering left-to-right inside a right-to-left page,
          which put the card title and the checkbox column on the wrong side.
          Stating it here makes the whole card mirror as one — header, table
          columns and all — and is a no-op in English. */}
      <Card dir={isRTL ? "rtl" : "ltr"}>
        {/* Toolbar (search + export), matching the Events tab */}
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">{L.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={(v) => { setRange(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TELEMETRY_RANGES_MIN.map((m) => (
                  <SelectItem key={m} value={String(m)}>{L[`range${m}m`]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
              <Search className={`h-4 w-4 absolute ${isRTL ? "right-2.5" : "start-2.5"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder={L.search}
                className={`${isRTL ? "pr-8 w-56 h-9 text-right placeholder:text-right" : "ps-8 w-56 h-9 text-left placeholder:text-left"}`}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> {L.export} <ChevronDown className="h-4 w-4 ms-1" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}><FileText className="h-4 w-4 me-2" /> .CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Actions — disabled until rows are selected (like the device list) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={selected.size === 0}>{L.actions} <ChevronDown className="h-4 w-4 ms-1" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setWidgetOpen(true)}><LayoutGrid className="h-4 w-4 me-2" /> {L.addToWidget}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setStrategy("all"); setDeleteOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 me-2" /> {L.del}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10"><Checkbox checked={allOnPageChecked} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>{L.timestamp}</TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1" onClick={() => setSortAsc((a) => !a)}>
                    {L.key} {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  </button>
                </TableHead>
                <TableHead>{L.value}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(r.updatedAt, language)}</TableCell>
                  <TableCell className="font-medium">{r.key}</TableCell>
                  {/* A reading is a number, and a lone "-3" in an RTL cell
                      renders with the sign on the wrong end. */}
                  <TableCell className="tabular-nums" dir="ltr">{r.value}</TableCell>
                  <TableCell>
                    <button onClick={() => setConfirmKey(r.id)} className="text-muted-foreground hover:text-destructive" aria-label={L.del}><Trash2 className="h-4 w-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && <TableRowsSkeleton rows={4} columns={5} />}
              {!isLoading && pageRows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{L.empty}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination — same pattern as the device list */}
          {total > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[72px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-3">{startIndex + 1}-{Math.min(startIndex + pageSize, total)} {t("of")} {total}</span>
              </div>
              <SmartPagination currentPage={page} totalPages={totalPages} onChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk delete — strategy dialog (from the selection bar) */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{L.deleteStrategy}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{L.strategy}</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.delAll}</SelectItem>
                <SelectItem value="except">{L.delExcept}</SelectItem>
                <SelectItem value="latest">{L.delLatest}</SelectItem>
                <SelectItem value="period">{L.delPeriod}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{L.cancel}</Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>{L.del}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single-row delete — plain confirmation */}
      <AlertDialog open={!!confirmKey} onOpenChange={(o) => { if (!o) setConfirmKey(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{L.deleteOneTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {L.deleteOneDesc} <span className="font-medium text-foreground">{confirmRow ? `${confirmRow.key} · ${fmtDateTime(confirmRow.updatedAt, language)}` : ""}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{L.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmRowDelete}>{L.del}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Show on widget dialog */}
      <Dialog open={widgetOpen} onOpenChange={setWidgetOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl">
          <DialogHeader><DialogTitle>{L.addToWidget}</DialogTitle></DialogHeader>
          <div className={`flex items-center gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
            <span className="text-sm text-muted-foreground">{L.widget}</span>
            <Select value={widgetType} onValueChange={setWidgetType}>
              <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TELE_WIDGETS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="py-1">
            <TeleWidgetPreview type={widgetType} keys={selectedKeys} rows={rows} timestampLabel={L.timestamp} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWidgetOpen(false)}>{L.cancel}</Button>
            <Button onClick={() => { setWidgetOpen(false); setAddOpen(true); }}><LayoutGrid className="h-4 w-4 me-2" /> {L.addToDashboard}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to dashboard dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-xl">
          <DialogHeader><DialogTitle>{L.addWidget}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <button type="button" onClick={() => setDashMode("existing")} className={`rounded-lg border p-3 text-start ${dashMode === "existing" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <span className={`h-3.5 w-3.5 rounded-full border ${dashMode === "existing" ? "border-primary bg-primary" : "border-input"}`} /> {L.selectExisting}
              </div>
              {dashboards.length === 0 ? (
                <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">{L.noDashboards}</div>
              ) : (
                <Select value={existingDash} onValueChange={setExistingDash} disabled={dashMode !== "existing"}>
                  <SelectTrigger><SelectValue placeholder={L.dashboard} /></SelectTrigger>
                  <SelectContent>
                    {dashboards.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </button>
            <button type="button" onClick={() => setDashMode("new")} className={`rounded-lg border p-3 text-start ${dashMode === "new" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <span className={`h-3.5 w-3.5 rounded-full border ${dashMode === "new" ? "border-primary bg-primary" : "border-input"}`} /> {L.createNew}
              </div>
              <Input placeholder={L.newTitle} disabled={dashMode !== "new"} value={newDash} onChange={(e) => setNewDash(e.target.value)} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={openDash} onCheckedChange={(v) => setOpenDash(!!v)} /> {L.openDashboard}</label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{L.cancel}</Button>
            <Button onClick={confirmAdd} disabled={dashMode === "existing" ? !existingDash : !newDash.trim()}>{L.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Checkmark = ({ on }: { on: boolean }) => (
  <span className={`me-2 h-4 w-4 rounded border flex items-center justify-center ${on ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
    {on && <CheckCheck className="h-3 w-3" />}
  </span>
);

const DeviceAlarms = ({ device }: { device: UserDevice }) => {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const { t, formatNumber } = useLanguage();
  const workspaceId = useWorkspaceId();
  const { rows, isLoading } = useDeviceAlarmRows(device?.id);
  const ackAlarm = useAckAlarmMutation();
  const clearAlarm = useClearAlarmMutation();
  const filtered = rows.filter(a =>
    (severity === "all" || a.severity.toLowerCase() === severity) &&
    (status === "all" || a.status.toLowerCase() === status)
  );
  const { toast } = useToast();

  /* Both endpoints are POST /alarms/{ws}/{pk}/{ack|clear}/{alarmId}/device/{deviceId}
     and their mutations invalidate this device's alarm list, so the row's
     status updates from the server rather than being patched locally. */
  const runAlarmAction = async (
    kind: "ack" | "clear",
    alarm: AlarmRow,
  ) => {
    if (!workspaceId) {
      toast({ title: t("error"), description: t("noWorkspaceSelected"), variant: "destructive" });
      return;
    }
    const mutation = kind === "ack" ? ackAlarm : clearAlarm;
    try {
      await mutation.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        alarmId: alarm.id,
        deviceId: device.id,
      });
      toast({
        title: kind === "ack" ? t("alarmAcknowledged") : t("alarmCleared"),
        description: alarm.name,
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("error"),
        variant: "destructive",
      });
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{t("alarms")}</CardTitle>
        <div className="flex gap-2">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder={t("severity")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allSeverity")}</SelectItem>
              <SelectItem value="high">{t("high")}</SelectItem>
              <SelectItem value="medium">{t("medium")}</SelectItem>
              <SelectItem value="low">{t("low")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder={t("status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatus")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="acknowledged">{t("acknowledged")}</SelectItem>
              <SelectItem value="cleared">{t("cleared")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("time")}</TableHead><TableHead>{t("severity")}</TableHead>
              <TableHead>{t("rule")}</TableHead><TableHead>{t("status")}</TableHead>
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground">{formatRelativeTime(a.time, t, formatNumber)}</TableCell>
                <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Acknowledging a cleared alarm, or clearing a cleared one,
                          is not something the backend has anything to do. */}
                      <DropdownMenuItem
                        disabled={a.status !== "Active" || ackAlarm.isPending}
                        onClick={() => runAlarmAction("ack", a)}
                      >{t("acknowledge")}</DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={a.status === "Cleared" || clearAlarm.isPending}
                        onClick={() => runAlarmAction("clear", a)}
                      >{t("clearAlarm")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {isLoading && <TableRowsSkeleton rows={4} columns={5} />}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noAlarms")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ===== Dialogs / Sheets =====


/* Credentials are no longer edited from the device sheet, so the helpers that
   turned the form's state into a credentials PUT are gone with it; the
   Settings tab still shows them read only. */

export const EditDeviceDialog = ({ open, onOpenChange, device }: any) => {
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();
  const editDevice = useEditDeviceMutation();
  const [name, setName] = useState(device?.name || "");
  const [desc, setDesc] = useState(device?.description || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    device?.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || [],
  );
  const [shared, setShared] = useState<string[]>(device?.sharedUsers || []);

  useEffect(() => {
    setName(device?.name || "");
    setDesc(device?.description || "");
    setTags(device?.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || []);
    setShared(device?.sharedUsers || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, open]);

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  if (!device) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className={isRTL ? "text-right sm:text-right" : "text-left sm:text-left"}>
          <SheetTitle>{t("editDeviceTitle")}</SheetTitle>
          <SheetDescription>{t("updateDeviceInfo")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          <div>
            <Label>{t("name")}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{t("descriptionLabel")}</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} className="mt-1" rows={3} />
          </div>
          <div>
            <Label>{t("tagsLabel")}</Label>
            <div className="mt-1 flex flex-wrap gap-1 border border-input rounded-md p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring focus-within:border-transparent">
              {tags.map(tg => (
                <span key={tg} className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-0.5 text-xs">
                  {tg}
                  <button onClick={() => setTags(tags.filter(x => x !== tg))}><XIcon className="h-3 w-3" /></button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                className="flex-1 min-w-[80px] outline-none bg-transparent text-sm"
                placeholder={t("addTagPlaceholder")}
              />
            </div>
          </div>
          {/* Credentials are not editable here: replacing them cuts off
              whatever is connected with the old ones. They are shown, read
              only, on the Settings tab. */}
          <div>
            <Label className="mb-2 block">{t("shareWithUsers")}</Label>
            <ShareWithUsers value={shared} onChange={setShared} />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          {/* PUT /devices/{ws}/{pk} takes name, label and description. Tags
              and sharing still have no endpoint, so they are not saved. */}
          <Button
            disabled={editDevice.isPending || !name.trim()}
            onClick={async () => {
              if (!workspaceId) {
                toast({ title: t("error"), description: t("noWorkspaceSelected"), variant: "destructive" });
                return;
              }
              try {
                await editDevice.mutateAsync({
                  workspaceId,
                  productKey: PRODUCT_KEY,
                  id: device.id,
                  name: name.trim(),
                  label: name.trim(),
                  description: desc || undefined,
                });
                toast({ title: t("editDeviceTitle") });
                onOpenChange(false);
              } catch (error) {
                toast({
                  title: t("error"),
                  description: error instanceof Error ? error.message : t("error"),
                  variant: "destructive",
                });
              }
            }}
          >{t("save")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


/* Commands are catalog-backed: a device accepts whatever its device type
   declares in the product command catalog, and each entry carries a JSON
   Schema for its parameters. Turn that schema's properties into a skeleton
   body so the operator edits values instead of guessing field names. */
const paramSkeleton = (schema?: Record<string, unknown>): string => {
  const props = (schema?.properties ?? {}) as Record<string, any>;
  const keys = Object.keys(props);
  if (keys.length === 0) return "";
  const body: Record<string, unknown> = {};
  for (const key of keys) {
    const prop = props[key] ?? {};
    body[key] =
      prop.default ??
      prop.example ??
      (prop.type === "number" || prop.type === "integer"
        ? 0
        : prop.type === "boolean"
          ? false
          : "");
  }
  return JSON.stringify(body, null, 2);
};

const schemaProperties = (schema?: Record<string, unknown>) =>
  Object.keys((schema?.properties ?? {}) as Record<string, unknown>);

/** Activity types the gateway records for a command's lifecycle. */
const COMMAND_ACTIVITY_TYPES = new Set(["COMMAND_SENT", "COMMAND_SUCCEEDED", "COMMAND_FAILED"]);

const DEFAULT_COMMAND_FORM = {
  commandKey: "",
  label: "",
  description: "",
  dispatchMethod: "",
  parameterSchema: '{\n  "type": "object",\n  "properties": {}\n}',
  enabled: true,
  oneWay: true,
  queueIfOffline: false,
  timeoutMs: 10000,
  retries: 3,
};
type CommandForm = typeof DEFAULT_COMMAND_FORM;

const clampInt = (v: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

/* Add / edit / delete a device type's command catalog —
   /products/{productKey}/device-types/{deviceType}/commands. */
const CommandCatalogManager = ({ deviceType, commands }: { deviceType: string; commands: PaapeliProductDeviceCommand[] }) => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const createCommand = useCreateProductDeviceCommandMutation();
  const editCommand = useEditProductDeviceCommandMutation();
  const deleteCommand = useDeleteProductDeviceCommandMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<CommandForm>(DEFAULT_COMMAND_FORM);
  const [confirmDelete, setConfirmDelete] = useState<PaapeliProductDeviceCommand | null>(null);
  const set = <K extends keyof CommandForm>(k: K, v: CommandForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const fail = (error: unknown) =>
    toast({ title: t("error"), description: error instanceof Error ? error.message : t("error"), variant: "destructive" });

  const openCreate = () => {
    setEditingKey(null);
    setForm(DEFAULT_COMMAND_FORM);
    setFormOpen(true);
  };

  // The dispatch settings are write-only — the API never returns them — so an
  // edit starts them from the defaults and leaves the dispatch method blank
  // rather than guessing it.
  const openEdit = (c: PaapeliProductDeviceCommand) => {
    setEditingKey(c.commandKey);
    setForm({
      ...DEFAULT_COMMAND_FORM,
      commandKey: c.commandKey,
      label: c.label,
      description: c.description ?? "",
      parameterSchema: JSON.stringify(c.parameterSchema ?? { type: "object", properties: {} }, null, 2),
      enabled: c.enabled,
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.commandKey.trim() || !form.label.trim() || !form.dispatchMethod.trim()) {
      toast({ title: t("error"), description: t("commandRequiredFields"), variant: "destructive" });
      return;
    }
    let parameterSchema: Record<string, unknown>;
    try {
      parameterSchema = JSON.parse(form.parameterSchema.trim() || "{}");
      if (!parameterSchema || typeof parameterSchema !== "object" || Array.isArray(parameterSchema)) throw new Error();
    } catch {
      toast({ title: t("error"), description: t("invalidSchemaJson"), variant: "destructive" });
      return;
    }
    const body = {
      label: form.label.trim(),
      description: form.description.trim() || undefined,
      dispatchMethod: form.dispatchMethod.trim(),
      parameterSchema,
      oneWay: form.oneWay,
      queueIfOffline: form.queueIfOffline,
      timeoutMs: form.timeoutMs,
      retries: form.retries,
      enabled: form.enabled,
    };
    try {
      if (editingKey) {
        await editCommand.mutateAsync({ productKey: PRODUCT_KEY, deviceType, commandKey: editingKey, ...body });
      } else {
        await createCommand.mutateAsync({ productKey: PRODUCT_KEY, deviceType, commandKey: form.commandKey.trim(), ...body });
      }
      toast({ title: t("commandSaved"), description: body.label });
      setFormOpen(false);
    } catch (error) {
      fail(error);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const c = confirmDelete;
    try {
      await deleteCommand.mutateAsync({ productKey: PRODUCT_KEY, deviceType, commandKey: c.commandKey });
      toast({ title: t("commandDeleted"), description: c.label });
    } catch (error) {
      fail(error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const saving = createCommand.isPending || editCommand.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>{t("manageCommands")}</Label>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 me-1" /> {t("addCommand")}
        </Button>
      </div>
      <div className="border rounded-md divide-y divide-border">
        {commands.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("noCommandsAvailable")}</p>
        ) : commands.map((c) => (
          <div key={c.commandKey} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{c.label}</div>
              <div className="text-xs text-muted-foreground font-mono truncate" dir="ltr">{c.commandKey}</div>
            </div>
            {!c.enabled && <Badge variant="outline" className="text-xs font-normal">{t("disabled")}</Badge>}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} aria-label={t("editCommand")}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(c)} aria-label={t("delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingKey ? t("editCommand") : t("addCommand")}</DialogTitle>
            {editingKey && <DialogDescription>{t("dispatchWriteOnly")}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("commandKey")}</Label>
              <Input value={form.commandKey} onChange={(e) => set("commandKey", e.target.value)} disabled={!!editingKey} className="mt-1 font-mono" dir="ltr" placeholder="setLocationInterval" />
            </div>
            <div>
              <Label>{t("commandLabel")}</Label>
              <Input value={form.label} onChange={(e) => set("label", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t("description")}</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="mt-1" />
            </div>
            <div>
              <Label>{t("dispatchMethod")}</Label>
              <Input value={form.dispatchMethod} onChange={(e) => set("dispatchMethod", e.target.value)} className="mt-1 font-mono" dir="ltr" placeholder="setLocationInterval" />
            </div>
            <div>
              <Label>{t("parameterSchema")}</Label>
              <Textarea value={form.parameterSchema} onChange={(e) => set("parameterSchema", e.target.value)} rows={6} className="mt-1 font-mono text-xs" dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("commandTimeoutMs")}</Label>
                <Input type="number" min={1} max={300000} value={form.timeoutMs} onChange={(e) => set("timeoutMs", clampInt(e.target.value, 1, 300000))} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label>{t("commandRetries")}</Label>
                <Input type="number" min={0} max={10} value={form.retries} onChange={(e) => set("retries", clampInt(e.target.value, 0, 10))} className="mt-1" dir="ltr" />
              </div>
            </div>
            {([
              ["enabled", t("enabled")],
              ["oneWay", t("oneWay")],
              ["queueIfOffline", t("queueIfOffline")],
            ] as const).map(([key, text]) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{text}</Label>
                <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} disabled={saving}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCommandQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCommandDesc")} <span className="font-medium text-foreground">{confirmDelete?.label}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doDelete} disabled={deleteCommand.isPending}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const SendCommandDialog = ({ open, onOpenChange, device }: any) => {
  const { isRTL, t, formatNumber } = useLanguage();
  const [cmd, setCmd] = useState("");
  const [params, setParams] = useState("");
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();
  const sendCommand = useSendDeviceCommandMutation();

  /* The picker is the device type's command catalog, not a fixed list: the
     gateway rejects any key the catalog does not define. */
  const { data: catalog, isLoading: catalogLoading, isError: catalogError } = useGetProductDeviceCommandsQuery(
    PRODUCT_KEY, device?.type ?? "", open,
  );
  const commands = (catalog ?? []).filter((c) => c.enabled);
  const selected = commands.find((c) => c.commandKey === cmd);
  const takesParams = schemaProperties(selected?.parameterSchema).length > 0;

  // Re-select whenever the sheet opens on a device or the catalog lands, so
  // the selection always names a command this device actually has.
  useEffect(() => {
    if (!open) return;
    setCmd(commands[0]?.commandKey ?? "");
  }, [open, device?.id, catalog]);

  useEffect(() => {
    setParams(paramSkeleton(selected?.parameterSchema));
  }, [cmd, catalog]);

  /* The catalog above lists what can be sent, not what was: nothing returns a
     device's sent commands. The gateway records each one in the device's
     activity feed, so the history is that feed filtered to the COMMAND_*
     types. */
  const { data: activityPage, isLoading: historyLoading } = useGetDeviceActivitiesQuery(
    workspaceId ?? "", PRODUCT_KEY, device?.id ?? "", 0, ACTIVITY_PAGE_SIZE, open,
  );
  const commandHistory = (activityPage?.data ?? []).filter((a) => COMMAND_ACTIVITY_TYPES.has(a.type));

  const handleSend = async () => {
    if (!workspaceId) {
      toast({ title: t("error"), description: t("noWorkspaceSelected"), variant: "destructive" });
      return;
    }
    if (!selected) {
      toast({ title: t("error"), description: t("noCommandsAvailable"), variant: "destructive" });
      return;
    }

    // The textarea holds the command's parameters — the object the catalog's
    // parameterSchema describes, not the whole request body.
    let parsedParams: Record<string, unknown> = {};
    const raw = params.trim();
    if (raw) {
      try {
        parsedParams = JSON.parse(raw);
      } catch {
        toast({ title: t("error"), description: t("invalidJsonPayload"), variant: "destructive" });
        return;
      }
    }

    try {
      const result = await sendCommand.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        deviceId: device.id,
        command: selected.commandKey,
        params: parsedParams,
      });
      // A 200 only means dispatch was accepted; `success` is the dispatch
      // result itself, and still says nothing about the device executing it.
      if (!result.success) {
        toast({ title: t("error"), description: t("commandFailed"), variant: "destructive" });
        return;
      }
      toast({ title: t("commandQueued"), description: selected.label });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("commandFailed"),
        variant: "destructive",
      });
    }
  };

  if (!device) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className={isRTL ? "text-right sm:text-right pl-8" : "text-left sm:text-left pr-8"}>

          <SheetTitle>{t("sendCommand")}</SheetTitle>
          <SheetDescription>{t("sendCommandTo")} {device.name}.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1 overflow-auto">
          <div>
            <Label>{t("commandType")}</Label>
            <Select value={cmd} onValueChange={setCmd} disabled={catalogLoading || commands.length === 0}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={catalogLoading ? t("loading") : catalogError ? t("commandsLoadFailed") : t("noCommandsAvailable")} />
              </SelectTrigger>
              <SelectContent>
                {commands.map((c) => (
                  <SelectItem key={c.commandKey} value={c.commandKey}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected?.description && (
              <p className="mt-1 text-xs text-muted-foreground">{selected.description}</p>
            )}
          </div>
          {takesParams && (
            <div>
              <Label>{t("payloadJson")}</Label>
              <Textarea value={params} onChange={e => setParams(e.target.value)} rows={4} className="mt-1 font-mono text-xs" dir="ltr" />
            </div>
          )}
          {device.type && !catalogLoading && !catalogError && (
            <CommandCatalogManager deviceType={device.type} commands={catalog ?? []} />
          )}
          <div>
            <Label className="mb-2 block">{t("commandHistory")}</Label>
            <div className="border rounded-md max-h-44 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>{t("time")}</TableHead><TableHead>{t("command")}</TableHead><TableHead>{t("status")}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRowsSkeleton rows={3} columns={3} />
                  ) : commandHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground">{t("noCommandsYet")}</TableCell></TableRow>
                  ) : commandHistory.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground text-xs">{formatRelativeTime(c.occurredAt, t, formatNumber)}</TableCell>
                      <TableCell className="text-xs">{activityLabel(c)}</TableCell>
                      <TableCell>
                        <Badge className={c.type === "COMMAND_FAILED"
                          ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
                          : c.type === "COMMAND_SUCCEEDED"
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                            : "bg-muted text-muted-foreground hover:bg-muted"}>
                          {c.type === "COMMAND_FAILED" ? t("commandFailed") : c.type === "COMMAND_SUCCEEDED" ? t("delivered") : t("commandSent")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleSend} disabled={sendCommand.isPending || !selected}>
            {t("sendCommand")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


const FirmwareDialog = ({ open, onOpenChange }: any) => {
  const [progress, setProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const start = () => {
    setProgress(0);
    const id = setInterval(() => {
      setProgress(p => {
        if (p === null) return 0;
        if (p >= 100) { clearInterval(id); toast({ title: "Firmware updated" }); return 100; }
        return p + 10;
      });
    }, 300);
  };
  useEffect(() => { if (!open) setProgress(null); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Firmware Update</DialogTitle>
          <DialogDescription>Manage firmware versions and OTA delivery.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Current Version</div><div className="text-lg font-semibold">v2.4.1</div></CardContent></Card>
            <Card className="border-primary/40"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Available</div><div className="text-lg font-semibold text-primary">v2.5.0</div></CardContent></Card>
          </div>
          <div>
            <Label>Upload Firmware (.bin)</Label>
            <Input type="file" className="mt-1" />
          </div>
          {progress !== null && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1"><span>Update progress</span><span>{progress}%</span></div>
              <Progress value={progress} />
            </div>
          )}
          <div>
            <Label className="mb-2 block">Update History</Label>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>May 2, 2026</TableCell><TableCell>v2.4.1</TableCell><TableCell><Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">Success</Badge></TableCell></TableRow>
                <TableRow><TableCell>Jan 14, 2026</TableCell><TableCell>v2.3.7</TableCell><TableCell><Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">Success</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={start} disabled={progress !== null && progress < 100}>Start Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoveLocationDialog = ({ open, onOpenChange, device }: any) => {
  const { t } = useLanguage();
  const [loc, setLoc] = useState(device.location || "");
  const { toast } = useToast();
  const presets = getLocationOptions().map((l) => l.path);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Location</DialogTitle>
          <DialogDescription>Choose a new location path.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Location Path</Label>
          <Input value={loc} onChange={e => setLoc(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <Button key={p} variant="outline" size="sm" onClick={() => setLoc(p)} className="text-xs">{p}</Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {/* A device's location is its assetId, and no endpoint reassigns one
              after creation — PUT /devices carries name/label/description only.
              Until one exists this cannot be saved, so it says so. */}
          <Button
            onClick={() => {
              toast({ title: t("comingSoon") || "Coming soon" });
              onOpenChange(false);
            }}
          >Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RawDataDialog = ({ open, onOpenChange, channels, seed }: any) => {
  const [query, setQuery] = useState("");
  const { isRTL } = useLanguage();
  const rows: { time: string; key: string; value: string }[] = [];
  const now = Date.now();
  channels.forEach((c: Channel, ci: number) => {
    const data = generateSeries(c, 20, seed + ci);
    data.forEach((d, i) => {
      rows.push({
        time: formatDateTime(now - (data.length - i) * 60_000),
        key: c.key,
        value: `${d.v} ${c.unit}`,
      });
    });
  });
  const filtered = rows.filter(r => !query || r.key.includes(query.toLowerCase()) || r.value.includes(query));
  const exportCsv = () => {
    const csv = "time,key,value\n" + filtered.map(r => `${r.time},${r.key},${r.value}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "raw-data.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Raw Telemetry Data</DialogTitle>
          <DialogDescription>Browse and export raw key-value telemetry.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-1" dir={isRTL ? "rtl" : "ltr"}>
            <Search className={`h-4 w-4 absolute ${isRTL ? "right-2.5" : "start-2.5"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input placeholder="Search by key or value..." className={`${isRTL ? "pr-8 text-right placeholder:text-right" : "ps-8 text-left placeholder:text-left"}`} value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 me-2" /> Export CSV</Button>
        </div>
        <div className="border rounded-md max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Time</TableHead><TableHead>Key</TableHead><TableHead>Value</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground text-xs">{r.time}</TableCell>
                  <TableCell className="font-mono text-xs">{r.key}</TableCell>
                  <TableCell className="font-mono text-xs">{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetails;
