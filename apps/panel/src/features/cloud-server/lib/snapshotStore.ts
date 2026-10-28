import { useSyncExternalStore } from "react";

/* Snapshots, until Cloud Server has an API.
 *
 * What Nova's createImage gives: a copy of a server's boot disk at one
 * moment, made by hand, kept until deleted. Restoring is a rebuild of the
 * server from it. Unlike Backup there is no schedule and no capacity: a
 * snapshot is taken when wanted, before a risky change, and deleted when no
 * longer needed. Deleting a server deletes its snapshots with it; the
 * server's delete dialog says so.
 */

/** How long a snapshot or a restore reads as in progress. */
export const SNAPSHOT_BUSY_MS = 8000;

export interface SnapshotRecord {
  id: string;
  name: string;
  serverId: string;
  region: string;
  zone: string;
  sizeGb: number;
  createdAt: number;
  /** Until when a restore from it runs, if one does. */
  restoringUntil?: number;
}

export type SnapshotStatus = "creating" | "ready" | "restoring";

export const snapshotStatus = (s: SnapshotRecord, now = Date.now()): SnapshotStatus =>
  now - s.createdAt < SNAPSHOT_BUSY_MS ? "creating" : s.restoringUntil && s.restoringUntil > now ? "restoring" : "ready";

const STORAGE_KEY = "paapeli.cloudServer.snapshots";
const listeners = new Set<() => void>();

function read(): SnapshotRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SnapshotRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: SnapshotRecord[] = read();

function write(next: SnapshotRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

export function takeSnapshot(input: Omit<SnapshotRecord, "id" | "createdAt">): SnapshotRecord {
  const record: SnapshotRecord = { id: `snap-${Date.now().toString(36)}`, createdAt: Date.now(), ...input };
  write([record, ...cache]);
  return record;
}

/** Read outside React. */
export const getSnapshots = () => cache;

export const restoreSnapshot = (id: string) =>
  write(cache.map((s) => (s.id === id ? { ...s, restoringUntil: Date.now() + SNAPSHOT_BUSY_MS } : s)));
export const renameSnapshot = (id: string, name: string) => write(cache.map((s) => (s.id === id ? { ...s, name } : s)));
export const deleteSnapshots = (ids: string[]) => write(cache.filter((s) => !ids.includes(s.id)));
/** With their servers: a snapshot restores only the server it was taken of. */
export const deleteSnapshotsOf = (serverIds: string[]) => write(cache.filter((s) => !serverIds.includes(s.serverId)));

export function useSnapshots(): SnapshotRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
