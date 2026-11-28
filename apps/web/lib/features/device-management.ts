import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-devices-1.jpg";
import img2 from "@/src/assets/f-devices-2.jpg";
import img3 from "@/src/assets/f-devices-3.jpg";
import hero from "@/src/assets/f-devices-hero.jpg";
import panel from "@/src/assets/panel-devices.jpg";

export const deviceManagementConfig: FeatureConfig = {
  slug: "device-management",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["smart-manufacturing", "oil-gas", "fleet-tracking", "smart-buildings"],
  related: ["flexible-deployment", "realtime-monitoring", "alerts-events", "ota-updates"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Device & gateway management at scale",
        description:
          "Manage devices and gateways at scale with support for industrial protocols such as MQTT, OPC-UA and Modbus. One inventory, one health view, one place to provision.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "Fleet health at a glance",
            description:
              "Online, offline and error counts sit above the list, so a failing segment of the fleet is visible before anyone reports it.",
            items: ["Status, protocol and location columns", "Table, card and compact views", "Search, filter, sort and export"],
          },
          {
            title: "Gateways as managed assets",
            description:
              "Each gateway shows its connected devices, link quality and firmware, so field teams know exactly which box to visit.",
            items: ["Devices per gateway", "Connectivity history", "Firmware version tracking"],
          },
          {
            title: "Devices tied to physical reality",
            description:
              "Devices attach to a location hierarchy instead of a flat list, so data rolls up per line, unit, plant or city.",
            items: ["Location, unit, asset, device", "Per-location permissions", "Aggregated site metrics"],
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
            icon: "boxes",
            title: "One device inventory",
            description:
              "Every sensor, meter and controller with type, protocol, location, last value and status in one filterable list.",
          },
          {
            icon: "plug",
            title: "Protocols, not adapters",
            description:
              "MQTT, OPC-UA, Modbus and CoAP are first class, so brownfield equipment connects without custom middleware.",
          },
          {
            icon: "checklist",
            title: "Faster commissioning",
            description: "Device profiles and bulk actions replace one-by-one configuration during site rollouts.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Bring your existing equipment online",
        description:
          "Send us your device and protocol list and we will show how the same fleet looks inside the Paapeli panel.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "مدیریت دستگاه و گیت‌وی در مقیاس بزرگ",
        description:
          "دستگاه‌ها و گیت‌وی‌ها را در مقیاس بزرگ و با پشتیبانی از پروتکل‌های صنعتی مانند MQTT، OPC-UA و Modbus مدیریت کنید. یک فهرست واحد، یک نمای سلامت و یک نقطه برای راه‌اندازی.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "سلامت ناوگان در یک نگاه",
            description:
              "شمار دستگاه‌های آنلاین، آفلاین و دارای خطا بالای فهرست می‌نشیند، پس بخش معیوب ناوگان پیش از گزارش کاربر دیده می‌شود.",
            items: ["ستون وضعیت، پروتکل و مکان", "نمای جدولی، کارتی و فشرده", "جست‌وجو، فیلتر، مرتب‌سازی و خروجی"],
          },
          {
            title: "گیت‌وی‌ها به‌عنوان دارایی مدیریت‌شده",
            description:
              "هر گیت‌وی دستگاه‌های متصل، کیفیت لینک و نسخهٔ فرم‌ور خود را نشان می‌دهد، پس تیم میدانی می‌داند سراغ کدام باکس برود.",
            items: ["دستگاه‌های هر گیت‌وی", "تاریخچهٔ اتصال", "پیگیری نسخهٔ فرم‌ور"],
          },
          {
            title: "دستگاه‌ها در ساختار واقعی سایت",
            description:
              "دستگاه‌ها به جای یک فهرست ساده در سلسله‌مراتب مکان قرار می‌گیرند، پس داده به تفکیک خط، واحد، کارخانه یا شهر تجمیع می‌شود.",
            items: ["مکان، واحد، دارایی، دستگاه", "دسترسی به تفکیک مکان", "شاخص‌های تجمیعی سایت"],
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
            icon: "boxes",
            title: "یک فهرست واحد از دستگاه‌ها",
            description:
              "هر حسگر، کنتور و کنترلر با نوع، پروتکل، مکان، آخرین مقدار و وضعیت، در یک فهرست قابل فیلتر.",
          },
          {
            icon: "plug",
            title: "پروتکل‌ها، نه مبدل‌های دستی",
            description:
              "MQTT، OPC-UA، Modbus و CoAP به‌صورت پیش‌فرض پشتیبانی می‌شوند، پس تجهیزات موجود بدون Middleware اختصاصی وصل می‌شوند.",
          },
          {
            icon: "checklist",
            title: "راه‌اندازی سریع‌تر",
            description: "پروفایل دستگاه و اقدام‌های گروهی، جای پیکربندی تک‌به‌تک را در استقرار سایت می‌گیرند.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "تجهیزات موجود خود را آنلاین کنید",
        description:
          "فهرست دستگاه‌ها و پروتکل‌های خود را بفرستید تا نشان دهیم همان ناوگان در پنل پاپلی چگونه دیده می‌شود.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "إدارة الأجهزة والبوابات على نطاق واسع",
        description:
          "أدِر الأجهزة والبوابات على نطاق واسع بدعم بروتوكولات صناعية مثل MQTT وOPC-UA وModbus. مخزون واحد وعرض صحة واحد ومكان واحد للتهيئة.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "صحة الأسطول بنظرة واحدة",
            description:
              "أعداد المتصل وغير المتصل والأخطاء أعلى القائمة، فيظهر الجزء المتعطل من الأسطول قبل أن يبلّغ أحد.",
            items: ["أعمدة الحالة والبروتوكول والموقع", "عرض جدولي وبطاقات ومضغوط", "بحث وفلترة وترتيب وتصدير"],
          },
          {
            title: "البوابات كأصول مُدارة",
            description:
              "كل بوابة تعرض أجهزتها المتصلة وجودة الوصلة والبرنامج الثابت، فيعرف الفريق الميداني أي وحدة يزور.",
            items: ["أجهزة كل بوابة", "سجل الاتصال", "تتبع إصدار البرنامج الثابت"],
          },
          {
            title: "أجهزة مرتبطة بالواقع المادي",
            description:
              "ترتبط الأجهزة بتسلسل المواقع بدل قائمة مسطحة، فتتجمع البيانات لكل خط أو وحدة أو مصنع أو مدينة.",
            items: ["موقع، وحدة، أصل، جهاز", "صلاحيات لكل موقع", "مؤشرات مجمّعة للموقع"],
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
            icon: "boxes",
            title: "مخزون أجهزة واحد",
            description: "كل مستشعر وعدّاد ووحدة تحكم بنوعه وبروتوكوله وموقعه وآخر قيمة وحالته في قائمة قابلة للفلترة.",
          },
          {
            icon: "plug",
            title: "بروتوكولات لا محوّلات يدوية",
            description: "MQTT وOPC-UA وModbus وCoAP مدعومة أصلًا، فتتصل المعدات القائمة دون وسيط مخصص.",
          },
          {
            icon: "checklist",
            title: "تشغيل أسرع",
            description: "ملفات الأجهزة والإجراءات الجماعية تغني عن الإعداد الفردي أثناء تركيب المواقع.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "اربط معداتك الحالية بالإنترنت",
        description: "أرسل قائمة أجهزتك وبروتوكولاتك ونعرض لك كيف يظهر الأسطول نفسه داخل لوحة بابيلي.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
