import { useAppLanguage, type AppLanguage } from "./appLanguage";

/* Translations for the shell's own chrome — header, sidebar, and the menus
   hanging off them. Everything below a feature's mount point is translated by
   that feature's own table instead (features/{factory,track}/i18n).

   Entries are keyed by their English source string rather than by an abstract
   id: the shell's strings are written inline in JSX, and a missing key then
   falls through to readable English instead of a raw `nav.overview`. */

const fa: Record<string, string> = {
  // Products, solutions and nav sections
  "Smart Factory": "کارخانه هوشمند",
  "GPS Tracking": "ردیابی GPS",
  "Cloud Management": "مدیریت ابری",
  "Cloud management": "مدیریت ابری",
  Overview: "نمای کلی",
  Dashboards: "داشبوردها",
  Dashboard: "داشبورد",
  Assets: "دارایی‌ها",
  Devices: "دستگاه‌ها",
  Gateways: "گیت‌وی‌ها",
  Location: "موقعیت",
  Alarm: "هشدار",
  Alarms: "هشدارها",
  "AI & Analytics": "هوش مصنوعی و تحلیل",
  "Forecast Failures": "پیش‌بینی خرابی‌ها",
  "Detect Anomalies": "تشخیص ناهنجاری‌ها",
  "Analyze Trends": "تحلیل روندها",
  "AI Co-Pilot": "دستیار هوش مصنوعی",
  Operations: "عملیات",
  "Work Orders": "دستور کارها",
  Members: "اعضا",
  "Dev Center & Help": "مرکز توسعه و راهنما",
  Settings: "تنظیمات",
  "Live Map": "نقشه زنده",
  Geofences: "محدوده‌های جغرافیایی",
  Playback: "بازپخش",
  Alerts: "هشدارها",
  Home: "خانه",
  Products: "محصولات",
  Workspaces: "فضاهای کاری",
  Subscriptions: "اشتراک‌ها",
  "Billing & invoices": "صورتحساب و فاکتورها",
  "Usage & quotas": "مصرف و سهمیه‌ها",
  "Payment methods": "روش‌های پرداخت",
  Organisation: "سازمان",
  "Access & API keys": "دسترسی و کلیدهای API",
  Security: "امنیت",
  Help: "راهنما",
  "Support requests": "درخواست‌های پشتیبانی",

  // Shared
  "Coming Soon": "به‌زودی",
  "Coming soon.": "به‌زودی.",

  // Header
  Search: "جستجو",
  "Toggle sidebar": "باز و بسته کردن منو",
  "Toggle dark mode": "تغییر حالت تیره",
  Language: "زبان",
  Notifications: "اعلان‌ها",
  Account: "حساب کاربری",

  // Header search
  "AI Assets": "دارایی‌های هوشمند",
  "Searches every product you have access to": "در همه محصولاتی که به آن‌ها دسترسی دارید جستجو می‌کند",
  "See all": "مشاهده همه",
  "See all results": "مشاهده همه نتایج",
  "High Temperature Alarm": "هشدار دمای بالا",
  "Active · Critical": "فعال · بحرانی",
  "Pump P101 — failure predicted": "پمپ P101 — خرابی پیش‌بینی شد",
  "RUL 3 days": "عمر باقی‌مانده ۳ روز",
  "Temp Sensor TS-04": "سنسور دما TS-04",
  "Smart Factory · online": "کارخانه هوشمند · آنلاین",

  // Notifications
  "Mark all read": "علامت‌گذاری همه به‌عنوان خوانده‌شده",
  All: "همه",
  Billing: "صورتحساب",
  System: "سیستم",
  "Nothing here yet.": "هنوز چیزی اینجا نیست.",
  "No data": "فاقد دیتا",
  "View all notifications": "مشاهده همه اعلان‌ها",
  "All notifications marked as read.": "همه اعلان‌ها خوانده‌شده علامت‌گذاری شدند.",
  "High Temperature Alarm — Line 2": "هشدار دمای بالا — خط ۲",
  "Pump P101 failure predicted": "خرابی پمپ P101 پیش‌بینی شد",
  "Wallet balance below 5,000,000 IRR": "موجودی کیف پول کمتر از ۵٬۰۰۰٬۰۰۰ ریال",
  "Invoice INV-2026-07 paid": "فاکتور INV-2026-07 پرداخت شد",
  "AI Analytics": "تحلیل هوش مصنوعی",
  "4 minutes ago": "۴ دقیقه پیش",
  "40 minutes ago": "۴۰ دقیقه پیش",
  "2 hours ago": "۲ ساعت پیش",
  "3 Aug 2026": "۳ اوت ۲۰۲۶",

  // Wallet
  "Workspace balance": "موجودی فضای کاری",
  IRR: "ریال",
  "about 11 days of usage": "حدود ۱۱ روز مصرف",
  "Add credit": "افزایش اعتبار",
  "Redeem gift or credit code": "استفاده از کد هدیه یا اعتبار",
  "Usage & costs": "مصرف و هزینه‌ها",
  Transactions: "تراکنش‌ها",
  Invoices: "فاکتورها",
  "Billing & payment settings": "تنظیمات صورتحساب و پرداخت",

  // Home
  "Welcome back": "خوش آمدید",
  "Pick a product to continue, or activate a new one. Everything on this account lives here.":
    "یک محصول را برای ادامه انتخاب کنید یا محصول تازه‌ای را فعال کنید. هر چیزی که به این حساب مربوط است همین‌جاست.",
  "AI Infra": "زیرساخت هوش مصنوعی",
  Platform: "پلتفرم",
  "Assets, alarms, work orders and OTA for production lines.":
    "دارایی‌ها، هشدارها، دستور کارها و به‌روزرسانی از راه دور برای خطوط تولید.",
  "Live fleet positions, geofences and trip history.":
    "موقعیت زندهٔ ناوگان، محدوده‌های جغرافیایی و تاریخچهٔ سفرها.",
  "AI Inference": "استنتاج هوش مصنوعی",
  "Serve open models behind a managed endpoint. Pay per token, autoscaled.":
    "مدل‌های متن‌باز را پشت یک اندپوینت مدیریت‌شده سرو کنید. پرداخت به ازای توکن، با مقیاس‌پذیری خودکار.",
  "OpenAI-compatible API": "API سازگار با OpenAI",
  "AI Agent Maker": "سازندهٔ عامل هوش مصنوعی",
  "Build tool-using agents on your own data and connect them to Paapeli products.":
    "عامل‌های ابزارمحور را روی دادهٔ خودتان بسازید و به محصولات پاپلی وصل کنید.",
  "Visual flow builder": "سازندهٔ جریان بصری",
  "Runs on AI Inference": "اجرا روی استنتاج هوش مصنوعی",
  New: "جدید",
  "Phase 2": "فاز ۲",
  Open: "باز کردن",
  "Join waitlist": "ثبت‌نام در لیست انتظار",
  "Clusters, storage, billing": "کلاسترها، ذخیره‌سازی، صورتحساب",
  "API keys, docs, support": "کلیدهای API، مستندات، پشتیبانی",
  "Invite teammates and manage roles": "دعوت هم‌تیمی‌ها و مدیریت نقش‌ها",
  "Recently visited": "بازدیدهای اخیر",
  "Needs attention": "نیازمند توجه",
  "Usage this month": "مصرف این ماه",
  "Data ingest": "دریافت داده",
  "Inference tokens": "توکن‌های استنتاج",
  "Not active": "فعال نیست",
  devices: "دستگاه",
  locations: "مکان",
  trackers: "ردیاب",
  "open alarms": "هشدار باز",

  // Account menu
  "Loading…": "در حال بارگذاری…",
  "No workspaces yet.": "هنوز فضای کاری ندارید.",
  "Create new workspace": "ایجاد فضای کاری جدید",
  "Manage workspaces": "مدیریت فضاهای کاری",
  "Account Settings": "تنظیمات حساب",
  "Sign out": "خروج",

  // Product switcher
  "Switch Product": "تغییر محصول",
  "Manage Products": "مدیریت محصولات",
  soon: "به‌زودی",

  // Create-new menu
  "New Items": "مورد جدید",
  "Create New": "ایجاد مورد جدید",
  "Create and configure a new industrial entity.": "یک موجودیت صنعتی جدید ایجاد و پیکربندی کنید.",
  Device: "دستگاه",
  "Add industrial devices": "افزودن دستگاه‌های صنعتی",
  Gateway: "گیت‌وی",
  "Register edge gateways": "ثبت گیت‌وی‌های لبه",
  "Create regions and production lines": "ایجاد مناطق و خطوط تولید",
  Rule: "قانون",
  "Create monitoring rules": "ایجاد قوانین پایش",
  "Work Order": "دستور کار",
  "Create maintenance tasks": "ایجاد وظایف نگهداری",
  "Create operational dashboards": "ایجاد داشبوردهای عملیاتی",
  "Advanced Options": "گزینه‌های پیشرفته",
};

const ar: Record<string, string> = {
  // Products, solutions and nav sections
  "Smart Factory": "المصنع الذكي",
  "GPS Tracking": "تتبع GPS",
  "Cloud Management": "الإدارة السحابية",
  "Cloud management": "الإدارة السحابية",
  Overview: "نظرة عامة",
  Dashboards: "لوحات المعلومات",
  Dashboard: "لوحة المعلومات",
  Assets: "الأصول",
  Devices: "الأجهزة",
  Gateways: "البوابات",
  Location: "الموقع",
  Alarm: "الإنذار",
  Alarms: "الإنذارات",
  "AI & Analytics": "الذكاء الاصطناعي والتحليلات",
  "Forecast Failures": "التنبؤ بالأعطال",
  "Detect Anomalies": "كشف الحالات الشاذة",
  "Analyze Trends": "تحليل الاتجاهات",
  "AI Co-Pilot": "مساعد الذكاء الاصطناعي",
  Operations: "العمليات",
  "Work Orders": "أوامر العمل",
  Members: "الأعضاء",
  "Dev Center & Help": "مركز المطورين والمساعدة",
  Settings: "الإعدادات",
  "Live Map": "الخريطة المباشرة",
  Geofences: "السياجات الجغرافية",
  Playback: "إعادة التشغيل",
  Alerts: "التنبيهات",
  Home: "الرئيسية",
  Products: "المنتجات",
  Workspaces: "مساحات العمل",
  Subscriptions: "الاشتراكات",
  "Billing & invoices": "الفوترة والفواتير",
  "Usage & quotas": "الاستخدام والحصص",
  "Payment methods": "طرق الدفع",
  Organisation: "المؤسسة",
  "Access & API keys": "الوصول ومفاتيح API",
  Security: "الأمان",
  Help: "المساعدة",
  "Support requests": "طلبات الدعم",

  // Shared
  "Coming Soon": "قريباً",
  "Coming soon.": "قريباً.",

  // Header
  Search: "بحث",
  "Toggle sidebar": "إظهار/إخفاء القائمة",
  "Toggle dark mode": "تبديل الوضع الداكن",
  Language: "اللغة",
  Notifications: "الإشعارات",
  Account: "الحساب",

  // Header search
  "AI Assets": "الأصول الذكية",
  "Searches every product you have access to": "يبحث في جميع المنتجات التي لديك حق الوصول إليها",
  "See all": "عرض الكل",
  "See all results": "عرض كل النتائج",
  "High Temperature Alarm": "إنذار ارتفاع درجة الحرارة",
  "Active · Critical": "نشط · حرج",
  "Pump P101 — failure predicted": "المضخة P101 — عطل متوقع",
  "RUL 3 days": "العمر المتبقي ٣ أيام",
  "Temp Sensor TS-04": "مستشعر الحرارة TS-04",
  "Smart Factory · online": "المصنع الذكي · متصل",

  // Notifications
  "Mark all read": "تعليم الكل كمقروء",
  All: "الكل",
  Billing: "الفوترة",
  System: "النظام",
  "Nothing here yet.": "لا يوجد شيء هنا بعد.",
  "No data": "لا توجد بيانات",
  "View all notifications": "عرض كل الإشعارات",
  "All notifications marked as read.": "تم تعليم كل الإشعارات كمقروءة.",
  "High Temperature Alarm — Line 2": "إنذار ارتفاع درجة الحرارة — الخط ٢",
  "Pump P101 failure predicted": "عطل متوقع في المضخة P101",
  "Wallet balance below 5,000,000 IRR": "رصيد المحفظة أقل من ٥٬٠٠٠٬٠٠٠ ريال",
  "Invoice INV-2026-07 paid": "تم دفع الفاتورة INV-2026-07",
  "AI Analytics": "تحليلات الذكاء الاصطناعي",
  "4 minutes ago": "منذ ٤ دقائق",
  "40 minutes ago": "منذ ٤٠ دقيقة",
  "2 hours ago": "منذ ساعتين",
  "3 Aug 2026": "٣ أغسطس ٢٠٢٦",

  // Wallet
  "Workspace balance": "رصيد مساحة العمل",
  IRR: "ريال",
  "about 11 days of usage": "حوالي ١١ يومًا من الاستخدام",
  "Add credit": "إضافة رصيد",
  "Redeem gift or credit code": "استخدام رمز هدية أو رصيد",
  "Usage & costs": "الاستخدام والتكاليف",
  Transactions: "المعاملات",
  Invoices: "الفواتير",
  "Billing & payment settings": "إعدادات الفوترة والدفع",

  // Home
  "Welcome back": "مرحباً بعودتك",
  "Pick a product to continue, or activate a new one. Everything on this account lives here.":
    "اختر منتجاً للمتابعة أو فعّل منتجاً جديداً. كل ما يخص هذا الحساب موجود هنا.",
  "AI Infra": "بنية الذكاء الاصطناعي",
  Platform: "المنصة",
  "Assets, alarms, work orders and OTA for production lines.":
    "الأصول والإنذارات وأوامر العمل والتحديث عن بُعد لخطوط الإنتاج.",
  "Live fleet positions, geofences and trip history.":
    "مواقع الأسطول المباشرة والأسيجة الجغرافية وسجل الرحلات.",
  "AI Inference": "استدلال الذكاء الاصطناعي",
  "Serve open models behind a managed endpoint. Pay per token, autoscaled.":
    "شغّل النماذج المفتوحة خلف نقطة نهاية مُدارة. الدفع لكل رمز، مع توسّع تلقائي.",
  "OpenAI-compatible API": "واجهة متوافقة مع OpenAI",
  "AI Agent Maker": "منشئ وكلاء الذكاء الاصطناعي",
  "Build tool-using agents on your own data and connect them to Paapeli products.":
    "ابنِ وكلاء يستخدمون الأدوات على بياناتك واربطهم بمنتجات بابلي.",
  "Visual flow builder": "منشئ تدفق مرئي",
  "Runs on AI Inference": "يعمل على استدلال الذكاء الاصطناعي",
  New: "جديد",
  "Phase 2": "المرحلة ٢",
  Open: "فتح",
  "Join waitlist": "الانضمام إلى قائمة الانتظار",
  "Clusters, storage, billing": "العناقيد والتخزين والفوترة",
  "API keys, docs, support": "مفاتيح API والوثائق والدعم",
  "Invite teammates and manage roles": "دعوة الزملاء وإدارة الأدوار",
  "Recently visited": "تمت زيارتها مؤخراً",
  "Needs attention": "يحتاج إلى انتباه",
  "Usage this month": "الاستخدام هذا الشهر",
  "Data ingest": "استيعاب البيانات",
  "Inference tokens": "رموز الاستدلال",
  "Not active": "غير مفعّل",
  devices: "جهاز",
  locations: "موقع",
  trackers: "متعقب",
  "open alarms": "إنذار مفتوح",

  // Account menu
  "Loading…": "جارٍ التحميل…",
  "No workspaces yet.": "لا توجد مساحات عمل بعد.",
  "Create new workspace": "إنشاء مساحة عمل جديدة",
  "Manage workspaces": "إدارة مساحات العمل",
  "Account Settings": "إعدادات الحساب",
  "Sign out": "تسجيل الخروج",

  // Product switcher
  "Switch Product": "تبديل المنتج",
  "Manage Products": "إدارة المنتجات",
  soon: "قريباً",

  // Create-new menu
  "New Items": "عنصر جديد",
  "Create New": "إنشاء جديد",
  "Create and configure a new industrial entity.": "أنشئ وهيّئ كيانًا صناعيًا جديدًا.",
  Device: "جهاز",
  "Add industrial devices": "إضافة أجهزة صناعية",
  Gateway: "بوابة",
  "Register edge gateways": "تسجيل بوابات الحافة",
  "Create regions and production lines": "إنشاء المناطق وخطوط الإنتاج",
  Rule: "قاعدة",
  "Create monitoring rules": "إنشاء قواعد المراقبة",
  "Work Order": "أمر عمل",
  "Create maintenance tasks": "إنشاء مهام الصيانة",
  "Create operational dashboards": "إنشاء لوحات معلومات تشغيلية",
  "Advanced Options": "خيارات متقدمة",
};

const dictionaries: Record<AppLanguage, Record<string, string>> = { en: {}, fa, ar };

export function translateShell(lang: AppLanguage, text: string): string {
  return dictionaries[lang][text] ?? text;
}

/** `t("Overview")` — the English string is the key, and its own fallback. */
export function useShellT() {
  const language = useAppLanguage();
  return (text: string) => translateShell(language, text);
}
