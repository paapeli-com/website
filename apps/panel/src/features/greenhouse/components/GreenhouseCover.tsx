import { useId } from "react";
import type { GreenhouseStructure } from "@paapeli/api";
import { cn } from "@/shared/lib/utils";

/* The pictures a greenhouse card is drawn with: light SVG illustrations, so a
   card costs no image download and reads the same in every theme. A grower
   picks one when making a greenhouse; one never picked follows the
   greenhouse's structure. The fruit colour follows the crop grown there, so a
   strawberry house looks like one. */

export const COVERS = ["tunnel", "glasshouse", "hydroponic", "nethouse"] as const;
export type CoverKey = (typeof COVERS)[number];

const BY_STRUCTURE: Record<GreenhouseStructure, CoverKey> = {
  POLY_FILM: "tunnel",
  TUNNEL: "tunnel",
  GLASS: "glasshouse",
  POLYCARBONATE: "glasshouse",
  NET_HOUSE: "nethouse",
  OTHER: "hydroponic",
};

export function coverOf(cover?: string | null, structure?: GreenhouseStructure | null): CoverKey {
  if (cover && (COVERS as readonly string[]).includes(cover)) return cover as CoverKey;
  return structure ? BY_STRUCTURE[structure] : "tunnel";
}

/** The fruit colour a crop icon stands for; leafy crops show no fruit. */
const FRUIT: Record<string, string | null> = {
  tomato: "#E5484D",
  strawberry: "#E03131",
  pepper: "#F76707",
  cucumber: "#2B8A3E",
  lettuce: null,
  basil: null,
};

export function fruitOf(icon?: string | null): string | null {
  if (!icon) return "#E5484D";
  return icon in FRUIT ? FRUIT[icon] : "#E5484D";
}

/** A row of plants seen from the side: leaves, and fruit when the crop bears any. */
function PlantRow({ x1, y1, x2, y2, n, size, fruit }: { x1: number; y1: number; x2: number; y2: number; n: number; size: number; fruit: string | null }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0 : i / (n - 1);
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const s = size * (1 - t * 0.35);
        return (
          <g key={i}>
            <ellipse cx={x} cy={y - s * 0.6} rx={s * 0.9} ry={s} fill="#40C057" />
            <ellipse cx={x - s * 0.35} cy={y - s * 0.9} rx={s * 0.5} ry={s * 0.55} fill="#69DB7C" />
            {fruit && <circle cx={x + s * 0.3} cy={y - s * 0.3} r={s * 0.28} fill={fruit} />}
            {fruit && i % 2 === 0 && <circle cx={x - s * 0.4} cy={y - s * 0.15} r={s * 0.22} fill={fruit} />}
          </g>
        );
      })}
    </g>
  );
}

function Tunnel({ id, fruit }: { id: string; fruit: string | null }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF6FF" />
          <stop offset="1" stopColor="#F8FBFF" />
        </linearGradient>
        <linearGradient id={`${id}film`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".75" />
          <stop offset="1" stopColor="#D0EBFF" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}sky)`} />
      {/* Ground: grass around a soil bed. */}
      <polygon points="0,150 400,112 400,220 0,220" fill="#8CE99A" />
      <polygon points="40,176 360,138 384,160 64,206" fill="#E8A87C" />
      <polygon points="40,176 64,206 64,212 40,182" fill="#C77B4E" />
      <polygon points="64,206 384,160 384,166 64,212" fill="#D08A5C" />
      {/* Rows inside the tunnel. */}
      <PlantRow x1={92} y1={182} x2={330} y2={150} n={9} size={11} fruit={fruit} />
      <PlantRow x1={78} y1={168} x2={318} y2={140} n={9} size={10} fruit={fruit} />
      {/* The film over its hoops. */}
      <path d="M60 196 C 60 110, 160 100, 168 186 L 372 154 C 368 92, 280 84, 262 96 Z" fill={`url(#${id}film)`} stroke="#A5D8FF" strokeWidth="1.5" />
      <path d="M60 196 C 60 110, 160 100, 168 186" fill="none" stroke="#74C0FC" strokeWidth="2.5" />
      {[0.2, 0.4, 0.6, 0.8].map((t) => {
        const dx = 202 * t;
        const dy = -32 * t;
        return (
          <path
            key={t}
            d={`M${60 + dx} ${196 + dy} C ${60 + dx} ${110 + dy}, ${160 + dx} ${100 + dy}, ${168 + dx} ${186 + dy}`}
            fill="none"
            stroke="#A5D8FF"
            strokeWidth="1.2"
            opacity=".8"
          />
        );
      })}
      <path d="M110 118 L 316 88" stroke="#FFFFFF" strokeWidth="3" opacity=".7" />
      {/* A sensor post by the door. */}
      <rect x="40" y="150" width="3" height="40" fill="#495057" />
      <rect x="33" y="140" width="17" height="12" rx="2" fill="#343A40" />
      <rect x="36" y="143" width="11" height="6" rx="1" fill="#63E6BE" />
    </>
  );
}

function Glasshouse({ id, fruit }: { id: string; fruit: string | null }) {
  const ridges = [0, 1, 2, 3];
  return (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7F5FF" />
          <stop offset="1" stopColor="#FFF9F2" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".85" />
          <stop offset="1" stopColor="#C5F6FA" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}sky)`} />
      <polygon points="0,170 400,170 400,220 0,220" fill="#B2F2BB" />
      <rect x="30" y="98" width="340" height="86" fill={`url(#${id}glass)`} stroke="#99E9F2" strokeWidth="1.5" />
      {/* Saw-tooth roof of a Venlo house. */}
      {ridges.map((i) => (
        <polygon key={i} points={`${30 + i * 85},98 ${72.5 + i * 85},64 ${115 + i * 85},98`} fill={`url(#${id}glass)`} stroke="#99E9F2" strokeWidth="1.5" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={30 + i * 42.5} y1="98" x2={30 + i * 42.5} y2="184" stroke="#C5F6FA" strokeWidth="1" />
      ))}
      {/* Crops trained up strings, as a glasshouse grows them. */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 44 + i * 23.5;
        if (x > 176 && x < 224) return null;
        return (
          <g key={i}>
            <line x1={x} y1="104" x2={x} y2="184" stroke="#ADB5BD" strokeWidth=".6" />
            <path d={`M${x} 184 C ${x - 6} 160, ${x + 6} 140, ${x} 118`} stroke="#2F9E44" strokeWidth="2" fill="none" />
            {[124, 138, 152, 166].map((y, k) => (
              <ellipse key={y} cx={x + (k % 2 ? 5 : -5)} cy={y} rx="7" ry="4.5" fill={k % 2 ? "#40C057" : "#51CF66"} />
            ))}
            {fruit && (
              <>
                <circle cx={x + 2} cy="160" r="3" fill={fruit} />
                <circle cx={x - 3} cy="171" r="3.2" fill={fruit} />
                <circle cx={x + 3} cy="146" r="2.6" fill={fruit} opacity=".9" />
              </>
            )}
          </g>
        );
      })}
      <rect x="182" y="140" width="36" height="44" fill="#F1F3F5" stroke="#99E9F2" />
      <line x1="200" y1="140" x2="200" y2="184" stroke="#99E9F2" />
      <rect x="0" y="184" width="400" height="6" fill="#DEE2E6" />
    </>
  );
}

function Hydroponic({ id, fruit }: { id: string; fruit: string | null }) {
  /* Inside a house, looking down raised gutters to a vanishing point, the
     crop spilling over their sides. */
  const vx = 200;
  const vy = 70;
  const gutters = [
    { near: -20, far: 176 },
    { near: 110, far: 192 },
    { near: 290, far: 208 },
    { near: 420, far: 224 },
  ];
  return (
    <>
      <defs>
        <linearGradient id={`${id}air`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8F9FA" />
          <stop offset="1" stopColor="#E9ECEF" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}air)`} />
      {/* Roof trusses. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const t = i / 5;
        const half = 200 * (1 - t) + 30 * t;
        const y = 10 + (vy - 10) * t;
        return <path key={i} d={`M${vx - half} ${y + 30} L ${vx} ${y} L ${vx + half} ${y + 30}`} fill="none" stroke="#CED4DA" strokeWidth="1.2" />;
      })}
      <polygon points={`0,220 400,220 ${vx + 12},${vy + 40} ${vx - 12},${vy + 40}`} fill="#F1F3F5" />
      {gutters.map((g, gi) => (
        <g key={gi}>
          {/* Legs, then the gutter. */}
          {[0.15, 0.45, 0.75].map((t) => {
            const x = g.near + (g.far - g.near) * t;
            const y = 150 + (vy + 46 - 150) * t;
            return <line key={t} x1={x} y1={y} x2={x} y2={y + 70 * (1 - t)} stroke="#ADB5BD" strokeWidth={2.5 * (1 - t) + 0.5} />;
          })}
          <polygon points={`${g.near - 26},150 ${g.near + 26},150 ${g.far + 3},${vy + 46} ${g.far - 3},${vy + 46}`} fill="#FFFFFF" stroke="#DEE2E6" />
          <polygon points={`${g.near - 26},150 ${g.near + 26},150 ${g.near + 26},160 ${g.near - 26},160`} fill="#E9ECEF" />
          {Array.from({ length: 9 }, (_, i) => {
            const t = Math.pow(i / 9, 0.8);
            const x = g.near + (g.far - g.near) * t;
            const y = 146 + (vy + 44 - 146) * t;
            const s = 20 * (1 - t * 0.85);
            return (
              <g key={i}>
                <ellipse cx={x} cy={y - s * 0.5} rx={s * 1.3} ry={s * 0.8} fill="#2F9E44" />
                <ellipse cx={x - s * 0.5} cy={y - s * 0.8} rx={s * 0.7} ry={s * 0.5} fill="#51CF66" />
                {fruit && (
                  <>
                    <path d={`M${x + s * 0.6} ${y - s * 0.1} q ${s * 0.1} ${s * 0.6} ${s * 0.05} ${s * 0.9}`} stroke="#2F9E44" strokeWidth={Math.max(0.6, s * 0.06)} fill="none" />
                    <circle cx={x + s * 0.65} cy={y + s * 0.85} r={Math.max(1, s * 0.22)} fill={fruit} />
                    <circle cx={x - s * 0.7} cy={y + s * 0.55} r={Math.max(1, s * 0.18)} fill={fruit} />
                  </>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

function Nethouse({ id, fruit }: { id: string; fruit: string | null }) {
  return (
    <>
      <defs>
        <pattern id={`${id}net`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0 L6 6 M6 0 L0 6" stroke="#868E96" strokeWidth=".5" opacity=".45" />
        </pattern>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4E6" />
          <stop offset="1" stopColor="#F8F9FA" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}sky)`} />
      <circle cx="340" cy="42" r="18" fill="#FFD43B" opacity=".8" />
      <polygon points="0,160 400,150 400,220 0,220" fill="#94D82D" opacity=".55" />
      {/* Beds of the crop under the net. */}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <polygon points={`${30 + r * 10},${196 - r * 16} ${370 - r * 10},${190 - r * 16} ${370 - r * 10},${196 - r * 16} ${30 + r * 10},${202 - r * 16}`} fill="#C77B4E" opacity=".7" />
          <PlantRow x1={44 + r * 10} y1={197 - r * 16} x2={356 - r * 10} y2={191 - r * 16} n={13 - r} size={8 - r} fruit={fruit} />
        </g>
      ))}
      {/* The net on its posts. */}
      <polygon points="20,92 380,82 380,200 20,210" fill={`url(#${id}net)`} />
      <polygon points="20,92 380,82 380,86 20,96" fill="#495057" opacity=".55" />
      {[20, 110, 200, 290, 380].map((x, i) => (
        <rect key={x} x={x - 1.5} y={92 - i * 2.5} width="3" height={118 - i * 2.5} fill="#495057" />
      ))}
    </>
  );
}

const DRAW: Record<CoverKey, (props: { id: string; fruit: string | null }) => JSX.Element> = {
  tunnel: Tunnel,
  glasshouse: Glasshouse,
  hydroponic: Hydroponic,
  nethouse: Nethouse,
};

export function GreenhouseCover({
  cover,
  structure,
  fruit,
  className,
}: {
  cover?: string | null;
  structure?: GreenhouseStructure | null;
  /** The colour of the fruit drawn; null draws only leaves. */
  fruit?: string | null;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const Draw = DRAW[coverOf(cover, structure)];
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)} aria-hidden>
      <Draw id={id} fruit={fruit === undefined ? "#E5484D" : fruit} />
    </svg>
  );
}

/** The pictures side by side, to choose one. */
export function CoverPicker({
  value,
  onChange,
  fruit,
  labels,
}: {
  value: CoverKey;
  onChange: (cover: CoverKey) => void;
  fruit?: string | null;
  /** Each picture's name, in the reader's language. */
  labels: Record<CoverKey, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {COVERS.map((cover) => (
        <button
          key={cover}
          type="button"
          onClick={() => onChange(cover)}
          className={cn(
            "overflow-hidden rounded-lg border text-start transition-all",
            value === cover ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/40",
          )}
        >
          <span className="block aspect-[16/9]">
            <GreenhouseCover cover={cover} fruit={fruit} />
          </span>
          <span className="block px-2 py-1 text-xs font-medium">{labels[cover]}</span>
        </button>
      ))}
    </div>
  );
}
