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
  /** A group that starts open, rather than only when one of its rows is the
      current page. */
  defaultOpen?: boolean;
  /** Trailing chevron on a leaf — signals it navigates into another area's own nav (e.g. a product). */
  chevron?: boolean;
  /**
   * Active for anything under `path`, not only for `path` itself. The footer's
   * product rows use it: they say which area you are in, so they stay lit
   * while a page row inside that area is lit too.
   */
  activeOnPrefix?: boolean;
}

/** One sidebar's full contents — the banner at the top plus its nav items. */
export interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  /**
   * Account-level rows (members, help, settings) pinned to the bottom of the
   * sidebar under a divider, below the scrolling `items` list.
   */
  footerItems?: NavItem[];
}
