import type { GreenhouseStructure } from "@paapeli/api";
import { cn } from "@/shared/lib/utils";
import tunnelPhoto from "../assets/covers/tunnel.jpg";
import glasshousePhoto from "../assets/covers/glasshouse.jpg";
import hydroponicPhoto from "../assets/covers/hydroponic.jpg";
import nethousePhoto from "../assets/covers/nethouse.jpg";

/* The pictures a greenhouse is shown with: one photo per kind of house. A
   grower picks one when making a greenhouse; one never picked follows the
   greenhouse's structure. The key is what the server stores, so the photos
   can change without touching saved greenhouses. */

export const COVERS = ["tunnel", "glasshouse", "hydroponic", "nethouse"] as const;
export type CoverKey = (typeof COVERS)[number];

const PHOTO: Record<CoverKey, string> = {
  tunnel: tunnelPhoto,
  glasshouse: glasshousePhoto,
  hydroponic: hydroponicPhoto,
  nethouse: nethousePhoto,
};

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

/** The fruit colour a crop icon stands for, used by the zone layout tiles;
 *  leafy crops show no fruit. */
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

export function GreenhouseCover({
  cover,
  structure,
  className,
}: {
  cover?: string | null;
  structure?: GreenhouseStructure | null;
  /** Kept for callers from the illustrated covers; a photo has its own crop. */
  fruit?: string | null;
  className?: string;
}) {
  return (
    <img
      src={PHOTO[coverOf(cover, structure)]}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn("block h-full w-full object-cover", className)}
    />
  );
}

/** The pictures side by side, to choose one. */
export function CoverPicker({
  value,
  onChange,
  labels,
}: {
  value: CoverKey;
  onChange: (cover: CoverKey) => void;
  fruit?: string | null;
  /** Each picture's name, in the reader's language. */
  labels: Record<CoverKey, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {COVERS.map((cover) => (
        <button
          key={cover}
          type="button"
          onClick={() => onChange(cover)}
          aria-pressed={value === cover}
          className={cn(
            "group overflow-hidden rounded-xl border bg-card text-start transition-all",
            value === cover ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/40",
          )}
        >
          <span className="block aspect-[16/10] overflow-hidden">
            <GreenhouseCover cover={cover} className="transition-transform duration-300 group-hover:scale-105" />
          </span>
          <span className="block px-2.5 py-1.5 text-xs font-medium">{labels[cover]}</span>
        </button>
      ))}
    </div>
  );
}
