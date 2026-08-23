import { useState } from "react";
import { BatteryLow, CheckCheck, LogIn, LogOut, ShieldAlert, Siren, type LucideIcon } from "lucide-react";
import { ALERTS, DEVICES } from "@/features/track/data/mockData";
import { Alert, AlertType } from "@/features/track/data/types";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { TranslationKey } from "@/features/track/i18n/translations";
import { TypeAvatar } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { cn } from "@/shared/lib/utils";

const ALERT_META: Record<AlertType, { icon: LucideIcon; label: TranslationKey; tone: string }> = {
  geofence_exit: { icon: LogOut, label: "geofenceAlert", tone: "bg-destructive/10 text-destructive" },
  geofence_enter: { icon: LogIn, label: "enteredZone", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  low_battery: { icon: BatteryLow, label: "lowBattery", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  sos: { icon: Siren, label: "sosAlert", tone: "bg-destructive/10 text-destructive" },
  tamper: { icon: ShieldAlert, label: "tamperAlert", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export default function Alerts() {
  const { t, relTime, label } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);
  const unread = alerts.filter((a) => !a.read).length;

  const device = (id: string) => DEVICES.find((d) => d.id === id)!;

  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("alerts")}</h1>
          <p className="text-sm text-muted-foreground">{t("alertsDesc")}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAlerts((as) => as.map((a) => ({ ...a, read: true })))}>
            <CheckCheck className="size-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {alerts.map((a) => {
          const m = ALERT_META[a.type];
          const d = device(a.deviceId);
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4",
                a.read ? "border-border bg-card" : "border-primary/30 bg-primary/5",
              )}
            >
              <span className={cn("flex size-10 items-center justify-center rounded-xl", m.tone)}>
                <m.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t(m.label)}</p>
                <p className="truncate text-xs text-muted-foreground">{d.name} · {label(d.subtitle)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs text-muted-foreground">{relTime(a.at)}</span>
                <TypeAvatar type={d.type} size={24} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
