import { useState } from "react";
import { Check, ChevronDown, Cpu, LayoutGrid, Server, Settings2 } from "lucide-react";
import { PRODUCTS } from "@paapeli/brand/config";
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

/* Cloud-provider product switcher for the panel top bar. Reads the      */
/* shared product list from @paapeli/brand so it stays in sync with the  */
/* other product apps. Additive UI — does not change existing behavior.  */

const ICONS: Record<string, any> = { aiot: Cpu, "ai-infra": Server };

const L = {
  en: { switchProduct: "Switch product", manageProducts: "Manage Products" },
  fa: { switchProduct: "تغییر محصول", manageProducts: "مدیریت محصولات" },
  ar: { switchProduct: "تبديل المنتج", manageProducts: "إدارة المنتجات" },
} as const;

export const ProductSwitcher = () => {
  const { language } = useLanguage();
  const tt = L[(language as "en" | "fa" | "ar")] ?? L.en;

  const [activeId, setActiveId] = useState<string>(() => {
    try {
      return localStorage.getItem("paapeli_product") || PRODUCTS[0].id;
    } catch {
      return PRODUCTS[0].id;
    }
  });
  const active = PRODUCTS.find((p) => p.id === activeId && !p.disabled) ?? PRODUCTS[0];

  const select = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p || p.disabled) return;
    setActiveId(id);
    try {
      localStorage.setItem("paapeli_product", id);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[150px] justify-start gap-2 px-4">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span className="flex-1 whitespace-nowrap text-start">{active.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-background">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {tt.switchProduct}
        </DropdownMenuLabel>
        {PRODUCTS.map((p) => {
          const Icon = ICONS[p.id] ?? LayoutGrid;
          const isActive = p.id === active.id && !p.disabled;
          return (
            <DropdownMenuItem
              key={p.id}
              disabled={p.disabled}
              onClick={() => select(p.id)}
              className={isActive ? "text-primary font-medium" : ""}
            >
              <span className={`mr-2 flex h-6 w-6 items-center justify-center rounded-md ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{p.name}</span>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
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
