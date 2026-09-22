/* ------------------------------------------------------------------ */
/* Shared, product-agnostic session.                                  */
/* One login (at /login) creates a session in localStorage on the      */
/* shared origin, so every product/solution is signed in at once.      */
/* There is no client-side expiry. The session lasts as long as the    */
/* gateway's refresh token: @paapeli/api refreshes the access token    */
/* when it expires and signs out only when that refresh is refused.    */
/* (A 1-hour idle timer used to live here, from before real auth; it   */
/* signed people out with no 401 and no refresh attempt.)              */
/* ------------------------------------------------------------------ */

const KEY = "paapeli_session";
export const LOGIN_URL = "/login";

/** `token` is the bearer JWT returned by the login API — carried in the same
 *  session object so every product app can attach it to its own API client.
 *  `expiresAt` is ignored by this build; see LEGACY_EXPIRES_AT. */
export type Session = { email: string; name: string; initial: string; expiresAt?: number; token?: string };

/* Builds before v0.2.50 delete any session whose `expiresAt` is missing or
   past, on every read — including reads triggered by the storage event a
   login in ANOTHER tab fires. A tab still running such a build (or, in dev, a
   module Vite hot-swapped without dropping its old listeners) would erase a
   fresh login within a second. So sessions keep a far-future `expiresAt` for
   those readers; nothing in this build looks at it. */
const LEGACY_EXPIRES_AT = 8_640_000_000_000_000; // the largest valid Date

/* Sessions written before the placeholder user was removed carry this name.
   The account's real display name is never this string, so treat it as absent
   rather than showing one tenant's name to whoever is signed in. Safe to drop
   once no stored session predates the change. */
const LEGACY_PLACEHOLDER_NAME = "هلدینگ هوشمند سینا";

/** `name` is the account's own display name, which only signup returns today.
 *  There is no "who am I" endpoint, so for anyone signing in with a password
 *  or Google it stays empty and the UI says it has no data — the email below
 *  is real either way. It used to fall back to a hardcoded placeholder person,
 *  so every session displayed the same name no matter who had logged in. */
export function signIn(email = "", token?: string, name?: string): Session {
  const resolvedEmail = email.trim();
  const resolvedName = name?.trim() ?? "";
  const s: Session = {
    email: resolvedEmail,
    name: resolvedName,
    // The avatar letter is real even without a name — it comes off the email.
    initial: (resolvedName || resolvedEmail).trim().charAt(0).toUpperCase(),
    expiresAt: LEGACY_EXPIRES_AT,
    token,
  };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}

/** The bearer token from the current session, if any (set at /login). */
export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session | null;
    return s && typeof s === "object" ? s : null;
  } catch {
    return null;
  }
}

/** The signed-in account, for anything rendering a name, email or avatar.
 *  `name` is empty when the account has no display name — callers show their
 *  own localised "no data" for it. `email` and `initial` are always real. */
export function getCurrentUser(): { name: string; email: string; initial: string } | null {
  const s = getSession();
  if (!s) return null;
  const name = s.name === LEGACY_PLACEHOLDER_NAME ? "" : s.name;
  return {
    name,
    email: s.email,
    initial: (name || s.email).trim().charAt(0).toUpperCase(),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in account's user id, read from the bearer JWT's payload.
 *  There is no "who am I" endpoint and login returns only the token, so the
 *  token is the one place the id lives. The claim name isn't documented, so
 *  the usual ones are tried and only a UUID (the shape of a user id) counts.
 *  Not verified here — the gateway checks the signature on every call. */
export function getCurrentUserId(): string | null {
  const token = getToken();
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")));
    for (const key of ["userId", "user_id", "uid", "id", "sub"]) {
      const value = claims?.[key];
      if (typeof value === "string" && UUID_RE.test(value)) return value;
    }
  } catch {}
  return null;
}

/** Swap in a rotated access token (see the refresh flow in @paapeli/api's
 *  napiHttpHandler), keeping the rest of the session as it is. */
export function updateToken(token: string): void {
  const s = getSession();
  if (!s) return;
  s.token = token;
  s.expiresAt = LEGACY_EXPIRES_AT;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

/** Called with the session's token whenever ANOTHER tab changes it — a
 *  refresh there rotates the token here too. `storage` events never fire in
 *  the tab that made the change. Returns an unsubscribe function. */
export function subscribeToken(listener: (token: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener(getToken());
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function signOut(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

/** Send the browser to the product-agnostic login, preserving where we were. */
export function goToLogin(redirect?: string): void {
  if (typeof window === "undefined") return;
  const r = redirect ?? window.location.pathname + window.location.search;
  window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(r)}`;
}

/**
 * Bounce to /login once the session is gone — signed out in another tab, or
 * cleared by a refused refresh in another bundle. Returns a cleanup function.
 */
export function startSessionWatch(onSignedOut: () => void = () => goToLogin()): () => void {
  if (typeof window === "undefined") return () => {};
  const check = () => { if (!isAuthenticated()) onSignedOut(); };
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) check(); };
  window.addEventListener("storage", onStorage);
  const iv = window.setInterval(check, 30_000);
  return () => {
    window.clearInterval(iv);
    window.removeEventListener("storage", onStorage);
  };
}
