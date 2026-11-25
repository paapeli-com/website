import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cropCycleService } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
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
import { CropPicker, choiceKey, profileFor, type CropChoice } from "../components/CropPicker";
import { DayPicker } from "../components/DayPicker";
import { SectionCard, stagesOf } from "../components/formParts";
import { todayIso, useCropLibrary, useCropProfiles, useGreenhouses, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText } from "../i18n";

/**
 * Plants a crop in a zone or bed, on a page of its own. Opened from a zone the
 * place arrives as ?assetId= and is fixed; opened from the crop cycles list the
 * grower picks one of the free places. ?from=<greenhouseId> returns there.
 */
export default function CropCycleNew() {
  const { g, named, language, isRTL } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const greenhouses = useGreenhouses();
  const profiles = useCropProfiles();
  const library = useCropLibrary();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lp = (p: string) => localizedPath(p, language);

  const presetAssetId = params.get("assetId") ?? "";
  const from = params.get("from");
  const backTo = from ? `/greenhouses/${from}` : "/crop-cycles";

  const [assetId, setAssetId] = useState(presetAssetId);
  const [choice, setChoice] = useState<CropChoice | null>(null);
  const [stageId, setStageId] = useState("");
  const [plantedOn, setPlantedOn] = useState(todayIso());
  const [expectedHarvestOn, setExpectedHarvestOn] = useState("");
  const [variety, setVariety] = useState("");
  const [saving, setSaving] = useState(false);

  const places = useMemo(
    () =>
      (greenhouses.data ?? []).map((house) => ({
        house,
        options: house.zones.flatMap((zone) => [
          { id: zone.id, label: zone.name, busy: !!zone.cycle },
          ...zone.beds.map((bed) => ({ id: bed.id, label: `${zone.name} › ${bed.name}`, busy: !!bed.cycle })),
        ]),
      })),
    [greenhouses.data],
  );
  const loaded = !!greenhouses.data;
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
      navigate(lp(backTo));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("startCycle")));
      setSaving(false);
    }
  };

  return (
    <UniformPage>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <HomeCrumb />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/crop-cycles"))} className="cursor-pointer">
              {g("cropCycles")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{g("plantCrop")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{g("plantCrop")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{g("plantCropSubtitle")}</p>
      </div>

      {!loaded ? (
        <Card className="flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : !anyPlace ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{g("noZonesAtAll")}</Card>
      ) : !anyFree && !presetAssetId ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{g("noFreeZones")}</Card>
      ) : (
        <div className="space-y-4">
          {/* 1. Where */}
          <SectionCard step={1} title={g("whereItGrows")}>
            <div className="max-w-md">
              <FieldLabel required>{g("zoneOrBed")}</FieldLabel>
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
          </SectionCard>

          {/* 2. Crop */}
          <SectionCard step={2} title={g("crop")}>
            <CropPicker profiles={profiles.data ?? []} library={library.data ?? []} value={choice} onChange={setChoice} />
          </SectionCard>

          {/* 3. Planting */}
          <SectionCard step={3} title={g("planting")}>
            {choice ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>{g("currentStage")}</FieldLabel>
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
                <div>
                  <FieldLabel>{g("variety")}</FieldLabel>
                  <Input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder={g("varietyPh")} />
                </div>
                <div>
                  <FieldLabel required>{g("plantedOn")}</FieldLabel>
                  <DayPicker value={plantedOn} onChange={setPlantedOn} />
                </div>
                <div>
                  <FieldLabel>{g("expectedHarvest")}</FieldLabel>
                  <DayPicker value={expectedHarvestOn} onChange={setExpectedHarvestOn} clearable />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{g("chooseCropFirst")}</p>
            )}
          </SectionCard>
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className={cn("flex items-center justify-end gap-3", isRTL && "flex-row-reverse")}>
          <Button variant="outline" disabled={saving} onClick={() => navigate(lp(backTo))}>
            {g("cancel")}
          </Button>
          <Button onClick={save} disabled={!canSave} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {g("plant")}
          </Button>
        </div>
      </div>
    </UniformPage>
  );
}
