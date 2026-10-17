import { useState } from "react";
import { toast } from "@/shared/lib/toast";
import { AlertTriangle, CheckCheck, Info, Siren, type LucideIcon } from "lucide-react";
import { useAlarmActions, type AlarmAction } from "@/shared/hooks/useAlarmActions";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { TranslationKey } from "@/features/track/i18n/translations";
import { Button } from "@/features/track/components/ui/button";
import { NoData } from "@/features/track/components/NoData";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { useTrackerAlarms, type AlarmState, type TrackerAlarm } from "@/features/track/lib/useTrackerAlarms";
import { cn } from "@/shared/lib/utils";
import { AlertRules } from "@/features/track/components/AlertRules";

/* ThingsBoard severities, most to least urgent: CRITICAL, MAJOR, MINOR,
   WARNING, INDETERMINATE. */
const severityMeta = (severity: string): { icon: LucideIcon; tone: string } => {
  switch ((severity || "").toUpperCase()) {
    case "CRITICAL":
    case "MAJOR":
      return { icon: Siren, tone: "bg-destructive/10 text-destructive" };
    case "MINOR":
    case "WARNING":
      return { icon: AlertTriangle, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    default:
      return { icon: Info, tone: "bg-muted text-muted-foreground" };
  }
};

const STATE_LABEL: Record<AlarmState, TranslationKey> = {
  active: "alarmActive",
  acknowledged: "alarmAcknowledged",
  cleared: "alarmCleared",
};

const STATE_TONE: Record<AlarmState, string> = {
  active: "bg-destructive/10 text-destructive",
  acknowledged: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cleared: "bg-muted text-muted-foreground",
};

export default function Alerts() {
  const { t, relTime } = useLanguage();
  const [tab, setTab] = useState<"alerts" | "rules">("alerts");
  const { workspaceId, alarms, unread, load, noWorkspace, refetch } = useTrackerAlarms();
  const pageLoad = usePageLoad({
    loading: load.loading || noWorkspace,
    failed: load.failed,
    onRetry: refetch,
  });

  // busyId: which row has a request in flight, so only its buttons disable.
  const { run: runAction, busyId } = useAlarmActions(workspaceId, PRODUCT_KEY);
  const [markingAll, setMarkingAll] = useState(false);

  const run = async (a: TrackerAlarm, action: AlarmAction) => {
    if (!workspaceId) return;
    try {
      await runAction(action, a.id, a.deviceId);
    } catch (error) {
      toast.error(t("alarmActionFailed"), { description: error instanceof Error ? error.message : undefined });
    }
  };

  // "Read" is acknowledged: every unacknowledged alarm gets an ack.
  const markAllRead = async () => {
    if (!workspaceId) return;
    setMarkingAll(true);
    const results = await Promise.allSettled(
      alarms.filter((a) => a.unread).map((a) => runAction("ack", a.id, a.deviceId)),
    );
    setMarkingAll(false);
    if (results.some((r) => r.status === "rejected")) toast.error(t("alarmActionFailed"));
  };

  if (tab === "alerts" && pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("alerts")}</h1>
          <p className="text-sm text-muted-foreground">{t("alertsDesc")}</p>
        </div>
        {tab === "alerts" && unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}>
            <CheckCheck className="size-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <div className="mb-4 inline-flex max-w-full overflow-x-auto rounded-xl bg-muted p-1">
        {(["alerts", "rules"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === tb ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tb === "alerts" ? "alertsTab" : "rulesTab")}
          </button>
        ))}
      </div>

      {tab === "rules" ? <AlertRules /> : (
      <div className="flex flex-col gap-2">
        {pageLoad.status === "loading" &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        {pageLoad.status === "ready" && alarms.length === 0 && (
          <NoData size="lg" className="rounded-2xl border border-border bg-card" />
        )}
        {pageLoad.status === "ready" &&
          alarms.map((a) => {
            const m = severityMeta(a.severity);
            const busy = busyId === a.id || markingAll;
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4",
                  a.unread ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.tone)}>
                  <m.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-sm font-semibold">{a.alarmName}</p>
                  <p dir="auto" className="truncate text-xs text-muted-foreground">
                    {a.deviceName || t("unknownDevice")}
                    {a.assetName ? ` · ${a.assetName}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATE_TONE[a.state])}>
                      {t(STATE_LABEL[a.state])}
                    </span>
                    {a.unread && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={busy} onClick={() => run(a, "ack")}>
                        {t("acknowledge")}
                      </Button>
                    )}
                    {a.state !== "cleared" && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={busy} onClick={() => run(a, "clear")}>
                        {t("clear")}
                      </Button>
                    )}
                  </div>
                </div>
                <span className="self-start text-xs text-muted-foreground">{relTime(a.createdAt)}</span>
              </div>
            );
          })}
      </div>
      )}
    </div>
  );
}
