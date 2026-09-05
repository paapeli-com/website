/* ------------------------------------------------------------------ */
/* Addresses, as search engines see them.                              */
/*                                                                     */
/* Every page is served in three languages, and the English one is     */
/* served at two addresses: its bare path, and the /en prefix the      */
/* middleware rewrites to. Google has to be told which of those is the */
/* page's real address (canonical) and which are the same page in      */
/* another language (hreflang) — left alone it folds them together and */
/* indexes whichever it picks.                                         */
/* ------------------------------------------------------------------ */

export const SITE_URL = "https://www.paapeli.com";

export const LOCALES = ["en", "fa", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/** English is the default locale, and it lives at the bare path. */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * The route behind a request path, with any locale prefix removed:
 * "/fa/gps-tracking" and "/en/gps-tracking" and "/gps-tracking" are all
 * the route "/gps-tracking".
 */
export function routeOf(pathname: string): string {
  const stripped = pathname.replace(
    new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`),
    "",
  );
  return stripped === "" ? "/" : stripped;
}

/** Where a route lives in one language. English keeps the bare path. */
export function localeUrl(locale: Locale, route: string): string {
  const path = route === "/" ? "" : route;
  return locale === DEFAULT_LOCALE
    ? `${SITE_URL}${path || "/"}`
    : `${SITE_URL}/${locale}${path}`;
}

/**
 * The canonical address of a route in one language, plus the full set of
 * hreflang alternates. x-default points at English, which is what a
 * reader with no matching language gets.
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
  "/contact",
  "/ddos-protection",
  "/edge-computing",
  "/edge-hub",
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
  "/gps-tracking",
  "/infrastructure-hub",
  "/inotex-2026",
  "/intelligence-hub",
  "/intelligence-insight",
  "/makers-developers",
  "/oil-gas",
  "/operations-hub",
  "/ota",
  "/pricing",
  "/request-demo",
  "/smart-agriculture",
  "/smart-buildings",
  "/smart-cities",
  "/smart-manufacturing",
  "/status",
];
