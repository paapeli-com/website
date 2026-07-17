import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevices, UserDevice } from "@/hooks/useDevices";
import { useGateways } from "@/hooks/useGateways";
import { useToast } from "@/hooks/use-toast";
import { LocationCell } from "@/components/panel/LocationCell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import {
  ArrowLeft, Edit, Play, MoreHorizontal, Eye, RefreshCw, Upload, MapPin,
  Trash2, Wifi, WifiOff, Clock, Network, Bell, Activity, Thermometer, Gauge,
  Droplet, Zap, Waves, Wind, ChevronDown, ChevronRight, ChevronLeft, Copy, CheckCheck,
  Search, Download, Plus, AlertTriangle, ShieldCheck, Sparkles, Cpu,
  Brain, X as XIcon, Calendar, Settings as SettingsIcon, FileText,
  Lock, KeyRound, ChevronsUpDown, ChevronsLeft, ChevronsRight, LayoutGrid, ArrowUp, ArrowDown,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboards } from "@/hooks/useDashboards";
import { SmartPagination } from "@/components/SmartPagination";
import {
  PROFILE_CHANNELS, guessProfile, profileLabel, generateSeries, lastValue,
  type Channel, type DeviceProfileKey,
} from "@/lib/deviceProfiles";
import { SecurityConfig, type SecurityValue } from "@/components/panel/SecurityConfig";
import { ShareWithUsers } from "@/components/panel/ShareWithUsers";
import { getLocationOptions } from "@/lib/locations";

const hasPersian = (v: string) => /[\u0600-\u06FF]/.test(v || "");
const fa = (v: string) => (hasPersian(v) ? "font-vazirmatn" : "");

import { formatRelativeTime } from "@/lib/relativeTime";

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

// Status of device (deterministic from id)
const deviceStatus = (d: UserDevice): "online" | "offline" | "error" => {
  const h = (d.id.charCodeAt(d.id.length - 1) || 0) % 10;
  if (h < 7) return "online";
  if (h < 9) return "offline";
  return "error";
};

const StatCard = ({
  icon: Icon, label, value, tone = "primary", trailing, onClick,
}: any) => {
  const { isRTL } = useLanguage();
  return (
  <Card
    className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
    onClick={onClick}
  >
    <CardContent className={`p-4 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
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

const MOCK_ALARMS = [
  { id: "al-1", time: new Date(Date.now() - 2 * 3600_000).toISOString(), severity: "High", ruleKey: "ruleHighTemp", status: "Active" },
  { id: "al-2", time: new Date(Date.now() - 5 * 3600_000).toISOString(), severity: "Medium", ruleKey: "ruleTempFluctuation", status: "Acknowledged" },
  { id: "al-3", time: new Date(Date.now() - 86400_000).toISOString(), severity: "Low", ruleKey: "ruleCalibrationDrift", status: "Cleared" },
];

const MOCK_EVENTS = [
  { time: new Date(Date.now() - 2 * 60_000).toISOString(), activityKey: "evtTelemetryUpdated", by: "system" },
  { time: new Date(Date.now() - 15 * 60_000).toISOString(), activityKey: "evtDeviceConnected", by: "system" },
  { time: new Date(Date.now() - 3600_000).toISOString(), activityKey: "evtCommandSent", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 3 * 3600_000).toISOString(), activityKey: "evtAlarmTriggered", by: "rule engine" },
  { time: new Date(Date.now() - 5 * 3600_000).toISOString(), activityKey: "evtTelemetryUpdated", by: "system" },
  { time: new Date(Date.now() - 86400_000).toISOString(), activityKey: "evtFirmwareUpdated", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 2 * 86400_000).toISOString(), activityKey: "evtDeviceRegistered", by: "ali@paapeli.io" },
];

const MOCK_COMMANDS = [
  { time: new Date(Date.now() - 3600_000).toISOString(), command: "Set Threshold = 85°C", status: "Delivered", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 86400_000).toISOString(), command: "Restart", status: "Delivered", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 3 * 86400_000).toISOString(), command: "Reset Counters", status: "Failed", by: "ops@paapeli.io" },
];

const DeviceDetails = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { language, isRTL, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { items: devices, remove: removeDevice } = useDevices();
  const { items: gateways } = useGateways();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const device = useMemo(() => {
    const found = devices.find((d) => d.id === deviceId || d.deviceId === deviceId);
    if (found) return found;
    if (!deviceId) return null;
    // Fallback synthesized device for mock/demo IDs so the details page always renders
    return {
      id: deviceId,
      deviceId: deviceId,
      apiKey: "demo-" + deviceId.toLowerCase(),
      name: deviceId,
      protocol: "MQTT",
      location: "",
      useSsl: true,
      useOta: false,
      useMonitoring: true,
      tags: "",
      description: "",
      externalId: "",
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    } as typeof devices[number];
  }, [devices, deviceId]);

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
    return (
      <PanelLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">{t("deviceNotFound")}</p>
          <Button onClick={() => navigate(lp("/devices"))}>
            <ArrowLeft className="h-4 w-4 me-2" /> {t("backToDevices")}
          </Button>
        </div>
      </PanelLayout>
    );
  }

  const profile: DeviceProfileKey = guessProfile(device.name, device.tags || "");
  const channels: Channel[] = PROFILE_CHANNELS[profile];
  const status = deviceStatus(device);
  const statusLabel = status === "online" ? t("online") : status === "offline" ? t("offline") : t("error");
  const statusDot = status === "online" ? "bg-emerald-500" : status === "offline" ? "bg-muted-foreground/50" : "bg-rose-500";
  const seed = (device.id?.charCodeAt(0) || 1) * 7;

  // Read-only view of the credentials/security method chosen at creation.
  const securityView: SecurityValue = {
    method: device.authMethod || (device.useSsl ? "ssl" : "accessToken"),
    accessToken: device.apiKey,
    clientId: device.authClientId || "",
    username: device.authUsername || device.deviceId,
    password: "",
    sslCert: device.sslCert || "",
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

  const onDelete = () => {
    removeDevice(device.id);
    toast({ title: "Device deleted", description: device.name });
    navigate(lp("/devices"));
  };

  return (
    <PanelLayout>
      <TooltipProvider>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={lp("/devices")}>{t("assets")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={lp("/devices")}>{t("devices")}</BreadcrumbLink>
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
                  <LocationCell path={device.location || "Qazvin > Factory A > Sulfonation > Line 1"} />
                </span>
                {(device.tags?.split(",").map((s: string) => s.trim()).filter(Boolean) || []).map((tg: string) => (
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
          <StatCard icon={Network} label={t("gateway")} value={device.gateway || "—"} tone="violet" />
          <StatCard
            icon={Bell}
            label={t("activeAlarms")}
            value={MOCK_ALARMS.filter(a => a.status === "Active").length}
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
              { v: "alarms", label: t("alarms"), icon: Bell, badge: MOCK_ALARMS.filter(a => a.status === "Active").length },
              
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
                  <InfoRow label={t("location")} value={<LocationCell path={device.location || "Qazvin > Factory A > Sulfonation > Line 1"} />} />
                  <InfoRow label={t("created")} value={new Date(device.createdAt).toLocaleDateString()} />
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground w-24 shrink-0">{t("tags")}</span>
                    <div className="flex flex-wrap gap-1">
                      {(device.tags?.split(",").map(t => t.trim()).filter(Boolean) || []).length === 0
                        ? <span className="text-muted-foreground">—</span>
                        : device.tags!.split(",").map((tg) => (
                          <Badge key={tg} variant="secondary" className={fa(tg)}>{tg.trim()}</Badge>
                        ))}
                    </div>
                  </div>
                  <InfoRow label={t("description")} value={device.description || "—"} className={fa(device.description || "")} />
                </CardContent>
              </Card>


              {/* Latest Values */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{t("latestValues")}</CardTitle>
                  <Select defaultValue="realtime">
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">{t("realTime")}</SelectItem>
                      <SelectItem value="1h">{t("last1h")}</SelectItem>
                      <SelectItem value="24h">{t("last24h")}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="space-y-4">
                  {status === "offline" ? <OfflineNotice /> : channels.map((ch, i) => {
                    const Icon = channelIcon(ch.key);
                    const data = generateSeries(ch, 20, seed + i);
                    const val = data[data.length - 1].v;
                    return (
                      <div key={ch.key} className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground w-24 shrink-0">{chLabel(ch, t)}</span>
                        <span className={`text-base font-semibold ${ch.color} w-20 ${isRTL ? "text-start" : "text-end"} shrink-0`}>
                          {val} <span className="text-xs">{ch.unit}</span>
                        </span>
                        <div className="flex-1 h-8 min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <Line dataKey="v" stroke={ch.stroke} strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
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
                      {MOCK_EVENTS.slice(0, 5).map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{formatRelativeTime(e.time, t, formatNumber)}</TableCell>
                          <TableCell>{t(e.activityKey as any)}</TableCell>
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
                      {MOCK_ALARMS.map((a) => (
                        <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(a.time, t, formatNumber)}</TableCell>
                          <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                          <TableCell>{t(a.ruleKey as any)}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

            </div>

            <div className="text-xs text-muted-foreground px-1">
              {t("created")}: {new Date(device.createdAt).toLocaleString()} &nbsp;·&nbsp;
              {t("lastUpdate")}: {formatRelativeTime(device.lastActivity || device.createdAt, t, formatNumber)}
            </div>
          </TabsContent>


          {/* TELEMETRY */}
          <TabsContent value="telemetry" className="space-y-4 mt-4">
            <TelemetryTab channels={channels} seed={seed} />
          </TabsContent>

          {/* ALARMS */}
          <TabsContent value="alarms" className="space-y-4 mt-4">
            <DeviceAlarms />
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
                    {MOCK_EVENTS.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(e.time, t, formatNumber)}</TableCell>
                        <TableCell>{t(e.activityKey as any)}</TableCell>
                        <TableCell className="text-muted-foreground">{e.by}</TableCell>
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
                <InfoRow label={t("description")} value={device.description || "—"} />
                <InfoRow label={t("tags")} value={
                  <div className="flex flex-wrap gap-1">
                    {(device.tags?.split(",").filter(Boolean) || ["—"]).map((tg, i) =>
                      tg === "—" ? <span key={i} className="text-muted-foreground">—</span> :
                      <Badge key={i} variant="secondary" className={fa(tg)}>{tg.trim()}</Badge>
                    )}
                  </div>
                } />
                <InfoRow label={t("location")} value={<LocationCell path={device.location || "Qazvin > Factory A > Sulfonation > Line 1"} />} />
                <InfoRow label={t("gateway")} value={device.gateway || "—"} />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}><MapPin className="h-4 w-4 me-2" /> {t("moveLocation")}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> {t("credentialsSecurity")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 me-2" /> {t("edit")}</Button>
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
                      <CredentialRow label={t("mqttHost")} value="mqtt.paapeli.io" />
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
    </PanelLayout>
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

const CredentialRow = ({ label, value, mask, onCopy, copied }: { label: string; value: string; mask?: boolean; onCopy?: () => void; copied?: boolean }) => {
  const [show, setShow] = useState(false);
  const display = mask && !show ? "•".repeat(Math.min(value.length, 20)) : value;
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input value={display} readOnly className="font-mono text-xs" dir="ltr" />
        {mask && <Button variant="outline" size="icon" onClick={() => setShow(!show)}><KeyRound className="h-4 w-4" /></Button>}
        {onCopy && <Button variant="outline" size="icon" onClick={onCopy}>{copied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</Button>}
      </div>
    </div>
  );
};

/* Latest-telemetry tab (ThingsBoard-style): key/value table with select,
   pagination, delete strategy, and "show on widget → add to dashboard".
   Data is mock; later it reads latest telemetry from the gateway. */
const TELEMETRY_EXTRA: { key: string; value: string }[] = [
  { key: "active", value: "true" },
  { key: "battery_level", value: "60" },
  { key: "error_count", value: "0" },
  { key: "firmware_version", value: "2.4.1" },
  { key: "latency_ms", value: "34" },
  { key: "packets_sent", value: "18342" },
  { key: "rssi_dbm", value: "-72" },
  { key: "signal_quality", value: "good" },
  { key: "uptime_s", value: "84213" },
];

const fmtDateTime = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const TELE_WIDGETS = ["Tables", "Charts", "Cards", "Analogue gauges", "Alarm widgets"] as const;

const TELE_L = {
  en: { actions: "Actions", addToWidget: "Add to Widget", title: "Latest Data", lastUpdate: "Last update time", key: "Key", value: "Value", selected: "telemetry units selected", showOnWidget: "Show on widget", del: "Delete", deleteStrategy: "Delete strategy", strategy: "Strategy", delAll: "Delete all data", delExcept: "Delete all data except latest value", delLatest: "Delete latest value", delPeriod: "Delete all data for time period", cancel: "Cancel", itemsPerPage: "Items per page:", of: "of", timeSeriesTable: "Time series table", realtime: "Realtime - last 1 hour", timestamp: "Timestamp", addToDashboard: "Add to dashboard", addWidget: "Add widget to dashboard", selectExisting: "Select existing dashboard", createNew: "Create new dashboard", dashboard: "Dashboard", newTitle: "New dashboard title", openDashboard: "Open dashboard", add: "Add", deleted: "Telemetry deleted", added: "Widget added to dashboard", empty: "No telemetry", search: "Search keys", export: "Export", widget: "Widget", noDashboards: "No dashboards available", deleteOneTitle: "Delete telemetry?", deleteOneDesc: "This telemetry key will be permanently removed:", exported: "Data exported" },
  fa: { actions: "عملیات", addToWidget: "افزودن به ویجت", title: "آخرین داده", lastUpdate: "زمان آخرین به‌روزرسانی", key: "کلید", value: "مقدار", selected: "تله‌متری انتخاب شد", showOnWidget: "نمایش در ویجت", del: "حذف", deleteStrategy: "راهبرد حذف", strategy: "راهبرد", delAll: "حذف همه‌ی داده‌ها", delExcept: "حذف همه‌ی داده‌ها به‌جز آخرین مقدار", delLatest: "حذف آخرین مقدار", delPeriod: "حذف داده‌ها برای یک بازه‌ی زمانی", cancel: "انصراف", itemsPerPage: "تعداد در هر صفحه:", of: "از", timeSeriesTable: "جدول سری‌زمانی", realtime: "زنده - یک ساعت اخیر", timestamp: "زمان", addToDashboard: "افزودن به داشبورد", addWidget: "افزودن ویجت به داشبورد", selectExisting: "انتخاب داشبورد موجود", createNew: "ایجاد داشبورد جدید", dashboard: "داشبورد", newTitle: "عنوان داشبورد جدید", openDashboard: "باز کردن داشبورد", add: "افزودن", deleted: "تله‌متری حذف شد", added: "ویجت به داشبورد اضافه شد", empty: "تله‌متری وجود ندارد", search: "جستجوی کلید", export: "خروجی", widget: "ویجت", noDashboards: "داشبوردی وجود ندارد", deleteOneTitle: "این داده حذف شود؟", deleteOneDesc: "این کلید تله‌متری برای همیشه حذف می‌شود:", exported: "خروجی داده‌ها گرفته شد" },
  ar: { actions: "إجراءات", addToWidget: "إضافة إلى وِدجت", title: "أحدث البيانات", lastUpdate: "وقت آخر تحديث", key: "المفتاح", value: "القيمة", selected: "وحدة قياس محددة", showOnWidget: "عرض في وِدجت", del: "حذف", deleteStrategy: "استراتيجية الحذف", strategy: "الاستراتيجية", delAll: "حذف كل البيانات", delExcept: "حذف كل البيانات عدا آخر قيمة", delLatest: "حذف آخر قيمة", delPeriod: "حذف البيانات لفترة زمنية", cancel: "إلغاء", itemsPerPage: "عناصر لكل صفحة:", of: "من", timeSeriesTable: "جدول السلاسل الزمنية", realtime: "مباشر - آخر ساعة", timestamp: "الطابع الزمني", addToDashboard: "إضافة إلى اللوحة", addWidget: "إضافة وِدجت إلى اللوحة", selectExisting: "اختر لوحة موجودة", createNew: "إنشاء لوحة جديدة", dashboard: "اللوحة", newTitle: "عنوان اللوحة الجديدة", openDashboard: "فتح اللوحة", add: "إضافة", deleted: "تم حذف القياس", added: "تمت إضافة الوِدجت", empty: "لا توجد قياسات", search: "بحث المفاتيح", export: "تصدير", widget: "وِدجت", noDashboards: "لا توجد لوحات", deleteOneTitle: "حذف هذا القياس؟", deleteOneDesc: "سيتم حذف مفتاح القياس هذا نهائيًا:", exported: "تم تصدير البيانات" },
} as const;

const WIDGET_COLORS = ["hsl(28 100% 50%)", "hsl(197 100% 40%)", "hsl(160 84% 39%)", "hsl(280 70% 55%)", "hsl(340 80% 55%)"];
const PREVIEW_ALARMS = [
  { sev: "bg-rose-500", msg: "High temperature", time: "2m ago" },
  { sev: "bg-amber-500", msg: "Vibration warning", time: "18m ago" },
  { sev: "bg-rose-500", msg: "Pressure critical", time: "1h ago" },
  { sev: "bg-sky-500", msg: "Device reconnected", time: "3h ago" },
];
const numVal = (rows: { key: string; value: string }[], k: string) => {
  const n = parseFloat(rows.find((x) => x.key === k)?.value ?? "");
  return Number.isNaN(n) ? null : n;
};

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
function TeleWidgetPreview({ type, keys, rows, timestampLabel }: { type: string; keys: string[]; rows: { key: string; value: string }[]; timestampLabel: string }) {
  const numericKeys = keys.filter((k) => numVal(rows, k) !== null);
  const series = useMemo(
    () => Array.from({ length: 24 }, (_, i) => {
      const row: Record<string, number> = { t: i };
      numericKeys.forEach((k, idx) => {
        const base = numVal(rows, k) ?? 50;
        row[k] = Math.max(0, base + Math.sin((i + idx) / 3) * base * 0.14 + (Math.random() - 0.5) * base * 0.08);
      });
      return row;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, keys.join(",")],
  );

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
            <RTooltip />
            {numericKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={WIDGET_COLORS[i % WIDGET_COLORS.length]} strokeWidth={2} fill={`url(#tg-${i})`} isAnimationActive animationDuration={900} />
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
            <p className="mt-1 text-2xl font-bold text-primary">{rows.find((x) => x.key === k)?.value ?? "—"}</p>
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
          return <TeleGauge key={k} label={k} pct={pct} value={rows.find((x) => x.key === k)?.value ?? "—"} />;
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
          {Array.from({ length: 6 }, (_, i) => {
            const time = Date.now() - i * 5 * 60_000;
            return (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(time)}</TableCell>
                {keys.map((k) => <TableCell key={k}>{rows.find((x) => x.key === k)?.value ?? "—"}</TableCell>)}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const TelemetryTab = ({ channels, seed }: { channels: Channel[]; seed: number }) => {
  const { language, isRTL, t } = useLanguage();
  const L = TELE_L[(language as "en" | "fa" | "ar")] ?? TELE_L.en;
  const { toast } = useToast();
  const { items: dashboards } = useDashboards();

  const initialRows = useMemo(() => {
    const base = channels.map((c, i) => {
      const v = generateSeries(c, 2, seed + c.key.length)[1].v;
      return { key: c.key, value: `${v.toFixed(c.decimals ?? 1)}${c.unit ? " " + c.unit : ""}`, updatedAt: Date.now() - (i * 41 + 7) * 1000 };
    });
    const extra = TELEMETRY_EXTRA.map((r, i) => ({ ...r, updatedAt: Date.now() - (i * 53 + 130) * 1000 }));
    return [...base, ...extra];
  }, [channels, seed]);

  const [rows, setRows] = useState(initialRows);
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
      .sort((a, b) => (sortAsc ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)));
  }, [rows, sortAsc, query]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const allOnPageChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.key));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allOnPageChecked) pageRows.forEach((r) => next.delete(r.key));
    else pageRows.forEach((r) => next.add(r.key));
    return next;
  });
  const toggleOne = (k: string) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  // Bulk delete keeps the strategy dialog; single-row delete is a plain confirm.
  const confirmBulkDelete = () => {
    const keys = [...selected];
    setRows((rs) => rs.filter((r) => !keys.includes(r.key)));
    setSelected(new Set());
    setDeleteOpen(false);
    toast({ title: L.deleted });
  };
  const confirmRowDelete = () => {
    if (!confirmKey) return;
    const k = confirmKey;
    setRows((rs) => rs.filter((r) => r.key !== k));
    setSelected((prev) => { const n = new Set(prev); n.delete(k); return n; });
    setConfirmKey(null);
    toast({ title: L.deleted });
  };

  const exportCsv = () => {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const header = [L.lastUpdate, L.key, L.value].map(esc).join(",");
    const body = filtered.map((r) => [fmtDateTime(r.updatedAt), r.key, r.value].map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "latest-data.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: L.exported });
  };

  const selectedKeys = [...selected];
  const confirmAdd = () => { setAddOpen(false); toast({ title: L.added }); };

  return (
    <>
      <Card>
        {/* Toolbar (search + export), matching the Events tab */}
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">{L.title}</CardTitle>
          <div className="flex items-center gap-2">
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
                <TableHead>{L.lastUpdate}</TableHead>
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
                <TableRow key={r.key} data-state={selected.has(r.key) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selected.has(r.key)} onCheckedChange={() => toggleOne(r.key)} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(r.updatedAt)}</TableCell>
                  <TableCell className="font-medium">{r.key}</TableCell>
                  <TableCell>{r.value}</TableCell>
                  <TableCell>
                    <button onClick={() => setConfirmKey(r.key)} className="text-muted-foreground hover:text-destructive" aria-label={L.del}><Trash2 className="h-4 w-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
              {pageRows.length === 0 && (
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
              {L.deleteOneDesc} <span className="font-medium text-foreground">{confirmKey}</span>
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

const DeviceAlarms = () => {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const { t, formatNumber } = useLanguage();
  const filtered = MOCK_ALARMS.filter(a =>
    (severity === "all" || a.severity.toLowerCase() === severity) &&
    (status === "all" || a.status.toLowerCase() === status)
  );
  const { toast } = useToast();
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
                <TableCell>{t(a.ruleKey as any)}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast({ title: t("alarmViewed"), description: t(a.ruleKey as any) })}>{t("viewAlarm")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: t("alarmAcknowledged"), description: t(a.ruleKey as any) })}>{t("acknowledge")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: t("alarmCleared"), description: t(a.ruleKey as any) })}>{t("clearAlarm")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noAlarms")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ===== Dialogs / Sheets =====

export const EditDeviceDialog = ({ open, onOpenChange, device }: any) => {
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState(device?.name || "");
  const [desc, setDesc] = useState(device?.description || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    device?.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || [],
  );
  const buildSecurity = (d: any): SecurityValue => ({
    method: d?.authMethod || (d?.useSsl ? "ssl" : "accessToken"),
    accessToken: d?.apiKey || "",
    clientId: d?.authClientId || "",
    username: d?.authUsername || "",
    password: "",
    sslCert: d?.sslCert || "",
  });
  const [security, setSecurity] = useState<SecurityValue>(() => buildSecurity(device));
  const [shared, setShared] = useState<string[]>(device?.sharedUsers || []);

  useEffect(() => {
    setName(device?.name || "");
    setDesc(device?.description || "");
    setTags(device?.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || []);
    setSecurity(buildSecurity(device));
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
            <div className="mt-1 flex flex-wrap gap-1 border rounded-md p-2 min-h-[42px]">
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
          <div>
            <Label className="mb-2 block">{t("credentialsSecurity")}</Label>
            <SecurityConfig value={security} onChange={setSecurity} />
          </div>
          <div>
            <Label className="mb-2 block">{t("shareWithUsers")}</Label>
            <ShareWithUsers value={shared} onChange={setShared} />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={() => {
            try {
              const raw = localStorage.getItem("paapeli-devices-v1");
              const arr = raw ? JSON.parse(raw) : [];
              const idx = arr.findIndex((d: any) => d.id === device.id);
              if (idx >= 0) {
                arr[idx] = {
                  ...arr[idx],
                  name, description: desc, tags: tags.join(", "),
                  authMethod: security.method,
                  authUsername: security.method === "basic" ? security.username : arr[idx].authUsername,
                  authClientId: security.method === "basic" ? security.clientId : arr[idx].authClientId,
                  sslCert: security.method === "ssl" ? security.sslCert : arr[idx].sslCert,
                  apiKey: security.method === "accessToken" ? security.accessToken : arr[idx].apiKey,
                  useSsl: security.method === "ssl",
                  sharedUsers: shared,
                };
                localStorage.setItem("paapeli-devices-v1", JSON.stringify(arr));
                window.dispatchEvent(new Event("paapeli:devices-updated"));
              }
            } catch {}
            toast({ title: t("editDeviceTitle") });
            onOpenChange(false);
          }}>{t("save")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


export const SendCommandDialog = ({ open, onOpenChange, device }: any) => {
  const { isRTL, t, formatNumber } = useLanguage();
  const [cmd, setCmd] = useState("restart");
  const [threshold, setThreshold] = useState("85");
  const [custom, setCustom] = useState('{"action":"ping"}');
  const { toast } = useToast();
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
            <Select value={cmd} onValueChange={setCmd}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restart">{t("restart")}</SelectItem>
                <SelectItem value="reset">{t("reset")}</SelectItem>
                <SelectItem value="threshold">{t("changeThreshold")}</SelectItem>
                <SelectItem value="custom">{t("customCommand")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {cmd === "threshold" && (
            <div>
              <Label>{t("thresholdValue")}</Label>
              <Input value={threshold} onChange={e => setThreshold(e.target.value)} className="mt-1" />
            </div>
          )}
          {cmd === "custom" && (
            <div>
              <Label>{t("payloadJson")}</Label>
              <Textarea value={custom} onChange={e => setCustom(e.target.value)} rows={4} className="mt-1 font-mono text-xs" dir="ltr" />
            </div>
          )}
          <div>
            <Label className="mb-2 block">{t("commandHistory")}</Label>
            <div className="border rounded-md max-h-44 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>{t("time")}</TableHead><TableHead>{t("command")}</TableHead><TableHead>{t("status")}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_COMMANDS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs">{formatRelativeTime(c.time, t, formatNumber)}</TableCell>
                      <TableCell className="text-xs">{c.command}</TableCell>
                      <TableCell>
                        <Badge className={c.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"}>
                          {c.status === "Delivered" ? t("delivered") : t("commandFailed")}
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
          <Button onClick={() => { toast({ title: t("commandQueued"), description: cmd }); onOpenChange(false); }}>
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
          <Button onClick={() => {
            try {
              const raw = localStorage.getItem("paapeli-devices-v1");
              const arr = raw ? JSON.parse(raw) : [];
              const idx = arr.findIndex((d: any) => d.id === device.id);
              if (idx >= 0) {
                arr[idx].location = loc;
                localStorage.setItem("paapeli-devices-v1", JSON.stringify(arr));
                window.dispatchEvent(new Event("paapeli:devices-updated"));
              }
            } catch {}
            toast({ title: "Location updated" });
            onOpenChange(false);
          }}>Move</Button>
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
        time: new Date(now - (data.length - i) * 60_000).toLocaleString(),
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
