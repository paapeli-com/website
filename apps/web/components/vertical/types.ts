import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";

/* ------------------------------------------------------------------ */
/* Config contract for a vertical / solution landing page.            */
/* Every solution page (Tracking Hub, Operations Hub, …) is described  */
/* by one of these objects and rendered by <VerticalLanding/>, so all  */
/* pages stay structurally identical and on-brand. Optional sections   */
/* are simply omitted from the config.                                 */
/* ------------------------------------------------------------------ */

export type CTA = { label: string; href: string };

export type Segment = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  /** Tailwind gradient classes for the placeholder frame, e.g. "from-… to-…". */
  gradient: string;
  /** Optional real photo — bleeds edge-to-edge and replaces the placeholder. */
  image?: StaticImageData;
};

export type FeatureItem = { icon: LucideIcon; title: string; description: string };

export type VerticalConfig = {
  slug: string;

  /* Hero */
  badge?: string;
  eyebrow: string;
  /** Where the badge pill leads. Without it the pill is a plain label,
      drawn without the chevron so it does not offer a click it cannot
      honour — it used to be a link to "#" on every solution page. */
  badgeHref?: string;
  titleTop: string;
  titleBottom: string;
  subtitle: string;
  primaryCta: CTA;
  secondaryCta?: CTA;
  chips?: { icon: LucideIcon; label: string }[];
  heroVisual: ReactNode;

  /* Sections (all optional except segments + features) */
  logosHeading?: string;

  segments: { heading: string; subtitle: string; items: Segment[] };
  features: { heading: string; subtitle: string; items: FeatureItem[] };

  showcase?: {
    heading: string;
    subtitle: string;
    points: FeatureItem[];
    cta?: CTA;
    visual: ReactNode;
  };

  stats?: { stat: string; label: string }[];

  steps?: { heading: string; subtitle: string; items: { title: string; description: string }[] };

  faq?: { heading: string; subtitle: string; items: { q: string; a: string }[] };

  cta: { title: string; subtitle: string; primary: CTA; secondary?: CTA };
};
