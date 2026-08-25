import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGateways } from "@/hooks/useGateways";
import { useDevices } from "@/hooks/useDevices";
import { useConnectors, type GatewayConnector, type ConnectorType } from "@/hooks/useConnectors";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Edit, MoreHorizontal, RefreshCw, Upload, MapPin, Trash2,
  Router, Network, Clock, Cpu, MemoryStick, HardDrive, SignalHigh, Activity,
  Bell, Calendar, Settings as SettingsIcon, ChevronDown, ChevronRight, ChevronLeft,
  Wifi, WifiOff, Smartphone, AlertTriangle, Shield, Plus,
  Cable, Radio, Copy, CheckCheck, Terminal,
  Radar, Search, EyeOff, RotateCcw, CheckCircle2, Rocket, ArrowRight, X,
} from "lucide-react";

const hasPersian = (v: string) => /[\u0600-\u06FF]/.test(v || "");
const fa = (v: string) => (hasPersian(v) ? "font-vazirmatn" : "");

const ONBOARD_DISMISS_KEY = "paapeli-gw-onboarding-dismissed-v1";
const onboardingIsDismissed = (id?: string) => {
  try { return (JSON.parse(localStorage.getItem(ONBOARD_DISMISS_KEY) || "[]") as string[]).includes(id || ""); }
  catch { return false; }
};
const markOnboardingDismissed = (id?: string) => {
  try {
    const arr = JSON.parse(localStorage.getItem(ONBOARD_DISMISS_KEY) || "[]") as string[];
    if (id && !arr.includes(id)) { arr.push(id); localStorage.setItem(ONBOARD_DISMISS_KEY, JSON.stringify(arr)); }
  } catch {}
};

import { formatRelativeTime } from "@/lib/relativeTime";
import { SecurityConfig, type SecurityValue } from "@/components/panel/SecurityConfig";
import { ShareWithUsers } from "@/components/panel/ShareWithUsers";
import { getLocationOptions } from "@/lib/locations";

const formatUptime = (createdAt: string, t: (k: string) => string, formatNumber: (n: number) => string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const d = Math.floor(diff / 86400_000);
  const h = Math.floor((diff % 86400_000) / 3600_000);
  return `${formatNumber(d)}${t("daysShort")} ${formatNumber(h)}${t("hoursShort")}`;
};

const StatCard = ({ icon: Icon, label, value, tone = "primary", trailing, onClick }: any) => {
  const { isRTL } = useLanguage();
  return (
  <Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onClick}>
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

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const { language, isRTL } = useLanguage();
  const size = language === "en" ? "text-sm" : "text-[15px]";
  return (
    <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""} ${size}`}>
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={`flex-1 ${isRTL ? "text-right" : ""}`}>{value}</span>
    </div>
  );
};

const OfflineNotice = ({ t }: { t: (k: string) => string }) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-8">
    <WifiOff className="h-8 w-8 text-muted-foreground/40" />
    <p className="text-sm font-medium">{t("offlineMetricsTitle")}</p>
    <p className="text-xs text-muted-foreground max-w-[16rem]">{t("offlineMetricsDesc")}</p>
  </div>
);

const ResourceBar = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div>
    <div className="flex items-center justify-between text-sm mb-1">
      <span>{label}</span>
      <span className={`font-semibold ${tone}`}>{value}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

const SeverityBadge = ({ severity, t }: { severity: string; t: (k: string) => string }) => {
  const cls = severity === "High" ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
    : severity === "Medium" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
    : "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10";
  const label = severity === "High" ? t("high") : severity === "Medium" ? t("medium") : t("low");
  return <Badge className={cls}><AlertTriangle className="h-3 w-3 me-1" />{label}</Badge>;
};

const MOCK_GW_ALARMS = [
  { id: "ga1", time: new Date(Date.now() - 30 * 60_000).toISOString(), severity: "High", ruleKey: "ruleHighCpu", status: "Active" },
  { id: "ga2", time: new Date(Date.now() - 3 * 3600_000).toISOString(), severity: "Medium", ruleKey: "ruleNetworkLatency", status: "Acknowledged" },
];

const MOCK_GW_EVENTS = [
  { time: new Date(Date.now() - 60_000).toISOString(), activityKey: "evtHeartbeat", by: "system" },
  { time: new Date(Date.now() - 15 * 60_000).toISOString(), activityKey: "evtDeviceConnected", by: "system" },
  { time: new Date(Date.now() - 2 * 3600_000).toISOString(), activityKey: "evtReconnected", by: "system" },
  { time: new Date(Date.now() - 86400_000).toISOString(), activityKey: "evtFirmwareUpdated", by: "ali@paapeli.io" },
  { time: new Date(Date.now() - 3 * 86400_000).toISOString(), activityKey: "evtGatewayRegistered", by: "ali@paapeli.io" },
];

const GatewayDetails = () => {
  const { gatewayId } = useParams<{ gatewayId: string }>();
  const navigate = useNavigate();
  const { language, isRTL, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { items: gateways, remove: removeGw, update: updateGw } = useGateways();
  const { items: devices, create: createDevice } = useDevices();
  const { byGateway: connectorsByGateway, update: updateConnector, remove: removeConnector } = useConnectors();
  const [searchParams] = useSearchParams();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const gateway = useMemo(() => {
    const found = gateways.find((g) => g.id === gatewayId || g.gatewayId === gatewayId);
    if (found) return found;
    if (!gatewayId) return null;
    return {
      id: gatewayId,
      gatewayId: gatewayId,
      pairingKey: "demo-" + gatewayId.toLowerCase(),
      name: gatewayId,
      protocol: "MQTT",
      location: "",
      model: "Paapeli Edge GW-100",
      useSsl: true,
      useOta: true,
      useMonitoring: true,
      tags: "",
      description: "",
      externalId: "",
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: "online" as const,
      connectedDevices: 0,
    } as typeof gateways[number];
  }, [gateways, gatewayId]);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [discoveryConnectorId, setDiscoveryConnectorId] = useState<string>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [onboardDismissed, setOnboardDismissed] = useState<boolean>(() => onboardingIsDismissed(gatewayId));
  const [credentials, setCredentials] = useState<{ name: string; gatewayId: string; pairingKey: string } | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  // Credentials handed off from the create form (we now land here instead of the list).
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("paapeli.newGatewayCredentials");
      if (stored) {
        setCredentials(JSON.parse(stored));
        setCredentialsOpen(true);
        sessionStorage.removeItem("paapeli.newGatewayCredentials");
      }
    } catch {}
  }, []);

  if (!gateway) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">{t("gatewayNotFound")}</p>
          <Button onClick={() => navigate(lp("/devices/gateways"))}>
            {isRTL ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />} {t("backToGateways")}
          </Button>
        </div>
      </>
    );
  }

  const seed = (gateway.id.charCodeAt(0) || 1) * 7;
  const cpu = 20 + (seed % 70);
  const mem = 30 + ((seed * 3) % 60);
  const disk = 10 + ((seed * 7) % 80);
  const signal = 40 + ((seed * 11) % 60);
  const latency = 5 + ((seed * 13) % 80);
  const packetLoss = (seed % 5) + ((seed * 3) % 10) / 10;
  const status = gateway.status || "online";
  const statusDot = status === "online" ? "bg-emerald-500" : status === "offline" ? "bg-muted-foreground/50" : "bg-rose-500";
  const connectedDevices = devices.filter((d) => d.gateway === gateway.name || d.gateway === gateway.gatewayId);
  const connectors = connectorsByGateway(gateway.gatewayId);
  // Onboarding guidance shows until the first connector exists, or until dismissed.
  const showOnboarding = connectors.length === 0 && !onboardDismissed;
  const dismissOnboarding = () => {
    setOnboardDismissed(true);
    markOnboardingDismissed(gateway.gatewayId);
  };
  const addConnector = () => navigate(lp(`/devices/gateways/${gateway.gatewayId}/connectors/new`));

  // Read-only view of the credentials/security method chosen at creation.
  const securityView: SecurityValue = {
    method: gateway.authMethod || (gateway.useSsl ? "ssl" : "accessToken"),
    accessToken: gateway.pairingKey,
    clientId: gateway.authClientId || "",
    username: gateway.authUsername || "",
    password: "",
    sslCert: gateway.sslCert || "",
  };

  const goToDiscovery = (connectorId?: string) => {
    setDiscoveryConnectorId(connectorId || "all");
    setActiveTab("discovery");
  };

  const onDelete = () => {
    removeGw(gateway.id);
    toast({ title: t("gatewayDeleted"), description: gateway.name });
    navigate(lp("/devices/gateways"));
  };

  return (
    <>
      <TooltipProvider>
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigate(lp("/devices"))} className="cursor-pointer">{t("assets")}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigate(lp("/devices/gateways"))} className="cursor-pointer">{t("gateways")}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage className={fa(gateway.name)}>{gateway.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="mb-4">
          <CardContent className="p-5 flex flex-wrap items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Router className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold truncate ${fa(gateway.name)}`}>{gateway.name}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`gap-1.5 ${status === "online" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  {status === "online" ? t("online") : status === "offline" ? t("offline") : t("errorStatus")}
                </Badge>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <LocationCell path={gateway.location || "Qazvin > Factory A > Network Room"} />
                </span>
                {(gateway.tags?.split(",").map((s: string) => s.trim()).filter(Boolean) || []).map((tg: string) => (
                  <Badge key={tg} variant="outline" className="text-xs font-normal">{tg}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={addConnector}><Plus className="h-4 w-4 me-2" /> {t("addConnector")}</Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 me-2" /> {t("edit")}</Button>
              <Button variant="outline" onClick={() => setRestartOpen(true)}><RefreshCw className="h-4 w-4 me-2" /> {t("restart")}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><ChevronDown className="h-4 w-4 me-1" /> {t("more")} <MoreHorizontal className="h-4 w-4 ms-2" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab("settings")}><Upload className="h-4 w-4 me-2" /> {t("softwareUpdate")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 me-2" /> {t("deleteGateway")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {showOnboarding && (
          <OnboardingBanner t={t} onAddConnector={addConnector} onDismiss={dismissOnboarding} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Wifi} label={t("status")} value={status === "online" ? t("online") : status === "offline" ? t("offline") : t("errorStatus")} tone={status === "online" ? "emerald" : "rose"} />
          <StatCard icon={Smartphone} label={t("connectedDevicesTitle")} value={formatNumber(connectedDevices.length)} tone="violet" onClick={() => setActiveTab("devices")} trailing={isRTL ? <ChevronLeft className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          <StatCard icon={Clock} label={t("uptime")} value={formatUptime(gateway.createdAt, t, formatNumber)} tone="blue" />
          <StatCard icon={Bell} label={t("activeAlarmsLabel")} value={formatNumber(MOCK_GW_ALARMS.filter(a => a.status === "Active").length)} tone="rose" onClick={() => setActiveTab("alarms")} trailing={isRTL ? <ChevronLeft className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-2">
            {[
              { v: "overview", label: t("overview"), icon: Activity },
              { v: "connectors", label: t("connectors"), icon: Cable, badge: connectors.length },
              { v: "discovery", label: t("discovery"), icon: Radar },
              { v: "devices", label: t("devicesTabTitle"), icon: Smartphone, badge: connectedDevices.length },
              { v: "alarms", label: t("alarms"), icon: Bell, badge: MOCK_GW_ALARMS.filter(a => a.status === "Active").length },
              { v: "events", label: t("events"), icon: Calendar },
              { v: "settings", label: t("settings"), icon: SettingsIcon },
            ].map(({ v, label, icon: I, badge }) => (
              <TabsTrigger key={v} value={v}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-4 py-2.5 gap-2">
                <I className="h-4 w-4" /> {label}
                {badge ? <Badge className="h-5 px-1.5 bg-muted hover:bg-muted">{badge}</Badge> : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">{t("gatewayInformation")}</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <InfoRow label={t("gatewayId")} value={<span className="font-mono text-xs">{gateway.gatewayId}</span>} />
                  <InfoRow label={t("protocol")} value={gateway.protocol} />
                  <InfoRow label={t("modelLabel")} value={gateway.model || "Paapeli GW-X1"} />
                  <InfoRow label={t("connectedDevicesTitle")} value={formatNumber(connectedDevices.length)} />
                  <InfoRow label={t("uptime")} value={formatUptime(gateway.createdAt, t, formatNumber)} />
                  <InfoRow label={t("lastSeen")} value={formatRelativeTime(gateway.lastSeen || gateway.createdAt, t, formatNumber)} />
                  <InfoRow label={t("softwareVersionLabel")} value="v3.1.0" />
                  <InfoRow label={t("location")} value={<LocationCell path={gateway.location || "Qazvin > Factory A > Network Room"} />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{t("resourceUsage")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {status === "offline" ? <OfflineNotice t={t} /> : (<>
                  <ResourceBar label={t("cpuLabel")} value={cpu} tone={cpu > 80 ? "text-rose-500" : cpu > 60 ? "text-amber-500" : "text-emerald-500"} />
                  <ResourceBar label={t("memoryLabel")} value={mem} tone={mem > 80 ? "text-rose-500" : mem > 60 ? "text-amber-500" : "text-emerald-500"} />
                  <ResourceBar label={t("diskLabel")} value={disk} tone={disk > 80 ? "text-rose-500" : disk > 60 ? "text-amber-500" : "text-emerald-500"} />
                  </>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{t("networkLabel")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {status === "offline" ? <OfflineNotice t={t} /> : (<>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="inline-flex items-center gap-2"><SignalHigh className="h-4 w-4" /> {t("signalStrength")}</span>
                      <span className="font-semibold text-emerald-500">{formatNumber(signal)} dBm</span>
                    </div>
                    <Progress value={signal} className="h-2" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{t("latencyLabel")}</div>
                      <div className="text-lg font-semibold">{formatNumber(latency)} <span className="text-xs text-muted-foreground">ms</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t("packetLoss")}</div>
                      <div className={`text-lg font-semibold ${packetLoss > 3 ? "text-rose-500" : "text-emerald-500"}`}>
                        {formatNumber(packetLoss.toFixed(1))}<span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  </>)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("recentEvents")}</CardTitle>
                <Button variant="link" className="text-primary h-auto p-0" onClick={() => setActiveTab("events")}>{t("viewAll")}</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>{t("time")}</TableHead><TableHead>{t("activity")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {MOCK_GW_EVENTS.slice(0, 5).map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(e.time, t, formatNumber)}</TableCell>
                        <TableCell>{t(e.activityKey as any)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONNECTORS */}
          <TabsContent value="connectors" className="space-y-4 mt-4">
            <ConnectorsTab
              gateway={gateway}
              connectors={connectors}
              lp={lp}
              navigate={navigate}
              t={t}
              formatNumber={formatNumber}
              fa={fa}
              toast={toast}
              updateConnector={updateConnector}
              removeConnector={removeConnector}
              goToDiscovery={goToDiscovery}
            />
          </TabsContent>

          {/* DISCOVERY */}
          <TabsContent value="discovery" className="space-y-4 mt-4">
            <DiscoveryTab
              gateway={gateway}
              connectors={connectors}
              connectorId={discoveryConnectorId}
              setConnectorId={setDiscoveryConnectorId}
              lp={lp}
              navigate={navigate}
              t={t}
              fa={fa}
              formatNumber={formatNumber}
              toast={toast}
              createDevice={createDevice}
              updateConnector={updateConnector}
              updateGw={updateGw}
              goToDevices={() => setActiveTab("devices")}
            />
          </TabsContent>

          {/* DEVICES */}
          <TabsContent value="devices" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("devicesTabTitle")}</CardTitle>
                {connectedDevices.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => goToDiscovery()}>
                    <Radar className="h-4 w-4 me-2" /> {t("discoverDevices")}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {connectedDevices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <Smartphone className="h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">{t("noDevicesProvisionedTitle")}</p>
                    <p className="text-xs text-muted-foreground max-w-sm">{t("noDevicesProvisionedDesc")}</p>
                    <Button size="sm" onClick={() => goToDiscovery()}>
                      <Radar className="h-4 w-4 me-2" /> {t("discoverDevices")}
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead><TableHead>{t("deviceId")}</TableHead>
                        <TableHead>{t("protocol")}</TableHead><TableHead>{t("location")}</TableHead>
                        <TableHead>{t("lastActivity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectedDevices.map((d) => (
                        <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(lp(`/devices/${d.deviceId}`))}>
                          <TableCell className={fa(d.name)}>{d.name}</TableCell>
                          <TableCell className="font-mono text-xs">{d.deviceId}</TableCell>
                          <TableCell>{d.protocol}</TableCell>
                          <TableCell><LocationCell path={d.location} /></TableCell>
                          <TableCell className="text-muted-foreground">{formatRelativeTime(d.lastActivity || d.createdAt, t, formatNumber)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALARMS */}
          <TabsContent value="alarms" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("gatewayAlarms")}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("time")}</TableHead><TableHead>{t("severity")}</TableHead>
                      <TableHead>{t("rule")}</TableHead><TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_GW_ALARMS.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(a.time, t, formatNumber)}</TableCell>
                        <TableCell><SeverityBadge severity={a.severity} t={t} /></TableCell>
                        <TableCell>{t(a.ruleKey as any)}</TableCell>
                        <TableCell><Badge variant="secondary">{a.status === "Active" ? t("active") : a.status === "Acknowledged" ? t("acknowledged") : a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("connectionEvents")}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("time")}</TableHead><TableHead>{t("activity")}</TableHead><TableHead>{t("triggeredBy")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_GW_EVENTS.map((e, i) => (
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
                <CardTitle className="text-base">{t("generalLabel")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 me-2" /> {t("edit")}</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label={t("name")} value={gateway.name} />
                <InfoRow label={t("description")} value={gateway.description || "—"} />
                <InfoRow label={t("location")} value={<LocationCell path={gateway.location || "Qazvin > Factory A > Network Room"} />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4" /> {t("networkSettings")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label={t("ipAddress")} value={<span className="font-mono text-xs" dir="ltr">10.0.{seed % 255}.{(seed * 3) % 255}</span>} />
                <InfoRow label={t("subnet")} value={<span className="font-mono text-xs" dir="ltr">255.255.255.0</span>} />
                <InfoRow label={t("gateway")} value={<span className="font-mono text-xs" dir="ltr">10.0.{seed % 255}.1</span>} />
                <InfoRow label={t("dns")} value={<span className="font-mono text-xs" dir="ltr">8.8.8.8, 1.1.1.1</span>} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> {t("credentialsSecurity")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 me-2" /> {t("edit")}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <SecurityConfig value={securityView} readOnly />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div><Label>{t("autoProvisionDevices")}</Label><p className="text-xs text-muted-foreground">{t("autoProvisionDevicesDesc")}</p></div>
                  <Switch defaultChecked={false} disabled />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("shareWithUsers")}</CardTitle></CardHeader>
              <CardContent>
                <ShareWithUsers value={gateway.sharedUsers || []} readOnly />
              </CardContent>
            </Card>
            <DeploymentCard gateway={gateway} t={t} toast={toast} />
          </TabsContent>
        </Tabs>

        {/* DIALOGS */}
        <CredentialsDialog open={credentialsOpen} onOpenChange={setCredentialsOpen} credentials={credentials} t={t} fa={fa} toast={toast} />
        <EditGatewaySheet open={editOpen} onOpenChange={setEditOpen} gateway={gateway} isRTL={isRTL} />
        <MoveLocationDialog open={moveOpen} onOpenChange={setMoveOpen} gateway={gateway} />
        <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("restartThisGateway")}</AlertDialogTitle>
              <AlertDialogDescription>{t("restartGatewayDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => toast({ title: t("restartCommandSent"), description: gateway.name })}>{t("restart")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteGatewayQ")}</AlertDialogTitle>
              <AlertDialogDescription>
                "<span className={fa(gateway.name)}>{gateway.name}</span>" {t("deleteGatewayDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>{t("delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </>
  );
};

const CONNECTOR_META: Record<ConnectorType, { label: string; icon: any; protocol: string }> = {
  opcua: { label: "OPC-UA", icon: Cpu, protocol: "OPC-UA" },
  mqtt: { label: "MQTT", icon: Radio, protocol: "MQTT" },
  modbus: { label: "Modbus TCP", icon: Network, protocol: "Modbus TCP" },
};

const connectorCandidates = (c: GatewayConnector): string[] => {
  const cfg: any = c.config || {};
  if (c.type === "modbus") {
    return (cfg.slaves || []).map((s: any, i: number) => s.name || `${c.name} #${i + 1}`);
  }
  return (cfg.mapping || []).map((m: any, i: number) => {
    const raw = c.type === "opcua" ? m.deviceNamePattern : m.deviceNameExpression;
    const cleaned = (raw || "").replace(/[${}\\]/g, "").trim();
    return cleaned || `${c.name} #${i + 1}`;
  });
};

const ConnectorsTab = ({
  gateway, connectors, lp, navigate, t, formatNumber, fa, toast,
  updateConnector, removeConnector, goToDiscovery,
}: any) => {
  const [deleteFor, setDeleteFor] = useState<GatewayConnector | null>(null);

  return (
    <>
      {/* Connectors list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("connectors")}</CardTitle>
          <Button size="sm" onClick={() => navigate(lp(`/devices/gateways/${gateway.gatewayId}/connectors/new`))}>
            <Plus className="h-4 w-4 me-2" /> {t("addConnector")}
          </Button>
        </CardHeader>
        <CardContent>
          {connectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Cable className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noConnectorsYet")}</p>
              <p className="text-xs text-muted-foreground max-w-sm">{t("connectorsDesc")}</p>
              <Button size="sm" onClick={() => navigate(lp(`/devices/gateways/${gateway.gatewayId}/connectors/new`))}>
                <Plus className="h-4 w-4 me-2" /> {t("addConnector")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectors.map((c: GatewayConnector) => {
                const meta = CONNECTOR_META[c.type];
                const Icon = meta.icon;
                return (
                  <div key={c.id} className="rounded-lg border border-border p-4 flex items-center gap-3 text-start">
                    <span className="h-9 w-9 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-medium truncate min-w-0 ${fa(c.name)}`}>{c.name}</span>
                        <Badge variant="outline" className="text-xs font-normal shrink-0">{meta.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${c.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                          {c.enabled ? t("enabledLabel") : t("disabledLabel")}
                        </span>
                        <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> {formatNumber(c.deviceIds?.length || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={c.enabled}
                        onCheckedChange={(v) => updateConnector(c.id, { enabled: v, status: v ? "active" : "inactive" })}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(lp(`/devices/gateways/${gateway.gatewayId}/connectors/${c.id}`))}>
                            <SettingsIcon className="h-4 w-4 me-2" /> {t("configureConnector")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => goToDiscovery(c.id)}>
                            <Radar className="h-4 w-4 me-2" /> {t("discoverDevices")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteFor(c)}>
                            <Trash2 className="h-4 w-4 me-2" /> {t("deleteConnector")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteFor} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConnectorQ")}</AlertDialogTitle>
            <AlertDialogDescription>
              "<span className={fa(deleteFor?.name || "")}>{deleteFor?.name}</span>" {t("deleteConnectorDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteFor) { removeConnector(deleteFor.id); toast({ title: t("connectorDeleted"), description: deleteFor.name }); } setDeleteFor(null); }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/* ---------------- Onboarding banner ---------------- */
const OnboardingBanner = ({ t, onAddConnector, onDismiss }: { t: (k: string) => string; onAddConnector: () => void; onDismiss: () => void }) => {
  const { isRTL } = useLanguage();
  const steps = [
    { icon: Cable, title: t("onboardingAddConnector"), desc: t("onboardingAddConnectorDesc") },
    { icon: Radar, title: t("onboardingDiscover"), desc: t("onboardingDiscoverDesc") },
    { icon: Smartphone, title: t("onboardingProvision"), desc: t("onboardingProvisionDesc") },
  ];
  return (
    <Card className="mb-4 border-primary/30 bg-primary/[0.03]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="h-9 w-9 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
            <Rocket className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{t("onboardingTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t("onboardingDesc")}</p>
          </div>
          <Button size="sm" onClick={onAddConnector} className="shrink-0">
            {t("onboardingAddConnector")}
            {isRTL ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={onDismiss} aria-label={t("dismiss")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
                <span className="h-7 w-7 rounded-full border-2 border-primary/40 text-primary text-xs font-semibold inline-flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {s.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/* ---------------- Deployment (Settings) ---------------- */
const DeploymentCard = ({ gateway, t, toast }: any) => {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const launchCommand =
    `docker run -d --restart always \\\n` +
    `  -e host=paapeli.io -e port=1883 \\\n` +
    `  -e accessToken=${gateway.pairingKey || "<pairing-key>"} \\\n` +
    `  --name paapeli-gateway-${gateway.gatewayId} paapeli/tb-gateway:latest`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(launchCommand);
      setCopied(true);
      toast({ title: t("copyCommand") });
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2"><Terminal className="h-4 w-4" /> {t("deploymentSection")}</CardTitle>
        {shown ? (
          <Button variant="ghost" size="sm" onClick={() => setShown(false)}>{t("hideLabel")}</Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShown(true)}><Rocket className="h-4 w-4 me-2" /> {t("deployGateway")}</Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{t("deploymentSectionDesc")}</p>
        {shown && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <CheckCheck className="h-4 w-4 me-1 text-green-500" /> : <Copy className="h-4 w-4 me-1" />}
                {t("copyCommand")}
              </Button>
            </div>
            <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-x-auto whitespace-pre" dir="ltr">{launchCommand}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ---------------- Discovery tab ---------------- */
interface DiscoveredDevice {
  id: string;
  name: string;
  protocol: string;
  connectorId: string;
  connectorName: string;
  deviceType: string;
  signal: number;
  lastSeen: string;
  ignored: boolean;
}

const DEVICE_TYPES = ["Sensor", "PLC", "Meter", "Actuator", "Controller", "Drive"];

const buildDiscovered = (connectors: GatewayConnector[]): DiscoveredDevice[] => {
  const out: DiscoveredDevice[] = [];
  connectors.forEach((c) => {
    const meta = CONNECTOR_META[c.type];
    const names = connectorCandidates(c);
    // Always surface at least a couple of devices per connector so discovery feels real.
    const base = names.length ? names : [`${c.name} Device 1`, `${c.name} Device 2`];
    base.forEach((name, i) => {
      const h = (name.charCodeAt(0) || 65) * (i + 3);
      out.push({
        id: `${c.id}-disc-${i}`,
        name,
        protocol: meta.protocol,
        connectorId: c.id,
        connectorName: c.name,
        deviceType: DEVICE_TYPES[h % DEVICE_TYPES.length],
        signal: 55 + (h % 45),
        lastSeen: new Date(Date.now() - (h % 50) * 60_000).toISOString(),
        ignored: false,
      });
    });
  });
  return out;
};

const QualityBadge = ({ signal }: { signal: number }) => {
  const tone = signal >= 80 ? "text-emerald-500" : signal >= 60 ? "text-amber-500" : "text-rose-500";
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tone}`}>
      <SignalHigh className="h-3.5 w-3.5" /> {signal}%
    </span>
  );
};

const DiscoveryTab = ({
  gateway, connectors, connectorId, setConnectorId, lp, navigate,
  t, fa, formatNumber, toast, createDevice, updateConnector, updateGw, goToDevices,
}: any) => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [results, setResults] = useState<DiscoveredDevice[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const scopedConnectors: GatewayConnector[] = useMemo(
    () => (connectorId === "all" ? connectors : connectors.filter((c: GatewayConnector) => c.id === connectorId)),
    [connectors, connectorId],
  );

  const startScan = () => {
    if (!scopedConnectors.length) return;
    setScanning(true);
    setProgress(0);
    setResults([]);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          const found = buildDiscovered(scopedConnectors);
          setResults(found);
          setSelected(Object.fromEntries(found.map((d) => [d.id, true])));
          setScanning(false);
          setHasScanned(true);
          return 100;
        }
        return p + 20;
      });
    }, 180);
  };

  const visible = results.filter((d) => {
    if (d.ignored) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.connectorName.toLowerCase().includes(q) || d.deviceType.toLowerCase().includes(q);
  });
  const ignoredList = results.filter((d) => d.ignored);
  const selectedVisible = visible.filter((d) => selected[d.id]);

  const toggleIgnore = (id: string, ignored: boolean) =>
    setResults((prev) => prev.map((d) => (d.id === id ? { ...d, ignored } : d)));

  const provision = () => {
    if (!selectedVisible.length) return;
    const perConnector: Record<string, string[]> = {};
    selectedVisible.forEach((d) => {
      const created = createDevice({ name: d.name, protocol: d.protocol, gateway: gateway.name, location: gateway.location });
      (perConnector[d.connectorId] ||= []).push(created.deviceId);
    });
    Object.entries(perConnector).forEach(([cid, ids]) => {
      const conn = connectors.find((c: GatewayConnector) => c.id === cid);
      updateConnector(cid, { deviceIds: [...(conn?.deviceIds || []), ...ids], status: "active" });
    });
    updateGw(gateway.id, { connectedDevices: (gateway.connectedDevices || 0) + selectedVisible.length });
    // Drop provisioned devices from the result list.
    const provisionedIds = new Set(selectedVisible.map((d) => d.id));
    setResults((prev) => prev.filter((d) => !provisionedIds.has(d.id)));
    toast({ title: t("success"), description: `${selectedVisible.length} ${t("devicesProvisioned")}` });
    goToDevices();
  };

  if (!connectors.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Radar className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">{t("discoveryEmptyTitle")}</p>
          <p className="text-xs text-muted-foreground max-w-sm">{t("discoveryEmptyDesc")}</p>
          <Button size="sm" onClick={() => navigate(lp(`/devices/gateways/${gateway.gatewayId}/connectors/new`))}>
            <Plus className="h-4 w-4 me-2" /> {t("addConnector")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Scan controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t("selectConnectorToScan")}</Label>
            <Select value={connectorId} onValueChange={setConnectorId}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allConnectors")}</SelectItem>
                {connectors.map((c: GatewayConnector) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {CONNECTOR_META[c.type].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startScan} disabled={scanning}>
            {scanning
              ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" /> {t("scanningForDevices")}</>
              : <><Radar className="h-4 w-4 me-2" /> {hasScanned ? t("rescan") : t("startDiscovery")}</>}
          </Button>
          {scanning && <div className="flex-1 min-w-[160px]"><Progress value={progress} className="h-2" /></div>}
        </CardContent>
      </Card>

      {/* Results */}
      {(hasScanned || scanning) && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">{t("discoveredDevicesTitle")} {results.length ? `(${formatNumber(visible.length)})` : ""}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchDevicesPlaceholder")} className="h-9 w-48 ps-8" />
              </div>
              <Button variant="outline" size="sm" onClick={startScan} disabled={scanning}>
                <RefreshCw className={`h-4 w-4 me-1 ${scanning ? "animate-spin" : ""}`} /> {t("refreshScan")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">{t("discoveryNoResults")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={visible.length > 0 && selectedVisible.length === visible.length}
                        onCheckedChange={(c) => setSelected((prev) => {
                          const next = { ...prev };
                          visible.forEach((d) => { next[d.id] = !!c; });
                          return next;
                        })}
                      />
                    </TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("protocol")}</TableHead>
                    <TableHead>{t("connectors")}</TableHead>
                    <TableHead>{t("deviceTypeLabel")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("signalQuality")}</TableHead>
                    <TableHead>{t("lastSeen")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Checkbox checked={!!selected[d.id]} onCheckedChange={(c) => setSelected((prev) => ({ ...prev, [d.id]: !!c }))} />
                      </TableCell>
                      <TableCell className={`font-medium ${fa(d.name)}`}>{d.name}</TableCell>
                      <TableCell>{d.protocol}</TableCell>
                      <TableCell className="text-muted-foreground">{d.connectorName}</TableCell>
                      <TableCell>{d.deviceType}</TableCell>
                      <TableCell><Badge className="bg-sky-500/10 text-sky-600 hover:bg-sky-500/10">{t("statusNew")}</Badge></TableCell>
                      <TableCell><QualityBadge signal={d.signal} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatRelativeTime(d.lastSeen, t, formatNumber)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={t("ignoreLabel")} onClick={() => toggleIgnore(d.id, true)}>
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {ignoredList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">{t("ignoredLabel")} ({formatNumber(ignoredList.length)})</div>
                <div className="flex flex-wrap gap-2">
                  {ignoredList.map((d) => (
                    <Badge key={d.id} variant="outline" className="gap-1.5 font-normal">
                      <span className={fa(d.name)}>{d.name}</span>
                      <button type="button" className="inline-flex items-center" title={t("restoreLabel")} onClick={() => toggleIgnore(d.id, false)}>
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          {visible.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{formatNumber(selectedVisible.length)} {t("selectedCount")}</span>
              <Button onClick={provision} disabled={selectedVisible.length === 0}>
                <CheckCircle2 className="h-4 w-4 me-2" /> {t("provisionSelectedDevices")}
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

const CredentialsDialog = ({ open, onOpenChange, credentials, t, fa, toast }: any) => {
  const [copied, setCopied] = useState<string | null>(null);
  if (!credentials) return null;
  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({ title: t("copyCommand") });
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("gatewayCreated")}</DialogTitle>
          <DialogDescription>{t("saveCredentialsGateway")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("name")}</div>
            <Input value={credentials.name} readOnly className={fa(credentials.name)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("gatewayId")}</div>
            <div className="flex gap-2">
              <Input value={credentials.gatewayId} readOnly className="font-mono" dir="ltr" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => copy(credentials.gatewayId, "id")}>
                {copied === "id" ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("pairingKey")}</div>
            <div className="flex gap-2">
              <Input value={credentials.pairingKey} readOnly className="font-mono" dir="ltr" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => copy(credentials.pairingKey, "key")}>
                {copied === "key" ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {t("iHaveSavedTheCredentials")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditGatewaySheet = ({ open, onOpenChange, gateway, isRTL }: any) => {
  const { toast } = useToast();
  const { update } = useGateways();
  const { t } = useLanguage();
  const [name, setName] = useState(gateway.name);
  const [desc, setDesc] = useState(gateway.description || "");
  const [tags, setTags] = useState<string[]>(
    gateway.tags?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
  );
  const [tagInput, setTagInput] = useState("");
  const buildSecurity = (g: any): SecurityValue => ({
    method: g?.authMethod || (g?.useSsl ? "ssl" : "accessToken"),
    accessToken: g?.pairingKey || "",
    clientId: g?.authClientId || "",
    username: g?.authUsername || "",
    password: "",
    sslCert: g?.sslCert || "",
  });
  const [security, setSecurity] = useState<SecurityValue>(() => buildSecurity(gateway));
  const [shared, setShared] = useState<string[]>(gateway.sharedUsers || []);
  useEffect(() => {
    setName(gateway.name);
    setDesc(gateway.description || "");
    setTags(gateway.tags?.split(",").map((s: string) => s.trim()).filter(Boolean) || []);
    setTagInput("");
    setSecurity(buildSecurity(gateway));
    setShared(gateway.sharedUsers || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, open]);
  const addTag = (v: string) => {
    const tv = v.trim();
    if (tv && !tags.includes(tv)) setTags([...tags, tv]);
    setTagInput("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("editGateway")}</SheetTitle>
          <SheetDescription>{t("editGatewayDesc")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          <div><Label>{t("name")}</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1" /></div>
          <div><Label>{t("description")}</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="mt-1" /></div>
          <div>
            <Label>{t("tagsLabel")}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
              {tags.map(tg => (
                <Badge key={tg} variant="secondary" className="gap-1">
                  {tg}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== tg))} aria-label="remove">×</button>
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                else if (e.key === "Backspace" && !tagInput && tags.length) setTags(tags.slice(0, -1));
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder={t("addTagsPlaceholder")}
            />
            <p className="text-xs text-muted-foreground mt-1">{t("pressEnterTags")}</p>
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
            update(gateway.id, {
              name, description: desc, tags: tags.join(", "),
              authMethod: security.method,
              authUsername: security.method === "basic" ? security.username : gateway.authUsername,
              authClientId: security.method === "basic" ? security.clientId : gateway.authClientId,
              sslCert: security.method === "ssl" ? security.sslCert : gateway.sslCert,
              pairingKey: security.method === "accessToken" ? security.accessToken : gateway.pairingKey,
              useSsl: security.method === "ssl",
              sharedUsers: shared,
            });
            toast({ title: t("gatewayUpdated") });
            onOpenChange(false);
          }}>{t("save")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const MoveLocationDialog = ({ open, onOpenChange, gateway }: any) => {
  const { update } = useGateways();
  const { toast } = useToast();
  const [loc, setLoc] = useState(gateway.location || "");
  useEffect(() => setLoc(gateway.location || ""), [gateway, open]);
  const presets = getLocationOptions().map((l) => l.path);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Gateway Location</DialogTitle>
          <DialogDescription>Choose a new location path.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Location Path</Label>
          <Input value={loc} onChange={e => setLoc(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {presets.map(p => <Button key={p} variant="outline" size="sm" onClick={() => setLoc(p)} className="text-xs">{p}</Button>)}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { update(gateway.id, { location: loc }); toast({ title: "Location updated" }); onOpenChange(false); }}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GatewayDetails;
