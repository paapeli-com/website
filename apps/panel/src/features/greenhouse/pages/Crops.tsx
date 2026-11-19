import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Plus, Sprout } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { DataState } from "@/features/factory/components/DataState";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { Label } from "@/features/factory/components/ui/label";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { CropPicker, profileFor, type CropChoice } from "../components/CropPicker";
import { useCropCycles, useCropLibrary, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

/** The crops a workspace grows, each with its stages and how many of them have targets. */
export default function Crops() {
  const { g, named, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const profiles = useCropProfiles(showArchived);
  const growing = useCropCycles({ status: "ACTIVE" });
  const [adding, setAdding] = useState(false);

  const growingBy = useMemo(() => {
    const counts = new Map<string, number>();
    (growing.data ?? []).forEach((c) => counts.set(c.crop.id, (counts.get(c.crop.id) ?? 0) + 1));
    return counts;
  }, [growing.data]);
  const crops = profiles.data ?? [];

  return (
    <UniformPage>
      <div className="space-y-4">
        <PageHeader
          title={g("crops")}
          count={profiles.data ? crops.length : null}
          countLabel={g("cropsCount")}
          actions={
            <>
              <div className="flex items-center gap-2 px-1">
                <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
                <Label htmlFor="show-archived" className="text-sm text-muted-foreground">{g("showArchived")}</Label>
              </div>
              <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
                <Plus className="h-4 w-4" /> {g("addCrop")}
              </Button>
            </>
          }
        />

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{g("targetsDisclaimer")}</span>
        </div>

        {profiles.isLoading ? (
          <DataState loading size="lg" />
        ) : profiles.isError ? (
          <LoadFailed onRetry={() => void profiles.refetch()} />
        ) : crops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
                <Sprout className="h-8 w-8 text-emerald-600" />
              </span>
              <div>
                <p className="font-medium">{g("noCropsTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{g("noCropsDesc")}</p>
              </div>
              <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> {g("addCrop")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {crops.map((crop) => {
              const withTargets = crop.stages.filter((s) => s.targets.length > 0).length;
              const count = growingBy.get(crop.id) ?? 0;
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => navigate(localizedPath(`/crops/${crop.id}`, language))}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border bg-card p-4 text-start transition-all hover:border-emerald-300 hover:shadow-md",
                    crop.archived && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
                      <CropIcon icon={crop.icon} className="h-10 w-10" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{named(crop.names, crop.name)}</span>
                        {crop.archived && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{g("archivedBadge")}</span>}
                      </div>
                      {crop.variety && <div className="text-xs text-muted-foreground truncate">{crop.variety}</div>}
                      {count > 0 && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Sprout className="h-3 w-3" />
                          {g("growingInN", { n: count })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* The stages in order, filled in where targets are set. */}
                  <div className="flex gap-1">
                    {crop.stages.map((stage) => (
                      <span
                        key={stage.id}
                        title={named(stage.names, stage.name)}
                        className={cn("h-1.5 flex-1 rounded-full", stage.targets.length ? "bg-emerald-500" : "bg-muted")}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{g("stagesN", { n: crop.stages.length })}</span>
                    <span>{withTargets ? g("targetsSetN", { n: withTargets, m: crop.stages.length }) : g("noTargetsYet")}</span>
                  </div>
                  {crop.cultivationMethods.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {crop.cultivationMethods.map((m) => (
                        <span key={m} className="rounded-full border px-2 py-0.5 text-[11px]">
                          {g(`cultivation_${m}` as GreenhouseTextKey)}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <AddCropDialog open={adding} onOpenChange={setAdding} />
    </UniformPage>
  );
}

function AddCropDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { g, language } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles(true);
  const library = useCropLibrary();
  const [choice, setChoice] = useState<CropChoice | null>(null);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = !!choice && (choice.kind !== "custom" || !!customName.trim()) && !saving;

  const save = async () => {
    if (!choice || !canSave) return;
    setSaving(true);
    try {
      const profile = await profileFor(workspaceId, choice, { name: customName, firstStage: g("stageN", { n: 1 }) });
      await refresh();
      onOpenChange(false);
      setChoice(null);
      setCustomName("");
      navigate(localizedPath(`/crops/${profile.id}`, language));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("addCrop")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("library")}</DialogTitle>
        </DialogHeader>
        <CropPicker
          profiles={profiles.data ?? []}
          library={library.data ?? []}
          value={choice}
          onChange={setChoice}
          offerCustom
          markAdded
        />
        {choice?.kind === "custom" && (
          <div className="space-y-2">
            <FieldLabel required className="mb-0">{g("customCropName")}</FieldLabel>
            <Input autoFocus value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={255} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{g("cancel")}</Button>
          <Button onClick={save} disabled={!canSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {g("addCrop")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
