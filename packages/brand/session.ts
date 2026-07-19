import { CURRENT_USER } from "./config";

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

export type Session = { email: string; name: string; initial: string; expiresAt: number };

export function signIn(email = CURRENT_USER.email): Session {
  const s: Session = {
    email: email || CURRENT_USER.email,
    name: CURRENT_USER.name,
    initial: CURRENT_USER.initial,
    expiresAt: Date.now() + IDLE_MS,
  };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
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
