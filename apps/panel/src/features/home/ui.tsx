import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* The Home page's own primitives. Deliberately local rather than imported
   from features/cloud-management/ui: that module belongs to another lazy
   chunk, and importing across the boundary would merge the two. They are
   small enough that a copy costs less than the coupling. */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.18)] dark:shadow-none", className)}>{children}</div>;
}

/** The small-caps label above each band of product cards ("AIoT", "Platform"). */
export function SectionLabel({ children, to }: { children: ReactNode; to?: string }) {
  const className = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
  if (!to) return <h2 className={className}>{children}</h2>;
  // A family's label opens that family's own page.
  return (
    <h2 className={className}>
      <Link to={to} className="hover:text-primary hover:underline">{children}</Link>
    </h2>
  );
}

export type PillTone = "gray" | "brand" | "bad";

const PILL_TONES: Record<PillTone, string> = {
  gray: "bg-muted text-muted-foreground",
  brand: "bg-primary/10 text-primary",
  bad: "bg-destructive/10 text-destructive",
};

export function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: PillTone }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-medium",
        PILL_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A pill's footprint while the figure behind it is still loading. */
export function PillSkeleton() {
  return <span className="inline-block h-[26px] w-20 animate-pulse rounded-md bg-muted" aria-hidden />;
}

/* One colour per product, so the cards tell themselves apart at a glance. */
export type IconTone = "brand" | "blue" | "green" | "violet" | "sky";
const ICON_TONES: Record<IconTone, string> = {
  brand: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export function IconTile({
  icon: Icon,
  tone = "brand",
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        ICON_TONES[tone],
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

/** Title badge on a product card: "New", "Phase 2". */
export function Tag({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "brand" }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        tone === "brand" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
