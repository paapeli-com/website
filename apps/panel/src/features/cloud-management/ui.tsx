import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "border border-border bg-card text-foreground hover:bg-muted",
    danger: "border border-destructive/30 bg-card text-destructive hover:bg-destructive/10",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-foreground">{children}</label>;
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "ok" | "info" | "warn" | "bad" | "gray" | "brand" }) {
  const styles = {
    ok: "bg-emerald-500/10 text-emerald-600",
    info: "bg-blue-500/10 text-blue-500",
    warn: "bg-primary/10 text-primary",
    bad: "bg-destructive/10 text-destructive",
    gray: "bg-muted text-muted-foreground",
    brand: "bg-primary/10 text-primary",
  }[tone];
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold", styles)}>
      {children}
    </span>
  );
}

/* Cloud Management has no translation table of its own — its copy is written
   inline in English. The shell's table is keyed by English source string and
   reads the same global language store, so it is what translates this one
   string into "فاقد دیتا" / "لا توجد بيانات". */

/**
 * The placeholder for a surface with no backend behind it — distinct from
 * EmptyState below, which reports that a real, wired-up list came back empty
 * ("No workspaces yet", "No pending invitations").
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/**
 * Loading placeholder for this feature's lists. The structure of what is
 * loading, with a spinner kept on top — the same convention the factory
 * feature's ListPageSkeleton follows, so the "it's loading" signal survives
 * alongside the skeleton rather than being replaced by it.
 *
 * `variant` picks the row shape: "tile" for the workspace pickers (avatar
 * tile, two lines of text, status badge), "row" for the bordered product and
 * invitation rows.
 */
export function SkeletonList({
  rows = 3,
  variant = "row",
  className,
}: {
  rows?: number;
  variant?: "row" | "tile";
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) =>
          variant === "tile" ? (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ) : (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <span className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-3.5 w-28" />
              </span>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ),
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-background p-2 shadow-sm">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </span>
      </div>
    </div>
  );
}

export function NoData({ className }: { className?: string }) {
  const t = useShellT();
  return (
    <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>{t("Nothing here yet.")}</p>
  );
}

/** The same message inline, where a single fabricated figure used to sit. */
export function NoDataValue({ className }: { className?: string }) {
  const t = useShellT();
  return <span className={cn("text-sm font-normal text-muted-foreground", className)}>—</span>;
}

export function EmptyState({ title, description }: { title: ReactNode; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border py-12 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Card-wrapped data table, optionally with a header row (title + actions). */
export function Table({ columns, rows, head, className }: { columns: ReactNode[]; rows: ReactNode[][]; head?: ReactNode; className?: string }) {
  return (
    <Card className={cn("flex flex-col overflow-hidden p-0", className)}>
      {head && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">{head}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              {columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap border-b border-border px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4">
                  <NoData />
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/60 last:border-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn("whitespace-nowrap px-4 py-3 text-[13.5px] text-muted-foreground", ci === 0 && "font-medium text-foreground")}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-border">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors",
            t === value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: string; tone?: "ok" | "bad" }) {
  return (
    <Card className="flex flex-col gap-1.5 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold leading-tight text-foreground">{value}</span>
      {note && (
        <span className={cn("text-xs", tone === "ok" ? "text-emerald-600" : tone === "bad" ? "text-destructive" : "text-muted-foreground")}>
          {note}
        </span>
      )}
    </Card>
  );
}

export function ProgressBar({ pct, tone }: { pct: number; tone?: "bad" }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", tone === "bad" ? "bg-destructive" : "bg-primary")}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <div className={cn("rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground", mono && "font-mono text-xs")}>
        {value}
      </div>
    </label>
  );
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex h-[22px] w-10 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "justify-end bg-primary" : "justify-start bg-muted-foreground/30",
      )}
    >
      <span className="size-[18px] rounded-full bg-white shadow-sm" />
    </button>
  );
}

const AVATAR_COLORS = ["bg-primary", "bg-blue-500", "bg-emerald-600", "bg-slate-500", "bg-rose-600", "bg-slate-400"];

export function Avatar({ name, colorIndex = 0 }: { name: string; colorIndex?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        AVATAR_COLORS[colorIndex % AVATAR_COLORS.length],
      )}
    >
      {initials}
    </span>
  );
}

/** Icon + title + blurb + optional call-to-action, used for feature/product tiles. */
export function IconTile({
  icon: Icon,
  title,
  children,
  cta,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-[18px]" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {children && <p className="text-[13px] leading-relaxed text-muted-foreground">{children}</p>}
      </div>
      {cta && (
        <button type="button" onClick={onClick} className="text-start text-[13px] font-semibold text-primary hover:underline">
          {cta}
        </button>
      )}
    </Card>
  );
}

/** Title + description + control row, for grouped settings lists. */
export function SettingRow({ title, description, control }: { title: string; description: string; control: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-border/60 py-3.5 last:border-0">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13.5px] font-medium text-foreground">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
      {control}
    </div>
  );
}

/** Minimal SVG area/trend chart — no charting library dependency for a single sparkline. */
export function AreaChart({ points }: { points: number[] }) {
  const gradientId = useId();
  const w = 600;
  const h = 180;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 20) - 10] as const);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const areaPath = `${linePath} L${w} ${h} L0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} y1={h * f} x2={w} y2={h * f} stroke="hsl(var(--border))" />
      ))}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
