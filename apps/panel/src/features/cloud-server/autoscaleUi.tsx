import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { setDesired, updateGroup, type AutoScaleGroup, type GroupHealth } from "./lib/autoscaleStore";
import { PLANS } from "./lib/catalog";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";

/* Pieces the Auto Scale list and the group page share. */

/** Healthy, or scaling while new instances come up. */
export function HealthBadge({ health }: { health: GroupHealth }) {
  const t = useT();
  if (health === "scaling") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("Scaling")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {t("Healthy")}
    </span>
  );
}

/** A number stepper: minus, the value, plus. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const { formatNumber } = useLanguage();
  return (
    <div className="inline-flex items-center rounded-lg border border-border" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="-1"
        className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-foreground">{formatNumber(value)}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="+1"
        className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Change the group's desired capacity by hand, within its min and max, in
    two steps: pick the number, then confirm what it adds or removes and what
    that does to the monthly cost. */
export function CapacityDialog({ group, onClose }: { group: AutoScaleGroup | null; onClose: () => void }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const [value, setValue] = useState(0);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    setValue(group?.desired ?? 0);
    setConfirming(false);
  }, [group]);

  const delta = group ? value - group.desired : 0;
  const perInstance = group ? (PLANS.find((p) => p.id === group.planId)?.monthly[currency] ?? 0) : 0;

  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[440px]">
        {group && !confirming && (
          <>
            <DialogHeader>
              <DialogTitle>{t("Change capacity")}</DialogTitle>
              <DialogDescription>
                {t("Between {min} and {max} instances. Automatic rules carry on from the new number.", {
                  min: formatNumber(group.min),
                  max: formatNumber(group.max),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-4 py-2">
              <span className="text-sm text-foreground">{t("Desired capacity")}</span>
              <Stepper value={value} min={group.min} max={group.max} onChange={setValue} label={t("Desired capacity")} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                {fx("cancel")}
              </Button>
              <Button disabled={delta === 0} onClick={() => setConfirming(true)}>
                {t("Continue")}
              </Button>
            </DialogFooter>
          </>
        )}
        {group && confirming && (
          <>
            <DialogHeader>
              <DialogTitle>
                {delta > 0
                  ? t("Add {n} instances?", { n: formatNumber(delta) })
                  : t("Remove {n} instances?", { n: formatNumber(-delta) })}
              </DialogTitle>
              <DialogDescription>
                {delta > 0
                  ? t("{n} new instances will be created from the group's template.", { n: formatNumber(delta) })
                  : t("{n} instances will be deleted, newest first, with their disks.", { n: formatNumber(-delta) })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 rounded-lg border border-border px-3.5 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("Instances")}</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatNumber(group.desired)} → {formatNumber(value)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("Monthly cost")}</span>
                <span className={cn("font-medium", delta > 0 ? "text-foreground" : "text-emerald-700 dark:text-emerald-400")}>
                  {delta > 0 ? "+" : "−"}
                  {format(Math.abs(delta) * perInstance)}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t("Back")}
              </Button>
              <Button
                variant={delta > 0 ? "default" : "destructive"}
                onClick={() => {
                  setDesired(group.id, value);
                  toast.success(t("Capacity set to {n}", { n: formatNumber(value) }));
                  onClose();
                }}
              >
                {delta > 0 ? t("Yes, add {n}", { n: formatNumber(delta) }) : t("Yes, remove {n}", { n: formatNumber(-delta) })}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Pause or resume automatic scaling, after saying what that means. */
export function PauseDialog({ group, onClose }: { group: AutoScaleGroup | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const pausing = !!group && !group.paused;
  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{pausing ? t("Pause scaling?") : t("Resume scaling?")}</DialogTitle>
          <DialogDescription>
            {pausing
              ? t("The group keeps its current instances and stops adding or removing them by its rules, until you resume. Failed instances are still replaced.")
              : t("The group goes back to adding and removing instances by its rules.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={() => {
              if (!group) return;
              updateGroup(group.id, { paused: pausing }, pausing ? "Scaling paused" : "Scaling resumed");
              toast.success(pausing ? t("Scaling paused") : t("Scaling resumed"));
              onClose();
            }}
          >
            {pausing ? t("Pause scaling") : t("Resume scaling")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A KPI card in the panel's style, for the group page (not a filter). */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof CheckCircle2;
  accent: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card bg-gradient-to-br px-3 py-2.5", bg)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", accent)} />
      </div>
      <div className="mt-1 text-xl font-bold leading-none text-foreground">{value}</div>
    </div>
  );
}
