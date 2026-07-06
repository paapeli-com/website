import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { BrandProvider } from "@/brand/BrandProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { AppShell } from "@/components/layout/AppShell";

import Login from "@/pages/Login";
import LiveMap from "@/pages/LiveMap";
import Devices from "@/pages/Devices";
import DeviceDetail from "@/pages/DeviceDetail";
import Geofences from "@/pages/Geofences";
import Playback from "@/pages/Playback";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrandProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <DeviceProvider>
              <Toaster richColors position="top-center" />
              <Routes>
                <Route path="/login" element={<Login />} />
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
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </BrandProvider>
  );
}
