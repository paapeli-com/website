import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/features/factory/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { LoadingSpinner } from "@/features/factory/components/ui/loading-spinner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/features/factory/components/ui/sheet";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useDashboards, AI_MANAGERS_DASHBOARD_ID } from "@/features/factory/hooks/useDashboards";
import { OPPORTUNITIES } from "@/features/factory/data/trends";
import { DATA_SOURCES, findDataSource, getKPI, getSeries, getBreakdown, getTable } from "@/features/factory/lib/dashboardData";
import {
  ArrowLeft, Maximize2, Minimize2, RefreshCw, Pencil, Calendar,
  ShieldAlert, AlertTriangle, DollarSign, Sparkles, Lightbulb, ClipboardList,
  TrendingUp, TrendingDown, ChevronRight, Wrench, Bot, Send, GripVertical,
  LayoutGrid, Plus, X, Hash, LineChart, BarChart3, PieChart, Table as TableIcon, Type, Settings2,
  ChevronUp, ChevronDown,
} from "lucide-react";



type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  back: { en: "Back", ar: "رجوع", fa: "بازگشت" },
  title: { en: "AI Operations Center", ar: "مركز عمليات الذكاء الاصطناعي", fa: "مرکز عملیات هوش مصنوعی" },
  subtitle: { en: "Executive Dashboard", ar: "لوحة تنفيذية", fa: "داشبورد مدیریتی" },
  desc: { en: "Real-time AI insights to help you monitor risks, anomalies and opportunities across your operations.", ar: "رؤى ذكاء اصطناعي فورية لمراقبة المخاطر والشذوذ والفرص عبر عملياتك.", fa: "بینش‌های لحظه‌ای هوش مصنوعی برای پایش ریسک‌ها، ناهنجاری‌ها و فرصت‌ها در عملیات شما." },
  autoUpdated: { en: "Auto updated", ar: "تم التحديث تلقائياً", fa: "به‌روزرسانی خودکار" },
  refresh: { en: "Refresh", ar: "تحديث", fa: "به‌روزرسانی" },
  fullscreen: { en: "Fullscreen", ar: "ملء الشاشة", fa: "تمام‌صفحه" },
  exitFullscreen: { en: "Exit fullscreen", ar: "إنهاء ملء الشاشة", fa: "خروج از تمام‌صفحه" },
  editSettings: { en: "Edit settings", ar: "تعديل الإعدادات", fa: "تنظیمات" },
  refreshEvery: { en: "Auto-refresh", ar: "تحديث تلقائي", fa: "به‌روزرسانی خودکار" },
  off: { en: "Off", ar: "إيقاف", fa: "خاموش" },
  // KPIs
  assetsAtRisk: { en: "Assets At Risk", ar: "الأصول في خطر", fa: "تجهیزات در معرض خطر" },
  todayLabel: { en: "today", ar: "اليوم", fa: "امروز" },
  activeAnomalies: { en: "Active Anomalies", ar: "الشذوذ النشط", fa: "ناهنجاری‌های فعال" },
  critical: { en: "Critical", ar: "حرج", fa: "بحرانی" },
  potentialSavings: { en: "Potential Savings", ar: "الوفورات المحتملة", fa: "صرفه‌جویی احتمالی" },
  thisMonth: { en: "This Month", ar: "هذا الشهر", fa: "این ماه" },
  aiConfidence: { en: "AI Confidence", ar: "ثقة الذكاء الاصطناعي", fa: "اطمینان هوش مصنوعی" },
  modelsHealthy: { en: "Models Healthy", ar: "النماذج سليمة", fa: "مدل‌ها سالم" },
  openRecs: { en: "Open Recommendations", ar: "التوصيات المفتوحة", fa: "توصیه‌های باز" },
  needReview: { en: "Need Review", ar: "تحتاج مراجعة", fa: "نیاز به بررسی" },
  workOrders: { en: "Work Orders (AI)", ar: "أوامر العمل (AI)", fa: "دستورکارها (AI)" },
  pending: { en: "Pending", ar: "معلق", fa: "در انتظار" },
  vsYesterday: { en: "Vs yesterday", ar: "مقابل أمس", fa: "نسبت به دیروز" },
  vsLastMonth: { en: "Vs last month", ar: "مقابل الشهر الماضي", fa: "نسبت به ماه گذشته" },
  // Sections
  aiRiskMap: { en: "AI Risk Map", ar: "خريطة المخاطر", fa: "نقشه ریسک هوش مصنوعی" },
  topAssets: { en: "Top Assets", ar: "أبرز الأصول", fa: "تجهیزات مهم" },
  viewAllAtRisk: { en: "View all assets at risk", ar: "عرض جميع الأصول في خطر", fa: "مشاهده همه تجهیزات در خطر" },
  aiExecutiveFeed: { en: "AI Executive Feed", ar: "تغذية الذكاء الاصطناعي", fa: "فید هوش مصنوعی مدیریتی" },
  viewAllInsights: { en: "View all insights", ar: "عرض كل الرؤى", fa: "مشاهده همه بینش‌ها" },
  failureForecast: { en: "Failure Forecast Summary", ar: "ملخص توقع الأعطال", fa: "خلاصه پیش‌بینی خرابی" },
  totalAssets: { en: "Total Assets", ar: "إجمالي الأصول", fa: "کل تجهیزات" },
  high: { en: "High", ar: "مرتفع", fa: "بالا" },
  medium: { en: "Medium", ar: "متوسط", fa: "متوسط" },
  low: { en: "Low", ar: "منخفض", fa: "پایین" },
  trendOpps: { en: "Trend Opportunities", ar: "فرص الاتجاهات", fa: "فرصت‌های روند" },
  top: { en: "Top", ar: "الأعلى", fa: "برتر" },
  viewAllOpps: { en: "View all opportunities", ar: "عرض كل الفرص", fa: "مشاهده همه فرصت‌ها" },
  aiModelHealth: { en: "AI Model Health", ar: "صحة النماذج", fa: "سلامت مدل‌های هوش مصنوعی" },
  healthy: { en: "Healthy", ar: "سليم", fa: "سالم" },
  viewModelDetails: { en: "View model details", ar: "عرض تفاصيل النموذج", fa: "مشاهده جزئیات مدل" },
  aiRecommendedActions: { en: "AI Recommended Actions", ar: "إجراءات موصى بها", fa: "اقدامات پیشنهادی هوش مصنوعی" },
  topPriority: { en: "Top Priority", ar: "أولوية قصوى", fa: "اولویت بالا" },
  createWorkOrder: { en: "Create Work Order", ar: "إنشاء أمر عمل", fa: "ایجاد دستورکار" },
  assign: { en: "Assign", ar: "تعيين", fa: "ارجاع" },
  impact: { en: "Impact", ar: "التأثير", fa: "تأثیر" },
  inspectBearing: { en: "Inspect bearing", ar: "افحص المحمل", fa: "بازرسی بلبرینگ" },
  checkSuction: { en: "Check suction pressure", ar: "تحقق من ضغط الشفط", fa: "بررسی فشار مکش" },
  lubricateShaft: { en: "Lubricate shaft", ar: "تشحيم العمود", fa: "روان‌کاری شفت" },
  avoidDowntime: { en: "Avoid 6h downtime", ar: "تجنب توقف 6 ساعات", fa: "جلوگیری از ۶ ساعت توقف" },
  avoidCavitation: { en: "Avoid cavitation", ar: "تجنب التجويف", fa: "جلوگیری از کاویتاسیون" },
  reduceVibration: { en: "Reduce vibration", ar: "تقليل الاهتزاز", fa: "کاهش ارتعاش" },
  viewAllRecs: { en: "View all recommendations", ar: "عرض كل التوصيات", fa: "مشاهده همه توصیه‌ها" },
  coPilot: { en: "AI Co-Pilot", ar: "مساعد AI", fa: "همیار هوش مصنوعی" },
  quickAsk: { en: "Quick Ask", ar: "سؤال سريع", fa: "پرسش سریع" },
  copilotPlaceholder: { en: "Ask anything about your operations…", ar: "اسأل أي شيء عن عملياتك…", fa: "هر چیزی درباره عملیات خود بپرسید…" },
  whyAtRisk: { en: "Why is Pump P101 at risk?", ar: "لماذا مضخة P101 في خطر؟", fa: "چرا پمپ P101 در خطر است؟" },
  showAnomalies: { en: "Show anomalies in Factory A", ar: "اعرض الشذوذ في المصنع A", fa: "ناهنجاری‌های کارخانه A را نمایش بده" },
  whatCausedEnergy: { en: "What caused energy increase?", ar: "ما سبب زيادة الطاقة؟", fa: "علت افزایش انرژی چه بود؟" },
  createWeekly: { en: "Create weekly report", ar: "إنشاء تقرير أسبوعي", fa: "ایجاد گزارش هفتگی" },
  anomalyTrend: { en: "Anomaly Trend", ar: "اتجاه الشذوذ", fa: "روند ناهنجاری" },
  last30: { en: "Last 30 Days", ar: "آخر 30 يومًا", fa: "۳۰ روز اخیر" },
  timeRange: { en: "Time range", ar: "النطاق الزمني", fa: "بازه زمانی" },
  last1h: { en: "Last 1 hour", ar: "آخر ساعة", fa: "۱ ساعت اخیر" },
  last24h: { en: "Last 24 hours", ar: "آخر 24 ساعة", fa: "۲۴ ساعت اخیر" },
  last7d: { en: "Last 7 days", ar: "آخر 7 أيام", fa: "۷ روز اخیر" },
  last30d: { en: "Last 30 days", ar: "آخر 30 يومًا", fa: "۳۰ روز اخیر" },
  last90d: { en: "Last 90 days", ar: "آخر 90 يومًا", fa: "۹۰ روز اخیر" },
  dragHint: { en: "Drag to reorder", ar: "اسحب لإعادة الترتيب", fa: "برای جابجایی بکشید" },
  loading: { en: "Loading dashboard…", ar: "جارٍ تحميل اللوحة…", fa: "در حال بارگذاری داشبورد…" },
  addWidget: { en: "Add widget", ar: "إضافة عنصر", fa: "افزودن ویجت" },
  widgetCatalog: { en: "Widget catalog", ar: "كتالوج العناصر", fa: "کتالوگ ویجت‌ها" },
  wKpi: { en: "KPI Stat", ar: "إحصاء KPI", fa: "آمار KPI" },
  wKpiDesc: { en: "Single big number with trend", ar: "رقم كبير مع اتجاه", fa: "عدد بزرگ با روند" },
  wLine: { en: "Line Chart", ar: "مخطط خطي", fa: "نمودار خطی" },
  wLineDesc: { en: "Trend over time", ar: "اتجاه عبر الزمن", fa: "روند در طول زمان" },
  wBar: { en: "Bar Chart", ar: "مخطط أعمدة", fa: "نمودار میله‌ای" },
  wBarDesc: { en: "Compare categories", ar: "قارن الفئات", fa: "مقایسه دسته‌ها" },
  wDonut: { en: "Donut Chart", ar: "مخطط دائري", fa: "نمودار حلقه‌ای" },
  wDonutDesc: { en: "Distribution", ar: "التوزيع", fa: "توزیع" },
  wTable: { en: "Data Table", ar: "جدول بيانات", fa: "جدول داده" },
  wTableDesc: { en: "Rows and columns", ar: "صفوف وأعمدة", fa: "ردیف‌ها و ستون‌ها" },
  wText: { en: "Text / Note", ar: "نص / ملاحظة", fa: "متن / یادداشت" },
  wTextDesc: { en: "Markdown-style note", ar: "ملاحظة بأسلوب ماركداون", fa: "یادداشت متنی" },
  customWidgets: { en: "Custom widgets", ar: "العناصر المخصصة", fa: "ویجت‌های سفارشی" },
  noCustom: { en: "No custom widgets yet. Click + Add Widget to start building.", ar: "لا توجد عناصر مخصصة بعد. اضغط على + إضافة عنصر للبدء.", fa: "هنوز ویجت سفارشی ندارید. برای شروع روی + افزودن ویجت بزنید." },
  removeWidget: { en: "Remove widget", ar: "حذف العنصر", fa: "حذف ویجت" },
  newWidgetTitle: { en: "New widget", ar: "عنصر جديد", fa: "ویجت جدید" },
  hideToolbar: { en: "Hide toolbar", ar: "إخفاء شريط الأدوات", fa: "پنهان کردن نوار ابزار" },
  showToolbar: { en: "Show toolbar", ar: "إظهار شريط الأدوات", fa: "نمایش نوار ابزار" },
};





const formatLocaleDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const ManagersDashboard = () => {
  const navigate = useNavigate();
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language as Lang;
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const t = (k: keyof typeof DICT) => DICT[k][lang] ?? DICT[k].en;
  const fmt = (n: number | string) => formatNumber(n);

  const { items } = useDashboards();
  const dashboard = items.find((d) => d.id === AI_MANAGERS_DASHBOARD_ID);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<string>("60");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [loading, setLoading] = useState(true);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  // Initial loading skeleton
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  // Custom widgets (user-added via Add Widget)
  type WidgetType = "stat" | "line" | "bar" | "donut" | "table" | "text";
  interface CustomWidget {
    id: string;
    type: WidgetType;
    title: string;
    dataSourceId?: string;
    metricKey?: string;
    metricKeys?: string[];
    dimensionKey?: string;
    text?: string;
  }
  const WIDGETS_KEY = "paapeli-managers-dashboard-widgets-v2";
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>(() => {
    try {
      const raw = localStorage.getItem(WIDGETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem(WIDGETS_KEY, JSON.stringify(customWidgets)); } catch {}
  }, [customWidgets]);

  const [configWidgetId, setConfigWidgetId] = useState<string | null>(null);
  const editingWidget = customWidgets.find((w) => w.id === configWidgetId) || null;
  const updateCustomWidget = (id: string, patch: Partial<CustomWidget>) => {
    setCustomWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const widgetTitleFor = (type: WidgetType) =>
    type === "stat" ? t("wKpi") :
    type === "line" ? t("wLine") :
    type === "bar" ? t("wBar") :
    type === "donut" ? t("wDonut") :
    type === "table" ? t("wTable") : t("wText");

  const addCustomWidget = (type: WidgetType) => {
    const src = DATA_SOURCES[0];
    const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCustomWidgets((prev) => [
      ...prev,
      {
        id, type, title: widgetTitleFor(type),
        dataSourceId: src.id,
        metricKey: src.metrics[0].key,
        metricKeys: type === "table" ? src.metrics.slice(0, 3).map((m) => m.key) : undefined,
        dimensionKey: type === "donut" || type === "bar" ? src.dimensions[0]?.key : undefined,
        text: type === "text" ? "" : undefined,
      },
    ]);
    if (type !== "text") setConfigWidgetId(id);
  };
  const removeCustomWidget = (id: string) => {
    setCustomWidgets((prev) => prev.filter((w) => w.id !== id));
  };



  // Persisted section order (drag-and-drop)
  const ORDER_KEY = "paapeli-managers-dashboard-order-v1";
  const DEFAULT_ORDER = {
    kpi: ["assetsAtRisk", "activeAnomalies", "potentialSavings", "aiConfidence", "openRecs", "workOrders"],
    row1: ["riskMap", "execFeed", "forecast"],
    row2: ["anomalyTrend", "trendOpps", "modelHealth"],
    row3: ["recommendedActions", "coPilot"],
  };
  const [order, setOrder] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // merge with defaults to recover from added/removed cards
        const merged: Record<string, string[]> = {};
        (Object.keys(DEFAULT_ORDER) as Array<keyof typeof DEFAULT_ORDER>).forEach((k) => {
          const def = DEFAULT_ORDER[k];
          const cur: string[] = Array.isArray(parsed[k]) ? parsed[k] : [];
          const filtered = cur.filter((id) => def.includes(id));
          const missing = def.filter((id) => !filtered.includes(id));
          merged[k] = [...filtered, ...missing];
        });
        return merged;
      }
    } catch {}
    return DEFAULT_ORDER;
  });

  useEffect(() => {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch {}
  }, [order]);

  const dragRef = useRef<{ group: string; id: string } | null>(null);
  const onDragStart = (group: string, id: string) => (e: React.DragEvent) => {
    dragRef.current = { group, id };
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", id); } catch {}
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (group: string, targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragRef.current;
    dragRef.current = null;
    if (!src || src.group !== group || src.id === targetId) return;
    if (group === "custom") {
      setCustomWidgets((prev) => {
        const list = [...prev];
        const from = list.findIndex((w) => w.id === src.id);
        const to = list.findIndex((w) => w.id === targetId);
        if (from < 0 || to < 0) return prev;
        const [m] = list.splice(from, 1);
        list.splice(to, 0, m);
        return list;
      });
      return;
    }
    setOrder((prev) => {
      const list = [...(prev[group] || [])];
      const from = list.indexOf(src.id);
      const to = list.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      list.splice(from, 1);
      list.splice(to, 0, src.id);
      return { ...prev, [group]: list };
    });
  };



  // Auto-refresh
  useEffect(() => {
    if (refreshInterval === "0") return;
    const ms = parseInt(refreshInterval, 10) * 1000;
    const id = setInterval(() => {
      setLastUpdated(new Date());
      setTick((x) => x + 1);
    }, ms);
    return () => clearInterval(id);
  }, [refreshInterval]);

  // Live "x min ago" label tick
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fullscreen state listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const manualRefresh = () => {
    setLastUpdated(new Date());
    setTick((x) => x + 1);
  };

  const updatedAgo = useMemo(() => {
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (diff < 1) return lang === "en" ? "just now" : lang === "fa" ? "همین حالا" : "الآن";
    return `${fmt(diff)} ${lang === "en" ? "min ago" : lang === "fa" ? "دقیقه پیش" : "دقيقة مضت"}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, lastUpdated, lang]);

  // ----- Data -----
  const kpis = [
    { icon: ShieldAlert, label: t("assetsAtRisk"), value: "8", delta: `+2 ${t("todayLabel")}`, deltaTone: "danger" as const, sub: t("vsYesterday"), tone: "red" },
    { icon: AlertTriangle, label: t("activeAnomalies"), value: "12", delta: `3 ${t("critical")}`, deltaTone: "danger" as const, sub: t("vsYesterday"), tone: "orange" },
    { icon: DollarSign, label: t("potentialSavings"), value: "$18,400", delta: t("thisMonth"), deltaTone: "success" as const, sub: `${t("vsLastMonth")} ↑ 8%`, tone: "emerald" },
    { icon: Sparkles, label: t("aiConfidence"), value: "91%", delta: t("modelsHealthy"), deltaTone: "info" as const, sub: `${t("vsYesterday")} ↑ 2%`, tone: "blue" },
    { icon: Lightbulb, label: t("openRecs"), value: "16", delta: t("needReview"), deltaTone: "warning" as const, sub: `${t("vsYesterday")} ↓ 3`, tone: "violet" },
    { icon: ClipboardList, label: t("workOrders"), value: "7", delta: `2 ${t("pending")}`, deltaTone: "neutral" as const, sub: `${t("vsYesterday")} ↑ 1`, tone: "slate" },
  ];

  const riskAssets = [
    { name: "Pump P101", line: "Line 1 - Sulfonation", level: t("critical"), levelTone: "danger", rul: "3d", pct: 43 },
    { name: "Boiler Pump BP-2", line: "Boiler - Line 1", level: t("critical"), levelTone: "danger", rul: "4d", pct: 48 },
    { name: "Compressor C3", line: "Line 2 - Sulfonation", level: t("high"), levelTone: "warning", rul: "6d", pct: 56 },
    { name: "Motor M12", line: "Factory B - Processing", level: t("high"), levelTone: "warning", rul: "9d", pct: 62 },
    { name: "Heat Exchanger HX-7", line: "Factory B - Processing", level: t("high"), levelTone: "warning", rul: "14d", pct: 65 },
  ];

  const feed = [
    { tone: "danger", text: lang === "en" ? "Bearing vibration increased 18% in last 7 days. Expected failure probability: 97%" : lang === "fa" ? "ارتعاش بلبرینگ ۱۸٪ افزایش یافته. احتمال خرابی: ۹۷٪" : "زيادة الاهتزاز 18% خلال 7 أيام. احتمال العطل: 97%", time: `5 ${lang === "en" ? "min ago" : lang === "fa" ? "دقیقه پیش" : "د"}` },
    { tone: "warning", text: lang === "en" ? "Energy consumption is increasing faster than production output." : lang === "fa" ? "مصرف انرژی سریع‌تر از خروجی تولید رشد می‌کند." : "استهلاك الطاقة يزيد أسرع من الإنتاج.", time: `18 ${lang === "en" ? "min ago" : lang === "fa" ? "دقیقه پیش" : "د"}` },
    { tone: "info", text: lang === "en" ? "Compressor utilization dropped 14%." : lang === "fa" ? "بهره‌برداری کمپرسور ۱۴٪ کاهش یافت." : "انخفض استخدام الضاغط 14%.", time: `25 ${lang === "en" ? "min ago" : lang === "fa" ? "دقیقه پیش" : "د"}` },
    { tone: "success", text: lang === "en" ? "Potential saving: 11% if scheduling optimized." : lang === "fa" ? "صرفه‌جویی احتمالی: ۱۱٪ با بهینه‌سازی زمان‌بندی." : "وفر محتمل: 11% بتحسين الجدولة.", time: `42 ${lang === "en" ? "min ago" : lang === "fa" ? "دقیقه پیش" : "د"}` },
  ];

  const forecastSegments = [
    { label: t("critical"), value: 2, pct: 13, color: "#ef4444" },
    { label: t("high"), value: 3, pct: 19, color: "#f59e0b" },
    { label: t("medium"), value: 6, pct: 38, color: "#eab308" },
    { label: t("low"), value: 5, pct: 30, color: "#10b981" },
  ];

  const models = [
    { name: lang === "en" ? "Forecast Model" : lang === "fa" ? "مدل پیش‌بینی" : "نموذج التوقع", pct: 94 },
    { name: lang === "en" ? "Anomaly Detection Model" : lang === "fa" ? "مدل تشخیص ناهنجاری" : "نموذج اكتشاف الشذوذ", pct: 92 },
    { name: lang === "en" ? "Trend Analysis Model" : lang === "fa" ? "مدل تحلیل روند" : "نموذج تحليل الاتجاهات", pct: 91 },
    { name: lang === "en" ? "NLP & Insights Model" : lang === "fa" ? "مدل NLP و بینش" : "نموذج NLP والرؤى", pct: 89 },
  ];

  const actions = [
    { level: t("critical"), levelTone: "danger", asset: "Pump P101", action: t("inspectBearing"), impact: t("avoidDowntime"), primary: true },
    { level: t("high"), levelTone: "warning", asset: "Boiler Pump BP-2", action: t("checkSuction"), impact: t("avoidCavitation"), primary: true },
    { level: t("medium"), levelTone: "info", asset: "Compressor C3", action: t("lubricateShaft"), impact: t("reduceVibration"), primary: false },
  ];

  // ----- Visuals -----
  const Donut = () => {
    const R = 38, S = 14, C = 2 * Math.PI * R;
    let off = 0;
    return (
      <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
        {forecastSegments.map((s, i) => {
          const len = (s.pct / 100) * C;
          const el = (
            <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth={S}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />
          );
          off += len;
          return el;
        })}
      </svg>
    );
  };

  const TrendChart = () => {
    const data = [12, 18, 14, 22, 19, 25, 20, 24, 28, 23, 27, 26, 30, 28, 32];
    const max = Math.max(...data);
    const w = 600, h = 120, step = w / (data.length - 1);
    const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
    const area = `0,${h} ${pts} ${w},${h}`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
        <polygon points={area} fill="hsl(var(--destructive) / 0.10)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" />
      </svg>
    );
  };

  const toneCard = (tone: string) => {
    switch (tone) {
      case "red": return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case "orange": return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";
      case "emerald": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "blue": return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "violet": return "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400";
    }
  };

  const levelBadge = (tone: string) => {
    switch (tone) {
      case "danger": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300";
      case "warning": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300";
      case "info": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300";
      case "success": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300";
      default: return "bg-muted text-foreground";
    }
  };

  const today = new Date();
  const rangeDays: Record<string, number> = { "1h": 1 / 24, "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  const days = rangeDays[timeRange] ?? 7;
  const range = `${formatLocaleDate(new Date(today.getTime() - days * 86400000), lang)} – ${formatLocaleDate(today, lang)}`;
  const timeRangeLabel: Record<string, string> = {
    "1h": t("last1h"), "24h": t("last24h"), "7d": t("last7d"), "30d": t("last30d"), "90d": t("last90d"),
  };

  // Card factory: returns { id, span, node } so the same registry can be reordered
  const dragProps = (group: string, id: string) => ({
    draggable: true,
    onDragStart: onDragStart(group, id),
    onDragOver,
    onDrop: onDrop(group, id),
  });
  const DragHandle = () => (
    <span title={t("dragHint")} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground inline-flex">
      <GripVertical className="h-4 w-4" />
    </span>
  );


  // Mini renderers for custom widgets (data-bound)
  const MiniLine = ({ points }: { points: { x: string; y: number }[] }) => {
    const data = points.map((p) => p.y);
    const max = Math.max(...data) || 1, min = Math.min(...data), r = max - min || 1;
    const w = 240, h = 80, step = w / (data.length - 1 || 1);
    const pts = data.map((v, i) => `${i * step},${h - ((v - min) / r) * (h - 8) - 4}`).join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill="hsl(var(--primary) / 0.12)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      </svg>
    );
  };
  const MiniBar = ({ items }: { items: { label: string; value: number }[] }) => {
    const max = Math.max(...items.map((i) => i.value)) || 1;
    const w = 240, h = 80, bw = w / items.length - 4;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
        {items.map((it, i) => (
          <rect key={i} x={i * (bw + 4)} y={h - (it.value / max) * h} width={bw} height={(it.value / max) * h}
            fill="hsl(var(--primary))" rx="2" />
        ))}
      </svg>
    );
  };
  const MiniDonut = ({ items }: { items: { label: string; value: number }[] }) => {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const palette = ["#10b981", "#f59e0b", "#ef4444", "#0077B6", "#FF7A00"];
    const R = 38, S = 14, C = 2 * Math.PI * R; let off = 0;
    return (
      <div className="flex items-center justify-center gap-3">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          {items.map((it, i) => {
            const len = (it.value / total) * C;
            const el = <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={palette[i % palette.length]} strokeWidth={S} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />;
            off += len; return el;
          })}
        </svg>
        <div className="space-y-1 text-[11px]">
          {items.map((it, i) => (
            <div key={it.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: palette[i % palette.length] }} />
              <span>{it.label}</span>
              <span className="text-muted-foreground">{Math.round((it.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomWidget = (w: CustomWidget) => {
    const sourceId = w.dataSourceId || DATA_SOURCES[0].id;
    switch (w.type) {
      case "stat": {
        const k = getKPI(sourceId, w.metricKey || "", w.id);
        const up = k.change >= 0;
        return (
          <>
            <div className="text-3xl font-bold leading-tight">
              {fmt(k.value)}{k.unit && <span className="text-base ml-1 text-muted-foreground">{k.unit}</span>}
            </div>
            <div className={`text-[11px] mt-1 flex items-center gap-1 ${up ? "text-emerald-600" : "text-rose-600"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? "+" : ""}{k.change}% {t("vsLastMonth")}
            </div>
          </>
        );
      }
      case "line":
        return <MiniLine points={getSeries(sourceId, w.metricKey || "", 12, w.id)} />;
      case "bar":
        return <MiniBar items={getBreakdown(sourceId, w.dimensionKey, w.id)} />;
      case "donut":
        return <MiniDonut items={getBreakdown(sourceId, w.dimensionKey, w.id)} />;
      case "table": {
        const tbl = getTable(sourceId, w.metricKeys || [], w.id);
        return (
          <div className="text-xs overflow-auto max-h-48">
            <table className="w-full">
              <thead className="text-muted-foreground border-b border-border">
                <tr>{tbl.columns.map((c) => <th key={c} className="text-left font-medium py-1 px-1.5">{c}</th>)}</tr>
              </thead>
              <tbody>
                {tbl.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {row.map((cell, j) => <td key={j} className="py-1 px-1.5 tabular-nums">{typeof cell === "number" ? fmt(cell) : cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case "text":
        return <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{w.text || t("wTextDesc")}</p>;
    }
  };

  // Loading state: skeleton + branded Paapeli spinner
  if (loading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 bg-card border-b border-border">
          <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3 w-96 hidden lg:block" />
            </div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-32" />
          </div>
        </header>
        <main className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-3 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-16" />
              </Card>
            ))}
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))}
            </div>
          ))}
          <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-card border border-border rounded-xl px-6 py-5 shadow-lg flex flex-col items-center gap-3 pointer-events-auto">
              <LoadingSpinner size="lg" />
              <span className="text-sm text-muted-foreground">{t("loading")}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (

    <div
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-background text-foreground"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(lp("/dashboard"))} aria-label={t("back")}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg lg:text-xl font-bold truncate">{dashboard?.name || t("title")}</h1>
              <Badge variant="secondary" className="font-normal">{t("subtitle")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate hidden lg:block">{t("desc")}</p>
          </div>

          {!toolbarCollapsed && (
          <><Select value={timeRange} onValueChange={(v) => { setTimeRange(v); manualRefresh(); }}>


            <SelectTrigger className="w-auto min-w-[200px] h-9 text-xs gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <SelectValue>
                <span className="text-muted-foreground">{timeRangeLabel[timeRange]} · {range}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t("last1h")}</SelectItem>
              <SelectItem value="24h">{t("last24h")}</SelectItem>
              <SelectItem value="7d">{t("last7d")}</SelectItem>
              <SelectItem value="30d">{t("last30d")}</SelectItem>
              <SelectItem value="90d">{t("last90d")}</SelectItem>
            </SelectContent>
          </Select>


          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{t("autoUpdated")} {updatedAgo}</span>
          </div>

          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-2">
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="w-[140px] h-9">
                  <RefreshCw className="h-3.5 w-3.5 me-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("refreshEvery")}: {t("off")}</SelectItem>
                  <SelectItem value="15">{t("refreshEvery")}: 15s</SelectItem>
                  <SelectItem value="30">{t("refreshEvery")}: 30s</SelectItem>
                  <SelectItem value="60">{t("refreshEvery")}: 1m</SelectItem>
                  <SelectItem value="300">{t("refreshEvery")}: 5m</SelectItem>
                  <SelectItem value="900">{t("refreshEvery")}: 15m</SelectItem>
                </SelectContent>
              </Select>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={manualRefresh} aria-label={t("refresh")}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("refresh")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={toggleFullscreen} aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? t("exitFullscreen") : t("fullscreen")}</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="h-9 gap-1.5">
                        <LayoutGrid className="h-4 w-4" />
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">{t("addWidget")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t("addWidget")}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-64">
                  <DropdownMenuLabel>{t("widgetCatalog")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {([
                    { type: "stat" as const, icon: Hash, name: t("wKpi"), desc: t("wKpiDesc") },
                    { type: "line" as const, icon: LineChart, name: t("wLine"), desc: t("wLineDesc") },
                    { type: "bar" as const, icon: BarChart3, name: t("wBar"), desc: t("wBarDesc") },
                    { type: "donut" as const, icon: PieChart, name: t("wDonut"), desc: t("wDonutDesc") },
                    { type: "table" as const, icon: TableIcon, name: t("wTable"), desc: t("wTableDesc") },
                    { type: "text" as const, icon: Type, name: t("wText"), desc: t("wTextDesc") },
                  ]).map((w) => (
                    <DropdownMenuItem key={w.type} onSelect={() => addCustomWidget(w.type)} className="gap-2 py-2 cursor-pointer">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <w.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{w.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{w.desc}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => navigate(lp(`/dashboard/${AI_MANAGERS_DASHBOARD_ID}/edit`))} aria-label={t("editSettings")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editSettings")}</TooltipContent>
              </Tooltip>

            </div>
          </TooltipProvider></>
          )}

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setToolbarCollapsed((v) => !v)}
                  aria-label={toolbarCollapsed ? t("showToolbar") : t("hideToolbar")}
                >
                  {toolbarCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{toolbarCollapsed ? t("showToolbar") : t("hideToolbar")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Body */}
      <main className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto">
        {/* KPI strip — draggable */}
        {(() => {
          const kpiMap: Record<string, typeof kpis[number]> = {
            assetsAtRisk: kpis[0], activeAnomalies: kpis[1], potentialSavings: kpis[2],
            aiConfidence: kpis[3], openRecs: kpis[4], workOrders: kpis[5],
          };
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {order.kpi.map((id) => {
                const k = kpiMap[id]; if (!k) return null;
                return (
                  <Card key={id} {...dragProps("kpi", id)} className="p-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center ${toneCard(k.tone)}`}>
                        <k.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs text-muted-foreground truncate flex-1">{k.label}</span>
                      <DragHandle />
                    </div>
                    <div className="text-2xl font-bold leading-tight">{k.value}</div>
                    <div className={`text-[11px] mt-1 ${
                      k.deltaTone === "danger" ? "text-red-600" :
                      k.deltaTone === "warning" ? "text-orange-600" :
                      k.deltaTone === "success" ? "text-emerald-600" :
                      k.deltaTone === "info" ? "text-blue-600" : "text-muted-foreground"
                    }`}>{k.delta}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{k.sub}</div>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        {/* Row 1 — draggable */}
        {(() => {
          const cards: Record<string, JSX.Element> = {
            riskMap: (
              <Card {...dragProps("row1", "riskMap")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{t("aiRiskMap")} <span className="text-muted-foreground font-normal">({t("topAssets")})</span></h2>
                  <DragHandle />
                </div>
                <div className="space-y-2">
                  {riskAssets.map((a) => (
                    <div key={a.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{a.line}</div>
                      </div>
                      <Badge variant="outline" className={`${levelBadge(a.levelTone)} text-[10px] h-5`}>{a.level}</Badge>
                      <span className="text-[11px] text-muted-foreground w-12 text-end">RUL {a.rul}</span>
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${a.pct}%` }} />
                      </div>
                      <span className="text-[11px] tabular-nums w-9 text-end">{a.pct}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate(lp("/aiot/forecast-failures"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-primary hover:underline flex items-center justify-between">
                  <span>{t("viewAllAtRisk")}</span>
                  <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </Card>
            ),
            execFeed: (
              <Card {...dragProps("row1", "execFeed")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{t("aiExecutiveFeed")}</h2>
                  <DragHandle />
                </div>
                <div className="space-y-3">
                  {feed.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        f.tone === "danger" ? "bg-red-500" :
                        f.tone === "warning" ? "bg-orange-500" :
                        f.tone === "info" ? "bg-blue-500" : "bg-emerald-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground">{f.text}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{f.time}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate(lp("/aiot/analyze-trends"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-primary hover:underline flex items-center justify-between">
                  <span>{t("viewAllInsights")}</span>
                  <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </Card>
            ),
            forecast: (
              <Card {...dragProps("row1", "forecast")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{t("failureForecast")}</h2>
                  <DragHandle />
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Donut />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{fmt(16)}</span>
                      <span className="text-[10px] text-muted-foreground">{t("totalAssets")}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    {forecastSegments.map((s) => (
                      <div key={s.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                          <span>{s.label}</span>
                        </div>
                        <span className="text-muted-foreground">{fmt(s.value)} ({fmt(s.pct)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ),
          };
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {order.row1.map((id) => <div key={id}>{cards[id]}</div>)}
            </div>
          );
        })()}

        {/* Row 2 — draggable */}
        {(() => {
          const cards: Record<string, JSX.Element> = {
            anomalyTrend: (
              <Card {...dragProps("row2", "anomalyTrend")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-sm">{t("anomalyTrend")}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{timeRangeLabel[timeRange]}</span>
                    <DragHandle />
                  </div>
                </div>
                <TrendChart />
              </Card>
            ),
            trendOpps: (
              <Card {...dragProps("row2", "trendOpps")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{t("trendOpps")} <span className="text-muted-foreground font-normal">({t("top")})</span></h2>
                  <DragHandle />
                </div>
                <div className="space-y-2">
                  {OPPORTUNITIES.slice(0, 3).map((o) => (
                    <button key={o.id} onClick={() => navigate(lp(`/aiot/analyze-trends/opportunities/${o.id}`))}
                      className="w-full text-start flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 border border-transparent hover:border-border">
                      <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{o.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{o.impactLabel}</div>
                      </div>
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: "60%" }} />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 w-12 text-end">{o.impactValue}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-primary hover:underline flex items-center justify-between">
                  <span>{t("viewAllOpps")}</span>
                  <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </Card>
            ),
            modelHealth: (
              <Card {...dragProps("row2", "modelHealth")} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{t("aiModelHealth")}</h2>
                  <DragHandle />
                </div>
                <div className="space-y-2">
                  {models.map((m) => (
                    <div key={m.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <span className="text-xs flex-1 truncate">{m.name}</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] h-5">{t("healthy")}</Badge>
                      <span className="text-xs font-semibold tabular-nums w-10 text-end">{fmt(m.pct)}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate(lp("/aiot/forecast-failures"))}
                  className="mt-3 pt-2 border-t border-border w-full text-xs text-primary hover:underline flex items-center justify-between">
                  <span>{t("viewModelDetails")}</span>
                  <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </Card>
            ),
          };
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {order.row2.map((id) => <div key={id}>{cards[id]}</div>)}
            </div>
          );
        })()}

        {/* Row 3 — draggable */}
        {(() => {
          const cards: Record<string, { node: JSX.Element; span: string }> = {
            recommendedActions: {
              span: "lg:col-span-2",
              node: (
                <Card {...dragProps("row3", "recommendedActions")} className="p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">{t("aiRecommendedActions")} <span className="text-muted-foreground font-normal">({t("topPriority")})</span></h2>
                    <DragHandle />
                  </div>
                  <div className="space-y-2">
                    {actions.map((a, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 py-2 border-b border-border last:border-0">
                        <Badge variant="outline" className={`${levelBadge(a.levelTone)} text-[10px] h-5`}>{a.level}</Badge>
                        <span className="text-xs font-semibold min-w-[120px]">{a.asset}</span>
                        <span className="text-xs text-muted-foreground flex-1 min-w-[160px]">{a.action}</span>
                        <span className="text-[11px] text-muted-foreground">{t("impact")}: {a.impact}</span>
                        {a.primary ? (
                          <Button size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/work-orders/new"))}>
                            <ClipboardList className="h-3.5 w-3.5" /> {t("createWorkOrder")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate(lp("/work-orders"))}>
                            {t("assign")}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))}
                    className="mt-3 pt-2 border-t border-border w-full text-xs text-primary hover:underline flex items-center justify-between">
                    <span>{t("viewAllRecs")}</span>
                    <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                  </button>
                </Card>
              ),
            },
            coPilot: {
              span: "lg:col-span-1",
              node: (
                <Card {...dragProps("row3", "coPilot")} className="p-4 flex flex-col transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-violet-500" />
                    <h2 className="font-semibold text-sm flex-1">{t("coPilot")} <span className="text-muted-foreground font-normal">({t("quickAsk")})</span></h2>
                    <DragHandle />
                  </div>
                  <button onClick={() => navigate(lp("/aiot/co-pilot"))}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground hover:border-primary/50">
                    <span className="flex-1 text-start truncate">{t("copilotPlaceholder")}</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    {[t("whyAtRisk"), t("showAnomalies"), t("whatCausedEnergy"), t("createWeekly")].map((q) => (
                      <button key={q} onClick={() => navigate(lp("/aiot/co-pilot"))}
                        className="text-xs text-start px-3 py-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-muted/40 truncate">
                        {q}
                      </button>
                    ))}
                  </div>
                </Card>
              ),
            },
          };
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {order.row3.map((id) => {
                const c = cards[id]; if (!c) return null;
                return <div key={id} className={c.span}>{c.node}</div>;
              })}
            </div>
          );
        })()}

        {/* Custom widgets — added via Add Widget */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{t("customWidgets")}</h2>
              {customWidgets.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5">{fmt(customWidgets.length)}</Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> {t("addWidget")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-64">
                <DropdownMenuLabel>{t("widgetCatalog")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {([
                  { type: "stat" as const, icon: Hash, name: t("wKpi"), desc: t("wKpiDesc") },
                  { type: "line" as const, icon: LineChart, name: t("wLine"), desc: t("wLineDesc") },
                  { type: "bar" as const, icon: BarChart3, name: t("wBar"), desc: t("wBarDesc") },
                  { type: "donut" as const, icon: PieChart, name: t("wDonut"), desc: t("wDonutDesc") },
                  { type: "table" as const, icon: TableIcon, name: t("wTable"), desc: t("wTableDesc") },
                  { type: "text" as const, icon: Type, name: t("wText"), desc: t("wTextDesc") },
                ]).map((w) => (
                  <DropdownMenuItem key={w.type} onSelect={() => addCustomWidget(w.type)} className="gap-2 py-2 cursor-pointer">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <w.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{w.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{w.desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {customWidgets.length === 0 ? (
            <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
              <LayoutGrid className="h-8 w-8 opacity-50" />
              <p className="text-xs max-w-sm">{t("noCustom")}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customWidgets.map((w) => (
                <Card key={w.id} {...dragProps("custom", w.id)} className="p-4 transition-shadow hover:shadow-md animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                      {w.type === "stat" && <Hash className="h-4 w-4" />}
                      {w.type === "line" && <LineChart className="h-4 w-4" />}
                      {w.type === "bar" && <BarChart3 className="h-4 w-4" />}
                      {w.type === "donut" && <PieChart className="h-4 w-4" />}
                      {w.type === "table" && <TableIcon className="h-4 w-4" />}
                      {w.type === "text" && <Type className="h-4 w-4" />}
                    </span>
                    <h3 className="font-semibold text-sm flex-1 truncate">{w.title}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigWidgetId(w.id)} aria-label="Configure">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCustomWidget(w.id)} aria-label={t("removeWidget")}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <DragHandle />
                  </div>
                  {renderCustomWidget(w)}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Widget configuration side panel */}
      <Sheet open={!!editingWidget} onOpenChange={(o) => !o && setConfigWidgetId(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {editingWidget && (
            <>
              <SheetHeader>
                <SheetTitle>{language === "fa" ? "پیکربندی ویجت" : language === "ar" ? "ضبط العنصر" : "Configure Widget"}</SheetTitle>
                <SheetDescription>
                  {language === "fa" ? "منبع داده و معیار مورد نظر را انتخاب کنید." : language === "ar" ? "حدد مصدر البيانات والمقياس." : "Select data source and metric for this widget."}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-5">
                <div>
                  <Label className="text-sm">{language === "fa" ? "عنوان" : language === "ar" ? "العنوان" : "Title"}</Label>
                  <Input value={editingWidget.title} onChange={(e) => updateCustomWidget(editingWidget.id, { title: e.target.value })} className="mt-1.5" />
                </div>

                {editingWidget.type !== "text" && (
                  <div>
                    <Label className="text-sm">{language === "fa" ? "منبع داده" : language === "ar" ? "مصدر البيانات" : "Data Source"}</Label>
                    <Select value={editingWidget.dataSourceId} onValueChange={(v) => {
                      const src = findDataSource(v);
                      updateCustomWidget(editingWidget.id, {
                        dataSourceId: v,
                        metricKey: src.metrics[0].key,
                        metricKeys: editingWidget.type === "table" ? src.metrics.slice(0, 3).map((m) => m.key) : undefined,
                        dimensionKey: src.dimensions[0]?.key,
                      });
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                {(editingWidget.type === "stat" || editingWidget.type === "line") && editingWidget.dataSourceId && (
                  <div>
                    <Label className="text-sm">{language === "fa" ? "معیار" : language === "ar" ? "المقياس" : "Metric"}</Label>
                    <Select value={editingWidget.metricKey} onValueChange={(v) => updateCustomWidget(editingWidget.id, { metricKey: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {findDataSource(editingWidget.dataSourceId).metrics.map((m) => (
                          <SelectItem key={m.key} value={m.key}>{m.label}{m.unit ? ` (${m.unit})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(editingWidget.type === "bar" || editingWidget.type === "donut") && editingWidget.dataSourceId && (
                  <div>
                    <Label className="text-sm">{language === "fa" ? "گروه‌بندی بر اساس" : language === "ar" ? "تجميع حسب" : "Group by"}</Label>
                    <Select value={editingWidget.dimensionKey} onValueChange={(v) => updateCustomWidget(editingWidget.id, { dimensionKey: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {findDataSource(editingWidget.dataSourceId).dimensions.map((d) => (
                          <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editingWidget.type === "table" && editingWidget.dataSourceId && (
                  <div>
                    <Label className="text-sm">{language === "fa" ? "ستون‌ها" : language === "ar" ? "الأعمدة" : "Columns"}</Label>
                    <div className="mt-2 space-y-1.5 border border-border rounded-md p-2">
                      {findDataSource(editingWidget.dataSourceId).metrics.map((m) => {
                        const checked = editingWidget.metricKeys?.includes(m.key);
                        return (
                          <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={(e) => {
                                const cur = new Set(editingWidget.metricKeys || []);
                                if (e.target.checked) cur.add(m.key); else cur.delete(m.key);
                                updateCustomWidget(editingWidget.id, { metricKeys: Array.from(cur) });
                              }}
                            />
                            {m.label}{m.unit ? ` (${m.unit})` : ""}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editingWidget.type === "text" && (
                  <div>
                    <Label className="text-sm">{language === "fa" ? "متن" : language === "ar" ? "النص" : "Text"}</Label>
                    <textarea
                      value={editingWidget.text || ""}
                      onChange={(e) => updateCustomWidget(editingWidget.id, { text: e.target.value })}
                      rows={6}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-3 border-t border-border">
                  <Button variant="outline" className="text-destructive" onClick={() => { removeCustomWidget(editingWidget.id); setConfigWidgetId(null); }}>
                    <X className="h-4 w-4 mr-1.5" />{t("removeWidget")}
                  </Button>
                  <Button onClick={() => setConfigWidgetId(null)}>
                    {language === "fa" ? "اعمال" : language === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>

  );
};

export default ManagersDashboard;
