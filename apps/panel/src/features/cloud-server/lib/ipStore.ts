import { useSyncExternalStore } from "react";

/* Standalone public IPs: addresses the account reserves on their own, not
 * made with a server. Kept in this browser until Cloud Server has an API.
 *
 * Two rules come from regulation, not from us: an account holds at most
 * MAX_RESERVED of them, and one cannot be released in its first
 * HOLD_DAYS days. A reserved IP can be attached to a server as its
 * additional address; deleting that server gives it back, unattached.
 */

export const MAX_RESERVED = 3;
export const HOLD_DAYS = 3;
const HOLD_MS = HOLD_DAYS * 24 * 60 * 60 * 1000;

export interface ReservedIp {
  id: string;
  address: string;
  region: string;
  zone: string;
  createdAt: number;
  attachedTo?: { serverId: string; serverName: string };
}

/** When it may be released, and whether that time has come. */
export const releasableAt = (ip: ReservedIp) => ip.createdAt + HOLD_MS;
export const canRelease = (ip: ReservedIp, now = Date.now()) => !ip.attachedTo && now >= releasableAt(ip);

const STORAGE_KEY = "paapeli.cloudServer.reservedIps";
const listeners = new Set<() => void>();

function read(): ReservedIp[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ReservedIp[]) : [];
  } catch {
    return [];
  }
}

let cache: ReservedIp[] = read();

function write(next: ReservedIp[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

/** A documentation-range address no other IP in the list has. */
function freshAddress() {
  const taken = new Set(cache.map((i) => i.address));
  for (let n = 0; n < 1000; n++) {
    const a = `198.51.100.${Math.floor(Math.random() * 230) + 20}`;
    if (!taken.has(a)) return a;
  }
  return `198.51.100.${cache.length + 20}`;
}

export function reserveIp(region: string, zone: string): ReservedIp | null {
  if (cache.length >= MAX_RESERVED) return null;
  const ip: ReservedIp = { id: `ip-${Date.now().toString(36)}`, address: freshAddress(), region, zone, createdAt: Date.now() };
  write([ip, ...cache]);
  return ip;
}

export const attachIp = (id: string, serverId: string, serverName: string) =>
  write(cache.map((i) => (i.id === id ? { ...i, attachedTo: { serverId, serverName } } : i)));

/** Detach every reserved IP from these servers (when they are deleted). */
export const detachFrom = (serverIds: string[]) =>
  write(cache.map((i) => (i.attachedTo && serverIds.includes(i.attachedTo.serverId) ? { ...i, attachedTo: undefined } : i)));

export const releaseIps = (ids: string[]) => write(cache.filter((i) => !ids.includes(i.id) || !canRelease(i)));

export function useReservedIps(): ReservedIp[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
