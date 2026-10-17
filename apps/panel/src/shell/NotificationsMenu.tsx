import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/shared/lib/toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, ClipboardList } from "lucide-react";
import {
  aiService,
  notificationService,
  notificationsQueryKey,
  useGetNotificationsQueries,
  useGetWorkspaceAlarmsQueries,
  useListWorkspaceProductsQuery,
  type NotificationResponse,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { productKeyFor, solutionPath } from "@paapeli/brand/config";
import { getActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

type Tone = "critical" | "warning" | "info";
type Category = "alarm" | "workOrder" | "billing" | "system";

interface Notification {
  id: string;
  category: Category;
  tone: Tone;
  title: string;
  source: string;
  time: string;
  /** When it happened, to order alarms and server notifications together. */
  at: number;
  /** Read state the server keeps; alarms have none. */
  unread?: boolean;
  productKey?: string;
  /** Where a click leads. */
  path?: string;
}

/* Two real feeds, merged by time: every alarm of every product the active
   workspace is subscribed to (the shell isn't scoped to one product, so it
   asks each), and the signed-in user's own notifications about work orders.
   Billing and system have no endpoint yet, so those tabs stay empty rather
   than showing invented entries.

   Work-order notifications are read or unread on the server. Alarms are not:
   for them "mark all read" stays a local dismissal of the bell's dot for this
   session. */
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
  at: new Date(a.createdAt).getTime() || 0,
});

const WORK_ORDER_HEADLINE: Record<NotificationResponse["type"], string> = {
  WORK_ORDER_ASSIGNED: "A work order was assigned to you",
  WORK_ORDER_STATUS_CHANGED: "Work order status changed",
  WORK_ORDER_RAISED: "A work order was raised from an alarm",
  ALARM_ESCALATED: "An alarm was escalated to you",
  OTA_DEPLOYMENT_COMPLETED: "A firmware update finished",
  OTA_DEPLOYMENT_FAILED: "A firmware update failed",
  SMS_DAILY_LIMIT_REACHED: "Today's alarm text limit was reached",
};

const STATUS_PHRASE: Record<string, string> = {
  OPEN: "Now open",
  IN_PROGRESS: "Now in progress",
  DONE: "Now done",
  CANCELLED: "Now cancelled",
};

const priorityTone = (priority?: string | null): Tone =>
  priority === "CRITICAL" ? "critical" : priority === "HIGH" ? "warning" : "info";

/* Work orders have pages only in Smart Factory; elsewhere the entry informs
   without leading anywhere. */
const workOrderPath = (productKey: string, workOrderId?: string | null) =>
  workOrderId && productKey === productKeyFor("SmartFactory")
    ? `${solutionPath("SmartFactory")}/work-orders/${workOrderId}`
    : undefined;

/* Firmware rollouts, too, live only in Smart Factory. */
const deploymentsPath = (productKey: string) =>
  productKey === productKeyFor("SmartFactory") ? `${solutionPath("SmartFactory")}/firmware?tab=deployments` : undefined;

/* Alarms, too, have their page only in Smart Factory. */
const alarmsPath = (productKey: string) =>
  productKey === productKeyFor("SmartFactory") ? `${solutionPath("SmartFactory")}/alarms` : undefined;

const fromServer = (
  n: NotificationResponse & { productKey: string },
  lang: AppLanguage,
  t: (key: string) => string,
): Notification => {
  // A status reads as a phrase; an equipment name is the server's own text.
  const detail = n.type === "WORK_ORDER_STATUS_CHANGED"
    ? (n.detail && STATUS_PHRASE[n.detail] ? t(STATUS_PHRASE[n.detail]) : "")
    : n.detail ?? "";
  const escalated = n.type === "ALARM_ESCALATED";
  const firmware = n.type === "OTA_DEPLOYMENT_COMPLETED" || n.type === "OTA_DEPLOYMENT_FAILED";
  // The daily SMS limit: detail is the limit; until tomorrow, alerts arrive here.
  const smsLimit = n.type === "SMS_DAILY_LIMIT_REACHED";
  return {
    id: n.id,
    category: escalated || smsLimit ? "alarm" : firmware ? "system" : "workOrder",
    tone: n.type === "OTA_DEPLOYMENT_FAILED" || smsLimit ? "warning" : priorityTone(n.priority),
    title: t(WORK_ORDER_HEADLINE[n.type] ?? "Work Orders"),
    source: smsLimit
      ? t("Alarm escalations reach members in the panel until tomorrow.")
      : detail ? `${n.title} · ${detail}` : n.title,
    time: timeAgo(n.createdAt, lang),
    at: new Date(n.createdAt).getTime() || 0,
    unread: !n.read,
    productKey: n.productKey,
    path: escalated || smsLimit ? alarmsPath(n.productKey)
      : firmware ? deploymentsPath(n.productKey)
      : workOrderPath(n.productKey, n.workOrderId),
  };
};

const TONE_STYLES: Record<Tone, string> = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-primary/10 text-primary",
  info: "bg-blue-500/10 text-blue-500",
};

const TABS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alarm", label: "Alarms" },
  { key: "workOrder", label: "Work Orders" },
  { key: "billing", label: "Billing" },
  { key: "system", label: "System" },
];

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/* Temporary, for testing the AI pages: the bell also reports how the
   workspace's virtual devices are sending, as a table in the browser
   console and a one-line toast. Delete with the virtual devices. */
function reportVirtualDevices() {
  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) return;
  aiService
    .listVirtualDevices(workspaceId, "smartFactory")
    .then((devices) => {
      console.table(
        devices.map((d) => ({
          name: d.name,
          kind: d.kind,
          historyComplete: d.historyComplete,
          sentUntil: d.sentUntil,
          lastError: d.lastError ?? "",
        })),
      );
      const failing = devices.filter((d) => d.lastError);
      const done = devices.filter((d) => d.historyComplete).length;
      const summary = `${devices.length} virtual devices · ${done} with history sent · ${failing.length} failing`;
      if (failing.length) toast.error(summary, { description: failing[0].lastError ?? undefined });
      else toast(summary);
    })
    .catch((error) => {
      console.error("Virtual devices", error);
      toast.error("Virtual devices request failed", {
        description: String(error?.response?.data?.detail ?? error?.message ?? error),
      });
    });
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [readAll, setReadAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useShellT();
  const lang = useAppLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const workspaceId = useActiveWorkspaceId();
  const { data: products } = useListWorkspaceProductsQuery(workspaceId ?? "");
  const productKeys = useMemo(() => (products ?? []).map((p) => p.productKey), [products]);
  const alarmQueries = useGetWorkspaceAlarmsQueries(workspaceId ?? "", productKeys);
  const loading = !!workspaceId && (!products || alarmQueries.some((q) => q.isLoading));
  const alarmsVersion = alarmQueries.map((q) => q.dataUpdatedAt).join(",");
  const serverQueries = useGetNotificationsQueries(workspaceId ?? "", productKeys, MAX_NOTIFICATIONS);
  const serverVersion = serverQueries.map((q) => q.dataUpdatedAt).join(",");
  const notifications = useMemo(
    () => [
      ...alarmQueries.flatMap((q) => q.data ?? []).map((a) => toNotification(a, lang)),
      ...serverQueries.flatMap((q) => q.data ?? []).map((n) => fromServer(n, lang, t)),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_NOTIFICATIONS),
    // The query arrays are new every render; their data changes are what the versions track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alarmsVersion, serverVersion, lang],
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

  const unreadOnServer = serverQueries.some((q) => (q.data ?? []).some((n) => !n.read));
  const hasAlarms = notifications.some((n) => n.category === "alarm");
  const hasUnread = unreadOnServer || (hasAlarms && !readAll);

  const refreshNotifications = () =>
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey(workspaceId ?? "") });

  const handleMarkAllRead = async () => {
    setReadAll(true);
    try {
      if (workspaceId) {
        await Promise.all(
          productKeys
            .filter((_, i) => (serverQueries[i]?.data ?? []).some((n) => !n.read))
            .map((productKey) => notificationService.markAllRead(workspaceId, productKey)),
        );
      }
      toast.success(t("All notifications marked as read."));
    } catch {
      toast.error(t("Something went wrong or it took too long. Please try again."));
    } finally {
      refreshNotifications();
    }
  };

  const handleOpen = (n: Notification) => {
    if (n.unread && workspaceId && n.productKey) {
      // Reading is best effort: a failure leaves it unread for the next visit.
      notificationService.markRead(workspaceId, n.productKey, n.id).then(refreshNotifications, () => {});
    }
    if (n.path) {
      navigate(n.path);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          reportVirtualDevices();
        }}
        className={`relative ${iconBtn}`}
        aria-label={t("Notifications")}
      >
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

          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-4 pb-3">
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
                <div
                  key={n.id}
                  onClick={n.productKey ? () => handleOpen(n) : undefined}
                  className={cn(
                    "flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0",
                    n.productKey && "cursor-pointer hover:bg-muted/40",
                    n.unread && "bg-primary/5",
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_STYLES[n.tone])}>
                    {n.category === "workOrder" ? <ClipboardList className="size-4" /> : <AlertTriangle className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Alarm, device and work-order names come from the server — not translatable. */}
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.source ? `${n.source} · ${n.time}` : n.time}
                    </p>
                  </div>
                  {n.unread && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" role="img" aria-label={t("Unread")} />
                  )}
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
