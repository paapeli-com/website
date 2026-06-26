import { useCallback, useEffect, useState } from "react";

export interface UserDevice {
  id: string;
  deviceId: string;
  apiKey: string;
  name: string;
  protocol: string;
  location?: string;
  gateway?: string;
  useSsl?: boolean;
  useOta?: boolean;
  useMonitoring?: boolean;
  tags?: string;
  description?: string;
  externalId?: string;
  createdAt: string; // ISO
  lastActivity?: string;
}

const STORAGE_KEY = "paapeli-devices-v1";

const SEED_KEY = "paapeli-devices-seeded-v1";
const DEVICE_STORAGE_EVENT = "paapeli:devices-updated";

const seed = (): UserDevice[] => {
  const now = Date.now();
  const mk = (i: number, name: string, protocol: string, location: string): UserDevice => ({
    id: `seed-dev-${i}`,
    deviceId: `DEV-${String(1000 + i)}`,
    apiKey: `seed-demo-key-${String(i).padStart(2, "0")}`,
    name,
    protocol,
    location,
    useSsl: i % 2 === 0,
    useOta: i % 3 === 0,
    useMonitoring: true,
    createdAt: new Date(now - i * 300_000).toISOString(),
    lastActivity: new Date(now - i * 120_000).toISOString(),
  });
  return [
    mk(1, "Temp Sensor Line 1", "MQTT", "Factory A > Line 1"),
    mk(2, "حسگر دمای کوره", "MQTT", "کارخانه الف > سولفوناسیون"),
    mk(3, "Vibration Compressor #3", "OPC-UA", "Factory A > Utilities"),
    mk(4, "حسگر فشار بویلر", "Modbus TCP", "کارخانه ب > بویلر"),
    mk(5, "Flow Meter Inlet", "HTTP", "Factory C > WTP"),
    mk(6, "کنتور مصرف برق خط بسته‌بندی", "MQTT", "کارخانه ب > بسته‌بندی"),
    mk(7, "Humidity Sensor Warehouse", "LoRaWAN", "Factory A > Line 1"),
    mk(8, "حسگر ارتعاش پمپ ۲", "MQTT", "کارخانه الف > تأسیسات"),
  ];
};

const mergeSeedDevices = (items: UserDevice[]) => {
  const existingKeys = new Set(items.flatMap((item) => [item.id, item.deviceId]));
  const missingSeeds = seed().filter((item) => !existingKeys.has(item.id) && !existingKeys.has(item.deviceId));
  return missingSeeds.length ? [...items, ...missingSeeds] : items;
};

const load = (): UserDevice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [];
      const merged = mergeSeedDevices(items);
      if (merged.length !== items.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(SEED_KEY, "1");
      }
      return merged;
    }
    // First run → seed mixed-language samples
    const seeded = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(SEED_KEY, "1");
    return seeded;
  } catch {
    return [];
  }
  return [];
};

const save = (items: UserDevice[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(DEVICE_STORAGE_EVENT));
  } catch {
    return;
  }
};

export const useDevices = () => {
  const [items, setItems] = useState<UserDevice[]>(() => load());

  const persist = useCallback((updater: (prev: UserDevice[]) => UserDevice[]) => {
    setItems((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const create = useCallback(
    (d: Omit<UserDevice, "id" | "createdAt" | "deviceId" | "apiKey"> & Partial<Pick<UserDevice, "deviceId" | "apiKey" | "createdAt">>) => {
      const now = Date.now();
      const deviceId = d.deviceId || `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const apiKey = d.apiKey || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const item: UserDevice = {
        id: `dev-${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(now).toISOString(),
        ...d,
        deviceId,
        apiKey,
      };
      persist((prev) => [item, ...prev]);
      return item;
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist((prev) => prev.filter((it) => it.id !== id && it.deviceId !== id)),
    [persist],
  );

  useEffect(() => {
    const sync = () => setItems(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(DEVICE_STORAGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(DEVICE_STORAGE_EVENT, sync);
    };
  }, []);

  return { items, create, remove };
};
