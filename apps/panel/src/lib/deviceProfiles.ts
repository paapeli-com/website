// Device profile → telemetry channels mapping.
// Used by DeviceDetails to render Latest Values / Telemetry adaptively.

export interface Channel {
  key: string;
  label: string;
  unit: string;
  color: string; // tailwind text color
  stroke: string; // hex for recharts
  decimals?: number;
  base: number;
  variance: number;
}

export type DeviceProfileKey =
  | "temperature"
  | "temperature_humidity"
  | "energy_meter"
  | "pressure"
  | "vibration"
  | "flow_meter"
  | "humidity"
  | "voltage"
  | "generic";

export const PROFILE_CHANNELS: Record<DeviceProfileKey, Channel[]> = {
  temperature: [
    { key: "temperature", label: "Temperature", unit: "°C", color: "text-primary", stroke: "#FF7A00", base: 72, variance: 12, decimals: 1 },
  ],
  temperature_humidity: [
    { key: "temperature", label: "Temperature", unit: "°C", color: "text-primary", stroke: "#FF7A00", base: 72, variance: 12, decimals: 1 },
    { key: "humidity", label: "Humidity", unit: "%", color: "text-sky-500", stroke: "#0EA5E9", base: 45, variance: 15, decimals: 1 },
  ],
  energy_meter: [
    { key: "voltage", label: "Voltage", unit: "V", color: "text-amber-500", stroke: "#F59E0B", base: 220, variance: 8, decimals: 1 },
    { key: "current", label: "Current", unit: "A", color: "text-rose-500", stroke: "#F43F5E", base: 12, variance: 4, decimals: 2 },
    { key: "power", label: "Power", unit: "kW", color: "text-primary", stroke: "#FF7A00", base: 2.4, variance: 0.6, decimals: 2 },
    { key: "energy", label: "Energy", unit: "kWh", color: "text-emerald-500", stroke: "#10B981", base: 1240, variance: 30, decimals: 1 },
  ],
  pressure: [
    { key: "pressure", label: "Pressure", unit: "bar", color: "text-violet-500", stroke: "#8B5CF6", base: 4.2, variance: 0.8, decimals: 2 },
  ],
  vibration: [
    { key: "rms", label: "RMS", unit: "mm/s", color: "text-emerald-500", stroke: "#10B981", base: 2.1, variance: 0.5, decimals: 2 },
    { key: "peak", label: "Peak", unit: "mm/s", color: "text-rose-500", stroke: "#F43F5E", base: 4.5, variance: 1.0, decimals: 2 },
    { key: "frequency", label: "Frequency", unit: "Hz", color: "text-sky-500", stroke: "#0EA5E9", base: 60, variance: 6, decimals: 1 },
  ],
  flow_meter: [
    { key: "flow_rate", label: "Flow Rate", unit: "L/min", color: "text-sky-500", stroke: "#0EA5E9", base: 18, variance: 5, decimals: 1 },
    { key: "total_volume", label: "Total Volume", unit: "m³", color: "text-primary", stroke: "#FF7A00", base: 1820, variance: 12, decimals: 1 },
  ],
  humidity: [
    { key: "humidity", label: "Humidity", unit: "%", color: "text-sky-500", stroke: "#0EA5E9", base: 52, variance: 14, decimals: 1 },
  ],
  voltage: [
    { key: "voltage", label: "Voltage", unit: "V", color: "text-amber-500", stroke: "#F59E0B", base: 220, variance: 6, decimals: 1 },
  ],
  generic: [
    { key: "value", label: "Value", unit: "", color: "text-primary", stroke: "#FF7A00", base: 50, variance: 10, decimals: 1 },
  ],
};

export const guessProfile = (name = "", tags = ""): DeviceProfileKey => {
  const s = `${name} ${tags}`.toLowerCase();
  if (/(humid).*temp|temp.*humid/.test(s)) return "temperature_humidity";
  if (/(energy|kwh|power meter|kontor|برق|انرژی)/.test(s)) return "energy_meter";
  if (/(vibrat|ارتعاش)/.test(s)) return "vibration";
  if (/(flow|debi|جریان)/.test(s)) return "flow_meter";
  if (/(pressure|فشار|psi|bar)/.test(s)) return "pressure";
  if (/(humid|رطوبت)/.test(s)) return "humidity";
  if (/(voltage|ولت)/.test(s)) return "voltage";
  if (/(temp|دما|حرارت)/.test(s)) return "temperature";
  return "generic";
};

export const profileLabel = (p: DeviceProfileKey): string =>
  ({
    temperature: "Temperature Sensor",
    temperature_humidity: "Temp + Humidity Sensor",
    energy_meter: "Energy Meter",
    pressure: "Pressure Sensor",
    vibration: "Vibration Sensor",
    flow_meter: "Flow Meter",
    humidity: "Humidity Sensor",
    voltage: "Voltage Monitor",
    generic: "Generic Device",
  }[p]);

// Deterministic pseudo-random series for charts (so re-renders are stable)
export const generateSeries = (channel: Channel, points = 30, seed = 1): { t: number; v: number }[] => {
  const arr: { t: number; v: number }[] = [];
  let h = seed * 9301 + 49297;
  for (let i = 0; i < points; i++) {
    h = (h * 9301 + 49297) % 233280;
    const r = h / 233280;
    const v = channel.base + (r - 0.5) * 2 * channel.variance;
    arr.push({ t: i, v: Number(v.toFixed(channel.decimals ?? 1)) });
  }
  return arr;
};

export const lastValue = (channel: Channel, seed = 1) => {
  const s = generateSeries(channel, 6, seed);
  return s[s.length - 1].v;
};
