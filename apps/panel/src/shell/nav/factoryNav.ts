import {
  PieChart,
  LayoutDashboard,
  Package,
  HardDrive,
  Router,
  MapPin,
  Bell,
  ClipboardList,
  Sparkles,
  Download,
  Code2,
  TrendingUp,
  AlertTriangle,
  Activity,
  Bot,
  Wrench,
  Cloud,
  Factory,
} from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import type { NavSection } from "./types";

const base = solutionPath("SmartFactory");
const p = (path: string) => `${base}${path}`;

/* Ported from the factory feature's old PanelLayout.tsx — that file's own
   header/sidebar chrome was removed once the shell took over navigation, so
   the feature renders page content only. */
const items = [
  { title: "Overview", icon: PieChart, path: p("/") },
  { title: "Dashboards", icon: LayoutDashboard, path: p("/dashboard") },
  {
    title: "Assets",
    icon: Package,
    children: [
      { title: "Devices", icon: HardDrive, path: p("/devices") },
      { title: "Gateways", icon: Router, path: p("/devices/gateways") },
    ],
  },
  { title: "Location", icon: MapPin, path: p("/locations") },
  { title: "Alarm", icon: Bell, path: p("/alarms") },
  {
    title: "AI & Analytics",
    icon: Sparkles,
    children: [
      { title: "Forecast Failures", icon: AlertTriangle, path: p("/aiot/forecast-failures") },
      { title: "Detect Anomalies", icon: Activity, path: p("/aiot/detect-anomalies") },
      { title: "Analyze Trends", icon: TrendingUp, path: p("/aiot/analyze-trends") },
      { title: "AI Co-Pilot", icon: Bot, path: p("/aiot/co-pilot") },
    ],
  },
  { title: "OTA", icon: Download, path: p("/firmware") },
  {
    title: "Operations",
    icon: Wrench,
    children: [{ title: "Work Orders", icon: ClipboardList, path: p("/work-orders") }],
  },
  /* No Settings row here. It pointed at /account-settings, which is the
     account, not the product — and the account menu in the header already
     reaches it. GPS Tracking keeps its own Settings, which is a different
     page. */
];

/* Pinned to the bottom of the sidebar — workspace- and account-level rows
   rather than places inside the product, so they sit under a divider below
   the scrolling list. */
const footerItems = [
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const factoryNav: NavSection = { title: "Smart Infrastructure", icon: Factory, items, footerItems };
