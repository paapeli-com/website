import { isValidElement } from "react";

import type { VerticalConfig } from "@/components/vertical/types";
import type { Locale } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Persian and Arabic copy for a vertical landing.                     */
/*                                                                     */
/* The English config owns everything that is not words: icons,        */
/* gradients, visuals, links. A translation only has to carry the      */
/* strings, laid over the English config field by field and array     */
/* item by array item, so the three languages cannot drift apart in   */
/* structure. Anything a translation leaves out stays English.         */
/* ------------------------------------------------------------------ */

export type Copy<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Copy<U>[]
    : T extends object
      ? { [K in keyof T]?: Copy<T[K]> }
      : never;

export type VerticalCopy = Copy<VerticalConfig>;

function overlay(base: unknown, copy: unknown): unknown {
  if (copy === undefined) return base;
  if (typeof base === "string") return copy;
  if (Array.isArray(base)) {
    const items = copy as unknown[];
    return base.map((item, i) => overlay(item, items[i]));
  }
  if (base && typeof base === "object" && !isValidElement(base)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(copy as Record<string, unknown>)) {
      out[key] = overlay(out[key], value);
    }
    return out;
  }
  return base;
}

/** The config in each language, keyed by locale. */
export function localizeConfig(
  en: VerticalConfig,
  copy: { fa: VerticalCopy; ar: VerticalCopy },
): Record<Locale, VerticalConfig> {
  return {
    en,
    fa: overlay(en, copy.fa) as VerticalConfig,
    ar: overlay(en, copy.ar) as VerticalConfig,
  };
}
