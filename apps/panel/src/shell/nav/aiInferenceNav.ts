import { BarChart3, Cloud, Code2, Gauge, Key, ListFilter, PieChart, Server, Settings2, TestTube, Users } from "lucide-react";
import type { NavSection } from "./types";

/* AI Inference's sidebar.
 *
 * Mounted under its own product base rather than AIoT's: this is a second
 * product, not a third solution inside the first, so solutionPath() does not
 * apply to it.
 *
 * "Manage" is a group for the same reason Cloud Management's sections are —
 * that is how this sidebar already expresses a labelled block, and inventing a
 * second way to draw one would make two products look different for no reason.
 *
 * API keys carries `chevron`, which is what this nav already uses to say a row
 * leaves for another area's own navigation. It does: application keys live in
 * Cloud Management, and this row is a shortcut into the filtered central list
 * rather than a second place to keep them.
 */

export const AI_INFERENCE_BASE = "/AIInfra/AIInference";

const p = (path: string) => `${AI_INFERENCE_BASE}${path}`;

/** The central key list, opened with this product's context already applied. */
export const centralApiKeysPath = (projectId: string) =>
  `/CloudManagement/access-keys?product=ai-inference&project=${encodeURIComponent(projectId)}&from=ai-inference`;

const items = [
  { title: "Overview", icon: PieChart, path: p("/") },
  { title: "Models", icon: Server, path: p("/models") },
  { title: "Playground", icon: TestTube, path: p("/playground") },
  {
    title: "Manage",
    icon: Settings2,
    children: [
      /* Not p("/api-keys"): there is no such page. The row goes to the one
         central list, already filtered to this product. */
      { title: "API keys", icon: Key, path: centralApiKeysPath("production"), chevron: true },
      { title: "Usage & cost", icon: BarChart3, path: p("/usage") },
      { title: "Requests", icon: ListFilter, path: p("/requests") },
      { title: "Limits & budget", icon: Gauge, path: p("/limits") },
    ],
  },
];

const footerItems = [
  { title: "Members", icon: Users, path: "/CloudManagement/organisation" },
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const aiInferenceNav: NavSection = {
  title: "AI Inference",
  icon: Server,
  items,
  footerItems,
};
