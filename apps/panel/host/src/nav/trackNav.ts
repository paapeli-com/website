import { Bell, Cloud, History, MapPin, Radar, Settings, Smartphone } from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import type { NavSection } from "./types";

const base = solutionPath("GPSTracking");
const p = (path: string) => `${base}${path}`;

/* Ported from apps/product/aiot/track/src/components/layout/Sidebar.tsx —
   that file's own header/sidebar chrome was removed once the host took
   over navigation (track is now a pure content remote). */
const items = [
  { title: "Live Map", icon: MapPin, path: p("/") },
  { title: "Devices", icon: Smartphone, path: p("/devices") },
  { title: "Geofences", icon: Radar, path: p("/geofences") },
  { title: "Playback", icon: History, path: p("/playback") },
  { title: "Alerts", icon: Bell, path: p("/alerts") },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
  { title: "Settings", icon: Settings, path: p("/settings") },
];

export const trackNav: NavSection = { title: "GPS Tracking", icon: MapPin, items };
