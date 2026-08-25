import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  icon: LucideIcon;
  /** Path relative to the solution's mount point, e.g. "/devices". */
  path?: string;
  /** External link (opens in a new tab) instead of an internal route. */
  href?: string;
  children?: NavItem[];
  /**
   * Not wired to a real page/endpoint yet. Leaf items render as a
   * "Coming soon" toast instead of a link; groups render fully muted with
   * a "Coming Soon" badge instead of a chevron and don't expand.
   */
  comingSoon?: boolean;
}

/** One sidebar's full contents — the banner at the top plus its nav items. */
export interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}
