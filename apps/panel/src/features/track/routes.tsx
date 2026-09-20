import { Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import LiveMap from "./pages/LiveMap";
import Devices from "./pages/Devices";
import DeviceForm from "./pages/DeviceForm";
import DeviceDetail from "./pages/DeviceDetail";
import Geofences from "./pages/Geofences";
import Playback from "./pages/Playback";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import "./track.css";

/* GPS Tracking, mounted at /AIoT/GPSTracking/*.

   This module is the feature's lazy chunk boundary (see src/app/features.ts).
   Auth, the brand provider, the API client and the toaster are owned by the
   app shell now — when this was a Module Federation remote it had to set up
   its own copy of each, because it was a separate bundle. */
export default function TrackRoutes() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* Login is product-agnostic (the panel's /login). Targets here
              are ROUTE-RELATIVE on purpose: an absolute "/" would resolve
              against the whole app root (→ redirects to Smart Factory),
              not this feature's mount. ".." / "." resolve to
              /AIoT/GPSTracking. */}
          <Route path="/login" element={<Navigate to=".." replace />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<LiveMap />} />
            <Route path="devices" element={<Devices />} />
            {/* Before ":id" so "new" is not read as a device id. */}
            <Route path="devices/new" element={<DeviceForm />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="geofences" element={<Geofences />} />
            <Route path="playback" element={<Playback />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
