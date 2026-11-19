import { useEffect, useMemo, useState } from "react";
import { cropCycleService, type Greenhouse } from "@paapeli/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { CropPicker, choiceKey, profileFor, type CropChoice } from "./CropPicker";
import { DayPicker } from "./DayPicker";
import { todayIso, useCropLibrary, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText } from "../i18n";

/** The stages a choice offers: the profile's, or the library crop's it would be made with. */
export function stagesOf(choice: CropChoice | null): { id: string; names: Record<string, string>; name?: string | null }[] {
  if (!choice || choice.kind === "custom") return [];
  if (choice.kind === "profile") return choice.profile.stages.map((s) => ({ id: s.id, names: s.names, name: s.name }));
  return choice.template.stages.map((s) => ({ id: s.key, names: s.names }));
}

/**
 * Plants a crop in a zone or bed. Opened from a zone tile the place is chosen
 * already; opened from the cycles list the grower picks one of the free ones.
 */
export function StartCycleDialog({
  open,
  onOpenChange,
  greenhouses,
  assetId: presetAssetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  greenhouses: Greenhouse[];
  assetId?: string;
}) {
  const { g, named } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles();
  const library = useCropLibrary();
  const [assetId, setAssetId] = useState("");
  const [choice, setChoice] = useState<CropChoice | null>(null);
  const [stageId, setStageId] = useState("");
  const [plantedOn, setPlantedOn] = useState(todayIso());
  const [expectedHarvestOn, setExpectedHarvestOn] = useState("");
  const [variety, setVariety] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAssetId(presetAssetId ?? "");
    setChoice(null);
    setStageId("");
    setPlantedOn(todayIso());
    setExpectedHarvestOn("");
    setVariety("");
  }, [open, presetAssetId]);

  const places = useMemo(
    () =>
      greenhouses.map((house) => ({
        house,
        options: house.zones.flatMap((zone) => [
          { id: zone.id, label: zone.name, busy: !!zone.cycle },
          ...zone.beds.map((bed) => ({ id: bed.id, label: `${zone.name} › ${bed.name}`, busy: !!bed.cycle })),
        ]),
      })),
    [greenhouses],
  );
  const anyPlace = places.some((p) => p.options.length > 0);
  const anyFree = places.some((p) => p.options.some((o) => !o.busy));
  const stages = stagesOf(choice);

  useEffect(() => {
    setStageId(stages[0]?.id ?? "");
    if (choice?.kind === "profile") setVariety(choice.profile.variety ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceKey(choice)]);

  const canSave = !!assetId && !!choice && choice.kind !== "custom" && !!stageId && !!plantedOn && !saving;

  const save = async () => {
    if (!canSave || !choice) return;
    setSaving(true);
    try {
      const profile = await profileFor(workspaceId, choice);
      await cropCycleService.start(workspaceId, currentProductKey(), {
        cropProfileId: profile.id,
        assetId,
        plantedOn,
        expectedHarvestOn: expectedHarvestOn || null,
        stageId,
        variety: variety.trim() || null,
      });
      await refresh();
      toast.success(g("started"));
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, g("startCycle")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{g("plantCrop")}</DialogTitle>
        </DialogHeader>

        {!anyPlace ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{g("noZonesAtAll")}</p>
        ) : !anyFree && !presetAssetId ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{g("noFreeZones")}</p>
        ) : (
          <div className="space-y-5 py-1">
            <div className="space-y-2">
              <FieldLabel required className="mb-0">{g("zoneOrBed")}</FieldLabel>
              <Select value={assetId} onValueChange={setAssetId} disabled={!!presetAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder={g("chooseZone")} />
                </SelectTrigger>
                <SelectContent>
                  {places
                    .filter((p) => p.options.length > 0)
                    .map(({ house, options }) => (
                      <SelectGroup key={house.id}>
                        <SelectLabel>{house.name}</SelectLabel>
                        {options.map((o) => (
                          <SelectItem key={o.id} value={o.id} disabled={o.busy && o.id !== presetAssetId}>
                            {o.label}
                            {o.busy ? ` (${g("occupied")})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel required className="mb-0">{g("crop")}</FieldLabel>
              <CropPicker
                profiles={profiles.data ?? []}
                library={library.data ?? []}
                value={choice}
                onChange={setChoice}
                compact
              />
            </div>

            {choice && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required className="mb-0">{g("currentStage")}</FieldLabel>
                  <Select value={stageId} onValueChange={setStageId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s, index) => (
                        <SelectItem key={s.id} value={s.id}>
                          {named(s.names, s.name) || g("stageN", { n: index + 1 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel optional className="mb-0">{g("variety")}</FieldLabel>
                  <Input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder={g("varietyPh")} />
                </div>
                <div className="space-y-2">
                  <FieldLabel required className="mb-0">{g("plantedOn")}</FieldLabel>
                  <DayPicker value={plantedOn} onChange={setPlantedOn} />
                </div>
                <div className="space-y-2">
                  <FieldLabel optional className="mb-0">{g("expectedHarvest")}</FieldLabel>
                  <DayPicker value={expectedHarvestOn} onChange={setExpectedHarvestOn} clearable />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {g("cancel")}
          </Button>
          <Button onClick={save} disabled={!canSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {g("plant")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
