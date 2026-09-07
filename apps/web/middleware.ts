import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/* Locale routing.                                                     */
/* Every page lives under app/[lang]/… . The app navigates the default */
/* locale (English) to *bare* paths (e.g. "/gps-tracking"), so without */
/* this middleware those paths get captured as [lang]="gps-tracking"   */
/* and render the home page. Here we transparently rewrite any path    */
/* that doesn't already start with a known locale to "/en/…", so both  */
/* "/gps-tracking" and "/en/gps-tracking" resolve to the same page.    */
/*                                                                     */
/* The rewrite hides the address the visitor actually asked for, and   */
/* app/[lang]/layout.tsx needs it to build the canonical and hreflang  */
/* links, so it travels on to the render as x-pathname.                */
/* ------------------------------------------------------------------ */

const LOCALES = ["en", "ar", "fa"] as const;

/* Pages that have been retired into another page, keyed by the route
   with no locale on the front. Google has crawled these addresses and
   visitors have them bookmarked, so they get a permanent redirect to
   whatever replaced them rather than a 404 that throws away everything
   the old address had earned.

   /ota was a thin second page about over-the-air updates, saying less
   than /features/ota-updates said about the same thing. Two pages
   competing for one subject split the signal between them, so there is
   now one. */
const RETIRED: Record<string, string> = {
  "/ota": "/features/ota-updates",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

  /* Retired routes first, and in one hop: matching before the /en rule
     means "/en/ota" lands on /features/ota-updates directly rather than
     bouncing through /ota. */
  const prefix = LOCALES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  const route = prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
  const replacement = RETIRED[route];
  if (replacement) {
    const url = req.nextUrl.clone();
    /* English is canonical at the bare path; the other two keep theirs. */
    url.pathname =
      !prefix || prefix === "en" ? replacement : `/${prefix}${replacement}`;
    return NextResponse.redirect(url, 301);
  }

  /* English is canonical at the bare path, so "/en/pricing" is a second
     address for a page that already has one. Send it to the real one
     permanently rather than leaving two of everything for a crawler to
     reconcile. Rewrites below do not re-enter middleware, so the bare
     path it lands on is served, not redirected again. */
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 301);
  }

  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next({ request: { headers } });

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (assets).
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
