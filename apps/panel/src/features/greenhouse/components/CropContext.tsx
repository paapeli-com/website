import { useMemo } from "react";
import type { CropCycle } from "@paapeli/api";
import { currentSolution } from "@/features/factory/lib/product";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "./CropIcon";
import { useGreenhouses } from "../hooks";
import { useProductDevices } from "../operations";
import { useGreenhouseText } from "../i18n";

export interface CropContextInfo {
  greenhouseName: string;
  zoneName: string;
  /** The crop growing where the device is; null for an empty zone. */
  cycle: CropCycle | null;
}

/** For each device of the product: the greenhouse and zone it is in, and what grows there. */
export function useCropContextIndex(enabled = true) {
  const greenhouses = useGreenhouses();
  const devices = useProductDevices();
  return useMemo(() => {
    const byPlace = new Map<string, CropContextInfo>();
    if (!enabled) return new Map<string, CropContextInfo>();
    (greenhouses.data ?? []).forEach((house) => {
      byPlace.set(house.id, { greenhouseName: house.name, zoneName: "", cycle: null });
      house.zones.forEach((zone) => {
        byPlace.set(zone.id, { greenhouseName: house.name, zoneName: zone.name, cycle: zone.cycle ?? null });
        zone.beds.forEach((bed) =>
          byPlace.set(bed.id, {
            greenhouseName: house.name,
            zoneName: `${zone.name} › ${bed.name}`,
            cycle: bed.cycle ?? zone.cycle ?? null,
          }),
        );
      });
    });
    const byDevice = new Map<string, CropContextInfo>();
    (devices.data ?? []).forEach((d) => {
      const place = byPlace.get(d.assetId);
      if (place) byDevice.set(d.id, place);
    });
    return byDevice;
  }, [enabled, greenhouses.data, devices.data]);
}

/**
 * Where a device grows, for Smart Greenhouse's pages that are Smart
 * Factory's (AI anomalies and trends): "North house › Zone 2 · Tomato,
 * Flowering". Renders nothing in Smart Factory, or for a device outside any
 * greenhouse.
 */
export function CropContextChip({ deviceId, className }: { deviceId?: string | null; className?: string }) {
  const greenhouse = currentSolution() === "SmartGreenhouse";
  return greenhouse && deviceId ? <Chip deviceId={deviceId} className={className} /> : null;
}

function Chip({ deviceId, className }: { deviceId: string; className?: string }) {
  const { named } = useGreenhouseText();
  const info = useCropContextIndex().get(deviceId);
  if (!info) return null;
  const where = [info.greenhouseName, info.zoneName].filter(Boolean).join(" › ");
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground", className)}>
      {info.cycle && <CropIcon icon={info.cycle.crop.icon} className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">
        {where}
        {info.cycle && ` · ${named(info.cycle.crop.names, info.cycle.crop.name)}, ${named(info.cycle.stage.names, info.cycle.stage.name)}`}
      </span>
    </span>
  );
}
