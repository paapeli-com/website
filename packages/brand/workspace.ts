import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Active workspace — shared by the host shell and every remote.       */
/*                                                                     */
/* Almost every AIoT endpoint is workspace-scoped                      */
/* (/api/v1/aiot/<resource>/{workspaceId}/{productKey}/…), but the      */
/* workspace is *chosen* in the host's account menu — the host owns the */
/* list (GET /api/v1/aiot/workspaces) and the selection; remotes only   */
/* read the id to build their requests.                                 */
/*                                                                     */
/* The host and each remote are separate bundles with separate module   */
/* instances, so a React context or a store can't reach across them —   */
/* localStorage plus an event on the shared `window` is the only        */
/* channel. Note `storage` events only fire in OTHER documents: they    */
/* cover other tabs, while the custom event is what keeps the remotes   */
/* in THIS tab in sync with the host's menu.                            */
/* ------------------------------------------------------------------ */

const KEY = "paapeli_active_workspace";
const EVENT = "paapeli:workspace";

/* localStorage is the source of truth, so every read is fresh no matter which
   bundle wrote it. `mirror` only stands in when storage is unusable (private
   mode); it's kept current by the listener below, which every bundle installs
   for itself when this module loads — a bundle that never subscribes must
   still read the right id. */
let mirror: string | null = null;
let mirrorOnly = false;

function read(): string | null {
  if (typeof window === "undefined") return null;
  if (mirrorOnly) return mirror;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    mirrorOnly = true;
    return mirror;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener(EVENT, (e) => {
    mirror = (e as CustomEvent<string | null>).detail ?? null;
  });
}

/** The workspace id every workspace-scoped request should use, if known. */
export function getActiveWorkspaceId(): string | null {
  return read();
}

/** Select the active workspace. Host-owned — remotes read, they don't set. */
export function setActiveWorkspaceId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (read() === id) return;
  mirror = id;
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    mirrorOnly = true; /* the event below still updates this document */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

/** Observe the selection, including changes made by another bundle or tab. */
export function subscribeActiveWorkspace(listener: (id: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => listener(read());
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    mirror = e.newValue;
    listener(read());
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The active workspace id, `null` until the host has picked one (no session
 * yet, the workspace list is still loading, or the user has no workspaces).
 * Callers must keep workspace-scoped requests disabled while it is null.
 */
export function useActiveWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(getActiveWorkspaceId);
  useEffect(() => subscribeActiveWorkspace(setId), []);
  return id;
}
