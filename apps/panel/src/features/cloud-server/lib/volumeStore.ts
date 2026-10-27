import { useSyncExternalStore } from "react";
import { ApiError } from "./openstackErrors";
import { IMAGES, type DiskTypeId } from "./catalog";
import type { ServerRecord } from "./serverStore";

/* Cloud disks, until Cloud Server has an API.
 *
 * What Cinder gives: a volume of a type and size in one zone, attached to
 * one server at a time and detached again, extended (never shrunk), deleted
 * once detached. A server's additional disks made in the create wizard are
 * volumes too, marked to go with the server (Nova's delete_on_termination);
 * a disk made here and attached later outlives it, detached. A local disk
 * lives on one of the account's dedicated servers (hostId) and attaches only
 * to servers running there.
 */

/** How long a new disk, or one being extended, reads as busy. */
export const VOLUME_BUSY_MS = 6000;

export interface VolumeRecord {
  id: string;
  name: string;
  type: DiskTypeId;
  sizeGb: number;
  region: string;
  zone: string;
  createdAt: number;
  /** For a local disk: the dedicated server it lives on. */
  hostId?: string;
  attachedTo?: { serverId: string; path: string };
  /** Deleted with the server it is attached to, rather than detached. */
  deleteWithServer?: boolean;
  /** The server it was made with in the create wizard. */
  madeWithServerId?: string;
  extendingUntil?: number;
}

export type VolumeStatus = "creating" | "extending" | "inUse" | "available";

export const volumeStatus = (v: VolumeRecord, now = Date.now()): VolumeStatus =>
  now - v.createdAt < VOLUME_BUSY_MS
    ? "creating"
    : v.extendingUntil && v.extendingUntil > now
      ? "extending"
      : v.attachedTo
        ? "inUse"
        : "available";

/** Where a disk shows up inside the server. On Linux the boot disk is sda,
    then sdb, sdc and on; on Windows it is drive C:, then D:, E: and on. */
export const devicePath = (index: number, family: "linux" | "windows") =>
  family === "windows" ? `${String.fromCharCode(67 + index)}:` : `/dev/sd${String.fromCharCode(97 + index)}`;

const familyOf = (s: ServerRecord) => IMAGES.find((i) => i.id === s.imageId)?.family ?? "linux";

/** The first free place on a server for one more disk. */
export function nextDevicePath(server: ServerRecord, volumes: VolumeRecord[]) {
  const family = familyOf(server);
  const madeHere = volumes.some((v) => v.madeWithServerId === server.id);
  const taken = new Set([
    server.disks?.[0]?.path ?? devicePath(0, family),
    /* Servers saved before disks were volumes keep their own list. */
    ...(madeHere ? [] : (server.disks ?? []).slice(1).map((d) => d.path)),
    ...volumes.filter((v) => v.attachedTo?.serverId === server.id).map((v) => v.attachedTo!.path),
  ]);
  for (let i = 1; i < 24; i++) if (!taken.has(devicePath(i, family))) return devicePath(i, family);
  return devicePath(24, family);
}

const STORAGE_KEY = "paapeli.cloudServer.volumes";
const listeners = new Set<() => void>();

function read(): VolumeRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as VolumeRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: VolumeRecord[] = read();

function write(next: VolumeRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const patch = (id: string, fn: (v: VolumeRecord) => VolumeRecord) => write(cache.map((v) => (v.id === id ? fn(v) : v)));

export function addVolumes(input: Omit<VolumeRecord, "id" | "createdAt">[]): VolumeRecord[] {
  const now = Date.now();
  const made = input.map((v, i) => ({ ...v, id: `vol-${now.toString(36)}-${i}`, createdAt: now }));
  write([...made, ...cache]);
  return made;
}

export const attachVolume = (id: string, serverId: string, path: string) => patch(id, (v) => ({ ...v, attachedTo: { serverId, path } }));
/** Detached, it no longer goes with any server. */
export const detachVolume = (id: string) => patch(id, (v) => ({ ...v, attachedTo: undefined, deleteWithServer: false }));
export const extendVolume = (id: string, sizeGb: number) =>
  patch(id, (v) => ({ ...v, sizeGb: Math.max(v.sizeGb, sizeGb), extendingUntil: Date.now() + VOLUME_BUSY_MS }));
export const renameVolume = (id: string, name: string) => patch(id, (v) => ({ ...v, name }));
/** Only detached disks are deleted. */
export function deleteVolumes(ids: string[]) {
  /* Cinder: 400 "Volume status must be available or error…" */
  if (cache.some((v) => ids.includes(v.id) && v.attachedTo)) throw new ApiError(400, "VolumeAttached", "", {}, true);
  write(cache.filter((v) => !ids.includes(v.id)));
}

/** The servers are deleted: their own disks go with them, the rest stay, detached. */
export const releaseVolumesOf = (serverIds: string[]) =>
  write(
    cache
      .filter((v) => !(v.attachedTo && serverIds.includes(v.attachedTo.serverId) && v.deleteWithServer))
      .map((v) => (v.attachedTo && serverIds.includes(v.attachedTo.serverId) ? { ...v, attachedTo: undefined } : v)),
  );

export function useVolumes(): VolumeRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
