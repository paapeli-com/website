import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useListActiveWorkspacesQuery, type UserWorkspace } from "@paapeli/api";

interface WorkspaceContextValue {
  workspaces: UserWorkspace[];
  isLoading: boolean;
  selectedId: string | null;
  selected: UserWorkspace | null;
  setSelectedId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

/** The workspace currently being administered in Cloud Management — picked on the General page, used everywhere else. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useListActiveWorkspacesQuery();
  const workspaces = useMemo(() => data ?? [], [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && workspaces.length > 0) setSelectedId(workspaces[0].workspaceId);
  }, [workspaces, selectedId]);

  const selected = workspaces.find((w) => w.workspaceId === selectedId) ?? null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, isLoading, selectedId, selected, setSelectedId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceSelection() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceSelection must be used within WorkspaceProvider");
  return ctx;
}
