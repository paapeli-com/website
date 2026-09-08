import React, { createContext, useContext, useMemo, useState } from "react";
import { DEVICES } from "@/features/track/data/mockData";
import { Device } from "@/features/track/data/types";

/* `selected` is null whenever there is no device to select — which is always,
   until DEVICES has a source (see data/mockData.ts). It used to be typed
   non-null and seeded from DEVICES[0], so an empty list crashed the provider
   before anything rendered. Callers guard on it and show NoData instead. */
type DeviceContextType = {
  devices: Device[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  selected: Device | null;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string | null>(DEVICES[0]?.id ?? null);
  const selected = useMemo(
    () => DEVICES.find((d) => d.id === selectedId) ?? DEVICES[0] ?? null,
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
