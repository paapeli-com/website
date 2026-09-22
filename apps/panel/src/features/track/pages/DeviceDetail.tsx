import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { useTracker } from "@/features/track/lib/useTracker";
import { latestBattery, latestRows, latestSpeed, positionTrail } from "@/features/track/lib/telemetry";
import { TrackerAvatar, trackerIconOf } from "@/features/track/lib/trackerIcons";
import { LeafletMap } from "@/features/track/components/map/LeafletMap";
import { CommandDrawer } from "@/features/track/components/CommandDrawer";
import { DeviceEvents } from "@/features/track/components/DeviceEvents";
import { Battery, StatusPill } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { Card } from "@/features/track/components/ui/card";
import { NoData, NoDataValue } from "@/features/track/components/NoData";
import { TranslationKey } from "@/features/track/i18n/translations";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { cn } from "@/shared/lib/utils";

/* One tracker, from the API: its record (GET /devices/.../device/{id}), its
 * last 24 hours of telemetry, its activity feed and its credentials.
 *
 * The mock page this replaces also had Health and Trips tabs and a
 * pet/person/vehicle split; nothing in the API backs those, so they are gone
 * rather than shown empty. Position, battery and speed come from telemetry
 * when the tracker reports them — see lib/telemetry.ts for the keys read. */

const TABS: TranslationKey[] = ["overview", "telemetry", "activity", "info"];

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-muted">
      <ArrowLeft className="size-5 rtl:rotate-180" />
    </button>
  );
}

export default function DeviceDetail() {
  const { id } = useParams();
  const { t, num, relTime } = useLanguage();
  const tracker = useTracker(id);
  const { device, workspaceId, telemetry } = tracker;
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tab, setTab] = useState<TranslationKey>("overview");

  const pageLoad = usePageLoad({
    loading: tracker.load.loading || !workspaceId,
    failed: tracker.load.failed && !tracker.notFound,
    onRetry: tracker.refetchDevice,
  });

  const trail = useMemo(() => positionTrail(telemetry), [telemetry]);
  const rows = useMemo(() => latestRows(telemetry), [telemetry]);
  const battery = latestBattery(telemetry);
  const speed = latestSpeed(telemetry);
  const lastReport = rows[0]?.ts;

  if (tracker.notFound) {
    return (
      <div className="mx-auto max-w-5xl p-4 lg:p-6">
        <div className="mb-5"><BackButton /></div>
        <NoData size="lg" className="rounded-2xl border border-border bg-card" />
      </div>
    );
  }
  if (pageLoad.status === "loading") return <PageSkeleton />;
  if (pageLoad.status === "failed" || !device) return <LoadFailed onRetry={pageLoad.retry} />;

  const status = device.active ? "online" : "offline";
  const telemetryEmpty = (
    <div className="rounded-2xl border border-border bg-card p-6">
      {tracker.telemetryLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
      ) : tracker.telemetryFailed ? (
        <LoadFailed onRetry={() => void tracker.refetchTelemetry()} />
      ) : (
        <NoData title={t("noTelemetry")} />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <BackButton />
        <TrackerAvatar label={device.label} size={48} />
        <div className="min-w-0 flex-1">
          <h1 dir="auto" className="truncate text-xl font-bold">{device.name}</h1>
          <div className="mt-0.5 flex items-center gap-2">
            <StatusPill status={status} />
            <span className="text-sm text-muted-foreground">{tracker.typeLabel} · {relTime(device.updatedAt)}</span>
          </div>
        </div>
        <Button onClick={() => setCmdOpen(true)}>
          <Send className="size-4" />
          {t("commands")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex max-w-full overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === tb ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tb)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {trail.length > 0 ? (
            <LeafletMap devices={[]} trail={trail} trailIcon={trackerIconOf(device.label)?.key} className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-border bg-card">
              {tracker.telemetryLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <NoData title={t("noPosition")} />
              )}
            </div>
          )}
          <div className="grid grid-cols-2 content-start gap-3">
            <Stat label={t("battery")} value={battery ? <Battery level={battery.value} /> : <NoDataValue />} />
            <Stat label={t("speed")} value={speed ? `${num(speed.value)} km/h` : <NoDataValue />} />
            <Stat label={t("status")} value={<StatusPill status={status} />} />
            <Stat label={t("protocol")} value={device.protocol || <NoDataValue />} />
            <div className="col-span-2">
              <Stat
                label={t("lastReport")}
                value={
                  lastReport
                    ? <span className="text-sm font-medium">{relTime(new Date(lastReport).toISOString())}</span>
                    : <NoDataValue />
                }
              />
            </div>
          </div>
        </div>
      )}

      {tab === "telemetry" && (
        rows.length === 0 ? telemetryEmpty : (
          <Card className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground">
              <span>{t("key")}</span>
              <span>{t("value")}</span>
              <span>{t("updated")}</span>
            </div>
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 px-5 py-3 text-sm">
                <span dir="ltr" className="truncate font-mono text-xs">{r.key}</span>
                <span dir="ltr" className="truncate font-medium">{r.value}</span>
                <span className="text-xs text-muted-foreground">{relTime(new Date(r.ts).toISOString())}</span>
              </div>
            ))}
          </Card>
        )
      )}

      {tab === "activity" && (
        <DeviceEvents workspaceId={workspaceId} deviceId={device.id} deviceName={device.name} />
      )}

      {tab === "info" && (
        <Card className="divide-y divide-border">
          {([
            [t("deviceId"), device.id],
            [t("imei"), device.imei],
            [t("deviceType"), tracker.typeLabel],
            [t("protocol"), device.protocol],
            [t("credentialType"), tracker.credentialType],
            [t("clientId"), tracker.mqtt?.clientId],
            [t("username"), tracker.mqtt?.username],
            [t("createdAt"), device.createdAt && new Date(device.createdAt).toLocaleString()],
            [t("updated"), device.updatedAt && new Date(device.updatedAt).toLocaleString()],
          ] as [string, string | undefined][]).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="shrink-0 text-muted-foreground">{k}</span>
              <span dir="ltr" className="min-w-0 truncate font-medium">{v || <NoDataValue />}</span>
            </div>
          ))}
          {/* Prose, not an identifier: its own direction, and it wraps. The
              get-device endpoint doesn't return it yet, so it shows "no data"
              until the backend adds it. */}
          <div className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
            <span className="shrink-0 text-muted-foreground">{t("description")}</span>
            <span dir="auto" className="min-w-0 whitespace-pre-wrap break-words text-end font-medium">
              {device.description || <NoDataValue />}
            </span>
          </div>
        </Card>
      )}

      <CommandDrawer
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        device={{ id: device.id, name: device.name, type: device.type, label: device.label }}
      />
    </div>
  );
}
