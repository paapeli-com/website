import { create } from 'zustand';

/* Cloud Workspace = the user's org-level space (members, billing, API    */
/* keys, white-label…). A user may create or join up to MAX_WORKSPACES.   */
/* Persisted locally for now; later synced from the gateway.              */

export type Workspace = { id: string; name: string };

export const MAX_WORKSPACES = 5;

const DEFAULT_WORKSPACES: Workspace[] = [{ id: 'ws-default', name: 'My Workspace' }];

function loadWorkspaces(): Workspace[] {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACES;
  try {
    const raw = window.localStorage.getItem('paapeli_workspaces');
    const parsed = raw ? (JSON.parse(raw) as Workspace[]) : null;
    return parsed && parsed.length ? parsed : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
}

function loadActiveId(): string {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACES[0].id;
  return window.localStorage.getItem('paapeli_active_ws') || loadWorkspaces()[0].id;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeId: string;
  setActive: (id: string) => void;
  addWorkspace: (name: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: loadWorkspaces(),
  activeId: loadActiveId(),

  setActive: (id: string) => {
    set({ activeId: id });
    try {
      window.localStorage.setItem('paapeli_active_ws', id);
    } catch {}
  },

  addWorkspace: (name: string) => {
    const clean = name.trim();
    const { workspaces } = get();
    if (!clean || workspaces.length >= MAX_WORKSPACES) return false;

    const ws: Workspace = { id: `ws-${Date.now()}`, name: clean };
    const next = [...workspaces, ws];
    set({ workspaces: next });
    try {
      window.localStorage.setItem('paapeli_workspaces', JSON.stringify(next));
    } catch {}
    get().setActive(ws.id);
    return true;
  },
}));

/** Drop-in replacement for the old `useWorkspace()` context hook. */
export function useWorkspace() {
  const { workspaces, activeId, setActive, addWorkspace } = useWorkspaceStore();
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return {
    workspaces,
    activeId: active.id,
    active,
    setActive,
    addWorkspace,
    canAdd: workspaces.length < MAX_WORKSPACES,
  };
}
