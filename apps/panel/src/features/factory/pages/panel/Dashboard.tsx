import { useMemo, useState } from "react";
import { formatDate } from "@/shared/lib/formatDate";
import { useNavigate } from "react-router-dom";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Badge } from "@/features/factory/components/ui/badge";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/factory/components/ui/tooltip";
import {
  Plus,
  Search,
  LayoutGrid,
  Grid2x2,
  List as ListIcon,
  RefreshCw,
  ArrowUpDown,
  HelpCircle,
  ChevronDown,
  MoreVertical,
  MapPin,
  Clock,
  User,
  Star,
  Pin,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDashboards, useViewMode, DashboardItem } from "@/features/factory/hooks/useDashboards";
import { toast } from "sonner";
import { localizedPath } from "@/features/factory/lib/localizedPath";

type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  dashboards: { en: "Dashboards", ar: "لوحات التحكم", fa: "داشبوردها" },
  pageDesc: { en: "Create and manage dashboards to visualize your industrial data", ar: "إنشاء وإدارة لوحات التحكم لتصور بياناتك الصناعية", fa: "ساخت و مدیریت داشبوردها برای مصورسازی داده‌های صنعتی شما" },
  createDashboard: { en: "Create Dashboard", ar: "إنشاء لوحة تحكم", fa: "ساخت داشبورد" },
  newDashboard: { en: "New dashboard", ar: "لوحة تحكم جديدة", fa: "داشبورد جدید" },
  createFromTemplate: { en: "Create from template", ar: "إنشاء من قالب", fa: "ساخت از قالب" },
  emptyTitle: { en: "You don't have any dashboards yet", ar: "ليس لديك أي لوحات تحكم بعد", fa: "هنوز هیچ داشبوردی ندارید" },
  emptyDesc: { en: "Dashboards help you monitor your operations by bringing your important data and KPIs into one place.", ar: "تساعدك لوحات التحكم في مراقبة عملياتك من خلال جمع بياناتك ومؤشرات الأداء المهمة في مكان واحد.", fa: "داشبوردها با گردآوری داده‌ها و شاخص‌های کلیدی مهم در یک مکان، به نظارت بر عملیات شما کمک می‌کنند." },
  createFirst: { en: "Create Your First Dashboard", ar: "أنشئ أول لوحة تحكم لك", fa: "اولین داشبورد خود را بسازید" },
  loadFromTemplate: { en: "Load from Template", ar: "تحميل من قالب", fa: "بارگذاری از قالب" },
  viewArchived: { en: "View Archived", ar: "عرض المؤرشفة", fa: "مشاهده آرشیو" },
  learnMore: { en: "Learn more about dashboards", ar: "اعرف المزيد عن لوحات التحكم", fa: "درباره داشبوردها بیشتر بدانید" },
  searchPlaceholder: { en: "Search dashboards", ar: "البحث في لوحات التحكم", fa: "جستجوی داشبوردها" },
  cardView: { en: "Card view", ar: "عرض البطاقات", fa: "نمای کارت" },
  gridView: { en: "Grid view", ar: "عرض الشبكة", fa: "نمای شبکه" },
  tableView: { en: "Table view", ar: "عرض الجدول", fa: "نمای جدول" },
  refresh: { en: "Refresh", ar: "تحديث", fa: "به‌روزرسانی" },
  refreshed: { en: "Refreshed", ar: "تم التحديث", fa: "به‌روزرسانی شد" },
  all: { en: "All", ar: "الكل", fa: "همه" },
  mine: { en: "My dashboards", ar: "لوحاتي", fa: "داشبوردهای من" },
  shared: { en: "Shared", ar: "المشتركة", fa: "اشتراکی" },
  archived: { en: "Archived", ar: "المؤرشفة", fa: "آرشیوشده" },
  sortRecent: { en: "Sort: Recently updated", ar: "ترتيب: الأحدث تحديثًا", fa: "مرتب‌سازی: آخرین به‌روزرسانی" },
  sortName: { en: "Sort: Name", ar: "ترتيب: الاسم", fa: "مرتب‌سازی: نام" },
  actions: { en: "Actions", ar: "الإجراءات", fa: "اقدامات" },
  duplicateSel: { en: "Duplicate selected", ar: "تكرار المحدد", fa: "تکرار موارد انتخاب‌شده" },
  pinSel: { en: "Pin selected", ar: "تثبيت المحدد", fa: "سنجاق موارد انتخاب‌شده" },
  archiveSel: { en: "Archive selected", ar: "أرشفة المحدد", fa: "آرشیو موارد انتخاب‌شده" },
  restoreSel: { en: "Restore selected", ar: "استعادة المحدد", fa: "بازیابی موارد انتخاب‌شده" },
  deleteSel: { en: "Delete selected", ar: "حذف المحدد", fa: "حذف موارد انتخاب‌شده" },
  pinnedDashboards: { en: "Pinned Dashboards", ar: "لوحات التحكم المثبتة", fa: "داشبوردهای سنجاق‌شده" },
  pinnedDesc: { en: "Quick access to your important dashboards", ar: "وصول سريع إلى لوحات التحكم المهمة", fa: "دسترسی سریع به داشبوردهای مهم شما" },
  archivedDashboards: { en: "Archived Dashboards", ar: "لوحات التحكم المؤرشفة", fa: "داشبوردهای آرشیوشده" },
  allDashboards: { en: "All Dashboards", ar: "كل لوحات التحكم", fa: "همه داشبوردها" },
  dashboardsLower: { en: "dashboards", ar: "لوحات تحكم", fa: "داشبورد" },
  noArchivedTitle: { en: "No archived dashboards", ar: "لا توجد لوحات تحكم مؤرشفة", fa: "هیچ داشبورد آرشیوشده‌ای وجود ندارد" },
  noArchivedDesc: { en: "Archived dashboards will appear here. You can archive dashboards from the actions menu on any dashboard.", ar: "ستظهر لوحات التحكم المؤرشفة هنا. يمكنك أرشفة لوحات التحكم من قائمة الإجراءات في أي لوحة تحكم.", fa: "داشبوردهای آرشیوشده اینجا نمایش داده می‌شوند. می‌توانید هر داشبورد را از منوی اقدامات آرشیو کنید." },
  colDashboard: { en: "Dashboard", ar: "لوحة التحكم", fa: "داشبورد" },
  colCategory: { en: "Category", ar: "الفئة", fa: "دسته‌بندی" },
  colLocation: { en: "Location", ar: "الموقع", fa: "مکان" },
  colOwner: { en: "Owner", ar: "المالك", fa: "مالک" },
  colLastUpdated: { en: "Last Updated", ar: "آخر تحديث", fa: "آخرین به‌روزرسانی" },
  colStatus: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  colActions: { en: "Actions", ar: "الإجراءات", fa: "اقدامات" },
  statusPublished: { en: "Published", ar: "منشورة", fa: "منتشرشده" },
  statusDraft: { en: "Draft", ar: "مسودة", fa: "پیش‌نویس" },
  statusArchived: { en: "Archived", ar: "مؤرشفة", fa: "آرشیوشده" },
  open: { en: "Open", ar: "فتح", fa: "باز کردن" },
  edit: { en: "Edit", ar: "تعديل", fa: "ویرایش" },
  duplicate: { en: "Duplicate", ar: "تكرار", fa: "تکرار" },
  pin: { en: "Pin", ar: "تثبيت", fa: "سنجاق" },
  unpin: { en: "Unpin", ar: "إلغاء التثبيت", fa: "برداشتن سنجاق" },
  archive: { en: "Archive", ar: "أرشفة", fa: "آرشیو" },
  unarchive: { en: "Unarchive", ar: "إلغاء الأرشفة", fa: "خروج از آرشیو" },
  delete: { en: "Delete", ar: "حذف", fa: "حذف" },
  updated: { en: "Updated", ar: "آخر تحديث", fa: "به‌روزرسانی" },
  justNow: { en: "just now", ar: "الآن", fa: "همین حالا" },
  minAgo: { en: "min ago", ar: "دقيقة مضت", fa: "دقیقه پیش" },
  hourAgo: { en: "hour ago", ar: "ساعة مضت", fa: "ساعت پیش" },
  hoursAgo: { en: "hours ago", ar: "ساعات مضت", fa: "ساعت پیش" },
  yesterday: { en: "Yesterday", ar: "الأمس", fa: "دیروز" },
  daysAgo: { en: "days ago", ar: "أيام مضت", fa: "روز پیش" },
  rowsPerPage: { en: "Rows per page", ar: "الصفوف لكل صفحة", fa: "ردیف در هر صفحه" },
  of: { en: "of", ar: "من", fa: "از" },
  deleteDashboardQ: { en: "Delete dashboard?", ar: "حذف لوحة التحكم؟", fa: "داشبورد حذف شود؟" },
  deleteOneDesc: { en: "This will permanently delete", ar: "سيؤدي هذا إلى حذف نهائي لـ", fa: "این کار باعث حذف دائمی" },
  cannotUndone: { en: "This action cannot be undone.", ar: "لا يمكن التراجع عن هذا الإجراء.", fa: "این عمل قابل بازگشت نیست." },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  deleteSelectedQ: { en: "Delete selected dashboards?", ar: "حذف لوحات التحكم المحددة؟", fa: "داشبوردهای انتخاب‌شده حذف شوند؟" },
  willDelete: { en: "This will permanently delete", ar: "سيؤدي هذا إلى الحذف النهائي لـ", fa: "این کار باعث حذف دائمی" },
  selected: { en: "selected", ar: "المحددة", fa: "انتخاب‌شده" },
  selectAll: { en: "Select all", ar: "تحديد الكل", fa: "انتخاب همه" },
  dashboardDeleted: { en: "Dashboard deleted", ar: "تم حذف لوحة التحكم", fa: "داشبورد حذف شد" },
  dashboardDuplicated: { en: "Dashboard duplicated", ar: "تم تكرار لوحة التحكم", fa: "داشبورد تکرار شد" },
  dashboardArchived: { en: "Dashboard archived", ar: "تمت أرشفة لوحة التحكم", fa: "داشبورد آرشیو شد" },
  dashboardRestored: { en: "Dashboard restored", ar: "تمت استعادة لوحة التحكم", fa: "داشبورد بازیابی شد" },
  dashboardsUpdated: { en: "dashboards updated", ar: "تم تحديث لوحات التحكم", fa: "داشبورد به‌روزرسانی شد" },
  dashboardsDeleted: { en: "dashboards deleted", ar: "تم حذف لوحات التحكم", fa: "داشبورد حذف شد" },
  canvasSoon: { en: "Dashboard canvas coming soon", ar: "لوحة تصميم الداشبورد قريبًا", fa: "صفحه طراحی داشبورد به‌زودی" },
  // Categories
  catOperations: { en: "Operations", ar: "العمليات", fa: "عملیات" },
  catUtilities: { en: "Utilities", ar: "المرافق", fa: "تأسیسات" },
  catAIAnalytics: { en: "AI Analytics", ar: "تحليلات الذكاء الاصطناعي", fa: "تحلیل هوش مصنوعی" },
  catEnergy: { en: "Energy", ar: "الطاقة", fa: "انرژی" },
  catQuality: { en: "Quality", ar: "الجودة", fa: "کیفیت" },
  catSafety: { en: "Safety", ar: "السلامة", fa: "ایمنی" },
  catMaintenance: { en: "Maintenance", ar: "الصيانة", fa: "نگهداری" },
  catExecutive: { en: "Executive", ar: "تنفيذي", fa: "مدیریتی" },
};

const categoryColor = (cat?: string) => {
  switch (cat) {
    case "Operations": return "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300";
    case "Utilities": return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
    case "AI Analytics": return "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
    case "Energy": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "Quality": return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "Safety": return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    case "Maintenance": return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300";
    case "Executive": return "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300";
    default: return "bg-muted text-muted-foreground";
  }
};

const categoryLabel = (cat: string | undefined, lang: Lang) => {
  if (!cat) return "";
  const map: Record<string, string> = {
    Operations: "catOperations", Utilities: "catUtilities", "AI Analytics": "catAIAnalytics",
    Energy: "catEnergy", Quality: "catQuality", Safety: "catSafety",
    Maintenance: "catMaintenance", Executive: "catExecutive",
  };
  const k = map[cat];
  return k && DICT[k] ? DICT[k][lang] : cat;
};

const statusLabel = (status: string, lang: Lang) => {
  if (status === "Published") return DICT.statusPublished[lang];
  if (status === "Draft") return DICT.statusDraft[lang];
  if (status === "Archived") return DICT.statusArchived[lang];
  return status;
};

const makeTimeAgo = (lang: Lang) => (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return DICT.justNow[lang];
  if (m < 60) return `${m} ${DICT.minAgo[lang]}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h > 1 ? DICT.hoursAgo[lang] : DICT.hourAgo[lang]}`;
  const d = Math.floor(h / 24);
  if (d === 1) return DICT.yesterday[lang];
  if (d < 7) return `${d} ${DICT.daysAgo[lang]}`;
  return formatDate(ts, lang);
};

const PlaceholderThumb = () => (
  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
    <svg viewBox="0 0 120 60" className="w-3/4 h-3/4 opacity-60" aria-hidden>
      <polyline points="0,45 15,30 30,38 45,18 60,28 75,12 90,22 105,8 120,18"
        fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <polyline points="0,55 15,50 30,45 45,48 60,40 75,42 90,35 105,38 120,30"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
    </svg>
  </div>
);

const Thumb = ({ d, size = "lg" }: { d: DashboardItem; size?: "sm" | "md" | "lg" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const heights = { sm: "h-12 w-16", md: "h-20 w-28", lg: "h-[110px] w-full" };
  return (
    <div className={`${heights[size]} rounded-md overflow-hidden border border-border bg-muted shrink-0`}>
      {d.coverImage && !imageFailed ? (
        <img src={d.coverImage} alt={d.name} className="w-full h-full object-cover" onError={() => setImageFailed(true)} />
      ) : (
        <PlaceholderThumb />
      )}
    </div>
  );
};

const RowActions = ({ d, onAction, lang }: { d: DashboardItem; onAction: (kind: string, d: DashboardItem) => void; lang: Lang }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
        aria-label={DICT.actions[lang]}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-popover w-48" onClick={(e) => e.stopPropagation()}>
      <DropdownMenuItem onClick={() => onAction("open", d)}><Eye className="h-4 w-4 mr-2" />{DICT.open[lang]}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction("edit", d)}><Pencil className="h-4 w-4 mr-2" />{DICT.edit[lang]}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction("duplicate", d)}><Copy className="h-4 w-4 mr-2" />{DICT.duplicate[lang]}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction("pin", d)}><Pin className="h-4 w-4 mr-2" />{d.pinned ? DICT.unpin[lang] : DICT.pin[lang]}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onAction("archive", d)}><Archive className="h-4 w-4 mr-2" />{d.archived ? DICT.unarchive[lang] : DICT.archive[lang]}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction("delete", d)} className="text-destructive focus:text-destructive">
        <Trash2 className="h-4 w-4 mr-2" />{DICT.delete[lang]}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const DashboardCard = ({ d, compact, selected, onToggleSelect, onOpen, onAction, lang, timeAgo }: {
  d: DashboardItem; compact?: boolean; selected?: boolean;
  onToggleSelect?: (checked: boolean | "indeterminate") => void;
  onOpen: () => void; onAction: (k: string, d: DashboardItem) => void; lang: Lang; timeAgo: (ts: number) => string;
}) => (
  <Card
    onClick={onOpen}
    className={`group relative p-3 cursor-pointer hover:border-primary/60 hover:shadow-sm transition-all flex ${
      selected ? "border-primary ring-1 ring-primary/30" : ""
    } ${compact ? "gap-3" : "flex-col gap-3"}`}
  >
    {onToggleSelect && (
      /* The same selection the table view has, in the card's corner, so a
         bulk action can be built up without switching views. It sits over the
         thumbnail, so it carries its own background to stay legible on a dark
         one, and swallows the click that would otherwise open the dashboard. */
      <span
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 z-10 rounded-md bg-background/90 p-1 shadow-sm ltr:left-2 rtl:right-2"
      >
        <Checkbox checked={!!selected} onCheckedChange={onToggleSelect} aria-label={d.name} />
      </span>
    )}
    {compact ? <Thumb d={d} size="md" /> : <Thumb d={d} size="lg" />}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{d.name}</h3>
            {d.pinned && <Star className="h-3.5 w-3.5 text-primary fill-primary shrink-0" />}
          </div>
          {d.description && <p className={`text-xs text-muted-foreground mt-0.5 ${compact ? "line-clamp-1" : "line-clamp-2"}`}>{d.description}</p>}
        </div>
        <RowActions d={d} onAction={onAction} lang={lang} />
      </div>
      {(d.category || d.builtIn) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.category && (
            <Badge variant="secondary" className={`${categoryColor(d.category)} border-0 font-normal`}>{categoryLabel(d.category, lang)}</Badge>
          )}
          {d.builtIn && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-normal">
              {lang === "fa" ? "داشبورد داخلی" : lang === "ar" ? "لوحة مدمجة" : "Built-in"}
            </Badge>
          )}
        </div>
      )}
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {d.location && <div className="flex items-center gap-1.5 truncate"><MapPin className="h-3 w-3 shrink-0" />{d.location}</div>}
        <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0" />{DICT.updated[lang]} {timeAgo(d.updatedAt)}</div>
        <div className="flex items-center gap-1.5 truncate"><User className="h-3 w-3 shrink-0" />{d.owner}</div>
      </div>
    </div>
  </Card>
);

const Dashboard = () => {
  const { language, isRTL } = useLanguage();
  const lang = language as Lang;
  const tt = (k: string) => DICT[k]?.[lang] ?? k;
  const timeAgo = makeTimeAgo(lang);
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const { items, remove, duplicate, update } = useDashboards();
  const [view, setView] = useViewMode();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mine" | "shared" | "archived">("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [pendingDelete, setPendingDelete] = useState<DashboardItem | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "archived") list = list.filter((d) => d.archived);
    else list = list.filter((d) => !d.archived);
    if (filter === "mine") list = list.filter((d) => d.owner === "You");
    if (filter === "shared") list = list.filter((d) => d.access !== "only_me");
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((d) =>
        d.name.toLowerCase().includes(s) ||
        d.description?.toLowerCase().includes(s) ||
        d.category?.toLowerCase().includes(s)
      );
    }
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
    return list;
  }, [items, filter, search, sort]);

  const pinned = filtered.filter((d) => d.pinned);
  const all = filtered;
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const paged = all.slice((page - 1) * pageSize, page * pageSize);
  const visibleIds = paged.map((d) => d.id);
  const selectedItems = items.filter((d) => selectedIds.has(d.id));
  const selectedCount = selectedItems.length;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const toggleVisibleSelection = (checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const toggleRowSelection = (id: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAction = (kind: string, d: DashboardItem) => {
    switch (kind) {
      case "open":
        if (d.route) {
          navigate(lp(d.route));
        } else {
          navigate(lp(`/dashboard/${d.id}`));
        }
        break;
      case "edit":
        navigate(lp(`/dashboard/${d.id}/edit`));
        break;
      case "duplicate":
        duplicate(d.id);
        toast.success(tt("dashboardDuplicated"));
        break;
      case "pin":
        update(d.id, { pinned: !d.pinned });
        break;
      case "archive":
        update(d.id, { archived: !d.archived });
        toast.success(d.archived ? tt("dashboardRestored") : tt("dashboardArchived"));
        break;
      case "delete":
        setPendingDelete(d);
        break;
    }
  };

  const handleBulkAction = (kind: "duplicate" | "pin" | "archive" | "restore" | "delete") => {
    if (selectedItems.length === 0) return;
    if (kind === "delete") {
      setPendingBulkDelete(true);
      return;
    }
    selectedItems.forEach((d) => {
      if (kind === "duplicate") duplicate(d.id);
      if (kind === "pin") update(d.id, { pinned: true });
      if (kind === "archive") update(d.id, { archived: true, status: "Archived" });
      if (kind === "restore") update(d.id, { archived: false, status: "Published" });
    });
    toast.success(`${selectedItems.length} ${tt("dashboardsUpdated")}`);
    setSelectedIds(new Set());
  };

  // EMPTY STATE
  if (items.filter((d) => !d.archived).length === 0 && filter !== "archived") {
    return (
      <>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tt("dashboards")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{tt("pageDesc")}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />{tt("createDashboard")}<ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(lp("/dashboard/new"))}>
                <Plus className="h-4 w-4 mr-2" />{tt("newDashboard")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(lp("/dashboard/templates"))}>
                <Copy className="h-4 w-4 mr-2" />{tt("createFromTemplate")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="p-8 min-h-[520px] flex flex-col items-center justify-center text-center py-16">
          <svg width="240" height="190" viewBox="0 0 240 190" fill="none" className="mb-8" aria-hidden>
            <ellipse cx="80" cy="120" rx="55" ry="50" fill="hsl(var(--muted))" opacity="0.5" />
            <ellipse cx="170" cy="80" rx="60" ry="45" fill="hsl(var(--muted))" opacity="0.4" />
            <rect x="55" y="40" width="140" height="100" rx="6" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="hsl(var(--background))" />
            <line x1="40" y1="150" x2="210" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="65" y="55" width="38" height="28" rx="3" fill="hsl(var(--muted))" />
            <rect x="107" y="55" width="38" height="28" rx="3" fill="hsl(var(--muted))" />
            <rect x="149" y="55" width="38" height="28" rx="3" fill="hsl(var(--muted))" />
            <rect x="65" y="87" width="38" height="38" rx="3" fill="hsl(var(--muted))" />
            <rect x="107" y="87" width="38" height="38" rx="3" stroke="hsl(var(--muted-foreground))" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
            <line x1="126" y1="100" x2="126" y2="112" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="120" y1="106" x2="132" y2="106" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="149" y="87" width="38" height="38" rx="3" fill="hsl(var(--muted))" />
          </svg>
          <h2 className="text-xl font-semibold text-foreground mb-2">{tt("emptyTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{tt("emptyDesc")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate(lp("/dashboard/new"))} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-5 w-5" />{tt("createFirst")}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(lp("/dashboard/templates"))}>
              {tt("loadFromTemplate")}
            </Button>
            {items.some((d) => d.archived) && (
              <Button variant="ghost" size="lg" onClick={() => setFilter("archived")} className="gap-2">
                <Archive className="h-5 w-5" />
                {tt("viewArchived")} ({items.filter((d) => d.archived).length})
              </Button>
            )}
          </div>
          <button className="mt-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            {tt("learnMore")} <HelpCircle className="h-4 w-4" />
          </button>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{tt("dashboards")}</h1>
            <Badge variant="secondary" className="font-normal">{items.filter(d => !d.archived).length} {tt("dashboards")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{tt("pageDesc")}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" />{tt("createDashboard")}<ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(lp("/dashboard/new"))}>
              <Plus className="h-4 w-4 mr-2" />{tt("newDashboard")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(lp("/dashboard/templates"))}>
              <Copy className="h-4 w-4 mr-2" />{tt("createFromTemplate")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <Input placeholder={tt("searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${isRTL ? "pr-9 text-right placeholder:text-right" : "pl-9 text-left placeholder:text-left"}`} />
        </div>

        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {[
            { v: "card", icon: LayoutGrid, label: tt("cardView") },
            { v: "grid", icon: Grid2x2, label: tt("gridView") },
            { v: "table", icon: ListIcon, label: tt("tableView") },
          ].map((m, i) => (
            <TooltipProvider key={m.v} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView(m.v as any)}
                    className={`p-2 ${i > 0 ? "border-l border-border" : ""} ${view === m.v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                    aria-label={m.label}
                  >
                    <m.icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{m.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <Button variant="outline" size="icon" aria-label={tt("refresh")} onClick={() => toast.success(tt("refreshed"))}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="flex items-center rounded-md border border-border overflow-hidden bg-muted/30">
          {[
            { v: "all", label: tt("all") },
            { v: "mine", label: tt("mine") },
            { v: "shared", label: tt("shared") },
            { v: "archived", label: tt("archived") },
          ].map((tab, i) => (
            <button
              key={tab.v}
              onClick={() => { setFilter(tab.v as any); setPage(1); }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                i > 0 ? "border-l border-border" : ""
              } ${
                filter === tab.v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="w-[200px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">{tt("sortRecent")}</SelectItem>
            <SelectItem value="name">{tt("sortName")}</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={selectedCount === 0} className="gap-2">
              {tt("actions")}{selectedCount > 0 ? ` (${selectedCount})` : ""}<ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover w-48">
            <DropdownMenuItem onClick={() => handleBulkAction("duplicate")}><Copy className="h-4 w-4 mr-2" />{tt("duplicateSel")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("pin")}><Pin className="h-4 w-4 mr-2" />{tt("pinSel")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBulkAction("archive")}><Archive className="h-4 w-4 mr-2" />{tt("archiveSel")}</DropdownMenuItem>
            {filter === "archived" && <DropdownMenuItem onClick={() => handleBulkAction("restore")}><Archive className="h-4 w-4 mr-2" />{tt("restoreSel")}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => handleBulkAction("delete")} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />{tt("deleteSel")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {view !== "table" && pinned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Pin className="h-4 w-4 text-foreground" />
            <h2 className="text-base font-semibold text-foreground">{tt("pinnedDashboards")}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{tt("pinnedDesc")}</p>
          <div className={`grid gap-4 ${view === "card" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
            {pinned.map((d) => (
              <DashboardCard key={d.id} d={d} compact={view === "grid"} selected={selectedIds.has(d.id)} onToggleSelect={(checked) => toggleRowSelection(d.id, checked)} onOpen={() => handleAction("open", d)} onAction={handleAction} lang={lang} timeAgo={timeAgo} />
            ))}
          </div>
        </div>
      )}

      {view !== "table" && (
        <div className="flex items-center gap-2 mb-3">
          {/* Select-all for the cards below, the same one the table header
              carries, and over the same page of rows. */}
          {paged.length > 0 && (
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
              onCheckedChange={toggleVisibleSelection}
              aria-label={tt("selectAll")}
              className="me-1"
            />
          )}
          <h2 className="text-base font-semibold text-foreground">
            {filter === "archived" ? tt("archivedDashboards") : tt("allDashboards")}
          </h2>
          <Badge variant="secondary" className="font-normal">{all.length} {tt("dashboardsLower")}</Badge>
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground">{selectedCount} {tt("selected")}</span>
          )}
        </div>
      )}

      {all.length === 0 && filter === "archived" && (
        <Card className="p-8 min-h-[320px] flex flex-col items-center justify-center text-center">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6" aria-hidden>
            <rect x="20" y="30" width="80" height="60" rx="6" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="hsl(var(--muted))" opacity="0.4" />
            <path d="M20 50 L60 50 L100 50" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
            <rect x="45" y="50" width="30" height="6" fill="hsl(var(--muted-foreground))" opacity="0.3" rx="1" />
            <line x1="35" y1="70" x2="85" y2="70" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <line x1="35" y1="78" x2="70" y2="78" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">{tt("noArchivedTitle")}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{tt("noArchivedDesc")}</p>
        </Card>
      )}

      {all.length === 0 && filter === "archived" ? null : (
        <>
          {view === "card" && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paged.map((d) => (
                <DashboardCard key={d.id} d={d} selected={selectedIds.has(d.id)} onToggleSelect={(checked) => toggleRowSelection(d.id, checked)} onOpen={() => handleAction("open", d)} onAction={handleAction} lang={lang} timeAgo={timeAgo} />
              ))}
            </div>
          )}

          {view === "grid" && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {paged.map((d) => (
                <DashboardCard key={d.id} d={d} compact selected={selectedIds.has(d.id)} onToggleSelect={(checked) => toggleRowSelection(d.id, checked)} onOpen={() => handleAction("open", d)} onAction={handleAction} lang={lang} timeAgo={timeAgo} />
              ))}
            </div>
          )}

          {view === "table" && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left rtl:text-right">
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                          onCheckedChange={toggleVisibleSelection}
                          aria-label={tt("colDashboard")}
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">{tt("colDashboard")}</th>
                      <th className="px-4 py-3 font-medium">{tt("colCategory")}</th>
                      <th className="px-4 py-3 font-medium">{tt("colLocation")}</th>
                      <th className="px-4 py-3 font-medium">{tt("colOwner")}</th>
                      <th className="px-4 py-3 font-medium">{tt("colLastUpdated")}</th>
                      <th className="px-4 py-3 font-medium">{tt("colStatus")}</th>
                      <th className="px-4 py-3 font-medium text-right rtl:text-left">{tt("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => handleAction("open", d)}
                        className="border-t border-border hover:bg-muted/30 cursor-pointer"
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(d.id)}
                            onCheckedChange={(checked) => toggleRowSelection(d.id, checked)}
                            aria-label={d.name}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Thumb d={d} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground truncate">{d.name}</span>
                                {d.pinned && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                              </div>
                              {d.description && <p className="text-xs text-muted-foreground truncate max-w-[280px]">{d.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {d.category && <Badge variant="secondary" className={`${categoryColor(d.category)} border-0 font-normal`}>{categoryLabel(d.category, lang)}</Badge>}
                        </td>
                        <td className="px-4 py-3"><LocationCell path={d.location} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{d.owner.charAt(0)}</div>
                            <span className="text-foreground">{d.owner}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{timeAgo(d.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`h-1.5 w-1.5 rounded-full ${d.status === "Published" ? "bg-emerald-500" : d.status === "Draft" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                            {statusLabel(d.status, lang)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                          <RowActions d={d} onAction={handleAction} lang={lang} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {all.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{tt("rowsPerPage")}</span>
                <Select value="10" onValueChange={() => {}}>
                  <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, all.length)} {tt("of")} {all.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 3).map((p) => (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="icon" onClick={() => setPage(p)} className={p === page ? "bg-primary text-primary-foreground" : ""}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("deleteDashboardQ")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("deleteOneDesc")} <span className="font-medium text-foreground">{pendingDelete?.name}</span>. {tt("cannotUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete.id);
                  toast.success(tt("dashboardDeleted"));
                  setPendingDelete(null);
                }
              }}
            >
              {tt("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingBulkDelete} onOpenChange={setPendingBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("deleteSelectedQ")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("willDelete")} {selectedCount} {tt("selected")} {tt("dashboardsLower")}. {tt("cannotUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                selectedItems.forEach((d) => remove(d.id));
                toast.success(`${selectedCount} ${tt("dashboardsDeleted")}`);
                setSelectedIds(new Set());
                setPendingBulkDelete(false);
              }}
            >
              {tt("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Dashboard;
