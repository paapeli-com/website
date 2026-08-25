import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-alerts-1.jpg";
import img2 from "@/src/assets/f-alerts-2.jpg";
import img3 from "@/src/assets/f-alerts-3.jpg";
import hero from "@/src/assets/f-alerts-hero.jpg";
import panel from "@/src/assets/panel-alarms.jpg";

export const alertsEventsConfig: FeatureConfig = {
  slug: "alerts-events",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["oil-gas", "smart-manufacturing", "smart-buildings", "energy-monitoring"],
  related: ["flexible-deployment", "device-management", "realtime-monitoring", "ota-updates"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Alerts & event management",
        description:
          "Detect critical events instantly and get alerted before they turn critical, with rules, severities, escalation policies and the channels your team already uses.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "An alarm list built for shifts",
            description:
              "Filter by status and severity, acknowledge, assign, and see how long each alarm has been open.",
            items: ["Status filters, not buried tabs", "Acknowledge and assign in place", "SLA timers per alarm"],
          },
          {
            title: "Rules that follow the asset",
            description:
              "Write a rule once per device profile or location and it applies to every matching device added later.",
            items: ["Threshold and no-data rules", "Rule templates per industry", "Location-scoped severities"],
          },
          {
            title: "From alert to closed work order",
            description:
              "Critical alarms feed the operations board, so the same event that fired is the one tracked to completion.",
            items: ["Create a work order from any alarm", "Board and list views for tasks", "Audit trail per event"],
          },
        ],
      },
      panel: {
        heading: "Inside the platform",
        description: "A real screen from the Paapeli panel, not concept art.",
      },
      capabilities: {
        heading: "Key capabilities",
        subheading: "What changes in daily operations once this feature is in place.",
        cards: [
          {
            icon: "bell",
            title: "Nothing waits for a round",
            description:
              "Threshold, rate-of-change and no-data conditions fire the moment they occur, not at the next inspection.",
          },
          {
            icon: "branch",
            title: "Escalation instead of silence",
            description: "If an alert is not acknowledged within its SLA, it moves up the policy to the next person or team.",
          },
          {
            icon: "send",
            title: "One event, many channels",
            description: "The same event reaches email, SMS or messaging channels, and can open a work order in one step.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Stop finding out too late",
        description:
          "Bring your current alarm list and escalation practice and we will model it as rules and policies in the platform.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "هشدارها و مدیریت رویداد",
        description:
          "رویدادهای حیاتی را بی‌درنگ تشخیص دهید و پیش از بحرانی شدن هشدار بگیرید، با قواعد، سطوح اهمیت، سیاست‌های تشدید و همان کانال‌هایی که تیم شما امروز استفاده می‌کند.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "فهرست هشدار ساخته‌شده برای شیفت",
            description:
              "بر پایهٔ وضعیت و اهمیت فیلتر کنید، تأیید و واگذار کنید و ببینید هر هشدار چه مدت باز مانده است.",
            items: ["فیلتر وضعیت، نه تب‌های پنهان", "تأیید و واگذاری در همان صفحه", "زمان‌سنج SLA برای هر هشدار"],
          },
          {
            title: "قواعدی که همراه دارایی می‌آیند",
            description:
              "یک قاعده را برای پروفایل دستگاه یا مکان بنویسید تا روی هر دستگاه مشابهی که بعداً اضافه می‌شود اعمال شود.",
            items: ["قواعد آستانه و قطع داده", "قالب قاعده برای هر صنعت", "سطوح اهمیت به تفکیک مکان"],
          },
          {
            title: "از هشدار تا دستور کار بسته‌شده",
            description:
              "هشدارهای حیاتی به بورد عملیات می‌روند، پس همان رویدادی که فعال شد تا پایان کار پیگیری می‌شود.",
            items: ["ایجاد دستور کار از هر هشدار", "نمای بورد و فهرست برای کارها", "رد حسابرسی برای هر رویداد"],
          },
        ],
      },
      panel: {
        heading: "داخل پلتفرم",
        description: "نمایی واقعی از پنل پاپلی، نه تصویر مفهومی.",
      },
      capabilities: {
        heading: "قابلیت‌های کلیدی",
        subheading: "با فعال شدن این قابلیت، چه چیزی در عملیات روزمره تغییر می‌کند.",
        cards: [
          {
            icon: "bell",
            title: "هیچ چیز منتظر بازدید دوره‌ای نمی‌ماند",
            description: "شرط آستانه، نرخ تغییر و قطع داده همان لحظهٔ وقوع فعال می‌شود، نه در بازدید بعدی.",
          },
          {
            icon: "branch",
            title: "تشدید به‌جای سکوت",
            description: "اگر هشدار در بازهٔ SLA تأیید نشود، بر پایهٔ سیاست به فرد یا تیم بعدی منتقل می‌شود.",
          },
          {
            icon: "send",
            title: "یک رویداد، چند کانال",
            description: "همان رویداد به ایمیل، پیامک یا پیام‌رسان می‌رسد و می‌تواند در یک گام دستور کار بسازد.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "دیگر دیر باخبر نشوید",
        description:
          "فهرست هشدارها و رویهٔ تشدید فعلی خود را بیاورید تا آن را به‌شکل قاعده و سیاست در پلتفرم پیاده کنیم.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "التنبيهات وإدارة الأحداث",
        description:
          "اكتشف الأحداث الحرجة فورًا واحصل على تنبيه قبل تفاقمها، بقواعد ومستويات خطورة وسياسات تصعيد وقنوات يستخدمها فريقك فعلًا.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "قائمة إنذارات مصمّمة للورديات",
            description: "افرز حسب الحالة والخطورة، وأقرّ وأسند، واعرف مدة بقاء كل إنذار مفتوحًا.",
            items: ["فلاتر حالة لا تبويبات مخفية", "إقرار وإسناد في المكان", "مؤقتات SLA لكل إنذار"],
          },
          {
            title: "قواعد تتبع الأصل",
            description:
              "اكتب القاعدة مرة لملف الجهاز أو الموقع لتُطبّق على كل جهاز مطابق يُضاف لاحقًا.",
            items: ["قواعد العتبة وانقطاع البيانات", "قوالب قواعد لكل صناعة", "خطورة محددة بالموقع"],
          },
          {
            title: "من التنبيه إلى أمر عمل مغلق",
            description:
              "تنتقل الإنذارات الحرجة إلى لوحة العمليات، فيُتابَع الحدث نفسه حتى الإغلاق.",
            items: ["إنشاء أمر عمل من أي إنذار", "عرض لوحة وقائمة للمهام", "سجل تدقيق لكل حدث"],
          },
        ],
      },
      panel: {
        heading: "داخل المنصة",
        description: "شاشة حقيقية من لوحة بابيلي، لا صورة تصورية.",
      },
      capabilities: {
        heading: "القدرات الرئيسية",
        subheading: "ما يتغير في العمليات اليومية بعد تفعيل هذه الميزة.",
        cards: [
          {
            icon: "bell",
            title: "لا شيء ينتظر جولة التفتيش",
            description: "شروط العتبة ومعدل التغيير وانقطاع البيانات تُفعَّل لحظة حدوثها لا في الجولة التالية.",
          },
          {
            icon: "branch",
            title: "تصعيد بدل الصمت",
            description: "إن لم يُقَر التنبيه ضمن اتفاقية الخدمة، يُصعَّد إلى الشخص أو الفريق التالي.",
          },
          {
            icon: "send",
            title: "حدث واحد وقنوات متعددة",
            description: "الحدث نفسه يصل للبريد أو الرسائل أو المحادثات، ويمكنه فتح أمر عمل بخطوة واحدة.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "لا تعرف متأخرًا بعد الآن",
        description: "أحضر قائمة إنذاراتك وسياسة التصعيد الحالية وسنمثّلها كقواعد وسياسات في المنصة.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
