import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronUp, UploadCloud, X, Info } from "lucide-react";
import { useDashboards, DashboardItem } from "@/hooks/useDashboards";
import { toast } from "sonner";

type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  dashboards: { en: "Dashboards", ar: "اللوحات", fa: "داشبوردها" },
  editDashboard: { en: "Edit Dashboard", ar: "تعديل اللوحة", fa: "ویرایش داشبورد" },
  createDashboard: { en: "Create Dashboard", ar: "إنشاء لوحة", fa: "ایجاد داشبورد" },
  createNewDashboard: { en: "Create New Dashboard", ar: "إنشاء لوحة جديدة", fa: "ایجاد داشبورد جدید" },
  pageSubtitle: { en: "Set up your dashboard details. You can create a dashboard with just a name.", ar: "أعدّ تفاصيل لوحتك. يمكنك إنشاء لوحة بمجرد إدخال الاسم.", fa: "جزئیات داشبورد را تنظیم کنید. می‌توانید فقط با یک نام داشبورد بسازید." },
  basicInfo: { en: "Basic Information", ar: "المعلومات الأساسية", fa: "اطلاعات پایه" },
  accessVisibility: { en: "Access & Visibility", ar: "الوصول والظهور", fa: "دسترسی و نمایش" },
  advancedOptions: { en: "Advanced Options", ar: "خيارات متقدمة", fa: "گزینه‌های پیشرفته" },
  optional: { en: "Optional", ar: "اختياري", fa: "اختیاری" },
  dashboardName: { en: "Dashboard Name", ar: "اسم اللوحة", fa: "نام داشبورد" },
  enterDashboardName: { en: "Enter dashboard name", ar: "أدخل اسم اللوحة", fa: "نام داشبورد را وارد کنید" },
  description: { en: "Description", ar: "الوصف", fa: "توضیحات" },
  enterDescription: { en: "Enter a short description", ar: "أدخل وصفاً موجزاً", fa: "توضیح کوتاهی وارد کنید" },
  category: { en: "Category", ar: "الفئة", fa: "دسته‌بندی" },
  selectCategory: { en: "Select category", ar: "اختر فئة", fa: "دسته‌بندی را انتخاب کنید" },
  location: { en: "Location", ar: "الموقع", fa: "مکان" },
  selectLocation: { en: "Select location", ar: "اختر موقعاً", fa: "مکان را انتخاب کنید" },
  coverImage: { en: "Cover Image", ar: "صورة الغلاف", fa: "تصویر کاور" },
  removeImage: { en: "Remove image", ar: "إزالة الصورة", fa: "حذف تصویر" },
  uploadImage: { en: "Upload image", ar: "رفع صورة", fa: "بارگذاری تصویر" },
  imageHint: { en: "PNG, JPG or WEBP (max 2MB)", ar: "PNG أو JPG أو WEBP (بحد أقصى 2MB)", fa: "PNG، JPG یا WEBP (حداکثر ۲ مگابایت)" },
  imageTooLarge: { en: "Image must be under 2MB", ar: "يجب أن تكون الصورة أقل من 2MB", fa: "حجم تصویر باید کمتر از ۲ مگابایت باشد" },
  whoCanAccess: { en: "Who can access this dashboard?", ar: "من يمكنه الوصول إلى هذه اللوحة؟", fa: "چه کسی به این داشبورد دسترسی دارد؟" },
  shareWith: { en: "Share with", ar: "مشاركة مع", fa: "اشتراک‌گذاری با" },
  searchUsersTeams: { en: "Search users or teams...", ar: "ابحث عن مستخدمين أو فرق...", fa: "جستجوی کاربران یا تیم‌ها..." },
  onlyMe: { en: "Only me", ar: "أنا فقط", fa: "فقط من" },
  myTeam: { en: "My team", ar: "فريقي", fa: "تیم من" },
  entireOrg: { en: "Entire organization", ar: "المؤسسة بأكملها", fa: "کل سازمان" },
  publicAccess: { en: "Public", ar: "عام", fa: "عمومی" },
  refreshInterval: { en: "Refresh Interval", ar: "فترة التحديث", fa: "بازه به‌روزرسانی" },
  timeRange: { en: "Time Range", ar: "النطاق الزمني", fa: "بازه زمانی" },
  timezone: { en: "Timezone", ar: "المنطقة الزمنية", fa: "منطقه زمانی" },
  tags: { en: "Tags", ar: "الوسوم", fa: "برچسب‌ها" },
  addTags: { en: "Add tags...", ar: "أضف وسوماً...", fa: "افزودن برچسب‌ها..." },
  tagsHint: { en: "Press Enter to add multiple tags", ar: "اضغط Enter لإضافة وسوم متعددة", fa: "برای افزودن چند برچسب Enter را بزنید" },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  saveChanges: { en: "Save Changes", ar: "حفظ التغييرات", fa: "ذخیره تغییرات" },
  nameRequired: { en: "Dashboard name is required", ar: "اسم اللوحة مطلوب", fa: "نام داشبورد الزامی است" },
  dashboardUpdated: { en: "Dashboard updated", ar: "تم تحديث اللوحة", fa: "داشبورد به‌روزرسانی شد" },
  dashboardCreated: { en: "Dashboard created", ar: "تم إنشاء اللوحة", fa: "داشبورد ایجاد شد" },
  // Categories
  catOperations: { en: "Operations", ar: "العمليات", fa: "عملیات" },
  catUtilities: { en: "Utilities", ar: "المرافق", fa: "تأسیسات" },
  catAIAnalytics: { en: "AI Analytics", ar: "تحليلات الذكاء الاصطناعي", fa: "تحلیل‌های هوش مصنوعی" },
  catEnergy: { en: "Energy", ar: "الطاقة", fa: "انرژی" },
  catQuality: { en: "Quality", ar: "الجودة", fa: "کیفیت" },
  catSafety: { en: "Safety", ar: "السلامة", fa: "ایمنی" },
  catMaintenance: { en: "Maintenance", ar: "الصيانة", fa: "نگهداری" },
  catExecutive: { en: "Executive", ar: "تنفيذي", fa: "اجرایی" },
  // Locations
  locAllSites: { en: "All Sites", ar: "جميع المواقع", fa: "همه سایت‌ها" },
  // Refresh
  refManual: { en: "Manual", ar: "يدوي", fa: "دستی" },
  ref30s: { en: "Every 30 seconds", ar: "كل 30 ثانية", fa: "هر ۳۰ ثانیه" },
  ref1m: { en: "Every minute", ar: "كل دقيقة", fa: "هر دقیقه" },
  ref5m: { en: "Every 5 minutes", ar: "كل 5 دقائق", fa: "هر ۵ دقیقه" },
  ref15m: { en: "Every 15 minutes", ar: "كل 15 دقيقة", fa: "هر ۱۵ دقیقه" },
  ref1h: { en: "Every hour", ar: "كل ساعة", fa: "هر ساعت" },
  // Time ranges
  tr15m: { en: "Last 15 minutes", ar: "آخر 15 دقيقة", fa: "۱۵ دقیقه گذشته" },
  tr1h: { en: "Last hour", ar: "آخر ساعة", fa: "ساعت گذشته" },
  tr24h: { en: "Last 24 Hours", ar: "آخر 24 ساعة", fa: "۲۴ ساعت گذشته" },
  tr7d: { en: "Last 7 Days", ar: "آخر 7 أيام", fa: "۷ روز گذشته" },
  tr30d: { en: "Last 30 Days", ar: "آخر 30 يوماً", fa: "۳۰ روز گذشته" },
};

const CATEGORY_KEYS: Array<{ v: string; k: keyof typeof DICT }> = [
  { v: "Operations", k: "catOperations" },
  { v: "Utilities", k: "catUtilities" },
  { v: "AI Analytics", k: "catAIAnalytics" },
  { v: "Energy", k: "catEnergy" },
  { v: "Quality", k: "catQuality" },
  { v: "Safety", k: "catSafety" },
  { v: "Maintenance", k: "catMaintenance" },
  { v: "Executive", k: "catExecutive" },
];
const LOCATIONS = ["All Sites", "Factory A", "Factory A > Line 1", "Factory A > Sulfonation", "Factory A > Utilities", "Factory B", "Factory B > Boiler", "Factory B > Packaging", "Factory C > WTP"];
const REFRESH_KEYS: Array<{ v: string; k: keyof typeof DICT }> = [
  { v: "Manual", k: "refManual" },
  { v: "Every 30 seconds", k: "ref30s" },
  { v: "Every minute", k: "ref1m" },
  { v: "Every 5 minutes", k: "ref5m" },
  { v: "Every 15 minutes", k: "ref15m" },
  { v: "Every hour", k: "ref1h" },
];
const TIME_RANGE_KEYS: Array<{ v: string; k: keyof typeof DICT }> = [
  { v: "Last 15 minutes", k: "tr15m" },
  { v: "Last hour", k: "tr1h" },
  { v: "Last 24 Hours", k: "tr24h" },
  { v: "Last 7 Days", k: "tr7d" },
  { v: "Last 30 Days", k: "tr30d" },
];
const TIMEZONES = ["(UTC) Coordinated Universal Time", "(UTC+03:30) Tehran", "(UTC+03:00) Riyadh", "(UTC-05:00) Eastern Time", "(UTC+01:00) Central European Time"];

interface FormState {
  name: string;
  description: string;
  category: string;
  location: string;
  coverImage: string;
  access: DashboardItem["access"];
  shareWith: string[];
  refreshInterval: string;
  timeRange: string;
  timezone: string;
  tags: string[];
}

const initial: FormState = {
  name: "",
  description: "",
  category: "",
  location: "",
  coverImage: "",
  access: "only_me",
  shareWith: [],
  refreshInterval: "Manual",
  timeRange: "Last 24 Hours",
  timezone: "(UTC) Coordinated Universal Time",
  tags: [],
};

const SectionHeader = ({ title, optional, optionalLabel, open }: { title: string; optional?: boolean; optionalLabel: string; open: boolean }) => (
  <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
    <div className="flex items-center gap-2">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {optional && <span className="text-sm text-muted-foreground">({optionalLabel})</span>}
    </div>
    <ChevronUp className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`} />
  </CollapsibleTrigger>
);

const FieldLabel = ({ children, required, hint, optionalLabel }: { children: React.ReactNode; required?: boolean; hint?: boolean; optionalLabel: string }) => (
  <Label className="text-sm font-medium text-foreground inline-flex items-center gap-1.5 mb-2">
    {children}
    {required && <span className="text-destructive">*</span>}
    {!required && <span className="text-muted-foreground font-normal">({optionalLabel})</span>}
    {hint && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
  </Label>
);

const DashboardForm = () => {
  const { language, isRTL } = useLanguage();
  const lang = (language as Lang) || "en";
  const tt = (k: keyof typeof DICT) => DICT[k][lang] ?? DICT[k].en;
  const navigate = useNavigate();
  const params = useParams<{ id?: string; lang?: string }>();
  const { items, create, update } = useDashboards();
  const isEdit = !!params.id;
  const existing = useMemo(() => items.find((i) => i.id === params.id), [items, params.id]);

  const [form, setForm] = useState<FormState>(initial);
  const [tagInput, setTagInput] = useState("");
  const [openBasic, setOpenBasic] = useState(true);
  const [openAccess, setOpenAccess] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        description: existing.description || "",
        category: existing.category || "",
        location: existing.location || "",
        coverImage: existing.coverImage || "",
        access: existing.access,
        shareWith: existing.shareWith || [],
        refreshInterval: existing.refreshInterval,
        timeRange: existing.timeRange,
        timezone: existing.timezone,
        tags: existing.tags,
      });
    }
  }, [isEdit, existing]);

  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const handleImage = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tt("imageTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setForm((f) => ({ ...f, coverImage: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (form.tags.includes(t)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error(tt("nameRequired"));
      return;
    }
    if (isEdit && existing) {
      update(existing.id, { ...form });
      toast.success(tt("dashboardUpdated"));
    } else {
      create({ ...form });
      toast.success(tt("dashboardCreated"));
    }
    navigate(lp("/dashboard"));
  };

  const optionalLabel = tt("optional");
  const accessLabel = (v: string) =>
    v === "only_me" ? tt("onlyMe") :
    v === "team" ? tt("myTeam") :
    v === "organization" ? tt("entireOrg") :
    v === "public" ? tt("publicAccess") : v;

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/dashboard"))} className="cursor-pointer">{tt("dashboards")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isEdit ? tt("editDashboard") : tt("createDashboard")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{isEdit ? tt("editDashboard") : tt("createNewDashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tt("pageSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <Card className="overflow-hidden">
          <Collapsible open={openBasic} onOpenChange={setOpenBasic}>
            <SectionHeader title={tt("basicInfo")} optionalLabel={optionalLabel} open={openBasic} />
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <FieldLabel required hint optionalLabel={optionalLabel}>{tt("dashboardName")}</FieldLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={tt("enterDashboardName")}
                    />
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("description")}</FieldLabel>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder={tt("enterDescription")}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("category")}</FieldLabel>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder={tt("selectCategory")} /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_KEYS.map((c) => <SelectItem key={c.v} value={c.v}>{tt(c.k)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("location")}</FieldLabel>
                    <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                      <SelectTrigger><SelectValue placeholder={tt("selectLocation")} /></SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((c) => <SelectItem key={c} value={c}>{c === "All Sites" ? tt("locAllSites") : c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("coverImage")}</FieldLabel>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                    />
                    {form.coverImage ? (
                      <div className="relative border border-border rounded-md overflow-hidden h-[88px]">
                        <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setForm({ ...form, coverImage: "" })}
                          className="absolute top-1 right-1 bg-background/90 hover:bg-background rounded-full p-1 border border-border"
                          aria-label={tt("removeImage")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full h-[88px] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <UploadCloud className="h-4 w-4" />
                          {tt("uploadImage")}
                        </div>
                        <span className="text-xs">{tt("imageHint")}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Access & Visibility */}
        <Card className="overflow-hidden">
          <Collapsible open={openAccess} onOpenChange={setOpenAccess}>
            <SectionHeader title={tt("accessVisibility")} optionalLabel={optionalLabel} open={openAccess} />
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("whoCanAccess")}</FieldLabel>
                    <Select value={form.access} onValueChange={(v: any) => setForm({ ...form, access: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["only_me", "team", "organization", "public"].map((v) => (
                          <SelectItem key={v} value={v}>{accessLabel(v)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("shareWith")}</FieldLabel>
                    <Input placeholder={tt("searchUsersTeams")} disabled />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Advanced Options */}
        <Card className="overflow-hidden">
          <Collapsible open={openAdvanced} onOpenChange={setOpenAdvanced}>
            <SectionHeader title={tt("advancedOptions")} optional optionalLabel={optionalLabel} open={openAdvanced} />
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("refreshInterval")}</FieldLabel>
                    <Select value={form.refreshInterval} onValueChange={(v) => setForm({ ...form, refreshInterval: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REFRESH_KEYS.map((c) => <SelectItem key={c.v} value={c.v}>{tt(c.k)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("timeRange")}</FieldLabel>
                    <Select value={form.timeRange} onValueChange={(v) => setForm({ ...form, timeRange: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_RANGE_KEYS.map((c) => <SelectItem key={c.v} value={c.v}>{tt(c.k)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("timezone")}</FieldLabel>
                    <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-5">
                  <FieldLabel hint optionalLabel={optionalLabel}>{tt("tags")}</FieldLabel>
                  <div className="border border-border rounded-md px-3 py-2 flex flex-wrap items-center gap-1.5 min-h-[42px] focus-within:ring-2 focus-within:ring-ring/30">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }
                        if (e.key === "Backspace" && !tagInput && form.tags.length) {
                          setForm({ ...form, tags: form.tags.slice(0, -1) });
                        }
                      }}
                      placeholder={form.tags.length ? "" : tt("addTags")}
                      className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{tt("tagsHint")}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

      </div>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(lp("/dashboard"))}>{tt("cancel")}</Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isEdit ? tt("saveChanges") : tt("createDashboard")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardForm;
