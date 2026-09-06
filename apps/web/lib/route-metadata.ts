import type { Metadata } from "next";

import { metaFor } from "@/lib/page-meta";
import { DEFAULT_LOCALE, LOCALES, alternatesFor, type Locale } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Per-page metadata, without asking for the request.                  */
/*                                                                     */
/* app/[lang]/layout.tsx used to read the address out of the           */
/* x-pathname header, because a layout is not told which page sits     */
/* under it and 24 of the 39 pages are client components that cannot   */
/* export metadata of their own. headers() is a dynamic API, though,   */
/* so reading it opted every page under [lang] out of static rendering */
/* — the build went from 123 prerendered pages to 4, and every visit   */
/* started rendering the page from scratch on the server.              */
/*                                                                     */
/* A layout inside a route folder does know its own route: it is the   */
/* folder it sits in. So each page gets a small layout that names its  */
/* route here, the pages themselves stay untouched, and nothing has to */
/* ask what the request was.                                           */
/* ------------------------------------------------------------------ */

type RouteMetadataOptions = {
  /**
   * Keep the page out of the index while still following its links.
   * For pages that only make sense part-way through a flow: a crawler
   * arriving cold sees an empty shell, which is worth no impressions
   * and dilutes the pages that are worth some.
   */
  noindex?: boolean;
};

/**
 * The `generateMetadata` for one route, in the language of the [lang]
 * segment above it. Returns the function rather than the metadata so a
 * route layout is a single line.
 */
export function metadataForRoute(route: string, options: RouteMetadataOptions = {}) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ lang: string }>;
  }): Promise<Metadata> {
    const { lang } = await params;
    const locale: Locale = LOCALES.includes(lang as Locale)
      ? (lang as Locale)
      : DEFAULT_LOCALE;

    const alternates = alternatesFor(locale, route);
    const meta = metaFor(locale, route);

    return {
      ...(meta && { title: meta.title, description: meta.description }),
      alternates,
      ...(options.noindex && { robots: { index: false, follow: true } }),
      openGraph: {
        url: alternates.canonical,
        locale,
        ...(meta && { title: meta.title, description: meta.description }),
      },
    };
  };
}
