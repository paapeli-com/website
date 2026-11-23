import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Locale routing.                                                     */
/* Every page lives under app/[lang]/… . The app navigates the default */
/* locale (Persian) to *bare* paths (e.g. "/pricing"), so without this */
/* middleware those paths get captured as [lang]="pricing" and render  */
/* the home page. Here we transparently rewrite any path that doesn't  */
/* already start with a known locale to "/fa/…", so both "/pricing"    */
/* and "/fa/pricing" resolve to the same page.                         */
/*                                                                     */
/* The rewrite hides the address the visitor actually asked for, and   */
/* app/[lang]/layout.tsx needs it to build the canonical and hreflang  */
/* links, so it travels on to the render as x-pathname.                */
/* ------------------------------------------------------------------ */

/* Pages that have been retired into another page, keyed by the route
   with no locale on the front. Google has crawled these addresses and
   visitors have them bookmarked, so they get a permanent redirect to
   whatever replaced them rather than a 404 that throws away everything
   the old address had earned.

   /ota was a thin second page about over-the-air updates, saying less
   than /features/ota-updates said about the same thing. Two pages
   competing for one subject split the signal between them, so there is
   now one.

   The five "hubs" were a second product lineup that the header never
   offered. Each goes to the page that covers the same ground. */
const RETIRED: Record<string, string> = {
  "/ota": "/features/ota-updates",
  "/operations-hub": "/aiot-platform",
  "/edge-hub": "/edge-computing",
  "/intelligence-hub": "/intelligence-insight",
  "/infrastructure-hub": "/smart-buildings",
  "/gps-tracking": "/fleet-tracking",
};

const prefixOf = (pathname: string) =>
  LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

  /* Retired routes first, and in one hop: matching before the default
     locale's rule means "/fa/ota" lands on /features/ota-updates
     directly rather than bouncing through /ota. */
  const prefix = prefixOf(pathname);
  const route = prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
  const replacement = RETIRED[route];
  if (replacement) {
    const url = req.nextUrl.clone();
    /* The default locale is canonical at the bare path; the others keep theirs. */
    url.pathname =
      !prefix || prefix === DEFAULT_LOCALE ? replacement : `/${prefix}${replacement}`;
    return NextResponse.redirect(url, 301);
  }

  /* The default locale is canonical at the bare path, so "/fa/pricing"
     is a second address for a page that already has one. Send it to the
     real one permanently rather than leaving two of everything for a
     crawler to reconcile. Rewrites below do not re-enter middleware, so
     the bare path it lands on is served, not redirected again. */
  if (prefix === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 301);
  }

  if (prefix) return NextResponse.next({ request: { headers } });

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (assets).
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
