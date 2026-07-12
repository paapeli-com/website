import { Alert, Device, Geofence, Health, TrackPoint, Trip } from "./types";

/* ------------------------------------------------------------------ */
/* Mock data for the Track panel. Everything is local for now; later   */
/* these are replaced by calls to our gateway (which fronts            */
/* ThingsBoard) behind the same shapes.                                */
/* ------------------------------------------------------------------ */

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const DEVICES: Device[] = [
  {
    id: "d-buddy",
    name: "Buddy",
    type: "pet",
    subtitle: "Dog",
    model: "PetTag P2",
    imei: "861971080061526",
    iccid: "8998109912000123456",
    firmware: "v6.90m",
    status: "online",
    battery: 82,
    signal: 4,
    positioning: "GPS",
    x: 34,
    y: 38,
    speedKmh: 3,
    address: "Central Park, Willow St.",
    updatedAt: ago(0),
    reportingIntervalMin: 3,
  },
  {
    id: "d-luna",
    name: "Luna",
    type: "pet",
    subtitle: "Cat",
    model: "PetTag P2",
    imei: "861971080061999",
    iccid: "8998109912000987654",
    firmware: "v6.90m",
    status: "offline",
    battery: 41,
    signal: 2,
    positioning: "LBS",
    x: 22,
    y: 62,
    speedKmh: 0,
    address: "Home, Maple Ave.",
    updatedAt: ago(181),
    reportingIntervalMin: 10,
  },
  {
    id: "d-mia",
    name: "Mia",
    type: "person",
    subtitle: "Kid",
    model: "KidWatch K4",
    imei: "861971080062100",
    iccid: "8998109912000112233",
    firmware: "v3.12",
    status: "online",
    battery: 66,
    signal: 3,
    positioning: "GPS",
    x: 58,
    y: 55,
    speedKmh: 5,
    address: "Lincoln Elementary School",
    updatedAt: ago(1),
    reportingIntervalMin: 2,
  },
  {
    id: "d-joe",
    name: "Grandpa Joe",
    type: "person",
    subtitle: "Elder",
    model: "SafeWatch S2",
    imei: "861971080062255",
    iccid: "8998109912000445566",
    firmware: "v3.12",
    status: "online",
    battery: 90,
    signal: 4,
    positioning: "GPS",
    x: 48,
    y: 26,
    speedKmh: 1,
    address: "Riverside Walk",
    updatedAt: ago(4),
    reportingIntervalMin: 5,
  },
  {
    id: "d-tesla",
    name: "Model 3",
    type: "vehicle",
    subtitle: "Car",
    model: "AutoTrack A9",
    imei: "861971080062780",
    iccid: "8998109912000778899",
    firmware: "v8.04",
    status: "online",
    battery: 95,
    signal: 4,
    positioning: "GPS",
    x: 72,
    y: 30,
    speedKmh: 48,
    address: "5th Avenue, Downtown",
    updatedAt: ago(0),
    reportingIntervalMin: 1,
  },
  {
    id: "d-van",
    name: "Delivery Van",
    type: "vehicle",
    subtitle: "Van",
    model: "AutoTrack A9",
    imei: "861971080062812",
    iccid: "8998109912000221100",
    firmware: "v8.04",
    status: "offline",
    battery: 58,
    signal: 1,
    positioning: "LBS",
    x: 80,
    y: 70,
    speedKmh: 0,
    address: "Warehouse District",
    updatedAt: ago(46),
    reportingIntervalMin: 5,
  },
];

export const GEOFENCES: Geofence[] = [
  { id: "g-home", name: "Home", x: 26, y: 60, radius: 14, active: true, deviceIds: ["d-buddy", "d-luna"] },
  { id: "g-school", name: "School", x: 58, y: 55, radius: 12, active: true, deviceIds: ["d-mia"] },
  { id: "g-work", name: "Parking", x: 74, y: 30, radius: 10, active: false, deviceIds: ["d-tesla"] },
];

export const ALERTS: Alert[] = [
  { id: "a1", deviceId: "d-buddy", type: "geofence_exit", at: ago(6), read: false },
  { id: "a2", deviceId: "d-mia", type: "geofence_enter", at: ago(24), read: false },
  { id: "a3", deviceId: "d-luna", type: "low_battery", at: ago(58), read: false },
  { id: "a4", deviceId: "d-joe", type: "sos", at: ago(120), read: true },
  { id: "a5", deviceId: "d-tesla", type: "tamper", at: ago(200), read: true },
  { id: "a6", deviceId: "d-tesla", type: "geofence_exit", at: ago(320), read: true },
];

/* A gentle wiggly path around a start point, for map trails / playback. */
export function makeTrack(startX: number, startY: number, n = 40): TrackPoint[] {
  const pts: TrackPoint[] = [];
  let x = startX;
  let y = startY;
  for (let i = 0; i < n; i++) {
    x += Math.sin(i / 3) * 1.6 + (Math.random() - 0.5) * 0.8;
    y += Math.cos(i / 4) * 1.4 + (Math.random() - 0.5) * 0.8;
    pts.push({ x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)), at: ago((n - i) * 3) });
  }
  return pts;
}

export function getTrack(device: Device): TrackPoint[] {
  return makeTrack(device.x - 18, device.y - 10, 44);
}

export function getHealth(device: Device): Health {
  const base = device.type === "pet" ? 6200 : 8400;
  const activityByHour = Array.from({ length: 24 }, (_, h) =>
    Math.round(Math.max(0, Math.sin((h - 6) / 3) * 60 + 40 + Math.random() * 20)),
  );
  return {
    steps: base + Math.round(Math.random() * 1500),
    distanceKm: +(base / 1400).toFixed(1),
    heartRate: device.type === "pet" ? 92 : 74,
    activityByHour,
  };
}

export function getTrips(device: Device): Trip[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${device.id}-t${i}`,
    at: ago(120 * (i + 1)),
    distanceKm: +(4 + Math.random() * 20).toFixed(1),
    durationMin: 12 + Math.round(Math.random() * 40),
    maxSpeedKmh: 60 + Math.round(Math.random() * 60),
  }));
}
