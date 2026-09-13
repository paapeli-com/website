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

/* Values arrive as strings; non-numeric ones (e.g. "true", "good") can't be
   plotted, so they are dropped. */
export const toSeries = (points: EntityFieldItem[] = []): SeriesPoint[] =>
  points.flatMap((p) => {
    const y = p.value?.trim() === "" ? NaN : Number(p.value);
    return Number.isFinite(y) ? [{ x: String(p.ts), y }] : [];
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
