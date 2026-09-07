import type { MetadataRoute } from "next";

import { LOCALES, ROUTES, alternatesFor, localeUrl } from "@/lib/seo";

/**
 * One entry per page per language, each carrying the hreflang set for
 * its siblings, which is how Google learns the three language versions
 * are the same page rather than three thin duplicates.
 *
 * This replaces a hand-written public/sitemap.xml that listed seven
 * URLs, six of which lived on the docs host — a sitemap can only speak
 * for its own host, so those were being ignored. The docs site keeps
 * its own sitemap, one per locale.
 *
 * There is deliberately no lastModified. This route is rendered on
 * request, so a date computed here is the date of the crawl, not of the
 * page: every read of the sitemap claimed that all 105 URLs had changed
 * a second ago. A crawler that catches a sitemap lying about lastmod
 * stops trusting its dates at all, and no date is read as "no claim"
 * rather than as a false one. Put dates back only when they can come
 * from the content itself.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: localeUrl(locale, route),
      changeFrequency: (route === "/" ? "daily" : "weekly") as
        | "daily"
        | "weekly",
      priority: route === "/" ? 1 : 0.7,
      alternates: { languages: alternatesFor(locale, route).languages },
    })),
  );
}
