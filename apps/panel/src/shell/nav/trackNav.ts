import { Bell, Cloud, Code2, History, MapPin, Radar, Smartphone } from "lucide-react";
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

/* Pinned to the bottom under a divider, as on the other products. Cloud
   Management used to sit in the scrolling list above, and Settings held
   the account's own preferences — dark mode, language, the panel colour —
   which are not a property of GPS Tracking and now live in Account
   Settings, where the header menu already points. */
const footerItems = [
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const trackNav: NavSection = { title: "GPS Tracking", icon: MapPin, items, footerItems };
