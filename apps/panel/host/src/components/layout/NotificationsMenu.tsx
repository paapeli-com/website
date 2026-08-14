import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

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

/* Mock data — no notifications feed wired up yet. */
const NOTIFICATIONS: Notification[] = [
  { id: 1, category: "alarm", tone: "critical", title: "High Temperature Alarm — Line 2", source: "Smart Factory", time: "4 minutes ago" },
  { id: 2, category: "alarm", tone: "warning", title: "Pump P101 failure predicted", source: "AI Analytics", time: "40 minutes ago" },
  { id: 3, category: "billing", tone: "warning", title: "Wallet balance below 5,000,000 IRR", source: "Billing", time: "2 hours ago" },
  { id: 4, category: "billing", tone: "info", title: "Invoice INV-2026-07 paid", source: "Billing", time: "3 Aug 2026" },
];

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
  const [hasUnread, setHasUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const items = tab === "all" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.category === tab);

  const handleMarkAllRead = () => {
    setHasUnread(false);
    toast.success("All notifications marked as read.");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className={`relative ${iconBtn}`} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {hasUnread && <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" aria-hidden />}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-border bg-popover shadow-lg ltr:right-0 rtl:left-0">
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <h3 className="text-base font-bold text-foreground">Notifications</h3>
            <button onClick={handleMarkAllRead} className="text-sm font-semibold text-primary hover:underline">
              Mark all read
            </button>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-4 pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  tab === t.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_STYLES[n.tone])}>
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.source} · {n.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              toast.info("View all notifications", { description: "Coming soon." });
              setOpen(false);
            }}
            className="block w-full border-t border-border py-3 text-center text-sm font-semibold text-primary hover:bg-muted/40"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
