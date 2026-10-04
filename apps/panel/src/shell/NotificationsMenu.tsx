import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell } from "lucide-react";
import {
  useGetWorkspaceAlarmsQueries,
  useListWorkspaceProductsQuery,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

type Tone = "critical" | "warning" | "info";
type Category = "alarm" | "billing" | "system";

interface Notification {
  id: string;
  category: Category;
  tone: Tone;
  title: string;
  source: string;
  time: string;
}

/* The alarm half of the feed is real: every alarm of every product the active
   workspace is subscribed to (the shell isn't scoped to one product, so it
   asks each). Billing and system have no endpoint yet, so those tabs stay
   empty rather than showing invented entries.

   There is no read/unread state on the server either — "mark all read" stays
   a local dismissal of the bell's dot for this session. */
const MAX_NOTIFICATIONS = 20;

const alarmTone = (severity?: string): Tone => {
  const s = severity?.toUpperCase();
  if (s === "CRITICAL") return "critical";
  if (s === "MAJOR" || s === "MINOR" || s === "WARNING") return "warning";
  return "info";
};

/** "5 minutes ago" in the panel's language — no strings of our own to translate. */
const timeAgo = (iso: string, lang: AppLanguage): string => {
  const at = new Date(iso).getTime();
  if (!at) return "";
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const minutes = Math.floor(Math.max(0, Date.now() - at) / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
};

const toNotification = (a: WorkspaceAlarmItem, lang: AppLanguage): Notification => ({
  id: a.id,
  category: "alarm",
  tone: alarmTone(a.severity),
  title: a.alarmName,
  source: a.deviceName ?? a.assetName ?? "",
  time: timeAgo(a.createdAt, lang),
});

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
  const lang = useAppLanguage();

  const workspaceId = useActiveWorkspaceId();
  const { data: products } = useListWorkspaceProductsQuery(workspaceId ?? "");
  const productKeys = useMemo(() => (products ?? []).map((p) => p.productKey), [products]);
  const alarmQueries = useGetWorkspaceAlarmsQueries(workspaceId ?? "", productKeys);
  const loading = !!workspaceId && (!products || alarmQueries.some((q) => q.isLoading));
  const alarmsVersion = alarmQueries.map((q) => q.dataUpdatedAt).join(",");
  const notifications = useMemo(
    () => alarmQueries
      .flatMap((q) => q.data ?? [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_NOTIFICATIONS)
      .map((a) => toNotification(a, lang)),
    // alarmQueries is a new array every render; its data changes are what alarmsVersion tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alarmsVersion, lang],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const items = tab === "all" ? notifications : notifications.filter((n) => n.category === tab);

  const hasUnread = notifications.length > 0 && !readAll;

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
                {t(loading ? "Loading…" : "Nothing here yet.")}
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_STYLES[n.tone])}>
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    {/* Alarm and device names come from the server — not translatable. */}
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.source ? `${n.source} · ${n.time}` : n.time}
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
