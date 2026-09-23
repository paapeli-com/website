import L from "leaflet";
import { MAPIR_API_KEY } from "@/shared/config";

/* Where a map opens when it has nothing of its own to fit to: Tehran. */
export const DEFAULT_CENTER: L.LatLngTuple = [35.6892, 51.389];
export const DEFAULT_ZOOM = 11;

/* The base map under every track map. Map.ir (Shiveh raster tiles) when a key
   is configured; without one it falls back to OpenStreetMap so a dev build with
   no .env still renders a map instead of a grid of 401 tiles. */
export function addBaseLayer(map: L.Map): L.TileLayer {
  if (MAPIR_API_KEY) {
    return L.tileLayer(
      `https://map.ir/shiveh/xyz/1.0.0/Shiveh:Shiveh@EPSG:3857@png/{z}/{x}/{y}.png?x-api-key=${encodeURIComponent(MAPIR_API_KEY)}`,
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://map.ir">Map.ir</a>',
      },
    ).addTo(map);
  }
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
}
