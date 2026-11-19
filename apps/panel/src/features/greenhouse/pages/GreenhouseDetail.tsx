import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  Droplets,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
  Settings2,
  Sprout,
  Thermometer,
  Trash2,
  WifiOff,
  Wind,
  Waves,
  Leaf,
} from "lucide-react";
import { assetsService, cropCycleService, type CropCycle, type DeviceResponse, type Greenhouse, type GreenhouseZone } from "@paapeli/api";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { DataState } from "@/features/factory/components/DataState";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { currentProductKey } from "@/features/factory/lib/product";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { GreenhouseCover, fruitOf } from "../components/GreenhouseCover";
import { HealthBadge, cyclesOf, healthOf, useReadingText } from "../components/GreenhouseCard";
import { CropCycleSheet } from "../components/CropCycleSheet";
import { StartCycleDialog } from "../components/StartCycleDialog";
import { AddPlaceDialog, ConfirmDialog, GreenhouseDetailsDialog, GreenhouseDetailsForm, ZoneSettingsDialog } from "../components/GreenhouseDialogs";
import { daysSince, daysUntil, useGreenhouses, useGreenhouseWorkspace } from "../hooks";
import { summarize, useEnvironment, useGreenhouseOps, type EnvMetric, type Reading } from "../operations";
import { evaluate, type Finding } from "../evaluation";
import { useFindingText } from "../components/FindingText";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

const TABS = ["overview", "zones", "devices", "settings"] as const;
type Tab = (typeof TABS)[number];

const ENV: { metric: EnvMetric; icon: typeof Thermometer; unit: string }[] = [
  { metric: "TEMPERATURE", icon: Thermometer, unit: "°C" },
  { metric: "HUMIDITY", icon: Droplets, unit: "%" },
  { metric: "SUBSTRATE_MOISTURE", icon: Waves, unit: "%" },
  { metric: "CO2", icon: Wind, unit: " ppm" },
  { metric: "VPD", icon: Leaf, unit: " kPa" },
];

/**
 * One greenhouse, as its grower runs it: its zones laid out with what grows
 * in each, the crops, the conditions its sensors report and what needs
 * attention. Devices are the platform's own (Device Management); the digital
 * twin is its own page, linked from here once it exists.
 */
export default function GreenhouseDetail() {
  const { greenhouseId } = useParams();
  const [params, setParams] = useSearchParams();
  const { g, language, isRTL, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const greenhouses = useGreenhouses();
  const house = greenhouses.data?.find((h) => h.id === greenhouseId) ?? null;
  const houses = useMemo(() => (house ? [house] : []), [house]);
  const { byHouse, devicesKnown, alarmsKnown, workOrdersKnown } = useGreenhouseOps(houses);
  const ops = house ? byHouse.get(house.id) : undefined;
  const env = useEnvironment(ops?.devices ?? [], !!ops?.devices.length);

  const tab: Tab = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview";
  const setTab = (next: string) => {
    const p = new URLSearchParams(params);
    if (next === "overview") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  };

  const [editing, setEditing] = useState(false);
  const [addingTo, setAddingTo] = useState<{ id: string; kind: "ZONE" | "BED"; nextNumber: number } | null>(null);
  const [plantIn, setPlantIn] = useState<string | null>(null);
  const [openCycle, setOpenCycle] = useState<CropCycle | null>(null);
  const [zoneSettings, setZoneSettings] = useState<GreenhouseZone | null>(null);
  const [changing, setChanging] = useState<{ cycle: CropCycle; assetId: string } | null>(null);
  const [deletingPlace, setDeletingPlace] = useState<{ id: string; name: string; kind: "zone" | "greenhouse" } | null>(null);

  const lp = (path: string) => localizedPath(path, language);
  const Back = isRTL ? ChevronRight : ChevronLeft;

  if (greenhouses.isLoading) return <DataState loading size="lg" />;
  if (greenhouses.isError) return <LoadFailed onRetry={() => void greenhouses.refetch()} />;
  if (!house) {
    return (
      <UniformPage>
        <Button variant="ghost" className="gap-1" onClick={() => navigate(lp("/greenhouses"))}>
          <Back className="h-4 w-4" /> {g("greenhouses")}
        </Button>
      </UniformPage>
    );
  }

  const cycles = cyclesOf(house);
  const findings = evaluate(house, ops, env.readings);
  const health = findings.length && devicesKnown ? "attention" : healthOf(ops, devicesKnown && alarmsKnown);
  const lastReading = env.readings.reduce((latest, r) => Math.max(latest, r.ts), 0);
  const facts = [
    house.areaM2 != null ? `${formatNumber(house.areaM2)} ${g("m2")}` : null,
    `${formatNumber(house.zones.length)} ${g("zone")}`,
    house.cultivationMethod ? g(`cultivation_${house.cultivationMethod}` as GreenhouseTextKey) : null,
    house.structureType ? g(`structure_${house.structureType}` as GreenhouseTextKey) : null,
  ].filter(Boolean) as string[];

  const changeCrop = async () => {
    if (!changing) return;
    try {
      await cropCycleService.complete(workspaceId, currentProductKey(), changing.cycle.id);
      await refresh();
      setPlantIn(changing.assetId);
    } catch (error) {
      toast.error(apiErrorMessage(error, g("changeCrop")));
    } finally {
      setChanging(null);
    }
  };

  const removePlace = async () => {
    if (!deletingPlace) return;
    try {
      await assetsService.deleteAsset(workspaceId, currentProductKey(), deletingPlace.id);
      await refresh();
      toast.success(g("deleted"));
      if (deletingPlace.kind === "greenhouse") navigate(lp("/greenhouses"));
    } catch (error) {
      toast.error(apiErrorMessage(error, g(deletingPlace.kind === "zone" ? "deleteZone" : "deleteGreenhouse")));
    } finally {
      setDeletingPlace(null);
    }
  };

  const zoneActions = {
    onOpenCycle: setOpenCycle,
    onPlant: (assetId: string) => setPlantIn(assetId),
    onSettings: setZoneSettings,
    onChangeCrop: (cycle: CropCycle, assetId: string) => setChanging({ cycle, assetId }),
    onAddBed: (zone: GreenhouseZone) => setAddingTo({ id: zone.id, kind: "BED", nextNumber: zone.beds.length + 1 }),
    onAddDevice: (assetId: string) => navigate(lp(`/devices/new?assetId=${assetId}`)),
    onDelete: (zone: GreenhouseZone) => setDeletingPlace({ id: zone.id, name: zone.name, kind: "zone" }),
  };

  return (
    <UniformPage>
      <div className="space-y-4">
        <button type="button" onClick={() => navigate(lp("/greenhouses"))} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Back className="h-4 w-4" /> {g("greenhouses")}
        </button>

        {/* Header */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl border md:w-64">
              <GreenhouseCover cover={house.cover} structure={house.structureType} fruit={cycles.length ? fruitOf(cycles[0].crop.icon) : null} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold truncate">{house.name}</h1>
                <HealthBadge health={health} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {house.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {house.location}
                  </span>
                )}
                {facts.map((f) => <span key={f}>{f}</span>)}
              </div>
              <div className="text-xs text-muted-foreground">
                {g("lastReading")}: {lastReading ? formatDateTime(lastReading, language) : g("noReadingYet")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch lg:flex-row">
              <Button variant="outline" className="h-10 gap-2" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> {g("editDetails")}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" className="h-10 gap-2 w-full" disabled>
                        <Box className="h-4 w-4" /> {g("digitalTwin")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{g("comingSoon")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setAddingTo({ id: house.id, kind: "ZONE", nextNumber: house.zones.length + 1 })}
              >
                <Plus className="h-4 w-4" /> {g("addZone")}
              </Button>
            </div>
          </div>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {g(`tab${t[0].toUpperCase()}${t.slice(1)}` as GreenhouseTextKey)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardContent className="pt-5">
                  <SectionTitle icon={Sprout} title={g("layout")} />
                  <ZoneLayout house={house} devicesByPlace={ops?.devicesByPlace} readings={env.readings} alarmDevices={new Set(ops?.alarms.map((a) => a.deviceId))} outOfRange={new Set(findings.map((f) => f.zoneId))} {...zoneActions} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <SectionTitle icon={AlertTriangle} title={g("attention")} />
                  <Attention
                    known={devicesKnown && alarmsKnown && workOrdersKnown}
                    alarms={ops?.alarms ?? []}
                    offline={(ops?.devices ?? []).filter((d) => !d.active)}
                    workOrders={ops?.workOrders ?? []}
                    findings={findings}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-5">
                <SectionTitle icon={Thermometer} title={g("conditionsNow")} />
                <Conditions readings={env.readings} hasDevices={!!ops?.devices.length} loading={env.loading} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <SectionTitle icon={Leaf} title={g("cropsGrowing")} />
                {cycles.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{g("nothingGrowing")}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {cycles.map((c) => (
                      <CropCard key={c.id} cycle={c} onOpen={() => setOpenCycle(c)} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {house.zones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} devices={ops?.devicesByPlace.get(zone.id) ?? []} {...zoneActions} />
              ))}
              <button
                type="button"
                onClick={() => setAddingTo({ id: house.id, kind: "ZONE", nextNumber: house.zones.length + 1 })}
                className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="h-5 w-5" /> {g("addZone")}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <DevicesTab house={house} devices={ops?.devices ?? []} known={devicesKnown} onAdd={() => navigate(lp(`/devices/new?assetId=${house.id}`))} onOpen={(d) => navigate(lp(`/devices/${d.id}`))} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <GreenhouseDetailsForm greenhouse={house} />
              </CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <p className="text-sm text-muted-foreground max-w-xl">{g("deleteGreenhouseConfirm", { name: house.name })}</p>
                <Button variant="outline" className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/5" onClick={() => setDeletingPlace({ id: house.id, name: house.name, kind: "greenhouse" })}>
                  <Trash2 className="h-4 w-4" /> {g("deleteGreenhouse")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GreenhouseDetailsDialog greenhouse={editing ? house : null} onOpenChange={(o) => !o && setEditing(false)} />
      <AddPlaceDialog parent={addingTo} onOpenChange={(o) => !o && setAddingTo(null)} />
      <ZoneSettingsDialog zone={zoneSettings} onOpenChange={(o) => !o && setZoneSettings(null)} />
      <StartCycleDialog open={!!plantIn} onOpenChange={(o) => !o && setPlantIn(null)} greenhouses={houses} assetId={plantIn ?? undefined} />
      <CropCycleSheet cycle={openCycle} open={!!openCycle} onOpenChange={(o) => !o && setOpenCycle(null)} />
      <ConfirmDialog
        open={!!changing}
        title={g("changeCrop")}
        description={g("changeCropHint")}
        confirmLabel={g("changeCrop")}
        onConfirm={changeCrop}
        onOpenChange={(o) => !o && setChanging(null)}
      />
      <ConfirmDialog
        open={!!deletingPlace}
        title={deletingPlace?.kind === "zone" ? g("deleteZone") : g("deleteGreenhouse")}
        description={
          deletingPlace
            ? g(deletingPlace.kind === "zone" ? "deleteZoneConfirm" : "deleteGreenhouseConfirm", { name: deletingPlace.name })
            : ""
        }
        confirmLabel={deletingPlace?.kind === "zone" ? g("deleteZone") : g("deleteGreenhouse")}
        destructive
        onConfirm={removePlace}
        onOpenChange={(o) => !o && setDeletingPlace(null)}
      />
    </UniformPage>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Sprout; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-primary" /> {title}
    </h2>
  );
}

interface ZoneActions {
  onOpenCycle: (cycle: CropCycle) => void;
  onPlant: (assetId: string) => void;
  onSettings: (zone: GreenhouseZone) => void;
  onChangeCrop: (cycle: CropCycle, assetId: string) => void;
  onAddBed: (zone: GreenhouseZone) => void;
  onAddDevice: (assetId: string) => void;
  onDelete: (zone: GreenhouseZone) => void;
}

/** The zones drawn as beds of their crop, side by side, as the greenhouse is laid out. */
function ZoneLayout({
  house,
  devicesByPlace,
  readings,
  alarmDevices,
  outOfRange,
  onOpenCycle,
  onPlant,
}: { house: Greenhouse; devicesByPlace?: Map<string, DeviceResponse[]>; readings: Reading[]; alarmDevices: Set<string>; outOfRange: Set<string> } & ZoneActions) {
  const { g, named } = useGreenhouseText();
  const reading = useReadingText();
  if (!house.zones.length) return <p className="py-8 text-center text-sm text-muted-foreground">{g("noZonesYet")}</p>;
  return (
    <div className="rounded-xl border bg-gradient-to-b from-sky-50/60 to-transparent p-3 dark:from-sky-950/10">
      <div className="grid gap-3 sm:grid-cols-2">
        {house.zones.map((zone) => {
          const devices = devicesByPlace?.get(zone.id) ?? [];
          const ids = new Set(devices.map((d) => d.id));
          const summary = summarize(readings.filter((r) => ids.has(r.deviceId)));
          const temp = summary.TEMPERATURE && !summary.TEMPERATURE.stale ? reading(summary.TEMPERATURE, "°C") : null;
          const hum = summary.HUMIDITY && !summary.HUMIDITY.stale ? reading(summary.HUMIDITY, "%") : null;
          const alert = devices.some((d) => alarmDevices.has(d.id)) || outOfRange.has(zone.id);
          const cycle = zone.cycle;
          const fruit = cycle ? fruitOf(cycle.crop.icon) : null;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => (cycle ? onOpenCycle(cycle) : onPlant(zone.id))}
              className={cn(
                "relative overflow-hidden rounded-lg border bg-card text-start transition-all hover:shadow-md",
                alert ? "border-red-300 dark:border-red-900" : cycle ? "border-emerald-200 dark:border-emerald-900" : "border-dashed",
              )}
            >
              {/* The bed: soil with rows of the crop, or bare when empty. */}
              <div className="relative h-14 bg-[#E8C9A8] dark:bg-[#5c4330]">
                {cycle &&
                  [0, 1, 2].map((row) => (
                    <div key={row} className="absolute inset-x-2 flex justify-between" style={{ top: 6 + row * 15 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <span key={i} className="relative h-3 w-3 rounded-full bg-emerald-500/90">
                          {fruit && i % 3 === row % 3 && <span className="absolute -bottom-0.5 -end-0.5 h-1.5 w-1.5 rounded-full" style={{ background: fruit }} />}
                        </span>
                      ))}
                    </div>
                  ))}
                {!cycle && <span className="absolute inset-0 flex items-center justify-center text-xs text-[#7a5a3c]">{g("empty")}</span>}
                {alert && (
                  <span className="absolute top-1.5 end-1.5 inline-flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <Bell className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{zone.name}</div>
                  {cycle ? (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <CropIcon icon={cycle.crop.icon} className="h-4 w-4" />
                      <span className="truncate">{named(cycle.crop.names, cycle.crop.name)}</span>
                      <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {named(cycle.stage.names, cycle.stage.name)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-0.5 text-xs text-primary">{g("plantCrop")}</div>
                  )}
                </div>
                <div className="shrink-0 text-end text-[11px] text-muted-foreground tabular-nums" dir="ltr">
                  {temp && <div>{temp}</div>}
                  {hum && <div>{hum}</div>}
                  {!temp && !hum && devices.length === 0 && <div>{g("noSensors")}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZoneCard({ zone, devices, onOpenCycle, onPlant, onSettings, onChangeCrop, onAddBed, onAddDevice, onDelete }: { zone: GreenhouseZone; devices: DeviceResponse[] } & ZoneActions) {
  const { g, named, formatNumber, language } = useGreenhouseText();
  const cycle = zone.cycle;
  const online = devices.filter((d) => d.active).length;
  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{zone.name}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {zone.areaM2 != null && <span>{`${formatNumber(zone.areaM2)} ${g("m2")}`}</span>}
            {zone.cultivationMethod && <span>{g(`cultivation_${zone.cultivationMethod}` as GreenhouseTextKey)}</span>}
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {devices.length ? g("devicesOnline", { n: online, m: devices.length }) : g("noSensors")}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => onSettings(zone)}>
              <Settings2 className="h-4 w-4" /> {g("zoneSettings")}
            </DropdownMenuItem>
            {cycle && (
              <DropdownMenuItem className="gap-2" onClick={() => onChangeCrop(cycle, zone.id)}>
                <Repeat className="h-4 w-4" /> {g("changeCrop")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2" onClick={() => onAddBed(zone)}>
              <Plus className="h-4 w-4" /> {g("addBed")}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onAddDevice(zone.id)}>
              <Cpu className="h-4 w-4" /> {g("addDevice")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => onDelete(zone)}>
              <Trash2 className="h-4 w-4" /> {g("deleteZone")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 p-4">
        {cycle ? (
          <button type="button" onClick={() => onOpenCycle(cycle)} className="flex w-full items-center gap-3 text-start">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
              <CropIcon icon={cycle.crop.icon} className="h-9 w-9" />
            </span>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {named(cycle.crop.names, cycle.crop.name)}
                {cycle.variety && <span className="text-muted-foreground font-normal"> · {cycle.variety}</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {named(cycle.stage.names, cycle.stage.name)}
                </span>
                <span className="text-muted-foreground">{g("dayN", { n: daysSince(cycle.plantedOn) + 1 })}</span>
                <span className="text-muted-foreground">{formatDate(cycle.plantedOn, language)}</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <span className="text-xs text-muted-foreground">{g("nothingGrowing")}</span>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onPlant(zone.id)}>
              <Sprout className="h-4 w-4" /> {g("plantCrop")}
            </Button>
          </div>
        )}
      </div>

      {zone.beds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t px-4 py-3">
          {zone.beds.map((bed) => (
            <button
              key={bed.id}
              type="button"
              onClick={() => (bed.cycle ? onOpenCycle(bed.cycle) : onPlant(bed.id))}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
                bed.cycle ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-dashed text-muted-foreground hover:border-primary/50",
              )}
            >
              {bed.cycle ? <CropIcon icon={bed.cycle.crop.icon} className="h-3.5 w-3.5" /> : <Plus className="h-3 w-3" />}
              {bed.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CropCard({ cycle, onOpen }: { cycle: CropCycle; onOpen: () => void }) {
  const { g, named, language } = useGreenhouseText();
  const toHarvest = cycle.expectedHarvestOn ? daysUntil(cycle.expectedHarvestOn) : null;
  return (
    <button type="button" onClick={onOpen} className="flex items-start gap-3 rounded-xl border bg-card p-3 text-start transition-all hover:border-emerald-300 hover:shadow-sm">
      <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
        <CropIcon icon={cycle.crop.icon} className="h-9 w-9" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-medium truncate">
          {named(cycle.crop.names, cycle.crop.name)}
          {cycle.variety && <span className="text-muted-foreground font-normal"> · {cycle.variety}</span>}
        </div>
        <div className="text-xs text-muted-foreground truncate">{cycle.assetName}</div>
        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          {named(cycle.stage.names, cycle.stage.name)}
        </span>
        <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
          <span>{`${g("planted")}: ${formatDate(cycle.plantedOn, language)}`}</span>
          {cycle.expectedHarvestOn && (
            <span>
              {`${g("expectedHarvest")}: ${formatDate(cycle.expectedHarvestOn, language)}`}
              {toHarvest != null && toHarvest <= 0 && <span className="text-amber-600"> · {g("harvestDue")}</span>}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/** What the sensors report now: each measurement as the range they read, with how fresh it is. */
function Conditions({ readings, hasDevices, loading }: { readings: Reading[]; hasDevices: boolean; loading: boolean }) {
  const { g, language } = useGreenhouseText();
  const reading = useReadingText();
  const summary = summarize(readings);
  const shown = ENV.filter((e) => summary[e.metric]);
  if (!hasDevices) return <p className="py-4 text-sm text-muted-foreground">{g("noSensors")}</p>;
  if (loading && !readings.length) return <DataState loading size="sm" />;
  if (!shown.length) return <p className="py-4 text-sm text-muted-foreground">{g("noReadings")}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {shown.map(({ metric, icon: Icon, unit }) => {
        const s = summary[metric]!;
        return (
          <div key={metric} className={cn("rounded-lg border px-3 py-2.5", s.stale && "opacity-60")}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {g(`metric_${metric}` as GreenhouseTextKey)}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums" dir="ltr">{reading(s, unit)}</div>
            <div className="text-[11px] text-muted-foreground">
              {s.stale ? `${g("stale")} · ${formatDateTime(s.latest, language)}` : s.devices > 1 ? g("acrossSensors", { n: s.devices }) : formatDateTime(s.latest, language)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Attention({
  known,
  alarms,
  offline,
  workOrders,
  findings,
}: {
  known: boolean;
  findings: Finding[];
  alarms: { id: string; alarmName: string; deviceName?: string; createdAt: string }[];
  offline: DeviceResponse[];
  workOrders: { id: string; title: string }[];
}) {
  const { g, language } = useGreenhouseText();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const describe = useFindingText();
  const items = [
    ...findings.map((f) => ({
      key: `f${f.zoneId}${f.metric}`,
      icon: AlertTriangle,
      tone: "text-orange-500",
      text: describe(f),
      sub: g("createWorkOrder"),
      go: () =>
        navigate(
          lp(`/work-orders/new?${new URLSearchParams({ title: describe(f), assetId: f.zoneId, location: f.zoneName, priority: "High" }).toString()}`),
        ),
    })),
    ...alarms.map((a) => ({ key: `a${a.id}`, icon: Bell, tone: "text-red-500", text: a.alarmName, sub: a.deviceName, go: () => navigate(lp("/alarms")) })),
    ...offline.map((d) => ({ key: `d${d.id}`, icon: WifiOff, tone: "text-amber-500", text: g("deviceOffline", { name: d.name }), sub: undefined, go: () => navigate(lp(`/devices/${d.id}`)) })),
    ...workOrders.map((w) => ({ key: `w${w.id}`, icon: ClipboardList, tone: "text-sky-500", text: g("workOrderItem", { title: w.title }), sub: undefined, go: () => navigate(lp(`/work-orders/${w.id}`)) })),
  ];
  if (!known) return <DataState loading size="sm" />;
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <span className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
          <Sprout className="h-5 w-5 text-emerald-600" />
        </span>
        {g("nothingNeedsAttention")}
      </div>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.slice(0, 8).map((item) => (
        <li key={item.key}>
          <button type="button" onClick={item.go} className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-start hover:bg-muted/50">
            <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.tone)} />
            <span className="min-w-0">
              <span className="block text-sm truncate">{item.text}</span>
              {item.sub && <span className="block text-xs text-muted-foreground truncate">{item.sub}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function DevicesTab({
  house,
  devices,
  known,
  onAdd,
  onOpen,
}: {
  house: Greenhouse;
  devices: DeviceResponse[];
  known: boolean;
  onAdd: () => void;
  onOpen: (device: DeviceResponse) => void;
}) {
  const { g } = useGreenhouseText();
  const placeName = new Map<string, string>([[house.id, house.name]]);
  house.zones.forEach((z) => {
    placeName.set(z.id, z.name);
    z.beds.forEach((b) => placeName.set(b.id, `${z.name} › ${b.name}`));
  });
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-end">
          <Button onClick={onAdd} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" /> {g("addDevice")}
          </Button>
        </div>
        {!known ? (
          <DataState loading />
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Cpu className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{g("noSensors")}</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto text-sm [&_th]:text-xs [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{g("devices")}</TableHead>
                  <TableHead>{g("where")}</TableHead>
                  <TableHead>{g("statusLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onOpen(d)}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.type}</div>
                    </TableCell>
                    <TableCell>{placeName.get(d.assetId) ?? ""}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          d.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", d.active ? "bg-emerald-500" : "bg-slate-400")} />
                        {d.active ? g("online") : g("offline")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
