import { useCallback, useEffect, useRef, useState } from "react";

export interface UserGateway {
  id: string;
  gatewayId: string;
  pairingKey: string;
  name: string;
  protocol: string;
  location?: string;
  model?: string;
  useSsl?: boolean;
  useOta?: boolean;
  useMonitoring?: boolean;
  tags?: string;
  description?: string;
  externalId?: string;
  authMethod?: "accessToken" | "basic" | "ssl";
  authUsername?: string;
  authClientId?: string;
  sslCert?: string;
  sharedUsers?: string[];
  createdAt: string;
  lastSeen?: string;
  status?: "online" | "offline" | "error";
  connectedDevices?: number;
}

const STORAGE_KEY = "paapeli-gateways-v1";
const EVENT = "paapeli:gateways-updated";

const load = (): UserGateway[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const save = (items: UserGateway[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
};

export const useGateways = () => {
  const [items, setItems] = useState<UserGateway[]>(() => load());
  // Mirror of the latest items so writes can be computed + persisted synchronously,
  // even if the calling component unmounts (e.g. navigates) right after the write.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const persist = useCallback((updater: (prev: UserGateway[]) => UserGateway[]) => {
    const next = updater(itemsRef.current);
    itemsRef.current = next;
    save(next);      // write localStorage + notify listeners synchronously, before any unmount
    setItems(next);  // update this instance
  }, []);

  const create = useCallback(
    (g: Omit<UserGateway, "id" | "createdAt" | "gatewayId" | "pairingKey"> & Partial<Pick<UserGateway, "gatewayId" | "pairingKey" | "createdAt">>) => {
      const now = Date.now();
      const gatewayId = g.gatewayId || `GW-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const pairingKey = g.pairingKey || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const item: UserGateway = {
        id: `gw-${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(now).toISOString(),
        lastSeen: new Date(now).toISOString(),
        status: "offline",
        connectedDevices: 0,
        ...g,
        gatewayId,
        pairingKey,
      };
      persist((prev) => [item, ...prev]);
      return item;
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist((prev) => prev.filter((it) => it.id !== id && it.gatewayId !== id)),
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<UserGateway>) =>
      persist((prev) => prev.map((it) => (it.id === id || it.gatewayId === id ? { ...it, ...patch } : it))),
    [persist],
  );

  useEffect(() => {
    const sync = () => {
      const fresh = load();
      itemsRef.current = fresh;
      setItems(fresh);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  return { items, create, remove, update };
};
