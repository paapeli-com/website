import { useSyncExternalStore } from "react";

/* Server backups, until Cloud Server has an API.
 *
 * What Nova's createBackup gives: an image of a server's boot disk, made on a
 * schedule or by hand, with a rotation that keeps the newest few and deletes
 * the oldest. Restoring is a rebuild of the server from one of those images.
 *
 * One backup per server. It has a fixed capacity (BACKUP_CAPACITY); when
 * it is full, a new backup takes the place of the oldest. The first automatic
 * backup comes within 24 hours, then one a week. Only the boot disk is kept.
 * Deleting a server deletes its backup with it; the server's delete dialog
 * says so.
 */

export const BACKUP_CAPACITY = 5;
/** How long a backup or a restore reads as in progress. */
export const BACKUP_BUSY_MS = 8000;
const DAY = 24 * 60 * 60 * 1000;

export interface BackupPoint {
  id: string;
  kind: "auto" | "manual";
  createdAt: number;
  sizeGb: number;
}

export interface BackupRecord {
  id: string;
  name: string;
  serverId: string;
  region: string;
  zone: string;
  /** The boot disk it copies. */
  diskGb: number;
  createdAt: number;
  /** Automatic backups stopped; backups by hand still work. */
  paused?: boolean;
  points: BackupPoint[];
  /** Until when a restore runs, if one does. */
  restoringUntil?: number;
}

export type BackupStatus = "active" | "paused" | "running" | "restoring";

export const backupStatus = (b: BackupRecord, now = Date.now()): BackupStatus =>
  b.restoringUntil && b.restoringUntil > now
    ? "restoring"
    : b.points.some((p) => now - p.createdAt < BACKUP_BUSY_MS)
      ? "running"
      : b.paused
        ? "paused"
        : "active";

/** The next automatic backup: within a day of turning it on, then weekly. */
export function nextBackupAt(b: BackupRecord): number | null {
  if (b.paused) return null;
  const lastAuto = b.points.filter((p) => p.kind === "auto").sort((x, y) => y.createdAt - x.createdAt)[0];
  return lastAuto ? lastAuto.createdAt + 7 * DAY : b.createdAt + DAY;
}

const STORAGE_KEY = "paapeli.cloudServer.backups";
const listeners = new Set<() => void>();

function read(): BackupRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BackupRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: BackupRecord[] = read();

function write(next: BackupRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const patch = (id: string, fn: (b: BackupRecord) => BackupRecord) => write(cache.map((b) => (b.id === id ? fn(b) : b)));

export function enableBackup(input: { name: string; serverId: string; region: string; zone: string; diskGb: number }): BackupRecord {
  const record: BackupRecord = { id: `bkp-${Date.now().toString(36)}`, createdAt: Date.now(), points: [], ...input };
  write([record, ...cache.filter((b) => b.serverId !== input.serverId)]);
  return record;
}

/** A backup by hand; with the capacity full, it takes the oldest one's place. */
export const backupNow = (id: string) =>
  patch(id, (b) => {
    const point: BackupPoint = { id: `pt-${Date.now().toString(36)}`, kind: "manual", createdAt: Date.now(), sizeGb: b.diskGb };
    const kept = [...b.points].sort((x, y) => y.createdAt - x.createdAt).slice(0, BACKUP_CAPACITY - 1);
    return { ...b, points: [point, ...kept] };
  });

export const restoreFrom = (id: string) => patch(id, (b) => ({ ...b, restoringUntil: Date.now() + BACKUP_BUSY_MS }));
export const setPaused = (id: string, paused: boolean) => patch(id, (b) => ({ ...b, paused }));
export const renameBackup = (id: string, name: string) => patch(id, (b) => ({ ...b, name }));
export const deletePoint = (id: string, pointId: string) => patch(id, (b) => ({ ...b, points: b.points.filter((p) => p.id !== pointId) }));
export const deleteBackups = (ids: string[]) => write(cache.filter((b) => !ids.includes(b.id)));
/** With their servers: a backup cannot outlive the server it restores. */
export const deleteBackupsOf = (serverIds: string[]) => write(cache.filter((b) => !serverIds.includes(b.serverId)));

export function useBackups(): BackupRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
