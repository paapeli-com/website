import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useListActiveWorkspacesQuery, type UserWorkspace } from "@paapeli/api";
import { setActiveWorkspaceId, useActiveWorkspaceId } from "@paapeli/brand/workspace";

interface WorkspaceContextValue {
  workspaces: UserWorkspace[];
  isLoading: boolean;
  selectedId: string | null;
  selected: UserWorkspace | null;
  setSelectedId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

/** The workspace Cloud Management works on. It is the panel's own active
    workspace (@paapeli/brand/workspace), the one the header's account menu
    switches, not a copy: a copy is what let the header change workspace while
    Members went on showing the old one. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useListActiveWorkspacesQuery();
  const workspaces = useMemo(() => data ?? [], [data]);
  const activeId = useActiveWorkspaceId();

  // The account menu falls back to the first workspace when the stored one is
  // not this user's; read the same fallback so both agree before it lands.
  const selected = workspaces.find((w) => w.workspaceId === activeId) ?? workspaces[0] ?? null;
  const selectedId = selected?.workspaceId ?? null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, isLoading, selectedId, selected, setSelectedId: setActiveWorkspaceId }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceSelection() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceSelection must be used within WorkspaceProvider");
  return ctx;
}
