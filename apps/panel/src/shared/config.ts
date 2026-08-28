/* Same-origin in dev so the Vite proxy (see vite.config.ts) handles the call.
   That proxy exists because the gateway's 401 responses carry no CORS headers,
   which makes them unreadable to JS cross-origin — and an unreadable 401 is a
   401 the session handling cannot act on.

   Production talks to the gateway directly, so the same blind spot applies
   there until the gateway sends CORS headers on its 401 path too. */
export const PAAPELI_API_BASE_URL = import.meta.env.DEV ? "" : "https://gateway.paapeli.me";
