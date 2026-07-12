import { useState } from "react";
import { Check, ChevronDown, Cpu, Factory, LayoutGrid, MapPin, Server, Settings2 } from "lucide-react";
import { PRODUCTS, solutionPath } from "@paapeli/brand/config";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* Cloud-provider product switcher for the panel top bar. A product may   */
/* contain multiple Solutions (tree). Reads the shared product list from  */
/* @paapeli/brand so it stays in sync with the other product apps.        */

const PRODUCT_ICONS: Record<string, any> = { aiot: Cpu, ai: Server };
const SOLUTION_ICONS: Record<string, any> = { track: MapPin, SmartFactory: Factory };
/* This app IS the Smart Factory solution. */
const DEFAULT_SOLUTION = "SmartFactory";

const L = {
  en: { switchProduct: "Switch product", manageProducts: "Manage Products", soon: "soon" },
  fa: { switchProduct: "تغییر محصول", manageProducts: "مدیریت محصولات", soon: "به‌زودی" },
  ar: { switchProduct: "تبديل المنتج", manageProducts: "إدارة المنتجات", soon: "قريباً" },
} as const;

export const ProductSwitcher = () => {
  const { language } = useLanguage();
  const tt = L[(language as "en" | "fa" | "ar")] ?? L.en;

  const [activeSolution, setActiveSolution] = useState<string>(() => {
    try {
      return localStorage.getItem("paapeli_solution") || DEFAULT_SOLUTION;
    } catch {
      return DEFAULT_SOLUTION;
    }
  });

  const activeProduct =
    PRODUCTS.find((p) => p.solutions?.some((s) => s.id === activeSolution)) ??
    PRODUCTS.find((p) => !p.disabled) ??
    PRODUCTS[0];

  const select = (id: string, disabled?: boolean) => {
    if (disabled) return;
    try {
      localStorage.setItem("paapeli_solution", id);
    } catch {}
    if (id === activeSolution) return;
    // Cross-solution navigation on the host (works standalone or in the shell).
    (window.top ?? window).location.href = solutionPath(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[150px] justify-start gap-2 px-4">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span className="flex-1 whitespace-nowrap text-start">{activeProduct.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-background">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {tt.switchProduct}
        </DropdownMenuLabel>

        {PRODUCTS.map((p) => {
          const PIcon = PRODUCT_ICONS[p.id] ?? LayoutGrid;
          const isActiveProduct = p.id === activeProduct.id && !p.disabled;
          return (
            <div key={p.id}>
              {/* Product row (non-selectable header) */}
              <div className={`flex items-center gap-2.5 px-2 py-2 text-sm ${p.disabled ? "text-muted-foreground/50" : ""}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${isActiveProduct ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <PIcon className="h-4 w-4" />
                </span>
                <span className={`flex-1 ${isActiveProduct ? "font-medium text-primary" : ""}`}>{p.name}</span>
                {p.disabled && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">{tt.soon}</span>}
              </div>

              {/* Solutions tree */}
              {!!p.solutions?.length && (
                <div className="mb-1 ms-[26px] border-border ltr:border-l rtl:border-r ltr:pl-1 rtl:pr-1">
                  {p.solutions.map((s) => {
                    const SIcon = SOLUTION_ICONS[s.id] ?? LayoutGrid;
                    const isActive = s.id === activeSolution;
                    return (
                      <DropdownMenuItem
                        key={s.id}
                        disabled={s.disabled}
                        onClick={() => select(s.id, s.disabled)}
                        className={isActive ? "text-primary font-medium" : ""}
                      >
                        <SIcon className={`mr-2 h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="flex-1">{s.name}</span>
                        {isActive && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Settings2 className="h-4 w-4" />
          </span>
          {tt.manageProducts}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
