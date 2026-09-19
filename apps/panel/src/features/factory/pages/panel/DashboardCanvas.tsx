import { useEffect, useMemo, useRef, useState } from "react";
import { useGetWorkspaceAlarmsQuery, type WorkspaceAlarmItem } from "@paapeli/api";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useDashboards } from "@/features/factory/hooks/useDashboards";
import {
  useDashboardCanvas,
  Widget,
  resolveCollisions,
  packLayout,
  snapPosition,
  GRID_COLS,
} from "@/features/factory/hooks/useDashboardCanvas";
import {
  findDataSource,
  getKPI,
  getSeries,
  getBreakdown,
  getTable,
  DataSource,
  MetricOption,
  TableData,
  WidgetKind,
} from "@/features/factory/lib/dashboardData";
import {
  EnergySourceFields,
  energyBucketRows,
  energyMetric,
  isEnergyWidget,
  missingEnergySetting,
  toEnergyIntervals,
} from "@/features/factory/components/dashboard/EnergySource";
import {
  ALERTS_SOURCE_ID,
  isAlertsWidget,
  DEVICES_SOURCE_ID,
  DeviceSourceFields,
  ENERGY_SOURCE_ID,
  fmtDateTime,
  fmtDayTime,
  fmtTimeTick,
  isDeviceWidget,
  noDataSpans,
  rangeToHours,
  sliceTelemetry,
  sourcesForKind,
  toBucketRows,
  toKPI,
  toReadingsTable,
  toSeries,
  toTimeRows,
  useDeviceTelemetry,
  utcOffsetLabel,
  widgetTelemetryKeys,
} from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ReferenceArea, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { useDevices } from "@/features/factory/hooks/useDevices";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
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
  Table as TableIcon,
  PieChart,
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
import { TopoBackdrop } from "@/shared/components/TopoBackdrop";

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
  noWidgets: { en: "This dashboard has no charts yet. Add one to start visualizing your data.", ar: "لا تحتوي لوحة التحكم هذه على مخططات بعد. أضف مخططاً لبدء عرض بياناتك.", fa: "این داشبورد هنوز نموداری ندارد. برای نمایش داده‌هایتان یک نمودار اضافه کنید." },
  createFirstChart: { en: "Create your first chart", ar: "أنشئ مخططك الأول", fa: "اولین نمودار خود را بسازید" },
  addChart: { en: "Add chart", ar: "إضافة مخطط", fa: "افزودن نمودار" },
  manual: { en: "Manual", ar: "يدوي", fa: "دستی" },
  every30s: { en: "Every 30s", ar: "كل 30 ثانية", fa: "هر ۳۰ ثانیه" },
  every1m: { en: "Every 1m", ar: "كل دقيقة", fa: "هر ۱ دقیقه" },
  every5m: { en: "Every 5m", ar: "كل 5 دقائق", fa: "هر ۵ دقیقه" },
  every15m: { en: "Every 15m", ar: "كل 15 دقيقة", fa: "هر ۱۵ دقیقه" },
  every1h: { en: "Every 1h", ar: "كل ساعة", fa: "هر ۱ ساعت" },
  last15m: { en: "Last 15m", ar: "آخر 15 دقيقة", fa: "۱۵ دقیقه اخیر" },
  noData: { en: "No data", ar: "لا توجد بيانات", fa: "بدون داده" },
  to: { en: "to", ar: "إلى", fa: "تا" },
  energyReading: { en: "Reading type", ar: "نوع القراءة", fa: "نوع داده کنتور" },
  readingKwh: { en: "Energy counter (kWh)", ar: "عداد الطاقة (kWh)", fa: "شمارنده انرژی (kWh)" },
  readingWh: { en: "Energy counter (Wh)", ar: "عداد الطاقة (Wh)", fa: "شمارنده انرژی (Wh)" },
  readingKw: { en: "Power (kW)", ar: "القدرة (kW)", fa: "توان (kW)" },
  readingW: { en: "Power (W)", ar: "القدرة (W)", fa: "توان (W)" },
  tariff: { en: "Price per kWh", ar: "سعر كل kWh", fa: "قیمت هر kWh" },
  currency: { en: "Currency", ar: "العملة", fa: "واحد پول" },
  co2Factor: { en: "CO₂ per kWh (kg)", ar: "CO₂ لكل kWh (كغ)", fa: "CO₂ هر kWh (کیلوگرم)" },
  needTariff: { en: "Set a price per kWh in the widget settings", ar: "أدخل سعر كل kWh في إعدادات العنصر", fa: "قیمت هر kWh را در تنظیمات ویجت وارد کنید" },
  needCo2: { en: "Set CO₂ per kWh in the widget settings", ar: "أدخل كمية CO₂ لكل kWh في إعدادات العنصر", fa: "مقدار CO₂ هر kWh را در تنظیمات ویجت وارد کنید" },
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
  device: { en: "Device", ar: "الجهاز", fa: "دستگاه" },
  selectDevice: { en: "Select a device", ar: "اختر جهازًا", fa: "یک دستگاه انتخاب کنید" },
  noDevices: { en: "No devices", ar: "لا توجد أجهزة", fa: "دستگاهی وجود ندارد" },
  telemetryKey: { en: "Telemetry", ar: "القياس", fa: "تله‌متری" },
  noTelemetry: { en: "No telemetry in this time range", ar: "لا توجد قياسات في هذه الفترة", fa: "در این بازه تله‌متری وجود ندارد" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…", fa: "در حال بارگذاری…" },
  time: { en: "Time", ar: "الوقت", fa: "زمان" },
  removeWidgetQ: { en: "Remove widget?", ar: "إزالة العنصر؟", fa: "ویجت حذف شود؟" },
  removeWidgetPre: { en: "This will remove", ar: "سيؤدي هذا إلى إزالة", fa: "ویجت" },
  removeWidgetPost: {
    en: "from this dashboard. This action cannot be undone.",
    ar: "من لوحة التحكم هذه. لا يمكن التراجع عن هذا الإجراء.",
    fa: "از این داشبورد حذف می‌شود. این عمل قابل بازگشت نیست.",
  },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  widgetRemoved: { en: "Widget removed", ar: "تمت إزالة العنصر", fa: "ویجت حذف شد" },
  seriesMetrics: { en: "Metrics", ar: "المقاييس", fa: "معیارها" },
  selectMetric: { en: "Select at least one metric", ar: "اختر مقياسًا واحدًا على الأقل", fa: "حداقل یک معیار انتخاب کنید" },
};

/* A donut can only be fed by the Alerts source, so it starts there (see
   handleAddFromCatalog); every other kind starts on Devices. */
const WIDGET_CATALOG: { kind: WidgetKind; titleKey: string; icon: any; w: number; h: number }[] = [
  { kind: "kpi", titleKey: "kpi", icon: Gauge, w: 3, h: 2 },
  { kind: "line", titleKey: "line", icon: LineIcon, w: 6, h: 4 },
  { kind: "bar", titleKey: "bar", icon: BarChart3, w: 6, h: 4 },
  { kind: "donut", titleKey: "donut", icon: PieChart, w: 4, h: 4 },
  { kind: "table", titleKey: "table", icon: TableIcon, w: 6, h: 4 },
  { kind: "text", titleKey: "text", icon: TextIcon, w: 4, h: 2 },
];

/** A widget that shows real data: device telemetry, an energy meter, alarm
 *  counts, or text. Everything else renders the generated mock data in
 *  lib/dashboardData. */
const isRealWidget = (w: Widget) =>
  w.kind === "text" ||
  isDeviceWidget(w.kind, w.dataSourceId) ||
  isEnergyWidget(w.kind, w.dataSourceId) ||
  isAlertsWidget(w.kind, w.dataSourceId);

const ROW_H = 84;
const GAP = 12;
/** Grid size of the "Add chart" tile shown in the canvas's free space. */
const ADD_TILE_W = 4;
const ADD_TILE_H = 2;

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

const SERIES_COLORS = ["hsl(var(--primary))", "#0077B6", "#10b981", "#f59e0b", "#ef4444"];
const AXIS_TEXT = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
// ReferenceArea renders these SVG props, but Recharts 3's typings drop them.
const NO_DATA_FILL = { fill: "hsl(var(--muted-foreground))", fillOpacity: 0.08, stroke: "none" } as Record<string, unknown>;
const SELECTION_FILL = { fill: "hsl(var(--primary))", fillOpacity: 0.15, stroke: "hsl(var(--primary))", strokeOpacity: 0.4 } as Record<string, unknown>;

type ChartSeries = { key: string; label: string };
type ChartRow = Record<string, string | number>;

interface WidgetChartProps {
  kind: "line" | "bar";
  rows: ChartRow[];
  series: ChartSeries[];
  /** "t" rows carry ms timestamps; "label" rows carry category names. */
  xKey: "t" | "label";
  xLabel: string;
  yLabel?: string;
  /** Time window [start, end] in ms. The time axis spans all of it, so a
   *  device that stopped reporting doesn't look current. */
  timeWindow?: [number, number];
  /** Stretches of the window with no readings, shaded and labelled. */
  noData?: [number, number][];
  noDataLabel?: string;
  /** IANA zone the time axis and tooltip are shown in. */
  timeZone?: string;
  /** Called with [from, to] in ms when a stretch of a time chart is selected. */
  onZoom?: (from: number, to: number) => void;
}

/* Line / bar chart with labelled axes, a hover tooltip and, once there is more
   than one series, a legend. Always LTR: time and numbers read left to right.
   On a time axis, dragging across the chart selects a stretch to zoom to; on a
   bar chart a single click zooms to that bar's slice. */
const WidgetChart = ({ kind, rows, series, xKey, xLabel, yLabel, timeWindow, noData, noDataLabel, timeZone, onZoom }: WidgetChartProps) => {
  const isTime = xKey === "t";
  const numericX = isTime && kind === "line";
  const times = isTime ? rows.map((r) => Number(r.t)) : [];
  const span = timeWindow ? timeWindow[1] - timeWindow[0] : times.length ? times[times.length - 1] - times[0] : 0;
  const tickFormatter = isTime ? fmtTimeTick(span, timeZone) : undefined;

  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const zoomable = isTime && !!onZoom && rows.length > 1;
  // A bar stands for a whole slice, so a selection ends where its last slice does.
  const sliceMs = !numericX && times.length > 1 ? times[1] - times[0] : 0;
  const pointerTime = (state: any) => {
    const t = Number(state?.activeLabel);
    return state?.activeLabel === undefined || !Number.isFinite(t) ? undefined : t;
  };
  const zoomHandlers = zoomable
    ? {
        onMouseDown: (state: any) => {
          const t = pointerTime(state);
          if (t !== undefined) setSelection({ from: t, to: t });
        },
        onMouseMove: (state: any) => {
          const t = pointerTime(state);
          if (t !== undefined) setSelection((s) => (s ? { ...s, to: t } : s));
        },
        onMouseUp: () => {
          if (selection) {
            const from = Math.min(selection.from, selection.to);
            const to = Math.max(selection.from, selection.to) + sliceMs;
            if (to > from) onZoom!(from, to);
          }
          setSelection(null);
        },
        onMouseLeave: () => setSelection(null),
      }
    : {};
  const selectionArea = selection && selection.from !== selection.to ? (
    <ReferenceArea
      {...SELECTION_FILL}
      x1={Math.min(selection.from, selection.to)}
      x2={Math.max(selection.from, selection.to)}
      ifOverflow="hidden"
      zIndex={0}
    />
  ) : null;

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />;
  const xAxis = (
    <XAxis
      dataKey={xKey}
      type={numericX ? "number" : "category"}
      scale={numericX ? "time" : "auto"}
      domain={numericX ? timeWindow ?? ["dataMin", "dataMax"] : undefined}
      allowDataOverflow={numericX && !!timeWindow}
      tickFormatter={tickFormatter}
      tick={AXIS_TEXT}
      tickLine={false}
      axisLine={{ stroke: "hsl(var(--border))" }}
      minTickGap={16}
      height={34}
      label={{ value: xLabel, position: "insideBottom", ...AXIS_TEXT }}
    />
  );
  const yAxis = (
    <YAxis
      width={yLabel ? 58 : 44}
      tick={AXIS_TEXT}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v: number) => compactNumber.format(v)}
      label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, ...AXIS_TEXT } : undefined}
    />
  );
  const tooltip = (
    <RTooltip
      labelFormatter={(v) => (isTime ? fmtDateTime(Number(v), timeZone) : String(v))}
      contentStyle={{ fontSize: 12, borderRadius: 8, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
    />
  );
  const legend = series.length > 1 ? <Legend verticalAlign="top" height={22} iconSize={8} wrapperStyle={{ fontSize: 11 }} /> : null;
  const margin = { top: 6, right: 12, bottom: 0, left: 0 };

  return (
    <div className={`h-full w-full ${zoomable ? "cursor-crosshair select-none" : ""}`} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "line" ? (
          <AreaChart data={rows} margin={margin} {...zoomHandlers}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}{selectionArea}
            {numericX && noData?.map(([x1, x2]) => (
              <ReferenceArea
                key={`${x1}-${x2}`}
                {...NO_DATA_FILL}
                x1={x1}
                x2={x2}
                ifOverflow="hidden"
                zIndex={0}
                // Only label a stretch wide enough to hold the words.
                label={span && (x2 - x1) / span > 0.15 ? { value: noDataLabel, position: "center" as const, ...AXIS_TEXT } : undefined}
              />
            ))}
            {series.map((s, i) => {
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={color}
                  fill={color}
                  fillOpacity={series.length > 1 ? 0.06 : 0.12}
                  strokeWidth={1.75}
                  dot={rows.length === 1}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </AreaChart>
        ) : (
          <BarChart data={rows} margin={margin} {...zoomHandlers}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}{selectionArea}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const MiniDonut = ({ data }: { data: { label: string; value: number }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const palette = SERIES_COLORS;
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
              key={`${d.label}-${i}`}
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
          <div key={`${d.label}-${i}`} className="flex items-center gap-2">
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

const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center px-2">{children}</div>
);

/* `change` is optional: a total over the dashboard's window has no earlier
   window to compare with, so it shows the value alone. */
const KpiView = ({ value, unit, change, series }: { value: number; unit?: string; change?: number; series: { x: string; y: number }[] }) => {
  const up = (change ?? 0) >= 0;
  return (
    <div className="flex flex-col justify-between h-full p-1">
      <div>
        <div className="text-3xl font-bold text-foreground">
          {value.toLocaleString()}
          {unit && <span className="text-base ml-1 text-muted-foreground">{unit}</span>}
        </div>
        {change !== undefined && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(change)}% vs prev
          </div>
        )}
      </div>
      <div className="h-10 -mx-1 opacity-80">
        <MiniLine data={series} />
      </div>
    </div>
  );
};

const TableView = ({ t }: { t: TableData }) => (
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

/** The dashboard's time settings, as every widget needs them. */
interface TimeView {
  /** A toolbar option, or "custom" while zoomed. */
  range: string;
  /** The zoomed-in [from, to] in ms, if any. */
  zoom: [number, number] | null;
  /** Lookback, in hours, to fetch from the history API. */
  hours: number;
  timeZone: string;
  onZoom: (from: number, to: number) => void;
}

/* The dashboard's refresh button / interval bumps refreshKey; refetch on every
   bump after the first render. */
const useRefetchOnRefresh = (refreshKey: number, enabled: boolean, refetch: () => unknown) => {
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (enabled) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
};

/* The [start, end] a telemetry widget shows: the zoomed-in stretch, or the
   chosen range ending when the data was fetched ("now" as of the last
   refresh), capped at what the history API returns. */
const telemetryWindow = (view: TimeView, fetchedAt: number): [number, number] => {
  if (view.zoom) return view.zoom;
  const end = fetchedAt || Date.now();
  return [end - Math.min(RANGE_MS[view.range] ?? RANGE_MS["24h"], view.hours * 3_600_000), end];
};

/* Any widget bound to one device's telemetry from the history API. */
const DeviceBody = ({ w, view, refreshKey, tt }: { w: Widget; view: TimeView; refreshKey: number; tt: (k: string) => string }) => {
  const { timeZone } = view;
  const timeLabel = `${tt("time")} (${utcOffsetLabel(timeZone)})`;
  const { data: fetched, dataUpdatedAt, isLoading, refetch } = useDeviceTelemetry(w.deviceId, view.hours);
  useRefetchOnRefresh(refreshKey, !!w.deviceId, refetch);
  const [start, end] = telemetryWindow(view, dataUpdatedAt);
  const data = useMemo(() => sliceTelemetry(fetched, start, end), [fetched, start, end]);
  const series = useMemo(() => toSeries(w.telemetryKey ? data?.[w.telemetryKey] : undefined), [data, w.telemetryKey]);
  const keys = widgetTelemetryKeys(w) ?? [];
  const keysId = keys.join("|");
  const rows = useMemo(
    () => (w.kind === "line" ? toTimeRows(data, keys) : w.kind === "bar" ? toBucketRows(data, keys, start, end) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, w.kind, keysId, start, end],
  );

  if (!w.deviceId) return <Hint>{tt("selectDevice")}</Hint>;
  if (isLoading) return <Hint>{tt("loading")}</Hint>;

  if (w.kind === "table") {
    const t = toReadingsTable(data, keys, timeLabel, timeZone);
    if (keys.length === 0 || t.rows.length === 0) return <Hint>{tt("noTelemetry")}</Hint>;
    return <TableView t={t} />;
  }

  if (w.kind === "line" || w.kind === "bar") {
    if (rows.length === 0) return <Hint>{tt("noTelemetry")}</Hint>;
    // Only keys that actually have numeric readings get a series.
    const plotted = keys.filter((k) => rows.some((r) => k in r));
    return (
      <WidgetChart
        kind={w.kind}
        rows={rows}
        series={plotted.map((k) => ({ key: k, label: k }))}
        xKey="t"
        xLabel={timeLabel}
        yLabel={plotted.length === 1 ? plotted[0] : undefined}
        timeZone={timeZone}
        timeWindow={[start, end]}
        noData={w.kind === "line" ? noDataSpans(rows.map((r) => r.t), start, end) : undefined}
        noDataLabel={tt("noData")}
        onZoom={view.onZoom}
      />
    );
  }

  if (series.length === 0) return <Hint>{tt("noTelemetry")}</Hint>;
  // MiniLine needs two points to draw a segment.
  const points = series.length === 1 ? [series[0], series[0]] : series;
  return <KpiView {...toKPI(series)} series={points} />;
};

/* ---- Alerts source: counts of the workspace's alarms ----
   Severity is grouped the way the Alarms page ranks it (apiSeverityToUi):
   CRITICAL → Critical, MAJOR/MINOR → Warning, anything else → Info. "Open"
   is an alarm that hasn't been cleared. An alarm belongs to the window its
   creation time falls in. */

type AlertGroup = "Critical" | "Warning" | "Info";
const ALERT_GROUPS: AlertGroup[] = ["Critical", "Warning", "Info"];

const alertGroup = (a: WorkspaceAlarmItem): AlertGroup => {
  const s = a.severity?.toUpperCase();
  if (s === "CRITICAL") return "Critical";
  if (s === "MAJOR" || s === "MINOR" || s === "WARNING") return "Warning";
  return "Info";
};

const isOpenAlarm = (a: WorkspaceAlarmItem) => !a.status?.toUpperCase().startsWith("CLEARED");

/** Whether an alarm counts toward one of the Alerts source's metrics. */
const matchesAlertMetric = (a: WorkspaceAlarmItem, metricKey: string) => {
  switch (metricKey) {
    case "critical": return alertGroup(a) === "Critical";
    case "warning": return alertGroup(a) === "Warning";
    case "info": return alertGroup(a) === "Info";
    case "open": return isOpenAlarm(a);
    default: return true;
  }
};

const alarmTime = (a: WorkspaceAlarmItem) => new Date(a.createdAt).getTime();

/** Per-bucket counts of `alarms` over [start, end), split into `n` equal buckets. */
const bucketCounts = (alarms: WorkspaceAlarmItem[], start: number, end: number, n: number) => {
  const step = (end - start) / n;
  const counts = Array.from({ length: n }, () => 0);
  for (const a of alarms) {
    const t = alarmTime(a);
    if (t < start || t >= end) continue;
    counts[Math.min(n - 1, Math.floor((t - start) / step))]++;
  }
  return { step, counts };
};

const AlertsBody = ({ w, view, refreshKey, tt }: { w: Widget; view: TimeView; refreshKey: number; tt: (k: string) => string }) => {
  const { timeZone } = view;
  const workspaceId = useWorkspaceId();
  const { data, dataUpdatedAt, isLoading, isError, refetch } = useGetWorkspaceAlarmsQuery(workspaceId ?? "", PRODUCT_KEY);
  useRefetchOnRefresh(refreshKey, !!workspaceId, refetch);

  // Not capped like telemetry: the alarm list isn't limited to a lookback.
  const end = view.zoom ? view.zoom[1] : dataUpdatedAt || Date.now();
  const start = view.zoom ? view.zoom[0] : end - (RANGE_MS[view.range] ?? RANGE_MS["24h"]);
  const alarms = data ?? [];
  const inWindow = useMemo(
    () => alarms.filter((a) => { const t = alarmTime(a); return t >= start && t < end; }),
    [alarms, start, end],
  );

  const src = findDataSource(ALERTS_SOURCE_ID);
  const metricsFor = (keys: string[]) => src.metrics.filter((m) => keys.includes(m.key));

  if (!workspaceId || isLoading) return <Hint>{tt("loading")}</Hint>;
  if (isError) return <Hint>{tt("noData")}</Hint>;

  if (w.kind === "kpi") {
    const key = w.metricKey || src.metrics[0].key;
    const matching = alarms.filter((a) => matchesAlertMetric(a, key));
    const value = inWindow.filter((a) => matchesAlertMetric(a, key)).length;
    // Change against the window of the same length just before this one.
    const span = end - start;
    const prev = matching.filter((a) => { const t = alarmTime(a); return t >= start - span && t < start; }).length;
    const change = prev > 0 ? Math.round(((value - prev) / prev) * 1000) / 10 : undefined;
    const { counts } = bucketCounts(matching, start, end, 12);
    return <KpiView value={value} change={change} series={counts.map((y, i) => ({ x: `${i + 1}`, y }))} />;
  }

  if (w.kind === "line") {
    const metrics = metricsFor(widgetMetricKeys(w));
    if (metrics.length === 0) return <Hint>{tt("selectMetric")}</Hint>;
    const n = 24;
    const perMetric = metrics.map((m) => bucketCounts(alarms.filter((a) => matchesAlertMetric(a, m.key)), start, end, n));
    const step = (end - start) / n;
    const rows = Array.from({ length: n }, (_, i) => {
      const row: ChartRow = { t: start + i * step };
      metrics.forEach((m, j) => { row[m.key] = perMetric[j].counts[i]; });
      return row;
    });
    return (
      <WidgetChart
        kind="line"
        rows={rows}
        series={metrics.map((m) => ({ key: m.key, label: m.label }))}
        xKey="t"
        xLabel={`${tt("time")} (${utcOffsetLabel(timeZone)})`}
        yLabel={metrics.length === 1 ? metrics[0].label : undefined}
        timeZone={timeZone}
        timeWindow={[start, end]}
        onZoom={view.onZoom}
      />
    );
  }

  if (w.kind === "bar") {
    const metrics = metricsFor(widgetMetricKeys(w));
    if (metrics.length === 0) return <Hint>{tt("selectMetric")}</Hint>;
    const rows = ALERT_GROUPS.map((group) => {
      const row: ChartRow = { label: group };
      metrics.forEach((m) => {
        row[m.key] = inWindow.filter((a) => alertGroup(a) === group && matchesAlertMetric(a, m.key)).length;
      });
      return row;
    });
    return (
      <WidgetChart
        kind="bar"
        rows={rows}
        series={metrics.map((m) => ({ key: m.key, label: m.label }))}
        xKey="label"
        xLabel={src.dimensions[0].label}
        yLabel={metrics.length === 1 ? metrics[0].label : undefined}
      />
    );
  }

  if (w.kind === "donut") {
    // "Open" narrows the split to open alarms; the severity metrics would each
    // leave a single slice, so they split every alarm in the window instead.
    const pool = w.metricKey === "open" ? inWindow.filter(isOpenAlarm) : inWindow;
    const slices = ALERT_GROUPS.map((group) => ({ label: group, value: pool.filter((a) => alertGroup(a) === group).length }));
    if (slices.every((s) => s.value === 0)) return <Hint>{tt("noData")}</Hint>;
    return <MiniDonut data={slices} />;
  }

  if (w.kind === "table") {
    const metrics = metricsFor(w.metricKeys ?? []);
    if (metrics.length === 0) return <Hint>{tt("selectMetric")}</Hint>;
    return (
      <TableView
        t={{
          columns: [src.dimensions[0].label, ...metrics.map((m) => m.label)],
          rows: ALERT_GROUPS.map((group) => [
            group,
            ...metrics.map((m) => inWindow.filter((a) => alertGroup(a) === group && matchesAlertMetric(a, m.key)).length),
          ]),
        }}
      />
    );
  }

  return null;
};

/* A widget on the Energy source: one meter's readings turned into consumption,
   peak demand, cost and CO₂ over the dashboard's window (see EnergySource). */
const EnergyBody = ({ w, view, refreshKey, tt }: { w: Widget; view: TimeView; refreshKey: number; tt: (k: string) => string }) => {
  const { timeZone } = view;
  const { data: fetched, dataUpdatedAt, isLoading, refetch } = useDeviceTelemetry(w.deviceId, view.hours);
  useRefetchOnRefresh(refreshKey, !!w.deviceId, refetch);
  const [start, end] = telemetryWindow(view, dataUpdatedAt);
  const reading = w.energyReading ?? "kwh";
  const series = useMemo(
    () => toSeries(w.telemetryKey ? sliceTelemetry(fetched, start, end)?.[w.telemetryKey] : undefined),
    [fetched, start, end, w.telemetryKey],
  );
  const intervals = useMemo(() => toEnergyIntervals(series, reading), [series, reading]);

  if (!w.deviceId) return <Hint>{tt("selectDevice")}</Hint>;
  if (isLoading) return <Hint>{tt("loading")}</Hint>;
  if (intervals.length === 0) return <Hint>{tt("noTelemetry")}</Hint>;

  const settings = { tariff: w.tariff, co2Factor: w.co2Factor };
  const src = findDataSource(ENERGY_SOURCE_ID);
  // Cost is in whatever currency the tariff was entered in.
  const unitOf = (m: MetricOption) => (m.key === "cost" ? w.currency || m.unit : m.unit);
  const labelOf = (m: MetricOption) => `${m.label}${unitOf(m) ? ` (${unitOf(m)})` : ""}`;
  const timeLabel = `${tt("time")} (${utcOffsetLabel(timeZone)})`;

  if (w.kind === "kpi") {
    const m = src.metrics.find((x) => x.key === w.metricKey) ?? src.metrics[0];
    const missing = missingEnergySetting(m.key, settings);
    if (missing) return <Hint>{tt(missing)}</Hint>;
    const spark = energyBucketRows(intervals, [m.key], settings, start, end, 16)
      .flatMap((r) => (m.key in r ? [{ x: String(r.t), y: r[m.key] }] : []));
    return <KpiView value={energyMetric(intervals, m.key, settings)!} unit={unitOf(m)} series={spark.length === 1 ? [spark[0], spark[0]] : spark} />;
  }

  const chosen = src.metrics.filter((m) => widgetMetricKeys(w).includes(m.key));
  if (chosen.length === 0) return <Hint>{tt("selectMetric")}</Hint>;
  const usable = chosen.filter((m) => !missingEnergySetting(m.key, settings));
  if (usable.length === 0) return <Hint>{tt(missingEnergySetting(chosen[0].key, settings)!)}</Hint>;
  const keys = usable.map((m) => m.key);

  if (w.kind === "table") {
    // One row per slice of the window, newest first, skipping empty slices.
    const slices = energyBucketRows(intervals, keys, settings, start, end, 24).filter((r) => keys.some((k) => k in r)).reverse();
    return (
      <TableView
        t={{
          columns: [timeLabel, ...usable.map(labelOf)],
          rows: slices.map((r) => [fmtDayTime(r.t, timeZone), ...keys.map((k) => (k in r ? r[k] : "—"))]),
        }}
      />
    );
  }

  const rows = energyBucketRows(intervals, keys, settings, start, end, w.kind === "line" ? 48 : 12);
  const units = [...new Set(usable.map((m) => unitOf(m) || ""))];
  const yLabel = usable.length === 1 ? labelOf(usable[0]) : units.length === 1 && units[0] ? units[0] : undefined;
  return (
    <WidgetChart
      kind={w.kind === "line" ? "line" : "bar"}
      rows={rows}
      series={usable.map((m) => ({ key: m.key, label: labelOf(m) }))}
      xKey="t"
      xLabel={timeLabel}
      yLabel={yLabel}
      timeZone={timeZone}
      timeWindow={[start, end]}
      noData={w.kind === "line" ? noDataSpans(series.map((p) => Number(p.x)), start, end) : undefined}
      noDataLabel={tt("noData")}
      onZoom={view.onZoom}
    />
  );
};

const RANGE_MS: Record<string, number> = { "15m": 900_000, "1h": 3_600_000, "24h": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000 };

/** The metrics a mock-source line / bar / table plots. Older line and bar
 *  widgets saved a single `metricKey`, which is read as a one-metric list. */
const widgetMetricKeys = (w: Widget) => w.metricKeys ?? (w.metricKey ? [w.metricKey] : []);
const metricLabel = (m: MetricOption) => `${m.label}${m.unit ? ` (${m.unit})` : ""}`;
/** The metrics a new widget, or one moved to another source, starts with. */
const initialMetricKeys = (kind: WidgetKind, src: DataSource) =>
  kind === "table" ? src.metrics.slice(0, 3).map((m) => m.key) : kind === "line" || kind === "bar" ? [src.metrics[0].key] : undefined;

const WidgetBody = ({ w, refreshKey, view, tt }: { w: Widget; refreshKey: number; view: TimeView; tt: (k: string) => string }) => {
  const salt = `${refreshKey}`;
  const { range, zoom, timeZone } = view;
  if (isDeviceWidget(w.kind, w.dataSourceId)) {
    return <DeviceBody w={w} view={view} refreshKey={refreshKey} tt={tt} />;
  }
  if (isEnergyWidget(w.kind, w.dataSourceId)) {
    return <EnergyBody w={w} view={view} refreshKey={refreshKey} tt={tt} />;
  }
  if (isAlertsWidget(w.kind, w.dataSourceId)) {
    return <AlertsBody w={w} view={view} refreshKey={refreshKey} tt={tt} />;
  }
  if (w.kind === "kpi") {
    const k = getKPI(w.dataSourceId, w.metricKey || "", salt);
    return <KpiView value={k.value} unit={k.unit} change={k.change} series={getSeries(w.dataSourceId, w.metricKey || "", 16, salt)} />;
  }
  if (w.kind === "line" || w.kind === "bar") {
    const src = findDataSource(w.dataSourceId);
    const chosen = widgetMetricKeys(w);
    const metrics = src.metrics.filter((m) => chosen.includes(m.key));
    if (metrics.length === 0) return <Hint>{tt("selectMetric")}</Hint>;
    const series = metrics.map((m) => ({ key: m.key, label: metricLabel(m) }));
    const units = [...new Set(metrics.map((m) => m.unit || ""))];
    const yLabel = metrics.length === 1 ? metricLabel(metrics[0]) : units.length === 1 && units[0] ? units[0] : undefined;

    if (w.kind === "line") {
      // Mock points are spread evenly over the zoomed stretch, or over the
      // dashboard's time range ending now.
      const n = 24;
      const end = zoom ? zoom[1] : Math.floor(Date.now() / 60_000) * 60_000;
      const step = (zoom ? zoom[1] - zoom[0] : RANGE_MS[range] ?? RANGE_MS["24h"]) / (n - 1);
      const perMetric = metrics.map((m) => getSeries(w.dataSourceId, m.key, n, salt));
      const rows = Array.from({ length: n }, (_, i) => {
        const row: ChartRow = { t: end - (n - 1 - i) * step };
        metrics.forEach((m, j) => { row[m.key] = perMetric[j][i].y; });
        return row;
      });
      return <WidgetChart kind="line" rows={rows} series={series} xKey="t" xLabel={`${tt("time")} (${utcOffsetLabel(timeZone)})`} yLabel={yLabel} timeZone={timeZone} onZoom={view.onZoom} />;
    }

    const dim = src.dimensions.find((d) => d.key === w.dimensionKey) ?? src.dimensions[0];
    const perMetric = metrics.map((m) => getBreakdown(w.dataSourceId, dim.key, salt, m.key));
    const rows = dim.values.map((label, i) => {
      const row: ChartRow = { label };
      metrics.forEach((m, j) => { row[m.key] = perMetric[j][i].value; });
      return row;
    });
    return <WidgetChart kind="bar" rows={rows} series={series} xKey="label" xLabel={dim.label} yLabel={yLabel} />;
  }
  if (w.kind === "donut") {
    return <MiniDonut data={getBreakdown(w.dataSourceId, w.dimensionKey, salt, w.metricKey)} />;
  }
  if (w.kind === "table") {
    return <TableView t={getTable(w.dataSourceId, w.metricKeys || [], salt)} />;
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
  { v: "1h", k: "every1h", ms: 3_600_000 },
];
const TIME_OPTS = [
  { v: "15m", k: "last15m" },
  { v: "1h", k: "last1h" },
  { v: "24h", k: "last24h" },
  { v: "7d", k: "last7d" },
  { v: "30d", k: "last30d" },
];

/* The dashboard's settings page saves its own wording ("Every 30 seconds",
   "Last 24 Hours"); built-in dashboards save the short codes the toolbar uses.
   Both map onto a toolbar option, so the saved settings are what a dashboard
   opens with. */
const SETTING_REFRESH: Record<string, string> = {
  Manual: "manual",
  "Every 30 seconds": "30s",
  "Every minute": "1m",
  "Every 5 minutes": "5m",
  "Every 15 minutes": "15m",
  "Every hour": "1h",
};
const SETTING_TIME_RANGE: Record<string, string> = {
  "Last 15 minutes": "15m",
  "Last hour": "1h",
  "Last 24 Hours": "24h",
  "Last 7 Days": "7d",
  "Last 30 Days": "30d",
};
const refreshFromSetting = (v?: string) =>
  v && REFRESH_OPTS.some((o) => o.v === v) ? v : SETTING_REFRESH[v ?? ""] ?? "manual";
/* Falls back to the last hour, which is also what a new dashboard is created
   with (see DashboardForm's EMPTY_FORM). A dashboard that saved a wider range
   on purpose still opens on it — this only covers one that saved nothing. */
const rangeFromSetting = (v?: string) =>
  v && TIME_OPTS.some((o) => o.v === v) ? v : SETTING_TIME_RANGE[v ?? ""] ?? "1h";

/* Times are shown in the reader's zone: Tehran for Persian, Qatar for Arabic,
   UTC for English. UTC is also what every dashboard's settings start with, so
   it can't be told apart from a deliberate choice; any other zone picked in
   the settings is a deliberate choice and wins. */
const LANGUAGE_TIME_ZONE: Record<Lang, string> = { en: "UTC", fa: "Asia/Tehran", ar: "Asia/Qatar" };
const SETTING_TIME_ZONE: Record<string, string> = {
  "(UTC+03:30) Tehran": "Asia/Tehran",
  "(UTC+03:00) Riyadh": "Asia/Riyadh",
  "(UTC-05:00) Eastern Time": "America/New_York",
  "(UTC+01:00) Central European Time": "Europe/Berlin",
};
const timeZoneFor = (lang: Lang, setting?: string) =>
  SETTING_TIME_ZONE[setting ?? ""] ?? LANGUAGE_TIME_ZONE[lang] ?? "UTC";

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

  /* Layouts saved before mock sources were removed (including the old seeded
     sample charts) still hold mock widgets. Drop them from the stored layout
     and close the holes they leave, so a dashboard with nothing real left
     opens on the empty state. */
  useEffect(() => {
    if (widgets.some((w) => !isRealWidget(w))) setAll(packLayout(widgets.filter(isRealWidget)));
  }, [widgets, setAll]);
  const { items: devices } = useDevices();
  const sourceLabel = (w: Widget) => {
    if (w.dataSourceId === DEVICES_SOURCE_ID && w.deviceId) {
      const d = devices.find((x) => x.id === w.deviceId);
      if (d) return d.label || d.name;
    }
    return findDataSource(w.dataSourceId).label;
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(() => refreshFromSetting(dashboard?.refreshInterval));
  const [timeRange, setTimeRange] = useState(() => rangeFromSetting(dashboard?.timeRange));
  const timeZone = timeZoneFor(lang, dashboard?.timezone);
  // A stretch selected on a chart. While set, every widget shows it and the
  // time dropdown reads "custom"; picking any preset clears it.
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const zoomTo = (from: number, to: number) => {
    setZoom([from, to]);
    setTimeRange("custom");
  };
  const chooseTimeRange = (v: string) => {
    if (v === "custom") return;
    setZoom(null);
    setTimeRange(v);
  };
  const view: TimeView = {
    range: timeRange,
    zoom,
    // Fetch far enough back to cover the zoomed stretch (the API allows 1 to 24 hours).
    hours: zoom ? Math.min(24, Math.max(1, Math.ceil((Date.now() - zoom[0]) / 3_600_000))) : rangeToHours(timeRange),
    timeZone,
    onZoom: zoomTo,
  };
  const zoomLabel = zoom
    ? (() => {
        const from = fmtDayTime(zoom[0], timeZone);
        const to = fmtDayTime(zoom[1], timeZone);
        // Same day: show the date once, e.g. "09/14 14:05 to 16:30".
        return `${from} ${tt("to")} ${from.slice(0, 5) === to.slice(0, 5) ? to.slice(6) : to}`;
      })()
    : "";
  // Open with the dashboard's saved settings, and pick them up again if they
  // change. The toolbar can still override them for this visit.
  useEffect(() => {
    if (!dashboard) return;
    setRefreshInterval(refreshFromSetting(dashboard.refreshInterval));
    setTimeRange(rangeFromSetting(dashboard.timeRange));
    setZoom(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.id, dashboard?.refreshInterval, dashboard?.timeRange]);
  const [fullscreen, setFullscreen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Widget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // The toolbar is sticky. A 1px sentinel sits right above it: once that
  // scrolls out of the page's scroll container the bar is pinned, and gets a
  // divider so widgets don't slide under it unmarked.
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const hasDashboard = !!dashboard;
  useEffect(() => {
    const el = toolbarSentinelRef.current;
    if (!el) { setToolbarStuck(false); return; }
    let root = el.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    const io = new IntersectionObserver(([entry]) => setToolbarStuck(!entry.isIntersecting), { root });
    io.observe(el);
    return () => io.disconnect();
  }, [toolbarCollapsed, fullscreen, hasDashboard]);

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

  /* Where the "Add chart" tile goes: the first gap, in reading order, that
     fits it — otherwise the row below everything. */
  const addSpot = useMemo(() => {
    const [w, h] = [ADD_TILE_W, ADD_TILE_H];
    const taken = (x: number, y: number) =>
      widgets.some((o) => x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y);
    for (let y = 0; ; y++) {
      for (let x = 0; x + w <= GRID_COLS; x++) if (!taken(x, y)) return { x, y };
    }
  }, [widgets]);
  const gridRows = Math.max(totalRows, addSpot.y + ADD_TILE_H);
  const editing = widgets.find((w) => w.id === configId) || null;
  const editingDevices = !!editing && isDeviceWidget(editing.kind, editing.dataSourceId);
  const editingEnergy = !!editing && isEnergyWidget(editing.kind, editing.dataSourceId);

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

  const handleAddFromCatalog = (kind: WidgetKind, at?: { x: number; y: number }) => {
    const cat = WIDGET_CATALOG.find((c) => c.kind === kind)!;
    // Start on real device telemetry (the user picks the device in settings);
    // a donut can't show a device, so it starts on the workspace's alarms.
    const src = findDataSource(kind === "donut" ? ALERTS_SOURCE_ID : DEVICES_SOURCE_ID);
    addWidget({
      kind,
      title: tt(cat.titleKey),
      w: cat.w,
      h: cat.h,
      dataSourceId: src.id,
      metricKey: src.metrics[0].key,
      metricKeys: initialMetricKeys(kind, src),
      dimensionKey: kind === "donut" || kind === "bar" ? src.dimensions[0].key : undefined,
      text: kind === "text" ? "" : undefined,
    }, at);
  };

  const body = (
    <>
      {/* Header / toolbar — aligned with predefined AI Managers dashboard */}
      <div className={`${toolbarCollapsed ? "mb-4" : ""} ${fullscreen ? "px-4 pt-3" : ""}`}>
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
      </div>

      {!toolbarCollapsed && (
        <>
        <div ref={toolbarSentinelRef} className="h-px" aria-hidden />
        <div
          className={`sticky top-0 z-[35] mb-1 py-3 border-b bg-background/95 backdrop-blur transition-shadow ${
            fullscreen ? "px-4" : "-mx-4 px-4 lg:-mx-6 lg:px-6"
          } ${toolbarStuck ? "border-border shadow-sm" : "border-transparent"}`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={timeRange} onValueChange={chooseTimeRange}>
              <SelectTrigger className="h-9 w-auto min-w-[150px] text-xs gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoom && <SelectItem value="custom">{zoomLabel}</SelectItem>}
                {TIME_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{tt(o.k)}</SelectItem>)}
              </SelectContent>
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
                </TooltipTrigger><TooltipContent side="bottom">{tt("refresh")}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={resetLayout} aria-label={tt("resetLayout")}><RotateCcw className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent side="bottom">{tt("resetLayout")}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleFullscreen} aria-label={fullscreen ? tt("exitFullscreen") : tt("fullscreen")}>
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent side="bottom">{fullscreen ? tt("exitFullscreen") : tt("fullscreen")}</TooltipContent></Tooltip>
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
                </TooltipTrigger><TooltipContent side="bottom">{tt("editSettings")}</TooltipContent></Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Grid */}
      <div
        data-grid
        className="relative w-full"
        style={{ minHeight: `${(widgets.length > 0 ? gridRows : totalRows) * (ROW_H + GAP)}px`, backgroundSize: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} + ${GAP}px) ${ROW_H + GAP}px`, backgroundImage: dragging ? "linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.4) 1px, transparent 1px)" : undefined }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="flex max-w-sm flex-col items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <LayoutGrid className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{tt("createFirstChart")}</h2>
              <p className="mt-1 mb-5 text-sm text-muted-foreground">{tt("noWidgets")}</p>
              {/* Same catalog as the toolbar's Add Widget menu. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    {tt("createFirstChart")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover w-56">
                  <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {WIDGET_CATALOG.map((c) => (
                    <DropdownMenuItem key={c.kind} onClick={() => handleAddFromCatalog(c.kind)}>
                      <c.icon className="h-4 w-4 mr-2" /> {tt(c.titleKey)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <Badge variant="outline" className="text-[10px] py-0 h-4">{sourceLabel(w)}</Badge>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigId(w.id)}><Settings2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setPendingRemove(w)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-hidden">
                <WidgetBody w={w} refreshKey={refreshKey} view={view} tt={tt} />
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

        {/* "Add chart" tile in the first free space; the picked chart is placed there. */}
        {widgets.length > 0 && !dragging && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                style={{
                  left: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${addSpot.x} + ${GAP * addSpot.x}px)`,
                  top: `${addSpot.y * (ROW_H + GAP)}px`,
                  width: `calc((100% - ${GAP * (GRID_COLS - 1)}px) / ${GRID_COLS} * ${ADD_TILE_W} + ${GAP * (ADD_TILE_W - 1)}px)`,
                  height: `${ADD_TILE_H * ROW_H + GAP * (ADD_TILE_H - 1)}px`,
                }}
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">{tt("addChart")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-popover w-56">
              <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {WIDGET_CATALOG.map((c) => (
                <DropdownMenuItem key={c.kind} onClick={() => handleAddFromCatalog(c.kind, addSpot)}>
                  <c.icon className="h-4 w-4 mr-2" /> {tt(c.titleKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
                        metricKeys: initialMetricKeys(editing.kind, src),
                        dimensionKey: src.dimensions[0]?.key,
                        deviceId: undefined,
                        telemetryKey: undefined,
                        telemetryKeys: undefined,
                      });
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{sourcesForKind(editing.kind).map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                {editingDevices && (
                  <DeviceSourceFields
                    deviceId={editing.deviceId}
                    telemetryKey={editing.telemetryKey}
                    telemetryKeys={editing.kind === "kpi" ? undefined : widgetTelemetryKeys(editing)}
                    multiple={editing.kind !== "kpi"}
                    defaultCount={editing.kind === "table" ? 3 : 1}
                    hours={rangeToHours(timeRange)}
                    tt={tt}
                    onChange={(patch) => updateWidget(editing.id, patch)}
                  />
                )}

                {editingEnergy && (
                  <EnergySourceFields
                    deviceId={editing.deviceId}
                    telemetryKey={editing.telemetryKey}
                    energyReading={editing.energyReading}
                    tariff={editing.tariff}
                    currency={editing.currency}
                    co2Factor={editing.co2Factor}
                    hours={rangeToHours(timeRange)}
                    tt={tt}
                    onChange={(patch) => updateWidget(editing.id, patch)}
                  />
                )}

                {!editingDevices && (editing.kind === "kpi" || editing.kind === "donut") && (
                  <div>
                    <Label className="text-sm">{tt("metric")}</Label>
                    <Select value={editing.metricKey ?? findDataSource(editing.dataSourceId).metrics[0].key} onValueChange={(v) => updateWidget(editing.id, { metricKey: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {findDataSource(editing.dataSourceId).metrics.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!editingDevices && !editingEnergy && (editing.kind === "donut" || editing.kind === "bar") && (
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

                {!editingDevices && (editing.kind === "table" || editing.kind === "line" || editing.kind === "bar") && (
                  <div>
                    <Label className="text-sm">{tt(editing.kind === "table" ? "metrics" : "seriesMetrics")}</Label>
                    <div className="mt-2 space-y-1.5 border border-border rounded-md p-2">
                      {findDataSource(editing.dataSourceId).metrics.map((m, _, all) => {
                        const chosen = widgetMetricKeys(editing);
                        return (
                          <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={chosen.includes(m.key)}
                              onChange={(e) => {
                                const cur = new Set(chosen);
                                if (e.target.checked) cur.add(m.key); else cur.delete(m.key);
                                updateWidget(editing.id, { metricKeys: all.filter((x) => cur.has(x.key)).map((x) => x.key) });
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
                  <Button variant="outline" className="text-destructive" onClick={() => setPendingRemove(editing)}>
                    <Trash2 className="h-4 w-4 me-1.5" />{tt("remove")}
                  </Button>
                  <Button onClick={() => setConfigId(null)}>{tt("apply")}</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm widget removal */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        {/* In fullscreen only the fullscreen element is painted, so the dialog renders inside it. */}
        <AlertDialogContent container={fullscreen ? containerRef.current : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("removeWidgetQ")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("removeWidgetPre")} <span className="font-medium text-foreground">{pendingRemove?.title}</span> {tt("removeWidgetPost")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (!pendingRemove) return;
                removeWidget(pendingRemove.id);
                if (configId === pendingRemove.id) setConfigId(null);
                setPendingRemove(null);
                toast.success(tt("widgetRemoved"));
              }}
            >
              {tt("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    /* Same contour pattern Home carries, anchored to this container rather
       than the viewport so it stays out of the sidebar. The canvas is given
       z-1 so widgets sit above the lines. */
    <div className="relative">
      <TopoBackdrop anchor="container" />
      <div ref={containerRef} className="relative z-[1]">{body}</div>
    </div>
  );
};

export default DashboardCanvas;
