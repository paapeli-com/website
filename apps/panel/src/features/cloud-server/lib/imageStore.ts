import { useSyncExternalStore } from "react";

/* Custom images, until Cloud Server has an API.
 *
 * The list starts empty and each upload is added here, kept in this browser.
 * An upload's progress is worked out from when it started and how long it
 * takes, so the list can show it from any page and it survives a refresh;
 * when the endpoint exists, polling the upload replaces that arithmetic.
 *
 * Some uploads are made to fail part way, so the Failed state and its Retry
 * are real and can be tried; that stops when the uploads do.
 */

export type ImageFormat = "qcow2" | "raw";
export type BootType = "bios" | "uefi";
export type ImageStatus = "uploading" | "ready" | "failed";

export interface ImageRecord {
  id: string;
  name: string;
  source: "url" | "file";
  /** The URL, or the file's name. */
  location: string;
  format: ImageFormat;
  boot: BootType;
  osFamily: "linux" | "windows";
  sizeGb: number;
  createdAt: number;
  startedAt: number;
  durationMs: number;
  /** Where between 0 and 1 this attempt fails, if it does. */
  failAt?: number;
}

/** Largest image accepted. */
export const MAX_IMAGE_GB = 30;

const STORAGE_KEY = "paapeli.cloudServer.images";
const listeners = new Set<() => void>();

function read(): ImageRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ImageRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: ImageRecord[] = read();

function write(next: ImageRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

/** One attempt: a few seconds a GB, and one in four fails somewhere. */
function attempt(sizeGb: number) {
  return {
    startedAt: Date.now(),
    durationMs: Math.min(60_000, 6_000 + sizeGb * 1_500),
    failAt: Math.random() < 0.25 ? 0.35 + Math.random() * 0.4 : undefined,
  };
}

export function addImage(img: Omit<ImageRecord, "id" | "createdAt" | "startedAt" | "durationMs" | "failAt">) {
  const record: ImageRecord = {
    ...img,
    id: `img-${Date.now().toString(36)}`,
    createdAt: Date.now(),
    ...attempt(img.sizeGb),
  };
  write([record, ...cache]);
  return record;
}

export const retryImage = (id: string) =>
  write(cache.map((i) => (i.id === id ? { ...i, ...attempt(i.sizeGb) } : i)));
export const renameImage = (id: string, name: string) => write(cache.map((i) => (i.id === id ? { ...i, name } : i)));
export const removeImages = (ids: string[]) => write(cache.filter((i) => !ids.includes(i.id)));

/** Progress 0..1 and the state it puts the image in. */
export function imageProgress(i: ImageRecord, now = Date.now()): { status: ImageStatus; progress: number } {
  const p = Math.min(1, Math.max(0, (now - i.startedAt) / i.durationMs));
  if (i.failAt !== undefined && p >= i.failAt) return { status: "failed", progress: i.failAt };
  return p >= 1 ? { status: "ready", progress: 1 } : { status: "uploading", progress: p };
}

export function useImages(): ImageRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
