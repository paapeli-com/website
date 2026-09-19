import { Bell, Cloud, History, MapPin, Radar, Settings, Smartphone } from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import type { NavSection } from "./types";

const base = solutionPath("GPSTracking");
const p = (path: string) => `${base}${path}`;

/* Ported from the track feature's old layout Sidebar.tsx — that file's own
   header/sidebar chrome was removed once the shell took over navigation, so
   the feature renders page content only. */
const items = [
  { title: "Live Map", icon: MapPin, path: p("/") },
  { title: "Devices", icon: Smartphone, path: p("/devices") },
  { title: "Geofences", icon: Radar, path: p("/geofences") },
  { title: "Playback", icon: History, path: p("/playback") },
  { title: "Alerts", icon: Bell, path: p("/alerts") },
];

/* Account-level destinations, pinned under a divider at the bottom of the
   sidebar — same arrangement as factoryNav's footerItems. */
const footerItems = [
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
  { title: "Settings", icon: Settings, path: p("/settings") },
];

export const trackNav: NavSection = { title: "GPS Tracking", icon: MapPin, items, footerItems };
