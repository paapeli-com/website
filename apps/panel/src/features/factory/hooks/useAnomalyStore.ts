import { useCallback, useEffect, useState } from "react";

export type AnomalySeverity = "Critical" | "High" | "Medium" | "Low";
export type AnomalyStatus =
  | "Open"
  | "Acknowledged"
  | "Investigating"
  | "Resolved"
  | "Dismissed"
  | "False Positive";

export interface Anomaly {
  id: string;
  asset: string;
  devId: string;
  assetType: string;
  location: string;
  anomaly: string;
  severity: AnomalySeverity;
  sensorType: string;
  detectedAt: string; // ISO
  confidence: number; // 0-100
  status: AnomalyStatus;
  explanation: string;
  patternSummary: string;
  detectionWindow: string;
  anomalyScore: number;
  causes: { label: string; weight: number }[];
  suggestedActions: string[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionType?: "Resolved" | "Dismissed" | "False Positive";
}

export interface CompletedAction {
  label: string;
  completedAt: string;
  by: string;
}

export interface WorkOrder {
  id: string;
  anomalyId: string;
  asset: string;
  location: string;
  action: string;
  priority: AnomalySeverity;
  assignedTeam: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  status: "Open" | "In Progress" | "Done";
}

const KEY = "paapeli.anomalies.overrides.v1";
const ACTIONS_KEY = "paapeli.anomalies.actions.v1";
const WO_KEY = "paapeli.anomalies.workorders.v1";
const EVT = "paapeli:anomalies-updated";

type Overrides = Record<
  string,
  Partial<
    Pick<
      Anomaly,
      "status" | "resolvedAt" | "resolvedBy" | "resolutionType"
    >
  >
>;

type ActionsMap = Record<string, CompletedAction[]>;

const loadOverrides = (): Overrides => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
};

const saveOverrides = (o: Overrides) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
    window.dispatchEvent(new Event(EVT));
  } catch {}
};

const loadActions = (): ActionsMap => {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    return raw ? (JSON.parse(raw) as ActionsMap) : {};
  } catch {
    return {};
  }
};
const saveActions = (a: ActionsMap) => {
  try {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(a));
    window.dispatchEvent(new Event(EVT));
  } catch {}
};

const loadWorkOrders = (): WorkOrder[] => {
  try {
    const raw = localStorage.getItem(WO_KEY);
    return raw ? (JSON.parse(raw) as WorkOrder[]) : [];
  } catch {
    return [];
  }
};
const saveWorkOrders = (w: WorkOrder[]) => {
  try {
    localStorage.setItem(WO_KEY, JSON.stringify(w));
    window.dispatchEvent(new Event(EVT));
  } catch {}
};

/* Empty until anomaly detection is served by something.

   This held a fixed set of invented detections — named assets at named plants,
   confidence percentages, "detected 3 minutes ago" timestamps that recomputed
   on every load so they always looked fresh. The overrides below (status
   changes, actions, work orders the user creates) are real and keep working;
   they simply apply to an empty list until BASE has a source. */
const BASE: Anomaly[] = [];

const apply = (base: Anomaly[], overrides: Overrides): Anomaly[] =>
  base.map((a) => (overrides[a.id] ? { ...a, ...overrides[a.id] } : a));

export const useAnomalyStore = () => {
  const [overrides, setOverrides] = useState<Overrides>(() => loadOverrides());
  const [actions, setActions] = useState<ActionsMap>(() => loadActions());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadWorkOrders());

  useEffect(() => {
    const sync = () => {
      setOverrides(loadOverrides());
      setActions(loadActions());
      setWorkOrders(loadWorkOrders());
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = apply(BASE, overrides);

  const updateStatus = useCallback((id: string, status: AnomalyStatus) => {
    const next = loadOverrides();
    const prev = next[id] || {};
    const isResolution =
      status === "Resolved" || status === "Dismissed" || status === "False Positive";
    next[id] = {
      ...prev,
      status,
      ...(isResolution
        ? {
            resolvedAt: new Date().toISOString(),
            resolvedBy: "You",
            resolutionType: status as "Resolved" | "Dismissed" | "False Positive",
          }
        : {
            resolvedAt: undefined,
            resolvedBy: undefined,
            resolutionType: undefined,
          }),
    };
    saveOverrides(next);
    setOverrides({ ...next });
  }, []);

  const completeAction = useCallback((anomalyId: string, label: string) => {
    const next = loadActions();
    const list = next[anomalyId] || [];
    if (list.some((a) => a.label === label)) return;
    next[anomalyId] = [
      ...list,
      { label, completedAt: new Date().toISOString(), by: "You" },
    ];
    saveActions(next);
    setActions({ ...next });
  }, []);

  const undoAction = useCallback((anomalyId: string, label: string) => {
    const next = loadActions();
    next[anomalyId] = (next[anomalyId] || []).filter((a) => a.label !== label);
    saveActions(next);
    setActions({ ...next });
  }, []);

  const getActions = useCallback(
    (anomalyId: string): CompletedAction[] => actions[anomalyId] || [],
    [actions],
  );

  const createWorkOrder = useCallback(
    (wo: Omit<WorkOrder, "id" | "createdAt" | "createdBy" | "status">) => {
      const item: WorkOrder = {
        ...wo,
        id: `wo-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: "You",
        status: "Open",
      };
      const next = [item, ...loadWorkOrders()];
      saveWorkOrders(next);
      setWorkOrders(next);
      return item;
    },
    [],
  );

  const getWorkOrders = useCallback(
    (anomalyId: string) => workOrders.filter((w) => w.anomalyId === anomalyId),
    [workOrders],
  );

  const getById = useCallback(
    (id: string) => items.find((a) => a.id === id),
    [items],
  );

  return {
    items,
    updateStatus,
    getById,
    completeAction,
    undoAction,
    getActions,
    createWorkOrder,
    getWorkOrders,
    workOrders,
  };
};

