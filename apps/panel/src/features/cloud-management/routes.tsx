import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useCreateProductMutation } from "@paapeli/api";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import Overview from "./pages/Overview";
import Workspaces from "./pages/Workspaces";
import Subscriptions from "./pages/Subscriptions";
import Billing from "./pages/Billing";
import InvoiceDetail from "./pages/InvoiceDetail";
import Usage from "./pages/Usage";
import PaymentMethods from "./pages/PaymentMethods";
import AccessApiKeys from "./pages/AccessApiKeys";
import Security from "./pages/Security";
import Members from "./pages/Members";

/* Cloud Management — workspace/account administration, independent of any
   AIoT product/solution, mounted at /CloudManagement/*.

   This module is the feature's lazy chunk boundary (see src/app/features.ts).
   Auth, the API client, the query client and the toaster are all owned by the
   app shell now — when this was a Module Federation remote it had to set up
   its own copy of each, because it was a separate bundle.

   Section shape follows the "Cloud Management.dc.html" design doc; see
   src/shell/nav/cloudManagementNav.ts for how each route surfaces in the
   sidebar. That nav mirrors the design's CLOUD_NAV constant plus one addition:
   Members is a single entry with its own tabs (see pages/Members.tsx and
   pages/members/*) rather than four top-level routes, and Workspaces
   (pages/Workspaces.tsx) is new — it's where you pick or create the workspace
   that Organisation and every product then act on.

   Workspaces and Organisation's Members/Invitations tabs are backed by real
   @paapeli/api endpoints. Subscriptions, Billing, Usage, Payment methods,
   Access & API keys, and Organisation's Roles/profile bits render the design
   with static placeholder data since no billing/usage/roles backend exists
   yet; each says so in its own header or panel. The design's 10th page
   ("Inside AIoT") only illustrates how the cloud rail collapses once inside a
   product — that chrome belongs to the shell, so it isn't a route here. */
export default function CloudManagementRoutes() {
  // Register the "aiot" product once per mount. Safe to no-op/409 on repeat
  // visits — the backend treats re-creation as idempotent — so we don't
  // surface errors from this to the user.
  const createProduct = useCreateProductMutation();
  const didCreateProduct = useRef(false);
  // useEffect(() => {
  //   if (didCreateProduct.current) return;
  //   didCreateProduct.current = true;
  //   createProduct.mutate({ productKey: "aiot", name: "Industrial IoT" });
  // }, []); // eslint-disable-line

  return (
    <WorkspaceProvider>
      <Routes>
        {/* Route path PATTERNS in a descendant <Routes> resolve relative to
            the "/CloudManagement/*" mount automatically — but <Navigate to>
            does NOT, and resolves a leading-slash target absolutely from the
            app root. So these targets are ROUTE-RELATIVE (no leading slash):
            React Router joins them onto whatever this <Routes> is mounted
            under. Hardcoding the prefix would silently rot if the feature were
            ever mounted elsewhere. */}
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
        <Route path="/members" element={<Members />} />
        {/* The page was Organisation until its tabs were cut to the three
            questions people actually ask. Links that were sent still land. */}
        <Route path="/organisation" element={<Navigate to="../members" replace />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </WorkspaceProvider>
  );
}
