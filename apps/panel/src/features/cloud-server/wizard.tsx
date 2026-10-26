import { type KeyboardEvent, type ReactNode } from "react";
import { Check, Info, MapPin, Pencil, type LucideIcon } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { REGIONS } from "./lib/catalog";
import { CountryFlag, CountryOutline } from "./lib/regionArt";

/* The pieces every Cloud Server wizard is made of: the cloud and GPU server
 * wizard, and the dedicated server wizard. One copy, so they cannot drift
 * apart: the step bar, a step's heading, a choosable card, a setting row,
 * a note, a pill, the review blocks, the summary rows, and the region picker.
 */

/** Region and zone: a card per region, the zone picked inside the card it
    belongs to. One region for now; the grid takes more as they open. */
export function RegionPicker({
  regionId,
  zone,
  onChange,
  note,
}: {
  regionId: string;
  zone: string;
  onChange: (regionId: string, zone: string) => void;
  /** The line under the cards. */
  note: string;
}) {
  const t = useT();
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <MapPin className="size-[18px]" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("Region and availability zone")}</h3>
          <p className="text-xs text-muted-foreground">{t("Choose where your server will be located.")}</p>
        </div>
      </div>

      <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {REGIONS.map((r) => {
          const selected = r.id === regionId;
          return (
            <OptionCard key={r.id} selected={selected} onSelect={() => r.id !== regionId && onChange(r.id, r.zones[0])}>
              <div className="relative">
                <CountryOutline
                  country={r.country}
                  className={cn("pointer-events-none absolute -top-1 start-0 h-16 w-20", selected ? "text-primary/15" : "text-muted")}
                />
                <div className="relative ps-24">
                  <CountryFlag country={r.country} className="h-3.5 w-6 rounded-[2px]" />
                  <p className="mt-1.5 text-base font-semibold text-foreground">{t(r.countryName)}</p>
                  <p className="text-xs text-muted-foreground">{t(r.city)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((tag) => (
                      <Pill key={tag} tone="ok">
                        {t(tag)}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                <p className="mb-1.5 text-xs font-medium text-foreground">{t("Availability zone")}</p>
                <Select dir="ltr" value={selected ? zone : r.zones[0]} onValueChange={(v) => onChange(r.id, v)}>
                  <SelectTrigger className="h-9" dir="ltr">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {r.zones.map((z, i) => (
                      <SelectItem key={z} value={z}>
                        {i === 0 ? `${z} (${t("Default")})` : z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </OptionCard>
          );
        })}
      </div>

      <Note className="mt-4">{note}</Note>
    </div>
  );
}

/** The alert rule wizard's step indicator, mark for mark: small numbered
    dots with the label beside them and a short rule between. Any step can be
    opened. A step left short after a Create attempt is marked red. */
export function StepBar({
  current,
  labels,
  done,
  invalid,
  onSelect,
}: {
  current: number;
  labels: string[];
  done: (i: number) => boolean;
  invalid: (i: number) => boolean;
  onSelect: (i: number) => void;
}) {
  const language = useAppLanguage();
  const { isRTL } = useLanguage();
  return (
    <nav className="mb-5 mt-1 flex items-center gap-1 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const isCurrent = i === current;
        const isDone = done(i);
        const isBad = invalid(i);
        return (
          <div key={label} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex cursor-pointer items-center gap-1 rounded-full outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  isBad
                    ? "bg-destructive/10 text-destructive"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {isDone && !isBad ? <Check className="h-3.5 w-3.5" /> : localizeDigits(language, i + 1)}
              </span>
              <span
                className={cn(
                  /* A step larger in Persian and Arabic, whose script reads
                     smaller at the same size; the alert rule wizard does the
                     same. */
                  "hidden whitespace-nowrap sm:inline",
                  isRTL ? "text-sm" : "text-xs",
                  isBad ? "text-destructive" : isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
          </div>
        );
      })}
    </nav>
  );
}

export function StepSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-[18px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A choosable card. Selected is a thin brand edge and a faint tint. */
export function OptionCard({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "relative cursor-pointer rounded-xl border p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30 hover:bg-muted/30",
      )}
    >
      {selected && (
        <span className="absolute end-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
      <div className="pe-5">{children}</div>
    </div>
  );
}

/** One setting: icon, what it is, and its control on the far side. */
export function SettingRow({
  icon: Icon,
  title,
  description,
  control,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description: string;
  control?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children && <div className="ps-7">{children}</div>}
    </div>
  );
}

/** Neutral, not blue: an aside, not an alert. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "ok" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        tone === "ok" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t("Edit")}
        </Button>
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

export function ReviewLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-end font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ms-auto min-w-0 truncate text-end font-medium text-foreground">{value}</span>
    </div>
  );
}
