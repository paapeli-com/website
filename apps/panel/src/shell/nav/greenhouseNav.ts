import {
  LayoutDashboard,
  HardDrive,
  Router,
  Bell,
  ClipboardList,
  Wrench,
  Users,
  Code2,
  Cloud,
  Sprout,
  Warehouse,
  Sparkles,
  Activity,
  TrendingUp,
  Bot,
} from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import type { NavSection } from "./types";

const base = solutionPath("SmartGreenhouse");
const p = (path: string) => `${base}${path}`;

/* Smart Greenhouse's own page, its greenhouses, comes first. Crops and crop
   cycles are reached from the greenhouses (each zone's crop, and the crop
   settings), not from the menu: a grower thinks greenhouse, zone, sensor. The
   rest are Smart Factory's pages (see
   features/factory/lib/product.ts), over this product's own data and worded
   for a grower. Greenhouses, zones and beds are kept in the location tree,
   but are managed from each greenhouse's own page; the tree itself, with its
   root and directories, is not shown to a grower. Smart Factory's
   overview, OTA and failure forecasts are about machines on a line and are not
   offered here; the greenhouse's overview, digital twin and control center
   are added with the steps that build them, rather than as rows that lead
   nowhere. */
const items = [
  { title: "Greenhouses", icon: Warehouse, path: p("/greenhouses") },
  { title: "Dashboards", icon: LayoutDashboard, path: p("/dashboard") },
  {
    title: "Devices",
    icon: HardDrive,
    children: [
      { title: "Devices", icon: HardDrive, path: p("/devices") },
      { title: "Gateways", icon: Router, path: p("/devices/gateways") },
    ],
  },
  { title: "Alarm", icon: Bell, path: p("/alarms") },
  {
    title: "AI & Analytics",
    icon: Sparkles,
    children: [
      { title: "Detect Anomalies", icon: Activity, path: p("/aiot/detect-anomalies") },
      { title: "Analyze Trends", icon: TrendingUp, path: p("/aiot/analyze-trends") },
      { title: "AI Co-Pilot", icon: Bot, path: p("/aiot/co-pilot") },
    ],
  },
  {
    title: "Operations",
    icon: Wrench,
    children: [{ title: "Work Orders", icon: ClipboardList, path: p("/work-orders") }],
  },
];

const footerItems = [
  { title: "Members", icon: Users, path: p("/members") },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const greenhouseNav: NavSection = { title: "Smart Greenhouse", icon: Sprout, items, footerItems };
