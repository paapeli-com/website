import { useState } from "react";
import { Check, ChevronDown, Cpu, Factory, LayoutGrid, MapPin, Server, Settings2, type LucideIcon } from "lucide-react";
import { PRODUCTS, solutionPath } from "@paapeli/brand/config";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/* Product switcher (top toolbar, every page). A product can contain     */
/* multiple Solutions shown as a tree; selecting a solution navigates the */
/* host to /{PRODUCT_BASE}/{solution}. List comes from @paapeli/brand.    */

const PRODUCT_ICONS: Record<string, LucideIcon> = { aiot: Cpu, ai: Server };
const SOLUTION_ICONS: Record<string, LucideIcon> = { track: MapPin, SmartFactory: Factory };

/* This app IS the tracking solution. */
const DEFAULT_SOLUTION = "track";

export function ProductSwitcher() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeSolution, setActiveSolution] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_SOLUTION;
    return window.localStorage.getItem("paapeli_solution") || DEFAULT_SOLUTION;
  });

  // The product that owns the active solution (falls back to first enabled).
  const activeProduct =
    PRODUCTS.find((p) => p.solutions?.some((s) => s.id === activeSolution)) ??
    PRODUCTS.find((p) => !p.disabled) ??
    PRODUCTS[0];

  const selectSolution = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setOpen(false);
    window.localStorage.setItem("paapeli_solution", id);
    if (id === activeSolution) return;
    // Cross-solution navigation on the host (works standalone or in the shell).
    (window.top ?? window).location.href = solutionPath(id);
  };

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 min-w-[150px] items-center gap-2.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LayoutGrid className="size-4 text-primary" />
        <span className="flex-1 whitespace-nowrap text-start">{activeProduct.name}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-popover py-1.5 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{t("switchProduct")}</div>

          {PRODUCTS.map((p) => {
            const PIcon = PRODUCT_ICONS[p.id] ?? LayoutGrid;
            const hasSolutions = !!p.solutions?.length;
            const isActiveProduct = p.id === activeProduct.id && !p.disabled;

            return (
              <div key={p.id}>
                {/* Product row */}
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm",
                    p.disabled ? "text-muted-foreground/50" : "text-foreground",
                  )}
                >
                  <span className={cn("flex size-6 items-center justify-center rounded-md", isActiveProduct ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <PIcon className="size-4" />
                  </span>
                  <span className={cn("flex-1", isActiveProduct && "font-medium text-primary")}>{p.name}</span>
                  {p.disabled && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">soon</span>}
                </div>

                {/* Solutions tree */}
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
                          <span className="flex-1 text-start">{s.name}</span>
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
            {t("manageProducts")}
          </button>
        </div>
      )}
    </div>
  );
}
