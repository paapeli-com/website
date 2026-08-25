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

const BASE: Anomaly[] = [
  {
    id: "anom-001",
    asset: "Pump P101",
    devId: "DEV-101",
    assetType: "Pump",
    location: "Qazvin > Factory A > Sulfonation > Line 1",
    anomaly: "Abnormal Vibration",
    severity: "Critical",
    sensorType: "Vibration",
    detectedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    confidence: 94,
    status: "Open",
    explanation:
      "Current vibration pattern deviates significantly from historical operating behavior. Rapid increase observed in the last 45 minutes.",
    patternSummary: "Pattern exceeds historical vibration envelope.",
    detectionWindow: "Last 45 minutes",
    anomalyScore: 0.91,
    causes: [
      { label: "Bearing Wear", weight: 85 },
      { label: "Shaft Imbalance", weight: 72 },
      { label: "Loose Mounting", weight: 48 },
    ],
    suggestedActions: ["Inspect bearing", "Reduce RPM", "Schedule maintenance"],
  },
  {
    id: "anom-002",
    asset: "Motor M12",
    devId: "DEV-322",
    assetType: "Motor",
    location: "Qazvin > Factory B > Processing > Line 1",
    anomaly: "Temperature Spike",
    severity: "High",
    sensorType: "Temperature",
    detectedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    confidence: 91,
    status: "Open",
    explanation:
      "Motor surface temperature is trending well above the normal operating envelope without a corresponding load increase.",
    patternSummary: "Sustained upward temperature trend over the last hour.",
    detectionWindow: "Last 60 minutes",
    anomalyScore: 0.86,
    causes: [
      { label: "Cooling Fault", weight: 78 },
      { label: "Overload", weight: 55 },
      { label: "Sensor Drift", weight: 22 },
    ],
    suggestedActions: ["Inspect cooling system", "Verify load", "Schedule thermal check"],
  },
  {
    id: "anom-003",
    asset: "Compressor C3",
    devId: "DEV-205",
    assetType: "Compressor",
    location: "Qazvin > Factory A > Sulfonation > Line 2",
    anomaly: "Pressure Instability",
    severity: "Medium",
    sensorType: "Pressure",
    detectedAt: new Date(Date.now() - 42 * 60_000).toISOString(),
    confidence: 88,
    status: "Open",
    explanation:
      "Pressure readings show unusual variation pattern compared to typical operating cycles.",
    patternSummary: "Oscillation amplitude doubled vs. baseline.",
    detectionWindow: "Last 2 hours",
    anomalyScore: 0.74,
    causes: [
      { label: "Valve Wear", weight: 68 },
      { label: "Air Leak", weight: 45 },
    ],
    suggestedActions: ["Inspect intake valve", "Leak test", "Recalibrate sensor"],
  },
  {
    id: "anom-004",
    asset: "Boiler Pump BP-2",
    devId: "DEV-810",
    assetType: "Pump",
    location: "Qazvin > Factory A > Boiler > Line 1",
    anomaly: "Pressure Fluctuation",
    severity: "High",
    sensorType: "Pressure",
    detectedAt: new Date(Date.now() - 65 * 60_000).toISOString(),
    confidence: 89,
    status: "Acknowledged",
    explanation: "Unexpected pressure fluctuations detected at the pump outlet.",
    patternSummary: "Possible cavitation pattern.",
    detectionWindow: "Last 90 minutes",
    anomalyScore: 0.81,
    causes: [
      { label: "Cavitation", weight: 70 },
      { label: "Flow Instability", weight: 60 },
    ],
    suggestedActions: ["Check suction pressure", "Inspect impeller"],
  },
  {
    id: "anom-005",
    asset: "Heat Exchanger HX-7",
    devId: "DEV-705",
    assetType: "Heat Exchanger",
    location: "Qazvin > Factory B > Processing > Line 2",
    anomaly: "Flow Irregularity",
    severity: "Low",
    sensorType: "Flow",
    detectedAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    confidence: 78,
    status: "Investigating",
    explanation: "Flow rate slightly below expected envelope.",
    patternSummary: "Minor deviation, monitoring.",
    detectionWindow: "Last 4 hours",
    anomalyScore: 0.42,
    causes: [{ label: "Partial Fouling", weight: 55 }],
    suggestedActions: ["Schedule cleaning", "Monitor trend"],
  },
  {
    id: "anom-006",
    asset: "Furnace Fan F2",
    devId: "DEV-411",
    assetType: "Fan",
    location: "Qazvin > Factory A > Furnace > Line 3",
    anomaly: "Current Spike",
    severity: "Medium",
    sensorType: "Current",
    detectedAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
    confidence: 83,
    status: "Resolved",
    explanation: "Brief current spike outside normal pattern.",
    patternSummary: "Single-event spike resolved.",
    detectionWindow: "Last 5 hours",
    anomalyScore: 0.55,
    causes: [{ label: "Voltage Sag", weight: 60 }],
    suggestedActions: ["Inspect supply"],
    resolvedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    resolvedBy: "Operator A",
    resolutionType: "Resolved",
  },
  {
    id: "anom-007",
    asset: "Valve V-21",
    devId: "DEV-612",
    assetType: "Valve",
    location: "Qazvin > Factory A > Sulfonation > Line 1",
    anomaly: "Position Drift",
    severity: "Low",
    sensorType: "Position",
    detectedAt: new Date(Date.now() - 8 * 60 * 60_000).toISOString(),
    confidence: 71,
    status: "Dismissed",
    explanation: "Minor position deviation, likely sensor noise.",
    patternSummary: "Within noise band on review.",
    detectionWindow: "Last 8 hours",
    anomalyScore: 0.31,
    causes: [{ label: "Sensor Noise", weight: 60 }],
    suggestedActions: ["No action"],
    resolvedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    resolvedBy: "Operator B",
    resolutionType: "Dismissed",
  },
  {
    id: "anom-008",
    asset: "Conveyor CV-04",
    devId: "DEV-508",
    assetType: "Conveyor",
    location: "Qazvin > Factory B > Packaging > Line 2",
    anomaly: "Speed Variation",
    severity: "Medium",
    sensorType: "Speed",
    detectedAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    confidence: 80,
    status: "False Positive",
    explanation: "Variation matched scheduled maintenance routine.",
    patternSummary: "Operational change, not a fault.",
    detectionWindow: "Last 24 hours",
    anomalyScore: 0.4,
    causes: [{ label: "Scheduled Maintenance", weight: 90 }],
    suggestedActions: ["Update baseline"],
    resolvedAt: new Date(Date.now() - 20 * 60 * 60_000).toISOString(),
    resolvedBy: "Operator C",
    resolutionType: "False Positive",
  },
];

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

