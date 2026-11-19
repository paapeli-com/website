import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  CheckCircle2,
  Eye,
  Flag,
  MapPin,
  Moon,
  Pencil,
  ShoppingBasket,
  Sprout,
  Sun,
  TrendingUp,
} from "lucide-react";
import { cropCycleService, type CropCycle, type CropCycleEvent, type CropStage, type CropTarget } from "@paapeli/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { currentProductKey } from "@/features/factory/lib/product";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "./CropIcon";
import { DayPicker } from "./DayPicker";
import { METRIC_UNITS, daysSince, daysUntil, todayIso, useCropCycleEvents, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

type Panel = null | { kind: "stage"; stage: CropStage } | { kind: "observe" | "harvest" | "complete" | "archive" };

const STATUS_TONE: Record<CropCycle["status"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  COMPLETED: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  ARCHIVED: "bg-muted text-muted-foreground",
};

/** A range as a grower reads it: "22 to 26 °C", "at least 60 %", "at most 1.2 kPa". */
export function useRangeText() {
  const { formatNumber, language } = useGreenhouseText();
  return (target: CropTarget) => {
    const unit = METRIC_UNITS[target.metric];
    const n = (v: number) => formatNumber(v);
    const to = language === "fa" ? " تا " : language === "ar" ? " إلى " : " to ";
    const body =
      target.min != null && target.max != null
        ? `${n(target.min)}${to}${n(target.max)}`
        : target.min != null
          ? `≥ ${n(target.min)}`
          : `≤ ${n(target.max as number)}`;
    return unit ? `${body} ${unit}` : body;
  };
}

/** A stage's targets, one chip per measurement, day and night side by side. */
export function StageTargets({ stage }: { stage: CropStage }) {
  const { g } = useGreenhouseText();
  const range = useRangeText();
  if (!stage.targets.length) {
    return <p className="text-xs text-muted-foreground">{g("noStageTargets")}</p>;
  }
  const byMetric = new Map<string, CropTarget[]>();
  stage.targets.forEach((t) => byMetric.set(t.metric, [...(byMetric.get(t.metric) ?? []), t]));
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[...byMetric.entries()].map(([metric, targets]) => (
        <div key={metric} className="rounded-lg border bg-card px-3 py-2">
          <div className="text-xs text-muted-foreground">{g(`metric_${metric}` as GreenhouseTextKey)}</div>
          <div className="mt-1 space-y-0.5">
            {targets.map((t) => (
              <div key={t.period} className="flex items-center gap-1.5 text-sm font-medium tabular-nums" dir="ltr">
                {t.period === "DAY" && <Sun className="h-3.5 w-3.5 text-amber-500" />}
                {t.period === "NIGHT" && <Moon className="h-3.5 w-3.5 text-indigo-400" />}
                <span>{range(t)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Midday of a picked day, or now when it is today, as the instant something happened. */
const instantOf = (day: string): string | null => (day === todayIso() ? null : new Date(`${day}T12:00:00`).toISOString());

export function CropCycleSheet({
  cycle,
  open,
  onOpenChange,
}: {
  cycle: CropCycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { g, named, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles(true);
  const events = useCropCycleEvents(open ? cycle?.id : undefined);
  const [current, setCurrent] = useState<CropCycle | null>(cycle);
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState("");
  const [day, setDay] = useState(todayIso());
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCurrent(cycle);
    setPanel(null);
  }, [cycle]);
  useEffect(() => {
    setNote("");
    setDay(todayIso());
    setQuantity("");
  }, [panel]);

  const profile = useMemo(
    () => profiles.data?.find((p) => p.id === current?.crop.id) ?? null,
    [profiles.data, current?.crop.id],
  );
  const stages = profile?.stages ?? (current ? [current.stage] : []);
  const stageIndex = stages.findIndex((s) => s.id === current?.stage.id);
  const stageName = (stage: CropStage | undefined, index = 0) =>
    stage ? named(stage.names, stage.name) || g("stageN", { n: index + 1 }) : "";

  const harvested = useMemo(() => {
    const totals = new Map<string, number>();
    (events.data ?? []).filter((e) => e.kind === "HARVEST").forEach((e) => {
      totals.set(e.unit ?? "", (totals.get(e.unit ?? "") ?? 0) + Number(e.quantity ?? 0));
    });
    return [...totals.entries()];
  }, [events.data]);

  if (!current) return null;
  const active = current.status === "ACTIVE";
  const archived = current.status === "ARCHIVED";
  const unitLabel = (u?: string | null) =>
    u && ["kg", "crates", "heads"].includes(u) ? g(`unit_${u}` as GreenhouseTextKey) : u ?? "";

  const run = async (work: () => Promise<CropCycle | void>, done: string) => {
    setBusy(true);
    try {
      const updated = await work();
      if (updated) setCurrent(updated);
      await refresh();
      toast.success(done);
      setPanel(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, done));
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!panel) return;
    const pk = currentProductKey();
    switch (panel.kind) {
      case "stage":
        return run(
          () => cropCycleService.changeStage(workspaceId, pk, current.id, {
            stageId: panel.stage.id,
            note: note.trim() || null,
            occurredAt: instantOf(day),
          }),
          g("recorded"),
        );
      case "observe":
        return run(async () => {
          await cropCycleService.observe(workspaceId, pk, current.id, { note: note.trim(), occurredAt: instantOf(day) });
        }, g("recorded"));
      case "harvest":
        return run(async () => {
          await cropCycleService.harvest(workspaceId, pk, current.id, {
            quantity: Number(quantity),
            unit,
            note: note.trim() || null,
            occurredAt: instantOf(day),
          });
        }, g("recorded"));
      case "complete":
        return run(() => cropCycleService.complete(workspaceId, pk, current.id, note.trim()), g("recorded"));
      case "archive":
        return run(async () => {
          await cropCycleService.archive(workspaceId, pk, current.id, note.trim());
          onOpenChange(false);
        }, g("recorded"));
    }
  };

  const canConfirm =
    !busy &&
    (panel?.kind === "observe" ? !!note.trim() : panel?.kind === "harvest" ? Number(quantity) > 0 && !!unit : true);

  const eventText = (e: CropCycleEvent) => {
    const stage = stages.find((s) => s.id === e.stageId);
    const stageLabel = stageName(stage, stages.indexOf(stage as CropStage));
    switch (e.kind) {
      case "STARTED":
        return g("event_STARTED", { stage: stageLabel });
      case "STAGE":
        return g("event_STAGE", { stage: stageLabel });
      case "HARVEST":
        return g("event_HARVEST", { q: formatNumber(Number(e.quantity ?? 0)), u: unitLabel(e.unit) });
      default:
        return g(`event_${e.kind}` as GreenhouseTextKey);
    }
  };
  const EVENT_ICON = {
    STARTED: Sprout,
    STAGE: TrendingUp,
    OBSERVATION: Eye,
    HARVEST: ShoppingBasket,
    COMPLETED: Flag,
    ARCHIVED: Archive,
  } as const;

  const planted = daysSince(current.plantedOn);
  const toHarvest = current.expectedHarvestOn ? daysUntil(current.expectedHarvestOn) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={language === "en" ? "right" : "left"} className="w-full sm:max-w-xl overflow-y-auto" data-uniform-type>
        <SheetHeader className="text-start">
          <div className="flex items-start gap-3">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
              <CropIcon icon={current.crop.icon} className="h-9 w-9" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {named(current.crop.names, current.crop.name)}
                {current.variety && <span className="text-muted-foreground font-normal"> · {current.variety}</span>}
              </SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[current.greenhouseName, current.assetName].filter(Boolean).join(" › ")}
                </span>
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", STATUS_TONE[current.status])}>
                  {g(`status_${current.status}` as GreenhouseTextKey)}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Fact label={g("planted")} value={formatDate(current.plantedOn, language)} hint={g("dayN", { n: planted + 1 })} />
            <Fact
              label={g("expectedHarvest")}
              value={current.expectedHarvestOn ? formatDate(current.expectedHarvestOn, language) : g("notSet")}
              hint={
                toHarvest == null || !active
                  ? undefined
                  : toHarvest > 0
                    ? g("daysToHarvest", { n: toHarvest })
                    : g("harvestDue")
              }
            />
            <Fact
              label={g("stage")}
              value={stageName(current.stage, stageIndex)}
              hint={active ? g("inStageForN", { n: daysSince(current.stageSince) }) : undefined}
            />
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-3">{g("growthStages")}</h3>
            <ol className="flex flex-wrap gap-1.5">
              {stages.map((stage, index) => {
                const isCurrent = stage.id === current.stage.id;
                const done = stageIndex >= 0 && index < stageIndex;
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      disabled={!active || isCurrent}
                      onClick={() => setPanel({ kind: "stage", stage })}
                      title={active && !isCurrent ? g("moveToStage", { stage: stageName(stage, index) }) : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                        isCurrent && "border-emerald-500 bg-emerald-500 text-white",
                        done && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
                        !isCurrent && !done && "bg-card text-muted-foreground",
                        active && !isCurrent && "hover:border-emerald-400 hover:text-foreground",
                      )}
                    >
                      <span className="tabular-nums">{formatNumber(index + 1)}</span>
                      {stageName(stage, index)}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-3">{g("stageTargets")}</h3>
            <StageTargets stage={stages[stageIndex] ?? current.stage} />
            {current.stage.irrigation && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{g("irrigation")}: </span>
                {current.stage.irrigation}
              </p>
            )}
          </section>

          {!archived && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPanel({ kind: "observe" })}>
                <Eye className="h-4 w-4" /> {g("addObservation")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPanel({ kind: "harvest" })}>
                <ShoppingBasket className="h-4 w-4" /> {g("recordHarvest")}
              </Button>
              {active && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPanel({ kind: "complete" })}>
                  <CheckCircle2 className="h-4 w-4" /> {g("completeCycle")}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setPanel({ kind: "archive" })}>
                <Archive className="h-4 w-4" /> {g("archiveCycle")}
              </Button>
            </div>
          )}

          {panel && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20 p-4 space-y-3">
              <p className="text-sm font-medium">
                {panel.kind === "stage" && g("moveToStage", { stage: stageName(panel.stage, stages.indexOf(panel.stage)) })}
                {panel.kind === "observe" && g("addObservation")}
                {panel.kind === "harvest" && g("recordHarvest")}
                {panel.kind === "complete" && g("completeCycle")}
                {panel.kind === "archive" && g("archiveCycle")}
              </p>
              {panel.kind === "stage" && (
                <p className="text-xs text-muted-foreground">
                  {g("moveStageConfirm", { stage: stageName(panel.stage, stages.indexOf(panel.stage)) })}
                </p>
              )}
              {panel.kind === "complete" && <p className="text-xs text-muted-foreground">{g("completeConfirm", { zone: current.assetName })}</p>}
              {panel.kind === "archive" && <p className="text-xs text-muted-foreground">{g("archiveConfirm")}</p>}

              {panel.kind === "harvest" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{g("quantity")}</Label>
                    <Input type="number" min="0" step="any" dir="ltr" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{g("unit")}</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["kg", "crates", "heads"].map((u) => (
                          <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {(panel.kind === "stage" || panel.kind === "observe" || panel.kind === "harvest") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{panel.kind === "stage" ? g("stageBegan") : g("when")}</Label>
                  <DayPicker value={day} onChange={(d) => setDay(d || todayIso())} />
                </div>
              )}
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={panel.kind === "observe" ? g("observationPh") : panel.kind === "complete" || panel.kind === "archive" ? g("closingNote") : g("notes")}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPanel(null)}>{g("cancel")}</Button>
                <Button size="sm" disabled={!canConfirm} onClick={confirm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {g("confirm")}
                </Button>
              </div>
            </div>
          )}

          {harvested.length > 0 && (
            <div className="rounded-lg border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">{g("totalHarvest")}: </span>
              <span className="font-semibold">
                {harvested.map(([u, q]) => `${formatNumber(Math.round(q * 1000) / 1000)} ${unitLabel(u)}`).join(" · ")}
              </span>
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{g("history")}</h3>
              {profile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate(localizedPath(`/crops/${profile.id}`, language))}
                >
                  <Pencil className="h-3.5 w-3.5" /> {g("editCropProfile")}
                </Button>
              )}
            </div>
            <ol className="relative space-y-4 border-s ps-5">
              {[...(events.data ?? [])].reverse().map((e) => {
                const Icon = EVENT_ICON[e.kind];
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -start-[29px] top-0 h-6 w-6 rounded-full border bg-background inline-flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                    <div className="text-sm font-medium">{eventText(e)}</div>
                    {e.note && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{e.note}</p>}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {e.kind === "STARTED" ? formatDate(e.occurredAt, language) : formatDateTime(e.occurredAt, language)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 min-w-0">
      <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      <div className="text-sm font-semibold truncate">{value}</div>
      {hint && <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">{hint}</div>}
    </div>
  );
}
