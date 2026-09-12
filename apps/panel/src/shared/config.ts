/* The gateway origin every API call goes to, from PAAPELI_API_BASE_URL (see
   .env.example; the PAAPELI_ prefix is exposed by envPrefix in vite.config.ts).
   Vite inlines it at build time, so it is the value present when the bundle was
   built — not one the serving container can change later.

   Unset, it falls back to the shared gateway, which is what this was hardcoded
   to before and keeps `pnpm dev` working with no .env at all. Set it to "" to
   go same-origin and route through the Vite dev proxy instead.

   Requests go straight to the gateway by default, so the URL in the network tab
   is the URL actually served. The cost is that the gateway's 401s carry no CORS
   headers, so cross-origin they are unreadable to JS — axios sees an opaque
   network error with no `response`, the 401 interceptor in @paapeli/api cannot
   recognise the expiry, and a dead session never signs itself out. That has
   always been production's behaviour; the "" escape hatch above is the way to
   avoid it locally, and it stops mattering once the gateway sends CORS headers
   on its 401 path. */
export const PAAPELI_API_BASE_URL =
  import.meta.env.PAAPELI_API_BASE_URL ?? "https://gateway-mini.paapeli.me";

/* Google Identity Services client ID for the sign-in button on /login.
   A public value by design — it is sent to Google in the browser and is not a
   secret. The gateway does the actual verification: it re-checks the ID token
   this client produces against Google before issuing a Paapeli token. */
export const GOOGLE_CLIENT_ID =
  "1071216349974-sjdfgo4cru8ln56c9mge19la4rj86n8l.apps.googleusercontent.com";
