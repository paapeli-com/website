/* ------------------------------------------------------------------ */
/* Shared, product-agnostic session.                                  */
/* One login (at /login) creates a session in localStorage on the      */
/* shared origin, so every product/solution is signed in at once.      */
/* Sliding idle timeout: the session stays valid as long as the user   */
/* is active; after IDLE_MS of no activity it expires and /login is     */
/* required again. Mock for now; later backed by the gateway/API.      */
/* ------------------------------------------------------------------ */

const KEY = "paapeli_session";
export const IDLE_MS = 60 * 60 * 1000; // 1 hour of inactivity
export const LOGIN_URL = "/login";

/** `token` is the bearer JWT returned by the login API — carried in the same
 *  session object so every product app can attach it to its own API client. */
export type Session = { email: string; name: string; initial: string; expiresAt: number; token?: string };

/* Sessions written before the placeholder user was removed carry this name.
   The account's real display name is never this string, so treat it as absent
   rather than showing one tenant's name to whoever is signed in. Safe to drop
   once every stored session has rotated (they expire after IDLE_MS). */
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
    expiresAt: Date.now() + IDLE_MS,
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
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.expiresAt !== "number" || Date.now() > s.expiresAt) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
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

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function signOut(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

/** Extend the session (called on user activity) — the sliding part. */
export function touch(): void {
  const s = getSession();
  if (!s) return;
  s.expiresAt = Date.now() + IDLE_MS;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

/** Send the browser to the product-agnostic login, preserving where we were. */
export function goToLogin(redirect?: string): void {
  if (typeof window === "undefined") return;
  const r = redirect ?? window.location.pathname + window.location.search;
  window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(r)}`;
}

/**
 * Keep the session alive while the user is active and bounce to /login when
 * it expires from inactivity. Returns a cleanup function.
 */
export function startIdleWatch(onExpire: () => void = () => goToLogin()): () => void {
  if (typeof window === "undefined") return () => {};
  let lastTouch = 0;
  const onActivity = () => {
    const now = Date.now();
    if (now - lastTouch > 60_000) { lastTouch = now; touch(); } // throttle writes to 1/min
  };
  const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"] as const;
  events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
  const iv = window.setInterval(() => { if (!isAuthenticated()) onExpire(); }, 30_000);
  return () => {
    window.clearInterval(iv);
    events.forEach((e) => window.removeEventListener(e, onActivity));
  };
}
