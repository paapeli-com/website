import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DomainRouter } from "@/components/DomainRouter";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import AuthError from "./pages/AuthError";
import AccountSettings from "./pages/AccountSettings";
import GoogleSignup from "./pages/GoogleSignup";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Status from "./pages/Status";
import RequestDemo from "./pages/RequestDemo";
import PanelNotFound from "./pages/panel/PanelNotFound";
import PanelHome from "./pages/panel/PanelHome";
import Dashboard from "./pages/panel/Dashboard";
import DashboardForm from "./pages/panel/DashboardForm";
import DashboardTemplates from "./pages/panel/DashboardTemplates";
import ManagersDashboard from "./pages/panel/ManagersDashboard";
import ExecutiveDashboard from "./pages/panel/ExecutiveDashboard";
import DashboardCanvas from "./pages/panel/DashboardCanvas";
import Devices from "./pages/panel/Devices";
import DeviceForm from "./pages/panel/DeviceForm";
import DeviceDetails from "./pages/panel/DeviceDetails";
import DeviceGroup from "./pages/panel/DeviceGroup";
import Gateways from "./pages/panel/Gateways";
import GatewayForm from "./pages/panel/GatewayForm";
import GatewayDetails from "./pages/panel/GatewayDetails";
import ConnectorForm from "./pages/panel/ConnectorForm";
import Alarms from "./pages/panel/Alarms";
import AlertRuleForm from "./pages/panel/AlertRuleForm";
import EscalationForm from "./pages/panel/EscalationForm";
import ChannelForm from "./pages/panel/ChannelForm";


import Locations from "./pages/panel/Locations";
import OTA from "./pages/panel/OTA";
import FirmwareForm from "./pages/panel/FirmwareForm";
import Members from "./pages/panel/Members";
import InviteMemberForm from "./pages/panel/InviteMemberForm";

import Activities from "./pages/panel/Activities";
import Pricing from "./pages/Pricing";
import AIoTPlatform from "./pages/products/AIoTPlatform";
import DDoSProtection from "./pages/products/DDoSProtection";
import EdgeComputing from "./pages/products/EdgeComputing";
import IntelligenceInsight from "./pages/products/IntelligenceInsight";
import OTAProduct from "./pages/products/OTA";
import SmartCities from "./pages/usecases/SmartCities";
import MakersDevelopers from "./pages/usecases/MakersDevelopers";
import OilGas from "./pages/usecases/OilGas";
import SmartAgriculture from "./pages/usecases/SmartAgriculture";
import SmartBuildings from "./pages/usecases/SmartBuildings";
import AIoTForecastFailures from "./pages/panel/AIoTForecastFailures";
import AIoTForecastDetails from "./pages/panel/AIoTForecastDetails";
import AIoTAnalyzeTrends from "./pages/panel/AIoTAnalyzeTrends";
import AIoTTrendDetails from "./pages/panel/AIoTTrendDetails";
import AIoTOpportunityDetails from "./pages/panel/AIoTOpportunityDetails";

import AIoTDetectAnomalies from "./pages/panel/AIoTDetectAnomalies";
import AIoTAnomalyDetails from "./pages/panel/AIoTAnomalyDetails";
import AIoTCoPilot from "./pages/panel/AIoTCoPilot";
import WorkOrders from "./pages/panel/WorkOrders";
import WorkOrderForm from "./pages/panel/WorkOrderForm";
import WorkOrderDetails from "./pages/panel/WorkOrderDetails";

const queryClient = new QueryClient();

/* The dashboard lives at the solution root ("/") so the URL is a clean
   /AIoT/SmartFactory. Old "/home" links redirect here (keeping any lang). */
const HomeRedirect = () => {
  const { lang } = useParams();
  return <Navigate to={lang ? `/${lang}` : "/"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <LanguageProvider>
        <AuthProvider>
          <WorkspaceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DomainRouter />
            <Routes>
              {/* Solution root shows the dashboard (clean /AIoT/SmartFactory URL). */}
              <Route path="/" element={<ProtectedRoute><PanelHome /></ProtectedRoute>} />
              <Route path="/:lang" element={<ProtectedRoute><PanelHome /></ProtectedRoute>} />
              {/* Login is product-agnostic (host /login). These just bounce to
                  the dashboard, which is gated and sends you to /login if needed. */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/:lang/login" element={<HomeRedirect />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/:lang/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/:lang/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

              <Route path="/google-signup" element={<GoogleSignup />} />
              
              {/* Public Product Pages */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/aiot-platform" element={<AIoTPlatform />} />
              <Route path="/ddos-protection" element={<DDoSProtection />} />
              <Route path="/edge-computing" element={<EdgeComputing />} />
              <Route path="/intelligence-insight" element={<IntelligenceInsight />} />
              <Route path="/ota" element={<OTAProduct />} />
              {/* Localized Public Product Pages */}
              <Route path="/:lang/pricing" element={<Pricing />} />
              <Route path="/:lang/aiot-platform" element={<AIoTPlatform />} />
              <Route path="/:lang/ddos-protection" element={<DDoSProtection />} />
              <Route path="/:lang/edge-computing" element={<EdgeComputing />} />
              <Route path="/:lang/intelligence-insight" element={<IntelligenceInsight />} />
              <Route path="/:lang/ota" element={<OTAProduct />} />
              
              {/* Use Cases Pages */}
              <Route path="/smart-cities" element={<SmartCities />} />
              <Route path="/makers-developers" element={<MakersDevelopers />} />
              <Route path="/oil-gas" element={<OilGas />} />
              <Route path="/smart-agriculture" element={<SmartAgriculture />} />
              <Route path="/smart-buildings" element={<SmartBuildings />} />
              {/* Localized Use Cases Pages */}
              <Route path="/:lang/smart-cities" element={<SmartCities />} />
              <Route path="/:lang/makers-developers" element={<MakersDevelopers />} />
              <Route path="/:lang/oil-gas" element={<OilGas />} />
              <Route path="/:lang/smart-agriculture" element={<SmartAgriculture />} />
              <Route path="/:lang/smart-buildings" element={<SmartBuildings />} />
              
              {/* Protected Panel Routes */}
              {/* "/home" kept as an alias → redirects to the clean root URL. */}
              <Route path="/home" element={<HomeRedirect />} />
              <Route path="/:lang/home" element={<HomeRedirect />} />
              <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
              <Route path="/:lang/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/:lang/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
             <Route path="/dashboard/new" element={<ProtectedRoute><DashboardForm /></ProtectedRoute>} />
             <Route path="/:lang/dashboard/new" element={<ProtectedRoute><DashboardForm /></ProtectedRoute>} />
             <Route path="/dashboard/templates" element={<ProtectedRoute><DashboardTemplates /></ProtectedRoute>} />
             <Route path="/:lang/dashboard/templates" element={<ProtectedRoute><DashboardTemplates /></ProtectedRoute>} />
             <Route path="/dashboard/ai-managers" element={<ProtectedRoute><ManagersDashboard /></ProtectedRoute>} />
             <Route path="/:lang/dashboard/ai-managers" element={<ProtectedRoute><ManagersDashboard /></ProtectedRoute>} />
             <Route path="/dashboard/ai-executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
             <Route path="/:lang/dashboard/ai-executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:id/edit" element={<ProtectedRoute><DashboardForm /></ProtectedRoute>} />
              <Route path="/:lang/dashboard/:id/edit" element={<ProtectedRoute><DashboardForm /></ProtectedRoute>} />
              <Route path="/dashboard/:id" element={<ProtectedRoute><DashboardCanvas /></ProtectedRoute>} />
              <Route path="/:lang/dashboard/:id" element={<ProtectedRoute><DashboardCanvas /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
              <Route path="/:lang/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
              <Route path="/devices/new" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
              <Route path="/:lang/devices/new" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
              <Route path="/devices/:deviceId" element={<ProtectedRoute><DeviceDetails /></ProtectedRoute>} />
              <Route path="/:lang/devices/:deviceId" element={<ProtectedRoute><DeviceDetails /></ProtectedRoute>} />
              <Route path="/devices/group" element={<ProtectedRoute><DeviceGroup /></ProtectedRoute>} />
              <Route path="/:lang/devices/group" element={<ProtectedRoute><DeviceGroup /></ProtectedRoute>} />
              <Route path="/devices/gateways" element={<ProtectedRoute><Gateways /></ProtectedRoute>} />
              <Route path="/:lang/devices/gateways" element={<ProtectedRoute><Gateways /></ProtectedRoute>} />
              <Route path="/devices/gateways/new" element={<ProtectedRoute><GatewayForm /></ProtectedRoute>} />
              <Route path="/:lang/devices/gateways/new" element={<ProtectedRoute><GatewayForm /></ProtectedRoute>} />
              <Route path="/devices/gateways/:gatewayId/connectors/new" element={<ProtectedRoute><ConnectorForm /></ProtectedRoute>} />
              <Route path="/:lang/devices/gateways/:gatewayId/connectors/new" element={<ProtectedRoute><ConnectorForm /></ProtectedRoute>} />
              <Route path="/devices/gateways/:gatewayId/connectors/:connectorId" element={<ProtectedRoute><ConnectorForm /></ProtectedRoute>} />
              <Route path="/:lang/devices/gateways/:gatewayId/connectors/:connectorId" element={<ProtectedRoute><ConnectorForm /></ProtectedRoute>} />
              <Route path="/devices/gateways/:gatewayId" element={<ProtectedRoute><GatewayDetails /></ProtectedRoute>} />
              <Route path="/:lang/devices/gateways/:gatewayId" element={<ProtectedRoute><GatewayDetails /></ProtectedRoute>} />
              <Route path="/alarms" element={<ProtectedRoute><Alarms /></ProtectedRoute>} />
              <Route path="/:lang/alarms" element={<ProtectedRoute><Alarms /></ProtectedRoute>} />
              <Route path="/alarms/rules/new" element={<ProtectedRoute><AlertRuleForm /></ProtectedRoute>} />
              <Route path="/:lang/alarms/rules/new" element={<ProtectedRoute><AlertRuleForm /></ProtectedRoute>} />
              <Route path="/alarms/escalation/new" element={<ProtectedRoute><EscalationForm /></ProtectedRoute>} />
              <Route path="/:lang/alarms/escalation/new" element={<ProtectedRoute><EscalationForm /></ProtectedRoute>} />
              <Route path="/alarms/channels/new" element={<ProtectedRoute><ChannelForm /></ProtectedRoute>} />
              <Route path="/:lang/alarms/channels/new" element={<ProtectedRoute><ChannelForm /></ProtectedRoute>} />


              <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
              <Route path="/:lang/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
              <Route path="/firmware" element={<ProtectedRoute><OTA /></ProtectedRoute>} />
              <Route path="/:lang/firmware" element={<ProtectedRoute><OTA /></ProtectedRoute>} />
              <Route path="/firmware/new" element={<ProtectedRoute><FirmwareForm /></ProtectedRoute>} />
              <Route path="/:lang/firmware/new" element={<ProtectedRoute><FirmwareForm /></ProtectedRoute>} />
              <Route path="/firmware/:id/edit" element={<ProtectedRoute><FirmwareForm /></ProtectedRoute>} />
              <Route path="/:lang/firmware/:id/edit" element={<ProtectedRoute><FirmwareForm /></ProtectedRoute>} />

              <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/:lang/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/members/invite" element={<ProtectedRoute><InviteMemberForm /></ProtectedRoute>} />
              <Route path="/:lang/members/invite" element={<ProtectedRoute><InviteMemberForm /></ProtectedRoute>} />
              
              {/* AIoT Routes */}
              <Route path="/aiot/forecast-failures" element={<ProtectedRoute><AIoTForecastFailures /></ProtectedRoute>} />
              <Route path="/:lang/aiot/forecast-failures" element={<ProtectedRoute><AIoTForecastFailures /></ProtectedRoute>} />
              <Route path="/aiot/forecast-failures/:id" element={<ProtectedRoute><AIoTForecastDetails /></ProtectedRoute>} />
              <Route path="/:lang/aiot/forecast-failures/:id" element={<ProtectedRoute><AIoTForecastDetails /></ProtectedRoute>} />
              <Route path="/aiot/analyze-trends" element={<ProtectedRoute><AIoTAnalyzeTrends /></ProtectedRoute>} />
              <Route path="/:lang/aiot/analyze-trends" element={<ProtectedRoute><AIoTAnalyzeTrends /></ProtectedRoute>} />
              <Route path="/aiot/analyze-trends/opportunities/:id" element={<ProtectedRoute><AIoTOpportunityDetails /></ProtectedRoute>} />
              <Route path="/:lang/aiot/analyze-trends/opportunities/:id" element={<ProtectedRoute><AIoTOpportunityDetails /></ProtectedRoute>} />
              <Route path="/aiot/analyze-trends/:id" element={<ProtectedRoute><AIoTTrendDetails /></ProtectedRoute>} />
              <Route path="/:lang/aiot/analyze-trends/:id" element={<ProtectedRoute><AIoTTrendDetails /></ProtectedRoute>} />
              <Route path="/aiot/detect-anomalies" element={<ProtectedRoute><AIoTDetectAnomalies /></ProtectedRoute>} />
              <Route path="/:lang/aiot/detect-anomalies" element={<ProtectedRoute><AIoTDetectAnomalies /></ProtectedRoute>} />
              <Route path="/aiot/detect-anomalies/:id" element={<ProtectedRoute><AIoTAnomalyDetails /></ProtectedRoute>} />
              <Route path="/:lang/aiot/detect-anomalies/:id" element={<ProtectedRoute><AIoTAnomalyDetails /></ProtectedRoute>} />
              <Route path="/aiot/co-pilot" element={<ProtectedRoute><AIoTCoPilot /></ProtectedRoute>} />
              <Route path="/:lang/aiot/co-pilot" element={<ProtectedRoute><AIoTCoPilot /></ProtectedRoute>} />

              {/* Operations · Work Orders */}
              <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
              <Route path="/:lang/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
              <Route path="/work-orders/new" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
              <Route path="/:lang/work-orders/new" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
              <Route path="/work-orders/:id" element={<ProtectedRoute><WorkOrderDetails /></ProtectedRoute>} />
              <Route path="/:lang/work-orders/:id" element={<ProtectedRoute><WorkOrderDetails /></ProtectedRoute>} />
              <Route path="/work-orders/:id/edit" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
              <Route path="/:lang/work-orders/:id/edit" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
              
              {/* New Public Pages */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/:lang/contact" element={<Contact />} />
              <Route path="/status" element={<Status />} />
              <Route path="/:lang/status" element={<Status />} />
              <Route path="/request-demo" element={<RequestDemo />} />
              <Route path="/:lang/request-demo" element={<RequestDemo />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
