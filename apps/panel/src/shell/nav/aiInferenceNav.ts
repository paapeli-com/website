import { BarChart3, Cloud, Code2, Key, Rocket, Server, TestTube } from "lucide-react";
import type { NavSection } from "./types";

/* AI Inference's sidebar.
 *
 * Mounted under its own product base rather than AIoT's: this is a second
 * product, not a third solution inside the first, so solutionPath() does not
 * apply to it.
 *
 * Four rows of the product's own (Start, Models, Playground, Usage) and one
 * that leaves it. Requests and Limits & budget are tabs inside Usage rather
 * than rows of their own.
 *
 * API keys carries `external` and a subtitle: application keys live in Cloud
 * Management, and this row opens that one central list already filtered to
 * this product, with a way back here (return=ai).
 */

export const AI_INFERENCE_BASE = "/AIInfra/AIInference";

const p = (path: string) => `${AI_INFERENCE_BASE}${path}`;

/** The central key list, opened with this product's context already applied. */
export const centralApiKeysPath = (create = false) =>
  `/CloudManagement/access-keys?product=ai-inference&return=ai${create ? "&create=1" : ""}`;

/** Where cost and balance live: the one wallet in Cloud Management. */
export const WALLET_PATH = "/CloudManagement/billing";

const items = [
  { title: "Start", icon: Rocket, path: p("/") },
  { title: "Models", icon: Server, path: p("/models") },
  { title: "Playground", icon: TestTube, path: p("/playground") },
  { title: "Usage", icon: BarChart3, path: p("/usage") },
  {
    title: "API keys",
    subtitle: "in Cloud Management",
    icon: Key,
    path: centralApiKeysPath(),
    external: true,
  },
];

const footerItems = [
  { title: "Dev Center & Help", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Cloud Management", icon: Cloud, path: "/CloudManagement" },
];

export const aiInferenceNav: NavSection = {
  title: "AI Inference",
  icon: Server,
  items,
  footerItems,
};
