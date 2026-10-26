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
  "Set up a virtual machine in a few steps.": "یک ماشین مجازی را در چند گام بسازید.",

  // Choose type
  "Choose how you want to create your cloud workload.": "روش ساخت سرور ابری را انتخاب کنید.",
  "Single virtual machine": "یک ماشین مجازی",
  "One server with its own configuration.": "یک سرور با تنظیمات دلخواه خودتان.",
  "Auto Scale group": "گروه مقیاس‌پذیری خودکار",
  "A managed group of servers that grows and shrinks with load.":
    "گروهی مدیریت‌شده از سرورها که با تغییر بار بزرگ و کوچک می‌شود.",
  "You can also create Auto Scale groups later from the {link}.":
    "گروه مقیاس‌پذیری خودکار را بعداً هم می‌توانید از {link} بسازید.",
  "Auto Scale section": "بخش مقیاس‌پذیری خودکار",
  Continue: "ادامه",
  Type: "نوع",
  "Not chosen yet": "هنوز انتخاب نشده",
  "The price and details appear as you configure the server.": "قیمت و جزئیات با پیکربندی سرور نمایش داده می‌شوند.",

  // Steps
  Basics: "اطلاعات پایه",
  Image: "ایمیج",
  Plan: "اندازه منابع",
  Disk: "دیسک",
  Network: "شبکه",
  Security: "امنیت",
  "Review & create": "بازبینی و ساخت",

  // Footer
  Cancel: "انصراف",
  Back: "قبلی",
  Next: "بعدی",
  "Create server": "ساخت سرور",
  "Quick create server": "ساخت سریع سرور",

  // Basics
  "Server name": "نام سرور",
  "Lowercase letters, digits and hyphens; 3 to 63 characters.": "حروف کوچک انگلیسی، عدد و خط تیره؛ ۳ تا ۶۳ کاراکتر.",
  "Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.":
    "از ۳ تا ۶۳ حرف کوچک انگلیسی، عدد یا خط تیره استفاده کنید و با حرف شروع کنید.",
  Region: "منطقه",
  "Region and availability zone": "منطقه و ناحیهٔ دسترس‌پذیری",
  "Choose where your server will be located.": "محل قرار گرفتن سرور را انتخاب کنید.",
  Iran: "ایران",
  Tehran: "تهران",
  "Low latency in Iran": "تأخیر کم در ایران",
  Default: "پیش‌فرض",
  "A server stays in the region it is created in; the region cannot be changed later.":
    "سرور در همان منطقه‌ای که ساخته می‌شود می‌ماند و منطقه بعداً قابل تغییر نیست.",
  "Availability zone": "ناحیهٔ دسترس‌پذیری",

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
  TB: "ترابایت",
  "{cpu} vCPU · {ram} GB RAM": "{cpu} هسته · {ram} گیگابایت رم",
  Resources: "منابع",
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
  "Fix the highlighted field to continue.": "برای ادامه، فیلد مشخص‌شده را اصلاح کنید.",

  // Wizard additions
  "Keep these settings for quick create next time": "حفظ تنظیمات فعلی برای ساخت سریع در آینده",
  "Generated automatically and shown once the server is ready.": "به‌صورت خودکار ساخته می‌شود و پس از آماده شدن سرور نمایش داده می‌شود.",
  "More secure": "امن‌تر",
  "Path in the server": "مسیر در سرور",
  "Additional disk {n}": "دیسک اضافه {n}",
  Backup: "بکاپ",
  Daily: "روزانه",
  "Enable backup": "فعال‌سازی بکاپ",
  "Automatic backups of the whole server and its disks, so you can get it back if something goes wrong.":
    "بکاپ خودکار از کل سرور و دیسک‌هایش، تا اگر مشکلی پیش آمد بتوانید آن را برگردانید.",
  "A backup every day, automatically": "هر روز یک بکاپ، به‌صورت خودکار",
  "The last 7 days are kept": "بکاپ ۷ روز اخیر نگه داشته می‌شود",
  "Restore the whole server or one disk": "بازگردانی کل سرور یا فقط یک دیسک",
  "Without backup, data lost on this server cannot be recovered.":
    "بدون بکاپ، داده‌ای که روی این سرور از دست برود قابل بازگردانی نیست.",

  // Created
  "The server is ready. Use the details below to connect to it.": "سرور آماده است. با اطلاعات زیر به آن وصل شوید.",
  "The server is being created. Its addresses and access appear here as soon as they are ready.":
    "سرور در حال ساخت است. آدرس‌ها و اطلاعات دسترسی به‌محض آماده شدن اینجا نمایش داده می‌شوند.",
  "Server details": "جزئیات سرور",
  Server: "سرور",
  "IPv4 address": "آدرس IPv4",
  "IPv6 address": "آدرس IPv6",
  Username: "نام کاربری",
  Copy: "کپی",
  Copied: "کپی شد",
  "Could not copy": "کپی انجام نشد",
  "Keep the password somewhere safe. You can reset it later from the server's page.":
    "رمز عبور را جای امنی نگه دارید. بعداً می‌توانید آن را از صفحهٔ سرور بازنشانی کنید.",
  "Create another server": "ساخت سرور دیگر",
  "Go to servers": "رفتن به سرورها",
  Creating: "در حال ساخت",
  Running: "در حال اجرا",
  "Powered off": "خاموش",
  "Set up more for your server": "امکانات بیشتر برای سرورتان",
  "You can add these while the server is being created, or come back to them later.":
    "این‌ها را می‌توانید همین حالا که سرور در حال ساخت است اضافه کنید یا بعداً سراغشان بیایید.",
  "Cloud Disks": "دیسک ابری",
  "More space for data, databases and backups.": "فضای بیشتر برای داده، پایگاه داده و پشتیبان.",
  Snapshots: "اسنپ‌شات",
  "A point-in-time copy to roll back to or clone from.": "یک نسخه از وضعیت فعلی، برای بازگشت یا ساخت سرور مشابه.",
  "Choose exactly which traffic can reach the server.": "دقیقاً تعیین کنید چه ترافیکی به سرور برسد.",
  "Floating IPs": "آی‌پی شناور",
  "A fixed address you can move between servers.": "آدرسی ثابت که بین سرورها جابه‌جا می‌شود.",
  "Load Balancer": "لود بالانسر",
  "Spread traffic across several servers.": "پخش ترافیک بین چند سرور.",
  "Resource Monitoring": "مانیتورینگ منابع",
  "CPU, memory, disk and network over time.": "مصرف پردازنده، حافظه، دیسک و شبکه در طول زمان.",

  // GPU servers
  "GPU Servers": "سرورهای GPU",
  "Create GPU server": "ساخت سرور GPU",
  "A virtual machine with a dedicated NVIDIA GPU.": "یک ماشین مجازی با GPU اختصاصی انویدیا.",
  "Need a GPU?": "به GPU نیاز دارید؟",
  "GPU servers have their own section, with the GPU models, their availability and the drivers.":
    "سرورهای GPU بخش جداگانه‌ی خودشان را دارند، با مدل‌های GPU، موجودی و درایورها.",
  "Create a GPU server": "ساخت سرور GPU",
  "GPU model": "مدل GPU",
  GPUs: "تعداد GPU",
  "GPU memory": "حافظه‌ی GPU",
  Availability: "موجودی",
  Available: "موجود",
  Limited: "محدود",
  "Sold out": "ناموجود",
  Price: "قیمت",
  "/ hour": "/ ساعتی",
  "about {amount} / month": "حدود {amount} / ماهانه",
  "Install NVIDIA driver and CUDA": "نصب درایور NVIDIA و CUDA",
  "Install NVIDIA driver": "نصب درایور NVIDIA",
  "Ready on first boot, so the GPU works without setting anything up.":
    "از اولین راه‌اندازی آماده است و GPU بدون هیچ تنظیمی کار می‌کند.",
  Driver: "درایور",
  "No GPU servers yet": "هنوز سرور GPU ندارید",
  "Create a virtual machine with a dedicated NVIDIA GPU, on Linux or Windows.":
    "یک ماشین مجازی با GPU اختصاصی انویدیا، روی لینوکس یا ویندوز بسازید.",
  "Once it is running, the GPU appears in Device Manager under Display adapters.":
    "پس از روشن شدن سرور، GPU در Device Manager زیر Display adapters دیده می‌شود.",
  "Once it is running, sign in and run {cmd} to see the GPU.":
    "پس از روشن شدن سرور، وارد شوید و برای دیدن GPU دستور {cmd} را اجرا کنید.",

  // Server list
  servers: "سرور",
  "Total servers": "کل سرورها",
  "No servers yet": "هنوز سروری ندارید",
  "Create a virtual machine from one of the ready Linux or Windows images.":
    "یک ماشین مجازی را از روی یکی از ایمیج‌های آماده‌ی لینوکس یا ویندوز بسازید.",
  "One server you configure yourself": "یک سرور با تنظیمات خودتان",
  "Servers that grow and shrink with load": "سرورهایی که با تغییر بار بزرگ و کوچک می‌شوند",
  "Search by name, IP or image": "جست‌وجو با نام، IP یا ایمیج",
  "Select all": "انتخاب همه",
  Name: "نام",
  "Region / zone": "منطقه / ناحیه",
  "IP address": "آدرس IP",
  Created: "تاریخ ساخت",
  "Newest first": "جدیدترین",
  "No servers match these filters.": "سروری با این فیلترها پیدا نشد.",
  Console: "کنسول",
  "Power on": "روشن کردن",
  "Power off": "خاموش کردن",
  "Powering on": "در حال روشن شدن",
  "Powering off": "در حال خاموش شدن",
  "Create snapshot": "ایجاد اسنپ‌شات",
  "Add tag": "افزودن برچسب",
  "Delete server": "حذف سرور",
  "Server ID": "شناسهٔ سرور",
  "Rename server": "تغییر نام سرور",
  "Delete servers?": "سرورها حذف شوند؟",
  "{n} servers and their disks will be deleted. This cannot be undone.":
    "{n} سرور به همراه دیسک‌هایشان حذف می‌شوند. این کار برگشت‌پذیر نیست.",
  "Servers deleted": "سرورها حذف شدند",
};

const ar: Record<string, string> = {
  // Page
  "Cloud Server": "الخادم السحابي",
  "Create cloud server": "إنشاء خادم سحابي",
  "Set up a virtual machine in a few steps.": "أنشئ جهازًا افتراضيًا في خطوات قليلة.",

  // Choose type
  "Choose how you want to create your cloud workload.": "اختر طريقة إنشاء الخادم السحابي.",
  "Single virtual machine": "جهاز افتراضي واحد",
  "One server with its own configuration.": "خادم واحد بإعداداته الخاصة.",
  "Auto Scale group": "مجموعة التوسع التلقائي",
  "A managed group of servers that grows and shrinks with load.":
    "مجموعة مُدارة من الخوادم تكبر وتصغر مع الحمل.",
  "You can also create Auto Scale groups later from the {link}.":
    "يمكنك أيضًا إنشاء مجموعات التوسع التلقائي لاحقًا من {link}.",
  "Auto Scale section": "قسم التوسع التلقائي",
  Continue: "متابعة",
  Type: "النوع",
  "Not chosen yet": "لم يُحدَّد بعد",
  "The price and details appear as you configure the server.": "يظهر السعر والتفاصيل أثناء إعداد الخادم.",

  // Steps
  Basics: "الأساسيات",
  Image: "الصورة",
  Plan: "الخطة",
  Disk: "القرص",
  Network: "الشبكة",
  Security: "الأمان",
  "Review & create": "المراجعة والإنشاء",

  // Footer
  Cancel: "إلغاء",
  Back: "السابق",
  Next: "التالي",
  "Create server": "إنشاء الخادم",
  "Quick create server": "إنشاء سريع للخادم",

  // Basics
  "Server name": "اسم الخادم",
  "Lowercase letters, digits and hyphens; 3 to 63 characters.": "أحرف إنجليزية صغيرة وأرقام وشرطات؛ من ٣ إلى ٦٣ حرفًا.",
  "Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.":
    "استخدم من ٣ إلى ٦٣ حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة، على أن يبدأ بحرف.",
  Region: "المنطقة",
  "Region and availability zone": "المنطقة ومنطقة التوفر",
  "Choose where your server will be located.": "اختر مكان خادمك.",
  Iran: "إيران",
  Tehran: "طهران",
  "Low latency in Iran": "زمن استجابة منخفض في إيران",
  Default: "افتراضي",
  "A server stays in the region it is created in; the region cannot be changed later.":
    "يبقى الخادم في المنطقة التي أُنشئ فيها، ولا يمكن تغيير المنطقة لاحقًا.",
  "Availability zone": "منطقة التوفر",

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
  TB: "تيرابايت",
  "{cpu} vCPU · {ram} GB RAM": "{cpu} نواة · {ram} غيغابايت ذاكرة",
  Resources: "الموارد",
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
  "Fix the highlighted field to continue.": "صحّح الحقل المحدد للمتابعة.",

  // Wizard additions
  "Keep these settings for quick create next time": "الاحتفاظ بالإعدادات الحالية للإنشاء السريع لاحقًا",
  "Generated automatically and shown once the server is ready.": "تُولَّد تلقائيًا وتظهر عند جاهزية الخادم.",
  "More secure": "أكثر أمانًا",
  "Path in the server": "المسار داخل الخادم",
  "Additional disk {n}": "قرص إضافي {n}",
  Backup: "النسخ الاحتياطي",
  Daily: "يومي",
  "Enable backup": "تفعيل النسخ الاحتياطي",
  "Automatic backups of the whole server and its disks, so you can get it back if something goes wrong.":
    "نسخ احتياطي تلقائي للخادم بأكمله وأقراصه، لاستعادته إذا حدث خطأ.",
  "A backup every day, automatically": "نسخة احتياطية كل يوم تلقائيًا",
  "The last 7 days are kept": "يُحتفظ بآخر ٧ أيام",
  "Restore the whole server or one disk": "استعادة الخادم كاملًا أو قرص واحد",
  "Without backup, data lost on this server cannot be recovered.":
    "بدون نسخ احتياطي، لا يمكن استعادة البيانات المفقودة على هذا الخادم.",

  // Created
  "The server is ready. Use the details below to connect to it.": "الخادم جاهز. استخدم المعلومات أدناه للاتصال به.",
  "The server is being created. Its addresses and access appear here as soon as they are ready.":
    "جارٍ إنشاء الخادم. ستظهر العناوين وبيانات الوصول هنا فور جاهزيتها.",
  "Server details": "تفاصيل الخادم",
  Server: "الخادم",
  "IPv4 address": "عنوان IPv4",
  "IPv6 address": "عنوان IPv6",
  Username: "اسم المستخدم",
  Copy: "نسخ",
  Copied: "تم النسخ",
  "Could not copy": "تعذّر النسخ",
  "Keep the password somewhere safe. You can reset it later from the server's page.":
    "احفظ كلمة المرور في مكان آمن. يمكنك إعادة تعيينها لاحقًا من صفحة الخادم.",
  "Create another server": "إنشاء خادم آخر",
  "Go to servers": "الانتقال إلى الخوادم",
  Creating: "قيد الإنشاء",
  Running: "قيد التشغيل",
  "Powered off": "متوقف",
  "Set up more for your server": "المزيد لخادمك",
  "You can add these while the server is being created, or come back to them later.":
    "يمكنك إضافة هذه الآن أثناء إنشاء الخادم، أو العودة إليها لاحقًا.",
  "Cloud Disks": "الأقراص السحابية",
  "More space for data, databases and backups.": "مساحة إضافية للبيانات وقواعد البيانات والنسخ الاحتياطية.",
  Snapshots: "اللقطات",
  "A point-in-time copy to roll back to or clone from.": "نسخة من لحظة معينة للرجوع إليها أو الإنشاء منها.",
  "Choose exactly which traffic can reach the server.": "حدّد بدقة حركة البيانات التي تصل إلى الخادم.",
  "Floating IPs": "عناوين IP العائمة",
  "A fixed address you can move between servers.": "عنوان ثابت يمكنك نقله بين الخوادم.",
  "Load Balancer": "موازن الأحمال",
  "Spread traffic across several servers.": "توزيع حركة البيانات على عدة خوادم.",
  "Resource Monitoring": "مراقبة الموارد",
  "CPU, memory, disk and network over time.": "استهلاك المعالج والذاكرة والقرص والشبكة عبر الوقت.",

  // GPU servers
  "GPU Servers": "خوادم GPU",
  "Create GPU server": "إنشاء خادم GPU",
  "A virtual machine with a dedicated NVIDIA GPU.": "جهاز افتراضي مع GPU مخصص من NVIDIA.",
  "Need a GPU?": "هل تحتاج إلى GPU؟",
  "GPU servers have their own section, with the GPU models, their availability and the drivers.":
    "لخوادم GPU قسم خاص بها، مع طرازات GPU وتوفرها وبرامج التشغيل.",
  "Create a GPU server": "إنشاء خادم GPU",
  "GPU model": "طراز GPU",
  GPUs: "عدد GPU",
  "GPU memory": "ذاكرة GPU",
  Availability: "التوفر",
  Available: "متوفر",
  Limited: "محدود",
  "Sold out": "غير متوفر",
  Price: "السعر",
  "/ hour": "/ ساعة",
  "about {amount} / month": "حوالي {amount} / شهريًا",
  "Install NVIDIA driver and CUDA": "تثبيت برنامج تشغيل NVIDIA وCUDA",
  "Install NVIDIA driver": "تثبيت برنامج تشغيل NVIDIA",
  "Ready on first boot, so the GPU works without setting anything up.":
    "جاهز عند أول تشغيل، فيعمل GPU دون أي إعداد.",
  Driver: "برنامج التشغيل",
  "No GPU servers yet": "لا توجد خوادم GPU بعد",
  "Create a virtual machine with a dedicated NVIDIA GPU, on Linux or Windows.":
    "أنشئ جهازًا افتراضيًا مع GPU مخصص من NVIDIA، على لينكس أو ويندوز.",
  "Once it is running, the GPU appears in Device Manager under Display adapters.":
    "بعد تشغيل الخادم، يظهر GPU في Device Manager ضمن Display adapters.",
  "Once it is running, sign in and run {cmd} to see the GPU.":
    "بعد تشغيل الخادم، سجّل الدخول وشغّل {cmd} لرؤية GPU.",

  // Server list
  servers: "خوادم",
  "Total servers": "إجمالي الخوادم",
  "No servers yet": "لا توجد خوادم بعد",
  "Create a virtual machine from one of the ready Linux or Windows images.":
    "أنشئ جهازًا افتراضيًا من إحدى صور لينكس أو ويندوز الجاهزة.",
  "One server you configure yourself": "خادم واحد بإعداداتك",
  "Servers that grow and shrink with load": "خوادم تكبر وتصغر مع الحمل",
  "Search by name, IP or image": "ابحث بالاسم أو IP أو الصورة",
  "Select all": "تحديد الكل",
  Name: "الاسم",
  "Region / zone": "المنطقة / منطقة التوفر",
  "IP address": "عنوان IP",
  Created: "تاريخ الإنشاء",
  "Newest first": "الأحدث أولًا",
  "No servers match these filters.": "لا توجد خوادم تطابق هذه المرشحات.",
  Console: "وحدة التحكم",
  "Power on": "تشغيل",
  "Power off": "إيقاف",
  "Powering on": "جارٍ التشغيل",
  "Powering off": "جارٍ الإيقاف",
  "Create snapshot": "إنشاء لقطة",
  "Add tag": "إضافة وسم",
  "Delete server": "حذف الخادم",
  "Server ID": "معرّف الخادم",
  "Rename server": "إعادة تسمية الخادم",
  "Delete servers?": "حذف الخوادم؟",
  "{n} servers and their disks will be deleted. This cannot be undone.":
    "سيتم حذف {n} من الخوادم مع أقراصها. لا يمكن التراجع عن ذلك.",
  "Servers deleted": "تم حذف الخوادم",
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
