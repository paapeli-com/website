import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { setApiAuthToken, setApiBaseUrl } from "@paapeli/api";
import { getToken, isAuthenticated, goToLogin } from "@paapeli/brand/session";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { PAAPELI_API_BASE_URL } from "@/config";
import WorkspaceGeneral from "@/pages/WorkspaceGeneral";
import WorkspaceMembers from "@/pages/WorkspaceMembers";
import WorkspaceInvitations from "@/pages/WorkspaceInvitations";
import WorkspaceRoles from "@/pages/WorkspaceRoles";

const queryClient = new QueryClient();

// main.tsx (where this used to live) never runs when the app is loaded as a
// federation remote — the host imports this file directly. @paapeli/api
// isn't a federation-shared dependency, so each remote bundles its own copy
// and must configure it itself, regardless of how it's mounted. Login is a
// real page navigation (not client-side routing), so by the time this
// module evaluates, the shared session — if any — is already in
// localStorage; a one-shot read here is enough to carry the bearer token on
// every request this remote makes.
setApiBaseUrl(PAAPELI_API_BASE_URL);
setApiAuthToken(getToken());

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Gate on the shared, product-agnostic session (set at the host /login).
  if (!isAuthenticated()) {
    goToLogin();
    return null;
  }
  return <>{children}</>;
}

/* Federation-exposed remote entry (see vite.config.ts `exposes`). No
   BrowserRouter here — the host provides the single router; this renders
   under the host's "/CloudManagement/*" splat route, so React Router
   resolves the paths below relative to that mount automatically.

   Cloud Management is independent of any AIoT product/solution — it's
   workspace/account administration, mounted as a sibling top-level area
   in the host rather than nested under /AIoT/*.

   Scope for now: only the "Workspace" section (General/Members/
   Invitations/Roles) is implemented, backed by @paapeli/api's real
   `workspaces` module — see the host's Cloud Management design doc for
   the rest of the planned sections (Products & Access, Usage & Billing,
   Developer, Branding, Security, Enterprise). */
export default function RemoteApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoute>
        <WorkspaceProvider>
          <Toaster richColors position="top-center" />
          <Routes>
            {/* Route path PATTERNS in a nested/descendant <Routes> resolve
                relative to the host's "/CloudManagement/*" mount automatically
                — but <Navigate to> does NOT get that same treatment, and
                resolves leading-slash targets absolutely from the whole
                app's root. So these targets are ROUTE-RELATIVE (no leading
                slash): React Router joins them onto whatever this <Routes>
                is mounted under, which is "/CloudManagement" inside the host
                and the basename when run standalone. Hardcoding the mount
                prefix instead would break standalone mode (the basename
                would be applied on top of it) and would silently rot if the
                host ever remounted this remote elsewhere. */}
            <Route path="/" element={<Navigate to="workspace/general" replace />} />
            <Route path="/workspace/general" element={<WorkspaceGeneral />} />
            <Route path="/workspace/members" element={<WorkspaceMembers />} />
            <Route path="/workspace/invitations" element={<WorkspaceInvitations />} />
            <Route path="/workspace/roles" element={<WorkspaceRoles />} />
            <Route path="*" element={<Navigate to="workspace/general" replace />} />
          </Routes>
        </WorkspaceProvider>
      </ProtectedRoute>
    </QueryClientProvider>
  );
}
