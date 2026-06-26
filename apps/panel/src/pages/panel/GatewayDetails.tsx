import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGateways } from "@/hooks/useGateways";
import { useDevices } from "@/hooks/useDevices";
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
import {
  ArrowLeft, Edit, MoreHorizontal, RefreshCw, Upload, MapPin, Trash2,
  Router, Network, Clock, Cpu, MemoryStick, HardDrive, SignalHigh, Activity,
  Bell, Calendar, Settings as SettingsIcon, ChevronDown, ChevronRight,
  Wifi, Smartphone, AlertTriangle, Shield, Plus,
} from "lucide-react";

const hasPersian = (v: string) => /[\u0600-\u06FF]/.test(v || "");
const fa = (v: string) => (hasPersian(v) ? "font-vazirmatn" : "");

import { formatRelativeTime } from "@/lib/relativeTime";

const formatUptime = (createdAt: string, t: (k: string) => string, formatNumber: (n: number) => string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const d = Math.floor(diff / 86400_000);
  const h = Math.floor((diff % 86400_000) / 3600_000);
  return `${formatNumber(d)}${t("daysShort")} ${formatNumber(h)}${t("hoursShort")}`;
};

const StatCard = ({ icon: Icon, label, value, tone = "primary", trailing, onClick }: any) => (
  <Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onClick}>
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

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const { language } = useLanguage();
  const size = language === "en" ? "text-sm" : "text-[15px]";
  return (
    <div className={`flex items-start gap-3 ${size}`}>
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="flex-1">{value}</span>
    </div>
  );
};

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
  { id: "ga1", time: new Date(Date.now() - 30 * 60_000).toISOString(), severity: "High", rule: "High CPU Usage", status: "Active" },
  { id: "ga2", time: new Date(Date.now() - 3 * 3600_000).toISOString(), severity: "Medium", rule: "Network Latency Spike", status: "Acknowledged" },
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
  const { items: gateways, remove: removeGw } = useGateways();
  const { items: devices } = useDevices();
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

  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [firmwareOpen, setFirmwareOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!gateway) {
    return (
      <PanelLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">{t("gatewayNotFound")}</p>
          <Button onClick={() => navigate(lp("/devices/gateways"))}>
            <ArrowLeft className="h-4 w-4 me-2" /> {t("backToGateways")}
          </Button>
        </div>
      </PanelLayout>
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

  const onDelete = () => {
    removeGw(gateway.id);
    toast({ title: t("gatewayDeleted"), description: gateway.name });
    navigate(lp("/devices/gateways"));
  };

  return (
    <PanelLayout>
      <TooltipProvider>
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href={lp("/devices")}>{t("assets")}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={lp("/devices/gateways")}>{t("gateways")}</BreadcrumbLink></BreadcrumbItem>
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
              <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 me-2" /> {t("edit")}</Button>
              <Button variant="outline" onClick={() => setRestartOpen(true)}><RefreshCw className="h-4 w-4 me-2" /> {t("restart")}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><ChevronDown className="h-4 w-4 me-1" /> {t("more")} <MoreHorizontal className="h-4 w-4 ms-2" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(lp("/firmware?tab=devices"))}><Upload className="h-4 w-4 me-2" /> {t("firmwareUpdate")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 me-2" /> {t("deleteGateway")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Wifi} label={t("status")} value={status === "online" ? t("online") : status === "offline" ? t("offline") : t("errorStatus")} tone={status === "online" ? "emerald" : "rose"} />
          <StatCard icon={Smartphone} label={t("connectedDevicesTitle")} value={formatNumber(connectedDevices.length)} tone="violet" onClick={() => setActiveTab("devices")} trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          <StatCard icon={Clock} label={t("uptime")} value={formatUptime(gateway.createdAt, t, formatNumber)} tone="blue" />
          <StatCard icon={Bell} label={t("activeAlarmsLabel")} value={formatNumber(MOCK_GW_ALARMS.filter(a => a.status === "Active").length)} tone="rose" onClick={() => setActiveTab("alarms")} trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-2">
            {[
              { v: "overview", label: t("overview"), icon: Activity },
              { v: "devices", label: t("connectedDevicesTitle"), icon: Smartphone, badge: connectedDevices.length },
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
                  <InfoRow label={t("firmwareVersionLabel")} value="v3.1.0" />
                  <InfoRow label={t("location")} value={<LocationCell path={gateway.location || "Qazvin > Factory A > Network Room"} />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{t("resourceUsage")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <ResourceBar label={t("cpuLabel")} value={cpu} tone={cpu > 80 ? "text-rose-500" : cpu > 60 ? "text-amber-500" : "text-emerald-500"} />
                  <ResourceBar label={t("memoryLabel")} value={mem} tone={mem > 80 ? "text-rose-500" : mem > 60 ? "text-amber-500" : "text-emerald-500"} />
                  <ResourceBar label={t("diskLabel")} value={disk} tone={disk > 80 ? "text-rose-500" : disk > 60 ? "text-amber-500" : "text-emerald-500"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{t("networkLabel")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <Card>
                <CardHeader><CardTitle className="text-base">{t("quickActions")}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start" onClick={() => setRestartOpen(true)}><RefreshCw className="h-4 w-4 me-2" /> {t("restartGateway")}</Button>
                  <Button variant="outline" className="justify-start" onClick={() => navigate(lp("/firmware?tab=devices"))}><Upload className="h-4 w-4 me-2" /> {t("firmwareUpdate")}</Button>
                  <Button variant="outline" className="justify-start" onClick={() => setMoveOpen(true)}><MapPin className="h-4 w-4 me-2" /> {t("moveLocation")}</Button>
                  <Button variant="outline" className="justify-start text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 me-2" /> {t("deleteGateway")}</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONNECTED DEVICES */}
          <TabsContent value="devices" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("connectedDevicesTitle")}</CardTitle>
                <Button size="sm" onClick={() => navigate(lp("/devices/new"))}>
                  <Plus className="h-4 w-4 me-2" /> {t("attachDevice")}
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead><TableHead>{t("deviceId")}</TableHead>
                      <TableHead>{t("protocol")}</TableHead><TableHead>{t("location")}</TableHead>
                      <TableHead>{t("lastActivity")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectedDevices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noDevicesAttached")}</TableCell></TableRow>
                    ) : connectedDevices.map((d) => (
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
                        <TableCell>{a.rule}</TableCell>
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
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> {t("securitySettings")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><Label>{t("tlsEnforcement")}</Label><p className="text-xs text-muted-foreground">{t("tlsEnforcementDesc")}</p></div>
                  <Switch checked={!!gateway.useSsl} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>{t("autoProvisionDevices")}</Label><p className="text-xs text-muted-foreground">{t("autoProvisionDevicesDesc")}</p></div>
                  <Switch defaultChecked={false} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOGS */}
        <EditGatewaySheet open={editOpen} onOpenChange={setEditOpen} gateway={gateway} isRTL={isRTL} />
        <FirmwareDialog open={firmwareOpen} onOpenChange={setFirmwareOpen} />
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
    </PanelLayout>
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
  useEffect(() => {
    setName(gateway.name);
    setDesc(gateway.description || "");
    setTags(gateway.tags?.split(",").map((s: string) => s.trim()).filter(Boolean) || []);
    setTagInput("");
  }, [gateway, open]);
  const addTag = (v: string) => {
    const tv = v.trim();
    if (tv && !tags.includes(tv)) setTags([...tags, tv]);
    setTagInput("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("editGateway")}</SheetTitle>
          <SheetDescription>{t("editGatewayDesc")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
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
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={() => { update(gateway.id, { name, description: desc, tags: tags.join(", ") }); toast({ title: t("gatewayUpdated") }); onOpenChange(false); }}>{t("save")}</Button>
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
    const id = setInterval(() => setProgress(p => {
      if (p === null) return 0;
      if (p >= 100) { clearInterval(id); toast({ title: "Firmware updated" }); return 100; }
      return p + 10;
    }), 250);
  };
  useEffect(() => { if (!open) setProgress(null); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gateway Firmware Update</DialogTitle>
          <DialogDescription>Push a new firmware image to this gateway.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Current</div><div className="text-lg font-semibold">v3.1.0</div></CardContent></Card>
            <Card className="border-primary/40"><CardContent className="p-3"><div className="text-xs text-muted-foreground">Available</div><div className="text-lg font-semibold text-primary">v3.2.0</div></CardContent></Card>
          </div>
          <div><Label>Upload Firmware (.bin)</Label><Input type="file" className="mt-1" /></div>
          {progress !== null && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1"><span>Progress</span><span>{progress}%</span></div>
              <Progress value={progress} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={start} disabled={progress !== null && progress < 100}>Start Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoveLocationDialog = ({ open, onOpenChange, gateway }: any) => {
  const { update } = useGateways();
  const { toast } = useToast();
  const [loc, setLoc] = useState(gateway.location || "");
  useEffect(() => setLoc(gateway.location || ""), [gateway, open]);
  const presets = ["Qazvin > Factory A > Network Room", "Tehran > DC1 > Rack 4", "Esfahan > Plant > Edge Cabinet"];
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
