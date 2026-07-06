import { NavLink } from "react-router-dom";
import { Bell, History, MapPin, Radar, Settings, Smartphone, X, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrand } from "@/brand/BrandProvider";
import { TranslationKey } from "@/i18n/translations";
import { ALERTS } from "@/data/mockData";
import { cn } from "@/lib/utils";

const NAV: { to: string; key: TranslationKey; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", key: "liveMap", icon: MapPin, end: true },
  { to: "/devices", key: "devices", icon: Smartphone },
  { to: "/geofences", key: "geofences", icon: Radar },
  { to: "/playback", key: "playback", icon: History },
  { to: "/alerts", key: "alerts", icon: Bell },
  { to: "/settings", key: "settings", icon: Settings },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { brand } = useBrand();
  const unread = ALERTS.filter((a) => !a.read).length;

  const content = (
    <div className="flex h-full w-64 flex-col border-border bg-card ltr:border-r rtl:border-l">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          {brand.logoText}
        </span>
        <span className="text-lg font-semibold">{brand.appName}</span>
        <button onClick={onClose} className="ml-auto rounded-lg p-1.5 hover:bg-secondary lg:hidden">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            <Icon className="size-5" />
            <span className="flex-1">{t(key)}</span>
            {key === "alerts" && unread > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 text-xs text-muted-foreground">
        <p>Tenant: {brand.tenantId}</p>
        <p className="opacity-70">Mock data · demo</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">{content}</aside>
      {/* mobile */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
        <div
          onClick={onClose}
          className={cn("absolute inset-0 bg-black/40 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
        />
        <div
          className={cn(
            "absolute inset-y-0 transition-transform duration-300 ltr:left-0 rtl:right-0",
            mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
          )}
        >
          {content}
        </div>
      </div>
    </>
  );
}
