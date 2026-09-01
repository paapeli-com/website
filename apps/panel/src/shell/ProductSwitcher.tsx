import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, LayoutGrid, MapPin, Server, Settings2, Sparkles, SquareCheckBig, type LucideIcon } from "lucide-react";
import { PRODUCTS, solutionPath } from "@paapeli/brand/config";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

/* Adapted from apps/product/aiot/track/src/components/layout/ProductSwitcher.tsx.
   Unlike the per-remote copies it replaces, the active solution is derived
   from the URL (the host owns routing for every solution) and switching is
   a client-side navigate() — no full page reload. */

const PRODUCT_ICONS: Record<string, LucideIcon> = { aiot: Sparkles, ai: Server };
const SOLUTION_ICONS: Record<string, LucideIcon> = { GPSTracking: MapPin, SmartFactory: SquareCheckBig };

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
        <span className="flex-1 whitespace-nowrap text-start">{t(activeSolutionName)}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-popover py-1.5 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Switch Product")}</div>

          {PRODUCTS.map((p) => {
            const PIcon = PRODUCT_ICONS[p.id] ?? LayoutGrid;
            const hasSolutions = !!p.solutions?.length;
            const isActiveProduct = p.id === activeProduct.id && !p.disabled;

            return (
              <div key={p.id}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm",
                    p.disabled ? "text-muted-foreground/50" : "text-foreground",
                  )}
                >
                  <span className={cn("flex size-7 items-center justify-center rounded-full", isActiveProduct ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <PIcon className="size-4" />
                  </span>
                  <span className={cn("flex-1", isActiveProduct && "font-semibold text-primary")}>{t(p.name)}</span>
                  {p.disabled && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">{t("soon")}</span>}
                </div>

                {hasSolutions && (
                  <div className="mb-1 space-y-0.5 ltr:ml-[26px] rtl:mr-[26px] border-border ltr:border-l rtl:border-r ltr:pl-2 rtl:pr-2">
                    {p.solutions!.map((s) => {
                      const SIcon = SOLUTION_ICONS[s.id] ?? LayoutGrid;
                      const isActive = s.id === activeSolution;
                      return (
                        <button
                          key={s.id}
                          onClick={() => selectSolution(s.id, s.disabled)}
                          disabled={s.disabled}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                            s.disabled
                              ? "cursor-not-allowed text-muted-foreground/50"
                              : isActive
                              ? "bg-primary/5 font-medium text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <SIcon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          <span className="flex-1 text-start">{t(s.name)}</span>
                          {isActive && <Check className="size-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="my-1 h-px bg-border" />
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground/50"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground/50">
              <Settings2 className="size-4" />
            </span>
            {t("Manage Products")}
          </button>
        </div>
      )}
    </div>
  );
}
