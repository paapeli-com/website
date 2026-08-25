import type { StaticImageData } from "next/image";

import type { FeatureSlug, IndustrySlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* The shape every industry landing page is described by.             */
/* One config per industry, one template that renders them all.       */
/* ------------------------------------------------------------------ */

/** Named rather than imported so a config file stays plain data. */
export type StatIcon = "downtime" | "growth" | "money" | "water" | "people" | "leaf" | "shield";

export type IndustryStat = {
  icon: StatIcon;
  label: string;
  /** "up to", "by", the Persian equivalent. Sits above the figure. */
  prefix: string;
  /** The finished string, animated by <CountUp/>: "45%", "10-25%". */
  value: string;
};

export type IndustryCard = {
  title: string;
  description: string;
  items: string[];
};

export type IndustryCopy = {
  hero: { title: string; description: string; primary: string; secondary: string };
  offer: { heading: string; subheading: string; cards: [IndustryCard, IndustryCard, IndustryCard] };
  impact: {
    heading: string;
    stats: [IndustryStat, IndustryStat, IndustryStat];
    roiHeading: string;
    roiValue: string;
    roiCaption: string;
  };
  why: { heading: string; cards: [IndustryCard, IndustryCard, IndustryCard] };
  cta: { heading: string; description: string; button: string };
};

export type IndustryConfig = {
  slug: IndustrySlug;
  /** Full-bleed photograph behind the hero. */
  hero: StaticImageData;
  /** Three photographs, in the order the "what we deliver" cards use them. */
  images: [StaticImageData, StaticImageData, StaticImageData];
  /** Which of `images` each "why partners" card takes, by index. */
  whyOrder: [number, number, number];
  /** Feature pages this solution is built on, rendered as linked cards. */
  features: [FeatureSlug, FeatureSlug, FeatureSlug, FeatureSlug];
  /**
   * Mirrors the hero photograph in LTR only. Set it when the subject sits on
   * the left of the frame, where English copy starts.
   */
  mirrorHeroInLtr?: boolean;
  copy: Record<string, IndustryCopy>;
};
