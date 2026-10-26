import { useSyncExternalStore } from "react";

/* Dedicated servers and the clusters they are grouped in, until Cloud Server
 * has an API. Kept in this browser like the server and image lists.
 *
 * A cluster always exists to put a first server in ("default"), so the
 * cluster field has a value from the start. Cloud servers placed on a
 * dedicated server point at it by id (ServerRecord.hostId); a dedicated
 * server still carrying cloud servers is not deleted.
 */

export interface Cluster {
  id: string;
  name: string;
  description?: string;
}

export interface HostRecord {
  id: string;
  name: string;
  clusterId: string;
  region: string;
  zone: string;
  planId: string;
  model: string;
  cores: number;
  ramGb: number;
  maxVms: number;
  periodMonths: number;
  autoRenew: boolean;
  createdAt: number;
}

export type HostStatus = "provisioning" | "active";

/** A physical machine takes longer to hand over than a VM. */
export const PROVISIONING_MS = 10_000;

export const hostStatus = (h: HostRecord, now = Date.now()): HostStatus =>
  now - h.createdAt < PROVISIONING_MS ? "provisioning" : "active";

const DEFAULT_CLUSTER: Cluster = { id: "cl-default", name: "default" };

const KEY_HOSTS = "paapeli.cloudServer.hosts";
const KEY_CLUSTERS = "paapeli.cloudServer.clusters";
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

let state = {
  hosts: read<HostRecord[]>(KEY_HOSTS, []),
  clusters: read<Cluster[]>(KEY_CLUSTERS, [DEFAULT_CLUSTER]),
};
if (!state.clusters.some((c) => c.id === DEFAULT_CLUSTER.id)) state.clusters = [DEFAULT_CLUSTER, ...state.clusters];

function write(next: typeof state) {
  state = next;
  try {
    window.localStorage.setItem(KEY_HOSTS, JSON.stringify(next.hosts));
    window.localStorage.setItem(KEY_CLUSTERS, JSON.stringify(next.clusters));
  } catch {
    /* storage blocked: the lists still hold for this visit */
  }
  listeners.forEach((l) => l());
}

export const addHosts = (hosts: HostRecord[]) => write({ ...state, hosts: [...hosts, ...state.hosts] });
export const updateHost = (id: string, patch: Partial<HostRecord>) =>
  write({ ...state, hosts: state.hosts.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
export const removeHosts = (ids: string[]) => write({ ...state, hosts: state.hosts.filter((h) => !ids.includes(h.id)) });
export function addCluster(name: string, description?: string): Cluster {
  const cluster = { id: `cl-${Date.now().toString(36)}`, name, description };
  write({ ...state, clusters: [...state.clusters, cluster] });
  return cluster;
}

function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export const useHosts = () => useStore().hosts;
export const useClusters = () => useStore().clusters;
