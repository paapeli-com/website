export type AssetType = "pet" | "person" | "vehicle";
export type DeviceStatus = "online" | "offline";
export type Positioning = "GPS" | "LBS" | "WiFi";

export type Device = {
  id: string;
  name: string;
  type: AssetType;
  /** Subtype label, e.g. "Dog", "Kid", "Car". */
  subtitle: string;
  model: string;
  imei: string;
  iccid: string;
  firmware: string;
  status: DeviceStatus;
  battery: number;
  signal: number; // 0..4
  positioning: Positioning;
  /** Normalized map position (0..100) for the stylised canvas map. */
  x: number;
  y: number;
  speedKmh: number;
  address: string;
  updatedAt: string; // ISO
  reportingIntervalMin: number;
};

export type Geofence = {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number; // map units
  active: boolean;
  deviceIds: string[];
};

export type AlertType = "geofence_exit" | "geofence_enter" | "low_battery" | "sos" | "tamper";

export type Alert = {
  id: string;
  deviceId: string;
  type: AlertType;
  at: string; // ISO
  read: boolean;
};

export type TrackPoint = { x: number; y: number; at: string };

export type Trip = { id: string; at: string; distanceKm: number; durationMin: number; maxSpeedKmh: number };

export type Health = {
  steps: number;
  distanceKm: number;
  heartRate: number;
  activityByHour: number[]; // 24 values
};
