import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DEVICES, GEOFENCES, getHealth, getTrack, getTrips } from "@/features/track/data/mockData";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { LeafletMap } from "@/features/track/components/map/LeafletMap";
import { CommandDrawer } from "@/features/track/components/CommandDrawer";
import { Battery, Signal, StatusPill, TypeAvatar } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { Card } from "@/features/track/components/ui/card";
import { NoData, NoDataValue } from "@/features/track/components/NoData";
import { TranslationKey } from "@/features/track/i18n/translations";
import { cn } from "@/shared/lib/utils";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, num, relTime, label: tl } = useLanguage();
  /* No device list yet, so no device to open. This used to fall back to
     DEVICES[0] when the route id matched nothing, which meant a stale or
     mistyped link silently showed a different tracker's page. */
  const device = useMemo(() => DEVICES.find((d) => d.id === id) ?? null, [id]);
  const [cmdOpen, setCmdOpen] = useState(false);

  const isVehicle = device?.type === "vehicle";
  const tabs: TranslationKey[] = ["overview", isVehicle ? "trips" : "activity", ...(isVehicle ? [] : (["health"] as TranslationKey[])), "info"];
  const [tab, setTab] = useState<TranslationKey>("overview");

  const health = device ? getHealth(device) : null;
  const trips = device ? getTrips(device) : [];
  const trail = device ? getTrack(device) : [];
  const geofences = device ? GEOFENCES.filter((g) => g.deviceIds.includes(device.id)) : [];
  const activityData = (health?.activityByHour ?? []).map((v, h) => ({ h: `${h}`, v }));

  if (!device) {
    return (
      <div className="mx-auto max-w-5xl p-4 lg:p-6">
        <button onClick={() => navigate(-1)} className="mb-5 rounded-xl p-2 hover:bg-muted">
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </button>
        <NoData size="lg" className="rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-muted">
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </button>
        <TypeAvatar type={device.type} size={48} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{device.name}</h1>
          <div className="mt-0.5 flex items-center gap-2">
            <StatusPill status={device.status} />
            <span className="text-sm text-muted-foreground">{tl(device.subtitle)} · {relTime(device.updatedAt)}</span>
          </div>
        </div>
        <Button onClick={() => setCmdOpen(true)}>
          <Send className="size-4" />
          {t("commands")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-xl bg-muted p-1">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === tb ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tb)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LeafletMap devices={[device]} selectedId={device.id} geofences={geofences} trail={trail} className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t("battery")} value={<Battery level={device.battery} />} />
            <Stat label={t("signal")} value={<Signal bars={device.signal} />} />
            <Stat label={t("accuracy")} value={device.positioning} />
            <Stat
              label={isVehicle ? t("speed") : t("steps")}
              value={isVehicle ? `${num(device.speedKmh)} km/h` : health ? num(health.steps) : <NoDataValue />}
            />
            <div className="col-span-2">
              <Stat label={t("lastUpdate")} value={<span className="text-sm font-medium">{relTime(device.updatedAt)} · {device.address}</span>} />
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <Card className="p-5">
          <p className="mb-4 text-sm font-semibold">{t("todayActivity")}</p>
          {activityData.length === 0 && <NoData />}
          {activityData.length > 0 && (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="h" tickLine={false} axisLine={false} fontSize={10} interval={3} />
                <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label={t("steps")} value={health ? num(health.steps) : <NoDataValue />} />
            <Stat label={t("distance")} value={health ? `${num(health.distanceKm)} km` : <NoDataValue />} />
            <Stat label={t("heartRate")} value={health ? `${num(health.heartRate)} bpm` : <NoDataValue />} />
          </div>
        </Card>
      )}

      {tab === "health" && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("steps")} value={health ? num(health.steps) : <NoDataValue />} />
          <Stat label={t("distance")} value={health ? `${num(health.distanceKm)} km` : <NoDataValue />} />
          <Stat label={t("heartRate")} value={health ? `${num(health.heartRate)} bpm` : <NoDataValue />} />
        </div>
      )}

      {tab === "trips" && (
        <Card className="divide-y divide-border">
          <p className="p-5 pb-3 text-sm font-semibold">{t("recentTrips")}</p>
          {trips.length === 0 && <NoData />}
          {trips.map((tr) => (
            <div key={tr.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">{relTime(tr.at)}</span>
              <span className="flex gap-4">
                <span>{num(tr.distanceKm)} km</span>
                <span className="text-muted-foreground">{num(tr.durationMin)} min</span>
                <span className="font-medium">{num(tr.maxSpeedKmh)} km/h</span>
              </span>
            </div>
          ))}
        </Card>
      )}

      {tab === "info" && (
        <Card className="divide-y divide-border">
          {([
            [t("model"), device.model],
            [t("imei"), device.imei],
            [t("iccid"), device.iccid],
            [t("firmware"), device.firmware],
            [t("reportingInterval"), `${num(device.reportingIntervalMin)} min`],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </Card>
      )}

      <CommandDrawer open={cmdOpen} onClose={() => setCmdOpen(false)} device={device} />
    </div>
  );
}
