import { useSyncExternalStore } from "react";

/* Floating IPs, until Cloud Server has an API.
 *
 * What Neutron gives: an address allocated from the external network, with
 * an optional description, associated with one server's port at a time and
 * moved between servers without changing. A floating IP needs a router to
 * the external network, which has a public address of its own, so a floating
 * IP is billed for both; the price says so. Deleting a server keeps its
 * floating IP, unassociated.
 */

export interface FloatingIp {
  id: string;
  address: string;
  description?: string;
  region: string;
  zone: string;
  createdAt: number;
  /** A server, or a load balancer's address (kind "loadbalancer", its id in
      serverId). */
  attachedTo?: { serverId: string; serverName: string; kind?: "server" | "loadbalancer" };
}

const STORAGE_KEY = "paapeli.cloudServer.floatingIps";
const listeners = new Set<() => void>();

function read(): FloatingIp[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FloatingIp[]) : [];
  } catch {
    return [];
  }
}

let cache: FloatingIp[] = read();

function write(next: FloatingIp[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

function freshAddress() {
  const taken = new Set(cache.map((i) => i.address));
  for (let n = 0; n < 1000; n++) {
    const a = `192.0.2.${Math.floor(Math.random() * 230) + 20}`;
    if (!taken.has(a)) return a;
  }
  return `192.0.2.${cache.length + 20}`;
}

export function allocateFloating(region: string, zone: string, description?: string): FloatingIp {
  const ip: FloatingIp = {
    id: `fip-${Date.now().toString(36)}`,
    address: freshAddress(),
    description,
    region,
    zone,
    createdAt: Date.now(),
  };
  write([ip, ...cache]);
  return ip;
}

export const associateFloating = (id: string, serverId: string, serverName: string, kind: "server" | "loadbalancer" = "server") =>
  write(cache.map((i) => (i.id === id ? { ...i, attachedTo: { serverId, serverName, kind } } : i)));
export const disassociateFloating = (id: string) => write(cache.map((i) => (i.id === id ? { ...i, attachedTo: undefined } : i)));
/** Unassociate every floating IP from these servers (when they are deleted). */
export const releaseFromServers = (serverIds: string[]) =>
  write(cache.map((i) => (i.attachedTo && serverIds.includes(i.attachedTo.serverId) ? { ...i, attachedTo: undefined } : i)));
export const updateFloating = (id: string, patch: Partial<FloatingIp>) => write(cache.map((i) => (i.id === id ? { ...i, ...patch } : i)));
export const deleteFloating = (ids: string[]) => write(cache.filter((i) => !ids.includes(i.id) || !!i.attachedTo));

/** Read outside React, for the checks other stores make. */
export const getFloatingIps = () => cache;

export function useFloatingIps(): FloatingIp[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
