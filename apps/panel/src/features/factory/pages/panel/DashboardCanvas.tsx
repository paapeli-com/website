import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useDashboards } from "@/features/factory/hooks/useDashboards";
import {
  useDashboardCanvas,
  Widget,
  resolveCollisions,
  snapPosition,
  GRID_COLS,
} from "@/features/factory/hooks/useDashboardCanvas";
import {
  DATA_SOURCES,
  findDataSource,
  getKPI,
  getSeries,
  getBreakdown,
  getTable,
  WidgetKind,
} from "@/features/factory/lib/dashboardData";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Card } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/features/factory/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import {
  Plus,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
  Trash2,
  Settings2,
  GripVertical,
  LayoutGrid,
  LineChart as LineIcon,
  BarChart3,
  PieChart,
  Table as TableIcon,
  Type as TextIcon,
  Gauge,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Calendar,
  ChevronUp,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { localizedPath } from "@/features/factory/lib/localizedPath";

type Lang = "en" | "ar" | "fa";

const T: Record<string, Record<Lang, string>> = {
  notFound: { en: "Dashboard not found", ar: "لم يتم العثور على لوحة التحكم", fa: "داشبورد یافت نشد" },
  back: { en: "Back to dashboards", ar: "العودة إلى لوحات التحكم", fa: "بازگشت به داشبوردها" },
  addWidget: { en: "Add Widget", ar: "إضافة عنصر", fa: "افزودن ویجت" },
  fullscreen: { en: "Fullscreen", ar: "ملء الشاشة", fa: "تمام صفحه" },
  exitFullscreen: { en: "Exit Fullscreen", ar: "إنهاء ملء الشاشة", fa: "خروج از تمام صفحه" },
  refresh: { en: "Refresh", ar: "تحديث", fa: "به‌روزرسانی" },
  refreshInterval: { en: "Refresh", ar: "تحديث", fa: "تازه‌سازی" },
  timeRange: { en: "Time", ar: "النطاق الزمني", fa: "بازه زمانی" },
  resetLayout: { en: "Reset layout", ar: "إعادة تعيين التخطيط", fa: "بازنشانی چیدمان" },
  saveLayout: { en: "Layout saved", ar: "تم حفظ التخطيط", fa: "چیدمان ذخیره شد" },
  kpi: { en: "KPI", ar: "مؤشر أداء", fa: "شاخص کلیدی" },
  line: { en: "Line Chart", ar: "مخطط خطي", fa: "نمودار خطی" },
  bar: { en: "Bar Chart", ar: "مخطط أعمدة", fa: "نمودار میله‌ای" },
  donut: { en: "Donut Chart", ar: "مخطط حلقي", fa: "نمودار حلقوی" },
  table: { en: "Table", ar: "جدول", fa: "جدول" },
  text: { en: "Text / Note", ar: "نص / ملاحظة", fa: "متن / یادداشت" },
  config: { en: "Configure Widget", ar: "ضبط العنصر", fa: "پیکربندی ویجت" },
  configDesc: { en: "Select data source, metric and size.", ar: "حدد مصدر البيانات والمقياس والحجم.", fa: "منبع داده، معیار و اندازه را انتخاب کنید." },
  title: { en: "Title", ar: "العنوان", fa: "عنوان" },
  dataSource: { en: "Data Source", ar: "مصدر البيانات", fa: "منبع داده" },
  metric: { en: "Metric", ar: "المقياس", fa: "معیار" },
  metrics: { en: "Metrics (columns)", ar: "المقاييس (الأعمدة)", fa: "معیارها (ستون‌ها)" },
  dimension: { en: "Group by", ar: "تجميع حسب", fa: "گروه‌بندی بر اساس" },
  size: { en: "Size", ar: "الحجم", fa: "اندازه" },
  width: { en: "Width", ar: "العرض", fa: "عرض" },
  height: { en: "Height", ar: "الارتفاع", fa: "ارتفاع" },
  remove: { en: "Remove", ar: "إزالة", fa: "حذف" },
  apply: { en: "Apply", ar: "تطبيق", fa: "اعمال" },
  noWidgets: { en: "No widgets yet. Click Add Widget to get started.", ar: "لا توجد عناصر بعد. انقر فوق إضافة عنصر للبدء.", fa: "هنوز ویجتی نیست. برای شروع روی افزودن ویجت کلیک کنید." },
  manual: { en: "Manual", ar: "يدوي", fa: "دستی" },
  every30s: { en: "Every 30s", ar: "كل 30 ثانية", fa: "هر ۳۰ ثانیه" },
  every1m: { en: "Every 1m", ar: "كل دقيقة", fa: "هر ۱ دقیقه" },
  every5m: { en: "Every 5m", ar: "كل 5 دقائق", fa: "هر ۵ دقیقه" },
  every15m: { en: "Every 15m", ar: "كل 15 دقيقة", fa: "هر ۱۵ دقیقه" },
  last1h: { en: "Last 1h", ar: "آخر ساعة", fa: "۱ ساعت اخیر" },
  last24h: { en: "Last 24h", ar: "آخر 24 ساعة", fa: "۲۴ ساعت اخیر" },
  last7d: { en: "Last 7d", ar: "آخر 7 أيام", fa: "۷ روز اخیر" },
  last30d: { en: "Last 30d", ar: "آخر 30 يومًا", fa: "۳۰ روز اخیر" },
  dashboards: { en: "Dashboards", ar: "لوحات التحكم", fa: "داشبوردها" },
  textPh: { en: "Type your note here...", ar: "اكتب ملاحظتك هنا...", fa: "یادداشت خود را اینجا بنویسید..." },
  autoUpdated: { en: "Auto updated", ar: "تم التحديث تلقائياً", fa: "به‌روزرسانی خودکار" },
  justNow: { en: "just now", ar: "الآن", fa: "هم اکنون" },
  off: { en: "Off", ar: "إيقاف", fa: "خاموش" },
  hideToolbar: { en: "Hide toolbar", ar: "إخفاء شريط الأدوات", fa: "پنهان کردن نوار ابزار" },
  showToolbar: { en: "Show toolbar", ar: "إظهار شريط الأدوات", fa: "نمایش نوار ابزار" },
  editSettings: { en: "Edit settings", ar: "تعديل الإعدادات", fa: "تنظیمات" },
};

const WIDGET_CATALOG: { kind: WidgetKind; titleKey: string; icon: any; w: number; h: number }[] = [
  { kind: "kpi", titleKey: "kpi", icon: Gauge, w: 3, h: 2 },
  { kind: "line", titleKey: "line", icon: LineIcon, w: 6, h: 4 },
  { kind: "bar", titleKey: "bar", icon: BarChart3, w: 6, h: 4 },
  { kind: "donut", titleKey: "donut", icon: PieChart, w: 4, h: 4 },
  { kind: "table", titleKey: "table", icon: TableIcon, w: 6, h: 4 },
  { kind: "text", titleKey: "text", icon: TextIcon, w: 4, h: 2 },
];

const ROW_H = 84;
const GAP = 12;

/* ============== Mini chart renderers ============== */

const MiniLine = ({ data, color = "hsl(var(--primary))" }: { data: { x: string; y: number }[]; color?: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.y));
  const min = Math.min(...data.map((d) => d.y));
  const r = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.y - min) / r) * 90 - 5}`).join(" ");
  const area = `0,100 ${pts} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const MiniBar = ({ data, color = "hsl(var(--primary))" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className="flex items-end justify-around h-full w-full gap-2 px-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <div className="text-[10px] text-muted-foreground">{d.value}</div>
          <div className="w-full rounded-t-sm" style={{ height: `${(d.value / max) * 80}%`, background: color }} />
          <div className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const MiniDonut = ({ data }: { data: { label: string; value: number }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const palette = ["hsl(var(--primary))", "#0077B6", "#10b981", "#f59e0b", "#ef4444"];
  let acc = 0;
  const r = 35;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center justify-center gap-3 h-full w-full">
      <svg viewBox="0 0 100 100" className="h-full max-h-32">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 50 50)"
            />
          );
          acc += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1 text-xs">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: palette[i % palette.length] }} />
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============== Widget renderer ============== */

const WidgetBody = ({ w, refreshKey }: { w: Widget; refreshKey: number }) => {
  const salt = `${refreshKey}`;
  if (w.kind === "kpi") {
    const k = getKPI(w.dataSourceId, w.metricKey || "", salt);
    const up = k.change >= 0;
    return (
      <div className="flex flex-col justify-between h-full p-1">
        <div>
          <div className="text-3xl font-bold text-foreground">
            {k.value.toLocaleString()}
            {k.unit && <span className="text-base ml-1 text-muted-foreground">{k.unit}</span>}
          </div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(k.change)}% vs prev
          </div>
        </div>
        <div className="h-10 -mx-1 opacity-80">
          <MiniLine data={getSeries(w.dataSourceId, w.metricKey || "", 16, salt)} />
        </div>
      </div>
    );
  }
  if (w.kind === "line") {
    return <div className="h-full"><MiniLine data={getSeries(w.dataSourceId, w.metricKey || "", 24, salt)} /></div>;
  }
  if (w.kind === "bar") {
    return <div className="h-full"><MiniBar data={getBreakdown(w.dataSourceId, w.dimensionKey, salt)} /></div>;
  }
  if (w.kind === "donut") {
    return <MiniDonut data={getBreakdown(w.dataSourceId, w.dimensionKey, salt)} />;
  }
  if (w.kind === "table") {
    const t = getTable(w.dataSourceId, w.metricKeys || [], salt);
    return (
      <div className="h-full overflow-auto text-xs">
        <table className="w-full">
          <thead className="text-muted-foreground border-b border-border sticky top-0 bg-card">
            <tr>{t.columns.map((c) => <th key={c} className="text-left font-medium py-1.5 px-2">{c}</th>)}</tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                {r.map((cell, j) => <td key={j} className="py-1.5 px-2 text-foreground">{typeof cell === "number" ? cell.toLocaleString() : cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (w.kind === "text") {
    return <div className="text-sm text-foreground whitespace-pre-wrap p-1">{w.text || ""}</div>;
  }
  return null;
};

/* ============== Page ============== */

const REFRESH_OPTS = [
  { v: "manual", k: "manual", ms: 0 },
  { v: "30s", k: "every30s", ms: 30_000 },
  { v: "1m", k: "every1m", ms: 60_000 },
  { v: "5m", k: "every5m", ms: 300_000 },
  { v: "15m", k: "every15m", ms: 900_000 },
];
const TIME_OPTS = [
  { v: "1h", k: "last1h" },
  { v: "24h", k: "last24h" },
  { v: "7d", k: "last7d" },
  { v: "30d", k: "last30d" },
];

const DashboardCanvas = () => {
  const { language } = useLanguage();
  const lang = language as Lang;
  const tt = (k: string) => T[k]?.[lang] ?? k;
  const navigate = useNavigate();
  const params = useParams<{ id: string; lang?: string }>();
  const lp = (p: string) => localizedPath(p, language);
  const { items } = useDashboards();
  const dashboard = useMemo(() => items.find((d) => d.id === params.id), [items, params.id]);

  const { widgets, addWidget, updateWidget, removeWidget, setAll, resetLayout } = useDashboardCanvas(params.id || "default");

  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState("manual");
  const [timeRange, setTimeRange] = useState("24h");
  const [fullscreen, setFullscreen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh
  useEffect(() => {
    const opt = REFRESH_OPTS.find((r) => r.v === refreshInterval);
    if (!opt || opt.ms === 0) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), opt.ms);
    return () => clearInterval(id);
  }, [refreshInterval]);

  // Fullscreen
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    else document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
  };
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Drag & resize state
  const [dragging, setDragging] = useState<null | { id: string; mode: "move" | "resize"; startX: number; startY: number; origin: Widget; cellW: number }>(null);
  const [ghost, setGhost] = useState<null | { x: number; y: number; w: number; h: number }>(null);

  const getCellW = () => {
    const el = containerRef.current?.querySelector<HTMLElement>("[data-grid]");
    if (!el) return 80;
    return (el.clientWidth - GAP * (GRID_COLS - 1)) / GRID_COLS;
  };

  const onPointerDownMove = (e: React.PointerEvent, w: Widget) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging({ id: w.id, mode: "move", startX: e.clientX, startY: e.clientY, origin: w, cellW: getCellW() });
    setGhost({ x: w.x, y: w.y, w: w.w, h: w.h });
  };
  const onPointerDownResize = (e: React.PointerEvent, w: Widget) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging({ id: w.id, mode: "resize", startX: e.clientX, startY: e.clientY, origin: w, cellW: getCellW() });
    setGhost({ x: w.x, y: w.y, w: w.w, h: w.h });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    const cellX = (dragging.cellW + GAP);
    const cellY = (ROW_H + GAP);
    if (dragging.mode === "move") {
      const nx = dragging.origin.x + dx / cellX;
      const ny = dragging.origin.y + dy / cellY;
      const snap = snapPosition(nx, ny, dragging.origin.w);
      setGhost({ x: snap.x, y: snap.y, w: dragging.origin.w, h: dragging.origin.h });
    } else {
      const nw = Math.max(2, Math.min(GRID_COLS - dragging.origin.x, Math.round(dragging.origin.w + dx / cellX)));
      const nh = Math.max(2, Math.round(dragging.origin.h + dy / cellY));
      setGhost({ x: dragging.origin.x, y: dragging.origin.y, w: nw, h: nh });
    }
  };
  const onPointerUp = () => {
    if (!dragging || !ghost) { setDragging(null); setGhost(null); return; }
    const next = widgets.map((w) => (w.id === dragging.id ? { ...w, x: ghost.x, y: ghost.y, w: ghost.w, h: ghost.h } : w));
    const resolved = resolveCollisions(next, dragging.id);
    setAll(resolved);
    setDragging(null);
    setGhost(null);
    toast.success(tt("saveLayout"));
  };

  const totalRows = useMemo(() => widgets.reduce((m, w) => Math.max(m, w.y + w.h), 6), [widgets]);
  const editing = widgets.find((w) => w.id === configId) || null;

  if (!dashboard) {
    return (
      <>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{tt("notFound")}</p>
          <Button onClick={() => navigate(lp("/dashboard"))}>{tt("back")}</Button>
        </div>
      </>
    );
  }

  const handleAddFromCatalog = (kind: WidgetKind) => {
    const cat = WIDGET_CATALOG.find((c) => c.kind === kind)!;
    const src = DATA_SOURCES[0];
    addWidget({
      kind,
      title: tt(cat.titleKey),
      w: cat.w,
      h: cat.h,
      dataSourceId: src.id,
      metricKey: src.metrics[0].key,
      metricKeys: kind === "table" ? src.metrics.slice(0, 3).map((m) => m.key) : undefined,
      dimensionKey: kind === "donut" || kind === "bar" ? src.dimensions[0].key : undefined,
      text: kind === "text" ? "" : undefined,
    });
  };

  const body = (
    <>
      {/* Header / toolbar — aligned with predefined AI Managers dashboard */}
      <div className={`mb-4 ${fullscreen ? "px-4 pt-3" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            {!fullscreen && (
              <Breadcrumb className="mb-2">
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink onClick={() => navigate(lp("/dashboard"))} className="cursor-pointer">{tt("dashboards")}</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>{dashboard.name}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(lp("/dashboard"))} aria-label={tt("back")}>
                <ArrowLeft className={`h-4 w-4 ${language === "ar" || language === "fa" ? "rotate-180" : ""}`} />
              </Button>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">{dashboard.name}</h1>
              {dashboard.category && <Badge variant="secondary" className="font-normal">{dashboard.category}</Badge>}
            </div>
          </div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setToolbarCollapsed((v) => !v)}
                  aria-label={toolbarCollapsed ? tt("showToolbar") : tt("hideToolbar")}
                >
                  {toolbarCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{toolbarCollapsed ? tt("showToolbar") : tt("hideToolbar")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {!toolbarCollapsed && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-auto min-w-[150px] text-xs gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{TIME_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{tt(o.k)}</SelectItem>)}</SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">{tt("autoUpdated")} {tt("justNow")}</span>
            </div>

            <div className="flex items-center gap-2 ms-auto">
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="h-9 w-[150px]">
                  <RefreshCw className="h-3.5 w-3.5 me-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{REFRESH_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{tt(o.k)}</SelectItem>)}</SelectContent>
              </Select>

              <TooltipProvider delayDuration={150}>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setRefreshKey((k) => k + 1)} aria-label={tt("refresh")}><RefreshCw className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent>{tt("refresh")}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={resetLayout} aria-label={tt("resetLayout")}><RotateCcw className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent>{tt("resetLayout")}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleFullscreen} aria-label={fullscreen ? tt("exitFullscreen") : tt("fullscreen")}>
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent>{fullscreen ? tt("exitFullscreen") : tt("fullscreen")}</TooltipContent></Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <LayoutGrid className="h-4 w-4" />
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{tt("addWidget")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover w-56">
                  <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {WIDGET_CATALOG.map((c) => (
                    <DropdownMenuItem key={c.kind} onClick={() => handleAddFromCatalog(c.kind)}>
                      <c.icon className="h-4 w-4 mr-2" /> {tt(c.titleKey)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider delayDuration={150}>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(lp(`/dashboard/${dashboard.id}/edit`))} aria-label={tt("editSettings")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent>{tt("editSettings")}</TooltipContent></Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div
        data-grid
        className="relative w-full"
        style={{ minHeight: `${totalRows * (ROW_H + GAP)}px`, backgroundSize: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} + ${GAP}px) ${ROW_H + GAP}px`, backgroundImage: dragging ? "linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.4) 1px, transparent 1px)" : undefined }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{tt("noWidgets")}</p>
            </div>
          </div>
        )}
        {widgets.map((w) => {
          const isDragged = dragging?.id === w.id && ghost;
          const x = isDragged ? ghost!.x : w.x;
          const y = isDragged ? ghost!.y : w.y;
          const ww = isDragged ? ghost!.w : w.w;
          const hh = isDragged ? ghost!.h : w.h;
          const style: React.CSSProperties = {
            position: "absolute",
            left: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${x} + ${GAP * x}px)`,
            top: `${y * (ROW_H + GAP)}px`,
            width: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${ww} + ${GAP * (ww - 1)}px)`,
            height: `${hh * ROW_H + GAP * (hh - 1)}px`,
            transition: isDragged ? "none" : "left 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease",
            zIndex: isDragged ? 30 : 1,
          };
          return (
            <Card key={w.id} style={style} className="overflow-hidden flex flex-col group">
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border bg-card">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onPointerDown={(e) => onPointerDownMove(e, w)}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                    aria-label="Drag"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-foreground truncate">{w.title}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">{findDataSource(w.dataSourceId).label}</Badge>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigId(w.id)}><Settings2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeWidget(w.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-hidden">
                <WidgetBody w={w} refreshKey={refreshKey} />
              </div>
              {/* Resize handle */}
              <div
                onPointerDown={(e) => onPointerDownResize(e, w)}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none opacity-0 group-hover:opacity-100"
                aria-label="Resize"
              >
                <svg viewBox="0 0 16 16" className="w-full h-full text-muted-foreground"><path d="M2 14 L14 2 M6 14 L14 6 M10 14 L14 10" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
              </div>
            </Card>
          );
        })}

        {/* Ghost / drop target preview */}
        {dragging && ghost && (
          <div
            className="absolute rounded-md border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
            style={{
              left: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${ghost.x} + ${GAP * ghost.x}px)`,
              top: `${ghost.y * (ROW_H + GAP)}px`,
              width: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${ghost.w} + ${GAP * (ghost.w - 1)}px)`,
              height: `${ghost.h * ROW_H + GAP * (ghost.h - 1)}px`,
              zIndex: 20,
            }}
          />
        )}
      </div>

      {/* Configure widget */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setConfigId(null)}>
        <SheetContent side={language === "fa" || language === "ar" ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto" dir={language === "fa" || language === "ar" ? "rtl" : "ltr"}>
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>{tt("config")}</SheetTitle>
                <SheetDescription>{tt("configDesc")}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-5">
                <div>
                  <Label className="text-sm">{tt("title")}</Label>
                  <Input value={editing.title} onChange={(e) => updateWidget(editing.id, { title: e.target.value })} className="mt-1.5" />
                </div>

                {editing.kind !== "text" && (
                  <div>
                    <Label className="text-sm">{tt("dataSource")}</Label>
                    <Select value={editing.dataSourceId} onValueChange={(v) => {
                      const src = findDataSource(v);
                      updateWidget(editing.id, {
                        dataSourceId: v,
                        metricKey: src.metrics[0].key,
                        metricKeys: editing.kind === "table" ? src.metrics.slice(0, 3).map((m) => m.key) : undefined,
                        dimensionKey: src.dimensions[0]?.key,
                      });
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                {(editing.kind === "kpi" || editing.kind === "line") && (
                  <div>
                    <Label className="text-sm">{tt("metric")}</Label>
                    <Select value={editing.metricKey} onValueChange={(v) => updateWidget(editing.id, { metricKey: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {findDataSource(editing.dataSourceId).metrics.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(editing.kind === "donut" || editing.kind === "bar") && (
                  <div>
                    <Label className="text-sm">{tt("dimension")}</Label>
                    <Select value={editing.dimensionKey} onValueChange={(v) => updateWidget(editing.id, { dimensionKey: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {findDataSource(editing.dataSourceId).dimensions.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editing.kind === "table" && (
                  <div>
                    <Label className="text-sm">{tt("metrics")}</Label>
                    <div className="mt-2 space-y-1.5 border border-border rounded-md p-2">
                      {findDataSource(editing.dataSourceId).metrics.map((m) => {
                        const checked = editing.metricKeys?.includes(m.key);
                        return (
                          <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={(e) => {
                                const cur = new Set(editing.metricKeys || []);
                                if (e.target.checked) cur.add(m.key); else cur.delete(m.key);
                                updateWidget(editing.id, { metricKeys: Array.from(cur) });
                              }}
                            />
                            {m.label}{m.unit ? ` (${m.unit})` : ""}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editing.kind === "text" && (
                  <div>
                    <Label className="text-sm">{tt("text")}</Label>
                    <textarea
                      value={editing.text || ""}
                      onChange={(e) => updateWidget(editing.id, { text: e.target.value })}
                      rows={6}
                      placeholder={tt("textPh")}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">{tt("width")}</Label>
                    <Select value={String(editing.w)} onValueChange={(v) => updateWidget(editing.id, { w: parseInt(v) })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{[2, 3, 4, 6, 8, 12].map((n) => <SelectItem key={n} value={String(n)}>{n}/12</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">{tt("height")}</Label>
                    <Select value={String(editing.h)} onValueChange={(v) => updateWidget(editing.id, { h: parseInt(v) })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{[2, 3, 4, 5, 6, 8].map((n) => <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-3 border-t border-border">
                  <Button variant="outline" className="text-destructive" onClick={() => { removeWidget(editing.id); setConfigId(null); }}>
                    <Trash2 className="h-4 w-4 me-1.5" />{tt("remove")}
                  </Button>
                  <Button onClick={() => setConfigId(null)}>{tt("apply")}</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );

  if (fullscreen) {
    return (
      <div ref={containerRef} className="min-h-screen bg-background overflow-auto">
        {body}
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef}>{body}</div>
    </>
  );
};

export default DashboardCanvas;
