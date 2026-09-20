import { Building2, Cloud, FileText, Gauge, Home, Key, Package, Shield, Users, Wallet } from "lucide-react";
import type { NavItem, NavSection } from "./types";

const base = "/CloudManagement";
const p = (path: string) => `${base}${path}`;

/* One flat list: the account's front door, then its admin sections. No
   groups, because every row here goes somewhere — there is nothing left to
   expand, and a lone group header only costs a click.

   What used to sit here and no longer does: a "Products" group holding a
   single row that left for the product's own nav (the header's product
   switcher already does that), plus "Dashboard", "Help" and "Settings"
   rows that had no page behind them.

   "Organisation" consolidates what used to be four separate "Workspace"
   nav rows (Settings/Members/Invitations/Roles) into the design's single
   tabbed page — see src/features/cloud-management/pages/Organisation.tsx.
   "Workspaces" is a new row, not in the design doc: switching/creating the
   workspace itself and its product subscriptions (@paapeli/api's
   workspaces endpoints) is a separate concern from administering the one
   you're already in — see pages/Workspaces.tsx. */
const items: NavItem[] = [
  { title: "Overview", icon: Home, path: p("/overview") },
  { title: "Workspaces", icon: Building2, path: p("/workspaces") },
  { title: "Subscriptions", icon: Package, path: p("/subscriptions") },
  { title: "Billing & invoices", icon: FileText, path: p("/billing") },
  { title: "Usage & quotas", icon: Gauge, path: p("/usage") },
  { title: "Payment methods", icon: Wallet, path: p("/payment-methods") },
  { title: "Organisation", icon: Users, path: p("/organisation") },
  { title: "Access & API keys", icon: Key, path: p("/access-keys") },
  { title: "Security", icon: Shield, path: p("/security") },
];

export const cloudManagementNav: NavSection = { title: "Cloud Management", icon: Cloud, items };
