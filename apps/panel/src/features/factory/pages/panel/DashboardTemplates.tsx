import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { ArrowLeft, Plus, LayoutGrid } from "lucide-react";
import {
  emptyDashboardDefinition,
  useCreateDashboardMutation,
  useListDashboardCategoriesQuery,
} from "@paapeli/api";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { DEFAULT_DASHBOARD_SETTINGS } from "@/features/factory/lib/dashboardSettings";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { toast } from "@/shared/lib/toast";
import { localizedPath } from "@/features/factory/lib/localizedPath";

type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  dashboards: { en: "Dashboards", ar: "لوحات التحكم", fa: "داشبوردها" },
  templates: { en: "Templates", ar: "القوالب", fa: "قالب‌ها" },
  back: { en: "Back", ar: "رجوع", fa: "بازگشت" },
  title: { en: "Dashboard Templates", ar: "قوالب لوحات التحكم", fa: "قالب‌های داشبورد" },
  desc: { en: "Pick a ready-made template to quickly create a dashboard tailored to your operations.", ar: "اختر قالبًا جاهزًا لإنشاء لوحة تحكم مخصصة لعملياتك بسرعة.", fa: "یک قالب آماده انتخاب کنید تا به‌سرعت داشبوردی متناسب با عملیات خود بسازید." },
  useTemplate: { en: "Use this template", ar: "استخدم هذا القالب", fa: "استفاده از این قالب" },
  failed: { en: "Couldn't create the dashboard", ar: "تعذر إنشاء اللوحة", fa: "ایجاد داشبورد ممکن نشد" },
  created: { en: "created from template", ar: "تم إنشاؤها من القالب", fa: "از قالب ساخته شد" },
  catOperations: { en: "Operations", ar: "العمليات", fa: "عملیات" },
  catUtilities: { en: "Utilities", ar: "المرافق", fa: "تأسیسات" },
  catAIAnalytics: { en: "AI Analytics", ar: "تحليلات الذكاء الاصطناعي", fa: "تحلیل هوش مصنوعی" },
  catEnergy: { en: "Energy", ar: "الطاقة", fa: "انرژی" },
  catQuality: { en: "Quality", ar: "الجودة", fa: "کیفیت" },
  catSafety: { en: "Safety", ar: "السلامة", fa: "ایمنی" },
  catMaintenance: { en: "Maintenance", ar: "الصيانة", fa: "نگهداری" },
  catExecutive: { en: "Executive", ar: "تنفيذي", fa: "مدیریتی" },
  // template names
  n_sulf: { en: "Sulfonation Overview", ar: "نظرة عامة على السلفنة", fa: "نمای کلی سولفوناسیون" },
  n_boiler: { en: "Boiler Room Monitoring", ar: "مراقبة غرفة الغلايات", fa: "پایش اتاق بویلر" },
  n_aipm: { en: "AI Predictive Maintenance", ar: "الصيانة التنبؤية بالذكاء الاصطناعي", fa: "نگهداری پیش‌بینانه با هوش مصنوعی" },
  n_energy: { en: "Energy Consumption", ar: "استهلاك الطاقة", fa: "مصرف انرژی" },
  n_prod: { en: "Production Line Overview", ar: "نظرة عامة على خط الإنتاج", fa: "نمای کلی خط تولید" },
  n_qc: { en: "Quality Control Dashboard", ar: "لوحة مراقبة الجودة", fa: "داشبورد کنترل کیفیت" },
  n_safety: { en: "Safety Monitoring", ar: "مراقبة السلامة", fa: "پایش ایمنی" },
  n_comp: { en: "Compressor Monitoring", ar: "مراقبة الكمبروسر", fa: "پایش کمپرسور" },
  n_water: { en: "Water Treatment Plant", ar: "محطة معالجة المياه", fa: "تصفیه‌خانه آب" },
  n_exec: { en: "Executive Summary", ar: "ملخص تنفيذي", fa: "خلاصه مدیریتی" },
  // descriptions
  d_sulf: { en: "Real-time monitoring of sulfonation line performance and key parameters", ar: "مراقبة فورية لأداء خط السلفنة والمعاملات الرئيسية", fa: "پایش بلادرنگ عملکرد خط سولفوناسیون و پارامترهای کلیدی" },
  d_boiler: { en: "Monitor boiler efficiency, temperature, pressure and pump status", ar: "مراقبة كفاءة الغلاية ودرجة الحرارة والضغط وحالة المضخات", fa: "پایش بازده، دما، فشار و وضعیت پمپ‌های بویلر" },
  d_aipm: { en: "AI insights on asset health and failure prediction", ar: "رؤى الذكاء الاصطناعي حول صحة الأصول والتنبؤ بالأعطال", fa: "بینش‌های هوش مصنوعی درباره سلامت تجهیزات و پیش‌بینی خرابی" },
  d_energy: { en: "Track electricity and utility consumption across factories", ar: "تتبع استهلاك الكهرباء والمرافق عبر المصانع", fa: "ردیابی مصرف برق و تأسیسات در کارخانه‌ها" },
  d_prod: { en: "Overall production, OEE and line performance", ar: "الإنتاج العام وكفاءة المعدات الكلية وأداء الخط", fa: "تولید کلی، OEE و عملکرد خط" },
  d_qc: { en: "Quality metrics, defects and inspection results", ar: "مقاييس الجودة والعيوب ونتائج الفحص", fa: "شاخص‌های کیفیت، عیوب و نتایج بازرسی" },
  d_safety: { en: "Safety incidents, alerts and compliance status", ar: "حوادث السلامة والتنبيهات وحالة الامتثال", fa: "حوادث ایمنی، هشدارها و وضعیت انطباق" },
  d_comp: { en: "Compressor performance and health monitoring", ar: "أداء الكمبروسر ومراقبة الصحة", fa: "پایش عملکرد و سلامت کمپرسور" },
  d_water: { en: "Water quality, flow and pump station monitoring", ar: "مراقبة جودة المياه والتدفق ومحطات الضخ", fa: "پایش کیفیت آب، جریان و ایستگاه‌های پمپاژ" },
  d_exec: { en: "High-level KPIs and business performance overview", ar: "مؤشرات أداء عالية المستوى ونظرة عامة على أداء الأعمال", fa: "شاخص‌های کلیدی سطح بالا و نمای عملکرد کسب‌وکار" },
};

interface Template {
  id: string;
  nameKey: string;
  descKey: string;
  category: string;
  location: string;
  // canonical English values stored in dashboard items
  nameEn: string;
  descEn: string;
}

const TEMPLATES: Template[] = [
  { id: "t-sulf", nameKey: "n_sulf", descKey: "d_sulf", category: "Operations", location: "Factory A > Sulfonation", nameEn: "Sulfonation Overview", descEn: "Real-time monitoring of sulfonation line performance and key parameters" },
  { id: "t-boiler", nameKey: "n_boiler", descKey: "d_boiler", category: "Utilities", location: "Factory B > Boiler", nameEn: "Boiler Room Monitoring", descEn: "Monitor boiler efficiency, temperature, pressure and pump status" },
  { id: "t-aipm", nameKey: "n_aipm", descKey: "d_aipm", category: "AI Analytics", location: "All Sites", nameEn: "AI Predictive Maintenance", descEn: "AI insights on asset health and failure prediction" },
  { id: "t-energy", nameKey: "n_energy", descKey: "d_energy", category: "Energy", location: "Factory A", nameEn: "Energy Consumption", descEn: "Track electricity and utility consumption across factories" },
  { id: "t-prod", nameKey: "n_prod", descKey: "d_prod", category: "Operations", location: "Factory A > Line 1", nameEn: "Production Line Overview", descEn: "Overall production, OEE and line performance" },
  { id: "t-qc", nameKey: "n_qc", descKey: "d_qc", category: "Quality", location: "Factory B > Packaging", nameEn: "Quality Control Dashboard", descEn: "Quality metrics, defects and inspection results" },
  { id: "t-safety", nameKey: "n_safety", descKey: "d_safety", category: "Safety", location: "All Sites", nameEn: "Safety Monitoring", descEn: "Safety incidents, alerts and compliance status" },
  { id: "t-comp", nameKey: "n_comp", descKey: "d_comp", category: "Maintenance", location: "Factory A > Utilities", nameEn: "Compressor Monitoring", descEn: "Compressor performance and health monitoring" },
  { id: "t-water", nameKey: "n_water", descKey: "d_water", category: "Utilities", location: "Factory C > WTP", nameEn: "Water Treatment Plant", descEn: "Water quality, flow and pump station monitoring" },
  { id: "t-exec", nameKey: "n_exec", descKey: "d_exec", category: "Executive", location: "All Sites", nameEn: "Executive Summary", descEn: "High-level KPIs and business performance overview" },
];

const categoryColor = (cat: string) => {
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

const categoryLabel = (cat: string, lang: Lang) => {
  const map: Record<string, string> = {
    Operations: "catOperations", Utilities: "catUtilities", "AI Analytics": "catAIAnalytics",
    Energy: "catEnergy", Quality: "catQuality", Safety: "catSafety",
    Maintenance: "catMaintenance", Executive: "catExecutive",
  };
  const k = map[cat];
  return k && DICT[k] ? DICT[k][lang] : cat;
};

const DashboardTemplates = () => {
  const { language } = useLanguage();
  const lang = language as Lang;
  const tt = (k: string) => DICT[k]?.[lang] ?? k;
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const workspaceId = useWorkspaceId() ?? "";
  const createDashboard = useCreateDashboardMutation();
  const { data: categories } = useListDashboardCategoriesQuery(workspaceId, PRODUCT_KEY);

  /* A template is a named, empty dashboard shared with the workspace. Its
     category is set when the workspace has a category of that name; its
     location text is illustrative and has no asset to point at. */
  const useTemplate = async (tpl: Template) => {
    if (!workspaceId || createDashboard.isPending) return;
    try {
      const created = await createDashboard.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        name: tpl.nameEn,
        description: tpl.descEn,
        categoryId: categories?.find((c) => c.name.toLowerCase() === tpl.category.toLowerCase())?.id ?? null,
        visibility: "WORKSPACE_PRODUCT",
        definition: emptyDashboardDefinition(DEFAULT_DASHBOARD_SETTINGS),
      });
      toast.success(`"${tt(tpl.nameKey)}" ${tt("created")}`);
      /* Straight into the new dashboard, the same as building one by hand. */
      navigate(lp(`/dashboard/${created.id}`));
    } catch (e) {
      toast.error(apiErrorMessage(e, tt("failed")));
    }
  };

  return (
    <>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/dashboard"))} className="cursor-pointer">
              {tt("dashboards")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tt("templates")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(lp("/dashboard"))} className="gap-1.5 -ml-2">
              <ArrowLeft className="h-4 w-4" />{tt("back")}
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-2">{tt("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tt("desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.id} className="p-4 flex flex-col gap-3 hover:border-primary/60 hover:shadow-sm transition-all">
            <div className="h-24 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground">{tt(tpl.nameKey)}</h3>
              <Badge variant="secondary" className={`${categoryColor(tpl.category)} border-0 font-normal shrink-0`}>
                {categoryLabel(tpl.category, lang)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{tt(tpl.descKey)}</p>
            <div className="text-xs text-muted-foreground">{tpl.location}</div>
            <Button onClick={() => useTemplate(tpl)} size="sm" className="gap-1.5 w-full">
              <Plus className="h-4 w-4" />{tt("useTemplate")}
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
};

export default DashboardTemplates;
