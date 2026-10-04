import { useListActiveWorkspacesQuery, useListWorkspaceMembersQuery } from "@paapeli/api";
import { getCurrentUser } from "@paapeli/brand/session";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";

/**
 * The signed-in account's name.
 *
 * Nothing serves a profile yet, and sign-in returns no name, so the session
 * usually has none. The workspace roster does carry each member's display
 * name, so the account's own row there is where it is read from. Until that
 * answers, or if it has no name either, the part of the email before the @
 * stands in: a real label for the account rather than a placeholder.
 */
export function useDisplayName(): string {
  const user = getCurrentUser();
  const email = user?.email ?? "";
  const { data: workspaces } = useListActiveWorkspacesQuery();
  const activeId = useActiveWorkspaceId();
  const workspaceId =
    (workspaces?.find((w) => w.workspaceId === activeId) ?? workspaces?.[0])?.workspaceId ?? "";

  const needsLookup = !user?.name && !!email;
  const { data } = useListWorkspaceMembersQuery(workspaceId, email, 1, 5, needsLookup);
  const own = data?.data.find((m) => m.email?.toLowerCase() === email.toLowerCase());

  return user?.name || own?.displayName?.trim() || email.split("@")[0] || "";
}
