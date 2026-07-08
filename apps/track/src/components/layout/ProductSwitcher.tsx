import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Cpu, LayoutGrid, Server, Settings2, type LucideIcon } from "lucide-react";
import { PRODUCTS } from "@paapeli/brand/config";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/* Cloud-provider product switcher (top toolbar, shown on every page).   */
/* The product list lives in the shared @paapeli/brand config so every   */
/* product app offers the same switcher.                                 */

const ICONS: Record<string, LucideIcon> = {
  aiot: Cpu,
  "ai-infra": Server,
};

export function ProductSwitcher() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return PRODUCTS[0].id;
    return window.localStorage.getItem("paapeli_product") || PRODUCTS[0].id;
  });
  const active = PRODUCTS.find((p) => p.id === activeId && !p.disabled) ?? PRODUCTS[0];

  const select = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p || p.disabled) return;
    setActiveId(id);
    window.localStorage.setItem("paapeli_product", id);
    setOpen(false);
    toast.success(p.name, { description: t("switchProduct") });
  };

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 min-w-[150px] items-center gap-2.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LayoutGrid className="size-4 text-primary" />
        <span className="flex-1 whitespace-nowrap text-start">{active.name}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{t("switchProduct")}</div>
          {PRODUCTS.map((p) => {
            const Icon = ICONS[p.id] ?? LayoutGrid;
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                disabled={p.disabled}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  p.disabled
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : isActive
                    ? "font-medium text-primary hover:bg-muted"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-md", isActive && !p.disabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-start">{p.name}</span>
                {isActive && !p.disabled && <Check className="size-4" />}
              </button>
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
