import { Bot, Cloud, Code2, Cpu, Factory, House, MapPin, Server, Users } from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import { AI_INFERENCE_BASE } from "./aiInferenceNav";
import type { NavItem, NavSection } from "./types";

/* Home's sidebar is the product list and nothing else.
 *
 * Every other section's sidebar is the inside of one product. Home sits above
 * them all, so its sidebar is the way across rather than the way around: two
 * families, the products in each, and no page beneath any of them. Names only
 * — what a product is and how much of it you have is what the cards on the
 * page itself are for, and repeating it here would say it twice.
 *
 * AI Agent Maker has nowhere to go yet, so it is a "coming soon" row rather
 * than a link that lands on nothing. */
const items: NavItem[] = [
  {
    title: "AIoT",
    icon: Cpu,
    children: [
      { title: "Smart Factory", icon: Factory, path: solutionPath("SmartFactory") },
      { title: "GPS Tracking", icon: MapPin, path: solutionPath("GPSTracking") },
    ],
  },
  {
    title: "AI Infra",
    icon: Server,
    children: [
      { title: "AI Inference (MaaS)", icon: Server, path: AI_INFERENCE_BASE },
      { title: "AI Agent Maker", icon: Bot, comingSoon: true },
    ],
  },
];

/* The same three rows every product pins to the bottom, so the block does not
   appear and disappear as you move between Home and a product. */
const footerItems: NavItem[] = [
  { title: "Members", icon: Users, path: "/CloudManagement/members" },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const homeNav: NavSection = { title: "Home", icon: House, items, footerItems };
