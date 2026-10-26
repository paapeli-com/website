import { useSyncExternalStore } from "react";

/* The servers this account has, until Cloud Server has an API.
 *
 * The list starts empty (the empty page is a real state, not a mock-up) and
 * each server the create wizard makes is added here, kept in this browser.
 * When the endpoint exists, this module is what it replaces: list, add,
 * update and remove keep the same shape.
 */

export interface ServerRecord {
  id: string;
  /** Which section the server lives in. Both are the same kind of VM
      underneath; a GPU server is listed only under GPU Servers and a cloud
      server only under Cloud Server, so the backend has to tag them. Records
      saved before the tag existed read as "cloud". */
  kind?: "cloud" | "gpu";
  /** "1 × NVIDIA RTX 4080", for a GPU server. */
  gpu?: string;
  /** The account's dedicated server this runs on, if not the shared cloud. */
  hostId?: string;
  hostName?: string;
  /** An instance of an Auto Scale group, listed with the servers but managed
      by its group: never stored here, derived from the group. */
  groupId?: string;
  groupName?: string;
  /** Public addresses beyond the primary: a new one made with the server,
      or a reserved one attached to it (reservedId), which outlives it. */
  extraIps?: { address: string; reservedId?: string }[];
  /** The server's disks, boot first, with where each shows inside it. */
  disks?: { label: string; sizeGb: number; path: string }[];
  name: string;
  imageId: string;
  /** "Ubuntu 24.04 LTS" */
  image: string;
  planId: string;
  vcpu: number;
  ramGb: number;
  diskGb: number;
  region: string;
  zone: string;
  ipv4: string;
  ipv6?: string;
  powerOn: boolean;
  createdAt: number;
}

export type ServerStatus = "creating" | "running" | "stopped";

/** How long a new server reads as being created. */
export const CREATING_MS = 6000;

export const serverStatus = (s: ServerRecord, now = Date.now()): ServerStatus =>
  now - s.createdAt < CREATING_MS ? "creating" : s.powerOn ? "running" : "stopped";

const STORAGE_KEY = "paapeli.cloudServer.servers";
const listeners = new Set<() => void>();

function read(): ServerRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ServerRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: ServerRecord[] = read();

function write(next: ServerRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

export const addServer = (s: ServerRecord) => write([s, ...cache]);
export const updateServer = (id: string, patch: Partial<ServerRecord>) =>
  write(cache.map((s) => (s.id === id ? { ...s, ...patch } : s)));
export const removeServers = (ids: string[]) => write(cache.filter((s) => !ids.includes(s.id)));

export function useServers(): ServerRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}

/** Addresses from the documentation ranges, so nothing points at a real host. */
export function sampleAddresses(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    ipv4: `203.0.113.${(h % 200) + 20}`,
    ipv6: `2001:db8:${(h % 0xffff).toString(16)}::1`,
  };
}
