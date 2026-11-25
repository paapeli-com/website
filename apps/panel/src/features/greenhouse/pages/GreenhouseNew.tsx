import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, X } from "lucide-react";
import { assetsService, cropCycleService, greenhouseService, type CropProfile, type CultivationMethod, type GreenhouseStructure } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { HomeCrumb } from "@/shell/HomeCrumb";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CoverPicker, coverOf, type CoverKey } from "../components/GreenhouseCover";
import { useCoverLabels } from "../components/GreenhouseDialogs";
import { CropPicker, choiceKey, profileFor, type CropChoice } from "../components/CropPicker";
import { DayPicker } from "../components/DayPicker";
import { CULTIVATIONS, Counter, STRUCTURES, SectionCard, ensureRoot, stagesOf, timeZoneOptions } from "../components/formParts";
import { todayIso, useCropLibrary, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

const MAX_ZONES = 12;
const MAX_BEDS = 20;

interface ZonePlan {
  name: string;
  choice: CropChoice | null;
  stageId: string;
  plantedOn: string;
}

type Progress = { label: string; state: "waiting" | "working" | "done" | "failed" }[];

/**
 * A greenhouse, made on a page of its own like a device or a server: what it
 * is, how it grows and its zones, and what each zone grows. Only the name is
 * required; what is left out is added later from the greenhouse's page.
 */
export default function GreenhouseNew() {
  const coverLabels = useCoverLabels();
  const { g, named, language, isRTL } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles();
  const library = useCropLibrary();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [timeZone, setTimeZone] = useState(timeZoneOptions()[0]);
  const [structure, setStructure] = useState<GreenhouseStructure | null>(null);
  const [cover, setCover] = useState<CoverKey | null>(null);
  const [cultivation, setCultivation] = useState<CultivationMethod | null>(null);
  const [zoneCount, setZoneCount] = useState(1);
  const [bedsPerZone, setBedsPerZone] = useState(0);
  const [zones, setZones] = useState<ZonePlan[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  // Zone names follow the count until the grower types their own.
  useEffect(() => {
    setZones((current) =>
      Array.from({ length: zoneCount }, (_, i) =>
        current[i] ?? { name: g("zoneDefaultName", { n: i + 1 }), choice: null, stageId: "", plantedOn: todayIso() },
      ),
    );
  }, [zoneCount, g]);

  const updateZone = (index: number, patch: Partial<ZonePlan>) =>
    setZones((current) => current.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)));

  const pickCrop = (index: number, choice: CropChoice | null) =>
    updateZone(index, { choice, stageId: stagesOf(choice)[0]?.id ?? "" });

  const planted = zones.filter((z) => z.choice);
  const busy = progress?.some((p) => p.state === "working") ?? false;

  const create = async () => {
    if (!name.trim() || busy) return;
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
      const house = await assetsService.createChild(workspaceId, pk, rootId, { name: name.trim(), type: "GREENHOUSE", label: name.trim() });
      await greenhouseService.saveDetail(workspaceId, pk, house.id, {
        location: location.trim() || null,
        areaM2: area ? Number(area) : null,
        timeZone: timeZone || null,
        structureType: structure,
        cultivationMethod: cultivation,
        cover: coverOf(cover, structure),
      });
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
      navigate(lp(`/greenhouses/${house.id}`));
    } catch (error) {
      mark(at, "failed");
      await refresh();
      toast.error(`${g("createFailed", { step: plan[at]?.label ?? "" })} ${apiErrorMessage(error, "")}`.trim());
    }
  };

  return (
    <UniformPage>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <HomeCrumb />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/greenhouses"))} className="cursor-pointer">
              {g("greenhouses")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{g("wizardTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{g("wizardTitle")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{g("newGreenhouseSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* 1. Basics */}
        <SectionCard step={1} title={g("stepBasics")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required>{g("greenhouseName")}</FieldLabel>
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={g("greenhouseNamePh")} maxLength={255} />
            </div>
            <div>
              <FieldLabel>{g("locationLabel")}</FieldLabel>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={g("locationPh")} maxLength={255} />
            </div>
            <div>
              <FieldLabel>{`${g("area")} (${g("m2")})`}</FieldLabel>
              <Input type="number" min="1" dir="ltr" value={area} onChange={(e) => setArea(e.target.value)} placeholder="2400" />
            </div>
            <div>
              <FieldLabel>{g("timeZone")}</FieldLabel>
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
            <div className="sm:col-span-2">
              <FieldLabel>{g("structure")}</FieldLabel>
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
            <div className="sm:col-span-2">
              <FieldLabel>{g("picture")}</FieldLabel>
              <CoverPicker value={coverOf(cover, structure)} onChange={setCover} labels={coverLabels} />
            </div>
          </div>
        </SectionCard>

        {/* 2. Growing setup and zones */}
        <SectionCard step={2} title={g("stepSetup")}>
          <div className="space-y-6">
            <div>
              <FieldLabel>{g("cultivation")}</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CULTIVATIONS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCultivation(cultivation === key ? null : key)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border bg-card p-4 text-start transition-all hover:border-primary/40",
                      cultivation === key && "border-primary bg-primary/5 ring-2 ring-primary/20",
                    )}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-medium">{g(`cultivation_${key}` as GreenhouseTextKey)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{g(`cultivationDesc_${key}` as GreenhouseTextKey)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5 border-t pt-5">
              <p className="text-sm text-muted-foreground">{g("zoneHint")}</p>
              <div className="flex flex-wrap gap-8">
                <Counter label={g("zoneCount")} value={zoneCount} min={1} max={MAX_ZONES} onChange={setZoneCount} />
                <Counter label={g("bedsPerZone")} hint={g("bedsHint")} value={bedsPerZone} min={0} max={MAX_BEDS} onChange={setBedsPerZone} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone, index) => (
                  <Input key={index} value={zone.name} onChange={(e) => updateZone(index, { name: e.target.value })} aria-label={g("zoneName")} maxLength={255} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 3. Crops */}
        <SectionCard step={3} title={g("stepCrops")}>
          <div className="space-y-4">
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{g("targetsDisclaimer")}</p>
            {zones.map((zone, index) => {
              const stages = stagesOf(zone.choice);
              return (
                <div key={index} className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{g("chooseCropFor", { zone: zone.name })}</span>
                    {zone.choice && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => pickCrop(index, null)}>
                        <X className="h-3.5 w-3.5" /> {g("leaveEmpty")}
                      </Button>
                    )}
                  </div>
                  <CropPicker profiles={profiles.data ?? []} library={library.data ?? []} value={zone.choice} onChange={(choice) => pickCrop(index, choice)} compact />
                  {zone.choice && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>{g("currentStage")}</FieldLabel>
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
                      <div>
                        <FieldLabel>{g("plantedOn")}</FieldLabel>
                        <DayPicker value={zone.plantedOn} onChange={(plantedOn) => updateZone(index, { plantedOn: plantedOn || todayIso() })} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {progress && (
          <ul className="space-y-1.5 rounded-lg border bg-card p-4">
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

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className={cn("flex items-center justify-end gap-3", isRTL && "flex-row-reverse")}>
          <Button variant="outline" disabled={busy} onClick={() => navigate(lp("/greenhouses"))}>
            {g("cancel")}
          </Button>
          <Button disabled={busy || !name.trim()} onClick={create} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? g("creating") : g("createGreenhouse")}
          </Button>
        </div>
      </div>
    </UniformPage>
  );
}
