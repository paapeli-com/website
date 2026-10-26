/* "Keep these settings for quick create next time".
 *
 * Kept in this browser until the gateway has somewhere to keep them; when it
 * does, these three functions are what change. The server name is never kept
 * (each server needs its own), and neither is anything secret.
 */

export interface QuickCreateSettings {
  regionId: string;
  zone: string;
  imageId: string;
  version: string;
  planId: string;
  bootGb: number;
  extraDisks: number[];
  backup?: boolean;
  ipv6: boolean;
  access: "ssh" | "password";
  sshKeyId?: string;
  firewallId: string;
  powerOn: boolean;
}

const STORAGE_KEY = "paapeli.cloudServer.quickCreate";

export function loadQuickCreate(): QuickCreateSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuickCreateSettings) : null;
  } catch {
    return null;
  }
}

export function saveQuickCreate(settings: QuickCreateSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage blocked: the next create simply starts from the defaults */
  }
}

export function clearQuickCreate() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** What the wizard hands the page that follows it. */
export interface CreatedServer {
  name: string;
  image: string;
  spec: string;
  ipv6: boolean;
  ipv4Address: string;
  ipv6Address: string;
  access: "ssh" | "password";
  sshKeyName?: string;
  password?: string;
  powerOn: boolean;
}
