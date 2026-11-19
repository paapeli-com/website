import { useEffect, useState } from "react";
import { Check, Droplets, Layers, Loader2, Minus, Mountain, Plus, Sparkles, X } from "lucide-react";
import {
  assetsService,
  cropCycleService,
  greenhouseService,
  type CropProfile,
  type CultivationMethod,
  type GreenhouseStructure,
} from "@paapeli/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "./CropIcon";
import { CoverPicker, GreenhouseCover, coverOf, fruitOf, type CoverKey } from "./GreenhouseCover";
import { useCoverLabels } from "./GreenhouseDialogs";
import { CropPicker, choiceKey, profileFor, type CropChoice } from "./CropPicker";
import { DayPicker } from "./DayPicker";
import { stagesOf } from "./StartCycleDialog";
import { todayIso, useCropLibrary, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

export const STRUCTURES: GreenhouseStructure[] = ["GLASS", "POLY_FILM", "POLYCARBONATE", "NET_HOUSE", "TUNNEL", "OTHER"];
export const CULTIVATIONS: { key: CultivationMethod; icon: typeof Mountain }[] = [
  { key: "SOIL", icon: Mountain },
  { key: "HYDROPONIC", icon: Droplets },
  { key: "SUBSTRATE", icon: Layers },
  { key: "OTHER", icon: Sparkles },
];

/** Time zones a greenhouse here is likely to be in, the reader's own first. */
export function timeZoneOptions(): string[] {
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [...new Set([own, "Asia/Tehran", "Asia/Dubai", "Asia/Riyadh", "Asia/Baghdad", "Asia/Kabul", "Europe/Istanbul", "UTC"])].filter(Boolean);
}

const STEPS: GreenhouseTextKey[] = ["stepBasics", "stepSetup", "stepCrops", "stepReview"];
const REVIEW = STEPS.length - 1;
const MAX_ZONES = 12;
const MAX_BEDS = 20;

interface ZonePlan {
  name: string;
  choice: CropChoice | null;
  stageId: string;
  plantedOn: string;
}

type Progress = { label: string; state: "waiting" | "working" | "done" | "failed" }[];

/** The root of the product's location tree, made on the first greenhouse. */
async function ensureRoot(workspaceId: string): Promise<string> {
  try {
    return (await assetsService.getRoot(workspaceId, currentProductKey())).id;
  } catch (error) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    if (code !== "ASSET_TREE_NOT_FOUND") throw error;
    return (await assetsService.provisionRoot(workspaceId, currentProductKey())).id;
  }
}

/**
 * A greenhouse in five short steps: what it is, how it grows, its zones, what
 * each zone grows, and a last look. Every step after the first can be skipped;
 * what is skipped is added later from the greenhouse's card.
 */
export function AddGreenhouseWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new greenhouse's id once it is made. */
  onCreated?: (greenhouseId: string) => void;
}) {
  const coverLabels = useCoverLabels();
  const [cover, setCover] = useState<CoverKey | null>(null);
  const { g, named, formatNumber } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles();
  const library = useCropLibrary();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [timeZone, setTimeZone] = useState(timeZoneOptions()[0]);
  const [structure, setStructure] = useState<GreenhouseStructure | null>(null);
  const [cultivation, setCultivation] = useState<CultivationMethod | null>(null);
  const [zoneCount, setZoneCount] = useState(4);
  const [bedsPerZone, setBedsPerZone] = useState(0);
  const [zones, setZones] = useState<ZonePlan[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setName("");
    setLocation("");
    setArea("");
    setTimeZone(timeZoneOptions()[0]);
    setStructure(null);
    setCover(null);
    setCultivation(null);
    setZoneCount(4);
    setBedsPerZone(0);
    setZones([]);
    setProgress(null);
  }, [open]);

  // Zone names follow the count until the grower types their own.
  useEffect(() => {
    setZones((current) =>
      Array.from({ length: zoneCount }, (_, i) =>
        current[i] ?? { name: g("zoneDefaultName", { n: i + 1 }), choice: null, stageId: "", plantedOn: todayIso() },
      ),
    );
  }, [zoneCount, open, g]);

  const updateZone = (index: number, patch: Partial<ZonePlan>) =>
    setZones((current) => current.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)));

  const pickCrop = (index: number, choice: CropChoice | null) =>
    updateZone(index, { choice, stageId: stagesOf(choice)[0]?.id ?? "" });

  const planted = zones.filter((z) => z.choice);
  /* The review's picture shows the first crop chosen. */
  const firstChoice = planted[0]?.choice;
  const reviewIcon =
    !firstChoice || firstChoice.kind === "custom" ? null : firstChoice.kind === "profile" ? firstChoice.profile.icon : firstChoice.template.icon;
  const busy = progress?.some((p) => p.state === "working") ?? false;
  const finished = progress?.every((p) => p.state === "done") ?? false;
  const canNext = step !== 0 || !!name.trim();

  const create = async () => {
    const plan: Progress = [
      { label: name.trim(), state: "waiting" },
      ...(zones.length ? [{ label: g("zones"), state: "waiting" as const }] : []),
      ...(planted.length ? [{ label: g("crops"), state: "waiting" as const }] : []),
    ];
    setProgress(plan);
    const mark = (index: number, state: Progress[number]["state"]) =>
      setProgress((p) => p && p.map((item, i) => (i === index ? { ...item, state } : item)));
    let at = 0;
    try {
      mark(0, "working");
      const pk = currentProductKey();
      const rootId = await ensureRoot(workspaceId);
      const house = await assetsService.createChild(workspaceId, pk, rootId, {
        name: name.trim(),
        type: "GREENHOUSE",
        label: name.trim(),
      });
      if (location.trim() || area || structure || cultivation || timeZone || cover) {
        await greenhouseService.saveDetail(workspaceId, pk, house.id, {
          location: location.trim() || null,
          areaM2: area ? Number(area) : null,
          timeZone: timeZone || null,
          structureType: structure,
          cultivationMethod: cultivation,
          cover: coverOf(cover, structure),
        });
      }
      mark(0, "done");

      const zoneIds: string[] = [];
      if (zones.length) {
        at = 1;
        mark(1, "working");
        for (const zone of zones) {
          const label = zone.name.trim() || g("zoneDefaultName", { n: zoneIds.length + 1 });
          const created = await assetsService.createChild(workspaceId, pk, house.id, { name: label, type: "ZONE", label });
          zoneIds.push(created.id);
          for (let b = 0; b < bedsPerZone; b++) {
            const bedName = g("bedDefaultName", { n: b + 1 });
            await assetsService.createChild(workspaceId, pk, created.id, { name: bedName, type: "BED", label: bedName });
          }
        }
        mark(1, "done");
      }

      if (planted.length) {
        at = zones.length ? 2 : 1;
        mark(at, "working");
        // A library crop chosen for several zones is added to the grower's crops once.
        const made = new Map<string, CropProfile>();
        for (let i = 0; i < zones.length; i++) {
          const zone = zones[i];
          if (!zone.choice || zone.choice.kind === "custom") continue;
          const k = choiceKey(zone.choice);
          const profile = made.get(k) ?? (await profileFor(workspaceId, zone.choice));
          made.set(k, profile);
          await cropCycleService.start(workspaceId, pk, {
            cropProfileId: profile.id,
            assetId: zoneIds[i],
            plantedOn: zone.plantedOn,
            stageId: zone.stageId || null,
          });
        }
        mark(at, "done");
      }
      await refresh();
      toast.success(g("createdToast", { name: name.trim() }));
      onOpenChange(false);
      onCreated?.(house.id);
    } catch (error) {
      mark(at, "failed");
      await refresh();
      toast.error(`${g("createFailed", { step: plan[at]?.label ?? "" })} ${apiErrorMessage(error, "")}`.trim());
    }
  };

  const stepper = (
    <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {STEPS.map((key, index) => (
        <li key={key} className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={busy || index > step || (index > 0 && !name.trim())}
            onClick={() => setStep(index)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
              index === step ? "bg-primary text-primary-foreground" : index < step ? "bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            <span className="h-4 w-4 rounded-full border border-current inline-flex items-center justify-center text-[10px] tabular-nums">
              {index < step ? <Check className="h-3 w-3" /> : formatNumber(index + 1)}
            </span>
            {g(key)}
          </button>
          {index < STEPS.length - 1 && <span className="h-px w-3 bg-border" />}
        </li>
      ))}
    </ol>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("wizardTitle")}</DialogTitle>
        </DialogHeader>
        {stepper}

        <div className="min-h-[300px] py-2">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel required className="mb-0">{g("greenhouseName")}</FieldLabel>
                <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={g("greenhouseNamePh")} maxLength={255} />
              </div>
              <div className="space-y-2">
                <FieldLabel optional className="mb-0">{g("locationLabel")}</FieldLabel>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={g("locationPh")} maxLength={255} />
              </div>
              <div className="space-y-2">
                <FieldLabel optional className="mb-0">{`${g("area")} (${g("m2")})`}</FieldLabel>
                <Input type="number" min="1" dir="ltr" value={area} onChange={(e) => setArea(e.target.value)} placeholder="2400" />
              </div>
              <div className="space-y-2">
                <FieldLabel optional className="mb-0">{g("timeZone")}</FieldLabel>
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger dir="ltr">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeZoneOptions().map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel optional className="mb-0">{g("structure")}</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {STRUCTURES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStructure(structure === s ? null : s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        structure === s ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40",
                      )}
                    >
                      {g(`structure_${s}` as GreenhouseTextKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel className="mb-0">{g("picture")}</FieldLabel>
                <CoverPicker value={coverOf(cover, structure)} onChange={setCover} labels={coverLabels} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {CULTIVATIONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCultivation(cultivation === key ? null : key)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border bg-card p-4 text-start transition-all hover:border-primary/40",
                    cultivation === key && "border-primary ring-2 ring-primary/20 bg-primary/5",
                  )}
                >
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-medium">{g(`cultivation_${key}` as GreenhouseTextKey)}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{g(`cultivationDesc_${key}` as GreenhouseTextKey)}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-5 border-t pt-5">
              <p className="text-sm text-muted-foreground">{g("zoneHint")}</p>
              <div className="flex flex-wrap gap-8">
                <Counter label={g("zoneCount")} value={zoneCount} min={1} max={MAX_ZONES} onChange={setZoneCount} />
                <Counter label={g("bedsPerZone")} hint={g("bedsHint")} value={bedsPerZone} min={0} max={MAX_BEDS} onChange={setBedsPerZone} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone, index) => (
                  <Input
                    key={index}
                    value={zone.name}
                    onChange={(e) => updateZone(index, { name: e.target.value })}
                    aria-label={g("zoneName")}
                    maxLength={255}
                  />
                ))}
              </div>
            </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">{g("targetsDisclaimer")}</p>
              {zones.map((zone, index) => {
                const stages = stagesOf(zone.choice);
                return (
                  <div key={index} className="rounded-xl border p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{g("chooseCropFor", { zone: zone.name })}</span>
                      {zone.choice && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => pickCrop(index, null)}>
                          <X className="h-3.5 w-3.5" /> {g("leaveEmpty")}
                        </Button>
                      )}
                    </div>
                    <CropPicker
                      profiles={profiles.data ?? []}
                      library={library.data ?? []}
                      value={zone.choice}
                      onChange={(choice) => pickCrop(index, choice)}
                      compact
                    />
                    {zone.choice && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <FieldLabel className="mb-0">{g("currentStage")}</FieldLabel>
                          <Select value={zone.stageId} onValueChange={(stageId) => updateZone(index, { stageId })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((s, i) => (
                                <SelectItem key={s.id} value={s.id}>{named(s.names, s.name) || g("stageN", { n: i + 1 })}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel className="mb-0">{g("plantedOn")}</FieldLabel>
                          <DayPicker value={zone.plantedOn} onChange={(plantedOn) => updateZone(index, { plantedOn: plantedOn || todayIso() })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {step === REVIEW && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border">
                <div className="aspect-[16/6]"><GreenhouseCover cover={coverOf(cover, structure)} fruit={reviewIcon ? fruitOf(reviewIcon) : null} /></div>
                <div className="p-4">
                <div className="text-lg font-semibold">{name}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {location && <span>{location}</span>}
                  {area && <span>{`${formatNumber(Number(area))} ${g("m2")}`}</span>}
                  {structure && <span>{g(`structure_${structure}` as GreenhouseTextKey)}</span>}
                  {cultivation && <span>{g(`cultivation_${cultivation}` as GreenhouseTextKey)}</span>}
                  {timeZone && <span dir="ltr">{timeZone}</span>}
                </div>
                <div className="mt-3 text-sm">{g("reviewZonesLine", { n: zones.length, b: bedsPerZone })}</div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone, index) => {
                  const choice = zone.choice;
                  const title =
                    !choice || choice.kind === "custom"
                      ? g("empty")
                      : choice.kind === "profile"
                        ? named(choice.profile.names, choice.profile.name)
                        : named(choice.template.names);
                  const icon = !choice || choice.kind === "custom" ? null : choice.kind === "profile" ? choice.profile.icon : choice.template.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      {icon ? <CropIcon icon={icon} className="h-8 w-8" /> : <span className="h-8 w-8 rounded-full border border-dashed" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{zone.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {progress && (
                <ul className="space-y-1.5 rounded-lg border p-3">
                  {progress.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {item.state === "working" && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                      {item.state === "done" && <Check className="h-4 w-4 text-emerald-600" />}
                      {item.state === "failed" && <X className="h-4 w-4 text-destructive" />}
                      {item.state === "waiting" && <span className="h-4 w-4 rounded-full border" />}
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button variant="outline" disabled={busy} onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
            {step === 0 ? g("cancel") : g("back")}
          </Button>
          <div className="flex flex-wrap gap-2">
            {step > 0 && step < REVIEW && (
              <Button variant="ghost" disabled={busy} onClick={() => setStep(REVIEW)}>
                {g("skipForNow")}
              </Button>
            )}
            {step < REVIEW ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {g("next")}
              </Button>
            ) : (
              <Button disabled={busy || finished || !name.trim()} onClick={create} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? g("creating") : g("createGreenhouse")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const { formatNumber } = useGreenhouseText();
  return (
    <div className="space-y-2">
      <FieldLabel className="mb-0">{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums">{formatNumber(value)}</span>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground max-w-[240px]">{hint}</p>}
    </div>
  );
}
