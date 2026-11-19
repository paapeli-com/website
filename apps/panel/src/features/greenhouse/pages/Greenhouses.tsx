import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, LayoutGrid, MapPin, MoreHorizontal, Pencil, Plus, Sprout, Warehouse } from "lucide-react";
import type { CropCycle, Greenhouse, GreenhouseZone } from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { DataState } from "@/features/factory/components/DataState";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { cn } from "@/shared/lib/utils";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { CropIcon } from "../components/CropIcon";
import { AddGreenhouseWizard } from "../components/AddGreenhouseWizard";
import { CropCycleSheet } from "../components/CropCycleSheet";
import { StartCycleDialog } from "../components/StartCycleDialog";
import { AddPlaceDialog, GreenhouseDetailsDialog } from "../components/GreenhouseDialogs";
import { daysSince, daysUntil, useGreenhouses } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

/**
 * Smart Greenhouse's home: every greenhouse as a card, its zones as tiles
 * showing what grows in each and how far along it is. A grower plants an
 * empty zone, opens a growing one, or adds a greenhouse from here.
 */
export default function Greenhouses() {
  const { g, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const greenhouses = useGreenhouses();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [plantIn, setPlantIn] = useState<string | null>(null);
  const [openCycle, setOpenCycle] = useState<CropCycle | null>(null);
  const [editing, setEditing] = useState<Greenhouse | null>(null);
  const [addingTo, setAddingTo] = useState<{ id: string; kind: "ZONE" | "BED"; nextNumber: number } | null>(null);

  const houses = greenhouses.data ?? [];
  const kpis = useMemo(() => {
    const zones = houses.flatMap((h) => h.zones);
    const places = zones.flatMap((z) => [z, ...z.beds]);
    const cycles = places.map((p) => p.cycle).filter(Boolean) as CropCycle[];
    return [
      { key: "houses", label: g("greenhouses"), value: houses.length, icon: Warehouse },
      { key: "zones", label: g("zones"), value: zones.length, icon: LayoutGrid },
      { key: "growing", label: g("growing"), value: cycles.length, icon: Sprout },
      { key: "devices", label: g("devices"), value: houses.reduce((n, h) => n + h.devices, 0), icon: Cpu },
    ];
  }, [houses, g]);

  return (
    <UniformPage>
      <div className="space-y-4">
        <PageHeader
          title={g("greenhouses")}
          count={greenhouses.data ? houses.length : null}
          countLabel={g("greenhousesCount")}
          actions={
            <>
              <Button variant="outline" className="h-10 gap-2 rounded-md" onClick={() => navigate(localizedPath("/locations", language))}>
                <LayoutGrid className="h-4 w-4" /> {g("layout")}
              </Button>
              <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
                <Plus className="h-4 w-4" /> {g("addGreenhouse")}
              </Button>
            </>
          }
        />

        {greenhouses.isLoading ? (
          <DataState loading size="lg" />
        ) : greenhouses.isError ? (
          <LoadFailed onRetry={() => void greenhouses.refetch()} />
        ) : houses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
                <Warehouse className="h-8 w-8 text-emerald-600" />
              </span>
              <div>
                <p className="font-medium">{g("noGreenhousesTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{g("noGreenhousesDesc")}</p>
              </div>
              <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> {g("addGreenhouse")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <KpiSection storageKey="greenhouses">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((k) => (
                  <div key={k.key} className="rounded-lg border bg-card px-3 py-2.5 bg-gradient-to-br from-emerald-50/70 to-transparent dark:from-emerald-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                      <k.icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    </div>
                    <div className="mt-1 text-xl font-bold leading-none">{formatNumber(k.value)}</div>
                  </div>
                ))}
              </div>
            </KpiSection>

            <div className="space-y-4">
              {houses.map((house) => (
                <GreenhouseCard
                  key={house.id}
                  house={house}
                  onPlant={setPlantIn}
                  onOpenCycle={setOpenCycle}
                  onEdit={() => setEditing(house)}
                  onAddZone={() => setAddingTo({ id: house.id, kind: "ZONE", nextNumber: house.zones.length + 1 })}
                  onAddBed={(zone) => setAddingTo({ id: zone.id, kind: "BED", nextNumber: zone.beds.length + 1 })}
                  onLayout={() => navigate(localizedPath("/locations", language))}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AddGreenhouseWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <StartCycleDialog
        open={!!plantIn}
        onOpenChange={(open) => !open && setPlantIn(null)}
        greenhouses={houses}
        assetId={plantIn ?? undefined}
      />
      <CropCycleSheet cycle={openCycle} open={!!openCycle} onOpenChange={(open) => !open && setOpenCycle(null)} />
      <GreenhouseDetailsDialog greenhouse={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <AddPlaceDialog parent={addingTo} onOpenChange={(open) => !open && setAddingTo(null)} />
    </UniformPage>
  );
}

function GreenhouseCard({
  house,
  onPlant,
  onOpenCycle,
  onEdit,
  onAddZone,
  onAddBed,
  onLayout,
}: {
  house: Greenhouse;
  onPlant: (assetId: string) => void;
  onOpenCycle: (cycle: CropCycle) => void;
  onEdit: () => void;
  onAddZone: () => void;
  onAddBed: (zone: GreenhouseZone) => void;
  onLayout: () => void;
}) {
  const { g, formatNumber } = useGreenhouseText();
  const facts = [
    house.areaM2 != null ? `${formatNumber(house.areaM2)} ${g("m2")}` : null,
    house.structureType ? g(`structure_${house.structureType}` as GreenhouseTextKey) : null,
    house.cultivationMethod ? g(`cultivation_${house.cultivationMethod}` as GreenhouseTextKey) : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-950/25 px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center shadow-sm">
            <Warehouse className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">{house.name}</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {house.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {house.location}
                </span>
              )}
              {facts.map((f) => <span key={f}>{f}</span>)}
              <span className="inline-flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                {`${formatNumber(house.devices)} ${g("devices")}`}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" /> {g("editDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddZone} className="gap-2">
              <Plus className="h-4 w-4" /> {g("addZone")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLayout} className="gap-2">
              <LayoutGrid className="h-4 w-4" /> {g("layout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {house.zones.map((zone) => (
            <ZoneTile key={zone.id} zone={zone} onPlant={onPlant} onOpenCycle={onOpenCycle} onAddBed={() => onAddBed(zone)} />
          ))}
          <button
            type="button"
            onClick={onAddZone}
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-emerald-400 hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
            {g("addZone")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneTile({
  zone,
  onPlant,
  onOpenCycle,
  onAddBed,
}: {
  zone: GreenhouseZone;
  onPlant: (assetId: string) => void;
  onOpenCycle: (cycle: CropCycle) => void;
  onAddBed: () => void;
}) {
  const { g, named, formatNumber } = useGreenhouseText();
  const cycle = zone.cycle;

  return (
    <div
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border bg-card p-3 transition-all",
        cycle ? "border-emerald-200 dark:border-emerald-900 hover:shadow-md cursor-pointer" : "border-dashed",
      )}
      onClick={() => cycle && onOpenCycle(cycle)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold truncate">{zone.name}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" title={g("devices")}>
          <Cpu className="h-3 w-3" />
          {formatNumber(zone.devices)}
        </span>
      </div>

      {cycle ? (
        <CycleSummary cycle={cycle} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
          <span className="text-xs text-muted-foreground">{g("empty")}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            onClick={(e) => {
              e.stopPropagation();
              onPlant(zone.id);
            }}
          >
            <Sprout className="h-4 w-4" /> {g("plant")}
          </Button>
        </div>
      )}

      {(zone.beds.length > 0 || cycle) && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2" onClick={(e) => e.stopPropagation()}>
          {zone.beds.map((bed) => (
            <button
              key={bed.id}
              type="button"
              onClick={() => (bed.cycle ? onOpenCycle(bed.cycle) : onPlant(bed.id))}
              title={bed.cycle ? named(bed.cycle.crop.names, bed.cycle.crop.name) : `${bed.name}: ${g("plant")}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors",
                bed.cycle ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : "border-dashed text-muted-foreground hover:border-emerald-400",
              )}
            >
              {bed.cycle ? <CropIcon icon={bed.cycle.crop.icon} className="h-3.5 w-3.5" /> : <Plus className="h-3 w-3" />}
              {bed.name}
            </button>
          ))}
          <button
            type="button"
            onClick={onAddBed}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
          >
            <Plus className="h-3 w-3" /> {g("addBed")}
          </button>
        </div>
      )}
    </div>
  );
}

/** What grows in a place, its stage, and how far the cycle has come. */
function CycleSummary({ cycle }: { cycle: CropCycle }) {
  const { g, named } = useGreenhouseText();
  const age = daysSince(cycle.plantedOn);
  const toHarvest = cycle.expectedHarvestOn ? daysUntil(cycle.expectedHarvestOn) : null;
  const span = cycle.expectedHarvestOn ? age + Math.max(toHarvest ?? 0, 0) : null;
  const progress = span ? Math.min(100, Math.round((age / span) * 100)) : null;

  return (
    <div className="mt-2 flex flex-1 flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span className="h-11 w-11 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
          <CropIcon icon={cycle.crop.icon} className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {named(cycle.crop.names, cycle.crop.name)}
            {cycle.variety && <span className="text-muted-foreground font-normal"> · {cycle.variety}</span>}
          </div>
          <span className="mt-0.5 inline-block rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
            {named(cycle.stage.names, cycle.stage.name)}
          </span>
        </div>
      </div>
      <div className="mt-auto space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{g("dayN", { n: age + 1 })}</span>
          {toHarvest != null && <span>{toHarvest > 0 ? g("daysToHarvest", { n: toHarvest }) : g("harvestDue")}</span>}
        </div>
        {progress != null && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
