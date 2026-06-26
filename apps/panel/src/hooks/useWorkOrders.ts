import { useCallback, useEffect, useState } from "react";

export type WorkOrderPriority = "Critical" | "High" | "Medium" | "Low";
export type WorkOrderStatus = "Open" | "In Progress" | "Done" | "Cancelled";

export interface WorkOrder {
  id: string;
  anomalyId?: string;
  asset: string;
  location: string;
  action: string;
  priority: WorkOrderPriority;
  assignedTeam: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  status: WorkOrderStatus;
}

const STORAGE_KEY = "paapeli.anomalies.workorders.v1";
const EVENT = "paapeli:anomalies-updated";

const load = (): WorkOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkOrder[]) : [];
  } catch {
    return [];
  }
};

const save = (items: WorkOrder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
};

export const useWorkOrders = () => {
  const [items, setItems] = useState<WorkOrder[]>(() => load());

  useEffect(() => {
    const sync = () => setItems(load());
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

  const persist = useCallback((updater: (prev: WorkOrder[]) => WorkOrder[]) => {
    const next = updater(load());
    save(next);
    setItems(next);
  }, []);

  const create = useCallback(
    (wo: Omit<WorkOrder, "id" | "createdAt" | "createdBy" | "status"> & Partial<Pick<WorkOrder, "status" | "createdBy">>) => {
      const item: WorkOrder = {
        id: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        createdBy: wo.createdBy || "You",
        status: wo.status || "Open",
        ...wo,
      };
      persist((prev) => [item, ...prev]);
      return item;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<WorkOrder>) =>
      persist((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist((prev) => prev.filter((it) => it.id !== id)),
    [persist],
  );

  const removeMany = useCallback(
    (ids: string[]) => persist((prev) => prev.filter((it) => !ids.includes(it.id))),
    [persist],
  );

  const getById = useCallback((id?: string) => items.find((it) => it.id === id), [items]);

  return { items, create, update, remove, removeMany, getById };
};
