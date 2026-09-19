import { useCallback, useMemo } from "react";
import { useCreateWorkspaceMutation, useListActiveWorkspacesQuery } from "@paapeli/api";
import { setActiveWorkspaceId, useActiveWorkspaceId } from "@paapeli/brand/workspace";

/* Cloud Workspace = the user's org-level space (members, billing, API keys,
   white-label…). The list is real (GET /api/v1/aiot/workspaces) and the
   SELECTION is the shell's, shared through @paapeli/brand/workspace — the
   same id ProductGate subscribes to gpsTracking and every workspace-scoped
   request uses. This used to be a localStorage-only mock that could drift
   from both. Mirrors features/factory/store/workspaceStore.ts. */

export type Workspace = { id: string; name: string };

export const MAX_WORKSPACES = 5;

/** The workspace list plus the shared selection — for workspace pickers. */
export function useWorkspace() {
  const { data, isLoading } = useListActiveWorkspacesQuery();
  const workspaces = useMemo<Workspace[]>(
    () => (data ?? []).map((w) => ({ id: w.workspaceId, name: w.workspaceName })),
    [data],
  );
  const activeId = useActiveWorkspaceId();
  const active = workspaces.find((w) => w.id === activeId) ?? null;

  const createWorkspace = useCreateWorkspaceMutation();
  /** Creates the workspace and selects it. Resolves false if `name` is blank
      or the cap is reached; rejects if the server refuses. */
  const addWorkspace = useCallback(
    async (name: string) => {
      const clean = name.trim();
      if (!clean || workspaces.length >= MAX_WORKSPACES) return false;
      const created = await createWorkspace.mutateAsync({ name: clean });
      setActiveWorkspaceId(created.id);
      return true;
    },
    [createWorkspace, workspaces.length],
  );

  return {
    workspaces,
    activeId,
    active,
    isLoading,
    setActive: setActiveWorkspaceId,
    addWorkspace,
    isAdding: createWorkspace.isPending,
    canAdd: workspaces.length < MAX_WORKSPACES,
  };
}
