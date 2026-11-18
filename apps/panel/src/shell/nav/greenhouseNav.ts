import {
  PieChart,
  LayoutDashboard,
  Package,
  HardDrive,
  Router,
  MapPin,
  Bell,
  ClipboardList,
  Wrench,
  Users,
  Code2,
  Cloud,
  Sprout,
} from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import type { NavSection } from "./types";

const base = solutionPath("SmartGreenhouse");
const p = (path: string) => `${base}${path}`;

/* Smart Greenhouse is drawn with Smart Factory's own pages (see
   features/factory/lib/product.ts), over its own workspace product, so its
   rows carry the same names, icons and order as Smart Factory's. Only pages
   that work today are listed: greenhouses, the digital twin and the control
   center are added with the steps that build them, rather than as rows that
   lead nowhere. */
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
