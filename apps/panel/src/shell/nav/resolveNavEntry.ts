import { cloudManagementNav } from "./cloudManagementNav";
import { factoryNav } from "./factoryNav";
import { trackNav } from "./trackNav";
import type { NavItem, NavSection } from "./types";

/* Turns a URL back into the name the sidebar gives it, so a recorded visit
   reads "Work Orders · Smart Factory" rather than
   "/AIoT/SmartFactory/work-orders". The nav tables are already the single
   place those names live; this walks them instead of repeating the mapping. */

export interface NavEntry {
  path: string;
  /** English source string — the shell's table translates it. */
  title: string;
  /** The section the item belongs to, e.g. "Smart Factory". */
  section: string;
}

/** Every routable leaf of a section, including its pinned footer rows. */
function leaves(section: NavSection): NavEntry[] {
  const out: NavEntry[] = [];
  const walk = (items: NavItem[]) => {
    for (const item of items) {
      // External links and "coming soon" rows go nowhere worth recording.
      if (item.path && !item.comingSoon) {
        out.push({ path: item.path, title: item.title, section: section.title });
      }
      if (item.children) walk(item.children);
    }
  };
  walk(section.items);
  walk(section.footerItems ?? []);
  return out;
}

/* Built once: the tables are module constants, so this can't go stale. */
const ENTRIES: NavEntry[] = [factoryNav, trackNav, cloudManagementNav].flatMap(leaves);

/** Trailing slashes and casing are the browser's business, not ours. */
const normalise = (path: string) => path.replace(/\/+$/, "").toLowerCase();

/**
 * The nav item a pathname belongs to, or null for a page the sidebar doesn't
 * name (a detail view, an unknown path). The longest match wins, so
 * /devices/gateways resolves to Gateways rather than to Devices.
 */
export function resolveNavEntry(pathname: string): NavEntry | null {
  const target = normalise(pathname);
  let best: NavEntry | null = null;
  let bestLength = -1;

  for (const entry of ENTRIES) {
    const candidate = normalise(entry.path);
    const matches = candidate === "" ? target === "" : target === candidate || target.startsWith(`${candidate}/`);
    if (matches && candidate.length > bestLength) {
      best = entry;
      bestLength = candidate.length;
    }
  }
  return best;
}

/** One step of a page's breadcrumb: the product, a group, the page itself. */
export interface NavCrumb {
  /** English source string — the shell's table translates it. */
  title: string;
  /** Where the step leads; absent for a group, which is not a page. */
  path?: string;
}

/* The product pages the sidebar names directly, each with the trail down to
   it: "Smart Factory › Assets › Devices". Only those pages: a detail or form
   page draws its own breadcrumb, which knows the record it is showing. */
const TRAILS: { path: string; crumbs: NavCrumb[] }[] = [factoryNav, trackNav].flatMap((section) => {
  const home = section.items.find((i) => i.path)?.path;
  const out: { path: string; crumbs: NavCrumb[] }[] = [];
  const walk = (items: NavItem[], parents: NavCrumb[]) => {
    for (const item of items) {
      if (item.path && !item.comingSoon) {
        out.push({ path: item.path, crumbs: [{ title: section.title, path: home }, ...parents, { title: item.title }] });
      }
      if (item.children) walk(item.children, [...parents, { title: item.title }]);
    }
  };
  walk(section.items, []);
  return out;
});

/* Smart Factory can carry the language in its URLs (/AIoT/SmartFactory/fa/devices). */
const withoutLanguage = (path: string) => path.replace(/^(\/aiot\/[^/]+)\/(en|fa|ar)(?=\/|$)/, "$1");

/** The breadcrumb for a page the sidebar names, or null for any other page. */
export function navTrail(pathname: string): NavCrumb[] | null {
  const target = withoutLanguage(normalise(pathname));
  return TRAILS.find((t) => normalise(t.path) === target)?.crumbs ?? null;
}
