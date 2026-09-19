import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Car, Cpu, Dog, User } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AssetType, Geofence, TrackPoint } from "@/features/track/data/types";
import { cn } from "@/shared/lib/utils";

/* ------------------------------------------------------------------ */
/* Real OSM (Leaflet) map for GPS Tracking.                           */
/* Real streets + type-coloured markers + geofence circles, and an     */
/* optional route trail with a moving playhead (for Playback / Detail).*/
/* Live Map and Device Detail feed it real telemetry fixes; Playback    */
/* and Geofences still pass mock data. Swap the tile URL for a          */
/* self-hosted OSM server for on-prem.                                  */
/* ------------------------------------------------------------------ */

const COLOR: Record<AssetType, string> = {
  pet: "hsl(32, 95%, 50%)",
  person: "hsl(197, 100%, 40%)",
  vehicle: "hsl(160, 84%, 39%)",
};

// Pre-render the lucide icons to SVG markup once (crisp + consistent on
// every OS, unlike emoji).
const ICON_SVG: Record<AssetType, string> = {
  pet: renderToStaticMarkup(<Dog color="#fff" size={19} strokeWidth={2.2} />),
  person: renderToStaticMarkup(<User color="#fff" size={19} strokeWidth={2.2} />),
  vehicle: renderToStaticMarkup(<Car color="#fff" size={19} strokeWidth={2.2} />),
};

const PRIMARY = "hsl(28, 100%, 50%)";
const TRACKER_SVG = renderToStaticMarkup(<Cpu color="#fff" size={19} strokeWidth={2.2} />);

/** Anything with a position. `type` picks the pet/person/vehicle marker;
    without it (real trackers — the API has no such kind) a generic one. */
export type MapDevice = { id: string; lat: number; lng: number; type?: AssetType };

function makeIcon(type: AssetType | undefined, selected: boolean) {
  const size = selected ? 42 : 34;
  const shadow = selected
    ? `border:3px solid #fff;box-shadow:0 0 0 3px ${PRIMARY},0 3px 10px rgba(0,0,0,.35)`
    : "border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${type ? COLOR[type] : PRIMARY};display:flex;align-items:center;justify-content:center;${shadow}">${type ? ICON_SVG[type] : TRACKER_SVG}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const headIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${PRIMARY};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function LeafletMap({
  devices,
  selectedId,
  onSelect,
  geofences = [],
  trail,
  playhead,
  className,
}: {
  devices: MapDevice[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  geofences?: Geofence[];
  trail?: TrackPoint[];
  playhead?: number;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const geoRef = useRef<L.Layer[]>([]);
  const lineRef = useRef<L.Polyline | null>(null);
  const headRef = useRef<L.Marker | null>(null);
  const fittedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init map once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Markers are placed by the sync effect below, which also fits the view
    // to them once they first arrive. A trail fits itself in its own effect.
    const initialPts = trail?.length
      ? trail.map((p) => [p.lat, p.lng] as [number, number])
      : devices.map((d) => [d.lat, d.lng] as [number, number]);
    if (initialPts.length) {
      map.fitBounds(L.latLngBounds(initialPts), { padding: [50, 50], maxZoom: 16 });
      fittedRef.current = true;
    } else map.setView([40.782, -73.965], 14);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      fittedRef.current = false;
      lineRef.current = null;
      headRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geofences (reactive — e.g. toggling zones on the Safe Zones page).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    geoRef.current.forEach((l) => l.remove());
    geoRef.current = [];
    geofences.forEach((g) => {
      const c = L.circle([g.lat, g.lng], {
        radius: g.radiusM,
        color: PRIMARY,
        weight: 1.5,
        dashArray: "4 4",
        fillColor: PRIMARY,
        fillOpacity: g.active ? 0.08 : 0.03,
      })
        .addTo(map)
        .bindTooltip(g.name, { permanent: true, direction: "top", className: "tk-zone-label" });
      geoRef.current.push(c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofences]);

  // Devices: add, move and remove markers as the list changes, since on the
  // Live Map positions arrive after mount and keep refreshing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const live = new Set(devices.map((d) => d.id));
    for (const [id, m] of Object.entries(markersRef.current)) {
      if (!live.has(id)) {
        m.remove();
        delete markersRef.current[id];
      }
    }
    devices.forEach((d) => {
      const icon = makeIcon(d.type, d.id === selectedId);
      const existing = markersRef.current[d.id];
      if (existing) {
        existing.setLatLng([d.lat, d.lng]).setIcon(icon);
      } else {
        markersRef.current[d.id] = L.marker([d.lat, d.lng], { icon })
          .addTo(map)
          .on("click", () => onSelectRef.current?.(d.id));
      }
    });
    // Fit to the fleet once, the first time there is one — never again, so a
    // refresh doesn't undo the user's pan and zoom.
    if (!fittedRef.current && !trail?.length && devices.length) {
      map.fitBounds(L.latLngBounds(devices.map((d) => [d.lat, d.lng] as [number, number])), { padding: [50, 50], maxZoom: 16 });
      fittedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, selectedId]);

  // Selection: pan to the newly selected device — only when the selection
  // changes, not on every position refresh.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || trail) return;
    const sel = devices.find((d) => d.id === selectedId);
    if (sel) map.panTo([sel.lat, sel.lng], { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Trail changed (e.g. a different device in Playback): (re)create line + head.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lineRef.current) { lineRef.current.remove(); lineRef.current = null; }
    if (headRef.current) { headRef.current.remove(); headRef.current = null; }
    if (!trail?.length) return;

    const idx = Math.min(playhead ?? trail.length - 1, trail.length - 1);
    lineRef.current = L.polyline(
      trail.slice(0, idx + 1).map((p) => [p.lat, p.lng] as [number, number]),
      { color: PRIMARY, weight: 3.5, opacity: 0.9 },
    ).addTo(map);
    headRef.current = L.marker([trail[idx].lat, trail[idx].lng], { icon: headIcon, zIndexOffset: 1000 }).addTo(map);
    map.fitBounds(L.latLngBounds(trail.map((p) => [p.lat, p.lng] as [number, number])), { padding: [50, 50], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail]);

  // Playhead moved: update line + head only.
  useEffect(() => {
    if (!trail?.length || !lineRef.current || !headRef.current) return;
    const idx = Math.min(playhead ?? trail.length - 1, trail.length - 1);
    lineRef.current.setLatLngs(trail.slice(0, idx + 1).map((p) => [p.lat, p.lng] as [number, number]));
    headRef.current.setLatLng([trail[idx].lat, trail[idx].lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playhead]);

  return <div ref={elRef} className={cn("z-0", className)} />;
}
