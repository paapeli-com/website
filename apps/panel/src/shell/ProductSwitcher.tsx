import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, House, LayoutGrid } from "lucide-react";
import { PRODUCTS, solutionPath } from "@paapeli/brand/config";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

/* Adapted from apps/product/aiot/track/src/components/layout/ProductSwitcher.tsx.
   Unlike the per-remote copies it replaces, the active solution is derived
   from the URL (the host owns routing for every solution) and switching is
   a client-side navigate() — no full page reload. */

const HOME_PATH = "/Home";

/* The AI Infra rows.
 *
 * Deliberately NOT added to @paapeli/brand/config's PRODUCTS: that list is
 * also what Cloud Management's Subscriptions page offers to subscribe to
 * (see its SUBSCRIBABLE), and neither of these can be subscribed to, opened
 * or routed to yet. They are announcements in this menu and nothing more, so
 * they live in this menu. Their names match the cards on /Home.
 *
 * `featured` is the one being launched next. It shows in its tag and nothing
 * else: an outline around the row reads as the selected state, which these
 * rows can never be. */
const AI_INFRA: { id: string; name: string; tag: string; featured?: boolean }[] = [
  { id: "AIInference", name: "AI Inference", tag: "New", featured: true },
  { id: "AIAgentMaker", name: "AI Agent Maker", tag: "Soon" },
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

  /* Home is a place you can be, like a solution — lowercase, because React
     Router matches routes case-insensitively and /home is the same page. */
  const onHome = location.pathname.toLowerCase().startsWith("/home");

  const allSolutions = PRODUCTS.flatMap((p) => p.solutions ?? []);
  const activeSolution = allSolutions.find((s) => location.pathname.startsWith(solutionPath(s.id)))?.id;

  const activeProduct =
    PRODUCTS.find((p) => p.solutions?.some((s) => s.id === activeSolution)) ??
    PRODUCTS.find((p) => !p.disabled) ??
    PRODUCTS[0];
  const activeSolutionName =
    activeProduct.solutions?.find((s) => s.id === activeSolution)?.name ?? activeProduct.name;

  const selectSolution = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setOpen(false);
    window.localStorage.setItem("paapeli_solution", id);
    if (id === activeSolution) return;
    navigate(solutionPath(id));
  };

  const selectHome = () => {
    setOpen(false);
    if (onHome) return;
    navigate(HOME_PATH);
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
        <span className="flex-1 whitespace-nowrap text-start">
          {onHome ? t("Home") : t(activeSolutionName)}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-popover py-1.5 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Switch Product")}
          </div>

          {/* Home sits above the products rather than inside one: it is the
              account, not a product you subscribe to. */}
          <button
            onClick={selectHome}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
              onHome ? "bg-primary/10 font-semibold text-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            <House className={cn("size-4", onHome ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1 text-start">{t("Home")}</span>
            {onHome && <Check className="size-4 text-primary" />}
          </button>

          {PRODUCTS.map((p) => {
            /* AIoT's solutions ship and route; AI Infra's are the local rows
               above, which don't. */
            const solutions = p.solutions ?? [];
            const announcements = p.id === "ai" ? AI_INFRA : [];
            if (solutions.length === 0 && announcements.length === 0) return null;

            return (
              <div key={p.id} className="mt-1">
                <div className="flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium text-foreground">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="flex-1 text-start">{t(p.name)}</span>
                </div>

                <div className="space-y-0.5 px-2 pb-0.5 ms-[18px]">
                  {solutions.map((s) => {
                    const isActive = s.id === activeSolution && !onHome;
                    return (
                      <button
                        key={s.id}
                        onClick={() => selectSolution(s.id, s.disabled)}
                        disabled={s.disabled}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                          s.disabled
                            ? "cursor-not-allowed text-muted-foreground/50"
                            : isActive
                              ? "bg-primary/10 font-semibold text-foreground"
                              : "text-foreground hover:bg-muted",
                        )}
                      >
                        <span className="flex-1 text-start">{t(s.name)}</span>
                        {isActive && <Check className="size-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}

                  {announcements.map((a) => (
                    /* Not a button: there is nowhere for it to go yet. */
                    <div
                      key={a.id}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground"
                    >
                      <span className="flex-1 text-start">{t(a.name)}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          a.featured ? "text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {t(a.tag)}
                      </span>
                    </div>
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
