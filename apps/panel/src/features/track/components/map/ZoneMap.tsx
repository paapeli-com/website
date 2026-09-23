import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Zone } from "@paapeli/api";
import { rectangleCorners, shapePoints, toLatLng, type LatLng, type ViewSpan, type ZoneDraft } from "@/features/track/lib/zones";
import type { TrackerIconKey } from "@/features/track/lib/trackerIcons";
import { makeMarkerIcon, PRIMARY } from "./markerIcon";
import { addBaseLayer, DEFAULT_CENTER, DEFAULT_ZOOM } from "./baseLayer";
import { cn } from "@/shared/lib/utils";

/* ------------------------------------------------------------------ */
/* Leaflet map for the Safe Zones page: every tracker's zone (circle,  */
/* rectangle or polygon), tracker positions, and the zone being drawn. */
/* Drawing is click-to-place — the page owns the draft and turns each  */
/* click into a point (see lib/zones.ts `addPoint`). A rectangle also  */
/* gets draggable corner handles for resizing.                         */
/* ------------------------------------------------------------------ */

const MUTED = "hsl(215, 16%, 47%)";

const handleIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:4px;background:#fff;border:2.5px solid ${PRIMARY};box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:grab"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export type MapZone = { id: string; name: string; zone: Zone };
export type MapPoint = { id: string; lat: number; lng: number; icon?: TrackerIconKey };

function zoneLayer(zone: Zone, style: L.PathOptions): L.Layer {
  switch (zone.type) {
    case "CIRCLE":
      return L.circle(toLatLng(zone.area.center), { ...style, radius: zone.area.radiusMeters ?? 0 });
    case "RECTANGLE":
      return L.rectangle(L.latLngBounds([toLatLng(zone.area.corner1), toLatLng(zone.area.corner2)]), style);
    case "POLYGON":
      return L.polygon(zone.area.vertices.map(toLatLng), style);
  }
}

export function ZoneMap({
  zones,
  devices,
  selectedId,
  onSelect,
  draft,
  drawing,
  onMapClick,
  onCornerDrag,
  focus,
  className,
}: {
  zones: MapZone[];
  devices: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** The zone being edited; drawn over the saved ones. */
  draft?: ZoneDraft | null;
  /** Map clicks place points — crosshair cursor, zone clicks ignored. */
  drawing?: boolean;
  /** `view` is the visible extent, so a new shape can be sized to it. */
  onMapClick?: (lat: number, lng: number, view: ViewSpan) => void;
  /** A rectangle corner handle was dropped — index per `rectangleCorners`. */
  onCornerDrag?: (index: number, lat: number, lng: number) => void;
  /** Fit to these points whenever `key` changes (e.g. a new selection). */
  focus?: { key: string; points: LatLng[]; radiusMeters?: number };
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const zonesRef = useRef<L.LayerGroup | null>(null);
  const devicesRef = useRef<L.LayerGroup | null>(null);
  const draftRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onCornerDragRef = useRef(onCornerDrag);
  onCornerDragRef.current = onCornerDrag;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  // Init once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true });
    mapRef.current = map;
    addBaseLayer(map);
    zonesRef.current = L.layerGroup().addTo(map);
    devicesRef.current = L.layerGroup().addTo(map);
    draftRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return;
      const b = map.getBounds();
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng, {
        lat: b.getNorth() - b.getSouth(),
        lng: b.getEast() - b.getWest(),
      });
    });
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = mapRef.current?.getContainer();
    if (el) el.style.cursor = drawing ? "crosshair" : "";
  }, [drawing]);

  // Saved zones. The one being edited is hidden — the draft stands in for it.
  useEffect(() => {
    const group = zonesRef.current;
    if (!group) return;
    group.clearLayers();
    zones.forEach((z) => {
      if (drawing && z.id === selectedId) return;
      const selected = z.id === selectedId;
      const layer = zoneLayer(z.zone, {
        color: selected ? PRIMARY : MUTED,
        weight: selected ? 2.5 : 1.5,
        dashArray: selected ? undefined : "4 4",
        fillColor: selected ? PRIMARY : MUTED,
        fillOpacity: selected ? 0.15 : 0.06,
        interactive: !drawing,
      });
      if (layer instanceof L.Path) {
        layer.bindTooltip(z.name, { direction: "top", sticky: true });
        layer.on("click", (e: L.LeafletMouseEvent) => {
          if (drawingRef.current) return;
          L.DomEvent.stopPropagation(e);
          onSelectRef.current?.(z.id);
        });
      }
      group.addLayer(layer);
    });
  }, [zones, selectedId, drawing]);

  // Tracker positions.
  useEffect(() => {
    const group = devicesRef.current;
    if (!group) return;
    group.clearLayers();
    devices.forEach((d) => {
      const selected = d.id === selectedId;
      // Same pin as the Live Map, a size down: this map is about the zones.
      L.marker([d.lat, d.lng], {
        icon: makeMarkerIcon({ icon: d.icon, selected, size: selected ? 34 : 28 }),
        interactive: !drawing,
      })
        .on("click", (e: L.LeafletMouseEvent) => {
          if (drawingRef.current) return;
          L.DomEvent.stopPropagation(e);
          onSelectRef.current?.(d.id);
        })
        .addTo(group);
    });
  }, [devices, selectedId, drawing]);

  // The draft: its shape once complete enough, plus a dot per placed point.
  useEffect(() => {
    const group = draftRef.current;
    if (!group) return;
    group.clearLayers();
    if (!draft) return;
    const style: L.PathOptions = { color: PRIMARY, weight: 2.5, fillColor: PRIMARY, fillOpacity: 0.18, interactive: false };
    const pts = shapePoints(draft);
    if (draft.type === "CIRCLE" && draft.center) {
      L.circle(toLatLng(draft.center), { ...style, radius: draft.radiusMeters }).addTo(group);
    } else if (draft.type === "RECTANGLE" && pts.length === 2) {
      const rect = L.rectangle(L.latLngBounds(pts), style).addTo(group);
      // A handle on each corner. While one is dragged the rectangle follows it
      // here, directly — committing to the page on every move would redraw
      // this layer and drop the drag. The page gets the corner on release.
      const corners = rectangleCorners(draft.corners);
      corners.forEach((corner, i) => {
        const opposite = toLatLng(corners[(i + 2) % 4]);
        L.marker(toLatLng(corner), { icon: handleIcon, draggable: true, zIndexOffset: 1000 })
          .on("drag", (e) => rect.setBounds(L.latLngBounds([(e.target as L.Marker).getLatLng(), opposite])))
          .on("dragend", (e) => {
            const p = (e.target as L.Marker).getLatLng();
            onCornerDragRef.current?.(i, p.lat, p.lng);
          })
          .addTo(group);
      });
      return;
    } else if (draft.type === "POLYGON" && pts.length >= 2) {
      (pts.length >= 3 ? L.polygon(pts, style) : L.polyline(pts, style)).addTo(group);
    }
    pts.forEach((p) =>
      L.circleMarker(p, { radius: 5, color: "#fff", weight: 2, fillColor: PRIMARY, fillOpacity: 1, interactive: false }).addTo(group),
    );
  }, [draft]);

  // Fit on request (selection changes), else once to everything that loaded.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus?.points.length) return;
    if (focus.points.length === 1) {
      const [p] = focus.points;
      const r = focus.radiusMeters;
      if (r) map.fitBounds(L.latLng(p).toBounds(r * 2.4), { maxZoom: 17 });
      else map.setView(p, Math.max(map.getZoom(), 15));
    } else {
      map.fitBounds(L.latLngBounds(focus.points), { padding: [40, 40], maxZoom: 17 });
    }
    fittedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fittedRef.current) return;
    const pts: LatLng[] = [...zones.flatMap((z) => shapePoints(z.zone)), ...devices.map((d) => [d.lat, d.lng] as LatLng)];
    if (!pts.length) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
    fittedRef.current = true;
  }, [zones, devices]);

  return <div ref={elRef} className={cn("z-0", className)} />;
}
