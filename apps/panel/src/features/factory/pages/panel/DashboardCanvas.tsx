import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  emptyDashboardDefinition,
  useGetDashboardQuery,
  useListWidgetDefinitionsQuery,
  useUpdateDashboardMutation,
  type DashboardDefinition,
  type DashboardWidget,
  type LayoutItem,
  type WidgetDefinition,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useIsMobile } from "@/features/factory/hooks/use-mobile";
import { AI_EXECUTIVE_DASHBOARD_ID, AI_MANAGERS_DASHBOARD_ID } from "@/features/factory/hooks/useDashboards";
import {
  DEFAULT_DASHBOARD_SETTINGS,
  REFRESH_OPTIONS,
  TIME_WINDOW_OPTIONS,
  isoDurationToMs,
  resolveTimeZone,
  timeWindowMs,
} from "@/features/factory/lib/dashboardSettings";
import {
  DESKTOP_COLS,
  addWidget,
  creatableDefinitions,
  defaultSize,
  definitionFor,
  firstFreeSpot,
  newWidget,
  normalizeDefinition,
  packDesktop,
  removeWidget,
  setDesktopRect,
  validateWidget,
} from "@/features/factory/lib/dashboardDefinition";
import { fmtDayTime } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { WidgetBody } from "@/features/factory/components/dashboard/widgets";
import { WidgetConfigSheet } from "@/features/factory/components/dashboard/WidgetConfigSheet";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
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
  ArrowLeft,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  ChevronUp,
  Gauge,
  GripVertical,
  LayoutGrid,
  LineChart,
  Loader2,
  type LucideIcon,
  Map as MapIcon,
  Maximize2,
  PieChart,
  Table as TableIcon,
  Minimize2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { TopoBackdrop } from "@/shared/components/TopoBackdrop";

type Lang = "en" | "ar" | "fa";

const T: Record<string, Record<Lang, string>> = {
  notFound: { en: "This dashboard doesn't exist or you don't have access to it.", ar: "هذه اللوحة غير موجودة أو ليس لديك صلاحية الوصول إليها.", fa: "این داشبورد وجود ندارد یا به آن دسترسی ندارید." },
  back: { en: "Back to dashboards", ar: "العودة إلى لوحات التحكم", fa: "بازگشت به داشبوردها" },
  loading: { en: "Loading dashboard…", ar: "جارٍ تحميل اللوحة…", fa: "در حال بارگذاری داشبورد…" },
  addWidget: { en: "Add Widget", ar: "إضافة عنصر", fa: "افزودن ویجت" },
  addChart: { en: "Add widget", ar: "إضافة عنصر", fa: "افزودن ویجت" },
  loadingWidgets: { en: "Loading widget types…", ar: "جارٍ تحميل أنواع العناصر…", fa: "در حال بارگذاری انواع ویجت…" },
  noWidgetTypes: { en: "No widget types are available", ar: "لا توجد أنواع عناصر متاحة", fa: "هیچ نوع ویجتی در دسترس نیست" },
  widgetTypesFailed: { en: "Couldn't load widget types", ar: "تعذر تحميل أنواع العناصر", fa: "بارگذاری انواع ویجت ممکن نشد" },
  fullscreen: { en: "Fullscreen", ar: "ملء الشاشة", fa: "تمام صفحه" },
  exitFullscreen: { en: "Exit Fullscreen", ar: "إنهاء ملء الشاشة", fa: "خروج از تمام صفحه" },
  refresh: { en: "Refresh", ar: "تحديث", fa: "به‌روزرسانی" },
  resetLayout: { en: "Tidy layout", ar: "ترتيب التخطيط", fa: "مرتب‌سازی چیدمان" },
  editSettings: { en: "Edit settings", ar: "تعديل الإعدادات", fa: "تنظیمات" },
  save: { en: "Save", ar: "حفظ", fa: "ذخیره" },
  saved: { en: "Dashboard saved", ar: "تم حفظ اللوحة", fa: "داشبورد ذخیره شد" },
  saveFailed: { en: "Couldn't save the dashboard", ar: "تعذر حفظ اللوحة", fa: "ذخیره داشبورد ممکن نشد" },
  discard: { en: "Discard changes", ar: "تجاهل التغييرات", fa: "لغو تغییرات" },
  unsaved: { en: "Unsaved changes", ar: "تغييرات غير محفوظة", fa: "تغییرات ذخیره‌نشده" },
  invalidWidgets: { en: "Some widgets need attention before saving", ar: "بعض العناصر تحتاج إلى مراجعة قبل الحفظ", fa: "برخی ویجت‌ها پیش از ذخیره نیاز به اصلاح دارند" },
  conflictTitle: { en: "This dashboard was changed elsewhere", ar: "تم تغيير هذه اللوحة في مكان آخر", fa: "این داشبورد در جای دیگری تغییر کرده است" },
  conflictDesc: { en: "Someone saved a newer version while you were editing. Load theirs and lose your changes, or overwrite it with yours.", ar: "حفظ شخص ما نسخة أحدث أثناء تحريرك. حمّل نسختهم وافقد تغييراتك، أو استبدلها بنسختك.", fa: "شخص دیگری هنگام ویرایش شما نسخه جدیدتری ذخیره کرده است. نسخه او را بارگذاری کنید (تغییرات شما از بین می‌رود) یا نسخه خودتان را جایگزین کنید." },
  loadTheirs: { en: "Load latest", ar: "تحميل الأحدث", fa: "بارگذاری آخرین نسخه" },
  overwrite: { en: "Overwrite with mine", ar: "استبدال بنسختي", fa: "جایگزینی با نسخه من" },
  leaveTitle: { en: "Leave without saving?", ar: "المغادرة دون حفظ؟", fa: "بدون ذخیره خارج می‌شوید؟" },
  leaveDesc: { en: "Your changes to this dashboard haven't been saved.", ar: "لم يتم حفظ تغييراتك على هذه اللوحة.", fa: "تغییرات شما در این داشبورد ذخیره نشده است." },
  leave: { en: "Leave", ar: "مغادرة", fa: "خروج" },
  stay: { en: "Stay", ar: "البقاء", fa: "ماندن" },
  noWidgets: { en: "This dashboard has no widgets yet. Add one to start visualizing your data.", ar: "لا تحتوي هذه اللوحة على عناصر بعد. أضف عنصرًا لبدء عرض بياناتك.", fa: "این داشبورد هنوز ویجتی ندارد. برای نمایش داده‌هایتان یک ویجت اضافه کنید." },
  createFirst: { en: "Add your first widget", ar: "أضف عنصرك الأول", fa: "اولین ویجت خود را اضافه کنید" },
  removeWidgetQ: { en: "Remove widget?", ar: "إزالة العنصر؟", fa: "ویجت حذف شود؟" },
  removeWidgetDesc: { en: "It is removed from this dashboard when you save.", ar: "ستتم إزالته من هذه اللوحة عند الحفظ.", fa: "با ذخیره، از این داشبورد حذف می‌شود." },
  remove: { en: "Remove", ar: "إزالة", fa: "حذف" },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  configure: { en: "Configure", ar: "ضبط", fa: "پیکربندی" },
  dashboards: { en: "Dashboards", ar: "لوحات التحكم", fa: "داشبوردها" },
  showToolbar: { en: "Show toolbar", ar: "إظهار شريط الأدوات", fa: "نمایش نوار ابزار" },
  hideToolbar: { en: "Hide toolbar", ar: "إخفاء شريط الأدوات", fa: "پنهان کردن نوار ابزار" },
  to: { en: "to", ar: "إلى", fa: "تا" },
  dashboardDefault: { en: "(dashboard default)", ar: "(افتراضي اللوحة)", fa: "(پیش‌فرض داشبورد)" },
  deviceQuery: { en: "Device query", ar: "استعلام أجهزة", fa: "جستجوی دستگاه" },
};

const ROW_H = 84;
const GAP = 12;
const ADD_TILE = { w: 4, h: 2 };
const CUSTOM = "__custom";

/* The Add Widget menu: an icon per widget type, in the order people reach for
   them. A type the panel has no icon or rank for still appears, at the end,
   with the generic grid icon. */
const WIDGET_ICONS: Record<string, LucideIcon> = {
  kpi: Gauge,
  "timeseries-chart": LineChart,
  "bar-chart": BarChart3,
  "donut-chart": PieChart,
  gauge: Gauge,
  "device-table": TableIcon,
  "device-map": MapIcon,
  "alarm-list": Bell,
};
const WIDGET_ORDER = Object.keys(WIDGET_ICONS);
const widgetRank = (type: string) => {
  const i = WIDGET_ORDER.indexOf(type);
  return i < 0 ? WIDGET_ORDER.length : i;
};

const colLeft = (x: number) => `calc((100% - ${GAP * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS} * ${x} + ${GAP * x}px)`;
const colWidth = (w: number) => `calc((100% - ${GAP * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS} * ${w} + ${GAP * (w - 1)}px)`;
const rowTop = (y: number) => `${y * (ROW_H + GAP)}px`;
const rowHeight = (h: number) => `${h * ROW_H + GAP * (h - 1)}px`;

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

const DashboardCanvas = () => {
  const { language } = useLanguage();
  const lang = (language as Lang) || "en";
  const rtl = lang === "fa" || lang === "ar";
  const tt = (k: string) => T[k]?.[lang] ?? T[k]?.en ?? k;
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const params = useParams<{ id: string; lang?: string }>();
  const dashboardId = params.id ?? "";
  const workspaceId = useWorkspaceId() ?? "";
  const isMobile = useIsMobile();

  /* The built-ins have their own routes; an old link to /dashboard/<built-in id> lands there. */
  useEffect(() => {
    if (dashboardId === AI_MANAGERS_DASHBOARD_ID) navigate(lp("/dashboard/ai-managers"), { replace: true });
    if (dashboardId === AI_EXECUTIVE_DASHBOARD_ID) navigate(lp("/dashboard/ai-executive"), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId]);

  const query = useGetDashboardQuery(workspaceId, PRODUCT_KEY, dashboardId);
  const record = query.data;
  const defsQuery = useListWidgetDefinitionsQuery(workspaceId, PRODUCT_KEY);
  const defs = defsQuery.data;
  const creatable = useMemo(() => creatableDefinitions(defs), [defs]);
  const updateDashboard = useUpdateDashboardMutation();
  const { items: devices } = useDevices();

  /* ---------------- the draft definition ---------------- */

  const [draft, setDraft] = useState<DashboardDefinition | null>(null);
  const [dirty, setDirty] = useState(false);
  const loadedKey = useRef<string | null>(null);
  // Take the server's definition when a new record version arrives — unless
  // there are unsaved edits, which a background refetch must not wipe out.
  useEffect(() => {
    if (!record) return;
    const key = `${record.id}@${record.recordVersion}`;
    if (loadedKey.current === key) return;
    if (dirty && loadedKey.current?.startsWith(`${record.id}@`)) return;
    loadedKey.current = key;
    setDraft(normalizeDefinition(record.definition ?? emptyDashboardDefinition(DEFAULT_DASHBOARD_SETTINGS)));
    setDirty(false);
  }, [record, dirty]);

  const change = (fn: (d: DashboardDefinition) => DashboardDefinition) => {
    setDraft((d) => (d ? fn(d) : d));
    setDirty(true);
  };

  const discard = () => {
    if (!record) return;
    loadedKey.current = `${record.id}@${record.recordVersion}`;
    setDraft(normalizeDefinition(record.definition ?? emptyDashboardDefinition(DEFAULT_DASHBOARD_SETTINGS)));
    setDirty(false);
  };

  // Closing the tab with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // In-app navigation with unsaved edits asks too.
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const go = (path: string) => (dirty ? setPendingNav(path) : navigate(lp(path)));

  /* ---------------- save ---------------- */

  const [conflict, setConflict] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const save = async (overwrite = false) => {
    if (!draft || !record) return;
    const problems = draft.widgets
      .map((w) => ({ w, errs: validateWidget(w, definitionFor(defs, w), draft.dataSources) }))
      .filter((p) => p.errs.length);
    if (problems.length) {
      toast.error(tt("invalidWidgets"), { description: `${problems[0].w.title}: ${problems[0].errs[0]}` });
      if (definitionFor(defs, problems[0].w)) setConfigId(problems[0].w.id);
      return;
    }
    try {
      // Overwriting means saving on top of whatever is there now, so take its version.
      const base = overwrite ? (await query.refetch()).data ?? record : record;
      await updateDashboard.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        dashboardId: record.id,
        recordVersion: base.recordVersion,
        name: base.name,
        description: base.description ?? null,
        categoryId: base.categoryId ?? null,
        assetId: base.assetId ?? null,
        coverImageUri: base.coverImageUri ?? null,
        visibility: base.visibility,
        definition: draft,
      });
      setDirty(false);
      setConflict(false);
      toast.success(tt("saved"));
    } catch (e) {
      if (statusOf(e) === 409) setConflict(true);
      else toast.error(apiErrorMessage(e, tt("saveFailed")));
    }
  };

  const loadTheirs = async () => {
    setConflict(false);
    setDirty(false);
    loadedKey.current = null;
    await query.refetch();
  };

  /* ---------------- time window, refresh, zoom ---------------- */

  const settings = draft?.settings ?? DEFAULT_DASHBOARD_SETTINGS;
  // Toolbar choices apply to this visit only; the saved defaults live in settings.
  const [rangeOverride, setRangeOverride] = useState<string | null>(null);
  const [refreshOverride, setRefreshOverride] = useState<string | null | undefined>(undefined);
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const rangeValue = zoom ? CUSTOM : rangeOverride ?? settings.timeWindow.last;
  const dashboardSpan = isoDurationToMs(rangeOverride ?? settings.timeWindow.last) ?? 3_600_000;
  const refreshValue = refreshOverride !== undefined ? refreshOverride : settings.refreshInterval;
  const timeZone = resolveTimeZone(settings.timeZone);

  useEffect(() => {
    const ms = isoDurationToMs(refreshValue);
    if (!ms || zoom) return;
    const id = setInterval(() => setNow(Date.now()), Math.max(ms, 5_000));
    return () => clearInterval(id);
  }, [refreshValue, zoom]);

  const windowFor = (w: DashboardWidget, def: WidgetDefinition | undefined): [number, number] => {
    if (zoom) return zoom;
    const span = w.timeWindow && def?.capabilities?.supportsTimeWindow !== false ? timeWindowMs(w.timeWindow) : dashboardSpan;
    return [now - span, now];
  };
  const zoomLabel = zoom
    ? (() => {
        const from = fmtDayTime(zoom[0], timeZone);
        const to = fmtDayTime(zoom[1], timeZone);
        return `${from} ${tt("to")} ${from.slice(0, 5) === to.slice(0, 5) ? to.slice(6) : to}`;
      })()
    : "";

  /* ---------------- fullscreen, toolbar ---------------- */

  const [fullscreen, setFullscreen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  /* ---------------- drag & resize (desktop layout) ---------------- */

  const [dragging, setDragging] = useState<null | { id: string; mode: "move" | "resize"; startX: number; startY: number; origin: LayoutItem; cellW: number }>(null);
  const [ghost, setGhost] = useState<LayoutItem | null>(null);
  const cellWidth = () => {
    const el = containerRef.current?.querySelector<HTMLElement>("[data-grid]");
    return el ? (el.clientWidth - GAP * (DESKTOP_COLS - 1)) / DESKTOP_COLS : 80;
  };
  const startDrag = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    const origin = draft?.layouts.desktop[id];
    if (!origin) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging({ id, mode, startX: e.clientX, startY: e.clientY, origin, cellW: cellWidth() });
    setGhost(origin);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    // In RTL the grid is mirrored, so horizontal pointer motion is too.
    const dx = (e.clientX - dragging.startX) * (rtl ? -1 : 1);
    const dy = e.clientY - dragging.startY;
    const o = dragging.origin;
    if (dragging.mode === "move") {
      const x = Math.max(0, Math.min(DESKTOP_COLS - o.w, Math.round(o.x + dx / (dragging.cellW + GAP))));
      const y = Math.max(0, Math.round(o.y + dy / (ROW_H + GAP)));
      setGhost({ ...o, x, y });
    } else {
      const w = Math.max(2, Math.min(DESKTOP_COLS - o.x, Math.round(o.w + dx / (dragging.cellW + GAP))));
      const h = Math.max(2, Math.round(o.h + dy / (ROW_H + GAP)));
      setGhost({ ...o, w, h });
    }
  };
  const onPointerUp = () => {
    if (dragging && ghost) {
      const o = dragging.origin;
      if (ghost.x !== o.x || ghost.y !== o.y || ghost.w !== o.w || ghost.h !== o.h) {
        const id = dragging.id;
        const rect = ghost;
        change((d) => setDesktopRect(d, id, rect));
      }
    }
    setDragging(null);
    setGhost(null);
  };

  /* ---------------- widgets ---------------- */

  const [pendingRemove, setPendingRemove] = useState<DashboardWidget | null>(null);

  const add = (def: WidgetDefinition, at?: { x: number; y: number }) => {
    const w = newWidget(def, def.name);
    change((d) => addWidget(d, w, defaultSize(def), at));
    // A new widget has no data yet, so go straight to picking some.
    setConfigId(w.id);
  };

  const deviceName = useMemo(() => new Map(devices.map((d) => [d.id, d.label || d.name])), [devices]);
  const sourceBadge = (w: DashboardWidget) => {
    if (!draft) return "";
    const names = [...new Set(w.data.map((d) => {
      const s = draft.dataSources[d.source];
      return s?.type === "device" ? deviceName.get(s.deviceId) ?? d.source : s?.type === "deviceQuery" ? tt("deviceQuery") : d.source;
    }))];
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
  };

  const addMenuItems = (at?: { x: number; y: number }) => {
    if (defsQuery.isLoading) return <div className="px-2 py-1.5 text-xs text-muted-foreground">{tt("loadingWidgets")}</div>;
    if (defsQuery.isError) return <div className="px-2 py-1.5 text-xs text-destructive">{tt("widgetTypesFailed")}</div>;
    if (creatable.length === 0) return <div className="px-2 py-1.5 text-xs text-muted-foreground">{tt("noWidgetTypes")}</div>;
    // One flat list, an icon and a name per type: no category headings and no
    // descriptions, which made a three-item menu read like a page.
    const ordered = [...creatable].sort((a, b) => widgetRank(a.type) - widgetRank(b.type));
    return ordered.map((d) => {
      const Icon = WIDGET_ICONS[d.type] ?? LayoutGrid;
      return (
        <DropdownMenuItem key={d.id} onClick={() => add(d, at)} className="gap-2.5 text-sm">
          {d.iconUri ? <img src={d.iconUri} alt="" className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          {d.name}
        </DropdownMenuItem>
      );
    });
  };

  /* ---------------- render ---------------- */

  if (query.isLoading || (!workspaceId && !query.isError) || (record && !draft)) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-20 justify-center"><Loader2 className="h-4 w-4 animate-spin" />{tt("loading")}</div>;
  }
  if (!record || !draft) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">{tt("notFound")}</p>
        <Button onClick={() => navigate(lp("/dashboard"))}>{tt("back")}</Button>
      </div>
    );
  }

  const desktop = draft.layouts.desktop;
  const totalRows = Math.max(6, ...Object.values(desktop).map((r) => r.y + r.h));
  const addSpot = firstFreeSpot(desktop, ADD_TILE.w, ADD_TILE.h);
  const gridRows = Math.max(totalRows, addSpot.y + ADD_TILE.h);
  const editing = draft.widgets.find((w) => w.id === configId) ?? null;
  const mobileOrder = [...draft.widgets].sort((a, b) => (draft.layouts.mobile[a.id]?.y ?? 0) - (draft.layouts.mobile[b.id]?.y ?? 0));

  const widgetCard = (w: DashboardWidget, style?: React.CSSProperties) => {
    const def = definitionFor(defs, w);
    const draggable = !isMobile;
    return (
      <Card key={w.id} style={style} className="overflow-hidden flex flex-col group">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border bg-card">
          <div className="flex items-center gap-1.5 min-w-0">
            {draggable && (
              <button
                onPointerDown={(e) => startDrag(e, w.id, "move")}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                aria-label="Drag"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <span className="text-sm font-medium text-foreground truncate">{w.title}</span>
            {sourceBadge(w) && <Badge variant="outline" className="text-[10px] py-0 h-4 max-w-[45%] truncate">{sourceBadge(w)}</Badge>}
          </div>
          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {def && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigId(w.id)} aria-label={tt("configure")}>
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setPendingRemove(w)} aria-label={tt("remove")}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 min-w-0 p-3 overflow-hidden">
          <WidgetBody
            widget={w}
            definition={def}
            dataSources={draft.dataSources}
            window={windowFor(w, def)}
            timeZone={timeZone}
            lang={lang}
            onZoom={(from, to) => setZoom([from, to])}
          />
        </div>
        {draggable && (
          <div
            onPointerDown={(e) => startDrag(e, w.id, "resize")}
            className="absolute bottom-0 end-0 w-4 h-4 cursor-nwse-resize touch-none opacity-0 group-hover:opacity-100"
            aria-label="Resize"
          >
            <svg viewBox="0 0 16 16" className={`w-full h-full text-muted-foreground ${rtl ? "-scale-x-100" : ""}`}><path d="M2 14 L14 2 M6 14 L14 6 M10 14 L14 10" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
          </div>
        )}
      </Card>
    );
  };

  const emptyState = (
    <div className="flex items-center justify-center p-4 py-16">
      <div className="flex max-w-sm flex-col items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <LayoutGrid className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{tt("createFirst")}</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">{tt("noWidgets")}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" />{tt("createFirst")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-popover w-72">
            <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {addMenuItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const body = (
    <>
      {/* Header */}
      <div className={`${toolbarCollapsed ? "mb-4" : ""} ${fullscreen ? "px-4 pt-3" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            {!fullscreen && (
              <Breadcrumb className="mb-2">
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink onClick={() => go("/dashboard")} className="cursor-pointer">{tt("dashboards")}</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>{record.name}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => go("/dashboard")} aria-label={tt("back")}>
                <ArrowLeft className={`h-4 w-4 ${rtl ? "rotate-180" : ""}`} />
              </Button>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">{record.name}</h1>
              {dirty && <Badge variant="secondary" className="font-normal bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-0">{tt("unsaved")}</Badge>}
            </div>
          </div>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setToolbarCollapsed((v) => !v)} aria-label={toolbarCollapsed ? tt("showToolbar") : tt("hideToolbar")}>
                  {toolbarCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{toolbarCollapsed ? tt("showToolbar") : tt("hideToolbar")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Toolbar */}
      {!toolbarCollapsed && (
        <div className={`sticky top-0 z-[35] mb-3 py-3 border-b border-border bg-background/95 backdrop-blur ${fullscreen ? "px-4" : "-mx-4 px-4 lg:-mx-6 lg:px-6"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={rangeValue}
              onValueChange={(v) => {
                if (v === CUSTOM) return;
                setZoom(null);
                setRangeOverride(v === settings.timeWindow.last ? null : v);
                setNow(Date.now());
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-[160px] text-xs gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoom && <SelectItem value={CUSTOM}>{zoomLabel}</SelectItem>}
                {TIME_WINDOW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label[lang]}{o.value === settings.timeWindow.last ? ` ${tt("dashboardDefault")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={refreshValue ?? "__manual"}
              onValueChange={(v) => {
                const next = v === "__manual" ? null : v;
                setRefreshOverride(next === settings.refreshInterval ? undefined : next);
              }}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <RefreshCw className="h-3.5 w-3.5 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((o) => (
                  <SelectItem key={o.value ?? "__manual"} value={o.value ?? "__manual"}>{o.label[lang]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ms-auto flex-wrap">
              <TooltipProvider delayDuration={150}>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { setZoom(null); setNow(Date.now()); }} aria-label={tt("refresh")}><RefreshCw className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent side="bottom">{tt("refresh")}</TooltipContent></Tooltip>
                {!isMobile && (
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => change(packDesktop)} disabled={draft.widgets.length === 0} aria-label={tt("resetLayout")}><RotateCcw className="h-4 w-4" /></Button>
                  </TooltipTrigger><TooltipContent side="bottom">{tt("resetLayout")}</TooltipContent></Tooltip>
                )}
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleFullscreen} aria-label={fullscreen ? tt("exitFullscreen") : tt("fullscreen")}>
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent side="bottom">{fullscreen ? tt("exitFullscreen") : tt("fullscreen")}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => go(`/dashboard/${record.id}/edit`)} aria-label={tt("editSettings")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent side="bottom">{tt("editSettings")}</TooltipContent></Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{tt("addWidget")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover w-72">
                  <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {addMenuItems()}
                </DropdownMenuContent>
              </DropdownMenu>

              {dirty && (
                <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={discard} disabled={updateDashboard.isPending}>
                  <Undo2 className="h-3.5 w-3.5" /><span className="hidden md:inline">{tt("discard")}</span>
                </Button>
              )}
              <Button size="sm" className="h-9 gap-1.5" onClick={() => save()} disabled={!dirty || updateDashboard.isPending}>
                {updateDashboard.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {tt("save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      {draft.widgets.length === 0 ? (
        emptyState
      ) : isMobile ? (
        /* Phones: one column, in the mobile layout's order and heights. */
        <div className="flex flex-col" style={{ gap: GAP }}>
          {mobileOrder.map((w) => widgetCard(w, { position: "relative", height: rowHeight(draft.layouts.mobile[w.id]?.h ?? 4) }))}
        </div>
      ) : (
        <div
          data-grid
          className="relative w-full"
          style={{
            minHeight: `${gridRows * (ROW_H + GAP)}px`,
            backgroundSize: `calc((100% - ${GAP * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS} + ${GAP}px) ${ROW_H + GAP}px`,
            backgroundImage: dragging ? "linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.4) 1px, transparent 1px)" : undefined,
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {draft.widgets.map((w) => {
            const r = dragging?.id === w.id && ghost ? ghost : desktop[w.id];
            if (!r) return null;
            const isDragged = dragging?.id === w.id;
            return widgetCard(w, {
              position: "absolute",
              insetInlineStart: colLeft(r.x),
              top: rowTop(r.y),
              width: colWidth(r.w),
              height: rowHeight(r.h),
              transition: isDragged ? "none" : "inset-inline-start 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease",
              zIndex: isDragged ? 30 : 1,
            });
          })}

          {!dragging && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  style={{ insetInlineStart: colLeft(addSpot.x), top: rowTop(addSpot.y), width: colWidth(ADD_TILE.w), height: rowHeight(ADD_TILE.h) }}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium">{tt("addChart")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-popover w-72">
                <DropdownMenuLabel>{tt("addWidget")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {addMenuItems(addSpot)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {dragging && ghost && (
            <div
              className="absolute rounded-md border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
              style={{ insetInlineStart: colLeft(ghost.x), top: rowTop(ghost.y), width: colWidth(ghost.w), height: rowHeight(ghost.h), zIndex: 20 }}
            />
          )}
        </div>
      )}

      <WidgetConfigSheet
        open={!!editing}
        onOpenChange={(o) => !o && setConfigId(null)}
        widget={editing}
        definition={editing ? definitionFor(defs, editing) : undefined}
        dashboard={draft}
        lang={lang}
        rtl={rtl}
        onApply={(next) => { setDraft(next); setDirty(true); }}
      />

      {/* Confirm widget removal */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        <AlertDialogContent container={fullscreen ? containerRef.current : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("removeWidgetQ")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{pendingRemove?.title}</span> — {tt("removeWidgetDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (!pendingRemove) return;
                const id = pendingRemove.id;
                change((d) => removeWidget(d, id));
                if (configId === id) setConfigId(null);
                setPendingRemove(null);
              }}
            >
              {tt("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Saved elsewhere meanwhile (409) */}
      <AlertDialog open={conflict} onOpenChange={setConflict}>
        <AlertDialogContent container={fullscreen ? containerRef.current : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("conflictTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{tt("conflictDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={loadTheirs}>{tt("loadTheirs")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(true)}>{tt("overwrite")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leaving with unsaved changes */}
      <AlertDialog open={!!pendingNav} onOpenChange={(o) => !o && setPendingNav(null)}>
        <AlertDialogContent container={fullscreen ? containerRef.current : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{tt("leaveDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("stay")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                const to = pendingNav;
                setPendingNav(null);
                setDirty(false);
                if (to) navigate(lp(to));
              }}
            >
              {tt("leave")}
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
    /* Same contour pattern Home carries, anchored to this container. */
    <div className="relative">
      <TopoBackdrop anchor="container" />
      <div ref={containerRef} className="relative z-[1]">{body}</div>
    </div>
  );
};

export default DashboardCanvas;
