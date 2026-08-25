import {
  Clock,
  Cloud,
  Code2,
  Gauge,
  Key,
  LayoutGrid,
  Lock,
  Mail,
  Palette,
  Shield,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import type { NavItem, NavSection } from "./types";

const base = "/CloudManagement";
const p = (path: string) => `${base}${path}`;

/* Cloud Management — workspace/account administration, independent of any
   AIoT product/solution (see Global Shell.dc.html's CM_NAV for the full
   design: Workspace, Products, Usage & Billing, Developer, Branding,
   Security, Enterprise).

   Only "Workspace" is backed by real pages/endpoints so far — the other
   groups are rendered per the design (so the sidebar has the full shape
   product will eventually have) but their rows show a "Coming soon" toast
   instead of navigating anywhere, rather than linking to unbuilt pages. */
const items: NavItem[] = [
  { title: "Overview", icon: Clock, comingSoon: true },
  {
    title: "Workspace",
    icon: LayoutGrid,
    children: [
      { title: "Settings", icon: LayoutGrid, path: p("/workspace/general") },
      { title: "Members", icon: UserPlus, path: p("/workspace/members") },
      { title: "Invitations", icon: Mail, path: p("/workspace/invitations") },
      { title: "Roles & Access", icon: Shield, path: p("/workspace/roles") },
    ],
  },
  {
    title: "Usage & Billing",
    icon: Gauge,
    children: [
      { title: "Overview", icon: Gauge, comingSoon: true },
      { title: "Usage", icon: Gauge, comingSoon: true },
      { title: "Wallet", icon: Gauge, comingSoon: true },
      { title: "Transactions", icon: Gauge, comingSoon: true },
      { title: "Invoices", icon: Gauge, comingSoon: true },
      { title: "Pricing", icon: Gauge, comingSoon: true },
    ],
  },
  {
    title: "Developer",
    icon: Code2,
    children: [{ title: "API Keys", icon: Key, comingSoon: true }],
  },
  {
    title: "Branding",
    icon: Palette,
    children: [{ title: "White Label", icon: Palette, comingSoon: true }],
  },
  {
    title: "Security",
    icon: Lock,
    children: [
      { title: "Authentication", icon: Lock, comingSoon: true },
      { title: "Sessions", icon: Lock, comingSoon: true },
      { title: "MFA", icon: Lock, comingSoon: true },
    ],
  },
  // `children: []` (rather than omitting it) routes this through the Group
  // renderer so it gets the muted row + "Coming Soon" badge treatment,
  // instead of Leaf's plain "Coming soon" toast row.
  { title: "Enterprise", icon: Star, comingSoon: true, children: [] },
  { title: "Member", icon: Users, comingSoon: true },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const cloudManagementNav: NavSection = { title: "Cloud Management", icon: Cloud, items };
