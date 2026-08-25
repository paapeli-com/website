import type { FeatureConfig } from "@/components/feature/types";

import img3 from "@/src/assets/ota-connectivity-real.jpg";
import img1 from "@/src/assets/ota-firmware-real.jpg";
import hero from "@/src/assets/ota-hero-real.jpg";
import img2 from "@/src/assets/ota-rollout-real.jpg";
import panel from "@/src/assets/panel-ota.jpg";

export const otaUpdatesConfig: FeatureConfig = {
  slug: "ota-updates",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["fleet-tracking", "oil-gas", "smart-agriculture", "energy-monitoring"],
  related: ["device-management", "flexible-deployment", "realtime-monitoring", "alerts-events"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "OTA firmware & software updates",
        description:
          "Push firmware and software to distributed devices without site visits. Staged rollouts, safety guards and a full audit trail keep every fleet current and compliant.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What OTA on Paapeli gives you",
        subheading: "A complete over-the-air workflow, from firmware library to staged rollout and per-device audit.",
        cards: [
          {
            title: "Firmware library",
            description: "Upload builds, mark them stable or beta, and compare two versions before releasing.",
            items: ["Stable and beta channels", "Version diff before release", "Per-profile compatibility"],
          },
          {
            title: "Staged rollout wizard",
            description:
              "Pick a target group, batch size and maintenance window, then watch success, retry and failure counts live.",
            items: ["Batch size and pacing", "Automatic retry on failure", "Pause or roll back a wave"],
          },
          {
            title: "Resilient delivery",
            description:
              "Cellular, satellite, LoRaWAN or Ethernet, transfers resume after intermittent connectivity instead of failing.",
            items: ["Resumable transfers", "Bandwidth-aware pacing", "Signed and verified packages"],
          },
        ],
      },
      panel: {
        heading: "Inside the platform",
        description: "The OTA workspace: firmware versions, active rollouts and per-device update status in one screen.",
      },
      capabilities: {
        heading: "Key capabilities",
        subheading: "Everything needed to keep a distributed fleet current, safe and auditable.",
        cards: [
          {
            icon: "layers",
            title: "Staged rollout",
            description: "Target groups, batch sizes and maintenance windows before a fleet-wide push.",
          },
          {
            icon: "refresh",
            title: "Resume and retry",
            description: "Transfers pick up where they left off after weak or intermittent links.",
          },
          {
            icon: "package",
            title: "Version library",
            description: "Stable and beta channels with diff, compatibility checks and rollback.",
          },
          {
            icon: "shield",
            title: "Signed packages",
            description: "Cryptographic signatures and integrity checks on every update package.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Update the fleet without the field trip",
        description: "See how staged rollouts, rollback and audit history work inside the AIoT platform.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "به‌روزرسانی فرم‌ور و نرم‌افزار از راه دور",
        description:
          "فرم‌ور و نرم‌افزار را بدون مراجعهٔ میدانی روی دستگاه‌های پراکنده منتشر کنید. انتشار مرحله‌ای، محافظ‌های ایمنی و تاریخچهٔ کامل حسابرسی، هر ناوگان را به‌روز و منطبق نگه می‌دارد.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "آنچه OTA در پاپلی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل از راه دور، از کتابخانهٔ فرم‌ور تا انتشار مرحله‌ای و حسابرسی هر دستگاه.",
        cards: [
          {
            title: "کتابخانهٔ فرم‌ور",
            description: "بیلدها را بارگذاری کنید، پایدار یا بتا علامت بزنید و پیش از انتشار دو نسخه را مقایسه کنید.",
            items: ["کانال پایدار و بتا", "مقایسهٔ نسخه پیش از انتشار", "سازگاری بر پایهٔ پروفایل"],
          },
          {
            title: "دستیار انتشار مرحله‌ای",
            description:
              "گروه هدف، اندازهٔ دسته و پنجرهٔ نگهداری را انتخاب کنید و شمار موفق، تلاش مجدد و ناموفق را زنده ببینید.",
            items: ["اندازهٔ دسته و سرعت انتشار", "تلاش مجدد خودکار در خطا", "توقف یا بازگردانی یک موج"],
          },
          {
            title: "تحویل مقاوم",
            description:
              "روی سلولی، ماهواره، LoRaWAN یا اترنت، انتقال پس از قطع‌ونصلی از همان نقطه ادامه می‌یابد و شکست نمی‌خورد.",
            items: ["انتقال قابل ازسرگیری", "تنظیم سرعت بر پایهٔ پهنای باند", "بستهٔ امضاشده و تأییدشده"],
          },
        ],
      },
      panel: {
        heading: "داخل پلتفرم",
        description: "فضای کاری OTA: نسخه‌های فرم‌ور، انتشارهای فعال و وضعیت به‌روزرسانی هر دستگاه در یک صفحه.",
      },
      capabilities: {
        heading: "قابلیت‌های کلیدی",
        subheading: "هر آنچه برای به‌روز، ایمن و قابل حسابرسی نگه‌داشتن یک ناوگان پراکنده لازم است.",
        cards: [
          {
            icon: "layers",
            title: "انتشار مرحله‌ای",
            description: "گروه‌های هدف، اندازهٔ دسته و پنجرهٔ نگهداری، پیش از انتشار سراسری.",
          },
          {
            icon: "refresh",
            title: "ازسرگیری و تلاش مجدد",
            description: "انتقال‌ها پس از لینک ضعیف یا قطع‌ونصلی، از همان نقطه ادامه می‌یابند.",
          },
          {
            icon: "package",
            title: "کتابخانهٔ نسخه‌ها",
            description: "کانال پایدار و بتا همراه با مقایسه، بررسی سازگاری و بازگردانی.",
          },
          {
            icon: "shield",
            title: "بسته‌های امضاشده",
            description: "امضای رمزنگاری و بررسی صحت برای هر بستهٔ به‌روزرسانی.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "ناوگان را بدون سفر میدانی به‌روز کنید",
        description: "ببینید انتشار مرحله‌ای، بازگردانی و تاریخچهٔ حسابرسی درون پلتفرم AIoT چگونه کار می‌کند.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "تحديثات البرامج الثابتة والبرمجيات عن بُعد",
        description:
          "انشر البرامج الثابتة والبرمجيات على الأجهزة الموزعة دون زيارات ميدانية. الإطلاق المرحلي وحمايات السلامة وسجل تدقيق كامل تُبقي كل أسطول محدّثًا ومتوافقًا.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما يمنحه OTA في بابيلي",
        subheading: "سير عمل كامل عبر الهواء، من مكتبة البرامج الثابتة إلى الإطلاق المرحلي وتدقيق كل جهاز.",
        cards: [
          {
            title: "مكتبة البرامج الثابتة",
            description: "ارفع النسخ وحدّدها مستقرة أو تجريبية، وقارن إصدارين قبل الإطلاق.",
            items: ["قناتان مستقرة وتجريبية", "مقارنة الإصدارات قبل الإطلاق", "توافق حسب الملف"],
          },
          {
            title: "معالج الإطلاق المرحلي",
            description:
              "اختر المجموعة المستهدفة وحجم الدفعة ونافذة الصيانة، وتابع أعداد النجاح وإعادة المحاولة والفشل مباشرة.",
            items: ["حجم الدفعة والوتيرة", "إعادة محاولة تلقائية عند الفشل", "إيقاف أو تراجع الموجة"],
          },
          {
            title: "تسليم مقاوم",
            description:
              "خلوي أو أقمار صناعية أو LoRaWAN أو إيثرنت، يستأنف النقل بعد الاتصال المتقطع بدل أن يفشل.",
            items: ["نقل قابل للاستئناف", "وتيرة تراعي عرض النطاق", "حزم موقّعة ومتحقق منها"],
          },
        ],
      },
      panel: {
        heading: "داخل المنصة",
        description: "مساحة عمل OTA: إصدارات البرامج الثابتة والإطلاقات النشطة وحالة تحديث كل جهاز في شاشة واحدة.",
      },
      capabilities: {
        heading: "القدرات الرئيسية",
        subheading: "كل ما يلزم لإبقاء أسطول موزع محدّثًا وآمنًا وقابلًا للتدقيق.",
        cards: [
          {
            icon: "layers",
            title: "إطلاق مرحلي",
            description: "مجموعات مستهدفة وأحجام دفعات ونوافذ صيانة قبل الإطلاق على الأسطول كله.",
          },
          {
            icon: "refresh",
            title: "استئناف وإعادة محاولة",
            description: "تستأنف الملفات من حيث توقفت بعد الروابط الضعيفة أو المتقطعة.",
          },
          {
            icon: "package",
            title: "مكتبة الإصدارات",
            description: "قنوات مستقرة وتجريبية مع المقارنة وفحص التوافق والتراجع.",
          },
          {
            icon: "shield",
            title: "حزم موقّعة",
            description: "توقيعات تشفيرية وفحوص سلامة لكل حزمة تحديث.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "حدّث الأسطول دون رحلة ميدانية",
        description: "اطّلع على كيفية عمل الإطلاق المرحلي والتراجع وسجل التدقيق داخل منصة AIoT.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
