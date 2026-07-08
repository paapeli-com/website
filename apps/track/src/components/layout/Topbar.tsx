import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, LogOut, Menu, Moon, Plus, Search, Settings as SettingsIcon, Sun } from "lucide-react";
import paapeliLogo from "@paapeli/brand/logo.svg";
import paapeliLogoDark from "@paapeli/brand/logo-dark.svg";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/brand/BrandProvider";
import { useTheme } from "@/lib/useTheme";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "./LanguageMenu";
import { ProductSwitcher } from "./ProductSwitcher";
import { ALERTS } from "@/data/mockData";

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const unread = ALERTS.filter((a) => !a.read).length;
  const initial = (user?.email ?? "U")[0].toUpperCase();

  return (
    <header className="z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur lg:px-4">
      {/* Hamburger */}
      <button onClick={onMenu} className={iconBtn} aria-label="Toggle sidebar">
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo */}
      <button onClick={() => navigate("/")} className="flex shrink-0 items-center gap-2">
        <img src={paapeliLogo} alt="Paapeli" className="block h-7 w-auto dark:hidden" />
        <img src={paapeliLogoDark} alt="Paapeli" className="hidden h-7 w-auto dark:block" />
        <span className="hidden text-lg font-bold leading-none text-primary sm:inline">{brand.appName}</span>
      </button>

      {/* Search */}
      <div className="relative hidden w-64 md:block lg:w-80">
        <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
        <input
          placeholder={t("search")}
          className="h-9 w-full rounded-lg border border-border bg-muted/40 text-sm outline-none transition-colors focus:border-primary focus:bg-background ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
        />
      </div>

      {/* Product switcher (cloud-provider level) — same on every page */}
      <div className="hidden md:block">
        <ProductSwitcher />
      </div>

      {/* Right cluster */}
      <div className="ms-auto flex items-center gap-1">
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => toast.success(t("newItems"), { description: t("comingSoon") })}
        >
          <Plus className="size-4" />
          {t("newItems")}
        </Button>

        <button onClick={toggle} className={iconBtn} aria-label={t("darkMode")}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <LanguageMenu />

        <button onClick={() => navigate("/alerts")} className={`relative ${iconBtn}`} aria-label={t("alerts")}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />}
        </button>

        <div className="group relative">
          <button className="flex h-9 items-center gap-2 rounded-lg px-1.5 hover:bg-muted" aria-label="Account">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </span>
            <span className="hidden max-w-[160px] truncate text-sm font-medium md:inline">{user?.email}</span>
          </button>
          <div className="invisible absolute z-50 mt-1 w-52 rounded-lg border border-border bg-popover py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 ltr:right-0 rtl:left-0">
            <button
              onClick={() => navigate("/settings")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <SettingsIcon className="size-4" />
              {t("settings")}
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
            >
              <LogOut className="size-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
