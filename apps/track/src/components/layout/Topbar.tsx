import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, LogOut, Menu, Moon, Plus, RefreshCw, Search, Sun } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/lib/useTheme";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "./LanguageMenu";
import { ALERTS } from "@/data/mockData";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const unread = ALERTS.filter((a) => !a.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <button onClick={onMenu} className="rounded-lg p-2 hover:bg-secondary lg:hidden">
        <Menu className="size-5" />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
        <input
          placeholder={t("search")}
          className="h-10 w-full rounded-xl border border-border bg-background text-sm outline-none transition-colors focus:border-primary ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" className="hidden sm:inline-flex" onClick={() => toast.success(t("addDevice"), { description: t("comingSoon") })}>
          <Plus className="size-4" />
          {t("addDevice")}
        </Button>

        <button
          onClick={() => toast(t("refresh"), { description: "Live data refreshed" })}
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary"
          aria-label={t("refresh")}
        >
          <RefreshCw className="size-5" />
        </button>

        <button
          onClick={() => navigate("/alerts")}
          className="relative flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary"
          aria-label={t("alerts")}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </button>

        <LanguageMenu />

        <button
          onClick={toggle}
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary"
          aria-label={t("darkMode")}
        >
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <div className="group relative">
          <button className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-secondary">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(user?.email ?? "U")[0].toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm sm:block">{user?.email}</span>
          </button>
          <div className="invisible absolute z-50 mt-1 w-44 rounded-xl border border-border bg-card py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 ltr:right-0 rtl:left-0">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary"
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
