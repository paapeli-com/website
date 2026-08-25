import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectorType = "opcua" | "mqtt" | "modbus";

export interface DataPoint {
  key: string;
  type: string; // path | identifier | constant (opcua) / jsonpath (mqtt) / register type (modbus)
  value: string;
}

export interface OpcUaMapping {
  deviceNodePattern: string;
  deviceNamePattern: string;
  deviceProfile: string;
  attributes: DataPoint[];
  timeseries: DataPoint[];
}

export interface OpcUaConfig {
  url: string;
  timeoutInMillis: number;
  scanPeriodInMillis: number;
  pollPeriodInMillis: number;
  enableSubscriptions: boolean;
  security: string; // None | Basic128Rsa15 | Basic256 | Basic256Sha256
  identity: { type: "anonymous" | "basic" | "cert"; username?: string; password?: string };
  mapping: OpcUaMapping[];
}

export interface MqttMapping {
  topicFilter: string;
  deviceNameExpression: string;
  deviceProfileExpression: string;
  attributes: DataPoint[];
  timeseries: DataPoint[];
}

export interface MqttConfig {
  host: string;
  port: number;
  clientId: string;
  security: { type: "anonymous" | "basic" | "cert"; username?: string; password?: string };
  mapping: MqttMapping[];
}

export interface ModbusRegister {
  tag: string;
  functionCode: number;
  address: number;
  objectsCount: number;
  type: string; // int16 | uint16 | int32 | float32 | bits | string
}

export interface ModbusSlave {
  name: string;
  host: string;
  port: number;
  unitId: number;
  pollPeriodMs: number;
  byteOrder: string; // BIG | LITTLE
  deviceProfile: string;
  attributes: ModbusRegister[];
  timeseries: ModbusRegister[];
}

export interface ModbusConfig {
  slaves: ModbusSlave[];
}

export type ConnectorConfig = OpcUaConfig | MqttConfig | ModbusConfig | Record<string, any>;

export interface GatewayConnector {
  id: string;
  gatewayId: string; // FK → gateway.gatewayId
  name: string;
  type: ConnectorType;
  enabled: boolean;
  status: "active" | "inactive" | "error";
  config: ConnectorConfig;
  deviceIds: string[]; // device.deviceId values provisioned from this connector
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = "paapeli-connectors-v1";
const EVENT = "paapeli:connectors-updated";

const load = (): GatewayConnector[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const save = (items: GatewayConnector[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
};

export const defaultConfig = (type: ConnectorType): ConnectorConfig => {
  switch (type) {
    case "opcua":
      return {
        url: "opc.tcp://0.0.0.0:4840",
        timeoutInMillis: 5000,
        scanPeriodInMillis: 3600000,
        pollPeriodInMillis: 5000,
        enableSubscriptions: true,
        security: "Basic128Rsa15",
        identity: { type: "anonymous" },
        mapping: [],
      } as OpcUaConfig;
    case "mqtt":
      return {
        host: "127.0.0.1",
        port: 1883,
        clientId: "",
        security: { type: "anonymous" },
        mapping: [],
      } as MqttConfig;
    case "modbus":
      return { slaves: [] } as ModbusConfig;
    default:
      return {};
  }
};

export const useConnectors = () => {
  const [items, setItems] = useState<GatewayConnector[]>(() => load());
  // Mirror of latest items so writes persist synchronously even if the caller unmounts right after.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const persist = useCallback((updater: (prev: GatewayConnector[]) => GatewayConnector[]) => {
    const next = updater(itemsRef.current);
    itemsRef.current = next;
    save(next);
    setItems(next);
  }, []);

  const create = useCallback(
    (
      c: Omit<GatewayConnector, "id" | "createdAt" | "enabled" | "status" | "deviceIds"> &
        Partial<Pick<GatewayConnector, "enabled" | "status" | "deviceIds" | "createdAt">>,
    ) => {
      const now = Date.now();
      const item: GatewayConnector = {
        id: `conn-${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(now).toISOString(),
        enabled: true,
        status: "inactive",
        deviceIds: [],
        ...c,
      };
      persist((prev) => [item, ...prev]);
      return item;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<GatewayConnector>) =>
      persist((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it)),
      ),
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist((prev) => prev.filter((it) => it.id !== id)),
    [persist],
  );

  const byGateway = useCallback(
    (gatewayId?: string) => items.filter((c) => c.gatewayId === gatewayId),
    [items],
  );

  const getById = useCallback((id?: string) => items.find((c) => c.id === id), [items]);

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

  return { items, create, update, remove, byGateway, getById };
};
