import { Alert, Device, Geofence, Health, TrackPoint, Trip } from "./types";

/* ------------------------------------------------------------------ */
/* Nothing in GPS Tracking has a backend yet.                          */
/*                                                                     */
/* This file used to invent the entire product: six trackers with IMEI */
/* and ICCID numbers, firmware versions, battery and signal levels and */
/* street addresses in Manhattan; three geofences; six alerts —        */
/* including an SOS from "Grandpa Joe" and a tamper alert — plus       */
/* randomly generated GPS trails, step counts, heart rates and trip    */
/* histories that changed on every render.                             */
/*                                                                     */
/* On a tracking product that is not a harmless placeholder: a live    */
/* map, an SOS alert and a heart rate are read as the current state of */
/* a real person, pet or vehicle. Everything is empty until the        */
/* gateway (which fronts ThingsBoard) serves it behind these shapes.   */
/* ------------------------------------------------------------------ */

export const DEVICES: Device[] = [];

export const GEOFENCES: Geofence[] = [];

export const ALERTS: Alert[] = [];

/** The device's location trail, for map trails and playback. */
export function getTrack(_device: Device): TrackPoint[] {
  return [];
}

/** Activity, distance and heart rate for the current day. */
export function getHealth(_device: Device): Health | null {
  return null;
}

/** Completed journeys, most recent first. */
export function getTrips(_device: Device): Trip[] {
  return [];
}
