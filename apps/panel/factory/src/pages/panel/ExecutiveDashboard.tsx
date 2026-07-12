import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  BellRing,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  MapPin,
  FileText,
  LayoutGrid,
  Bell,
  Sparkles,
  Wrench,
  HardDrive,
  Brain,
  LineChart,
  Bot,
  Lightbulb,
} from "lucide-react";
import { OPPORTUNITIES } from "@/data/trends";


type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  overview: { en: "AI Executive Dashboard", ar: "لوحة الذكاء الاصطناعي التنفيذية", fa: "داشبورد مدیریتی هوش مصنوعی" },
  builtInBadge: { en: "Built-in Dashboard", ar: "لوحة مدمجة", fa: "داشبورد داخلی" },
  plantHealth: { en: "Plant Health", ar: "صحة المصنع", fa: "سلامت کارخانه" },
  criticalAlarms: { en: "Critical Alarms", ar: "إنذارات حرجة", fa: "هشدارهای بحرانی" },
  assetsAtRisk: { en: "Assets At Risk", ar: "الأصول في خطر", fa: "تجهیزات در معرض خطر" },
  systemAvailability: { en: "System Availability", ar: "توفر النظام", fa: "در دسترس بودن سیستم" },
  openWorkOrders: { en: "Open Work Orders", ar: "أوامر العمل المفتوحة", fa: "دستورکارهای باز" },
  vsYesterday: { en: "vs yesterday", ar: "مقابل أمس", fa: "نسبت به دیروز" },

  aiFeatures: { en: "AI Features", ar: "ميزات الذكاء الاصطناعي", fa: "ویژگی‌های هوش مصنوعی" },
  aiFeaturesDesc: { en: "Explore AI-powered tools that keep your operations one step ahead", ar: "استكشف أدوات الذكاء الاصطناعي التي تبقي عملياتك متقدمة بخطوة", fa: "ابزارهای مبتنی بر هوش مصنوعی که عملیات شما را یک گام جلوتر نگه می‌دارند" },
  forecastFailures: { en: "Forecast Equipment Failures", ar: "توقع أعطال المعدات", fa: "پیش‌بینی خرابی تجهیزات" },
  forecastFailuresDesc: { en: "Predict failures before they happen", ar: "توقع الأعطال قبل حدوثها", fa: "خرابی‌ها را پیش از وقوع پیش‌بینی کنید" },
  detectAnomalies: { en: "Detect Anomalies", ar: "اكتشاف الشذوذ", fa: "تشخیص ناهنجاری‌ها" },
  detectAnomaliesDesc: { en: "Spot abnormal behavior in real time", ar: "اكتشف السلوك غير الطبيعي في الوقت الفعلي", fa: "رفتار غیرعادی را در لحظه شناسایی کنید" },
  analyzeTrends: { en: "Analyze Trends", ar: "تحليل الاتجاهات", fa: "تحلیل روندها" },
  analyzeTrendsDesc: { en: "Find optimization opportunities", ar: "اعثر على فرص التحسين", fa: "فرصت‌های بهینه‌سازی را پیدا کنید" },
  intelligentRecommendations: { en: "Intelligent Recommendations", ar: "توصيات ذكية", fa: "توصیه‌های هوشمند" },
  recommendationsDesc: { en: "AI-curated next actions", ar: "إجراءات تالية مقترحة من الذكاء الاصطناعي", fa: "اقدام‌های بعدی پیشنهادی هوش مصنوعی" },
  coPilot: { en: "AIoT Co-Pilot", ar: "مساعد AIoT", fa: "همیار AIoT" },
  coPilotDesc: { en: "Chat with your operations", ar: "تحدث مع عملياتك", fa: "با عملیات خود گفت‌وگو کنید" },
  open: { en: "Open", ar: "فتح", fa: "باز کردن" },

  aiInsightsSummary: { en: "AI Insights Summary", ar: "ملخص رؤى الذكاء الاصطناعي", fa: "خلاصه بینش‌های هوش مصنوعی" },
  aiInsightsSummaryDesc: { en: "Top AI findings that require your attention", ar: "أهم نتائج الذكاء الاصطناعي التي تتطلب انتباهك", fa: "مهم‌ترین یافته‌های هوش مصنوعی که نیاز به توجه شما دارند" },
  viewAllAiInsights: { en: "View all AI insights", ar: "عرض جميع رؤى الذكاء الاصطناعي", fa: "مشاهده همه بینش‌های هوش مصنوعی" },
  highRisk: { en: "High Risk", ar: "خطر مرتفع", fa: "ریسک بالا" },
  mediumRisk: { en: "Medium Risk", ar: "خطر متوسط", fa: "ریسک متوسط" },
  confidence: { en: "Confidence", ar: "ثقة", fa: "اطمینان" },
  predictsWithin: { en: "AI predicts failure within", ar: "يتوقع الذكاء الاصطناعي العطل خلال", fa: "هوش مصنوعی خرابی را در" },
  days: { en: "days", ar: "أيام", fa: "روز پیش‌بینی می‌کند" },
  rootCause: { en: "Root Cause", ar: "السبب الجذري", fa: "علت ریشه‌ای" },
  impact: { en: "Impact", ar: "التأثير", fa: "تأثیر" },
  viewAiAnalysis: { en: "View AI Analysis", ar: "عرض تحليل الذكاء الاصطناعي", fa: "مشاهده تحلیل هوش مصنوعی" },

  bearingWear: { en: "Bearing wear detected", ar: "اكتشاف تآكل المحمل", fa: "ساییدگی بلبرینگ شناسایی شد" },
  productionStop: { en: "Production stop (~6h)", ar: "توقف الإنتاج (~6 ساعات)", fa: "توقف تولید (~۶ ساعت)" },
  vibrationAnomaly: { en: "Vibration pattern anomaly", ar: "شذوذ في نمط الاهتزاز", fa: "ناهنجاری در الگوی ارتعاش" },
  efficiencyLoss: { en: "Efficiency loss (~12%)", ar: "خسارة كفاءة (~12%)", fa: "افت بازده (~۱۲٪)" },
  suctionPressure: { en: "Suction pressure fluctuation", ar: "تذبذب ضغط الشفط", fa: "نوسان فشار مکش" },
  highEnergy: { en: "High energy consumption", ar: "استهلاك طاقة مرتفع", fa: "مصرف انرژی بالا" },

  assetHealthDistribution: { en: "Asset Health Distribution", ar: "توزيع صحة الأصول", fa: "توزیع سلامت تجهیزات" },
  healthy: { en: "Healthy", ar: "سليم", fa: "سالم" },
  warning: { en: "Warning", ar: "تحذير", fa: "هشدار" },
  critical: { en: "Critical", ar: "حرج", fa: "بحرانی" },
  unknown: { en: "Unknown", ar: "غير معروف", fa: "نامشخص" },
  viewFullReport: { en: "View full report", ar: "عرض التقرير الكامل", fa: "مشاهده گزارش کامل" },
  viewAllDevices: { en: "View all devices", ar: "عرض جميع الأجهزة", fa: "مشاهده همه دستگاه‌ها" },
  viewAllOpportunities: { en: "View all opportunities", ar: "عرض جميع الفرص", fa: "مشاهده همه فرصت‌ها" },
  potentialSaving: { en: "Potential Saving", ar: "توفير محتمل", fa: "صرفه‌جویی احتمالی" },

  failureForecast: { en: "Failure Forecast", ar: "توقع الأعطال", fa: "پیش‌بینی خرابی" },
  upcomingFailures: { en: "Upcoming potential failures", ar: "أعطال محتملة قادمة", fa: "خرابی‌های احتمالی پیش‌رو" },
  next7Days: { en: "Next 7 Days", ar: "الـ7 أيام القادمة", fa: "۷ روز آینده" },
  next30Days: { en: "Next 30 Days", ar: "الـ30 يومًا القادمة", fa: "۳۰ روز آینده" },
  next90Days: { en: "Next 90 Days", ar: "الـ90 يومًا القادمة", fa: "۹۰ روز آینده" },
  assets: { en: "Assets", ar: "أصول", fa: "تجهیز" },
  viewForecast: { en: "View forecast", ar: "عرض التوقعات", fa: "مشاهده پیش‌بینی" },

  aiRecommendations: { en: "AI Recommendations", ar: "توصيات الذكاء الاصطناعي", fa: "توصیه‌های هوش مصنوعی" },
  aiRecommendationsDesc: { en: "Top recommendations generated by AI", ar: "أهم التوصيات التي يولدها الذكاء الاصطناعي", fa: "برترین توصیه‌های تولیدشده توسط هوش مصنوعی" },
  inspectBearing: { en: "Inspect bearing and replace if necessary", ar: "افحص المحمل واستبدله إذا لزم الأمر", fa: "بلبرینگ را بررسی کرده و در صورت لزوم تعویض کنید" },
  checkCavitation: { en: "Check for cavitation and clean strainer", ar: "تحقق من التجويف ونظف المصفاة", fa: "وقوع کاویتاسیون را بررسی و صافی را تمیز کنید" },
  riskReduction: { en: "Risk reduction", ar: "تقليل المخاطر", fa: "کاهش ریسک" },
  high: { en: "High", ar: "مرتفع", fa: "بالا" },
  viewAllRecommendations: { en: "View all recommendations", ar: "عرض جميع التوصيات", fa: "مشاهده همه توصیه‌ها" },

  recentActivity: { en: "Recent Activity", ar: "النشاط الأخير", fa: "فعالیت‌های اخیر" },
  newAlarm: { en: "New alarm generated", ar: "تم إنشاء إنذار جديد", fa: "هشدار جدید ایجاد شد" },
  aiRecCreated: { en: "AI recommendation created", ar: "تم إنشاء توصية ذكاء اصطناعي", fa: "توصیه هوش مصنوعی ایجاد شد" },
  workOrderCompleted: { en: "Work order completed", ar: "تم إكمال أمر العمل", fa: "دستورکار تکمیل شد" },
  newDeviceAdded: { en: "New device added", ar: "تم إضافة جهاز جديد", fa: "دستگاه جدید اضافه شد" },
  minAgo: { en: "min ago", ar: "دقيقة مضت", fa: "دقیقه پیش" },
  hourAgo: { en: "hour ago", ar: "ساعة مضت", fa: "ساعت پیش" },
  hoursAgo: { en: "hours ago", ar: "ساعات مضت", fa: "ساعت پیش" },
  viewAllActivity: { en: "View all activity", ar: "عرض كل النشاط", fa: "مشاهده همه فعالیت‌ها" },

  systemStatus: { en: "System Status", ar: "حالة النظام", fa: "وضعیت سیستم" },
  online: { en: "Online", ar: "متصل", fa: "آنلاین" },
  mqttBroker: { en: "MQTT Broker", ar: "وسيط MQTT", fa: "بروکر MQTT" },
  ruleEngine: { en: "Rule Engine", ar: "محرك القواعد", fa: "موتور قواعد" },
  aiEngine: { en: "AI Engine", ar: "محرك الذكاء الاصطناعي", fa: "موتور هوش مصنوعی" },
  database: { en: "Database", ar: "قاعدة البيانات", fa: "پایگاه داده" },
  storage: { en: "Storage", ar: "التخزين", fa: "ذخیره‌سازی" },

  aiServices: { en: "AI Services", ar: "خدمات الذكاء الاصطناعي", fa: "سرویس‌های هوش مصنوعی" },
  failurePredictionModel: { en: "Failure Prediction Model", ar: "نموذج توقع الأعطال", fa: "مدل پیش‌بینی خرابی" },
  anomalyDetection: { en: "Anomaly Detection", ar: "اكتشاف الشذوذ", fa: "تشخیص ناهنجاری" },
  rulPredictionModel: { en: "RUL Prediction Model", ar: "نموذج توقع العمر المتبقي", fa: "مدل پیش‌بینی عمر باقیمانده" },
  classificationModel: { en: "Classification Model", ar: "نموذج التصنيف", fa: "مدل طبقه‌بندی" },
  active: { en: "Active", ar: "نشط", fa: "فعال" },

  quickActions: { en: "Quick Actions", ar: "إجراءات سريعة", fa: "اقدامات سریع" },
  addDevice: { en: "Add Device", ar: "إضافة جهاز", fa: "افزودن دستگاه" },
  addLocation: { en: "Add Location", ar: "إضافة موقع", fa: "افزودن مکان" },
  createRule: { en: "Create Rule", ar: "إنشاء قاعدة", fa: "ایجاد قاعده" },
  createDashboard: { en: "Create Dashboard", ar: "إنشاء لوحة", fa: "ایجاد داشبورد" },

  opsMetrics: { en: "Operational Metrics", ar: "مقاييس التشغيل", fa: "شاخص‌های عملیاتی" },
  devicesOnline: { en: "Devices Online", ar: "الأجهزة المتصلة", fa: "دستگاه‌های آنلاین" },
  dataIngest: { en: "Data Ingest", ar: "تدفق البيانات", fa: "نرخ ورود داده" },
  msgPerSec: { en: "msg/s", ar: "رسالة/ث", fa: "پیام/ث" },
  mttr: { en: "MTTR", ar: "متوسط زمن الإصلاح", fa: "میانگین زمان تعمیر" },
  hrs: { en: "hrs", ar: "ساعة", fa: "ساعت" },
  oee: { en: "OEE", ar: "الكفاءة الكلية", fa: "بهره‌وری کلی" },
  energyToday: { en: "Energy Today", ar: "طاقة اليوم", fa: "انرژی امروز" },
  kwh: { en: "kWh", ar: "ك.و.س", fa: "ک.و.س" },
  uptime30d: { en: "Uptime (30d)", ar: "وقت التشغيل (30 يوم)", fa: "آپ‌تایم (۳۰ روز)" },
  aiTools: { en: "AI Tools", ar: "أدوات الذكاء الاصطناعي", fa: "ابزارهای هوش مصنوعی" },
};

const ExecutiveDashboard = () => {
  const { language, isRTL, formatNumber } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const tr = (k: keyof typeof DICT) => DICT[k][language as Lang] ?? DICT[k].en;
  const fmt = (n: number | string) => formatNumber(n);

  const kpis = [
    { label: tr("plantHealth"), value: "92", suffix: "%", deltaNum: "2%", trend: "up" as const, icon: Heart, tone: "success", sparkColor: "#10b981", spark: [40, 38, 42, 45, 44, 48, 50, 52, 55, 58, 60, 62] },
    { label: tr("criticalAlarms"), value: "3", deltaNum: "1", trend: "down" as const, icon: BellRing, tone: "danger", sparkColor: "#ef4444", spark: [60, 55, 58, 50, 48, 52, 45, 42, 40, 38, 35, 32] },
    { label: tr("assetsAtRisk"), value: "8", deltaNum: "2", trend: "up" as const, icon: AlertTriangle, tone: "warning", sparkColor: "#f59e0b", spark: [30, 35, 32, 38, 40, 36, 42, 45, 43, 48, 50, 52] },
    { label: tr("systemAvailability"), value: "99.8", suffix: "%", deltaNum: "0.3%", trend: "up" as const, icon: ShieldCheck, tone: "info", sparkColor: "#3b82f6", spark: [80, 82, 81, 83, 85, 84, 86, 88, 87, 89, 90, 92] },
    { label: tr("openWorkOrders"), value: "5", deltaNum: "1", trend: "down" as const, icon: ClipboardList, tone: "purple", sparkColor: "#8b5cf6", spark: [50, 48, 52, 50, 54, 52, 56, 54, 58, 56, 60, 58] },
  ];

  const aiFeatures = [
    { label: tr("forecastFailures"), desc: tr("forecastFailuresDesc"), icon: AlertTriangle, color: "text-red-600 bg-red-50", path: "/aiot/forecast-failures" },
    { label: tr("detectAnomalies"), desc: tr("detectAnomaliesDesc"), icon: Sparkles, color: "text-amber-600 bg-amber-50", path: "/aiot/detect-anomalies" },
    { label: tr("analyzeTrends"), desc: tr("analyzeTrendsDesc"), icon: LineChart, color: "text-blue-600 bg-blue-50", path: "/aiot/analyze-trends" },
    
    { label: tr("coPilot"), desc: tr("coPilotDesc"), icon: Bot, color: "text-violet-600 bg-violet-50", path: "/aiot/co-pilot" },
  ];

  const aiInsights = [
    { id: "f1", devId: "DEV-101", risk: tr("highRisk"), riskTone: "danger" as const, confidence: 90, asset: "Pump P101", days: 3, cause: tr("bearingWear"), impact: tr("productionStop") },
    { id: "f2", devId: "DEV-322", risk: tr("mediumRisk"), riskTone: "warning" as const, confidence: 78, asset: "Motor M12", days: 7, cause: tr("vibrationAnomaly"), impact: tr("efficiencyLoss") },
    { id: "f3", devId: "DEV-205", risk: tr("mediumRisk"), riskTone: "warning" as const, confidence: 72, asset: "Compressor C3", days: 10, cause: tr("suctionPressure"), impact: tr("highEnergy") },
  ];

  const systemStatus = [
    { label: tr("mqttBroker") },
    { label: tr("ruleEngine") },
    { label: tr("aiEngine") },
    { label: tr("database") },
    { label: tr("storage") },
  ];

  const aiServices = [
    { label: tr("failurePredictionModel"), icon: AlertTriangle },
    { label: tr("anomalyDetection"), icon: Sparkles },
    { label: tr("rulPredictionModel"), icon: TrendingUp },
    { label: tr("classificationModel"), icon: LayoutGrid },
  ];

  const forecast = [
    { label: tr("next7Days"), count: 8, pct: 25, color: "bg-red-500" },
    { label: tr("next30Days"), count: 16, pct: 55, color: "bg-orange-500" },
    { label: tr("next90Days"), count: 24, pct: 80, color: "bg-yellow-500" },
  ];


  const recentActivity = [
    { icon: Bell, color: "text-red-500 bg-red-50", title: tr("newAlarm"), sub: "Compressor C3", time: `2 ${tr("minAgo")}` },
    { icon: Sparkles, color: "text-emerald-500 bg-emerald-50", title: tr("aiRecCreated"), sub: "Pump P101", time: `15 ${tr("minAgo")}` },
    { icon: ClipboardList, color: "text-blue-500 bg-blue-50", title: tr("workOrderCompleted"), sub: "Motor M12", time: `1 ${tr("hourAgo")}` },
    { icon: HardDrive, color: "text-orange-500 bg-orange-50", title: tr("newDeviceAdded"), sub: "Temperature Sensor T12", time: `3 ${tr("hoursAgo")}` },
  ];

  const toneBg = (tone: string) => {
    switch (tone) {
      case "success": return "bg-emerald-50 text-emerald-600";
      case "danger": return "bg-red-50 text-red-600";
      case "warning": return "bg-orange-50 text-orange-600";
      case "info": return "bg-blue-50 text-blue-600";
      case "purple": return "bg-violet-50 text-violet-600";
      default: return "bg-muted text-foreground";
    }
  };

  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 28;
    const step = w / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  };

  const donutSegments = [
    { label: tr("healthy"), value: 112, pct: 78, color: "#10b981" },
    { label: tr("warning"), value: 14, pct: 10, color: "#f59e0b" },
    { label: tr("critical"), value: 8, pct: 6, color: "#ef4444" },
    { label: tr("unknown"), value: 9, pct: 6, color: "#9ca3af" },
  ];

  const Donut = () => {
    const radius = 38;
    const stroke = 14;
    const C = 2 * Math.PI * radius;
    let offset = 0;
    return (
      <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
        {donutSegments.map((s, i) => {
          const len = (s.pct / 100) * C;
          const el = (
            <circle key={i} cx="50" cy="50" r={radius} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </svg>
    );
  };

  const Chevron = () => <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />;

  const isFaAr = language === "fa" || language === "ar";

  return (
    <PanelLayout pageTitle={tr("overview")}>
      {isFaAr && (
        <style>{`
          .ov-i18n-bump .text-\\[10px\\] { font-size: 12px; line-height: 1.35; }
          .ov-i18n-bump .text-\\[11px\\] { font-size: 13px; line-height: 1.4; }
          .ov-i18n-bump .text-xs { font-size: 14px; line-height: 1.45; }
        `}</style>
      )}
      <div className={`space-y-4 ${isFaAr ? "ov-i18n-bump" : ""}`} dir={isRTL ? "rtl" : "ltr"}>

        {/* Page heading */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">{tr("overview")}</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[11px] h-5">
            {tr("builtInBadge")}
          </Badge>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          {/* LEFT COLUMN */}
          <div className="space-y-4 min-w-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {kpis.map((kpi, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${toneBg(kpi.tone)}`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{kpi.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{fmt(kpi.value)}</span>
                    {kpi.suffix && <span className="text-sm text-muted-foreground">{kpi.suffix}</span>}
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] mt-1 ${kpi.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                    {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-muted-foreground">{fmt(kpi.deltaNum)} {tr("vsYesterday")}</span>
                  </div>
                  <div className="mt-2">
                    <Sparkline data={kpi.spark} color={kpi.sparkColor} />
                  </div>
                </Card>
              ))}
            </div>





            {/* AI Insights Summary */}
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">{tr("aiInsightsSummary")}</h2>
                  <p className="text-xs text-muted-foreground">{tr("aiInsightsSummaryDesc")}</p>
                </div>
                <button
                  onClick={() => navigate(lp("/aiot/forecast-failures"))}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {tr("viewAllAiInsights")} <Chevron />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiInsights.map((ins) => (
                  <div key={ins.id} className="border border-border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={ins.riskTone === "danger" ? "bg-red-50 text-red-600 border-red-200" : "bg-orange-50 text-orange-600 border-orange-200"}>
                        {ins.risk}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{fmt(ins.confidence)}% {tr("confidence")}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">{ins.asset}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {language === "fa"
                        ? `هوش مصنوعی خرابی را در ${fmt(ins.days)} روز آینده پیش‌بینی می‌کند`
                        : `${tr("predictsWithin")} ${fmt(ins.days)} ${tr("days")}`}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-orange-600 font-medium">{tr("rootCause")}</span>
                        <div className="text-muted-foreground">{ins.cause}</div>
                      </div>
                      <div>
                        <span className="text-orange-600 font-medium">{tr("impact")}</span>
                        <div className="text-muted-foreground">{ins.impact}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                      <button
                        onClick={() => navigate(lp(`/aiot/forecast-failures/${ins.devId}`))}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        {tr("viewAiAnalysis")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Row: Asset Health + Failure Forecast + AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Asset Health Distribution */}
              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-1">{tr("assetHealthDistribution")}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <Donut />
                  <div className="flex-1 space-y-1.5 text-xs">
                    {donutSegments.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                          <span>{s.label}</span>
                        </div>
                        <span className="text-muted-foreground">{fmt(s.value)} ({fmt(s.pct)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate(lp("/devices"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-between"
                >
                  <span>{tr("viewAllDevices")}</span>
                  <Chevron />
                </button>
              </Card>

              {/* Failure Forecast */}
              <Card className="p-4">
                <h3 className="font-semibold text-sm">{tr("failureForecast")}</h3>
                <p className="text-xs text-muted-foreground mb-3">{tr("upcomingFailures")}</p>
                <div className="space-y-3">
                  {forecast.map((f, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{f.label}</span>
                        <span className="text-muted-foreground">{fmt(f.count)} {tr("assets")}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(lp("/aiot/forecast-failures"))}
                  className="mt-4 pt-2 border-t border-border w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-between"
                >
                  <span>{tr("viewForecast")}</span>
                  <Chevron />
                </button>
              </Card>

              {/* AI Recommendations (from Opportunities) */}
              <Card className="p-4">
                <h3 className="font-semibold text-sm">{tr("aiRecommendations")}</h3>
                <p className="text-xs text-muted-foreground mb-3">{tr("aiRecommendationsDesc")}</p>
                <div className="space-y-2">
                  {OPPORTUNITIES.slice(0, 3).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => navigate(lp(`/aiot/analyze-trends/opportunities/${o.id}`))}
                      className="w-full text-start border border-border rounded-md p-2 flex items-start gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{o.title}</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] h-5 shrink-0">{o.impactValue}</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2">{o.description}</div>
                        <div className="text-[11px] text-emerald-600 mt-0.5">{o.impactLabel}: {o.estimatedSavings}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-between"
                >
                  <span>{tr("viewAllOpportunities")}</span>
                  <Chevron />
                </button>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-4">
              <button
                onClick={() => navigate(lp("/activities"))}
                className="font-semibold text-sm mb-3 hover:text-primary text-start block"
              >
                {tr("recentActivity")}
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${a.color}`}>
                      <a.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.sub}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(lp("/activities"))}
                className="mt-3 pt-2 border-t border-border w-full text-xs text-muted-foreground hover:text-primary text-center"
              >
                {tr("viewAllActivity")}
              </button>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">
            {/* System Status */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">{tr("systemStatus")}</h3>
              <div className="space-y-2">
                {systemStatus.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{s.label}</span>
                    </div>
                    <span className="text-emerald-600">{tr("online")}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Services */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">{tr("aiServices")}</h3>
              <div className="space-y-2">
                {aiServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{s.label}</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] h-5">
                      {tr("active")}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Tools (compact) */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {tr("aiTools")}
              </h3>
              <div className="space-y-1">
                {aiFeatures.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => navigate(lp(f.path))}
                    className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition-colors text-start"
                  >
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${f.color}`}>
                      <f.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium flex-1 truncate">{f.label}</span>
                    <Chevron />
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">{tr("quickActions")}</h3>
              <TooltipProvider delayDuration={150}>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: tr("addDevice"), icon: Plus, path: "/devices/new" },
                    { label: tr("addLocation"), icon: MapPin, path: "/locations" },
                    { label: tr("createRule"), icon: FileText, path: "/alarms/rules/new" },
                    { label: tr("createDashboard"), icon: LayoutGrid, path: "/dashboard/new" },
                  ].map((q) => (
                    <Tooltip key={q.path}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="text-[11px] justify-start h-9 px-2 min-w-0" onClick={() => navigate(lp(q.path))}>
                          <q.icon className="h-3.5 w-3.5 me-1 shrink-0" /> <span className="truncate">{q.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{q.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </Card>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
};

export default ExecutiveDashboard;
