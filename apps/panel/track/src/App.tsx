import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { isAuthenticated, goToLogin } from "@paapeli/brand/session";
import { BrandProvider } from "@/brand/BrandProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { AppShell } from "@/components/layout/AppShell";

import LiveMap from "@/pages/LiveMap";
import Devices from "@/pages/Devices";
import DeviceDetail from "@/pages/DeviceDetail";
import Geofences from "@/pages/Geofences";
import Playback from "@/pages/Playback";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Gate on the shared, product-agnostic session (set at the host /login).
  if (!isAuthenticated()) {
    goToLogin();
    return null;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrandProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <LanguageProvider>
          <AuthProvider>
            <WorkspaceProvider>
            <DeviceProvider>
              <Toaster richColors position="top-center" />
              <Routes>
                {/* Login is product-agnostic (host /login). */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LiveMap />} />
                  <Route path="devices" element={<Devices />} />
                  <Route path="devices/:id" element={<DeviceDetail />} />
                  <Route path="geofences" element={<Geofences />} />
                  <Route path="playback" element={<Playback />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DeviceProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </BrandProvider>
  );
}
