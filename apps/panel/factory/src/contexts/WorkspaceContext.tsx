import React, { createContext, useContext, useMemo, useState } from "react";

/* Cloud Workspace = the user's org-level space (members, billing, API    */
/* keys, white-label…). A user may create or join up to MAX_WORKSPACES.   */
/* Persisted locally for now; later synced from the gateway.              */

export type Workspace = { id: string; name: string };

export const MAX_WORKSPACES = 5;

const DEFAULT_WORKSPACES: Workspace[] = [{ id: "ws-default", name: "My Workspace" }];

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeId: string;
  active: Workspace;
  setActive: (id: string) => void;
  addWorkspace: (name: string) => boolean;
  canAdd: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function load(): Workspace[] {
  if (typeof window === "undefined") return DEFAULT_WORKSPACES;
  try {
    const raw = window.localStorage.getItem("paapeli_workspaces");
    const parsed = raw ? (JSON.parse(raw) as Workspace[]) : null;
    return parsed && parsed.length ? parsed : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => load());
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_WORKSPACES[0].id;
    return window.localStorage.getItem("paapeli_active_ws") || load()[0].id;
  });

  const persist = (ws: Workspace[]) => {
    setWorkspaces(ws);
    try {
      window.localStorage.setItem("paapeli_workspaces", JSON.stringify(ws));
    } catch {}
  };

  const setActive = (id: string) => {
    setActiveId(id);
    try {
      window.localStorage.setItem("paapeli_active_ws", id);
    } catch {}
  };

  const addWorkspace = (name: string) => {
    const clean = name.trim();
    if (!clean || workspaces.length >= MAX_WORKSPACES) return false;
    const ws: Workspace = { id: `ws-${Date.now()}`, name: clean };
    persist([...workspaces, ws]);
    setActive(ws.id);
    return true;
  };

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0],
    [workspaces, activeId],
  );

  const value = useMemo<WorkspaceContextType>(
    () => ({ workspaces, activeId: active.id, active, setActive, addWorkspace, canAdd: workspaces.length < MAX_WORKSPACES }),
    [workspaces, active],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
