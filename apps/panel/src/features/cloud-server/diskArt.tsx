import { useId } from "react";
import { cn } from "@/shared/lib/utils";
import type { DiskTypeId } from "./lib/catalog";

/* The create disk page's picture: the chosen drive inside a ring of ticks
 * that fill with the size, as a share of the type's largest.
 *
 * The drives are drawn here, not photographed: a 2.5" SSD, a 3.5" HDD and an
 * M.2 NVMe stick, each tilted the same way so the three read as one set.
 * Ids are made per instance so two pictures on a page never share gradients.
 */

const TILT = "[transform:perspective(700px)_rotateX(38deg)_rotateZ(-24deg)]";

function Ssd() {
  const id = useId();
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3d44" />
          <stop offset="1" stopColor="#1d1f24" />
        </linearGradient>
      </defs>
      {/* the casing's edge, then its face */}
      <rect x="6" y="10" width="188" height="124" rx="8" fill="#15171b" />
      <rect x="4" y="4" width="188" height="124" rx="8" fill={`url(#${id}b)`} />
      <rect x="18" y="18" width="120" height="96" rx="4" fill="#2b2e35" stroke="#40444c" strokeWidth="1" />
      <text x="30" y="44" fontSize="13" fontWeight="700" fill="#d7dbe0" fontFamily="ui-sans-serif, system-ui" letterSpacing="2">
        PAAPELI
      </text>
      <text x="30" y="60" fontSize="7" fill="#8a9099" fontFamily="ui-monospace, monospace">
        ENTERPRISE SSD · SATA
      </text>
      <rect x="30" y="72" width="70" height="3" rx="1.5" fill="#4a4f58" />
      <rect x="30" y="80" width="52" height="3" rx="1.5" fill="#4a4f58" />
      {/* the brand stripe along one edge */}
      <rect x="168" y="4" width="5" height="124" fill="hsl(var(--primary))" />
      {/* the connector */}
      <rect x="186" y="34" width="6" height="64" rx="1" fill="#0d0e11" />
    </svg>
  );
}

function Hdd() {
  const id = useId();
  return (
    <svg viewBox="0 0 160 200" className="h-full w-full">
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef0f3" />
          <stop offset="0.55" stopColor="#c7ccd3" />
          <stop offset="1" stopColor="#9aa1ab" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="150" height="190" rx="8" fill="#7c838d" />
      <rect x="4" y="4" width="150" height="190" rx="8" fill={`url(#${id}m)`} />
      {/* the label */}
      <rect x="16" y="20" width="126" height="118" rx="3" fill="#f7f8fa" stroke="#d5d9df" />
      <text x="26" y="42" fontSize="12" fontWeight="700" fill="#2b2f36" fontFamily="ui-sans-serif, system-ui" letterSpacing="1.5">
        PAAPELI
      </text>
      <text x="26" y="56" fontSize="6.5" fill="#6b717b" fontFamily="ui-monospace, monospace">
        3.5&quot; HDD · 7200 RPM
      </text>
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={26 + i * 4.6} y="100" width={i % 3 === 0 ? 2.4 : 1.2} height="24" fill="#3a3f47" />
      ))}
      <rect x="26" y="70" width="80" height="3" rx="1.5" fill="#d5d9df" />
      <rect x="26" y="78" width="60" height="3" rx="1.5" fill="#d5d9df" />
      {/* screws */}
      {[
        [14, 152],
        [144, 152],
        [14, 184],
        [144, 184],
        [79, 168],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#8d949e" stroke="#6f7680" />
      ))}
      <rect x="30" y="190" width="98" height="6" rx="1" fill="#22252b" />
    </svg>
  );
}

function Nvme() {
  const id = useId();
  return (
    <svg viewBox="0 0 240 80" className="h-full w-full">
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#33363d" />
          <stop offset="1" stopColor="#15171b" />
        </linearGradient>
      </defs>
      {/* the board, and its gold edge */}
      <rect x="4" y="14" width="232" height="56" rx="4" fill="#0f1114" />
      <rect x="222" y="18" width="14" height="48" fill="#c99a2e" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="223" y={20 + i * 5} width="12" height="2.4" fill="#e7bd52" />
      ))}
      {/* the heatsink, with fins and the brand stripe */}
      <rect x="10" y="6" width="206" height="58" rx="5" fill={`url(#${id}h)`} />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={20 + i * 11} y="12" width="4" height="46" rx="2" fill="#24272d" />
      ))}
      <path d="M150 6 h18 l-26 58 h-18 z" fill="hsl(var(--primary))" />
      <text x="20" y="40" fontSize="10" fontWeight="700" fill="#e3e6ea" fontFamily="ui-sans-serif, system-ui" letterSpacing="1.5">
        PAAPELI
      </text>
      <circle cx="6" cy="40" r="4" fill="#f8fafc" />
    </svg>
  );
}

const ART: Record<DiskTypeId, { el: () => JSX.Element; className: string }> = {
  ssd: { el: Ssd, className: "w-40" },
  hdd: { el: Hdd, className: "w-28" },
  local: { el: Nvme, className: "w-48" },
};

export function DiskArt({ type }: { type: DiskTypeId }) {
  const { el: El, className } = ART[type];
  return (
    <div className={cn("drop-shadow-[0_18px_18px_rgba(15,23,42,0.28)] transition-all duration-300", TILT, className)}>
      <El />
    </div>
  );
}

/** Ticks around 270 degrees, the share filled in the brand colour. */
export function SizeGauge({ share, children }: { share: number; children: React.ReactNode }) {
  const ticks = 54;
  return (
    <div className="relative mx-auto flex size-60 items-center justify-center">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" aria-hidden>
        {Array.from({ length: ticks }, (_, i) => {
          const angle = 135 + (i / (ticks - 1)) * 270;
          const rad = (angle * Math.PI) / 180;
          const major = i % 9 === 0;
          const r1 = 138;
          const r2 = major ? 118 : 125;
          const on = i / (ticks - 1) <= share;
          return (
            <line
              key={i}
              x1={150 + r1 * Math.cos(rad)}
              y1={150 + r1 * Math.sin(rad)}
              x2={150 + r2 * Math.cos(rad)}
              y2={150 + r2 * Math.sin(rad)}
              strokeWidth={major ? 3.5 : 2}
              strokeLinecap="round"
              className={cn("transition-colors duration-200", on ? "stroke-primary" : "stroke-border")}
            />
          );
        })}
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** A row of short segments, the share filled. */
export function SegmentBar({ share }: { share: number }) {
  const n = 24;
  return (
    <div className="mx-auto flex max-w-xs gap-1" dir="ltr" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn("h-1.5 flex-1 rounded-sm transition-colors duration-200", i / (n - 1) <= share ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}
