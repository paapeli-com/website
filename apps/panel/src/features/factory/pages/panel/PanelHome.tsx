import { useMemo } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card } from "@/features/factory/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Box,
  MapPin,
  Bell,
  ClipboardList,
  Lightbulb,
  FileText,
  LayoutGrid,
  Sparkles,
  Upload,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Plus,
  Wrench as Operations,
} from "lucide-react";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useDashboards } from "@/features/factory/hooks/useDashboards";
import { useWorkOrders } from "@/features/factory/hooks/useWorkOrders";
import { useForecastStore } from "@/features/factory/hooks/useForecastStore";
import { useAnomalyStore } from "@/features/factory/hooks/useAnomalyStore";
import { useOpportunityStore } from "@/features/factory/hooks/useOpportunityStore";
import { mockAlerts } from "@/features/factory/data/mockAlertData";
import { mockRollouts, mockOtaDevices } from "@/features/factory/data/mockOtaData";
import { FORECAST_ASSETS } from "@/features/factory/data/forecastAssets";
import { TRENDS, OPPORTUNITIES } from "@/features/factory/data/trends";

type Lang = "en" | "ar" | "fa";

const D: Record<string, Record<Lang, string>> = {
  overview: { en: "Overview", ar: "نظرة عامة", fa: "نمای کلی" },
  assets: { en: "Assets", ar: "الأصول", fa: "تجهیزات" },
  totalAssets: { en: "Total assets", ar: "إجمالي الأصول", fa: "کل تجهیزات" },
  locations: { en: "Locations", ar: "المواقع", fa: "مکان‌ها" },
  totalLocations: { en: "Total locations", ar: "إجمالي المواقع", fa: "کل مکان‌ها" },
  activeAlarms: { en: "Active Alarms", ar: "إنذارات نشطة", fa: "هشدارهای فعال" },
  workOrders: { en: "Work Orders", ar: "أوامر العمل", fa: "دستورکارها" },
  pendingOrders: { en: "Pending orders", ar: "أوامر معلقة", fa: "دستورکارهای در انتظار" },
  aiFindings: { en: "AI Findings", ar: "نتائج الذكاء الاصطناعي", fa: "یافته‌های هوش مصنوعی" },
  openFindings: { en: "Open findings", ar: "نتائج مفتوحة", fa: "یافته‌های باز" },

  quickAccess: { en: "Quick Access", ar: "الوصول السريع", fa: "دسترسی سریع" },
  devices: { en: "Devices", ar: "الأجهزة", fa: "دستگاه‌ها" },
  alarms: { en: "Alarms", ar: "الإنذارات", fa: "هشدارها" },
  dashboards: { en: "Dashboards", ar: "لوحات", fa: "داشبوردها" },
  aiAnalytics: { en: "AI Analytics", ar: "تحليلات الذكاء", fa: "تحلیل هوش مصنوعی" },
  ota: { en: "OTA", ar: "OTA", fa: "OTA" },
  operations: { en: "Operations", ar: "العمليات", fa: "عملیات" },
  campaigns: { en: "Campaigns", ar: "حملات", fa: "کمپین" },
  findings: { en: "Findings", ar: "نتائج", fa: "یافته" },
  active: { en: "Active", ar: "نشط", fa: "فعال" },

  systemHealth: { en: "System Health", ar: "صحة النظام", fa: "سلامت سیستم" },
  online: { en: "Online", ar: "متصل", fa: "آنلاین" },
  mqttBroker: { en: "MQTT Broker", ar: "وسيط MQTT", fa: "بروکر MQTT" },
  ruleEngine: { en: "Rule Engine", ar: "محرك القواعد", fa: "موتور قوانین" },
  aiEngine: { en: "AI Engine", ar: "محرك الذكاء", fa: "موتور هوش مصنوعی" },
  database: { en: "Database", ar: "قاعدة البيانات", fa: "پایگاه داده" },
  storage: { en: "Storage", ar: "التخزين", fa: "ذخیره‌سازی" },

  thingsNeedAttention: { en: "Things Need Attention", ar: "أمور تحتاج اهتمامًا", fa: "موارد نیازمند توجه" },
  recentActivity: { en: "Recent Activity", ar: "النشاط الأخير", fa: "فعالیت اخیر" },
  viewAll: { en: "View all", ar: "عرض الكل", fa: "مشاهده همه" },
  viewAllActivity: { en: "View all activity", ar: "عرض كل النشاط", fa: "مشاهده همه فعالیت‌ها" },

  criticalAlarm: { en: "Critical Alarm", ar: "إنذار حرج", fa: "هشدار بحرانی" },
  aiFinding: { en: "AI Finding", ar: "نتيجة الذكاء الاصطناعي", fa: "یافته هوش مصنوعی" },
  workOrderPending: { en: "Work Order Pending", ar: "أمر عمل معلق", fa: "دستورکار در انتظار" },
  failedOta: { en: "Failed OTA Update", ar: "فشل تحديث OTA", fa: "به‌روزرسانی OTA ناموفق" },
  maintenanceOverdue: { en: "Maintenance Overdue", ar: "صيانة متأخرة", fa: "نگهداری معوقه" },
  pendingApproval: { en: "Pending Approval", ar: "بانتظار الموافقة", fa: "در انتظار تأیید" },
  failurePredicted: { en: "Failure predicted in 3 days", ar: "خلل متوقع خلال 3 أيام", fa: "خرابی پیش‌بینی‌شده تا ۳ روز" },
  updateFailed: { en: "Update Failed", ar: "فشل التحديث", fa: "به‌روزرسانی ناموفق" },
  maintenanceOverdueDesc: { en: "Maintenance is overdue", ar: "الصيانة متأخرة", fa: "نگهداری معوق است" },

  newAlarmTriggered: { en: "New alarm triggered", ar: "تم تشغيل إنذار جديد", fa: "هشدار جدید فعال شد" },
  aiRecommendation: { en: "AI recommendation generated", ar: "تم إنشاء توصية ذكية", fa: "توصیه هوش مصنوعی صادر شد" },
  workOrderCreated: { en: "Work order created", ar: "تم إنشاء أمر عمل", fa: "دستورکار ایجاد شد" },
  newDeviceAdded: { en: "New device added", ar: "تمت إضافة جهاز جديد", fa: "دستگاه جدید اضافه شد" },
  otaCompleted: { en: "OTA update completed", ar: "اكتمل تحديث OTA", fa: "به‌روزرسانی OTA کامل شد" },

  minAgo: { en: "min ago", ar: "دقيقة مضت", fa: "دقیقه پیش" },
  hourAgo: { en: "hour ago", ar: "ساعة مضت", fa: "ساعت پیش" },
  hoursAgo: { en: "hours ago", ar: "ساعات مضت", fa: "ساعت پیش" },
};

// Walk locations tree from localStorage and count location-typed nodes.
function countLocations(): number {
  try {
    const raw = localStorage.getItem("paapeli-locations-tree-v1");
    if (!raw) return 0;
    const root = JSON.parse(raw);
    let n = 0;
    const walk = (node: any) => {
      if (!node) return;
      if (node.type === "location") n++;
      (node.children || []).forEach(walk);
    };
    walk(root);
    return n;
  } catch {
    return 0;
  }
}

export default function PanelHome() {
  const { language, formatNumber, isRTL } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const tr = (k: keyof typeof D) => D[k][language as Lang];
  const fn = (n: number) => formatNumber(n);

  const { items: devices } = useDevices();
  const { items: dashboards } = useDashboards();
  const { items: workOrders } = useWorkOrders();
  const { statuses: forecastStatuses } = useForecastStore();
  const { workOrders: anomalyWO } = useAnomalyStore() as any;
  const { statuses: oppStatuses } = useOpportunityStore();

  // --- Counts from sources of truth ---
  const assetCount = devices.length;
  const locationCount = useMemo(countLocations, [devices.length]); // recompute occasionally
  const activeAlarmCount = mockAlerts.filter(
    (a) => a.status === "active" || a.status === "escalated",
  ).length;
  const openWorkOrders = workOrders.filter(
    (w) => w.status === "Open" || w.status === "In Progress",
  ).length;

  // AI findings: Forecast (Open) + Anomalies (Open default) + Opportunities (New default)
  const openForecasts = FORECAST_ASSETS.filter(
    (f) => (forecastStatuses[f.devId] || "Open") === "Open",
  ).length;
  const openAnomalies = 4; // BASE anomalies excluding resolved (static mock baseline)
  const openOpportunities = OPPORTUNITIES.filter(
    (o) => (oppStatuses[o.id] || "New") === "New",
  ).length;
  const aiFindings = openForecasts + openAnomalies + openOpportunities;

  const dashboardCount = dashboards.length;
  const otaCampaigns = mockRollouts.filter(
    (r) => r.status === "in_progress" || r.status === "paused",
  ).length;
  const failedOtaDevice = mockOtaDevices.find((d) => d.status === "failed");

  // --- Reference IDs for deep links ---
  const firstForecast = FORECAST_ASSETS[0];
  const firstTrend = TRENDS[0];
  const firstAnomalyId = "anom-001";
  const firstWorkOrder = workOrders[0] || anomalyWO?.[0];
  const firstDevice = devices[0];
  const firstFailedRollout = mockRollouts.find((r) => r.status === "rolled_back" || r.status === "paused");
  const firstCompletedRollout = mockRollouts.find((r) => r.status === "completed");

  // Summary cards — key system counts only
  const summary = [
    { key: "assets", icon: Box, value: assetCount, label: tr("assets"), sub: tr("totalAssets"), color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", to: "/devices" },
    { key: "locations", icon: MapPin, value: locationCount, label: tr("locations"), sub: tr("totalLocations"), color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", to: "/locations" },
    { key: "alarms", icon: Bell, value: activeAlarmCount, label: tr("activeAlarms"), sub: tr("activeAlarms"), color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", to: "/alarms" },
    { key: "workOrders", icon: ClipboardList, value: openWorkOrders, label: tr("workOrders"), sub: tr("pendingOrders"), color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30", to: "/work-orders" },
    { key: "ai", icon: Lightbulb, value: aiFindings, label: tr("aiFindings"), sub: tr("openFindings"), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", to: "/aiot/forecast-failures" },
  ];

  // Quick Access — navigation shortcuts only (Devices, Dashboards, Alarms, AI Analytics, OTA, Operations)
  const quick = [
    { icon: FileText, label: tr("devices"), sub: `${fn(assetCount)} ${tr("assets")}`, to: "/devices", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
    { icon: LayoutGrid, label: tr("dashboards"), sub: `${fn(dashboardCount)} ${tr("dashboards")}`, to: "/dashboard", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { icon: Bell, label: tr("alarms"), sub: `${fn(activeAlarmCount)} ${tr("active")}`, to: "/alarms", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { icon: Sparkles, label: tr("aiAnalytics"), sub: `${fn(aiFindings)} ${tr("findings")}`, to: "/aiot/analyze-trends", color: "text-fuchsia-600", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30" },
    { icon: Upload, label: tr("ota"), sub: `${fn(otaCampaigns)} ${tr("campaigns")}`, to: "/firmware", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { icon: Operations, label: tr("operations"), sub: `${fn(openWorkOrders)} ${tr("workOrders")}`, to: "/work-orders", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
  ];

  const health = [
    { label: tr("mqttBroker") }, { label: tr("ruleEngine") }, { label: tr("aiEngine") },
    { label: tr("database") }, { label: tr("storage") },
  ];

  // TODO: link Critical Alarm to /alarms/:id once an alarm detail route exists.
  const attention = [
    {
      icon: Bell, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30",
      title: tr("criticalAlarm"), sub: "Boiler Pump BP-2",
      time: `${fn(2)} ${tr("minAgo")}`, to: "/alarms",
    },
    {
      icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30",
      title: tr("aiFinding"),
      sub: `${firstForecast.id} — ${tr("failurePredicted")}`,
      time: `${fn(15)} ${tr("minAgo")}`,
      to: `/aiot/forecast-failures/${firstForecast.devId}`,
    },
    {
      icon: ClipboardList, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30",
      title: tr("workOrderPending"),
      sub: `${firstWorkOrder?.asset || "Compressor C3"} — ${tr("pendingApproval")}`,
      time: `${fn(1)} ${tr("hourAgo")}`,
      to: firstWorkOrder ? `/work-orders/${firstWorkOrder.id}` : "/work-orders",
    },
    {
      icon: Upload, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30",
      title: tr("failedOta"),
      sub: `${failedOtaDevice?.name || "Gateway-03"} — ${tr("updateFailed")}`,
      // TODO: deep-link to OTA device/rollout detail when route exists.
      to: "/firmware",
    },
    {
      icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30",
      title: tr("maintenanceOverdue"),
      sub: `Motor M12 — ${tr("maintenanceOverdueDesc")}`,
      to: firstWorkOrder ? `/work-orders/${firstWorkOrder.id}` : "/work-orders",
    },
  ];

  const activity = [
    {
      icon: Bell, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30",
      title: tr("newAlarmTriggered"), sub: "Compressor C3",
      time: `${fn(2)} ${tr("minAgo")}`,
      // TODO: deep-link to alarm detail when route exists.
      to: "/alarms",
    },
    {
      icon: Lightbulb, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30",
      title: tr("aiRecommendation"),
      sub: firstTrend.asset,
      time: `${fn(15)} ${tr("minAgo")}`,
      to: `/aiot/analyze-trends/${firstTrend.id}`,
    },
    {
      icon: Wrench, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30",
      title: tr("workOrderCreated"),
      sub: firstWorkOrder?.asset || "Motor M12",
      time: `${fn(1)} ${tr("hourAgo")}`,
      to: firstWorkOrder ? `/work-orders/${firstWorkOrder.id}` : "/work-orders",
    },
    {
      icon: Plus, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30",
      title: tr("newDeviceAdded"),
      sub: firstDevice?.name || "Pressure Sensor P-9",
      time: `${fn(3)} ${tr("hoursAgo")}`,
      to: firstDevice ? `/devices/${firstDevice.deviceId}` : "/devices",
    },
    {
      icon: Upload, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30",
      title: tr("otaCompleted"),
      sub: firstCompletedRollout?.name || "Gateway-01",
      time: `${fn(5)} ${tr("hoursAgo")}`,
      // TODO: deep-link to OTA rollout detail when route exists.
      to: "/firmware",
    },
  ];

  // Anomaly attention example uses the canonical first anomaly id.
  // Keep the anomaly link reachable via the AI Analytics CTA.
  void firstAnomalyId;
  void firstFailedRollout;

  const Chevron = () => <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 ${isRTL ? "rotate-180" : ""}`} />;

  return (
    <>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-xl font-bold text-foreground text-start">{tr("overview")}</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {summary.map((s) => (
            <Card
              key={s.key}
              onClick={() => navigate(lp(s.to))}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow text-start"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{fn(s.value)}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* Quick Access + System Health */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-foreground mb-4 text-start">{tr("quickAccess")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quick.map((q) => (
                <button
                  key={q.label}
                  onClick={() => navigate(lp(q.to))}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-start"
                >
                  <div className={`w-9 h-9 rounded-md ${q.bg} ${q.color} flex items-center justify-center shrink-0`}>
                    <q.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{q.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{q.sub}</div>
                  </div>
                  <Chevron />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 text-start">{tr("systemHealth")}</h2>
            <div className="space-y-3">
              {health.map((h) => (
                <div key={h.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground truncate">{h.label}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600">{tr("online")}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Attention + Activity */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 text-start">{tr("thingsNeedAttention")}</h2>
            <div className="divide-y divide-border">
              {attention.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(lp(a.to))}
                  className="w-full flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors text-start"
                >
                  <div className={`w-8 h-8 rounded-md ${a.bg} ${a.color} flex items-center justify-center shrink-0`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.sub}</div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                  <Chevron />
                </button>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button onClick={() => navigate(lp("/alarms"))} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                {tr("viewAll")} <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 text-start">{tr("recentActivity")}</h2>
            <div className="divide-y divide-border">
              {activity.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(lp(a.to))}
                  className="w-full flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors text-start"
                >
                  <div className={`w-8 h-8 rounded-md ${a.bg} ${a.color} flex items-center justify-center shrink-0`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.sub}</div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                  <Chevron />
                </button>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button onClick={() => navigate(lp("/activities"))} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                {tr("viewAllActivity")} <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
