import type { StaticImageData } from "next/image";

import type { FeatureSlug, IndustrySlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* The shape every platform-feature page is described by.             */
/* One config per feature, one template that renders them all, laid   */
/* out to sit beside the industry landings without looking borrowed.  */
/* ------------------------------------------------------------------ */

/** Named rather than imported so a config file stays plain data. */
export type CapabilityIcon =
  | "bell"
  | "branch"
  | "send"
  | "radar"
  | "search"
  | "warning"
  | "boxes"
  | "plug"
  | "checklist"
  | "cloud"
  | "server"
  | "shield"
  | "layers"
  | "refresh"
  | "package"
  | "calendar"
  | "chart"
  | "wrench"
  | "pulse"
  | "gauge"
  | "dashboard"
  | "timer"
  | "template";

export type FeatureCard = {
  title: string;
  description: string;
  items: [string, string, string];
};

export type Capability = {
  icon: CapabilityIcon;
  title: string;
  description: string;
};

export type FeatureCopy = {
  hero: { badge: string; title: string; description: string; primary: string; secondary: string };
  offer: { heading: string; subheading: string; cards: [FeatureCard, FeatureCard, FeatureCard] };
  panel: { heading: string; description: string };
  capabilities: { heading: string; subheading: string; cards: Capability[] };
  /** Heading above the industry chips; the industries themselves are config. */
  usedIn: string;
  /** Heading above the cards pointing at the other feature pages. */
  related: string;
  cta: { heading: string; description: string; button: string };
};

export type FeatureConfig = {
  slug: FeatureSlug;
  /** Full-bleed photograph behind the hero. */
  hero: StaticImageData;
  /** Three photographs, in the order the "what you get" cards use them. */
  images: [StaticImageData, StaticImageData, StaticImageData];
  /** A real screen from the panel, not concept art. */
  panel: StaticImageData;
  /** Industry pages this feature is used by, rendered as linked chips. */
  usedIn: IndustrySlug[];
  /** Sibling feature pages, rendered as linked cards. */
  related: FeatureSlug[];
  copy: Record<string, FeatureCopy>;
};
