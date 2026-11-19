import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Moon, Plus, Sun, Trash2 } from "lucide-react";
import {
  cropService,
  type CropMetric,
  type CropProfile,
  type CropStageInput,
  type CropTarget,
  type CultivationMethod,
} from "@paapeli/api";
import { DataState } from "@/features/factory/components/DataState";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { currentProductKey } from "@/features/factory/lib/product";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { CULTIVATIONS } from "../components/AddGreenhouseWizard";
import { METRICS, METRIC_UNITS, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

type Bounds = { min: string; max: string };
type MetricDraft = { all: Bounds; day: Bounds; night: Bounds };

interface StageDraft {
  key: string;
  id?: string;
  names: Record<string, string>;
  name: string;
  durationDays: string;
  irrigation: string;
  notes: string;
  split: boolean;
  targets: Record<CropMetric, MetricDraft>;
}

const blank = (): Bounds => ({ min: "", max: "" });
const blankTargets = () =>
  Object.fromEntries(METRICS.map((m) => [m, { all: blank(), day: blank(), night: blank() }])) as Record<CropMetric, MetricDraft>;
let draftCounter = 0;
const text = (n?: number | null) => (n == null ? "" : String(n));
const num = (s: string): number | null => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Number(s));

function toDraft(profile: CropProfile): StageDraft[] {
  return profile.stages.map((stage) => {
    const targets = blankTargets();
    stage.targets.forEach((t) => {
      const slot = t.period === "DAY" ? "day" : t.period === "NIGHT" ? "night" : "all";
      targets[t.metric][slot] = { min: text(t.min), max: text(t.max) };
    });
    return {
      key: `s${++draftCounter}`,
      id: stage.id,
      names: stage.names as Record<string, string>,
      name: stage.name ?? "",
      durationDays: text(stage.durationDays),
      irrigation: stage.irrigation ?? "",
      notes: stage.notes ?? "",
      split: stage.targets.some((t) => t.period !== "ALL"),
      targets,
    };
  });
}

function toInput(stage: StageDraft): CropStageInput {
  const targets: CropTarget[] = [];
  METRICS.forEach((metric) => {
    const slots: [keyof MetricDraft, CropTarget["period"]][] = stage.split ? [["day", "DAY"], ["night", "NIGHT"]] : [["all", "ALL"]];
    slots.forEach(([slot, period]) => {
      const { min, max } = stage.targets[metric][slot];
      if (num(min) != null || num(max) != null) targets.push({ metric, period, min: num(min), max: num(max) });
    });
  });
  return {
    ...(stage.id ? { id: stage.id } : {}),
    name: stage.name.trim() || null,
    durationDays: num(stage.durationDays),
    irrigation: stage.irrigation.trim() || null,
    notes: stage.notes.trim() || null,
    targets,
  };
}

const reversed = (b: Bounds) => num(b.min) != null && num(b.max) != null && (num(b.min) as number) > (num(b.max) as number);

/** One crop's profile: what it is, and for each growth stage what it needs. */
export default function CropProfileEditor() {
  const { cropId } = useParams();
  const { g, named, language, isRTL, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles(true);
  const profile = profiles.data?.find((p) => p.id === cropId) ?? null;

  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [cycleDays, setCycleDays] = useState("");
  const [methods, setMethods] = useState<CultivationMethod[]>([]);
  const [notes, setNotes] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The form as the profile was saved, to tell whether anything has changed.
  const baseline = useMemo(
    () =>
      profile
        ? JSON.stringify({
            name: profile.name ?? "",
            variety: profile.variety ?? "",
            cycleDays: text(profile.cycleDays),
            methods: profile.cultivationMethods,
            notes: profile.notes ?? "",
            stages: toDraft(profile).map(toInput),
          })
        : "",
    [profile],
  );

  useEffect(() => {
    if (!profile) return;
    const drafts = toDraft(profile);
    setName(profile.name ?? "");
    setVariety(profile.variety ?? "");
    setCycleDays(text(profile.cycleDays));
    setMethods(profile.cultivationMethods);
    setNotes(profile.notes ?? "");
    setStages(drafts);
    setOpenStage((current) => current ?? drafts[0]?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.updatedAt]);

  const current = JSON.stringify({ name, variety, cycleDays, methods, notes, stages: stages.map(toInput) });
  const dirty = !!profile && stages.length > 0 && current !== baseline;
  const invalid =
    (!profile?.templateKey && !name.trim()) ||
    stages.length === 0 ||
    stages.some((s) => !s.name.trim() && !named(s.names)) ||
    stages.some((s) => METRICS.some((m) => (s.split ? reversed(s.targets[m].day) || reversed(s.targets[m].night) : reversed(s.targets[m].all))));

  const updateStage = (key: string, patch: Partial<StageDraft>) =>
    setStages((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const setBound = (key: string, metric: CropMetric, slot: keyof MetricDraft, bound: keyof Bounds, value: string) =>
    setStages((all) =>
      all.map((s) =>
        s.key === key
          ? { ...s, targets: { ...s.targets, [metric]: { ...s.targets[metric], [slot]: { ...s.targets[metric][slot], [bound]: value } } } }
          : s,
      ),
    );
  const move = (index: number, by: number) =>
    setStages((all) => {
      const next = [...all];
      const [stage] = next.splice(index, 1);
      next.splice(index + by, 0, stage);
      return next;
    });
  const addStage = () => {
    const stage: StageDraft = {
      key: `s${++draftCounter}`,
      names: {},
      name: g("stageN", { n: stages.length + 1 }),
      durationDays: "",
      irrigation: "",
      notes: "",
      split: false,
      targets: blankTargets(),
    };
    setStages((all) => [...all, stage]);
    setOpenStage(stage.key);
  };

  const save = async () => {
    if (!profile || invalid) return;
    setSaving(true);
    try {
      await cropService.update(workspaceId, currentProductKey(), profile.id, {
        name: name.trim() || null,
        variety: variety.trim() || null,
        icon: profile.icon,
        cultivationMethods: methods,
        cycleDays: num(cycleDays),
        notes: notes.trim() || null,
        stages: stages.map(toInput),
      });
      await refresh();
      toast.success(g("saved"));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("save")));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!profile) return;
    try {
      const { message } = await cropService.remove(workspaceId, currentProductKey(), profile.id);
      await refresh();
      toast.success(message);
      navigate(localizedPath("/crops", language));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("deleteCrop")));
    }
  };

  const title = useMemo(() => (profile ? named(profile.names, name || profile.name) : ""), [profile, name, named]);
  const Back = isRTL ? ChevronRight : ChevronLeft;

  if (profiles.isLoading) return <DataState loading size="lg" />;
  if (!profile) {
    return (
      <UniformPage>
        <Button variant="ghost" onClick={() => navigate(localizedPath("/crops", language))} className="gap-1">
          <Back className="h-4 w-4" /> {g("crops")}
        </Button>
      </UniformPage>
    );
  }

  return (
    <UniformPage>
      <div className="space-y-4 pb-24">
        <button
          type="button"
          onClick={() => navigate(localizedPath("/crops", language))}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Back className="h-4 w-4" /> {g("crops")}
        </button>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
                <CropIcon icon={profile.icon} className="h-12 w-12" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{title}</h1>
                <p className="text-xs text-muted-foreground">{g("stagesN", { n: stages.length })}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                {profile.templateKey ? (
                  <FieldLabel optional className="mb-0">{g("customCropName")}</FieldLabel>
                ) : (
                  <FieldLabel required className="mb-0">{g("customCropName")}</FieldLabel>
                )}
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={named(profile.names)} maxLength={255} />
              </div>
              <div className="space-y-2">
                <FieldLabel optional className="mb-0">{g("variety")}</FieldLabel>
                <Input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder={g("varietyPh")} maxLength={255} />
              </div>
              <div className="space-y-2">
                <FieldLabel optional className="mb-0">{g("cycleDays")}</FieldLabel>
                <Input type="number" min="1" dir="ltr" value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel optional className="mb-0">{g("cultivationMethods")}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CULTIVATIONS.map(({ key, icon: Icon }) => {
                  const on = methods.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMethods(on ? methods.filter((m) => m !== key) : [...methods, key])}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        on ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "hover:border-emerald-300",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {g(`cultivation_${key}` as GreenhouseTextKey)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel optional className="mb-0">{g("notes")}</FieldLabel>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{g("growthStages")}</h2>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addStage} disabled={stages.length >= 20}>
            <Plus className="h-4 w-4" /> {g("addStage")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{g("targetsDisclaimer")}</p>

        <ol className="space-y-2">
          {stages.map((stage, index) => {
            const isOpen = openStage === stage.key;
            const set = METRICS.filter((m) =>
              stage.split
                ? num(stage.targets[m].day.min) != null || num(stage.targets[m].day.max) != null || num(stage.targets[m].night.min) != null || num(stage.targets[m].night.max) != null
                : num(stage.targets[m].all.min) != null || num(stage.targets[m].all.max) != null,
            ).length;
            return (
              <li key={stage.key} className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-emerald-600 text-white text-xs font-semibold inline-flex items-center justify-center tabular-nums">
                    {formatNumber(index + 1)}
                  </span>
                  <button type="button" className="flex flex-1 items-center gap-2 min-w-0 text-start" onClick={() => setOpenStage(isOpen ? null : stage.key)}>
                    <span className="font-medium truncate">{stage.name.trim() || named(stage.names) || g("stageN", { n: index + 1 })}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {set ? `${g("targets")}: ${formatNumber(set)}` : g("noTargetsYet")}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => move(index, -1)} aria-label={g("moveUp")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === stages.length - 1} onClick={() => move(index, 1)} aria-label={g("moveDown")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={stages.length === 1}
                    onClick={() => setStages((all) => all.filter((s) => s.key !== stage.key))}
                    aria-label={g("removeStage")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {isOpen && (
                  <div className="border-t px-3 py-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel className="mb-0">{g("stageName")}</FieldLabel>
                        <Input value={stage.name} onChange={(e) => updateStage(stage.key, { name: e.target.value })} placeholder={named(stage.names)} maxLength={255} />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel optional className="mb-0">{g("durationDays")}</FieldLabel>
                        <Input type="number" min="1" dir="ltr" value={stage.durationDays} onChange={(e) => updateStage(stage.key, { durationDays: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <FieldLabel className="mb-0">{g("targets")}</FieldLabel>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={stage.split} onCheckedChange={(split) => updateStage(stage.key, { split })} />
                          {g("splitDayNight")}
                        </label>
                      </div>
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-xs text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 text-start font-medium">{g("targets")}</th>
                              {stage.split ? (
                                <>
                                  <th className="px-3 py-2 text-start font-medium">
                                    <span className="inline-flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-amber-500" />{g("day")}</span>
                                  </th>
                                  <th className="px-3 py-2 text-start font-medium">
                                    <span className="inline-flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-indigo-400" />{g("night")}</span>
                                  </th>
                                </>
                              ) : (
                                <th className="px-3 py-2 text-start font-medium">{g("range")}</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {METRICS.map((metric) => (
                              <tr key={metric} className="border-t">
                                <td className="px-3 py-1.5 whitespace-nowrap">
                                  {g(`metric_${metric}` as GreenhouseTextKey)}
                                  {METRIC_UNITS[metric] && <span className="text-xs text-muted-foreground" dir="ltr"> ({METRIC_UNITS[metric]})</span>}
                                </td>
                                {(stage.split ? (["day", "night"] as const) : (["all"] as const)).map((slot) => (
                                  <td key={slot} className="px-3 py-1.5">
                                    <RangeInput
                                      value={stage.targets[metric][slot]}
                                      onChange={(bound, value) => setBound(stage.key, metric, slot, bound, value)}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel optional className="mb-0">{g("irrigation")}</FieldLabel>
                        <Textarea rows={2} value={stage.irrigation} onChange={(e) => updateStage(stage.key, { irrigation: e.target.value })} placeholder={g("irrigationPh")} maxLength={2000} />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel optional className="mb-0">{g("notes")}</FieldLabel>
                        <Textarea rows={2} value={stage.notes} onChange={(e) => updateStage(stage.key, { notes: e.target.value })} maxLength={2000} />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 border-t bg-background/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2 px-4 py-3">
          <Button variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> {g("deleteCrop")}
          </Button>
          <div className="flex items-center gap-3">
            {dirty && <span className="text-xs text-amber-600">{g("unsaved")}</span>}
            <Button onClick={save} disabled={saving || invalid || !dirty} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              {g("save")}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{g("deleteCrop")}</AlertDialogTitle>
            <AlertDialogDescription>{g("deleteCropConfirm", { name: title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{g("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {g("deleteCrop")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UniformPage>
  );
}

function RangeInput({ value, onChange }: { value: Bounds; onChange: (bound: keyof Bounds, value: string) => void }) {
  const { g } = useGreenhouseText();
  const bad = reversed(value);
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <Input
        type="number"
        step="any"
        value={value.min}
        onChange={(e) => onChange("min", e.target.value)}
        placeholder={g("min")}
        className={cn("h-8 w-20 text-center", bad && "border-destructive")}
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="number"
        step="any"
        value={value.max}
        onChange={(e) => onChange("max", e.target.value)}
        placeholder={g("max")}
        className={cn("h-8 w-20 text-center", bad && "border-destructive")}
      />
    </div>
  );
}
