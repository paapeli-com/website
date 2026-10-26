/* "Keep these settings for quick create next time".
 *
 * Kept in this browser until the gateway has somewhere to keep them; when it
 * does, these three functions are what change. The server name is never kept
 * (each server needs its own), and neither is anything secret. Cloud servers
 * and GPU servers keep their settings apart: one is not a template for the
 * other.
 */

export type CreateMode = "cloud" | "gpu";

export interface QuickCreateSettings {
  regionId: string;
  zone: string;
  imageId: string;
  version: string;
  planId: string;
  bootGb: number;
  extraDisks: number[];
  backup?: boolean;
  installDrivers?: boolean;
  ipv6: boolean;
  access: "ssh" | "password";
  sshKeyId?: string;
  firewallId: string;
  powerOn: boolean;
}

const storageKey = (mode: CreateMode) =>
  mode === "gpu" ? "paapeli.cloudServer.quickCreate.gpu" : "paapeli.cloudServer.quickCreate";

export function loadQuickCreate(mode: CreateMode): QuickCreateSettings | null {
  try {
    const raw = window.localStorage.getItem(storageKey(mode));
    return raw ? (JSON.parse(raw) as QuickCreateSettings) : null;
  } catch {
    return null;
  }
}

export function saveQuickCreate(mode: CreateMode, settings: QuickCreateSettings) {
  try {
    window.localStorage.setItem(storageKey(mode), JSON.stringify(settings));
  } catch {
    /* storage blocked: the next create simply starts from the defaults */
  }
}

export function clearQuickCreate(mode: CreateMode) {
  try {
    window.localStorage.removeItem(storageKey(mode));
  } catch {
    /* nothing to clear */
  }
}

/** What the wizard hands the page that follows it. */
export interface CreatedServer {
  kind: CreateMode;
  name: string;
  image: string;
  osFamily: "linux" | "windows";
  spec: string;
  gpu?: string;
  ipv6: boolean;
  ipv4Address: string;
  /** root on Linux, Administrator on Windows. */
  username: string;
  ipv6Address: string;
  access: "ssh" | "password";
  sshKeyName?: string;
  password?: string;
  powerOn: boolean;
}
