import type { Coordinate, Zone, ZoneType } from "@paapeli/api";

/* Device zones (GET/PUT/DELETE /devices/.../device/{id}/zone): one circle,
 * rectangle or polygon per zone-capable tracker. Helpers shared by the Safe
 * Zones page and its map. */

export type LatLng = [number, number];

/** A zone while it is being drawn — the same shapes, with the parts the user
    hasn't placed yet still missing. */
export type ZoneDraft =
  | { type: "CIRCLE"; center?: Coordinate; radiusMeters: number }
  | { type: "RECTANGLE"; corners: Coordinate[] }
  | { type: "POLYGON"; vertices: Coordinate[] };

export const DEFAULT_RADIUS_M = 200;
export const MAX_POLYGON_VERTICES = 1000;

export const toLatLng = (c: Coordinate): LatLng => [c.latitude, c.longitude];
export const toCoordinate = (lat: number, lng: number): Coordinate => ({ latitude: lat, longitude: lng });

export function emptyDraft(type: ZoneType): ZoneDraft {
  if (type === "CIRCLE") return { type, radiusMeters: DEFAULT_RADIUS_M };
  if (type === "RECTANGLE") return { type, corners: [] };
  return { type, vertices: [] };
}

export function draftFromZone(zone: Zone): ZoneDraft {
  switch (zone.type) {
    case "CIRCLE":
      return { type: "CIRCLE", center: zone.area.center, radiusMeters: zone.area.radiusMeters ?? DEFAULT_RADIUS_M };
    case "RECTANGLE":
      return { type: "RECTANGLE", corners: [zone.area.corner1, zone.area.corner2] };
    case "POLYGON":
      return { type: "POLYGON", vertices: zone.area.vertices };
  }
}

/** Visible map extent in degrees, so a new rectangle is sized to the view. */
export type ViewSpan = { lat: number; lng: number };

/** Share of the visible map a freshly placed rectangle covers, per axis. */
const NEW_RECT_SHARE = 0.3;

/** The rectangle's four corners, going round: c1, c1-lat/c2-lng, c2, c2-lat/c1-lng.
    Corner i's opposite is (i + 2) % 4. */
export function rectangleCorners([a, b]: Coordinate[]): Coordinate[] {
  return [a, toCoordinate(a.latitude, b.longitude), b, toCoordinate(b.latitude, a.longitude)];
}

/** A map click while drawing: circle moves its centre, polygon adds a vertex.
    A rectangle is placed whole, centred on the click — sized to the view the
    first time, keeping its size after — and resized by its corner handles
    (see `dragCorner`). Placing corners one click at a time gave no feedback
    until the second click. */
export function addPoint(draft: ZoneDraft, c: Coordinate, view?: ViewSpan): ZoneDraft {
  switch (draft.type) {
    case "CIRCLE":
      return { ...draft, center: c };
    case "RECTANGLE": {
      const [a, b] = draft.corners;
      const halfLat = a && b ? Math.abs(a.latitude - b.latitude) / 2 : ((view?.lat ?? 0.01) * NEW_RECT_SHARE) / 2;
      const halfLng = a && b ? Math.abs(a.longitude - b.longitude) / 2 : ((view?.lng ?? 0.01) * NEW_RECT_SHARE) / 2;
      return {
        ...draft,
        corners: [
          toCoordinate(c.latitude + halfLat, c.longitude - halfLng),
          toCoordinate(c.latitude - halfLat, c.longitude + halfLng),
        ],
      };
    }
    case "POLYGON":
      return draft.vertices.length >= MAX_POLYGON_VERTICES ? draft : { ...draft, vertices: [...draft.vertices, c] };
  }
}

/** Corner `index` (0–3, see `rectangleCorners`) dragged to `c`; the opposite
    corner stays put. */
export function dragCorner(draft: ZoneDraft, index: number, c: Coordinate): ZoneDraft {
  if (draft.type !== "RECTANGLE" || draft.corners.length < 2) return draft;
  const opposite = rectangleCorners(draft.corners)[(index + 2) % 4];
  return { ...draft, corners: [c, opposite] };
}

/** The draft as a savable zone, or null while it is incomplete. */
export function zoneFromDraft(draft: ZoneDraft): Zone | null {
  switch (draft.type) {
    case "CIRCLE":
      return draft.center && draft.radiusMeters >= 1
        ? { type: "CIRCLE", area: { center: draft.center, radiusMeters: Math.round(draft.radiusMeters) } }
        : null;
    case "RECTANGLE": {
      const [a, b] = draft.corners;
      return a && b && a.latitude !== b.latitude && a.longitude !== b.longitude
        ? { type: "RECTANGLE", area: { corner1: a, corner2: b } }
        : null;
    }
    case "POLYGON":
      return draft.vertices.length >= 3 ? { type: "POLYGON", area: { vertices: draft.vertices } } : null;
  }
}

/** Points that bound a zone or draft, for fitting the map to it. A circle's
    bounds come from Leaflet, so only its centre is listed here. */
export function shapePoints(shape: Zone | ZoneDraft): LatLng[] {
  if ("area" in shape) {
    switch (shape.type) {
      case "CIRCLE":
        return [toLatLng(shape.area.center)];
      case "RECTANGLE":
        return [toLatLng(shape.area.corner1), toLatLng(shape.area.corner2)];
      case "POLYGON":
        return shape.area.vertices.map(toLatLng);
    }
  }
  switch (shape.type) {
    case "CIRCLE":
      return shape.center ? [toLatLng(shape.center)] : [];
    case "RECTANGLE":
      return shape.corners.map(toLatLng);
    case "POLYGON":
      return shape.vertices.map(toLatLng);
  }
}
