import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

type Tone = "critical" | "warning" | "info";
type Category = "alarm" | "billing" | "system";

interface Notification {
  id: number;
  category: Category;
  tone: Tone;
  title: string;
  source: string;
  time: string;
}

/* No notifications feed yet.

   These four were invented — a critical alarm on Line 2, a predicted pump
   failure, a low wallet balance and a paid invoice — with fixed "4 minutes
   ago" timestamps that never advanced, and they lit the unread dot on the
   bell every time the panel loaded. Empty until there is a feed. */
const NOTIFICATIONS: Notification[] = [];

const TONE_STYLES: Record<Tone, string> = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-primary/10 text-primary",
  info: "bg-blue-500/10 text-blue-500",
};

const TABS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alarm", label: "Alarms" },
  { key: "billing", label: "Billing" },
  { key: "system", label: "System" },
];

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [readAll, setReadAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useShellT();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const items = tab === "all" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.category === tab);

  const hasUnread = NOTIFICATIONS.length > 0 && !readAll;

  const handleMarkAllRead = () => {
    setReadAll(true);
    toast.success(t("All notifications marked as read."));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className={`relative ${iconBtn}`} aria-label={t("Notifications")}>
        <Bell className="h-5 w-5" />
        {hasUnread && <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" aria-hidden />}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover shadow-lg ltr:right-0 rtl:left-0">
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <h3 className="text-base font-bold text-foreground">{t("Notifications")}</h3>
            <button onClick={handleMarkAllRead} className="text-sm font-semibold text-primary hover:underline">
              {t("Mark all read")}
            </button>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-4 pb-3">
            {TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  tab === item.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t(NOTIFICATIONS.length === 0 ? "No data" : "Nothing here yet.")}
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_STYLES[n.tone])}>
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t(n.title)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(n.source)} · {t(n.time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              toast.info(t("View all notifications"), { description: t("Coming soon.") });
              setOpen(false);
            }}
            className="block w-full border-t border-border py-3 text-center text-sm font-semibold text-primary hover:bg-muted/40"
          >
            {t("View all notifications")}
          </button>
        </div>
      )}
    </div>
  );
}
