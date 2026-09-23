import { NavLink } from "react-router-dom";
import { Bell, History, MapPin, Radar, Settings, Smartphone, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { TranslationKey } from "@/features/track/i18n/translations";
import { useTrackerAlarms } from "@/features/track/lib/useTrackerAlarms";
import { cn } from "@/shared/lib/utils";
import { trackPath } from "@/features/track/lib/trackPath";

/* Sidebar styled to match the panel: bg-card, 15rem wide, leaf rows    */
/* with an orange active bar. Only the menu items differ per product.   */

const MAIN: { to: string; key: TranslationKey; icon: LucideIcon; end?: boolean }[] = [
  { to: trackPath("/"), key: "liveMap", icon: MapPin, end: true },
  { to: trackPath("/devices"), key: "devices", icon: Smartphone },
  { to: trackPath("/geofences"), key: "geofences", icon: Radar },
  { to: trackPath("/playback"), key: "playback", icon: History },
  { to: trackPath("/alerts"), key: "alerts", icon: Bell },
];

const SECONDARY: { to: string; key: TranslationKey; icon: LucideIcon }[] = [
  { to: trackPath("/settings"), key: "settings", icon: Settings },
];

function Item({
  to,
  label,
  Icon,
  end,
  badge,
  onClick,
}: {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-[13px] transition-colors",
          isActive ? "bg-primary/5 font-medium text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute bottom-1 top-1 w-[3px] rounded-full bg-primary ltr:left-0 rtl:right-0" aria-hidden />}
          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
          <span className="flex-1 truncate text-start">{label}</span>
          {badge ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const { unread } = useTrackerAlarms();
  return (
    <div className="flex h-full flex-col bg-card">
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {MAIN.map((it) => (
          <Item
            key={it.to}
            to={it.to}
            end={it.end}
            label={t(it.key)}
            Icon={it.icon}
            onClick={onNavigate}
            badge={it.key === "alerts" ? unread : undefined}
          />
        ))}
      </nav>
      <nav className="shrink-0 space-y-1 border-t border-border px-2 py-3">
        {SECONDARY.map((it) => (
          <Item key={it.to} to={it.to} label={t(it.key)} Icon={it.icon} onClick={onNavigate} />
        ))}
      </nav>
    </div>
  );
}
