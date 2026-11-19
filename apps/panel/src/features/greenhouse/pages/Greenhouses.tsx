import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Cpu, Plus, Sprout, Warehouse } from "lucide-react";
import { assetsService, type Greenhouse } from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { ListToolbar, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { DataState } from "@/features/factory/components/DataState";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { AddGreenhouseWizard } from "../components/AddGreenhouseWizard";
import { GreenhouseDetailsDialog, ConfirmDialog } from "../components/GreenhouseDialogs";
import { GreenhouseCover } from "../components/GreenhouseCover";
import { CropChips, GreenhouseCard, HealthBadge, cyclesOf, healthOf } from "../components/GreenhouseCard";
import { useGreenhouses, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseOps } from "../operations";
import { useGreenhouseText } from "../i18n";

const VIEW_KEY = "paapeli.greenhouses.view";

/**
 * Smart Greenhouse's greenhouses, as a grower picks one: a card each, with
 * its picture, what grows in it and how it is doing. Zones, crops and devices
 * are managed inside a greenhouse (GreenhouseDetail); the location tree they
 * are kept in stays behind the scenes.
 */
export default function Greenhouses() {
  const { g, named, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const greenhouses = useGreenhouses();
  const houses = greenhouses.data ?? [];
  const { byHouse, devicesKnown, alarmsKnown } = useGreenhouseOps(houses);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Greenhouse | null>(null);
  const [deleting, setDeleting] = useState<Greenhouse | null>(null);
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "grid";
    } catch {
      return "grid";
    }
  });
  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* the view is a convenience; without storage it resets */
    }
  };

  const lp = (path: string) => localizedPath(path, language);
  const open = (house: Greenhouse, tab?: string) => navigate(lp(`/greenhouses/${house.id}${tab ? `?tab=${tab}` : ""}`));

  const crops = useMemo(() => {
    const all = new Map<string, string>();
    houses.forEach((h) => cyclesOf(h).forEach((c) => all.set(c.crop.id, named(c.crop.names, c.crop.name))));
    return [...all.entries()];
  }, [houses, named]);

  const known = devicesKnown && alarmsKnown;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = houses.filter((h) => {
      if (q && !`${h.name} ${h.location ?? ""}`.toLowerCase().includes(q)) return false;
      if (crop !== "all" && !cyclesOf(h).some((c) => c.crop.id === crop)) return false;
      if (status !== "all" && healthOf(byHouse.get(h.id), known) !== status) return false;
      return true;
    });
    const alerts = (h: Greenhouse) => byHouse.get(h.id)?.alarms.length ?? 0;
    const devices = (h: Greenhouse) => byHouse.get(h.id)?.devices.length ?? h.devices;
    return [...list].sort((a, b) =>
      sort === "alerts" ? alerts(b) - alerts(a) : sort === "devices" ? devices(b) - devices(a) : a.name.localeCompare(b.name, language),
    );
  }, [houses, search, crop, status, sort, byHouse, known, language]);

  const totals = useMemo(() => {
    let zones = 0;
    let online = 0;
    let devices = 0;
    let alerts = 0;
    houses.forEach((h) => {
      zones += h.zones.filter((z) => z.cycle || z.beds.some((b) => b.cycle)).length;
      const ops = byHouse.get(h.id);
      online += ops?.online ?? 0;
      devices += ops?.devices.length ?? 0;
      alerts += ops?.alarms.length ?? 0;
    });
    return { zones, online, devices, alerts };
  }, [houses, byHouse]);

  const kpis = [
    { key: "houses", label: g("greenhouses"), value: formatNumber(houses.length), icon: Warehouse, tone: "from-orange-50 dark:from-orange-950/20", accent: "text-primary" },
    { key: "zones", label: g("kpiZones"), value: formatNumber(totals.zones), icon: Sprout, tone: "from-emerald-50 dark:from-emerald-950/20", accent: "text-emerald-600" },
    {
      key: "online",
      label: g("kpiOnline"),
      value: devicesKnown ? `${formatNumber(totals.online)} / ${formatNumber(totals.devices)}` : "…",
      icon: Cpu,
      tone: "from-sky-50 dark:from-sky-950/20",
      accent: "text-sky-600",
    },
    { key: "alerts", label: g("kpiAlerts"), value: alarmsKnown ? formatNumber(totals.alerts) : "…", icon: Bell, tone: "from-red-50 dark:from-red-950/20", accent: "text-red-500" },
  ];

  const statuses = ["attention", "offline", "nosensors", "ok"] as const;
  const filterFields = [
    {
      key: "crop",
      label: g("crop"),
      value: crop,
      onChange: setCrop,
      options: [{ value: "all", label: g("allCrops") }, ...crops.map(([value, label]) => ({ value, label }))],
    },
    {
      key: "status",
      label: g("statusLabel"),
      value: status,
      onChange: setStatus,
      options: [{ value: "all", label: g("allStatuses") }, ...statuses.map((s) => ({ value: s, label: g(`health_${s}`) }))],
    },
  ];

  const remove = async () => {
    if (!deleting) return;
    try {
      await assetsService.deleteAsset(workspaceId, currentProductKey(), deleting.id);
      await refresh();
      toast.success(g("deleted"));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("deleteGreenhouse")));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <UniformPage>
      <div className="space-y-4">
        <div>
          <PageHeader
            title={g("greenhouses")}
            count={greenhouses.data ? houses.length : null}
            countLabel={g("greenhousesCount")}
            actions={
              <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
                <Plus className="h-4 w-4" /> {g("addGreenhouse")}
              </Button>
            }
          />
          <p className="-mt-2 mb-2 text-sm text-muted-foreground">{g("greenhousesSubtitle")}</p>
        </div>

        {greenhouses.isLoading ? (
          <DataState loading size="lg" />
        ) : greenhouses.isError ? (
          <LoadFailed onRetry={() => void greenhouses.refetch()} />
        ) : houses.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-10">
              <div className="overflow-hidden rounded-2xl border aspect-[16/9]">
                <GreenhouseCover cover="tunnel" fruit="#E5484D" />
              </div>
              <div className="space-y-4 text-start">
                <h2 className="text-xl font-bold">{g("onboardTitle")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{g("onboardDesc")}</p>
                <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2">
                  <Plus className="h-4 w-4" /> {g("createGreenhouse")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <KpiSection storageKey="greenhouses">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((k) => (
                  <div key={k.key} className={`rounded-lg border bg-card px-3 py-2.5 bg-gradient-to-br ${k.tone} to-transparent`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                      <k.icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
                    </div>
                    <div className="mt-1 text-xl font-bold leading-none tabular-nums">{k.value}</div>
                  </div>
                ))}
              </div>
            </KpiSection>

            <Card>
              <CardContent className="pt-6">
                <ListToolbar
                  search={{ value: search, onChange: setSearch, placeholder: g("searchGreenhouses") }}
                  view={{ value: view, onChange: changeView, available: ["grid", "table"] }}
                  onRefresh={() => void refresh()}
                  isRefreshing={greenhouses.isFetching}
                  filter={{
                    fields: filterFields,
                    activeCount: (crop !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0),
                    onClear: () => {
                      setCrop("all");
                      setStatus("all");
                    },
                  }}
                  sort={{
                    options: [
                      { key: "name", label: g("sortName") },
                      { key: "alerts", label: g("sortAlerts") },
                      { key: "devices", label: g("sortDevices") },
                    ],
                    value: sort,
                    onChange: setSort,
                  }}
                />

                {rows.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">{g("noGreenhousesMatch")}</p>
                ) : view === "table" ? (
                  <div className="rounded-lg border overflow-x-auto text-sm [&_th]:text-xs [&_th]:h-10 [&_td]:p-3">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>{g("greenhouseCol")}</TableHead>
                          <TableHead>{g("crops")}</TableHead>
                          <TableHead>{g("zones")}</TableHead>
                          <TableHead>{g("devices")}</TableHead>
                          <TableHead>{g("kpiAlerts")}</TableHead>
                          <TableHead>{g("statusLabel")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((h) => {
                          const ops = byHouse.get(h.id);
                          return (
                            <TableRow key={h.id} className="cursor-pointer hover:bg-muted/30" onClick={() => open(h)}>
                              <TableCell>
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="h-10 w-16 shrink-0 overflow-hidden rounded-md border">
                                    <GreenhouseCover cover={h.cover} structure={h.structureType} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{h.name}</div>
                                    {h.location && <div className="text-xs text-muted-foreground truncate">{h.location}</div>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><CropChips cycles={cyclesOf(h)} /></TableCell>
                              <TableCell className="tabular-nums">{formatNumber(h.zones.length)}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {!devicesKnown ? g("unknown") : ops?.devices.length ? g("devicesOnline", { n: ops.online, m: ops.devices.length }) : g("noSensors")}
                              </TableCell>
                              <TableCell className="tabular-nums">{alarmsKnown ? formatNumber(ops?.alarms.length ?? 0) : g("unknown")}</TableCell>
                              <TableCell><HealthBadge health={healthOf(ops, known)} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {rows.map((h) => (
                      <GreenhouseCard
                        key={h.id}
                        house={h}
                        ops={byHouse.get(h.id)}
                        known={known}
                        onOpen={() => open(h)}
                        onEdit={() => setEditing(h)}
                        onManageZones={() => open(h, "zones")}
                        onAssignDevices={() => navigate(lp(`/devices/new?assetId=${h.id}`))}
                        onDelete={() => setDeleting(h)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AddGreenhouseWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(id) => navigate(lp(`/greenhouses/${id}`))} />
      <GreenhouseDetailsDialog greenhouse={editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        title={g("deleteGreenhouse")}
        description={deleting ? g("deleteGreenhouseConfirm", { name: deleting.name }) : ""}
        confirmLabel={g("deleteGreenhouse")}
        destructive
        onConfirm={remove}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </UniformPage>
  );
}
