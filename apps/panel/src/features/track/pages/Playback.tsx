import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime } from "@/shared/lib/formatDate";
import { Pause, Play } from "lucide-react";
import { useDevices } from "@/features/track/contexts/DeviceContext";
import { getTrack, GEOFENCES } from "@/features/track/data/mockData";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { LeafletMap } from "@/features/track/components/map/LeafletMap";
import { TypeAvatar } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { NoData } from "@/features/track/components/NoData";
import { cn } from "@/shared/lib/utils";

const SPEEDS = [1, 2, 4];

export default function Playback() {
  const { devices, selectedId, setSelectedId, selected } = useDevices();
  const { t, num } = useLanguage();
  const trail = useMemo(() => (selected ? getTrack(selected) : []), [selected?.id]);
  const [head, setHead] = useState(trail.length - 1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);

  // reset when device changes
  useEffect(() => {
    setHead(trail.length - 1);
    setPlaying(false);
  }, [selected?.id, trail.length]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setHead((h) => {
        if (h >= trail.length - 1) return 0;
        return h + 1;
      });
    }, 260 / speed);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, speed, trail.length]);

  const point = trail[head];
  const geofences = selected ? GEOFENCES.filter((g) => g.deviceIds.includes(selected.id)) : [];

  /* Every hook above runs first so the order stays stable; only the render
     branches. There is nothing to play back without a device to play. */
  const header = (
    <div className="mb-5">
      <h1 className="text-xl font-bold">{t("playback")}</h1>
      <p className="text-sm text-muted-foreground">{t("playbackDesc")}</p>
    </div>
  );

  if (!selected) {
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
        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedId(d.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              d.id === selectedId ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
            )}
          >
            <TypeAvatar type={d.type} size={22} />
            {d.name}
          </button>
        ))}
      </div>

      <LeafletMap
        devices={[selected]}
        selectedId={selected.id}
        geofences={geofences}
        trail={trail}
        playhead={head}
        className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border"
      />

      {/* Controls */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Button size="icon" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <input
            type="range"
            min={0}
            max={trail.length - 1}
            value={head}
            onChange={(e) => { setPlaying(false); setHead(+e.target.value); }}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
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
          <span>{num(head + 1)} / {num(trail.length)} {t("points")}</span>
          <span>{point ? formatTime(point.at) : ""}</span>
        </div>
      </div>
    </div>
  );
}
