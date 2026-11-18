import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  dashboardKeys,
  dashboardService,
  emptyDashboardDefinition,
  useCreateDashboardCategoryMutation,
  useCreateDashboardMutation,
  useGetDashboardQuery,
  useListDashboardCategoriesQuery,
  useListDashboardGrantsQuery,
  useListWorkspaceMembersQuery,
  useUpdateDashboardMutation,
  type CreateDashboardRequest,
  type DashboardDefinition,
  type DashboardGrant,
  type DashboardPermission,
  type DashboardSettings,
  type DashboardVisibility,
  type WorkspaceMember,
} from "@paapeli/api";
import { getCurrentUserId } from "@paapeli/brand/session";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import { Badge } from "@/features/factory/components/ui/badge";
import { Card } from "@/features/factory/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/factory/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { ChevronUp, UploadCloud, X, Info, Loader2, Plus } from "lucide-react";
import { isBuiltInDashboardId } from "@/features/factory/hooks/useDashboards";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { currentProductKey } from "@/features/factory/lib/product";
import {
  DEFAULT_DASHBOARD_SETTINGS,
  IANA_ZONES,
  REFRESH_OPTIONS,
  TIME_WINDOW_OPTIONS,
  TIME_ZONE_MODE_LABELS,
  timeZoneToValue,
  valueToTimeZone,
} from "@/features/factory/lib/dashboardSettings";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { toast } from "@/shared/lib/toast";
import { localizedPath } from "@/features/factory/lib/localizedPath";

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
  noCategory: { en: "No category", ar: "بدون فئة", fa: "بدون دسته‌بندی" },
  newCategory: { en: "New category…", ar: "فئة جديدة…", fa: "دسته‌بندی جدید…" },
  newCategoryName: { en: "Category name", ar: "اسم الفئة", fa: "نام دسته‌بندی" },
  add: { en: "Add", ar: "إضافة", fa: "افزودن" },
  categoryCreated: { en: "Category created", ar: "تم إنشاء الفئة", fa: "دسته‌بندی ایجاد شد" },
  categoryFailed: { en: "Couldn't create the category", ar: "تعذر إنشاء الفئة", fa: "ایجاد دسته‌بندی ممکن نشد" },
  location: { en: "Location", ar: "الموقع", fa: "مکان" },
  selectLocation: { en: "Select location", ar: "اختر موقعاً", fa: "مکان را انتخاب کنید" },
  coverImage: { en: "Cover Image", ar: "صورة الغلاف", fa: "تصویر کاور" },
  removeImage: { en: "Remove image", ar: "إزالة الصورة", fa: "حذف تصویر" },
  uploadImage: { en: "Upload image", ar: "رفع صورة", fa: "بارگذاری تصویر" },
  imageHint: { en: "PNG, JPG or WEBP (max 2MB)", ar: "PNG أو JPG أو WEBP (بحد أقصى 2MB)", fa: "PNG، JPG یا WEBP (حداکثر ۲ مگابایت)" },
  imageTooLarge: { en: "Image must be under 2MB", ar: "يجب أن تكون الصورة أقل من 2MB", fa: "حجم تصویر باید کمتر از ۲ مگابایت باشد" },
  whoCanAccess: { en: "Who can access this dashboard?", ar: "من يمكنه الوصول إلى هذه اللوحة؟", fa: "چه کسی به این داشبورد دسترسی دارد؟" },
  visPrivate: { en: "Only me (and people I share with)", ar: "أنا فقط (ومن أشاركهم)", fa: "فقط من (و افرادی که با آن‌ها به اشتراک می‌گذارم)" },
  visWorkspace: { en: "Everyone in this workspace", ar: "كل من في مساحة العمل", fa: "همه اعضای این فضای کاری" },
  shareWith: { en: "Share with", ar: "مشاركة مع", fa: "اشتراک‌گذاری با" },
  searchMembers: { en: "Search members by name or email…", ar: "ابحث عن الأعضاء بالاسم أو البريد…", fa: "جستجوی اعضا با نام یا ایمیل…" },
  noMembers: { en: "No matching members", ar: "لا يوجد أعضاء مطابقون", fa: "عضوی یافت نشد" },
  canView: { en: "Can view", ar: "يمكنه العرض", fa: "مشاهده" },
  canEdit: { en: "Can edit", ar: "يمكنه التعديل", fa: "ویرایش" },
  removeMember: { en: "Remove", ar: "إزالة", fa: "حذف" },
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
  saveFailed: { en: "Couldn't save the dashboard", ar: "تعذر حفظ اللوحة", fa: "ذخیره داشبورد ممکن نشد" },
  conflict: { en: "Someone else changed this dashboard. The latest version is loaded — review it and save again.", ar: "قام شخص آخر بتغيير هذه اللوحة. تم تحميل أحدث نسخة — راجعها واحفظ مرة أخرى.", fa: "شخص دیگری این داشبورد را تغییر داده است. آخرین نسخه بارگذاری شد؛ آن را بررسی و دوباره ذخیره کنید." },
  grantsFailed: { en: "Saved, but sharing couldn't be fully updated", ar: "تم الحفظ، لكن تعذر تحديث المشاركة بالكامل", fa: "ذخیره شد، اما اشتراک‌گذاری به‌طور کامل به‌روز نشد" },
  noWorkspace: { en: "Select a workspace first", ar: "اختر مساحة عمل أولاً", fa: "ابتدا یک فضای کاری انتخاب کنید" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…", fa: "در حال بارگذاری…" },
  notFound: { en: "This dashboard doesn't exist or you don't have access to it.", ar: "هذه اللوحة غير موجودة أو ليس لديك صلاحية الوصول إليها.", fa: "این داشبورد وجود ندارد یا به آن دسترسی ندارید." },
  builtInReadOnly: { en: "Built-in dashboards can't be edited", ar: "لا يمكن تعديل اللوحات المدمجة", fa: "داشبوردهای داخلی قابل ویرایش نیستند" },
  locAllSites: { en: "All Sites", ar: "جميع المواقع", fa: "همه سایت‌ها" },
  locLoading: { en: "Loading locations…", ar: "جارٍ تحميل المواقع…", fa: "در حال بارگذاری مکان‌ها…" },
  locNone: { en: "No locations defined", ar: "لم يتم تعريف مواقع", fa: "مکانی تعریف نشده است" },
};

/* Radix Select items can't carry "", so "nothing chosen" gets a sentinel. */
const NONE = "__none";
const MANUAL = "__manual";
const NEW_CATEGORY = "__new";

interface ShareEntry {
  workspaceMembershipId: string;
  name: string;
  permission: DashboardPermission;
}

interface FormState {
  name: string;
  description: string;
  categoryId: string; // NONE when unset
  assetId: string; // NONE = all sites
  coverImage: string;
  visibility: DashboardVisibility;
  share: ShareEntry[];
  settings: DashboardSettings;
  tags: string[];
}

const initial: FormState = {
  name: "",
  description: "",
  categoryId: NONE,
  assetId: NONE,
  coverImage: "",
  visibility: "PRIVATE",
  share: [],
  settings: DEFAULT_DASHBOARD_SETTINGS,
  tags: [],
};

const memberName = (m: Pick<WorkspaceMember, "displayName" | "email">) => m.displayName || m.email || "—";

/** Waits `ms` after the last change before handing the value on. */
const useDebounced = <T,>(value: T, ms: number) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
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

/** Member search + the list of people this dashboard is shared with. */
const SharePicker = ({
  workspaceId,
  value,
  onChange,
  tt,
}: {
  workspaceId: string;
  value: ShareEntry[];
  onChange: (next: ShareEntry[]) => void;
  tt: (k: keyof typeof DICT) => string;
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(search.trim(), 300);
  const { data, isFetching } = useListWorkspaceMembersQuery(workspaceId, debounced, 1, 20, open);
  const me = getCurrentUserId();
  const chosen = new Set(value.map((v) => v.workspaceMembershipId));
  const results = (data?.data ?? []).filter(
    (m) => m.status === "ACTIVE" && m.userId !== me && !chosen.has(m.workspaceMembershipId),
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={search}
          placeholder={tt("searchMembers")}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-60 overflow-auto">
            {isFetching && !data ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">{tt("loading")}</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">{tt("noMembers")}</div>
            ) : (
              results.map((m) => (
                <button
                  key={m.workspaceMembershipId}
                  type="button"
                  // mousedown, not click: the input's blur would close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange([...value, { workspaceMembershipId: m.workspaceMembershipId, name: memberName(m), permission: "VIEW" }]);
                    setSearch("");
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-muted text-sm"
                >
                  <div className="font-medium">{memberName(m)}</div>
                  {m.email && m.displayName && <div className="text-xs text-muted-foreground">{m.email}</div>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {value.map((s) => (
            <li key={s.workspaceMembershipId} className="flex items-center gap-2 px-3 py-1.5">
              <span className="flex-1 truncate text-sm">{s.name}</span>
              <Select
                value={s.permission}
                onValueChange={(p: DashboardPermission) =>
                  onChange(value.map((x) => (x.workspaceMembershipId === s.workspaceMembershipId ? { ...x, permission: p } : x)))
                }
              >
                <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">{tt("canView")}</SelectItem>
                  <SelectItem value="EDIT">{tt("canEdit")}</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                aria-label={tt("removeMember")}
                onClick={() => onChange(value.filter((x) => x.workspaceMembershipId !== s.workspaceMembershipId))}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DashboardForm = () => {
  const { language } = useLanguage();
  const lang = (language as Lang) || "en";
  const tt = (k: keyof typeof DICT) => DICT[k][lang] ?? DICT[k].en;
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const params = useParams<{ id?: string; lang?: string }>();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId() ?? "";
  const isEdit = !!params.id;
  const dashboardId = isEdit && !isBuiltInDashboardId(params.id) ? params.id! : "";

  /* The built-ins are pages of this app with nothing to edit server-side. */
  useEffect(() => {
    if (isEdit && isBuiltInDashboardId(params.id)) {
      toast.info(tt("builtInReadOnly"));
      navigate(lp("/dashboard"), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, params.id]);

  const existingQuery = useGetDashboardQuery(workspaceId, currentProductKey(), dashboardId);
  const existing = existingQuery.data;
  const grantsQuery = useListDashboardGrantsQuery(workspaceId, currentProductKey(), dashboardId);
  // Grants carry only a membership id; names come from the member list.
  const allMembers = useListWorkspaceMembersQuery(workspaceId, "", 1, 100, isEdit);
  const categoriesQuery = useListDashboardCategoriesQuery(workspaceId, currentProductKey());
  const createCategory = useCreateDashboardCategoryMutation();
  const createDashboard = useCreateDashboardMutation();
  const updateDashboard = useUpdateDashboardMutation();
  const { options: assetLocations, isLoading: locationsLoading } = useAssetLocations();

  const [form, setForm] = useState<FormState>(initial);
  const [tagInput, setTagInput] = useState("");
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openBasic, setOpenBasic] = useState(true);
  const [openAccess, setOpenAccess] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Fill the form once per loaded record version, so a refetch after a 409
     brings in the other person's changes. */
  const loadedVersion = useRef<string | null>(null);
  useEffect(() => {
    if (!existing) return;
    const key = `${existing.id}@${existing.recordVersion}`;
    if (loadedVersion.current === key) return;
    loadedVersion.current = key;
    setForm((f) => ({
      ...f,
      name: existing.name,
      description: existing.description ?? "",
      categoryId: existing.categoryId ?? NONE,
      assetId: existing.assetId ?? NONE,
      coverImage: existing.coverImageUri ?? "",
      visibility: existing.visibility,
      settings: { ...DEFAULT_DASHBOARD_SETTINGS, ...existing.definition?.settings },
    }));
  }, [existing]);

  const nameOf = useMemo(
    () => new Map((allMembers.data?.data ?? []).map((m) => [m.workspaceMembershipId, memberName(m)])),
    [allMembers.data],
  );
  const grantsLoaded = useRef(false);
  useEffect(() => {
    if (!grantsQuery.data || grantsLoaded.current) return;
    grantsLoaded.current = true;
    setForm((f) => ({
      ...f,
      share: grantsQuery.data.map((g) => ({ workspaceMembershipId: g.workspaceMembershipId, name: "", permission: g.permission })),
    }));
  }, [grantsQuery.data]);

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

  const addCategory = async () => {
    const name = newCategory?.trim();
    if (!name || !workspaceId) return;
    try {
      const created = await createCategory.mutateAsync({ workspaceId, productKey: currentProductKey(), name });
      setForm((f) => ({ ...f, categoryId: created.id }));
      setNewCategory(null);
      toast.success(tt("categoryCreated"));
    } catch (e) {
      toast.error(apiErrorMessage(e, tt("categoryFailed")));
    }
  };

  /** The fields the create and update requests share. */
  const metadata = (definition: DashboardDefinition): CreateDashboardRequest => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    categoryId: form.categoryId === NONE ? null : form.categoryId,
    assetId: form.assetId === NONE ? null : form.assetId,
    /* An uploaded image is only held in the page as a data: URL, which the
       gateway can't take (coverImageUri is a URI of at most 2048 chars).
       TODO(backend): upload the file and send the URI it returns. Until then
       only a URI that was already stored is sent back. */
    coverImageUri: /^https?:\/\//.test(form.coverImage) ? form.coverImage : null,
    visibility: form.visibility,
    definition,
    // TODO(backend): tags have no field on the dashboard API yet; form.tags is not sent.
  });

  /** Brings the server's grants in line with the share list. */
  const syncGrants = async (id: string, before: DashboardGrant[]) => {
    const was = new Map(before.map((g) => [g.workspaceMembershipId, g.permission]));
    const now = new Map(form.share.map((s) => [s.workspaceMembershipId, s.permission]));
    const calls: Promise<unknown>[] = [];
    now.forEach((permission, member) => {
      if (was.get(member) !== permission) calls.push(dashboardService.putGrant(workspaceId, currentProductKey(), id, member, permission));
    });
    was.forEach((_p, member) => {
      if (!now.has(member)) calls.push(dashboardService.deleteGrant(workspaceId, currentProductKey(), id, member));
    });
    const results = await Promise.allSettled(calls);
    queryClient.invalidateQueries({ queryKey: dashboardKeys.grants(workspaceId, currentProductKey(), id) });
    if (results.some((r) => r.status === "rejected")) toast.warning(tt("grantsFailed"));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(tt("nameRequired"));
      return;
    }
    if (!workspaceId) {
      toast.error(tt("noWorkspace"));
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        if (!existing) return;
        /* PUT replaces the whole record, definition included. Keep the
           widgets, sources and layouts exactly as the canvas saved them and
           change only the settings this form owns. */
        const definition: DashboardDefinition = {
          ...emptyDashboardDefinition(form.settings),
          ...existing.definition,
          settings: form.settings,
        };
        await updateDashboard.mutateAsync({
          workspaceId,
          productKey: currentProductKey(),
          dashboardId: existing.id,
          recordVersion: existing.recordVersion,
          ...metadata(definition),
        });
        await syncGrants(existing.id, grantsQuery.data ?? []);
        toast.success(tt("dashboardUpdated"));
        navigate(lp(`/dashboard/${existing.id}`));
      } else {
        /* Created with no widgets; the canvas adds them. Saving opens the
           dashboard, not the list you came from: you came here to build one. */
        const created = await createDashboard.mutateAsync({
          workspaceId,
          productKey: currentProductKey(),
          ...metadata(emptyDashboardDefinition(form.settings)),
        });
        await syncGrants(created.id, []);
        toast.success(tt("dashboardCreated"));
        navigate(lp(`/dashboard/${created.id}`));
      }
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error(tt("conflict"));
        existingQuery.refetch();
      } else {
        toast.error(apiErrorMessage(e, tt("saveFailed")));
      }
    } finally {
      setSaving(false);
    }
  };

  const optionalLabel = tt("optional");
  const categories = categoriesQuery.data ?? [];
  const tzValue = timeZoneToValue(form.settings.timeZone);
  const tzIsCustom = tzValue.startsWith("iana:") && !IANA_ZONES.some((z) => `iana:${z.zoneId}` === tzValue);

  if (isEdit && dashboardId && (existingQuery.isLoading || !workspaceId)) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-10"><Loader2 className="h-4 w-4 animate-spin" />{tt("loading")}</div>;
  }
  if (isEdit && dashboardId && existingQuery.isError) {
    return (
      <div className="py-10 space-y-3">
        <p className="text-sm text-muted-foreground">{tt("notFound")}</p>
        <Button variant="outline" onClick={() => navigate(lp("/dashboard"))}>{tt("dashboards")}</Button>
      </div>
    );
  }

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
                      maxLength={255}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={tt("enterDashboardName")}
                    />
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("description")}</FieldLabel>
                    <Textarea
                      value={form.description}
                      maxLength={1000}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder={tt("enterDescription")}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("category")}</FieldLabel>
                    {newCategory === null ? (
                      <Select
                        value={form.categoryId}
                        onValueChange={(v) => (v === NEW_CATEGORY ? setNewCategory("") : setForm({ ...form, categoryId: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder={tt("selectCategory")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>{tt("noCategory")}</SelectItem>
                          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          <SelectSeparator />
                          <SelectItem value={NEW_CATEGORY}>
                            <span className="inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />{tt("newCategory")}</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          autoFocus
                          value={newCategory}
                          maxLength={255}
                          placeholder={tt("newCategoryName")}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addCategory(); }
                            if (e.key === "Escape") setNewCategory(null);
                          }}
                        />
                        <Button type="button" size="sm" className="h-10" onClick={addCategory} disabled={!newCategory.trim() || createCategory.isPending}>
                          {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : tt("add")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-10 px-2" onClick={() => setNewCategory(null)} aria-label={tt("cancel")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("location")}</FieldLabel>
                    <Select value={form.assetId} onValueChange={(v) => setForm({ ...form, assetId: v })}>
                      <SelectTrigger><SelectValue placeholder={locationsLoading ? tt("locLoading") : tt("selectLocation")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>{tt("locAllSites")}</SelectItem>
                        {assetLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.path}</SelectItem>)}
                        {!locationsLoading && assetLocations.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">{tt("locNone")}</div>
                        )}
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
        <Card className="overflow-visible">
          <Collapsible open={openAccess} onOpenChange={setOpenAccess}>
            <SectionHeader title={tt("accessVisibility")} optionalLabel={optionalLabel} open={openAccess} />
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("whoCanAccess")}</FieldLabel>
                    <Select value={form.visibility} onValueChange={(v: DashboardVisibility) => setForm({ ...form, visibility: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">{tt("visPrivate")}</SelectItem>
                        <SelectItem value="WORKSPACE_PRODUCT">{tt("visWorkspace")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("shareWith")}</FieldLabel>
                    <SharePicker
                      workspaceId={workspaceId}
                      value={form.share.map((s) => ({ ...s, name: s.name || nameOf.get(s.workspaceMembershipId) || s.workspaceMembershipId.slice(0, 8) }))}
                      onChange={(share) => setForm({ ...form, share })}
                      tt={tt}
                    />
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
                    <Select
                      value={form.settings.refreshInterval ?? MANUAL}
                      onValueChange={(v) => setForm({ ...form, settings: { ...form.settings, refreshInterval: v === MANUAL ? null : v } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REFRESH_OPTIONS.map((o) => (
                          <SelectItem key={o.value ?? MANUAL} value={o.value ?? MANUAL}>{o.label[lang]}</SelectItem>
                        ))}
                        {form.settings.refreshInterval && !REFRESH_OPTIONS.some((o) => o.value === form.settings.refreshInterval) && (
                          <SelectItem value={form.settings.refreshInterval}>{form.settings.refreshInterval}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("timeRange")}</FieldLabel>
                    <Select
                      value={form.settings.timeWindow.last}
                      onValueChange={(v) => setForm({ ...form, settings: { ...form.settings, timeWindow: { type: "relative", last: v } } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_WINDOW_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label[lang]}</SelectItem>)}
                        {!TIME_WINDOW_OPTIONS.some((o) => o.value === form.settings.timeWindow.last) && (
                          <SelectItem value={form.settings.timeWindow.last}>{form.settings.timeWindow.last}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint optionalLabel={optionalLabel}>{tt("timezone")}</FieldLabel>
                    <Select
                      value={tzValue}
                      onValueChange={(v) => setForm({ ...form, settings: { ...form.settings, timeZone: valueToTimeZone(v) } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workspace">{TIME_ZONE_MODE_LABELS.workspace[lang]}</SelectItem>
                        <SelectItem value="browser">{TIME_ZONE_MODE_LABELS.browser[lang]}</SelectItem>
                        <SelectSeparator />
                        {IANA_ZONES.map((z) => <SelectItem key={z.zoneId} value={`iana:${z.zoneId}`}>{z.label[lang]}</SelectItem>)}
                        {tzIsCustom && <SelectItem value={tzValue}>{tzValue.slice(5)}</SelectItem>}
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
          <Button variant="outline" onClick={() => navigate(lp(isEdit && dashboardId ? `/dashboard/${dashboardId}` : "/dashboard"))} disabled={saving}>
            {tt("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isEdit ? tt("saveChanges") : tt("createDashboard")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardForm;
