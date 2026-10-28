import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Info, MapPin, Pencil, type LucideIcon } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Slider } from "@/features/factory/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { IMAGES, REGIONS } from "./lib/catalog";
import { OsLogo } from "./lib/osLogos";
import type { ServerRecord } from "./lib/serverStore";
import { CountryFlag, CountryOutline } from "./lib/regionArt";

/* The pieces every Cloud Server wizard is made of: the cloud and GPU server
 * wizard, and the dedicated server wizard. One copy, so they cannot drift
 * apart: the step bar, a step's heading, a choosable card, a setting row,
 * a note, a pill, the review blocks, the summary rows, the region picker
 * (large, for the server wizards) and the region box (compact, everywhere
 * else), the equal field boxes the compact pages are laid out in, and the
 * size slider.
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
                <Select value={selected ? zone : r.zones[0]} onValueChange={(v) => onChange(r.id, v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {r.zones.map((z, i) => (
                      <SelectItem key={z} value={z}>
                        <ZoneLabel zone={z} isDefault={i === 0} />
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
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Beside the title, at the far end. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
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
      <div className="min-w-0">{children}</div>
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

/** One field in a row of equal boxes: a title (with the required star), a
    line under it, then the control. The compact create pages (backup, disk,
    dedicated server, Auto Scale) start with a row of these. */
export function FieldBox({
  icon: Icon,
  title,
  required,
  description,
  children,
  className,
  pinTop,
}: {
  icon?: LucideIcon;
  title: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Keep the control under the title when the box beside it grows. */
  pinTop?: boolean;
}) {
  return (
    <div className={cn("flex h-full min-w-0 flex-col rounded-xl border border-border p-4", className)}>
      <div className="mb-3 flex items-start gap-3">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {title}
            {required && <span className="ms-1 text-destructive">*</span>}
          </h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className={pinTop ? undefined : "mt-auto"}>{children}</div>
    </div>
  );
}

/** The region picker made small, for every page but the server wizards: one
    box, the chosen region as a tinted card with its outline and flag, and
    the zone beside it. A region list appears above once there is more than
    one region. */
export function RegionBox({
  regionId,
  zone,
  onChange,
  description,
}: {
  regionId: string;
  zone: string;
  onChange: (regionId: string, zone: string) => void;
  description: string;
}) {
  const t = useT();
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  return (
    <FieldBox icon={MapPin} title={t("Region and availability zone")} description={description}>
      {REGIONS.length > 1 && (
        <Select value={region.id} onValueChange={(v) => onChange(v, REGIONS.find((r) => r.id === v)!.zones[0])}>
          <SelectTrigger className="mb-2 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {t(r.countryName)} · {t(r.city)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-primary/50 bg-primary/[0.04] p-3">
        <CountryOutline country={region.country} className="pointer-events-none absolute inset-y-0 start-[4.5rem] my-auto h-14 w-16 text-primary/15" />
        <div className="relative min-w-0">
          <CountryFlag country={region.country} className="h-3.5 w-6 rounded-[2px]" />
          <p className="mt-1 text-sm font-semibold text-foreground">{t(region.countryName)}</p>
          <p className="text-xs text-muted-foreground">{t(region.city)}</p>
        </div>
        <div className="relative w-36 shrink-0">
          <p className="mb-1 text-xs font-medium text-foreground">{t("Availability zone")}</p>
          <Select value={zone} onValueChange={(v) => onChange(region.id, v)}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {region.zones.map((z, i) => (
                <SelectItem key={z} value={z}>
                  <ZoneLabel zone={z} isDefault={i === 0} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FieldBox>
  );
}

/** "AZ-1 (Default)", the zone left-to-right inside a line in the page's direction. */
function ZoneLabel({ zone, isDefault }: { zone: string; isDefault: boolean }) {
  const t = useT();
  return (
    <span>
      <span dir="ltr">{zone}</span>
      {isDefault && <span className="text-muted-foreground"> ({t("Default")})</span>}
    </span>
  );
}

/* A disk size on a slider, as the server wizard's boot disk has it. The track
   runs on a log scale: from 10 GB to a few TB, a linear one puts 50, 100 and
   200 GB in the first sliver. On a log scale each doubling takes the same
   distance. Snaps to round sizes; the box beside it takes any size. */
const SLIDER_STEPS = 1000;
const toSlider = (gb: number, min: number, max: number) => Math.round((SLIDER_STEPS * Math.log(gb / min)) / Math.log(max / min));
const fromSlider = (pos: number, min: number, max: number) => {
  const raw = min * Math.pow(max / min, pos / SLIDER_STEPS);
  const snap = raw < 100 ? 5 : raw < 500 ? 10 : 50;
  return Math.min(max, Math.max(min, Math.round(raw / snap) * snap));
};

export function SizeSlider({
  valueGb,
  minGb,
  maxGb,
  marks,
  onChange,
  label,
}: {
  valueGb: number;
  minGb: number;
  maxGb: number;
  /** The sizes named under the track; each one sets itself. */
  marks: number[];
  onChange: (gb: number) => void;
  label: string;
}) {
  const t = useT();
  const { isRTL } = useLanguage();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const [draft, setDraft] = useState(String(valueGb));
  useEffect(() => setDraft(String(valueGb)), [valueGb]);
  const set = (gb: number) => onChange(Math.min(maxGb, Math.max(minGb, Math.round(gb))));
  const commit = () => set(Number(draft) || minGb);

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="min-w-[200px] flex-1 px-1 pt-3">
        <Slider
          dir={isRTL ? "rtl" : "ltr"}
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={[toSlider(valueGb, minGb, maxGb)]}
          onValueChange={([v]) => set(fromSlider(v, minGb, maxGb))}
          aria-label={label}
          aria-valuetext={`${valueGb} GB`}
        />
        <div className="relative mt-2 h-6">
          {marks.map((gb) => {
            const pos = toSlider(gb, minGb, maxGb) / SLIDER_STEPS;
            /* A mark at either end hangs inward from its point rather than
               centring on it, so its label stays inside the card. */
            const edge = pos <= 0.02 ? "start" : pos >= 0.98 ? "end" : "middle";
            return (
              <button
                key={gb}
                type="button"
                onClick={() => set(gb)}
                style={{ insetInlineStart: `${pos * 100}%` }}
                className={cn(
                  "absolute top-0 flex flex-col gap-0.5 whitespace-nowrap text-[11px] transition-colors",
                  edge === "start" && "items-start",
                  edge === "middle" && "-translate-x-1/2 items-center rtl:translate-x-1/2",
                  edge === "end" && "-translate-x-full items-end rtl:translate-x-full",
                  valueGb === gb ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden className="h-1.5 w-px bg-border" />
                {gb >= 1000 ? `${n(gb / 1000)} ${t("TB")}` : `${n(gb)} ${t("GB")}`}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          dir="ltr"
          inputMode="numeric"
          min={minGb}
          max={maxGb}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-9 w-24"
          aria-label={label}
        />
        <span className="text-sm text-muted-foreground">{t("GB")}</span>
      </div>
    </div>
  );
}

/** A server in a select: its system's logo, its name, and its size. */
export function ServerOption({ server }: { server: ServerRecord }) {
  const t = useT();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const image = IMAGES.find((i) => i.id === server.imageId);
  const bootGb = server.disks?.[0]?.sizeGb ?? server.diskGb;
  return (
    <span className="flex min-w-0 items-center gap-2.5 text-start">
      {image && <OsLogo id={image.id} name={image.name} color={image.color} className="size-6 shrink-0" />}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground" dir="ltr">
          {server.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {t("{cpu} vCPU · {ram} GB RAM", { cpu: n(server.vcpu), ram: n(server.ramGb) })} · {n(bootGb)} {t("GB")}
        </span>
      </span>
    </span>
  );
}
