import { useCallback, useEffect, useState } from "react";

/* The central application-API-key registry.
 *
 * One list, one lifecycle, one identity. Every product that wants a key sends
 * the user here rather than keeping its own; a key created from AI Inference
 * is the same record as a key created from Cloud Management, and revoking it
 * in one place revokes it everywhere, because there is only one place.
 *
 * NOT the same thing as a device credential. Per-device MQTT tokens and
 * certificates live behind @paapeli/api's deviceCredentials endpoints and keep
 * their own lifecycle; mixing the two would let someone revoke a fleet by
 * deleting what looks like an application key.
 *
 * BACKEND STATUS: @paapeli/api has no application-key module, so this is a
 * typed adapter over browser storage, not a service. Consequences a reader
 * must not have to discover:
 *   - Keys live in this browser only. Nothing is issued, hashed or enforced.
 *   - The "secret" shown once at creation is generated here and authorises
 *     nothing. It is prefixed pp_preview_ so it can never be mistaken for a
 *     live credential.
 *   - Grants are recorded, not enforced. A gateway that does not check them
 *     is not made safer by this screen.
 * When the service exists, replace the functions below with queries and
 * mutations; the call sites and the shape stay as they are.
 */

export type ApiKeyStatus = "active" | "expired" | "revoked";

/** One product's slice of a key: where it may act and on what. */
export interface ApiKeyGrant {
  productId: string;
  /** Projects inside the product's own hierarchy. */
  projectIds: string[];
  /** Permission identifiers the product's gateway understands. */
  actions: string[];
  /** Models, assets, vehicles — whatever that product scopes by. */
  resourceIds: string[];
}

export interface ApiKey {
  id: string;
  workspaceId: string | null;
  name: string;
  /** Shown in lists. The secret itself is never stored. */
  prefix: string;
  status: ApiKeyStatus;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  createdBy: string;
  grants: ApiKeyGrant[];
}

/** A key created before products were recorded. Never read as "all products". */
export const isLegacyKey = (key: ApiKey) => key.grants.length === 0;

const STORAGE_KEY = "paapeli_api_keys_v1";
const EVENT = "paapeli:api-keys";

const read = (): ApiKey[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApiKey[]) : [];
  } catch {
    return [];
  }
};

const write = (keys: ApiKey[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* Private mode. The list still works for this render; nothing depends on
       it surviving, because nothing here is a real credential. */
  }
  window.dispatchEvent(new Event(EVENT));
};

/* Expiry is a property of the clock, not of the stored row: a key written as
   active last month is expired today without anything having rewritten it. */
const resolveStatus = (key: ApiKey): ApiKeyStatus => {
  if (key.status === "revoked") return "revoked";
  if (key.expiresAt && key.expiresAt < Date.now()) return "expired";
  return "active";
};

const withStatus = (key: ApiKey): ApiKey => ({ ...key, status: resolveStatus(key) });

/** The whole registry, newest first. */
export function listApiKeys(): ApiKey[] {
  return read()
    .map(withStatus)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getApiKey(id: string): ApiKey | undefined {
  return listApiKeys().find((k) => k.id === id);
}

/** Keys carrying a grant for one product, for a product-scoped view. */
export function listKeysForProduct(productId: string, projectId?: string): ApiKey[] {
  return listApiKeys().filter((k) =>
    k.grants.some(
      (g) => g.productId === productId && (!projectId || g.projectIds.includes(projectId)),
    ),
  );
}

export interface CreateApiKeyInput {
  name: string;
  workspaceId: string | null;
  createdBy: string;
  /** null for a key that does not expire. */
  expiresAt: number | null;
  grants: ApiKeyGrant[];
}

export interface CreatedApiKey {
  key: ApiKey;
  /** Returned once and never stored. */
  secret: string;
}

const randomSuffix = (length: number) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

/**
 * Create a key. Returns the record and, once, its secret.
 *
 * The secret is not written to storage, not put in the URL and not logged —
 * the same discipline a real one needs, so that adding the service later does
 * not mean auditing every call site again.
 */
export function createApiKey(input: CreateApiKeyInput): CreatedApiKey {
  const now = Date.now();
  const body = randomSuffix(24);
  const key: ApiKey = {
    id: `key-${now}-${randomSuffix(5)}`,
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    /* pp_preview_ rather than pp_live_: nothing issued here authorises
       anything, and a reader should be able to tell at a glance. */
    prefix: `pp_preview_…${body.slice(-4)}`,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    expiresAt: input.expiresAt,
    createdBy: input.createdBy,
    grants: input.grants,
  };
  write([key, ...read()]);
  return { key, secret: `pp_preview_${body}` };
}

/** Revoke a key across every product it was granted. Not reversible. */
export function revokeApiKey(id: string): void {
  write(read().map((k) => (k.id === id ? { ...k, status: "revoked", updatedAt: Date.now() } : k)));
}

export function revokeApiKeys(ids: string[]): void {
  const set = new Set(ids);
  const now = Date.now();
  write(read().map((k) => (set.has(k.id) ? { ...k, status: "revoked", updatedAt: now } : k)));
}

/**
 * Remove one product's grant. Deliberately not the same operation as revoking:
 * a key that also reaches Smart Factory keeps working there.
 */
export function removeGrant(id: string, productId: string): void {
  write(
    read().map((k) =>
      k.id === id
        ? { ...k, grants: k.grants.filter((g) => g.productId !== productId), updatedAt: Date.now() }
        : k,
    ),
  );
}

export function renameApiKey(id: string, name: string): void {
  write(read().map((k) => (k.id === id ? { ...k, name: name.trim(), updatedAt: Date.now() } : k)));
}

/** The registry, re-read whenever it changes — in this tab or another. */
export function useApiKeys(): { keys: ApiKey[]; refresh: () => void } {
  const [keys, setKeys] = useState<ApiKey[]>(listApiKeys);
  const refresh = useCallback(() => setKeys(listApiKeys()), []);

  useEffect(() => {
    const onChange = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { keys, refresh };
}
