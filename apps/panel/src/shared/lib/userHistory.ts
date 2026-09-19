import { getCurrentUser, getCurrentUserId } from "@paapeli/brand/session";

/* Per-user history, kept in this browser.
 *
 * Nothing on the gateway records where someone has been or when they first
 * signed in, so Home's "Recently visited" list and its new-vs-returning
 * greeting are built from what this document can observe for itself: the
 * shell records each navigation (see src/shell/Layout.tsx), and Home reads
 * the result back.
 *
 * Consequences worth knowing, rather than papering over:
 *   - It is per browser. A returning user on a new device has no history
 *     here, which is why the greeting also consults the account's own
 *     subscription age (see isEstablishedAccount).
 *   - It is per user. The key carries the user id (or their email, when the
 *     token has no id claim), so signing in as someone else on a shared
 *     machine never inherits the previous person's trail.
 *   - Private mode, cleared site data and a full storage quota all make it
 *     unavailable. Every read and write is guarded; the caller gets an empty
 *     history rather than an exception.
 */

export interface RecentVisit {
  /** Absolute path, e.g. "/AIoT/SmartFactory/work-orders". */
  path: string;
  /** Nav item title, an English key the shell's table translates. */
  title: string;
  /** The nav section it belongs to, e.g. "Smart Factory". */
  section: string;
  /** Epoch ms of the most recent visit. */
  at: number;
}

interface UserHistory {
  /** Epoch ms this browser first saw this user signed in. */
  firstSeenAt: number;
  visits: RecentVisit[];
}

/** How many entries are kept. The card shows at most four. */
const MAX_VISITS = 8;

const KEY_PREFIX = "paapeli_user_history:";

/** Identifies the signed-in user, or null when there is no session. */
function userKey(): string | null {
  const id = getCurrentUserId();
  if (id) return id;
  const email = getCurrentUser()?.email?.trim().toLowerCase();
  return email || null;
}

function read(): UserHistory | null {
  const key = userKey();
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserHistory;
    if (typeof parsed?.firstSeenAt !== "number") return null;
    return { firstSeenAt: parsed.firstSeenAt, visits: Array.isArray(parsed.visits) ? parsed.visits : [] };
  } catch {
    return null;
  }
}

function write(history: UserHistory): void {
  const key = userKey();
  if (!key) return;
  try {
    window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(history));
  } catch {
    /* Private mode or a full quota — the history is a convenience, not state
       anything depends on, so losing it must not break the page. */
  }
}

/** The most recent distinct places this user has been, newest first. */
export function getRecentVisits(limit = 4): RecentVisit[] {
  return (read()?.visits ?? []).slice(0, limit);
}

/**
 * Record a navigation. Repeat visits to the same page move it back to the
 * top rather than filling the list with one entry many times over.
 */
export function recordVisit(visit: Omit<RecentVisit, "at">): void {
  const key = userKey();
  if (!key) return;
  const history = read() ?? { firstSeenAt: Date.now(), visits: [] };
  const withoutThisPage = history.visits.filter((v) => v.path !== visit.path);
  write({
    firstSeenAt: history.firstSeenAt,
    visits: [{ ...visit, at: Date.now() }, ...withoutThisPage].slice(0, MAX_VISITS),
  });
}

/** True once this browser has seen this user before — i.e. not their first visit. */
export function hasVisitedBefore(): boolean {
  return read() !== null;
}

/** Start this user's history, so the next visit is recognised as a return. */
export function markVisited(): void {
  if (read()) return;
  write({ firstSeenAt: Date.now(), visits: [] });
}

/* Timestamps from the gateway are plain numbers with no documented unit, and
   the two it could be are a thousand-fold apart. Anything below this is
   seconds: as milliseconds it would be 1970, and as seconds it is 2001. */
const MS_THRESHOLD = 1e12;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the account itself has been around a while, regardless of this
 * browser: any product subscribed more than a day ago. It is what stops a
 * long-standing customer on a fresh laptop being greeted as brand new.
 */
export function isEstablishedAccount(createdAtValues: number[]): boolean {
  const now = Date.now();
  return createdAtValues.some((value) => {
    if (!value) return false;
    const ms = value < MS_THRESHOLD ? value * 1000 : value;
    return now - ms > DAY_MS;
  });
}
