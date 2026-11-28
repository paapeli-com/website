import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-monitoring-1.jpg";
import img2 from "@/src/assets/f-monitoring-2.jpg";
import img3 from "@/src/assets/f-monitoring-3.jpg";
import hero from "@/src/assets/f-monitoring-hero.jpg";
import panel from "@/src/assets/panel.jpg";

export const realtimeMonitoringConfig: FeatureConfig = {
  slug: "realtime-monitoring",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["smart-manufacturing", "energy-monitoring", "smart-buildings", "fleet-tracking"],
  related: ["flexible-deployment", "device-management", "alerts-events", "ota-updates"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Real-time monitoring of devices and systems",
        description:
          "Follow device data and system performance moment by moment to keep full visibility over operations, from a single sensor value up to plant-level KPIs.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "KPI cards with trend context",
            description:
              "Each metric carries its short-term trend and change versus the previous period, so a number is never read alone.",
            items: ["Availability, health and open work", "Sparkline trends per card", "Drill down to the source device"],
          },
          {
            title: "Dashboards you build yourself",
            description:
              "Compose widgets on a canvas, share the result with a team and keep built-in dashboards as a starting point.",
            items: ["Drag-and-drop widget canvas", "Built-in executive and manager views", "Location-scoped dashboards"],
          },
          {
            title: "From aggregate to a single tag",
            description:
              "Any KPI can be traced back to the device and tag behind it, with its recent history and last reported value.",
            items: ["Last value and update time", "Per-device time series", "Stale-data detection"],
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
            icon: "pulse",
            title: "Live values, not yesterday's report",
            description: "Telemetry lands on the panel as it arrives, so operators react during the shift instead of after it.",
          },
          {
            icon: "gauge",
            title: "System health beside process data",
            description: "Broker, rule engine, AI engine, database and storage status are shown next to the KPIs they feed.",
          },
          {
            icon: "dashboard",
            title: "A view per audience",
            description: "Operators, maintenance and management each get their own dashboard over the same live data.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "See your own live data on the panel",
        description:
          "We can connect a small set of your devices in a pilot and build the first operational dashboard with your team.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "پایش لحظه‌ای دستگاه‌ها و سامانه",
        description:
          "دادهٔ دستگاه و کارایی سامانه را لحظه‌به‌لحظه دنبال کنید تا دید کاملی از عملیات داشته باشید، از مقدار یک حسگر تا شاخص‌های سطح کارخانه.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "کارت‌های شاخص همراه با روند",
            description:
              "هر شاخص روند کوتاه‌مدت و تغییر نسبت به دورهٔ قبل را همراه دارد، پس هیچ عددی تنها خوانده نمی‌شود.",
            items: ["دسترس‌پذیری، سلامت و کارهای باز", "نمودار روند روی هر کارت", "Drill-down تا دستگاه منبع"],
          },
          {
            title: "داشبوردهایی که خودتان می‌سازید",
            description:
              "ویجت‌ها را روی بوم بچینید، نتیجه را با تیم به اشتراک بگذارید و داشبوردهای آماده را نقطهٔ شروع بگیرید.",
            items: ["بوم ویجت با کشیدن و رها کردن", "نمای آمادهٔ مدیریتی و اجرایی", "داشبورد محدود به مکان"],
          },
          {
            title: "از شاخص کلی تا یک Tag",
            description:
              "هر شاخص را می‌توان تا دستگاه و تگ پشت آن، همراه با تاریخچهٔ اخیر و آخرین مقدار گزارش‌شده، ردیابی کرد.",
            items: ["آخرین مقدار و زمان به‌روزرسانی", "سری زمانی هر دستگاه", "تشخیص دادهٔ قدیمی (Stale)"],
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
            icon: "pulse",
            title: "مقادیر زنده، نه گزارش دیروز",
            description: "تله‌متری همان لحظه روی پنل می‌نشیند، پس اپراتور در طول شیفت واکنش می‌دهد نه پس از آن.",
          },
          {
            icon: "gauge",
            title: "سلامت سامانه در کنار دادهٔ فرآیند",
            description:
              "وضعیت بروکر، موتور قواعد، موتور هوش مصنوعی، پایگاه داده و ذخیره‌سازی کنار شاخص‌هایی که تغذیه می‌کنند دیده می‌شود.",
          },
          {
            icon: "dashboard",
            title: "یک نما برای هر مخاطب",
            description: "اپراتور، نگهداری و مدیریت هر یک داشبورد خود را روی همان دادهٔ زنده دارند.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "دادهٔ زندهٔ خودتان را روی پنل ببینید",
        description:
          "می‌توانیم در یک پایلوت چند دستگاه شما را وصل کنیم و نخستین داشبورد عملیاتی را با تیم شما بسازیم.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "مراقبة لحظية للأجهزة والأنظمة",
        description:
          "تابع بيانات الأجهزة وأداء النظام لحظة بلحظة لتبقى الرؤية كاملة على العمليات، من قيمة مستشعر واحد إلى مؤشرات المصنع.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "بطاقات مؤشرات مع سياق الاتجاه",
            description:
              "كل مؤشر يحمل اتجاهه القصير وتغيّره عن الفترة السابقة، فلا يُقرأ رقم بمفرده أبدًا.",
            items: ["الجهوزية والصحة والأعمال المفتوحة", "اتجاه مصغّر لكل بطاقة", "تعمّق حتى الجهاز المصدر"],
          },
          {
            title: "لوحات تبنيها بنفسك",
            description:
              "ركّب الأدوات على لوحة، وشارك النتيجة مع الفريق، واستخدم اللوحات المدمجة نقطة بداية.",
            items: ["لوحة أدوات بالسحب والإفلات", "عروض تنفيذية وإدارية جاهزة", "لوحات محددة بالموقع"],
          },
          {
            title: "من التجميع إلى وسم واحد",
            description:
              "يمكن تتبع أي مؤشر حتى الجهاز والوسم خلفه، مع سجلّه الأخير وآخر قيمة مُبلّغة.",
            items: ["آخر قيمة ووقت التحديث", "سلسلة زمنية لكل جهاز", "كشف البيانات القديمة"],
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
            icon: "pulse",
            title: "قيم حيّة لا تقرير الأمس",
            description: "تصل القياسات إلى اللوحة فورًا، فيتفاعل المشغّل خلال الوردية لا بعدها.",
          },
          {
            icon: "gauge",
            title: "صحة النظام بجانب بيانات العملية",
            description: "حالة الوسيط ومحرك القواعد ومحرك الذكاء وقاعدة البيانات والتخزين إلى جانب المؤشرات التي تغذيها.",
          },
          {
            icon: "dashboard",
            title: "عرض لكل جمهور",
            description: "للمشغّلين والصيانة والإدارة لوحة خاصة على البيانات الحيّة نفسها.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "شاهد بياناتك الحيّة على اللوحة",
        description: "يمكننا ربط عدد محدود من أجهزتك في تجربة أولية وبناء أول لوحة تشغيلية مع فريقك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
