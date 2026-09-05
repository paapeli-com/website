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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

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
