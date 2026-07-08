import { Navigation } from "lucide-react";
import { Device, Geofence, TrackPoint } from "@/data/types";
import { ASSET_META } from "@/components/DeviceBits";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Stylised, animated map. Fully self-contained SVG (no tiles, no API  */
/* key, on-prem & white-label friendly). Streets + geofences + trail   */
/* live in one preserveAspectRatio="none" SVG that shares the 0..100    */
/* percentage space with the HTML markers, so everything stays aligned. */
/* ------------------------------------------------------------------ */

export function MapCanvas({
  devices,
  selectedId,
  onSelect,
  geofences = [],
  trail,
  playhead,
  layer = "street",
  className,
}: {
  devices: Device[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  geofences?: Geofence[];
  trail?: TrackPoint[];
  playhead?: number;
  layer?: "street" | "satellite";
  className?: string;
}) {
  const { t, label } = useLanguage();
  const sat = layer === "satellite";
  const trailUpto = trail ? trail.slice(0, (playhead ?? trail.length - 1) + 1) : [];
  const head = trail && playhead != null ? trail[Math.min(playhead, trail.length - 1)] : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        sat ? "bg-[#0f1f17]" : "bg-[#eef1f6]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* blocks */}
        <g opacity={sat ? 0.5 : 1}>
          <rect x="6" y="10" width="24" height="18" rx="2" fill={sat ? "#16281d" : "#e6ebf2"} />
          <rect x="66" y="60" width="26" height="20" rx="2" fill={sat ? "#16281d" : "#e6ebf2"} />
          <rect x="40" y="34" width="20" height="16" rx="2" fill={sat ? "#132a3a" : "#e3ecf4"} />
          <rect x="70" y="14" width="20" height="16" rx="2" fill={sat ? "#16281d" : "#e6ebf2"} />
        </g>
        {/* river */}
        <path
          d="M-2 72 C 20 64 30 84 52 76 S 86 60 102 68"
          fill="none"
          stroke={sat ? "#12384a" : "#d6e4f5"}
          strokeWidth="5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {/* streets */}
        <g
          stroke={sat ? "#26493a" : "#dbe1ea"}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        >
          <line x1="0" y1="24" x2="100" y2="24" />
          <line x1="0" y1="52" x2="100" y2="52" />
          <line x1="0" y1="82" x2="100" y2="82" />
          <line x1="22" y1="0" x2="22" y2="100" />
          <line x1="52" y1="0" x2="52" y2="100" />
          <line x1="80" y1="0" x2="80" y2="100" />
        </g>

        {/* geofences */}
        {geofences.map((g) => (
          <g key={g.id}>
            <ellipse
              cx={g.x}
              cy={g.y}
              rx={g.radius}
              ry={g.radius}
              fill="hsl(var(--primary) / 0.08)"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              className={g.active ? "animate-dash" : ""}
              opacity={g.active ? 1 : 0.4}
            />
          </g>
        ))}

        {/* playback trail */}
        {trailUpto.length > 1 && (
          <polyline
            points={trailUpto.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        )}
      </svg>

      {/* geofence labels */}
      {geofences.map((g) => (
        <span
          key={g.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur"
          style={{ left: `${g.x}%`, top: `${g.y - g.radius - 3}%` }}
        >
          {label(g.name)}
        </span>
      ))}

      {/* playback head marker */}
      {head && (
        <span
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${head.x}%`, top: `${head.y}%` }}
        >
          <span className="relative flex size-4">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-primary/60" />
            <span className="relative size-4 rounded-full border-2 border-white bg-primary shadow" />
          </span>
        </span>
      )}

      {/* device markers */}
      {devices.map((d) => {
        const meta = ASSET_META[d.type];
        const selected = d.id === selectedId;
        return (
          <button
            key={d.id}
            onClick={() => onSelect?.(d.id)}
            className="group absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none"
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
            aria-label={d.name}
          >
            <span className="flex flex-col items-center animate-float" style={{ animationDelay: `${(d.x % 5) * 0.2}s` }}>
              <span className={cn("relative flex items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white transition-transform group-hover:scale-110", meta.marker, selected ? "size-11" : "size-9")}>
                {d.status === "online" && (
                  <span className={cn("absolute inset-0 rounded-full opacity-50 animate-ping-slow", meta.marker)} />
                )}
                <meta.Icon className={cn("relative", selected ? "size-6" : "size-[18px]")} />
                {selected && (
                  <span className="absolute -inset-1 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-transparent" />
                )}
              </span>
              <span className={cn("-mt-0.5 size-2 rotate-45 rounded-[2px] ring-1 ring-white", meta.marker)} />
            </span>
          </button>
        );
      })}

      {/* live badge */}
      <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        {t("live")}
      </div>

      {/* my-location button */}
      <button className="absolute bottom-3 z-20 flex size-9 items-center justify-center rounded-full border border-border bg-card/90 text-primary shadow-sm backdrop-blur transition-colors hover:bg-card ltr:right-3 rtl:left-3">
        <Navigation className="size-4" />
      </button>
    </div>
  );
}
