import { useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

/* AI Inference's own copy, in the three languages the panel runs in.
 *
 * Its own table rather than entries in the factory's: this is a separate
 * product in a separate chunk, and the shared chrome it borrows (the list
 * toolbar's Search/Filters/Sort/Actions) already translates itself through
 * the table that owns it.
 *
 * Keyed by the English string, which is also the fallback — a missing
 * translation reads as English rather than as a raw identifier.
 */

const fa: Record<string, string> = {
  "AI Infra": "زیرساخت هوش مصنوعی",
  "AI Inference": "مدل‌های هوش مصنوعی",

  // Nav
  Overview: "نمای کلی",
  Models: "مدل‌ها",
  Playground: "آزمایشگاه",
  Manage: "مدیریت",
  "API keys": "کلیدهای API",
  "Usage & cost": "مصرف و هزینه",
  Requests: "درخواست‌ها",
  "Limits & budget": "محدودیت‌ها و بودجه",
  "API integration": "اتصال به API",

  // Overview
  "Your inference project at a glance.": "نگاهی کوتاه به پروژهٔ استنتاج شما.",
  "This month": "این ماه",
  "Total tokens": "کل توکن‌ها",
  "Active API keys": "کلیدهای API فعال",
  "Get started in three steps": "شروع در سه گام",
  "Choose your model": "مدل خود را انتخاب کنید",
  "Browse text, code and embedding models.": "میان مدل‌های متن، کد و امبدینگ بگردید.",
  "Explore models": "مشاهدهٔ مدل‌ها",
  "Try a prompt": "یک پرامپت را امتحان کنید",
  "Test inputs and inspect the response format.": "ورودی‌ها را آزمایش کنید و قالب پاسخ را ببینید.",
  "Open playground": "باز کردن آزمایشگاه",
  "Connect your app": "اپلیکیشن خود را وصل کنید",
  "Create a key and copy an API example.": "یک کلید بسازید و نمونهٔ API را کپی کنید.",
  "Get API code": "دریافت کد API",
  "Available to your project": "در دسترس پروژهٔ شما",
  "Budget this month": "بودجهٔ این ماه",
  "Manage budget": "مدیریت بودجه",
  "Try a model": "امتحان یک مدل",
  "One API. All your models.": "یک API برای همهٔ مدل‌ها.",
  "Change the model ID in your request to switch models.":
    "برای عوض کردن مدل، فقط شناسهٔ مدل را در درخواست تغییر دهید.",
  "View integration guide": "مشاهدهٔ راهنمای اتصال",

  // Models
  "Find a model, try it, and connect it to your application.":
    "مدل را پیدا کنید، امتحانش کنید و به اپلیکیشن خود وصلش کنید.",
  "Available models": "مدل‌های در دسترس",
  "Text & code": "متن و کد",
  Embeddings: "امبدینگ‌ها",
  "API status": "وضعیت API",
  Operational: "سالم",
  "Ready to accept requests": "آمادهٔ پذیرش درخواست",
  models: "مدل",
  "Search name, model ID or use case": "جستجوی نام، شناسهٔ مدل یا کاربرد",
  "All models": "همهٔ مدل‌ها",
  Chat: "گفتگو",
  Code: "کد",
  Embedding: "امبدینگ",
  Model: "مدل",
  "Task & capabilities": "وظیفه و قابلیت‌ها",
  Context: "زمینه",
  "Price / 1M tokens": "قیمت هر ۱ میلیون توکن",
  Actions: "اقدامات",
  tokens: "توکن",
  "Input / output": "ورودی / خروجی",
  Try: "امتحان",
  dimensions: "بعد",
  Tools: "ابزار",
  "JSON output": "خروجی JSON",
  "Prices in {currency} · input and output billed separately":
    "قیمت‌ها به تومان · ورودی و خروجی جداگانه محاسبه می‌شوند",
  "of": "از",
  "Compare selected": "مقایسهٔ موارد انتخاب‌شده",
  "Copy model IDs": "کپی شناسهٔ مدل‌ها",
  "Select two models of the same type to compare.":
    "برای مقایسه، دو مدل از یک نوع انتخاب کنید.",
  "Model IDs copied.": "شناسهٔ مدل‌ها کپی شد.",
  Publisher: "ناشر",
  "All publishers": "همهٔ ناشران",
  "All capabilities": "همهٔ قابلیت‌ها",
  Availability: "در دسترس بودن",
  Available: "در دسترس",

  // Model detail
  "All models ": "همهٔ مدل‌ها",
  "Try in playground": "امتحان در آزمایشگاه",
  "Model overview": "معرفی مدل",
  Task: "وظیفه",
  "Text generation / chat": "تولید متن / گفتگو",
  "Serving context": "زمینهٔ سرویس‌دهی",
  "Maximum output": "بیشترین خروجی",
  Streaming: "استریم",
  Supported: "پشتیبانی می‌شود",
  "Not supported": "پشتیبانی نمی‌شود",
  "Structured output": "خروجی ساختاریافته",
  "Tool calling": "فراخوانی ابزار",
  "Source model card": "کارت مدل مبدأ",
  "Usage pricing": "قیمت مصرف",
  "Per 1 million tokens": "به ازای هر یک میلیون توکن",
  "Input tokens": "توکن‌های ورودی",
  "Output tokens": "توکن‌های خروجی",
  "Pay for the tokens you use. No GPU setup is required.":
    "فقط بابت توکنی که مصرف می‌کنید هزینه می‌دهید. نیازی به راه‌اندازی GPU نیست.",
  "Your project limits": "محدودیت‌های پروژهٔ شما",
  "Requests / minute": "درخواست در دقیقه",
  "Tokens / minute": "توکن در دقیقه",
  "Applies to": "اعمال بر",
  "Project + model": "پروژه + مدل",
  "View limits": "مشاهدهٔ محدودیت‌ها",
  Pricing: "قیمت‌گذاری",
  "Model not found": "مدل پیدا نشد",
  "Estimate a request": "برآورد یک درخواست",
  "Estimated cost": "هزینهٔ برآوردی",

  // Playground
  "Test model inputs and inspect the response before integrating.":
    "ورودی مدل را آزمایش کنید و پیش از اتصال، پاسخ را ببینید.",
  "View API code": "مشاهدهٔ کد API",
  Configuration: "پیکربندی",
  "System instructions": "دستور سیستمی",
  Temperature: "دما",
  Precise: "دقیق",
  Creative: "خلاقانه",
  "Max output tokens": "بیشترین توکن خروجی",
  "Stream response": "پاسخ استریمی",
  "Chat preview": "پیش‌نمایش گفتگو",
  "Embedding preview": "پیش‌نمایش امبدینگ",
  "Preview response": "پاسخ نمونه",
  Clear: "پاک کردن",
  You: "شما",
  "Type a message…": "پیام خود را بنویسید…",
  "Run prompt": "اجرای پرامپت",
  "Ctrl + Enter to run · Project limits apply":
    "برای اجرا Ctrl + Enter · محدودیت‌های پروژه اعمال می‌شود",
  Input: "ورودی",
  Output: "خروجی",
  Latency: "تأخیر",
  Cost: "هزینه",
  "Input text": "متن ورودی",
  "Vector output": "خروجی برداری",
  "Enter text to create an embedding…": "متنی برای ساخت امبدینگ وارد کنید…",
  "Generate embedding": "ساخت امبدینگ",
  "Embedding output is a numeric vector": "خروجی امبدینگ یک بردار عددی است",
  "First values shown · illustrative vector, not a computed embedding":
    "چند مقدار اول · بردار نمونه، نه امبدینگ محاسبه‌شده",
  Dimensions: "ابعاد",
  "Max input": "بیشترین ورودی",
  "Encoding format": "قالب کدگذاری",
  "Embedding models return vectors for search, retrieval and similarity.":
    "مدل‌های امبدینگ برای جستجو، بازیابی و شباهت، بردار برمی‌گردانند.",
  "Summarize in Persian": "خلاصه به فارسی",
  "Write code": "نوشتن کد",
  Translate: "ترجمه",
  "Semantic search example": "نمونهٔ جستجوی معنایی",

  // Usage
  "Track consumption and spend across your project.":
    "مصرف و هزینهٔ پروژه را دنبال کنید.",
  "Export CSV": "خروجی CSV",
  "Model cost": "هزینهٔ مدل",
  "Total requests": "کل درخواست‌ها",
  calls: "فراخوانی",
  "Daily cost": "هزینهٔ روزانه",
  "Model usage": "مصرف مدل",
  "Usage by model": "مصرف بر اساس مدل",
  "Input and output are billed separately": "ورودی و خروجی جداگانه محاسبه می‌شوند",
  "All API keys": "همهٔ کلیدهای API",
  "Last 7 days": "۷ روز اخیر",
  "Last 30 days": "۳۰ روز اخیر",
  "Updated just now · UTC": "هم‌اکنون به‌روز شد · UTC",

  // Requests
  "Inspect response codes, latency and token usage.":
    "کدهای پاسخ، تأخیر و مصرف توکن را بررسی کنید.",
  Refresh: "به‌روزرسانی",
  "Requests today": "درخواست‌های امروز",
  "Success rate": "نرخ موفقیت",
  "P50 latency": "تأخیر P50",
  "P95 latency": "تأخیر P95",
  "Search by request ID or model": "جستجو بر اساس شناسهٔ درخواست یا مدل",
  "All statuses": "همهٔ وضعیت‌ها",
  "Last 24 hours": "۲۴ ساعت اخیر",
  "Request ID / time": "شناسهٔ درخواست / زمان",
  Status: "وضعیت",
  "Input / output tokens": "توکن ورودی / خروجی",
  "Request metadata only. Prompt and response content are not stored in this view.":
    "فقط فراداده‌ی درخواست. محتوای پرامپت و پاسخ در این نما ذخیره نمی‌شود.",
  "Latest requests": "آخرین درخواست‌ها",
  OK: "موفق",
  limited: "محدودشده",
  unavailable: "در دسترس نیست",
  error: "خطا",

  // Limits
  "Control project spend and review the capacity available to your applications.":
    "هزینهٔ پروژه را کنترل کنید و ظرفیت در دسترس اپلیکیشن‌ها را ببینید.",
  "Save changes": "ذخیرهٔ تغییرات",
  "Monthly budget": "بودجهٔ ماهانه",
  "Applies to all API keys in this project.":
    "بر همهٔ کلیدهای API این پروژه اعمال می‌شود.",
  "Budget in {currency}": "بودجه به {currency}",
  "{currency} used this month": "{currency} مصرف این ماه",
  "Send a budget alert at": "ارسال هشدار بودجه در",
  "of monthly budget": "از بودجهٔ ماهانه",
  "Pause new requests when the budget is reached":
    "با رسیدن به سقف بودجه، درخواست‌های جدید متوقف شود",
  "In-flight requests may finish after the limit is reached.":
    "درخواست‌های در جریان ممکن است پس از رسیدن به سقف تمام شوند.",
  "Organization credit": "اعتبار سازمان",
  "Shared wallet across Paapeli products.": "کیف پول مشترک میان محصولات پاپلی.",
  Project: "پروژه",
  "Billing unit": "واحد صورتحساب",
  "Alert recipients": "دریافت‌کنندگان هشدار",
  "Project administrators": "مدیران پروژه",
  "Manage shared billing": "مدیریت صورتحساب مشترک",
  "Model rate limits": "محدودیت نرخ مدل‌ها",
  "Shared by all project keys · enforced by the service":
    "مشترک میان همهٔ کلیدهای پروژه · توسط سرویس اعمال می‌شود",
  "Request increase": "درخواست افزایش",
  Scope: "دامنه",
  "Budget and rate limits are enforced by the service, not by this screen.":
    "بودجه و محدودیت نرخ توسط سرویس اعمال می‌شود، نه توسط این صفحه.",

  // API integration
  "Connect your application using an OpenAI-compatible client.":
    "اپلیکیشن خود را با یک کلاینت سازگار با OpenAI وصل کنید.",
  "Create API key": "ساخت کلید API",
  "Quick start": "شروع سریع",
  "Base URL": "آدرس پایه",
  "Proposed API address for this design.": "آدرس پیشنهادی برای این طراحی.",
  "Connect in three steps": "اتصال در سه گام",
  "Create an API key": "یک کلید API بسازید",
  "Choose model access and an expiration date.":
    "دسترسی مدل‌ها و تاریخ انقضا را انتخاب کنید.",
  "Set your environment variable": "متغیر محیطی را تنظیم کنید",
  "Keep PAAPELI_API_KEY in your backend.":
    "PAAPELI_API_KEY را در بک‌اند خود نگه دارید.",
  "Send your first request": "اولین درخواست را بفرستید",
  "Choose a model ID and inspect the response.":
    "یک شناسهٔ مدل انتخاب کنید و پاسخ را ببینید.",
  "Supported endpoints": "اندپوینت‌های پشتیبانی‌شده",
  "Model catalog": "کاتالوگ مدل",
  Copied: "کپی شد",

  // Keys shortcut
  "Manage in Cloud Management": "مدیریت در مدیریت ابری",
  "API keys are managed centrally": "کلیدهای API به‌صورت متمرکز مدیریت می‌شوند",
  "One key can reach several Paapeli products. They all live in Cloud Management.":
    "یک کلید می‌تواند به چند محصول پاپلی دسترسی داشته باشد. همهٔ آن‌ها در مدیریت ابری نگهداری می‌شوند.",
  "Open central API keys": "باز کردن کلیدهای API مرکزی",
  keys: "کلید",

  // Preview honesty
  "Illustrative models, prices and usage data · Not a live service":
    "مدل‌ها، قیمت‌ها و داده‌های مصرف نمونه‌اند · سرویس زنده نیست",
  "PRODUCT DESIGN PREVIEW": "پیش‌نمایش طراحی محصول",
  "All systems operational": "همهٔ سامانه‌ها سالم‌اند",
  "Shared inference · Tehran": "استنتاج مشترک · تهران",
};

const ar: Record<string, string> = {
  "AI Infra": "بنية الذكاء الاصطناعي",
  "AI Inference": "نماذج الذكاء الاصطناعي",

  Overview: "نظرة عامة",
  Models: "النماذج",
  Playground: "بيئة التجربة",
  Manage: "الإدارة",
  "API keys": "مفاتيح API",
  "Usage & cost": "الاستخدام والتكلفة",
  Requests: "الطلبات",
  "Limits & budget": "الحدود والميزانية",
  "API integration": "ربط API",

  "Your inference project at a glance.": "لمحة سريعة عن مشروع الاستدلال.",
  "This month": "هذا الشهر",
  "Total tokens": "إجمالي الرموز",
  "Active API keys": "مفاتيح API النشطة",
  "Get started in three steps": "ابدأ في ثلاث خطوات",
  "Choose your model": "اختر نموذجك",
  "Browse text, code and embedding models.": "تصفّح نماذج النص والبرمجة والتضمين.",
  "Explore models": "استعراض النماذج",
  "Try a prompt": "جرّب موجّهاً",
  "Test inputs and inspect the response format.": "اختبر المدخلات وافحص شكل الاستجابة.",
  "Open playground": "فتح بيئة التجربة",
  "Connect your app": "اربط تطبيقك",
  "Create a key and copy an API example.": "أنشئ مفتاحاً وانسخ مثال API.",
  "Get API code": "الحصول على كود API",
  "Available to your project": "متاح لمشروعك",
  "Budget this month": "ميزانية هذا الشهر",
  "Manage budget": "إدارة الميزانية",
  "Try a model": "جرّب نموذجاً",
  "One API. All your models.": "واجهة واحدة لكل نماذجك.",
  "Change the model ID in your request to switch models.":
    "غيّر معرّف النموذج في طلبك لتبديل النماذج.",
  "View integration guide": "عرض دليل الربط",

  "Find a model, try it, and connect it to your application.":
    "ابحث عن نموذج، جرّبه، واربطه بتطبيقك.",
  "Available models": "النماذج المتاحة",
  "Text & code": "النص والبرمجة",
  Embeddings: "التضمينات",
  "API status": "حالة API",
  Operational: "تعمل",
  "Ready to accept requests": "جاهزة لاستقبال الطلبات",
  models: "نموذج",
  "Search name, model ID or use case": "ابحث بالاسم أو معرّف النموذج أو حالة الاستخدام",
  "All models": "كل النماذج",
  Chat: "محادثة",
  Code: "برمجة",
  Embedding: "تضمين",
  Model: "النموذج",
  "Task & capabilities": "المهمة والقدرات",
  Context: "السياق",
  "Price / 1M tokens": "السعر لكل مليون رمز",
  Actions: "الإجراءات",
  tokens: "رمز",
  "Input / output": "إدخال / إخراج",
  Try: "جرّب",
  dimensions: "بُعد",
  Tools: "أدوات",
  "JSON output": "مخرجات JSON",
  "Prices in {currency} · input and output billed separately":
    "الأسعار بالتومان · الإدخال والإخراج يُحتسبان منفصلين",
  "of": "من",
  "Compare selected": "مقارنة المحدد",
  "Copy model IDs": "نسخ معرّفات النماذج",
  "Select two models of the same type to compare.": "اختر نموذجين من النوع نفسه للمقارنة.",
  "Model IDs copied.": "تم نسخ معرّفات النماذج.",
  Publisher: "الناشر",
  "All publishers": "كل الناشرين",
  "All capabilities": "كل القدرات",
  Availability: "التوفر",
  Available: "متاح",

  "All models ": "كل النماذج",
  "Try in playground": "جرّب في بيئة التجربة",
  "Model overview": "نبذة عن النموذج",
  Task: "المهمة",
  "Text generation / chat": "توليد نص / محادثة",
  "Serving context": "سياق الخدمة",
  "Maximum output": "أقصى مخرجات",
  Streaming: "البث",
  Supported: "مدعوم",
  "Not supported": "غير مدعوم",
  "Structured output": "مخرجات مُهيكلة",
  "Tool calling": "استدعاء الأدوات",
  "Source model card": "بطاقة النموذج الأصلية",
  "Usage pricing": "تسعير الاستخدام",
  "Per 1 million tokens": "لكل مليون رمز",
  "Input tokens": "رموز الإدخال",
  "Output tokens": "رموز الإخراج",
  "Pay for the tokens you use. No GPU setup is required.":
    "ادفع مقابل الرموز التي تستخدمها. لا حاجة لإعداد وحدة معالجة رسومية.",
  "Your project limits": "حدود مشروعك",
  "Requests / minute": "طلب في الدقيقة",
  "Tokens / minute": "رمز في الدقيقة",
  "Applies to": "تنطبق على",
  "Project + model": "المشروع + النموذج",
  "View limits": "عرض الحدود",
  Pricing: "التسعير",
  "Model not found": "لم يتم العثور على النموذج",
  "Estimate a request": "تقدير طلب",
  "Estimated cost": "التكلفة التقديرية",

  "Test model inputs and inspect the response before integrating.":
    "اختبر مدخلات النموذج وافحص الاستجابة قبل الربط.",
  "View API code": "عرض كود API",
  Configuration: "الإعدادات",
  "System instructions": "تعليمات النظام",
  Temperature: "درجة الحرارة",
  Precise: "دقيق",
  Creative: "إبداعي",
  "Max output tokens": "أقصى رموز إخراج",
  "Stream response": "استجابة متدفقة",
  "Chat preview": "معاينة المحادثة",
  "Embedding preview": "معاينة التضمين",
  "Preview response": "استجابة نموذجية",
  Clear: "مسح",
  You: "أنت",
  "Type a message…": "اكتب رسالة…",
  "Run prompt": "تشغيل الموجّه",
  "Ctrl + Enter to run · Project limits apply":
    "Ctrl + Enter للتشغيل · تنطبق حدود المشروع",
  Input: "إدخال",
  Output: "إخراج",
  Latency: "زمن الاستجابة",
  Cost: "التكلفة",
  "Input text": "النص المدخل",
  "Vector output": "المتجه الناتج",
  "Enter text to create an embedding…": "أدخل نصاً لإنشاء تضمين…",
  "Generate embedding": "إنشاء تضمين",
  "Embedding output is a numeric vector": "ناتج التضمين متجه رقمي",
  "First values shown · illustrative vector, not a computed embedding":
    "القيم الأولى · متجه توضيحي وليس تضميناً محسوباً",
  Dimensions: "الأبعاد",
  "Max input": "أقصى إدخال",
  "Encoding format": "صيغة الترميز",
  "Embedding models return vectors for search, retrieval and similarity.":
    "تُعيد نماذج التضمين متجهات للبحث والاسترجاع والتشابه.",
  "Summarize in Persian": "تلخيص بالفارسية",
  "Write code": "كتابة كود",
  Translate: "ترجمة",
  "Semantic search example": "مثال بحث دلالي",

  "Track consumption and spend across your project.": "تابع الاستهلاك والإنفاق في مشروعك.",
  "Export CSV": "تصدير CSV",
  "Model cost": "تكلفة النموذج",
  "Total requests": "إجمالي الطلبات",
  calls: "استدعاء",
  "Daily cost": "التكلفة اليومية",
  "Model usage": "استخدام النموذج",
  "Usage by model": "الاستخدام حسب النموذج",
  "Input and output are billed separately": "الإدخال والإخراج يُحتسبان منفصلين",
  "All API keys": "كل مفاتيح API",
  "Last 7 days": "آخر ٧ أيام",
  "Last 30 days": "آخر ٣٠ يوماً",
  "Updated just now · UTC": "تم التحديث الآن · UTC",

  "Inspect response codes, latency and token usage.":
    "افحص رموز الاستجابة وزمنها واستهلاك الرموز.",
  Refresh: "تحديث",
  "Requests today": "طلبات اليوم",
  "Success rate": "نسبة النجاح",
  "P50 latency": "زمن الاستجابة P50",
  "P95 latency": "زمن الاستجابة P95",
  "Search by request ID or model": "ابحث بمعرّف الطلب أو النموذج",
  "All statuses": "كل الحالات",
  "Last 24 hours": "آخر ٢٤ ساعة",
  "Request ID / time": "معرّف الطلب / الوقت",
  Status: "الحالة",
  "Input / output tokens": "رموز الإدخال / الإخراج",
  "Request metadata only. Prompt and response content are not stored in this view.":
    "بيانات وصفية فقط. لا يُخزَّن محتوى الموجّه والاستجابة في هذا العرض.",
  "Latest requests": "أحدث الطلبات",
  OK: "ناجح",
  limited: "محدود",
  unavailable: "غير متاح",
  error: "خطأ",

  "Control project spend and review the capacity available to your applications.":
    "تحكّم في إنفاق المشروع وراجع الطاقة المتاحة لتطبيقاتك.",
  "Save changes": "حفظ التغييرات",
  "Monthly budget": "الميزانية الشهرية",
  "Applies to all API keys in this project.": "تنطبق على كل مفاتيح API في هذا المشروع.",
  "Budget in {currency}": "الميزانية بـ{currency}",
  "{currency} used this month": "{currency} مستخدمة هذا الشهر",
  "Send a budget alert at": "إرسال تنبيه الميزانية عند",
  "of monthly budget": "من الميزانية الشهرية",
  "Pause new requests when the budget is reached":
    "إيقاف الطلبات الجديدة عند بلوغ الميزانية",
  "In-flight requests may finish after the limit is reached.":
    "قد تكتمل الطلبات الجارية بعد بلوغ الحد.",
  "Organization credit": "رصيد المؤسسة",
  "Shared wallet across Paapeli products.": "محفظة مشتركة بين منتجات بابلي.",
  Project: "المشروع",
  "Billing unit": "وحدة الفوترة",
  "Alert recipients": "مستلمو التنبيه",
  "Project administrators": "مديرو المشروع",
  "Manage shared billing": "إدارة الفوترة المشتركة",
  "Model rate limits": "حدود معدل النماذج",
  "Shared by all project keys · enforced by the service":
    "مشتركة بين كل مفاتيح المشروع · تفرضها الخدمة",
  "Request increase": "طلب زيادة",
  Scope: "النطاق",
  "Budget and rate limits are enforced by the service, not by this screen.":
    "تفرض الخدمة الميزانية وحدود المعدل، لا هذه الشاشة.",

  "Connect your application using an OpenAI-compatible client.":
    "اربط تطبيقك عبر عميل متوافق مع OpenAI.",
  "Create API key": "إنشاء مفتاح API",
  "Quick start": "بداية سريعة",
  "Base URL": "العنوان الأساسي",
  "Proposed API address for this design.": "عنوان API المقترح لهذا التصميم.",
  "Connect in three steps": "اتصل في ثلاث خطوات",
  "Create an API key": "أنشئ مفتاح API",
  "Choose model access and an expiration date.": "اختر صلاحية النماذج وتاريخ الانتهاء.",
  "Set your environment variable": "اضبط متغير البيئة",
  "Keep PAAPELI_API_KEY in your backend.": "احتفظ بـ PAAPELI_API_KEY في الخادم.",
  "Send your first request": "أرسل أول طلب",
  "Choose a model ID and inspect the response.": "اختر معرّف نموذج وافحص الاستجابة.",
  "Supported endpoints": "النقاط المدعومة",
  "Model catalog": "كتالوج النماذج",
  Copied: "تم النسخ",

  "Manage in Cloud Management": "الإدارة في الإدارة السحابية",
  "API keys are managed centrally": "تُدار مفاتيح API مركزياً",
  "One key can reach several Paapeli products. They all live in Cloud Management.":
    "يمكن لمفتاح واحد الوصول إلى عدة منتجات من بابلي، وكلها في الإدارة السحابية.",
  "Open central API keys": "فتح مفاتيح API المركزية",
  keys: "مفتاح",

  "Illustrative models, prices and usage data · Not a live service":
    "النماذج والأسعار وبيانات الاستخدام توضيحية · ليست خدمة حية",
  "PRODUCT DESIGN PREVIEW": "معاينة تصميم المنتج",
  "All systems operational": "كل الأنظمة تعمل",
  "Shared inference · Tehran": "استدلال مشترك · طهران",
};

const dictionaries: Record<AppLanguage, Record<string, string>> = { en: {}, fa, ar };

export function translate(language: AppLanguage, text: string): string {
  return dictionaries[language][text] ?? text;
}

/** `t("Models")` — the English string is the key and its own fallback. */
export function useT() {
  const language = useAppLanguage();
  return (text: string) => translate(language, text);
}
