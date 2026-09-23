import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, MapPin, MapPinOff, Send } from "lucide-react";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { useTrackers } from "@/features/track/lib/useTrackers";
import { useTrackerPositions } from "@/features/track/lib/useTrackerPositions";
import { LeafletMap, type MapDevice } from "@/features/track/components/map/LeafletMap";
import { CommandDrawer } from "@/features/track/components/CommandDrawer";
import { Battery, StatusPill } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { NoData, NoDataValue } from "@/features/track/components/NoData";
import { StatusFilter } from "@/features/track/components/DevicesToolbar";
import { TranslationKey } from "@/features/track/i18n/translations";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";
import { trackPath } from "@/features/track/lib/trackPath";
import { TrackerAvatar, trackerIconOf } from "@/features/track/lib/trackerIcons";

/* The fleet on a map: the device list from the API, each tracker placed at the
 * last fix in its telemetry (see lib/useTrackerPositions). A tracker with no
 * fix in the lookback window stays in the list, marked, but off the map.
 *
 * The mock page this replaces filtered by pet/person/vehicle and showed
 * signal, positioning and a street address; the API has none of those. */

const FILTERS: { value: StatusFilter; key: TranslationKey }[] = [
  { value: "all", key: "all" },
  { value: "online", key: "online" },
  { value: "offline", key: "offline" },
];

export default function LiveMap() {
  const { t, num, relTime } = useLanguage();
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const { trackers, load, noWorkspace, refetch } = useTrackers();
  const deviceIds = useMemo(() => trackers.map((d) => d.id), [trackers]);
  const { fixes, loading: positionsLoading } = useTrackerPositions(workspaceId, deviceIds);

  const pageLoad = usePageLoad({ loading: load.loading || noWorkspace, failed: load.failed, onRetry: refetch });

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [cmdOpen, setCmdOpen] = useState(false);

  const list = useMemo(() => trackers.filter((d) => filter === "all" || d.status === filter), [trackers, filter]);
  const online = trackers.filter((d) => d.status === "online").length;

  const mapDevices = useMemo<MapDevice[]>(
    () => list.flatMap((d) => {
      const fix = fixes.get(d.id);
      // The label carries what the tracker is on — see lib/trackerIcons.
      return fix ? [{ id: d.id, lat: fix.lat, lng: fix.lng, icon: trackerIconOf(d.label)?.key }] : [];
    }),
    [list, fixes],
  );

  const selected = trackers.find((d) => d.id === selectedId);
  const selectedFix = selectedId ? fixes.get(selectedId) : undefined;

  if (pageLoad.status === "loading") return <PageSkeleton />;
  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  // Why the map is empty, when it is.
  const mapEmpty =
    trackers.length === 0 ? t("noData")
    : mapDevices.length === 0 && !positionsLoading ? t("noPositions")
    : null;

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("liveMap")}</h1>
          <p className="text-sm text-muted-foreground">
            {num(online)} {t("onlineDevices")} · {num(trackers.length)} {t("deviceCountUnit")}
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-muted p-1">
          {FILTERS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilter(o.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Device list */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm font-semibold">
            {t("devices")}
            {positionsLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {list.length === 0 && <NoData size="sm" />}
            {list.map((d) => {
              const fix = fixes.get(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors",
                    d.id === selectedId ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <TrackerAvatar label={d.label} />
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate text-sm font-semibold">{d.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      {fix ? (
                        <>{d.typeLabel} · {relTime(fix.at)}</>
                      ) : (
                        <><MapPinOff className="size-3 shrink-0" /> {t("noPositionShort")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={d.status} />
                    {fix?.battery != null && <Battery level={fix.battery} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map + status card */}
        <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border">
          <LeafletMap
            devices={mapDevices}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="absolute inset-0 h-full w-full"
          />

          {/* Selected-device card (floating over the map) */}
          {selected && (
            <div className="absolute inset-x-3 bottom-3 z-[1000] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:inset-x-auto sm:start-3 sm:w-80">
              <div className="flex items-center gap-3">
                <TrackerAvatar label={selected.label} size={44} />
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate font-semibold">{selected.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusPill status={selected.status} />
                    <span className="truncate text-xs text-muted-foreground">{selected.typeLabel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("battery")}</span>
                  {selectedFix?.battery != null ? <Battery level={selectedFix.battery} /> : <NoDataValue className="text-xs" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("speed")}</span>
                  {selectedFix?.speed != null
                    ? <span className="font-medium">{num(selectedFix.speed)} km/h</span>
                    : <NoDataValue className="text-xs" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("lastFix")}</span>
                  {selectedFix ? <span className="font-medium">{relTime(selectedFix.at)}</span> : <NoDataValue className="text-xs" />}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
                {selectedFix ? (
                  <>
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span dir="ltr" className="flex-1 truncate font-mono">
                      {selectedFix.lat.toFixed(5)}, {selectedFix.lng.toFixed(5)}
                    </span>
                  </>
                ) : (
                  <>
                    <MapPinOff className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-muted-foreground">{t("noPosition")}</span>
                  </>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" className="min-w-0 flex-1" onClick={() => setCmdOpen(true)}>
                  <Send className="size-4" />
                  {t("commands")}
                </Button>
                <Button size="sm" variant="outline" className="min-w-0 flex-1" onClick={() => navigate(trackPath(`/devices/${selected.id}`))}>
                  {t("viewDetails")}
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* Nothing to plot: say why over the empty map rather than leaving it blank. */}
          {mapEmpty && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-6 shadow-xl backdrop-blur">
                <NoData title={mapEmpty} />
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CommandDrawer
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          device={{ id: selected.id, name: selected.name, type: selected.type, label: selected.label }}
        />
      )}
    </div>
  );
}
