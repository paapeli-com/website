import { useSyncExternalStore } from "react";

/* What this browser has already read in the bell, for the entries the server
   keeps no read state for: alarms and workspace invitations.
 *
 * Alarms are read up to a moment, per workspace: "Mark all read" moves the
 * moment to now, and every alarm raised before it counts as read. An
 * invitation is read by its workspace id.
 *
 * The bell and Home's "Needs attention" count both subscribe, so marking
 * read in the bell updates the count on Home at once, without a reload. */

const KEY = "paapeli_notification_reads";
const EVENT = "paapeli:notification-reads";

interface Reads {
  alarmsReadAt: Record<string, number>;
  invitations: string[];
}

const EMPTY: Reads = { alarmsReadAt: {}, invitations: [] };
let cached: Reads | null = null;

function load(): Reads {
  if (cached) return cached;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cached = {
      alarmsReadAt: raw?.alarmsReadAt && typeof raw.alarmsReadAt === "object" ? raw.alarmsReadAt : {},
      invitations: Array.isArray(raw?.invitations) ? raw.invitations : [],
    };
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function save(next: Reads) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Private window or storage blocked: the reads last until the next reload. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cached = null;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useNotificationReads(): Reads {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** When the workspace's alarms were last all read; 0 if never. */
export const alarmsReadAt = (reads: Reads, workspaceId: string | null | undefined) =>
  (workspaceId && reads.alarmsReadAt[workspaceId]) || 0;

export function markAlarmsRead(workspaceId: string) {
  const reads = load();
  save({ ...reads, alarmsReadAt: { ...reads.alarmsReadAt, [workspaceId]: Date.now() } });
}

export function markInvitationsRead(workspaceIds: string[]) {
  if (!workspaceIds.length) return;
  const reads = load();
  save({ ...reads, invitations: Array.from(new Set([...reads.invitations, ...workspaceIds])) });
}
