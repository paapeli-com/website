import { useEffect, useMemo, useRef, useState } from "react";
import { Cpu, Loader2, Pause, Play } from "lucide-react";
import { useGetDeviceTimeSeriesQuery } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { formatTime } from "@/shared/lib/formatDate";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { useTrackers } from "@/features/track/lib/useTrackers";
import { positionTrail } from "@/features/track/lib/telemetry";
import { trackerIconOf } from "@/features/track/lib/trackerIcons";
import { LeafletMap } from "@/features/track/components/map/LeafletMap";
import { Button } from "@/features/track/components/ui/button";
import { NoData } from "@/features/track/components/NoData";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { cn } from "@/shared/lib/utils";

/* Replays where a tracker has been, from its telemetry history
   (GET /timeseries/.../history/{deviceId}) — the same source as the Live Map's
   positions, read through lib/telemetry. The endpoint's window is 1-24 hours
   and it returns at most 100 points per key, so a long window is coarse. */

const SPEEDS = [1, 2, 4];
/** Lookback choices, in hours — the endpoint clamps to 1-24. */
const RANGES = [1, 6, 24];

export default function Playback() {
  const { t, num } = useLanguage();
  const workspaceId = useActiveWorkspaceId();
  const { trackers, load, noWorkspace, refetch } = useTrackers();
  const pageLoad = usePageLoad({ loading: load.loading || noWorkspace, failed: load.failed, onRetry: refetch });

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [hours, setHours] = useState(RANGES[RANGES.length - 1]);
  const [head, setHead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);

  const selected = trackers.find((d) => d.id === selectedId);
  // Start on the first tracker so the page has something to play.
  useEffect(() => {
    if (!selectedId && trackers.length) setSelectedId(trackers[0].id);
  }, [trackers, selectedId]);

  const { data: telemetry, isLoading: trailLoading } = useGetDeviceTimeSeriesQuery(
    workspaceId ?? "", PRODUCT_KEY, selectedId ?? "", hours,
  );
  const trail = useMemo(() => positionTrail(telemetry), [telemetry]);

  // A new device or window is a new route: rewind and stop.
  useEffect(() => {
    setHead(0);
    setPlaying(false);
  }, [selectedId, hours]);

  useEffect(() => {
    if (!playing || trail.length < 2) return;
    timer.current = window.setInterval(() => {
      setHead((h) => (h >= trail.length - 1 ? 0 : h + 1));
    }, 260 / speed);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, speed, trail.length]);

  const point = trail[Math.min(head, trail.length - 1)];

  if (pageLoad.status === "loading") return <PageSkeleton />;
  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  const header = (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">{t("playback")}</h1>
        <p className="text-sm text-muted-foreground">{t("playbackDesc")}</p>
      </div>
      <div className="inline-flex rounded-xl bg-muted p-1">
        {RANGES.map((h) => (
          <button
            key={h}
            onClick={() => setHours(h)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              hours === h ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {num(h)}{t("hourShort")}
          </button>
        ))}
      </div>
    </div>
  );

  if (trackers.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        {header}
        <NoData size="lg" className="rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      {header}

      {/* Device chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {trackers.map((d) => {
          const Icon = trackerIconOf(d.label)?.Icon ?? Cpu;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                d.id === selectedId ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span dir="auto" className="max-w-[12rem] truncate">{d.name}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <LeafletMap
          devices={[]}
          trail={trail}
          playhead={head}
          trailIcon={trackerIconOf(selected?.label)?.key}
          className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border"
        />
        {/* No route to draw: say which of the two reasons it is. */}
        {trail.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-6 shadow-xl backdrop-blur">
              {trailLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {t("loading")}
                </div>
              ) : (
                <NoData title={t("noRoute")} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Button size="icon" onClick={() => setPlaying((p) => !p)} disabled={trail.length < 2}>
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <input
            type="range"
            min={0}
            max={Math.max(0, trail.length - 1)}
            value={Math.min(head, Math.max(0, trail.length - 1))}
            disabled={trail.length < 2}
            onChange={(e) => { setPlaying(false); setHead(+e.target.value); }}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-default"
          />
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  speed === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {num(s)}x
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{num(trail.length ? head + 1 : 0)} / {num(trail.length)} {t("points")}</span>
          <span>{point ? formatTime(point.at) : ""}</span>
        </div>
      </div>

      {selected && trail.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("routeFrom")} {formatTime(trail[0].at)} — {formatTime(trail[trail.length - 1].at)}
        </p>
      )}
    </div>
  );
}
