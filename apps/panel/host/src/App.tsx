import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { setApiAuthToken, setApiBaseUrl } from "@paapeli/api";
import { getToken } from "@paapeli/brand/session";
import { solutionPath, productKeyFor } from "@paapeli/brand/config";
import { BrandProvider } from "@/brand/BrandProvider";
import { Layout } from "@/components/layout/Layout";
import { RemoteMount } from "@/components/RemoteMount";
import { RequireAuth } from "@/components/RequireAuth";
import { PAAPELI_API_BASE_URL } from "@/config";

const queryClient = new QueryClient();

// Login is a real page navigation (not client-side routing), so by the time
// this module evaluates, the shared session — if any — is already in
// localStorage; a one-shot read here is enough to carry the bearer token on
// every request the host itself makes (e.g. the account menu's workspace
// list). Each federated remote configures its own bundled copy of
// @paapeli/api the same way — see their RemoteApp.tsx.
setApiBaseUrl(PAAPELI_API_BASE_URL);
setApiAuthToken(getToken());

/* Loaders live at module scope so RemoteMount's lazy() is only recreated on
   an explicit retry — see components/RemoteMount.tsx and lib/remote.ts. */
const loadFactory = () => import("factory/FactoryApp");
const loadTrack = () => import("track/TrackApp");
const loadCloudManagement = () => import("cloudManagement/CloudManagementApp");

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
              <Route
                path="AIoT/SmartFactory/*"
                element={
                  <RemoteMount
                    id="factory"
                    name="Smart Factory"
                    productKey={productKeyFor("SmartFactory")}
                    load={loadFactory}
                  />
                }
              />
              <Route
                path="AIoT/GPSTracking/*"
                element={
                  <RemoteMount
                    id="track"
                    name="GPS Tracking"
                    productKey={productKeyFor("GPSTracking")}
                    load={loadTrack}
                  />
                }
              />
              {/* Independent of any AIoT product/solution — workspace/account
                  administration, reached from a product's sidebar footer. */}
              <Route
                path="CloudManagement/*"
                element={<RemoteMount id="cloudManagement" name="Cloud Management" load={loadCloudManagement} />}
              />
              {/* Any other/unknown path under the host (e.g. a stale link, or
                  "/login" reached client-side when running the host standalone
                  without the panel dev-server's routing) — bounce home instead
                  of rendering a blank page. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BrandProvider>
    </QueryClientProvider>
  );
}
