import { useEffect, useMemo } from "react";
import { useGetDeviceTimeSeriesQuery, type EntityFieldItem } from "@paapeli/api";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import type { SeriesPoint } from "@/features/factory/lib/dashboardData";
import { Label } from "@/features/factory/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";

/** The dashboard data source whose widgets read real device telemetry. */
export const DEVICES_SOURCE_ID = "devices";

/* The history endpoint takes a lookback in hours and clamps it to 1–24, so
   any dashboard range longer than a day shows the last 24 hours. */
export const rangeToHours = (range: string) => (range === "1h" ? 1 : 24);

/** A device's recent telemetry, keyed by telemetry name. */
export const useDeviceTelemetry = (deviceId: string | undefined, hours: number) => {
  const workspaceId = useWorkspaceId();
  return useGetDeviceTimeSeriesQuery(workspaceId ?? "", PRODUCT_KEY, deviceId ?? "", hours);
};

/** A telemetry value as a number, or null when it can't be plotted. The spec
 *  types values as strings, but numbers are accepted too; non-numeric values
 *  (e.g. "true", "good") and blanks are rejected. */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/* Every plottable point of one series, oldest first. */
export const toSeries = (points: EntityFieldItem[] = []): SeriesPoint[] =>
  [...points]
    .sort((a, b) => Number(a.ts) - Number(b.ts))
    .flatMap((p) => {
      const y = toNumber(p.value);
      return y === null ? [] : [{ x: String(p.ts), y }];
    });

interface FieldsProps {
  deviceId?: string;
  telemetryKey?: string;
  hours: number;
  tt: (key: string) => string;
  onChange: (patch: { deviceId?: string; telemetryKey?: string }) => void;
}

/** Device + telemetry-key pickers for a widget bound to the Devices source. */
export function DeviceSourceFields({ deviceId, telemetryKey, hours, tt, onChange }: FieldsProps) {
  const { items: devices, isLoading: devicesLoading } = useDevices();
  const { data, isLoading: keysLoading } = useDeviceTelemetry(deviceId, hours);
  const keys = useMemo(() => Object.keys(data ?? {}).sort(), [data]);

  // Pick the first key once a newly chosen device's telemetry arrives, so the
  // chart isn't left blank. A key the user already chose is never replaced.
  useEffect(() => {
    if (deviceId && !telemetryKey && keys.length) onChange({ telemetryKey: keys[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, telemetryKey, keys]);

  return (
    <>
      <div>
        <Label className="text-sm">{tt("device")}</Label>
        <Select
          value={deviceId ?? ""}
          onValueChange={(v) => onChange({ deviceId: v, telemetryKey: undefined })}
          disabled={devicesLoading || devices.length === 0}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue
              placeholder={devicesLoading ? tt("loading") : devices.length === 0 ? tt("noDevices") : tt("selectDevice")}
            />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.label || d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">{tt("telemetryKey")}</Label>
        <Select
          value={telemetryKey ?? ""}
          onValueChange={(v) => onChange({ telemetryKey: v })}
          disabled={!deviceId || keysLoading || keys.length === 0}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue
              placeholder={
                !deviceId ? tt("selectDevice") : keysLoading ? tt("loading") : keys.length === 0 ? tt("noTelemetry") : tt("telemetryKey")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
