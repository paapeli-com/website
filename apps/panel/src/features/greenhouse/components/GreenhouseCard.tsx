import { Bell, Box, Cpu, Droplets, LayoutGrid, MapPin, MoreHorizontal, Pencil, Plus, Thermometer, Trash2 } from "lucide-react";
import type { CropCycle, Greenhouse } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "./CropIcon";
import { GreenhouseCover, fruitOf } from "./GreenhouseCover";
import { summarize, useEnvironment, type GreenhouseOps, type MetricSummary } from "../operations";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

export type Health = "attention" | "offline" | "nosensors" | "ok" | "unknown";

/** How a greenhouse is doing, from what the platform knows about it. */
export function healthOf(ops: GreenhouseOps | undefined, known: boolean): Health {
  if (!ops || !known) return "unknown";
  if (ops.alarms.length > 0) return "attention";
  if (ops.devices.length === 0) return "nosensors";
  if (ops.online === 0) return "offline";
  return "ok";
}

const HEALTH_TONE: Record<Health, string> = {
  attention: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  offline: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  nosensors: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  unknown: "bg-muted text-muted-foreground border-border",
};

export function HealthBadge({ health, className }: { health: Health; className?: string }) {
  const { g } = useGreenhouseText();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", HEALTH_TONE[health], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", health === "ok" ? "bg-emerald-500" : health === "attention" ? "bg-red-500" : health === "offline" ? "bg-amber-500" : "bg-slate-400")} />
      {health === "unknown" ? g("unknown") : g(`health_${health}` as GreenhouseTextKey)}
    </span>
  );
}

/** Every cycle growing in a greenhouse, in its zones and their beds. */
export function cyclesOf(house: Greenhouse): CropCycle[] {
  return house.zones.flatMap((z) => [z.cycle, ...z.beds.map((b) => b.cycle)]).filter(Boolean) as CropCycle[];
}

/** The crops a greenhouse grows, once each, with the stage of the first place growing it. */
export function CropChips({ cycles, max = 2 }: { cycles: CropCycle[]; max?: number }) {
  const { g, named } = useGreenhouseText();
  const unique = [...new Map(cycles.map((c) => [c.crop.id, c])).values()];
  if (!unique.length) return <span className="text-xs text-muted-foreground">{g("nothingGrowing")}</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {unique.slice(0, max).map((c) => (
        <span key={c.crop.id} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs">
          <CropIcon icon={c.crop.icon} className="h-4 w-4" />
          <span className="font-medium">{named(c.crop.names, c.crop.name)}</span>
          <span className="text-muted-foreground">· {named(c.stage.names, c.stage.name)}</span>
        </span>
      ))}
      {unique.length > max && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{g("moreCrops", { n: unique.length - max })}</span>}
    </div>
  );
}

/** A reading as a range across sensors; never an average that no sensor read. */
export function useReadingText() {
  const { formatNumber } = useGreenhouseText();
  return (s: MetricSummary | undefined, unit: string) => {
    if (!s) return null;
    const r = (v: number) => formatNumber(Math.round(v * 10) / 10);
    return s.min === s.max ? `${r(s.min)}${unit}` : `${r(s.min)}–${r(s.max)}${unit}`;
  };
}

function Stat({ icon: Icon, label, value, muted }: { icon: typeof Thermometer; label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("text-sm font-semibold tabular-nums truncate", muted && "text-muted-foreground font-normal text-xs")} dir="ltr">
        {value}
      </div>
    </div>
  );
}

export function GreenhouseCard({
  house,
  ops,
  known,
  onOpen,
  onEdit,
  onManageZones,
  onAssignDevices,
  onDelete,
}: {
  house: Greenhouse;
  ops?: GreenhouseOps;
  known: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onManageZones: () => void;
  onAssignDevices: () => void;
  onDelete: () => void;
}) {
  const { g, formatNumber } = useGreenhouseText();
  const cycles = cyclesOf(house);
  const health = healthOf(ops, known);
  const env = useEnvironment(ops?.devices ?? [], !!ops?.devices.length);
  const summary = summarize(env.readings);
  const reading = useReadingText();
  const temp = reading(summary.TEMPERATURE?.stale ? undefined : summary.TEMPERATURE, "°C");
  const hum = reading(summary.HUMIDITY?.stale ? undefined : summary.HUMIDITY, "%");
  const facts = [
    house.areaM2 != null ? `${formatNumber(house.areaM2)} ${g("m2")}` : null,
    `${formatNumber(house.zones.length)} ${g("zone")}`,
    house.cultivationMethod ? g(`cultivation_${house.cultivationMethod}` as GreenhouseTextKey) : null,
  ].filter(Boolean) as string[];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-md">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/8] overflow-hidden bg-muted text-start">
        <GreenhouseCover
          cover={house.cover}
          structure={house.structureType}
          fruit={cycles.length ? fruitOf(cycles[0].crop.icon) : null}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <HealthBadge health={health} className="absolute top-2.5 start-2.5 shadow-sm" />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <button type="button" onClick={onOpen} className="block max-w-full truncate text-start text-base font-semibold hover:text-primary">
            {house.name}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {house.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {house.location}
              </span>
            )}
            {facts.map((f, i) => (
              <span key={i}>{(house.location || i > 0) && <span className="me-2 opacity-50">·</span>}{f}</span>
            ))}
          </div>
        </div>

        <CropChips cycles={cycles} />

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <Stat icon={Thermometer} label={g("metric_TEMPERATURE")} value={temp ?? (ops?.devices.length ? g("noReadings") : "-")} muted={!temp} />
          <Stat icon={Droplets} label={g("metric_HUMIDITY")} value={hum ?? (ops?.devices.length ? g("noReadings") : "-")} muted={!hum} />
          {ops && ops.alarms.length > 0 ? (
            <Stat icon={Bell} label={g("kpiAlerts")} value={formatNumber(ops.alarms.length)} />
          ) : (
            <Stat
              icon={Cpu}
              label={g("devices")}
              value={!known ? g("unknown") : ops?.devices.length ? g("devicesOnline", { n: ops.online, m: ops.devices.length }) : g("noSensors")}
              muted={!ops?.devices.length}
            />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <Button variant="ghost" size="sm" className="h-8 px-2 font-semibold text-primary hover:text-primary" onClick={onOpen}>
            {g("viewGreenhouse")}
          </Button>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground" disabled>
                      <Box className="h-3.5 w-3.5" /> {g("digitalTwin")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{g("comingSoon")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-4 w-4" /> {g("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onManageZones} className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> {g("manageZones")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAssignDevices} className="gap-2">
                  <Plus className="h-4 w-4" /> {g("assignDevices")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> {g("deleteGreenhouse")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
