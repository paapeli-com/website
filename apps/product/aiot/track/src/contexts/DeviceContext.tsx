import React, { createContext, useContext, useMemo, useState } from "react";
import { DEVICES } from "@/data/mockData";
import { Device } from "@/data/types";

type DeviceContextType = {
  devices: Device[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: Device;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string>(DEVICES[0].id);
  const selected = useMemo(
    () => DEVICES.find((d) => d.id === selectedId) ?? DEVICES[0],
    [selectedId],
  );

  return (
    <DeviceContext.Provider value={{ devices: DEVICES, selectedId, setSelectedId, selected }}>
      {children}
    </DeviceContext.Provider>
  );
};

export function useDevices() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevices must be used within DeviceProvider");
  return ctx;
}
