import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";

/* AI Inference's own small pieces.
 *
 * Everything with behaviour — the list toolbar, tables, dialogs, form
 * controls — comes from the shared component families this panel already has.
 * What lives here is the handful of arrangements this product's design asks
 * for and nothing else does: the metric card with a tinted icon, the page
 * header with its project picker, and the preview footer.
 */

/** Digits in the reader's script, for anything counted. */
export function useNum() {
  const language = useAppLanguage();
  return (value: number | string) => localizeDigits(language, value);
}

/** A price or a token count, grouped, in the reader's digits. */
export function useAmount() {
  const num = useNum();
  return (value: number) => num(value.toLocaleString("en-US"));
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

const TONES = {
  brand: "bg-primary/10 text-primary",
  blue: "bg-sky-500/10 text-sky-500",
  violet: "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-600",
  muted: "bg-muted text-muted-foreground",
} as const;

export type Tone = keyof typeof TONES;

export function IconTile({ icon: Icon, tone = "brand", className }: { icon: LucideIcon; tone?: Tone; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[tone], className)}>
      <Icon className="size-[18px]" />
    </span>
  );
}

/**
 * The four-across metric row the design opens every page with: label and a
 * tinted icon on one line, then the figure and its unit. `active` gives the
 * first card the brand outline the mockups show.
 */
export function MetricCard({
  label,
  value,
  unit,
  icon,
  tone = "brand",
  active,
  foot,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  active?: boolean;
  foot?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        active ? "border-primary/40 bg-primary/[0.04]" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <IconTile icon={icon} tone={tone} className="size-7" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold leading-none text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
      {foot && <div className="mt-1 text-xs text-muted-foreground">{foot}</div>}
    </div>
  );
}

export function MetricRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/** Title, one line of description, and whatever action the page offers. */
export function PageHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className={cn("px-5 pb-5", bodyClassName)}>{children}</div>
    </div>
  );
}

const BADGES = {
  chat: "bg-primary/10 text-primary",
  code: "bg-primary/10 text-primary",
  embedding: "bg-violet-500/10 text-violet-600",
  ok: "bg-emerald-500/10 text-emerald-600",
  warn: "bg-primary/10 text-primary",
  bad: "bg-destructive/10 text-destructive",
  gray: "bg-muted text-muted-foreground",
} as const;

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof BADGES }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium", BADGES[tone])}>
      {children}
    </span>
  );
}

/** Label on one side, value on the other — the detail pages' workhorse. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
      <span className="text-[13.5px] font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * The line every AI Inference page ends on.
 *
 * It is not decoration. There is no inference service behind these screens
 * yet, and a page of prices and token counts that does not say so reads as a
 * bill. See lib/catalog.ts.
 */
export function PreviewFooter() {
  const t = useT();
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        {t("All systems operational")}
      </span>
      <span>{t("Shared inference · Tehran")}</span>
    </div>
  );
}

/** The standing note that none of these figures were measured. */
export function PreviewNotice() {
  const t = useT();
  return (
    <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
      {t("Illustrative models, prices and usage data · Not a live service")}
    </p>
  );
}

/** The frame every page in this product sits in. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 lg:p-6">
      {children}
      <PreviewFooter />
      <PreviewNotice />
    </div>
  );
}
