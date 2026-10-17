import { useGetMyProfileQuery } from "@paapeli/api";
import { getCurrentUser } from "@paapeli/brand/session";

/**
 * The signed-in account's name, from its profile (GET /users/me), which the
 * account settings page edits. Until that answers, the name sign-up stored in
 * the session stands in, and failing both, the part of the email before the @:
 * a real label for the account rather than a placeholder.
 */
export function useDisplayName(): string {
  const user = getCurrentUser();
  const email = user?.email ?? "";
  const { data: profile } = useGetMyProfileQuery(!!user);
  return profile?.displayName?.trim() || user?.name || email.split("@")[0] || "";
}
