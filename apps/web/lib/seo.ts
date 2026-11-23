/* ------------------------------------------------------------------ */
/* Addresses, as search engines see them.                              */
/*                                                                     */
/* Every page is served in three languages, and the Persian one is     */
/* served at two addresses: its bare path, and the /fa prefix the      */
/* middleware rewrites to. Google has to be told which of those is the */
/* page's real address (canonical) and which are the same page in      */
/* another language (hreflang) — left alone it folds them together and */
/* indexes whichever it picks.                                         */
/* ------------------------------------------------------------------ */

export const SITE_URL = "https://www.paapeli.com";

export const LOCALES = ["en", "fa", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/** Persian is the default locale, and it lives at the bare path. Most
 *  readers are in Iran, so paapeli.com opens in their language; English
 *  and Arabic keep their /en and /ar prefixes. */
export const DEFAULT_LOCALE: Locale = "fa";

/**
 * The locale a request path is in. Read it from the path rather than
 * from the route's own `params`: a layout's params came back as the
 * default locale in production, which quietly canonicalised every
 * Persian and Arabic page to its English twin.
 */
export function localeOf(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as Locale)
    ? (segment as Locale)
    : DEFAULT_LOCALE;
}

/**
 * The route behind a request path, with any locale prefix removed:
 * "/fa/fleet-tracking" and "/en/fleet-tracking" and "/fleet-tracking" are all
 * the route "/fleet-tracking".
 */
export function routeOf(pathname: string): string {
  const stripped = pathname.replace(
    new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`),
    "",
  );
  return stripped === "" ? "/" : stripped;
}

/**
 * An in-site link to a route, in one language.
 *
 * Persian lives at the bare path, so "/pricing" is a Persian reader's
 * address and "/fa/pricing" is a second address for the same page. Both
 * resolve, but only the bare one is canonical and only the bare one is
 * in the sitemap — so every internal link has to use it. A menu that
 * points at /fa/... spends crawl budget on a URL whose own canonical
 * sends the crawler somewhere else.
 */
export function localePath(language: string, route: string): string {
  const path = route === "/" ? "" : route;
  return language === DEFAULT_LOCALE ? path || "/" : `/${language}${path}`;
}

/** Where a route lives in one language. Persian keeps the bare path. */
export function localeUrl(locale: Locale, route: string): string {
  const path = route === "/" ? "" : route;
  return locale === DEFAULT_LOCALE
    ? `${SITE_URL}${path || "/"}`
    : `${SITE_URL}/${locale}${path}`;
}

/**
 * The canonical address of a route in one language, plus the full set of
 * hreflang alternates. x-default points at English (under /en), which
 * is what a reader with no matching language gets.
 */
export function alternatesFor(locale: Locale, route: string) {
  return {
    canonical: localeUrl(locale, route),
    languages: {
      en: localeUrl("en", route),
      fa: localeUrl("fa", route),
      ar: localeUrl("ar", route),
      "x-default": localeUrl("en", route),
    },
  };
}

/**
 * Every route worth putting in front of a crawler.
 *
 * The assessment funnel (/AI-Readiness-Assessment/start and its steps,
 * and /report) is left out on purpose: those pages only make sense once
 * a visitor is part-way through the form, and a crawler landing on them
 * cold sees an empty shell.
 *
 * This list is written by hand. A new page under app/[lang] does not
 * reach Google until its route is added here.
 */
export const ROUTES: readonly string[] = [
  "/",
  "/aiot-platform",
  "/AI-Readiness-Assessment",
  "/AI-Readiness-Assessment/about",
  "/AI-Readiness-Assessment/methodology",
  "/careers",
  "/contact",
  "/ddos-protection",
  "/edge-computing",
  "/energy-monitoring",
  "/features/alerts-events",
  "/features/anomaly-detection",
  "/features/device-management",
  "/features/flexible-deployment",
  "/features/ota-updates",
  "/features/predictive-analytics",
  "/features/realtime-monitoring",
  "/features/solution-templates",
  "/fleet-tracking",
  "/intelligence-insight",
  "/oil-gas",
  "/pricing",
  "/request-demo",
  "/smart-agriculture",
  "/smart-buildings",
  "/smart-manufacturing",
  "/status",
];
