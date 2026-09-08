import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, Building2, Check, LogOut, Menu, Moon, Plus, Search, Settings as SettingsIcon, Sun } from "lucide-react";
import paapeliLogo from "@paapeli/brand/logo.svg";
import paapeliLogoDark from "@paapeli/brand/logo-dark.svg";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { getCurrentUser } from "@paapeli/brand/session";
import { signOut as endSession } from "@paapeli/brand/session";
import { useWorkspace } from "@/features/track/contexts/WorkspaceContext";
import { useBrand } from "@/shell/BrandProvider";
import { useTheme } from "@paapeli/brand/theme";
import { Button } from "@/features/track/components/ui/button";
import { LanguageMenu } from "./LanguageMenu";
import { ProductSwitcher } from "./ProductSwitcher";
import { ALERTS } from "@/features/track/data/mockData";

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLanguage();
  const { workspaces, activeId: activeWs, setActive: setActiveWs } = useWorkspace();
  const { brand } = useBrand();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const unread = ALERTS.filter((a) => !a.read).length;
  const currentUser = getCurrentUser();
  const displayName = currentUser?.name || t("noData");
  const initial = currentUser?.initial ?? "";

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
            <span dir="auto" className="hidden max-w-[180px] truncate text-sm font-medium md:inline">{displayName}</span>
          </button>
          <div className="invisible absolute z-50 mt-1 w-64 rounded-lg border border-border bg-popover py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 ltr:right-0 rtl:left-0">
            {/* Account header */}
            <div className="px-3 py-2">
              <p dir="auto" className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
            </div>
            <div className="h-px bg-border" />

            {/* Workspace switcher (always shows the current workspace) */}
            <div className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{t("workspaces")}</div>
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWs;
              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveWs(ws.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${isActive ? "font-medium text-primary" : ""}`}
                >
                  <span className={`flex size-6 items-center justify-center rounded-md ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Building2 className="size-4" />
                  </span>
                  <span className="flex-1 truncate text-start">{ws.name}</span>
                  {isActive && <Check className="size-4" />}
                </button>
              );
            })}

            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => navigate("/settings")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <SettingsIcon className="size-4" />
              {t("settings")}
            </button>
            <button
              onClick={() => { endSession(); window.location.href = "/login"; }}
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
