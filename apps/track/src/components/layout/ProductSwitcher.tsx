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
  const active = PRODUCTS.find((p) => p.id === activeId) ?? PRODUCTS[0];

  const select = (id: string) => {
    setActiveId(id);
    window.localStorage.setItem("paapeli_product", id);
    setOpen(false);
    const p = PRODUCTS.find((x) => x.id === id);
    toast.success(p?.name ?? "", { description: t("switchProduct") });
  };

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LayoutGrid className="size-4 text-primary" />
        <span className="whitespace-nowrap">{active.name}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-60 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg ltr:left-0 rtl:right-0">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{t("switchProduct")}</div>
          {PRODUCTS.map((p) => {
            const Icon = ICONS[p.id] ?? LayoutGrid;
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted",
                  isActive ? "font-medium text-primary" : "text-foreground",
                )}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-md", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-start">{p.name}</span>
                {isActive && <Check className="size-4" />}
              </button>
            );
          })}
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => { setOpen(false); toast(t("manageProducts")); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Settings2 className="size-4" />
            </span>
            {t("manageProducts")}
          </button>
        </div>
      )}
    </div>
  );
}
