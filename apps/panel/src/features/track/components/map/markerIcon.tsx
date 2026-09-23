import { renderToStaticMarkup } from "react-dom/server";
import { Car, Cpu, Dog, User } from "lucide-react";
import L from "leaflet";
import type { AssetType } from "@/features/track/data/types";
import { TRACKER_ICONS, type TrackerIconKey } from "@/features/track/lib/trackerIcons";

/* The pin a tracker gets on any of this product's maps — shared by LeafletMap
   (Live Map, Detail, Playback) and ZoneMap (Safe Zones) so a device looks the
   same wherever it is plotted. */

export const PRIMARY = "hsl(28, 100%, 50%)";

/* What a tracker is attached to, as chosen on the device form and stored in
   the device's `label` (see lib/trackerIcons). One colour each, so a glance at
   the map tells the cat from the car. */
const ICON_COLOR: Record<TrackerIconKey, string> = {
  cat: "hsl(32, 95%, 50%)",
  dog: "hsl(262, 60%, 55%)",
  car: "hsl(160, 84%, 39%)",
  motor: "hsl(197, 100%, 40%)",
  human: "hsl(220, 70%, 50%)",
};

/* The mock data's own kinds, still used by the pages that have not moved to
   the API. */
const ASSET_COLOR: Record<AssetType, string> = {
  pet: "hsl(32, 95%, 50%)",
  person: "hsl(197, 100%, 40%)",
  vehicle: "hsl(160, 84%, 39%)",
};

// Pre-render the lucide icons to SVG markup once (crisp + consistent on
// every OS, unlike emoji).
const glyph = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

const ASSET_SVG: Record<AssetType, string> = {
  pet: glyph(<Dog color="#fff" size={19} strokeWidth={2.2} />),
  person: glyph(<User color="#fff" size={19} strokeWidth={2.2} />),
  vehicle: glyph(<Car color="#fff" size={19} strokeWidth={2.2} />),
};

const TRACKER_SVG = glyph(<Cpu color="#fff" size={19} strokeWidth={2.2} />);

const ICON_SVG = Object.fromEntries(
  TRACKER_ICONS.map(({ key, Icon }) => [key, glyph(<Icon color="#fff" size={19} strokeWidth={2.2} />)]),
) as Record<TrackerIconKey, string>;

function markerFace(type?: AssetType, icon?: TrackerIconKey) {
  if (icon) return { color: ICON_COLOR[icon], svg: ICON_SVG[icon] };
  if (type) return { color: ASSET_COLOR[type], svg: ASSET_SVG[type] };
  return { color: PRIMARY, svg: TRACKER_SVG };
}

/** A round pin carrying the tracker's icon; `selected` enlarges it and adds
    the highlight ring. `size` overrides the default for denser maps. */
export function makeMarkerIcon({
  type,
  icon,
  selected = false,
  size,
}: {
  type?: AssetType;
  icon?: TrackerIconKey;
  selected?: boolean;
  size?: number;
}) {
  const { color, svg } = markerFace(type, icon);
  const px = size ?? (selected ? 42 : 34);
  const shadow = selected
    ? `border:3px solid #fff;box-shadow:0 0 0 3px ${PRIMARY},0 3px 10px rgba(0,0,0,.35)`
    : "border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)";
  return L.divIcon({
    className: "",
    html: `<div style="width:${px}px;height:${px}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;${shadow}">${svg}</div>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
  });
}
