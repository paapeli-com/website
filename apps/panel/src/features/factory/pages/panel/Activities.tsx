import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Button } from "@/features/factory/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/features/factory/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { HomeCrumb } from "@/shell/HomeCrumb";
import {
  Search, RefreshCw, Calendar, ChevronRight,
  ChevronUp, FileText, Users, Settings, Sparkles,
  Bell, Wifi, HardDrive, MapPin, LayoutGrid, WifiOff, Upload,
  Bot,
} from "lucide-react";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { localizedPath } from "@/features/factory/lib/localizedPath";

type Lang = "en" | "ar" | "fa";

const DICT: Record<string, Record<Lang, string>> = {
  overview: { en: "Overview", ar: "نظرة عامة", fa: "نمای کلی" },
  activities: { en: "Activities", ar: "الأنشطة", fa: "فعالیت‌ها" },
  events: { en: "Events", ar: "أحداث", fa: "رویداد" },
  searchPlaceholder: { en: "Search activities…", ar: "بحث في الأنشطة…", fa: "جست‌وجوی فعالیت‌ها…" },
  last1h: { en: "Last 1 hour", ar: "آخر ساعة", fa: "۱ ساعت اخیر" },
  last24h: { en: "Last 24 Hours", ar: "آخر 24 ساعة", fa: "۲۴ ساعت اخیر" },
  last7d: { en: "Last 7 days", ar: "آخر 7 أيام", fa: "۷ روز اخیر" },
  last30d: { en: "Last 30 days", ar: "آخر 30 يومًا", fa: "۳۰ روز اخیر" },
  refresh: { en: "Refresh", ar: "تحديث", fa: "بازآوری" },
  time: { en: "Time", ar: "الوقت", fa: "زمان" },
  activity: { en: "Activity", ar: "النشاط", fa: "فعالیت" },
  entity: { en: "Entity", ar: "الكيان", fa: "موجودیت" },
  location: { en: "Location", ar: "الموقع", fa: "مکان" },
  triggeredBy: { en: "Triggered By", ar: "تم تشغيله بواسطة", fa: "آغازگر" },
  timestamp: { en: "Timestamp", ar: "الطابع الزمني", fa: "زمان دقیق" },
  description: { en: "Description", ar: "الوصف", fa: "توضیحات" },
  today: { en: "Today", ar: "اليوم", fa: "امروز" },
  userActions: { en: "User Actions", ar: "إجراءات المستخدمين", fa: "اقدامات کاربر" },
  systemEvents: { en: "System Events", ar: "أحداث النظام", fa: "رویدادهای سیستم" },
  aiEvents: { en: "AI Events", ar: "أحداث الذكاء الاصطناعي", fa: "رویدادهای هوش مصنوعی" },
  of: { en: "of", ar: "من", fa: "از" },

  // activity types
  alarmAck: { en: "Alarm Acknowledged", ar: "تم تأكيد الإنذار", fa: "هشدار تأیید شد" },
  aiRecGenerated: { en: "AI Recommendation Generated", ar: "تم إنشاء توصية الذكاء الاصطناعي", fa: "توصیه هوش مصنوعی ایجاد شد" },
  deviceAdded: { en: "Device Added", ar: "تمت إضافة جهاز", fa: "دستگاه اضافه شد" },
  gatewayConnected: { en: "Gateway Connected", ar: "تم اتصال البوابة", fa: "گیت‌وی متصل شد" },
  ruleUpdated: { en: "Rule Updated", ar: "تم تحديث القاعدة", fa: "قاعده به‌روزرسانی شد" },
  locationCreated: { en: "Location Created", ar: "تم إنشاء الموقع", fa: "مکان ایجاد شد" },
  deviceOffline: { en: "Device Offline", ar: "الجهاز غير متصل", fa: "دستگاه آفلاین" },
  firmwareUploaded: { en: "Firmware Uploaded", ar: "تم رفع البرنامج الثابت", fa: "میان‌افزار بارگذاری شد" },
  alarmGenerated: { en: "Alarm Generated", ar: "تم إنشاء إنذار", fa: "هشدار ایجاد شد" },

  // time
  minAgo: { en: "min ago", ar: "دقيقة مضت", fa: "دقیقه پیش" },
  hourAgo: { en: "hour ago", ar: "ساعة مضت", fa: "ساعت پیش" },
  hoursAgo: { en: "hours ago", ar: "ساعات مضت", fa: "ساعت پیش" },

  // triggered by
  system: { en: "System", ar: "النظام", fa: "سیستم" },
  aiEngine: { en: "AI Engine", ar: "محرك الذكاء الاصطناعي", fa: "موتور هوش مصنوعی" },
  administrator: { en: "Administrator", ar: "المسؤول", fa: "مدیر سیستم" },

  // descriptions
  desc1: { en: "Operator acknowledged the high temperature alarm.", ar: "أكد المشغل إنذار درجة الحرارة المرتفعة.", fa: "اپراتور هشدار دمای بالا را تأیید کرد." },
  desc2: { en: "Inspect bearing and replace if necessary. Estimated risk reduction 45%.", ar: "افحص المحمل واستبدله إذا لزم الأمر. تقليل المخاطر المقدر 45%.", fa: "بلبرینگ را بررسی و در صورت لزوم تعویض کنید. کاهش ریسک تخمینی ۴۵٪." },
  desc3: { en: "New temperature sensor provisioned and bound to gateway GW-02.", ar: "تم تجهيز مستشعر حرارة جديد وربطه بالبوابة GW-02.", fa: "حسگر دمای جدید راه‌اندازی و به گیت‌وی GW-02 متصل شد." },
  desc4: { en: "Gateway came online after maintenance window.", ar: "اتصلت البوابة بعد نافذة الصيانة.", fa: "گیت‌وی پس از پنجره نگهداری آنلاین شد." },
  desc5: { en: "Vibration threshold raised from 7.0 to 7.5 mm/s.", ar: "تم رفع عتبة الاهتزاز من 7.0 إلى 7.5 مم/ث.", fa: "آستانه ارتعاش از ۷٫۰ به ۷٫۵ میلی‌متر بر ثانیه افزایش یافت." },
  desc6: { en: "New sub-location added under utilities.", ar: "تمت إضافة موقع فرعي جديد ضمن المرافق.", fa: "زیرمکان جدید زیر تأسیسات اضافه شد." },
  desc7: { en: "Device stopped reporting telemetry for more than 5 minutes.", ar: "توقف الجهاز عن إرسال البيانات لأكثر من 5 دقائق.", fa: "دستگاه بیش از ۵ دقیقه ارسال داده را متوقف کرده است." },
  desc8: { en: "Firmware version 1.4.2 uploaded successfully.", ar: "تم رفع البرنامج الثابت الإصدار 1.4.2 بنجاح.", fa: "میان‌افزار نسخه ۱٫۴٫۲ با موفقیت بارگذاری شد." },
  desc9: { en: "Critical alarm generated due to abnormal bearing temperature.", ar: "تم إنشاء إنذار حرج بسبب درجة حرارة المحمل غير الطبيعية.", fa: "هشدار بحرانی به‌دلیل دمای غیرعادی بلبرینگ ایجاد شد." },
  desc10: { en: "Check for cavitation and clean strainer.", ar: "تحقق من التجويف ونظف المصفاة.", fa: "وقوع کاویتاسیون را بررسی و صافی را تمیز کنید." },
};

type ActivityKind =
  | "alarm" | "ai_recommendation" | "device_added" | "gateway_connected"
  | "rule_updated" | "location_created" | "device_offline" | "firmware_uploaded";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  timeNum: number;
  timeUnit: "min" | "hour" | "hours";
  timestamp: string;
  activityKey: keyof typeof DICT;
  entity: string;
  location: string;
  triggeredBy: string | { key: keyof typeof DICT };
  triggeredByKind: "user" | "system" | "ai";
  descriptionKey: keyof typeof DICT;
}

const KIND_META: Record<ActivityKind, { icon: any; bg: string; fg: string }> = {
  alarm:               { icon: Bell,       bg: "bg-red-50",     fg: "text-red-500" },
  ai_recommendation:   { icon: Sparkles,   bg: "bg-emerald-50", fg: "text-emerald-500" },
  device_added:        { icon: HardDrive,  bg: "bg-blue-50",    fg: "text-blue-500" },
  gateway_connected:   { icon: Wifi,       bg: "bg-emerald-50", fg: "text-emerald-500" },
  rule_updated:        { icon: LayoutGrid, bg: "bg-orange-50",  fg: "text-orange-500" },
  location_created:    { icon: MapPin,     bg: "bg-violet-50",  fg: "text-violet-500" },
  device_offline:      { icon: WifiOff,    bg: "bg-red-50",     fg: "text-red-500" },
  firmware_uploaded:   { icon: Upload,     bg: "bg-blue-50",    fg: "text-blue-500" },
};

const ACTIVITIES: ActivityItem[] = [
  { id: "a1", kind: "alarm",             timeNum: 2,  timeUnit: "min",   timestamp: "2026-06-13 09:18:02", activityKey: "alarmAck",         entity: "High Temperature Alarm", location: "Factory A > Sulfonation > Line 1",   triggeredBy: "Ali Hosseini",            triggeredByKind: "user",   descriptionKey: "desc1" },
  { id: "a2", kind: "ai_recommendation", timeNum: 15, timeUnit: "min",   timestamp: "2026-06-13 09:05:11", activityKey: "aiRecGenerated",   entity: "Pump P101",              location: "Factory A > Sulfonation > Line 1",   triggeredBy: { key: "aiEngine" },       triggeredByKind: "ai",     descriptionKey: "desc2" },
  { id: "a3", kind: "device_added",      timeNum: 32, timeUnit: "min",   timestamp: "2026-06-13 08:48:22", activityKey: "deviceAdded",      entity: "Temp Sensor A3",         location: "Factory B > Packaging > Line 2",     triggeredBy: "Sara Ahmadi",             triggeredByKind: "user",   descriptionKey: "desc3" },
  { id: "a4", kind: "gateway_connected", timeNum: 1,  timeUnit: "hour",  timestamp: "2026-06-13 08:20:00", activityKey: "gatewayConnected", entity: "Gateway GW-01",          location: "Factory A > Utilities > Building 1", triggeredBy: { key: "system" },         triggeredByKind: "system", descriptionKey: "desc4" },
  { id: "a5", kind: "rule_updated",      timeNum: 2,  timeUnit: "hours", timestamp: "2026-06-13 07:18:42", activityKey: "ruleUpdated",      entity: "High Vibration Rule",    location: "Factory A > Sulfonation > Line 1",   triggeredBy: "Ali Hosseini",            triggeredByKind: "user",   descriptionKey: "desc5" },
  { id: "a6", kind: "location_created",  timeNum: 3,  timeUnit: "hours", timestamp: "2026-06-13 06:22:10", activityKey: "locationCreated",  entity: "Cooling Water Line",     location: "Factory C > Utilities",              triggeredBy: { key: "administrator" },  triggeredByKind: "user",   descriptionKey: "desc6" },
  { id: "a7", kind: "device_offline",    timeNum: 5,  timeUnit: "hours", timestamp: "2026-06-13 04:11:33", activityKey: "deviceOffline",    entity: "Pressure Sensor P-22",   location: "Factory B > Packaging > Line 3",     triggeredBy: { key: "system" },         triggeredByKind: "system", descriptionKey: "desc7" },
  { id: "a8", kind: "firmware_uploaded", timeNum: 6,  timeUnit: "hours", timestamp: "2026-06-11 09:15:22", activityKey: "firmwareUploaded", entity: "Vibration Sensor V-01",  location: "Factory A > Sulfonation > Line 2",   triggeredBy: "Ali Hosseini",            triggeredByKind: "user",   descriptionKey: "desc8" },
  { id: "a9", kind: "alarm",             timeNum: 8,  timeUnit: "hours", timestamp: "2026-06-13 01:08:14", activityKey: "alarmGenerated",   entity: "Compressor C3",          location: "Factory A > Sulfonation > Line 1",   triggeredBy: { key: "system" },         triggeredByKind: "system", descriptionKey: "desc9" },
  { id: "a10", kind: "ai_recommendation", timeNum: 10, timeUnit: "hours", timestamp: "2026-06-12 23:20:00", activityKey: "aiRecGenerated",  entity: "Boiler Pump BP-2",       location: "Factory C > Utilities > Boiler",     triggeredBy: { key: "aiEngine" },       triggeredByKind: "ai",     descriptionKey: "desc10" },
];

const TriggerIcon = ({ kind }: { kind: ActivityItem["triggeredByKind"] }) => {
  const Icon = kind === "ai" ? Bot : kind === "system" ? Settings : Users;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
};

const Activities = () => {
  const { language, isRTL, formatNumber } = useLanguage();
  const navigate = useNavigate();
  const tr = (k: keyof typeof DICT) => DICT[k][language as Lang] ?? DICT[k].en;
  const lp = (p: string) => localizedPath(p, language);
  const fmt = (n: number | string) => formatNumber(n);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState("24h");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>("a8");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 10;

  const getTriggerLabel = (a: ActivityItem) =>
    typeof a.triggeredBy === "string" ? a.triggeredBy : tr(a.triggeredBy.key);

  const getTimeLabel = (a: ActivityItem) =>
    `${fmt(a.timeNum)} ${tr(a.timeUnit === "min" ? "minAgo" : a.timeUnit === "hour" ? "hourAgo" : "hoursAgo")}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ACTIVITIES;
    return ACTIVITIES.filter(a =>
      [tr(a.activityKey), a.entity, a.location, getTriggerLabel(a)].some(v => v.toLowerCase().includes(q))
    );
  }, [search, language]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = { today: 128, userActions: 64, systemEvents: 42, aiEvents: 22 };

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <>
      <div dir={isRTL ? "rtl" : "ltr"}>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <HomeCrumb />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/home"))} className="cursor-pointer">{tr("overview")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tr("activities")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={tr("activities")} count={2384} countLabel={tr("events")} />

      {/* KPI cards */}
      <KpiSection storageKey="activities" className="mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("today"), value: counts.today, icon: FileText, bg: "bg-violet-50", fg: "text-violet-500" },
          { label: tr("userActions"), value: counts.userActions, icon: Users, bg: "bg-emerald-50", fg: "text-emerald-500" },
          { label: tr("systemEvents"), value: counts.systemEvents, icon: Settings, bg: "bg-blue-50", fg: "text-blue-500" },
          { label: tr("aiEvents"), value: counts.aiEvents, icon: Sparkles, bg: "bg-orange-50", fg: "text-orange-500" },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-md flex items-center justify-center ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.fg}`} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-xl font-semibold">{fmt(c.value)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </KpiSection>

      {/* Table card */}
      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={tr("searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`${isRTL ? "pr-9" : "pl-9"} h-9 rounded-full text-xs`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <Calendar className="h-4 w-4 me-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="1h">{tr("last1h")}</SelectItem>
                <SelectItem value="24h">{tr("last24h")}</SelectItem>
                <SelectItem value="7d">{tr("last7d")}</SelectItem>
                <SelectItem value="30d">{tr("last30d")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={refresh} disabled={isRefreshing} aria-label={tr("refresh")}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10" />
              <TableHead className="text-xs">{tr("time")}</TableHead>
              <TableHead className="text-xs">{tr("activity")}</TableHead>
              <TableHead className="text-xs">{tr("entity")}</TableHead>
              <TableHead className="text-xs">{tr("location")}</TableHead>
              <TableHead className="text-xs">{tr("triggeredBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((a) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.icon;
              const isOpen = expanded === a.id;
              return (
                <Fragment key={a.id}>
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >
                    <TableCell className="py-3">
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className={`h-4 w-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">{getTimeLabel(a)}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center ${meta.bg}`}>
                          <Icon className={`h-4 w-4 ${meta.fg}`} />
                        </div>
                        <span className="text-xs font-medium">{tr(a.activityKey)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs">{a.entity}</TableCell>
                    <TableCell className="py-3 text-xs"><LocationCell path={a.location} /></TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <TriggerIcon kind={a.triggeredByKind} />
                        <span className="text-xs">{getTriggerLabel(a)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={`${a.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={6} className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground mb-1">{tr("timestamp")}</div>
                            <div className="font-medium" dir="ltr">{a.timestamp}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">{tr("description")}</div>
                            <div className="font-medium">{tr(a.descriptionKey)}</div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filtered.length > pageSize && (
          <div className="p-4 border-t flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {fmt((page - 1) * pageSize + 1)}–{fmt(Math.min(page * pageSize, filtered.length))} {tr("of")} {fmt(filtered.length)}
            </div>
            <SmartPagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
              onChange={setPage}
            />
          </div>
        )}
      </Card>
      </div>
    </>
  );
};

export default Activities;
