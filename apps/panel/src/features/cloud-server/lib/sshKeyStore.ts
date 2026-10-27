import { useSyncExternalStore } from "react";
import type { KeyAlgorithm } from "./sshKeyGen";
import { ApiError } from "./openstackErrors";

/* SSH keys, until Cloud Server has an API.
 *
 * What Nova's key pairs give: a name, unique in the account, and the public
 * key; its type ("ssh", or "x509" for a Windows certificate) and fingerprint
 * are read from it. A key pair cannot be renamed or changed, only deleted and
 * added again. A key is put into a server once, when the server is made:
 * deleting it here leaves the servers made with it as they are.
 *
 * Key pairs live in one region. "All zones" adds the key in every region and
 * zone the account can use, so any new server can pick it; otherwise it is
 * offered only to servers made in its own zone.
 *
 * The list starts empty. The server wizard picks from it and adds to it.
 */

export interface SshKeyRecord {
  id: string;
  name: string;
  type: "ssh" | "x509";
  algorithm: KeyAlgorithm;
  bits?: number;
  publicKey: string;
  fingerprint: string;
  /** Made here (the private half was handed over once) or pasted in. */
  origin: "generated" | "imported";
  region: string;
  zone: string;
  allZones: boolean;
  createdAt: number;
}

const STORAGE_KEY = "paapeli.cloudServer.sshKeys";
const listeners = new Set<() => void>();

function read(): SshKeyRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SshKeyRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: SshKeyRecord[] = read();

function write(next: SshKeyRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

export function addSshKey(input: Omit<SshKeyRecord, "id" | "createdAt">): SshKeyRecord {
  /* Nova: 409 "Key pair '…' already exists." */
  if (sshKeyNameTaken(input.name)) throw new ApiError(409, "KeyPairExists", "", {}, true);
  const at = Date.now();
  const key: SshKeyRecord = { id: `key-${at.toString(36)}`, createdAt: at, ...input };
  write([key, ...cache]);
  return key;
}

export const deleteSshKeys = (ids: string[]) => write(cache.filter((k) => !ids.includes(k.id)));

/** Nova answers "already exists" for a name in use. */
export const sshKeyNameTaken = (name: string) => cache.some((k) => k.name === name.trim());

/** A key a server made in this region and zone can be given. */
export const keyAvailableIn = (k: SshKeyRecord, region: string, zone: string) =>
  k.allZones || (k.region === region && k.zone === zone);

export function useSshKeys(): SshKeyRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
