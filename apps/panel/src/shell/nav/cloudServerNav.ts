import {
  Activity,
  Camera,
  Cloud,
  Code2,
  Cpu,
  Disc,
  Expand,
  Globe,
  HardDrive,
  KeyRound,
  MapPin,
  Microchip,
  Network,
  Server,
  ShieldCheck,
  Split,
  Users,
} from "lucide-react";
import type { NavSection } from "./types";

/* Cloud Server's sidebar: IaaS's first product, staging only for now (see
 * SHOW_UNRELEASED_PRODUCTS in src/shared/config.ts).
 *
 * Mounted under its own family base, like AI Inference, rather than AIoT's
 * solutionPath(). The five groups are the console's areas; every row is a page
 * of its own, so a section is a group rather than one page with tabs.
 */

export const CLOUD_SERVER_BASE = "/IaaS/CloudServer";

const p = (path: string) => `${CLOUD_SERVER_BASE}${path}`;

/** The GPU servers page. AI Infra links here too: same machines, other door. */
export const CLOUD_SERVER_GPU_PATH = p("/gpu-servers");

/* Every group starts open: the console is five short lists, and opening
   each one to find a page cost more than seeing them all. */
const items = [
  {
    title: "Compute",
    icon: Cpu,
    defaultOpen: true,
    children: [
      { title: "Cloud Server", icon: Server, path: p("/servers") },
      { title: "GPU Servers", icon: Microchip, path: CLOUD_SERVER_GPU_PATH },
      { title: "Images & Operating Systems", icon: Disc, path: p("/images") },
      { title: "Auto Scale", icon: Expand, path: p("/auto-scale") },
    ],
  },
  {
    title: "Networking",
    icon: Network,
    defaultOpen: true,
    children: [
      { title: "Public IPs", icon: Globe, path: p("/public-ips") },
      { title: "Floating IPs", icon: MapPin, path: p("/floating-ips") },
      { title: "Load Balancer", icon: Split, path: p("/load-balancers") },
    ],
  },
  {
    title: "Storage",
    icon: HardDrive,
    defaultOpen: true,
    children: [
      { title: "Cloud Disks", icon: HardDrive, path: p("/volumes") },
      { title: "Snapshots", icon: Camera, path: p("/snapshots") },
    ],
  },
  {
    title: "Security",
    icon: ShieldCheck,
    defaultOpen: true,
    children: [
      { title: "Firewall", icon: ShieldCheck, path: p("/security-groups") },
      { title: "SSH Keys", icon: KeyRound, path: p("/ssh-keys") },
    ],
  },
  {
    title: "Monitoring",
    icon: Activity,
    defaultOpen: true,
    children: [{ title: "Resource Monitoring", icon: Activity, path: p("/monitoring") }],
  },
];

const footerItems = [
  { title: "Members", icon: Users, path: "/CloudManagement/members" },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

/** Every page under the sidebar, as [path segment, title]: the routes read it. */
export const CLOUD_SERVER_PAGES: [string, string][] = items.flatMap((group) =>
  group.children.map((c): [string, string] => [c.path.slice(CLOUD_SERVER_BASE.length + 1), c.title]),
);

export const cloudServerNav: NavSection = {
  title: "Cloud Server",
  icon: Server,
  items,
  footerItems,
};
