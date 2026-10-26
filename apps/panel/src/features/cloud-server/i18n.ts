import { useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

/* Cloud Server's own copy, in the panel's three languages.
 *
 * Its own table, like AI Inference's: a separate product in its own chunk.
 * The sidebar labels are the shell's and stay in src/shared/i18n/shell.ts.
 * Keyed by the English string, which is also the fallback.
 */

const fa: Record<string, string> = {
  // Page
  "Cloud Server": "سرور ابری",
  "Create cloud server": "ساخت سرور ابری",
  "Set up a virtual machine in a few steps. Every step starts from a working default.":
    "یک ماشین مجازی را در چند گام بسازید. هر گام با یک پیش‌فرض آماده شروع می‌شود.",
  "Sample data · Not a live service": "داده‌های نمونه · سرویس هنوز فعال نیست",

  // Steps
  Basics: "اطلاعات پایه",
  Image: "ایمیج",
  Plan: "پلن",
  Disk: "دیسک",
  Network: "شبکه",
  Security: "امنیت",
  Review: "بازبینی",

  // Footer
  Cancel: "انصراف",
  Back: "قبلی",
  Next: "بعدی",
  "Create server": "ساخت سرور",

  // Basics
  "Server name": "نام سرور",
  "Lowercase letters, digits and hyphens; 3 to 63 characters.": "حروف کوچک انگلیسی، عدد و خط تیره؛ ۳ تا ۶۳ کاراکتر.",
  "Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.":
    "از ۳ تا ۶۳ حرف کوچک انگلیسی، عدد یا خط تیره استفاده کنید و با حرف شروع کنید.",
  Region: "منطقه",
  "Availability zone": "ناحیهٔ دسترس‌پذیری",
  "One region and one availability zone are available for now. More are on the way.":
    "فعلاً یک منطقه و یک ناحیهٔ دسترس‌پذیری در دسترس است. موارد بیشتر به‌زودی اضافه می‌شود.",
  "Every step already has a default that works. You can go straight to Review and create the server.":
    "همهٔ گام‌ها از قبل یک پیش‌فرض آماده دارند. می‌توانید مستقیم به بازبینی بروید و سرور را بسازید.",

  // Image
  "Operating system": "سیستم‌عامل",
  Version: "نسخه",
  Recommended: "پیشنهادی",
  "Custom images you upload under Images & Operating Systems will appear here.":
    "ایمیج‌های اختصاصی که در بخش ایمیج‌ها و سیستم‌عامل‌ها بارگذاری کنید، اینجا نمایش داده می‌شوند.",

  // Plan
  "Shared vCPU": "پردازندهٔ اشتراکی",
  "Dedicated vCPU": "پردازندهٔ اختصاصی",
  GPU: "GPU",
  "Good for websites, development and most workloads.": "مناسب وب‌سایت، توسعه و بیشتر کاربردها.",
  "Cores reserved for you, for steady high load.": "هسته‌های رزروشده برای شما، برای بار سنگین و پیوسته.",
  "For training, inference and rendering.": "برای آموزش مدل، استنتاج و رندر.",
  vCPU: "vCPU",
  RAM: "رم",
  "Boot disk": "دیسک سیستم",
  Traffic: "ترافیک",
  "Monthly price": "قیمت ماهانه",
  "Choose plan": "انتخاب پلن",

  // Disk
  "Boot disk size": "اندازهٔ دیسک سیستم",
  "The plan includes {n} GB. Extra space is billed per GB.": "پلن شامل {n} گیگابایت است. فضای بیشتر به ازای هر گیگابایت محاسبه می‌شود.",
  "Additional disks": "دیسک‌های اضافه",
  "Extra SSD volumes for data, databases or backups.": "حجم‌های SSD اضافه برای داده، پایگاه داده یا پشتیبان.",
  "No additional disks": "دیسک اضافه‌ای ندارید",
  "Add disk": "افزودن دیسک",
  "Remove disk": "حذف دیسک",
  "Disk {n}": "دیسک {n}",
  Size: "اندازه",
  GB: "گیگابایت",
  "All disks are SSD.": "همهٔ دیسک‌ها SSD هستند.",

  // Network
  "Public IPv4": "IPv4 عمومی",
  "A fixed public IPv4 address is assigned to every server.": "به هر سرور یک آدرس IPv4 عمومی ثابت اختصاص داده می‌شود.",
  Included: "شامل",
  IPv6: "IPv6",
  "Assign a public IPv6 address as well.": "یک آدرس IPv6 عمومی هم اختصاص داده شود.",
  "Floating IP": "آی‌پی شناور",
  "A static address you can move between servers.": "آدرسی ثابت که می‌توانید بین سرورها جابه‌جا کنید.",
  "No floating IP yet. Create one under Floating IPs, then attach it here or later.":
    "هنوز آی‌پی شناوری ندارید. از بخش آی‌پی شناور یکی بسازید و اینجا یا بعداً متصلش کنید.",
  "Go to Floating IPs": "رفتن به آی‌پی شناور",
  None: "هیچ‌کدام",

  // Security
  "Access method": "روش دسترسی",
  "SSH key": "کلید SSH",
  "More secure, no password to leak.": "امن‌تر، بدون رمزی که لو برود.",
  Password: "رمز عبور",
  "Less secure than an SSH key.": "امنیت کمتری از کلید SSH دارد.",
  "Not recommended": "پیشنهاد نمی‌شود",
  "Add SSH key": "افزودن کلید SSH",
  "Root password": "رمز عبور root",
  "At least 12 characters, with letters and digits.": "دست‌کم ۱۲ کاراکتر، شامل حرف و عدد.",
  Generate: "ساخت خودکار",
  "Show password": "نمایش رمز",
  "Hide password": "پنهان کردن رمز",
  Firewall: "فایروال",
  "Controls which traffic can reach the server.": "تعیین می‌کند چه ترافیکی به سرور برسد.",
  "Manage firewalls": "مدیریت فایروال‌ها",
  "Choose an SSH key.": "یک کلید SSH انتخاب کنید.",
  "Use at least 12 characters, with letters and digits.": "دست‌کم ۱۲ کاراکتر شامل حرف و عدد وارد کنید.",

  // Add key dialog
  "Paste a public key, for example the contents of ~/.ssh/id_ed25519.pub.":
    "کلید عمومی را وارد کنید، برای مثال محتوای ‎~/.ssh/id_ed25519.pub.",
  "Key name": "نام کلید",
  "Public key": "کلید عمومی",
  "This does not look like a public key.": "این مقدار شبیه کلید عمومی نیست.",
  Add: "افزودن",

  // Review
  "Power on after creation": "روشن شدن پس از ساخت",
  "Start the server as soon as it is ready.": "سرور به‌محض آماده شدن روشن شود.",
  "Startup script": "اسکریپت راه‌اندازی",
  "Runs once on first boot (cloud-init).": "یک بار در اولین راه‌اندازی اجرا می‌شود (cloud-init).",
  Edit: "ویرایش",
  Optional: "اختیاری",
  Enabled: "فعال",
  Off: "غیرفعال",

  // Summary
  "Estimated price": "قیمت تخمینی",
  "/ month": "/ ماهانه",
  "about {amount} / hour": "حدود {amount} / ساعتی",
  Summary: "خلاصه",
  "Additional disk": "دیسک اضافه",
  Access: "دسترسی",
  "Name, region and zone": "نام، منطقه و ناحیه",

  // Result
  "{name} is being created.": "{name} در حال ساخت است.",
  "Sample only: no server was created.": "فقط نمونه است و سروری ساخته نشد.",
  "Fix the highlighted field to continue.": "برای ادامه، فیلد مشخص‌شده را اصلاح کنید.",
};

const ar: Record<string, string> = {
  // Page
  "Cloud Server": "الخادم السحابي",
  "Create cloud server": "إنشاء خادم سحابي",
  "Set up a virtual machine in a few steps. Every step starts from a working default.":
    "أنشئ جهازًا افتراضيًا في خطوات قليلة. تبدأ كل خطوة بإعداد افتراضي جاهز.",
  "Sample data · Not a live service": "بيانات تجريبية · الخدمة غير مفعّلة بعد",

  // Steps
  Basics: "الأساسيات",
  Image: "الصورة",
  Plan: "الخطة",
  Disk: "القرص",
  Network: "الشبكة",
  Security: "الأمان",
  Review: "المراجعة",

  // Footer
  Cancel: "إلغاء",
  Back: "السابق",
  Next: "التالي",
  "Create server": "إنشاء الخادم",

  // Basics
  "Server name": "اسم الخادم",
  "Lowercase letters, digits and hyphens; 3 to 63 characters.": "أحرف إنجليزية صغيرة وأرقام وشرطات؛ من ٣ إلى ٦٣ حرفًا.",
  "Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.":
    "استخدم من ٣ إلى ٦٣ حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة، على أن يبدأ بحرف.",
  Region: "المنطقة",
  "Availability zone": "منطقة التوفر",
  "One region and one availability zone are available for now. More are on the way.":
    "تتوفر حاليًا منطقة واحدة ومنطقة توفر واحدة. المزيد قريبًا.",
  "Every step already has a default that works. You can go straight to Review and create the server.":
    "لكل خطوة إعداد افتراضي جاهز. يمكنك الانتقال مباشرة إلى المراجعة وإنشاء الخادم.",

  // Image
  "Operating system": "نظام التشغيل",
  Version: "الإصدار",
  Recommended: "مُوصى به",
  "Custom images you upload under Images & Operating Systems will appear here.":
    "ستظهر هنا الصور المخصصة التي ترفعها في قسم الصور وأنظمة التشغيل.",

  // Plan
  "Shared vCPU": "معالج مشترك",
  "Dedicated vCPU": "معالج مخصص",
  GPU: "GPU",
  "Good for websites, development and most workloads.": "مناسب للمواقع والتطوير ومعظم الأحمال.",
  "Cores reserved for you, for steady high load.": "أنوية محجوزة لك، للأحمال العالية المستمرة.",
  "For training, inference and rendering.": "للتدريب والاستدلال والمعالجة الرسومية.",
  vCPU: "vCPU",
  RAM: "الذاكرة",
  "Boot disk": "قرص النظام",
  Traffic: "حركة البيانات",
  "Monthly price": "السعر الشهري",
  "Choose plan": "اختيار الخطة",

  // Disk
  "Boot disk size": "حجم قرص النظام",
  "The plan includes {n} GB. Extra space is billed per GB.": "تتضمن الخطة {n} غيغابايت. تُحتسب المساحة الإضافية لكل غيغابايت.",
  "Additional disks": "أقراص إضافية",
  "Extra SSD volumes for data, databases or backups.": "وحدات SSD إضافية للبيانات أو قواعد البيانات أو النسخ الاحتياطية.",
  "No additional disks": "لا توجد أقراص إضافية",
  "Add disk": "إضافة قرص",
  "Remove disk": "إزالة القرص",
  "Disk {n}": "القرص {n}",
  Size: "الحجم",
  GB: "غيغابايت",
  "All disks are SSD.": "جميع الأقراص من نوع SSD.",

  // Network
  "Public IPv4": "IPv4 عام",
  "A fixed public IPv4 address is assigned to every server.": "يُخصَّص لكل خادم عنوان IPv4 عام ثابت.",
  Included: "مشمول",
  IPv6: "IPv6",
  "Assign a public IPv6 address as well.": "خصّص عنوان IPv6 عامًا أيضًا.",
  "Floating IP": "عنوان IP عائم",
  "A static address you can move between servers.": "عنوان ثابت يمكنك نقله بين الخوادم.",
  "No floating IP yet. Create one under Floating IPs, then attach it here or later.":
    "لا يوجد عنوان IP عائم بعد. أنشئ واحدًا من قسم عناوين IP العائمة ثم اربطه هنا أو لاحقًا.",
  "Go to Floating IPs": "الانتقال إلى عناوين IP العائمة",
  None: "لا شيء",

  // Security
  "Access method": "طريقة الوصول",
  "SSH key": "مفتاح SSH",
  "More secure, no password to leak.": "أكثر أمانًا، بلا كلمة مرور قد تتسرب.",
  Password: "كلمة المرور",
  "Less secure than an SSH key.": "أقل أمانًا من مفتاح SSH.",
  "Not recommended": "غير مُوصى به",
  "Add SSH key": "إضافة مفتاح SSH",
  "Root password": "كلمة مرور root",
  "At least 12 characters, with letters and digits.": "١٢ حرفًا على الأقل، تتضمن أحرفًا وأرقامًا.",
  Generate: "توليد",
  "Show password": "إظهار كلمة المرور",
  "Hide password": "إخفاء كلمة المرور",
  Firewall: "جدار الحماية",
  "Controls which traffic can reach the server.": "يحدد حركة البيانات التي تصل إلى الخادم.",
  "Manage firewalls": "إدارة جدران الحماية",
  "Choose an SSH key.": "اختر مفتاح SSH.",
  "Use at least 12 characters, with letters and digits.": "استخدم ١٢ حرفًا على الأقل تتضمن أحرفًا وأرقامًا.",

  // Add key dialog
  "Paste a public key, for example the contents of ~/.ssh/id_ed25519.pub.":
    "الصق مفتاحًا عامًا، مثل محتوى ‎~/.ssh/id_ed25519.pub.",
  "Key name": "اسم المفتاح",
  "Public key": "المفتاح العام",
  "This does not look like a public key.": "لا يبدو هذا مفتاحًا عامًا.",
  Add: "إضافة",

  // Review
  "Power on after creation": "التشغيل بعد الإنشاء",
  "Start the server as soon as it is ready.": "تشغيل الخادم فور جاهزيته.",
  "Startup script": "سكربت بدء التشغيل",
  "Runs once on first boot (cloud-init).": "يُنفَّذ مرة واحدة عند أول تشغيل (cloud-init).",
  Edit: "تعديل",
  Optional: "اختياري",
  Enabled: "مفعّل",
  Off: "معطّل",

  // Summary
  "Estimated price": "السعر التقديري",
  "/ month": "/ شهريًا",
  "about {amount} / hour": "حوالي {amount} / ساعة",
  Summary: "الملخص",
  "Additional disk": "قرص إضافي",
  Access: "الوصول",
  "Name, region and zone": "الاسم والمنطقة ومنطقة التوفر",

  // Result
  "{name} is being created.": "جارٍ إنشاء {name}.",
  "Sample only: no server was created.": "عرض تجريبي فقط: لم يُنشأ أي خادم.",
  "Fix the highlighted field to continue.": "صحّح الحقل المحدد للمتابعة.",
};

const dictionaries: Record<AppLanguage, Record<string, string>> = { en: {}, fa, ar };

/** `{name}`-style placeholders are filled from `vars`. */
export function translate(language: AppLanguage, text: string, vars?: Record<string, string | number>): string {
  let out = dictionaries[language]?.[text] ?? text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function useT() {
  const language = useAppLanguage();
  return (text: string, vars?: Record<string, string | number>) => translate(language, text, vars);
}
