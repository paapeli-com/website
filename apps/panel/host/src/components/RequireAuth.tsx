import { isAuthenticated, goToLogin } from "@paapeli/brand/session";

/* Gate on the shared, product-agnostic session (set at /login). Mirrors
   the ProtectedRoute used inside the remotes themselves (see e.g.
   apps/product/aiot/factory/src/components/ProtectedRoute.tsx) — the host
   now owns every /AIoT/* route, so this is the one place that check needs
   to run for host-mounted navigation. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    goToLogin();
    return null;
  }
  return <>{children}</>;
}
