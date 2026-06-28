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
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import {
  ArrowLeft, Edit, Play, MoreHorizontal, Eye, RefreshCw, Upload, MapPin,
  Trash2, Wifi, WifiOff, Clock, Network, Bell, Activity, Thermometer, Gauge,
  Droplet, Zap, Waves, Wind, ChevronDown, ChevronRight, Copy, CheckCheck,
  Search, Download, Plus, AlertTriangle, ShieldCheck, Sparkles, Cpu,
  Brain, X as XIcon, Calendar, Settings as SettingsIcon, FileText,
  Lock, KeyRound, ChevronsUpDown,
} from "lucide-react";
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

// Status of device (deterministic from id)
const deviceStatus = (d: UserDevice): "online" | "offline" | "error" => {
  const h = (d.id.charCodeAt(d.id.length - 1) || 0) % 10;
  if (h < 7) return "online";
  if (h < 9) return "offline";
  return "error";
};

const StatCard = ({
  icon: Icon, label, value, tone = "primary", trailing, onClick,
}: any) => (
  <Card
    className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
    onClick={onClick}
  >
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

const MOCK_ALARMS = [
  { id: "al-1", time: new Date(Date.now() - 2 * 3600_000).toISOString(), severity: "High", rule: "High Temp Alert", status: "Active" },
  { id: "al-2", time: new Date(Date.now() - 5 * 3600_000).toISOString(), severity: "Medium", rule: "Temp Fluctuation", status: "Acknowledged" },
  { id: "al-3", time: new Date(Date.now() - 86400_000).toISOString(), severity: "Low", rule: "Calibration Drift", status: "Cleared" },
];

const MOCK_EVENTS = [
  { time: new Date(Date.now() - 2 * 60_000).toISOString(), activity: "Telemetry updated", by: "system" },
  { time: new Date(Date.now() - 15 * 60_000).toISOString(), activity: "Device connected", by: "system" },
  { time: new Date(Date.now() - 3600_000).toISOString(), activity: "Command sent: Set Threshold", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 3 * 3600_000).toISOString(), activity: "High Temperature alarm triggered", by: "rule engine" },
  { time: new Date(Date.now() - 5 * 3600_000).toISOString(), activity: "Telemetry updated", by: "system" },
  { time: new Date(Date.now() - 86400_000).toISOString(), activity: "Firmware updated to v2.4.1", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 2 * 86400_000).toISOString(), activity: "Device registered", by: "ali@paapeli.io" },
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
            trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
            onClick={() => setActiveTab("alarms")}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-2">
            {[
              { v: "overview", label: t("overview"), icon: Activity },
              { v: "telemetry", label: t("telemetry"), icon: Waves },
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
                  <InfoRow label={t("type")} value={profileLabel(profile)} />
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
                      <div key={ch.key} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground w-24 shrink-0">{ch.label}</span>
                        <span className={`text-base font-semibold ${ch.color} w-20 text-end shrink-0`}>
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
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t("failureRisk")}</div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${failureRiskKey === "Low" ? "text-emerald-500" : failureRiskKey === "Medium" ? "text-amber-500" : "text-rose-500"}`} />
                        <span className="text-sm font-medium">{failureRisk}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t("remainingUsefulLife")}</div>
                      <div className="flex items-center gap-2">
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
                          <TableCell>{e.activity}</TableCell>
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
                          <TableCell>{a.rule}</TableCell>
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
                        <TableCell>{e.activity}</TableCell>
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
  const { language } = useLanguage();
  const size = language === "en" ? "text-sm" : "text-[15px]";
  return (
    <div className={`flex items-start gap-3 ${size}`}>
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className={`flex-1 ${className}`}>{value}</span>
    </div>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const cls = severity === "High" ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
    : severity === "Medium" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
    : "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10";
  return <Badge className={cls}><AlertTriangle className="h-3 w-3 me-1" />{severity}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls = status === "Active" ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
    : status === "Acknowledged" ? "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10"
    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10";
  return <Badge className={cls}>{status}</Badge>;
};

const HealthGauge = ({ score }: { score: number }) => {
  const tone = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Attention";
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

const TelemetryTab = ({ channels, seed }: { channels: Channel[]; seed: number }) => {
  const [range, setRange] = useState("24h");
  const [selected, setSelected] = useState<string[]>(channels.map(c => c.key));
  const [compare, setCompare] = useState(false);

  const points = range === "1h" ? 30 : range === "24h" ? 48 : 60;
  const datasets = channels
    .filter(c => selected.includes(c.key))
    .map(c => ({ channel: c, data: generateSeries(c, points, seed + c.key.length) }));

  const stats = (data: { v: number }[]) => {
    const v = data.map(d => d.v);
    return { min: Math.min(...v), max: Math.max(...v), avg: v.reduce((a, b) => a + b, 0) / v.length };
  };

  const exportData = (type: "csv" | "xlsx") => {
    const lines = ["time," + datasets.map(d => d.channel.key).join(",")];
    for (let i = 0; i < points; i++) {
      lines.push(i + "," + datasets.map(d => d.data[i].v).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: type === "csv" ? "text/csv" : "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `telemetry.${type}`; a.click();
    URL.revokeObjectURL(url);
  };

  // Combined chart data
  const combinedData = compare ? Array.from({ length: points }, (_, i) => {
    const row: any = { t: i };
    datasets.forEach(d => { row[d.channel.key] = d.data[i].v; });
    return row;
  }) : null;

  return (
    <>
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Channels ({selected.length}) <ChevronDown className="h-4 w-4 ms-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {channels.map(c => (
                <DropdownMenuItem key={c.key} onClick={(e) => {
                  e.preventDefault();
                  setSelected(s => s.includes(c.key) ? s.filter(x => x !== c.key) : [...s, c.key]);
                }}>
                  <Checkmark on={selected.includes(c.key)} /> {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {channels.length > 1 && (
            <div className="flex items-center gap-2">
              <Switch checked={compare} onCheckedChange={setCompare} id="cmp" />
              <Label htmlFor="cmp" className="text-sm">Compare</Label>
            </div>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => exportData("csv")}><Download className="h-4 w-4 me-2" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportData("xlsx")}><Download className="h-4 w-4 me-2" /> Excel</Button>
        </CardContent>
      </Card>

      {compare && combinedData ? (
        <Card>
          <CardHeader><CardTitle className="text-base">All Channels</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="t" />
                <YAxis />
                <RTooltip />
                <Legend />
                {datasets.map(d => (
                  <Line key={d.channel.key} type="monotone" dataKey={d.channel.key} stroke={d.channel.stroke} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {datasets.map(({ channel, data }) => {
            const s = stats(data);
            return (
              <Card key={channel.key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{channel.label} <span className="text-muted-foreground text-sm font-normal">({channel.unit})</span></CardTitle>
                    <div className="flex gap-3 text-xs">
                      <span><span className="text-muted-foreground">Min:</span> <span className="font-medium">{s.min.toFixed(channel.decimals ?? 1)}</span></span>
                      <span><span className="text-muted-foreground">Max:</span> <span className="font-medium">{s.max.toFixed(channel.decimals ?? 1)}</span></span>
                      <span><span className="text-muted-foreground">Avg:</span> <span className="font-medium">{s.avg.toFixed(channel.decimals ?? 1)}</span></span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="t" />
                      <YAxis />
                      <RTooltip />
                      <Line type="monotone" dataKey="v" stroke={channel.stroke} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
        <CardTitle className="text-base">Alarms</CardTitle>
        <div className="flex gap-2">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead><TableHead>Severity</TableHead>
              <TableHead>Rule</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground">{formatRelativeTime(a.time, t, formatNumber)}</TableCell>
                <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                <TableCell>{a.rule}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast({ title: "Alarm viewed", description: a.rule })}>View Alarm</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: "Alarm acknowledged", description: a.rule })}>Acknowledge</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: "Alarm cleared", description: a.rule })}>Clear Alarm</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No alarms</TableCell></TableRow>
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
