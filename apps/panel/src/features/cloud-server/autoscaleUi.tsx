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
import { setDesired, type AutoScaleGroup, type GroupHealth } from "./lib/autoscaleStore";

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

/** Change the group's desired capacity by hand, within its min and max. */
export function CapacityDialog({ group, onClose }: { group: AutoScaleGroup | null; onClose: () => void }) {
  const t = useT();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const [value, setValue] = useState(0);
  useEffect(() => setValue(group?.desired ?? 0), [group]);

  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("Change capacity")}</DialogTitle>
          <DialogDescription>
            {group &&
              t("Between {min} and {max} instances. Automatic rules carry on from the new number.", {
                min: formatNumber(group.min),
                max: formatNumber(group.max),
              })}
          </DialogDescription>
        </DialogHeader>
        {group && (
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-foreground">{t("Desired capacity")}</span>
            <Stepper value={value} min={group.min} max={group.max} onChange={setValue} label={t("Desired capacity")} />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!group || value === group.desired}
            onClick={() => {
              if (!group) return;
              setDesired(group.id, value);
              toast.success(t("Capacity set to {n}", { n: formatNumber(value) }));
              onClose();
            }}
          >
            {t("Apply")}
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
