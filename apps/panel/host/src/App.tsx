import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { solutionPath } from "@paapeli/brand/config";
import { BrandProvider } from "@/brand/BrandProvider";
import { Layout } from "@/components/layout/Layout";
import { RemoteBoundary } from "@/components/RemoteBoundary";
import { RequireAuth } from "@/components/RequireAuth";

const FactoryApp = lazy(() => import("factory/FactoryApp"));
const TrackApp = lazy(() => import("track/TrackApp"));

const RemoteFallback = () => (
  <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Loading…</div>
);

export default function App() {
  return (
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
                <RemoteBoundary name="Smart Factory">
                  <Suspense fallback={<RemoteFallback />}>
                    <FactoryApp />
                  </Suspense>
                </RemoteBoundary>
              }
            />
            <Route
              path="AIoT/GPSTracking/*"
              element={
                <RemoteBoundary name="GPS Tracking">
                  <Suspense fallback={<RemoteFallback />}>
                    <TrackApp />
                  </Suspense>
                </RemoteBoundary>
              }
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
  );
}
