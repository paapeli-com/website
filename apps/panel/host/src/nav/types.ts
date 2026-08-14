import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  icon: LucideIcon;
  /** Path relative to the solution's mount point, e.g. "/devices". */
  path?: string;
  /** External link (opens in a new tab) instead of an internal route. */
  href?: string;
  children?: NavItem[];
}
