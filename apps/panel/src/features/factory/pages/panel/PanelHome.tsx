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
  Wrench as Operations,
} from "lucide-react";
import { useGetWorkspaceAlarmsQuery, type WorkspaceAlarmItem } from "@paapeli/api";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useDashboards } from "@/features/factory/hooks/useDashboards";
import { useWorkOrders } from "@/features/factory/hooks/useWorkOrders";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { queryLoad, usePageLoad } from "@/shared/hooks/usePageLoad";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { LoadingOverlay } from "@/shared/components/LoadingOverlay";

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

  thingsNeedAttention: { en: "Things Need Attention", ar: "أمور تحتاج اهتمامًا", fa: "موارد نیازمند توجه" },
  recentActivity: { en: "Recent Activity", ar: "النشاط الأخير", fa: "فعالیت اخیر" },
  viewAll: { en: "View all", ar: "عرض الكل", fa: "مشاهده همه" },
  viewAllActivity: { en: "View all activity", ar: "عرض كل النشاط", fa: "مشاهده همه فعالیت‌ها" },

  noData: { en: "No data", ar: "لا توجد بيانات", fa: "فاقد دیتا" },
};

/* "Needs attention" = an alarm nobody has acknowledged yet. The gateway's
   statuses are ThingsBoard's: ACTIVE_UNACK, ACTIVE_ACK, CLEARED_UNACK,
   CLEARED_ACK — so anything cleared, or already acknowledged, is out. */
const isUnacknowledged = (a: WorkspaceAlarmItem) => {
  const s = a.status?.toUpperCase() ?? "";
  return !s.startsWith("CLEARED") && s !== "ACTIVE_ACK";
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  MAJOR: "bg-orange-500",
  MINOR: "bg-amber-500",
  WARNING: "bg-amber-500",
};
const severityDot = (severity?: string) => SEVERITY_DOT[severity?.toUpperCase() ?? ""] ?? "bg-blue-500";

/** "5 minutes ago" in the panel's language — nothing of our own to translate. */
const timeAgo = (iso: string, lang: Lang): string => {
  const at = new Date(iso).getTime();
  if (!at) return "";
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const minutes = Math.floor(Math.max(0, Date.now() - at) / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
};

/** How many rows the Attention card shows before "View all". */
const ATTENTION_ROWS = 5;

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

/* Same grid as the page below — summary cards, then two rows of panels — so
   the swap to real content doesn't shift. */
const OverviewSkeleton = () => (
  <div className="relative">
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border bg-card p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg lg:col-span-2" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
    <LoadingOverlay />
  </div>
);

export default function PanelHome() {
  const { language, formatNumber, isRTL } = useLanguage();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const tr = (k: keyof typeof D) => D[k][language as Lang];
  const fn = (n: number) => formatNumber(n);
  const noDataText = tr("noData");

  const { items: devices, load: devicesLoad, noWorkspace, refetch: refetchDevices } = useDevices();
  const { items: dashboards } = useDashboards();
  const { items: workOrders } = useWorkOrders();

  /* Alarms for this workspace product — the Attention card lists the
     unacknowledged ones, and the alarm count below is how many there are. */
  const workspaceId = useWorkspaceId();
  const alarmsQuery = useGetWorkspaceAlarmsQuery(workspaceId ?? "", PRODUCT_KEY);
  const { data: alarms, isLoading: alarmsLoading } = alarmsQuery;
  const attention = useMemo(
    () => (alarms ?? [])
      .filter(isUnacknowledged)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [alarms],
  );
  const alarmsPending = alarmsLoading || !workspaceId;

  /* The page's counts come from devices and alarms; until both are in it shows
     a skeleton rather than zeros, and if either can't load it offers a retry. */
  const alarmsLoad = queryLoad(alarmsQuery);
  const pageLoad = usePageLoad({
    loading: devicesLoad.loading || alarmsLoad.loading || noWorkspace,
    failed: devicesLoad.failed || alarmsLoad.failed,
    onRetry: () => {
      if (devicesLoad.failed) void refetchDevices();
      if (alarmsLoad.failed) void alarmsQuery.refetch();
    },
  });

  /* --- Counts from sources of truth ---
     Assets, locations, dashboards, work orders and alarms come from real
     sources. AI findings and OTA campaigns were counted off mock catalogues —
     there are no endpoints for them, so they read `null` and the cards show
     "no data" instead of a number that looks measured. */
  const assetCount = devices.length;
  const locationCount = useMemo(countLocations, [devices.length]); // recompute occasionally
  const openWorkOrders = workOrders.filter(
    (w) => w.status === "Open" || w.status === "In Progress",
  ).length;
  const dashboardCount = dashboards.length;

  // Null only while the list is still loading, so the tile says "no data"
  // rather than a zero it hasn't confirmed.
  const activeAlarmCount: number | null = alarmsPending ? null : attention.length;
  const aiFindings: number | null = null;
  const otaCampaigns: number | null = null;

  // Summary cards — key system counts only. A null value has no source yet.
  const summary: { key: string; icon: typeof Box; value: number | null; label: string; sub: string; color: string; bg: string; to: string }[] = [
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
    { icon: Bell, label: tr("alarms"), sub: activeAlarmCount === null ? noDataText : `${fn(activeAlarmCount)} ${tr("active")}`, to: "/alarms", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { icon: Sparkles, label: tr("aiAnalytics"), sub: aiFindings === null ? noDataText : `${fn(aiFindings)} ${tr("findings")}`, to: "/aiot/analyze-trends", color: "text-fuchsia-600", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30" },
    { icon: Upload, label: tr("ota"), sub: otaCampaigns === null ? noDataText : `${fn(otaCampaigns)} ${tr("campaigns")}`, to: "/firmware", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { icon: Operations, label: tr("operations"), sub: `${fn(openWorkOrders)} ${tr("workOrders")}`, to: "/work-orders", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
  ];

  /* Activity and System Health had no source at all: the five rows in each
     were written by hand (asset names, "2 min ago", every service green) and
     re-rendered identically on every visit. They stay as empty panels until
     there is a feed behind them. Attention now reads real alarms. */
  const Chevron = () => <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 ${isRTL ? "rotate-180" : ""}`} />;

  if (pageLoad.status === "loading") return <OverviewSkeleton />;
  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  return (
    <>
      {/* data-uniform-type: the page is written in Tailwind steps and
          should read at those steps in every language. Without it the
          unscoped [lang="fa"]/[lang="ar"] rules in src/index.css set the
          title to 1.74rem and every section heading with it. */}
      <div data-uniform-type className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
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
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {s.value === null ? <NoDataValue /> : fn(s.value)}
              </div>
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
            <NoData size="sm" />
          </Card>
        </div>

        {/* Attention + Activity */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 text-start">{tr("thingsNeedAttention")}</h2>
            {/* Unacknowledged alarms, newest first. Each row opens the Alarms page. */}
            {attention.length === 0 ? (
              !alarmsPending && <NoData size="sm" />
            ) : (
              <div className="space-y-1">
                {attention.slice(0, ATTENTION_ROWS).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(lp("/alarms"))}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted/40"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot(a.severity)}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{a.alarmName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {a.deviceName ? `${a.deviceName} · ${timeAgo(a.createdAt, language as Lang)}` : timeAgo(a.createdAt, language as Lang)}
                      </span>
                    </span>
                    <Chevron />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 text-center">
              <button onClick={() => navigate(lp("/alarms"))} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                {tr("viewAll")} <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 text-start">{tr("recentActivity")}</h2>
            <NoData size="sm" />
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
