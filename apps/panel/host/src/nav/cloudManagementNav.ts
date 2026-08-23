import { Building2, Cloud, Cpu, FileText, Gauge, Home, Key, LayoutGrid, LifeBuoy, Package, Settings, Shield, Users, Wallet } from "lucide-react";
import type { NavItem, NavSection } from "./types";

const base = "/CloudManagement";
const p = (path: string) => `${base}${path}`;

/* Mirrors CLOUD_NAV from "Cloud Management.dc.html" exactly: an ungrouped
   Home/Dashboard pair, a "Products" group with the single AIoT entry
   (chevron — it leaves this sidebar for the product's own nav), a "Cloud
   management" group with the 7 admin sections, and a "Help" group.

   "Organisation" consolidates what used to be four separate "Workspace"
   nav rows (Settings/Members/Invitations/Roles) into the design's single
   tabbed page — see apps/product/cloud-management/src/pages/Organisation.tsx.
   "Workspaces" is a new row, not in the design doc: switching/creating the
   workspace itself and its product subscriptions (@paapeli/api's
   workspaces endpoints) is a separate concern from administering the one
   you're already in — see pages/Workspaces.tsx.

   Dashboard/Support requests/Settings have no page behind them in the
   design doc, so they're "Coming soon" rather than dead links. */
const items: NavItem[] = [
  { title: "Home", icon: Home, path: p("/overview") },
  { title: "Dashboard", icon: LayoutGrid, comingSoon: true },
  {
    title: "Products",
    icon: Cpu,
    children: [{ title: "AIoT", icon: Cpu, path: "/AIoT", chevron: true }],
  },
  {
    title: "Cloud management",
    icon: Cloud,
    children: [
      { title: "Workspaces", icon: Building2, path: p("/workspaces") },
      { title: "Subscriptions", icon: Package, path: p("/subscriptions") },
      { title: "Billing & invoices", icon: FileText, path: p("/billing") },
      { title: "Usage & quotas", icon: Gauge, path: p("/usage") },
      { title: "Payment methods", icon: Wallet, path: p("/payment-methods") },
      { title: "Organisation", icon: Users, path: p("/organisation") },
      { title: "Access & API keys", icon: Key, path: p("/access-keys") },
      { title: "Security", icon: Shield, path: p("/security") },
    ],
  },
  {
    title: "Help",
    icon: LifeBuoy,
    children: [
      { title: "Support requests", icon: LifeBuoy, comingSoon: true },
      { title: "Settings", icon: Settings, comingSoon: true },
    ],
  },
];

export const cloudManagementNav: NavSection = { title: "Cloud Management", icon: Cloud, items };
