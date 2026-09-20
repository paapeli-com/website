import { useEffect, useRef, useState, type ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, Factory, House, LayoutGrid, MapPin, Server, Sparkles } from "lucide-react";
import { PRODUCTS, solutionPath } from "@paapeli/brand/config";
import { AI_INFERENCE_BASE } from "@/shell/nav/aiInferenceNav";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

/* The product switcher.
 *
 * Rows borrow the create menu's hover and selected treatment — a transparent
 * border that turns brand-coloured over a tinted background — because this is
 * the same kind of thing: a short list of destinations picked from a header
 * popover. One hover state for both rather than two that nearly match.
 *
 * Home sits above the products behind its own divider: it is the account, not
 * a product. AIoT and AI Infra are divided the same way, so the two families
 * read as two families rather than one long list.
 *
 * The active solution is derived from the URL — the shell owns routing for
 * every product — and switching is a client-side navigate(), no page reload.
 */

const HOME_PATH = "/Home";

type Row = {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  tag?: string;
  /** Absent means the row is an announcement: nowhere to go yet. */
  path?: string;
};

const SOLUTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  GPSTracking: MapPin,
  SmartFactory: Factory,
};

/* Maturity tags live here rather than in @paapeli/brand/config's PRODUCTS.
   That list is also what Cloud Management's Subscriptions page offers to
   subscribe to, and "Beta" is a statement about these rows, not a property of
   a subscribable product. */
const SOLUTION_TAGS: Record<string, string> = {
  GPSTracking: "Beta",
  SmartFactory: "Beta",
};

/* AI Infra's rows, for the same reason: neither can be subscribed to, and
   only one of them can be opened. */
const AI_INFRA_ROWS: Row[] = [
  { id: "AIInference", name: "AI Inference", icon: Server, tag: "Alpha", path: AI_INFERENCE_BASE },
  { id: "AIAgentMaker", name: "AI Agent Maker", icon: Sparkles, tag: "Soon" },
];

export function ProductSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const t = useShellT();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  /* Lowercase, because React Router matches routes that way: /home is the
     same page as /Home. */
  const path = location.pathname.toLowerCase();
  const onHome = path.startsWith("/home");
  const onAiInference = path.startsWith(AI_INFERENCE_BASE.toLowerCase());

  const allSolutions = PRODUCTS.flatMap((p) => p.solutions ?? []);
  const activeSolution = allSolutions.find((s) => location.pathname.startsWith(solutionPath(s.id)))?.id;

  const activeProduct =
    PRODUCTS.find((p) => p.solutions?.some((s) => s.id === activeSolution)) ??
    PRODUCTS.find((p) => !p.disabled) ??
    PRODUCTS[0];
  const activeSolutionName =
    activeProduct.solutions?.find((s) => s.id === activeSolution)?.name ?? activeProduct.name;

  const triggerLabel = onHome ? t("Home") : onAiInference ? t("AI Inference") : t(activeSolutionName);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const selectSolution = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setOpen(false);
    window.localStorage.setItem("paapeli_solution", id);
    if (id === activeSolution) return;
    navigate(solutionPath(id));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 min-w-[150px] items-center gap-2.5 rounded-xl border px-4 text-sm font-semibold text-foreground transition-colors",
          open ? "border-primary/30 bg-primary/10" : "border-border bg-transparent hover:bg-muted/40",
        )}
      >
        <LayoutGrid className="size-4 text-primary" />
        <span className="flex-1 whitespace-nowrap text-start">{triggerLabel}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-[19rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Switch Product")}
          </div>

          <MenuRow icon={House} label={t("Home")} active={onHome} onSelect={() => go(HOME_PATH)} />

          <div className="my-2 border-t border-border" />

          {PRODUCTS.map((product, index) => {
            const solutions = product.solutions ?? [];
            const announcements = product.id === "ai" ? AI_INFRA_ROWS : [];
            if (solutions.length === 0 && announcements.length === 0) return null;

            return (
              <div key={product.id}>
                {index > 0 && <div className="my-2 border-t border-border" />}

                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">{t(product.name)}</span>
                </div>

                <div className="space-y-0.5">
                  {solutions.map((s) => (
                    <MenuRow
                      key={s.id}
                      icon={SOLUTION_ICONS[s.id] ?? LayoutGrid}
                      label={t(s.name)}
                      tag={SOLUTION_TAGS[s.id]}
                      active={s.id === activeSolution && !onHome && !onAiInference}
                      disabled={s.disabled}
                      onSelect={() => selectSolution(s.id, s.disabled)}
                    />
                  ))}

                  {announcements.map((row) => (
                    <MenuRow
                      key={row.id}
                      icon={row.icon}
                      label={t(row.name)}
                      tag={row.tag}
                      active={!!row.path && row.path === AI_INFERENCE_BASE && onAiInference}
                      onSelect={row.path ? () => go(row.path!) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Brand for what is being launched next, quiet for everything else. */
const TAG_TONE: Record<string, string> = {
  Alpha: "bg-primary/10 text-primary",
  Beta: "bg-muted text-muted-foreground",
  Soon: "bg-muted text-muted-foreground",
};

function MenuRow({
  icon: Icon,
  label,
  tag,
  active,
  disabled,
  onSelect,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tag?: string;
  active?: boolean;
  disabled?: boolean;
  /** Absent for a row with nowhere to go: it renders inert rather than as a
      button that does nothing when clicked. */
  onSelect?: () => void;
}) {
  const t = useShellT();
  const interactive = !!onSelect && !disabled;
  const Element = interactive ? "button" : "div";

  return (
    <Element
      {...(interactive ? { type: "button" as const, onClick: onSelect } : {})}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-start text-sm transition-colors",
        active
          ? "border-primary/40 bg-primary/10 font-semibold text-foreground"
          : interactive
            ? "border-transparent text-foreground hover:border-primary/30 hover:bg-primary/5"
            : "border-transparent text-foreground",
        disabled && "cursor-not-allowed text-muted-foreground/60",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {tag && (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            TAG_TONE[tag] ?? TAG_TONE.Soon,
          )}
        >
          {t(tag)}
        </span>
      )}
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </Element>
  );
}
