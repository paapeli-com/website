import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { setApiAuthToken, setApiBaseUrl } from "@paapeli/api";
import { getToken } from "@paapeli/brand/session";
import { solutionPath, productKeyFor } from "@paapeli/brand/config";
import { BrandProvider } from "@/shell/BrandProvider";
import { Layout } from "@/shell/Layout";
import { RequireAuth } from "@/shell/RequireAuth";
import { PAAPELI_API_BASE_URL } from "@/shared/config";
import { Feature } from "./Feature";
import { cloudManagementRoutes, factoryRoutes, trackRoutes } from "./features";

const queryClient = new QueryClient();

/* One app, one bundle graph, one API client. Login is a real page navigation
   (not client-side routing), so by the time this module evaluates the shared
   session — if any — is already in localStorage; a one-shot read here carries
   the bearer token on every request the panel makes.

   This used to have to be repeated inside each remote's own entry, because
   every remote bundled its own copy of @paapeli/api. Now there is exactly one
   copy, configured exactly once, here. */
setApiBaseUrl(PAAPELI_API_BASE_URL);
setApiAuthToken(getToken());

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandProvider>
        <BrowserRouter>
          <Toaster richColors position="top-center" />
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to={`${solutionPath("SmartFactory")}/`} replace />} />
              <Route path="AIoT" element={<Navigate to={`${solutionPath("SmartFactory")}/`} replace />} />

              {/* Each feature is one lazily-imported chunk (see ./features.ts).
                  React Router hands it the "*" splat, so the feature owns every
                  path below its mount — exactly the boundary the remotes had,
                  minus the runtime fetch that could fail. */}
              <Route
                path="AIoT/SmartFactory/*"
                element={
                  <Feature name="Smart Factory" productKey={productKeyFor("SmartFactory")} routes={factoryRoutes} />
                }
              />
              <Route
                path="AIoT/GPSTracking/*"
                element={<Feature name="GPS Tracking" productKey={productKeyFor("GPSTracking")} routes={trackRoutes} />}
              />
              {/* Independent of any AIoT product/solution — workspace/account
                  administration, reached from a product's sidebar footer. */}
              <Route
                path="CloudManagement/*"
                element={<Feature name="Cloud Management" routes={cloudManagementRoutes} />}
              />

              {/* Any other/unknown path (e.g. a stale link, or "/login" reached
                  client-side rather than as a page navigation) — bounce home
                  instead of rendering a blank page. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BrandProvider>
    </QueryClientProvider>
  );
}
