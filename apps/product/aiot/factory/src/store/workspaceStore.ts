import { useCallback, useMemo } from 'react';
import { useCreateWorkspaceMutation, useListActiveWorkspacesQuery } from '@paapeli/api';
import { setActiveWorkspaceId, useActiveWorkspaceId } from '@paapeli/brand/workspace';

/* Cloud Workspace = the user's org-level space (members, billing, API keys,
   white-label…). The list is real (GET /api/v1/aiot/workspaces) and the
   SELECTION is owned by the panel host's account menu — this remote reads it
   through @paapeli/brand/workspace, because nearly every endpoint it calls is
   scoped to /{workspaceId}/{productKey}. Running standalone (no host chrome),
   the picker on the Account Settings page selects it instead. */

export type Workspace = { id: string; name: string };

export const MAX_WORKSPACES = 5;

/**
 * The workspace id to send with workspace-scoped requests, or `null` while
 * the host hasn't picked one yet (still loading, or the user has no
 * workspaces). Keep requests disabled while it is null.
 *
 * Prefer this over `useWorkspace()` at API call sites: it needs no workspace
 * list, so it doesn't add a request to every page that talks to the API.
 */
export function useWorkspaceId(): string | null {
  return useActiveWorkspaceId();
}

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
  /** Creates the workspace and selects it. Resolves false if `name` is blank. */
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
