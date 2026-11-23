import { PRODUCTS, type Product } from "@paapeli/brand/config";

/* The gateway origin every API call goes to, from PAAPELI_API_BASE_URL (see
   .env.example; the PAAPELI_ prefix is exposed by envPrefix in vite.config.ts).
   Vite inlines it at build time, so it is the value present when the bundle was
   built — not one the serving container can change later.

   Always an absolute origin, in dev as much as in production: requests go
   straight to the gateway so the URL in the browser's network tab is the URL
   that was actually served. There is deliberately no same-origin mode and no
   dev proxy to hide it behind.

   The cost, accepted knowingly: the gateway omits CORS headers on its 401s (it
   sends them on preflight and on a 400, but the auth entry point short-circuits
   before the CORS filter), so cross-origin a 401 is unreadable to JS — axios
   sees an opaque network error with no `response`, the interceptor in
   @paapeli/api cannot recognise the expiry, and a dead session does not sign
   itself out on its own. Fixing that belongs on the gateway, not here.

   Blank counts as unset and falls back to the gateway below. That guard is
   load-bearing, not decorative: `ARG PAAPELI_API_BASE_URL` in
   ci/docker/panel/Dockerfile expands to an EMPTY string when no --build-arg is
   passed, so a plain `docker build` hands Vite "" rather than nothing. An
   earlier version read "" as same-origin and shipped a production bundle that
   called panel.paapeli.me/api/… — which server.mjs's SPA fallback answers with
   200 text/html, so every query resolved to the HTML shell as a string and the
   shell crashed on `workspaces.some is not a function`. Blank must never mean
   "call yourself". */
const configured = import.meta.env.PAAPELI_API_BASE_URL?.trim();

export const PAAPELI_API_BASE_URL = configured || "https://api.paapeli.com";

/* Google Identity Services client ID for the sign-in button on /login.
   A public value by design — it is sent to Google in the browser and is not a
   secret. The gateway does the actual verification: it re-checks the ID token
   this client produces against Google before issuing a Paapeli token. */
export const GOOGLE_CLIENT_ID =
  "1071216349974-sjdfgo4cru8ln56c9mge19la4rj86n8l.apps.googleusercontent.com";

/* Map.ir API key for the track maps' base tiles (see .env.example). Like the
   gateway origin it is inlined at build time. It rides in every tile URL, so
   it is visible to anyone using the panel — restrict it by domain in the
   Map.ir panel. Unset or blank falls back to OpenStreetMap tiles. */
export const MAPIR_API_KEY = import.meta.env.PAAPELI_MAPIR_API_KEY?.trim() || "";

/* Which platform this bundle was built for, from PAAPELI_STAGE: "staging" for
   panel.paapeli.me (the dev branch), "production" for panel.paapeli.com (a
   release tag). Set per pipeline in .gitlab-ci.yml and inlined at build time
   like the values above.

   Unset means production for a build and staging for `pnpm dev`, so a build
   that forgets the flag hides the unreleased products instead of shipping
   them. */
const stage = import.meta.env.PAAPELI_STAGE?.trim().toLowerCase();

export const IS_STAGING = stage ? stage === "staging" : import.meta.env.DEV;

/* Products that are built but not launched: AI Inference and AI Agent Maker
   today. Staging opens them; production lists them as "Coming soon" with no
   way in, and has no route to AI Inference, until this flips for them. */
export const SHOW_UNRELEASED_PRODUCTS = IS_STAGING;

/* @paapeli/brand/config's PRODUCTS as this build shows them: a solution
   marked unreleased (none today) is left out on production, from
   the switcher, Home, search, Subscriptions and Members alike. Read this
   rather than PRODUCTS wherever products are listed to people. */
export const LISTED_PRODUCTS: Product[] = PRODUCTS.map((product) =>
  product.solutions
    ? { ...product, solutions: product.solutions.filter((s) => SHOW_UNRELEASED_PRODUCTS || !s.unreleased) }
    : product,
);

/* IaaS (Cloud Server) is listed on production as well as staging: the
   family, its sidebar row, its switcher row and its Home cards all show. */
export const SHOW_IAAS = true;

/* Whether Cloud Server can be opened. Staging opens it; production lists it
   as "Coming soon" with no route, the way AI Inference waits, until it
   launches. */
export const OPEN_CLOUD_SERVER = IS_STAGING;
