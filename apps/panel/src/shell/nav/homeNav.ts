import { Bot, Cloud, Code2, Cpu, Factory, HardDrive, House, MapPin, Microchip, Server, Sprout, Users } from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import { AI_INFERENCE_BASE } from "./aiInferenceNav";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_GPU_PATH } from "./cloudServerNav";
import { SHOW_IAAS, SHOW_UNRELEASED_PRODUCTS } from "@/shared/config";
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
 * than a link that lands on nothing.
 *
 * AI Inference is open on staging only; production lists it as coming soon
 * too, until it launches.
 *
 * Every family starts open, so the whole product list is visible on arrival
 * without a click per family. */
/* Each family's own page under Home. A family row in the sidebar opens it as
   well as its products, as the header switcher's family headings do. */
const AIOT_PATH = "/Home/aiot";
const AI_INFRA_PATH = "/Home/ai-infra";
const IAAS_PATH = "/Home/iaas";

const items: NavItem[] = [
  {
    title: "AIoT",
    icon: Cpu,
    path: AIOT_PATH,
    defaultOpen: true,
    children: [
      { title: "Smart Factory", icon: Factory, path: solutionPath("SmartFactory") },
      { title: "Fleet Management", icon: MapPin, path: solutionPath("GPSTracking") },
      /* Staging only until it launches. */
      ...(SHOW_UNRELEASED_PRODUCTS
        ? [{ title: "Smart Greenhouse", icon: Sprout, path: solutionPath("SmartGreenhouse") }]
        : []),
    ],
  },
  {
    title: "AI Infra",
    icon: Server,
    path: AI_INFRA_PATH,
    defaultOpen: true,
    children: [
      SHOW_UNRELEASED_PRODUCTS
        ? { title: "AI Inference (MaaS)", icon: Server, path: AI_INFERENCE_BASE }
        : { title: "AI Inference (MaaS)", icon: Server, comingSoon: true },
      { title: "AI Agent Maker", icon: Bot, comingSoon: true },
      /* Cloud Server's GPU page, reachable from here too. Staging only. */
      ...(SHOW_UNRELEASED_PRODUCTS ? [{ title: "GPU Servers", icon: Microchip, path: CLOUD_SERVER_GPU_PATH }] : []),
    ],
  },
  /* IaaS: see SHOW_IAAS. */
  ...(SHOW_IAAS
    ? [
        {
          title: "IaaS",
          icon: HardDrive,
          path: IAAS_PATH,
          defaultOpen: true,
          children: [{ title: "Cloud Server", icon: Server, path: CLOUD_SERVER_BASE }],
        },
      ]
    : []),
];

/* The same three rows every product pins to the bottom, so the block does not
   appear and disappear as you move between Home and a product. */
const footerItems: NavItem[] = [
  { title: "Members", icon: Users, path: "/CloudManagement/members" },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

/* Each product family's own page under Home: the same cards, one family only.
   Keyed by @paapeli/brand/config's PRODUCTS ids, which the switcher's family
   headings are drawn from. */
export const HOME_CATEGORY_PATHS: Record<string, string> = {
  aiot: AIOT_PATH,
  ai: AI_INFRA_PATH,
  ...(SHOW_IAAS ? { iaas: IAAS_PATH } : {}),
};

export const homeNav: NavSection = { title: "Home", icon: House, items, footerItems };
