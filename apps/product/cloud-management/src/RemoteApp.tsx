import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { setApiAuthToken, setApiBaseUrl, useCreateProductMutation } from "@paapeli/api";
import { getToken, isAuthenticated, goToLogin } from "@paapeli/brand/session";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { PAAPELI_API_BASE_URL } from "@/config";
import Overview from "@/pages/Overview";
import Subscriptions from "@/pages/Subscriptions";
import Billing from "@/pages/Billing";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Usage from "@/pages/Usage";
import PaymentMethods from "@/pages/PaymentMethods";
import AccessApiKeys from "@/pages/AccessApiKeys";
import Security from "@/pages/Security";
import Organisation from "@/pages/Organisation";
import Workspaces from "@/pages/Workspaces";

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
   in the host rather than nested under /AIoT/*. Section shape follows the
   "Cloud Management.dc.html" design doc; see apps/panel/host/src/nav/
   cloudManagementNav.ts for how each route surfaces in the sidebar.

   Sidebar structure (apps/panel/host/src/nav/cloudManagementNav.ts) mirrors
   the design's CLOUD_NAV constant exactly plus one addition — Organisation
   is one nav entry with its own tabs (see pages/Organisation.tsx and
   pages/organisation/*), not four separate top-level routes. Workspaces
   (pages/Workspaces.tsx) isn't in the original design doc; it's where you
   pick or create the workspace that Organisation and every product then
   act on, backed by the workspaces API's list/create/products endpoints.
   Workspaces and Organisation's Members and Invitations tabs are backed by
   real @paapeli/api endpoints today — Subscriptions, Billing, Usage,
   Payment methods, Access & API keys, and Organisation's Roles/profile bits
   render the design with static placeholder data since no billing/usage/
   roles backend exists yet. Each says so in its own header or panel. The
   design's 10th page ("Inside AIoT") only illustrates how the cloud rail
   collapses once inside a product — that chrome belongs to the host's
   Layout/Sidebar, not this remote, so it isn't a route here. */
export default function RemoteApp() {
  // Register the "aiot" product once per mount. Safe to no-op/409 on repeat
  // visits — the backend treats re-creation as idempotent — so we don't
  // surface errors from this to the user.
  const createProduct = useCreateProductMutation();
  const didCreateProduct = useRef(false);
  useEffect(() => {
    if (didCreateProduct.current) return;
    didCreateProduct.current = true;
    createProduct.mutate({ productKey: "aiot", name: "Industrial IoT" });
  }, []); // eslint-disable-line

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
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/:invoiceId" element={<InvoiceDetail />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/access-keys" element={<AccessApiKeys />} />
            <Route path="/security" element={<Security />} />
            <Route path="/organisation" element={<Organisation />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </WorkspaceProvider>
      </ProtectedRoute>
    </QueryClientProvider>
  );
}
