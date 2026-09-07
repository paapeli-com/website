import type { FeatureSlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* Copy for the DDoS Protection page, one block per locale.            */
/*                                                                    */
/* Same shape as lib/aiot-platform.ts, so the two product pages read   */
/* alike. Four capability cards here rather than six, which is what    */
/* the design asks for and what the grid lays out four-up.             */
/* ------------------------------------------------------------------ */

export type CapabilityIcon = "shieldCheck" | "activity" | "globe" | "lock";

export type RevealCopy = {
  title: string;
  description: string;
  items: [string, string, string];
};

export type ProductLink = {
  href: string;
  title: string;
  tagline: string;
};

export type DdosCopy = {
  hero: { badge: string; title: string; description: string; primary: string; secondary: string };
  offer: { heading: string; subheading: string; cards: [RevealCopy, RevealCopy, RevealCopy] };
  panel: { heading: string; description: string };
  capabilities: {
    heading: string;
    subheading: string;
    cards: { icon: CapabilityIcon; title: string; description: string }[];
  };
  relatedHeading: string;
  productsHeading: string;
  products: ProductLink[];
  cta: { heading: string; description: string; button: string };
};

/** Named from FEATURE_INDEX, so a feature renamed there is renamed here. */
export const RELATED_FEATURES: FeatureSlug[] = [
  "flexible-deployment",
  "alerts-events",
  "device-management",
  "realtime-monitoring",
];

export const DDOS_COPY: Record<string, DdosCopy> = {
  en: {
    hero: {
      badge: "Paapeli product",
      title: "DDoS Protection",
      description:
        "Keep IoT endpoints, APIs and dashboards reachable under volumetric and application-layer attack, so field data keeps flowing while traffic is being scrubbed.",
      primary: "Request a demo",
      secondary: "Talk to Sales",
    },
    offer: {
      heading: "What this product does",
      subheading: "One product, one workflow, from field data to daily operations.",
      cards: [
        {
          title: "Always-on scrubbing",
          description:
            "Traffic is inspected continuously at the network edge, so volumetric floods are absorbed before they reach your ingestion endpoints.",
          items: [
            "L3/L4 volumetric mitigation",
            "Automatic attack detection",
            "No manual failover",
          ],
        },
        {
          title: "Protected endpoints",
          description:
            "MQTT brokers, REST APIs and the operator panel sit behind rate limits, allow-lists and mutual TLS instead of open ports.",
          items: [
            "Per-tenant rate limits",
            "IP allow-lists for gateways",
            "Mutual TLS device identity",
          ],
        },
        {
          title: "Visible under attack",
          description:
            "Attack start, blocked volume and service health appear as alerts and history, evidence your operators and auditors can rely on.",
          items: [
            "Real-time availability alerts",
            "Attack timeline and reports",
            "SLA-ready audit history",
          ],
        },
      ],
    },
    panel: {
      heading: "Inside the platform",
      description:
        "Availability and security events land in the same alert workspace your team already uses.",
    },
    capabilities: {
      heading: "Key capabilities",
      subheading: "What changes in daily operations once this product is in place.",
      cards: [
        {
          icon: "shieldCheck",
          title: "Layer 3 to 7 defence",
          description: "Volumetric, protocol and application-layer attacks are handled by one policy set.",
        },
        {
          icon: "activity",
          title: "Ingestion stays up",
          description: "Device telemetry keeps arriving while malicious traffic is dropped upstream.",
        },
        {
          icon: "globe",
          title: "Distributed capacity",
          description: "Attack traffic is absorbed across scrubbing capacity, not by your origin servers.",
        },
        {
          icon: "lock",
          title: "Hardened access",
          description: "Device certificates, scoped API keys and role-based access on every entry point.",
        },
      ],
    },
    relatedHeading: "Related platform capabilities",
    productsHeading: "Other products",
    products: [
      {
        href: "/aiot-platform",
        title: "AIoT Platform",
        tagline: "Connect, monitor and intelligently control your infrastructure at scale.",
      },
      {
        href: "/edge-computing",
        title: "Edge Computing",
        tagline: "Process data next to the machine, at low latency and low bandwidth cost.",
      },
      {
        href: "/features/ota-updates",
        title: "OTA Updates",
        tagline: "Ship firmware to distributed fleets without a site visit.",
      },
      {
        href: "/intelligence-insight",
        title: "Intelligence & Insight",
        tagline: "Turn raw telemetry into forecasts, anomalies and decisions.",
      },
    ],
    cta: {
      heading: "Availability your operations can count on",
      description:
        "Talk through your exposure, the public APIs, the broker endpoints, the remote sites, and the protection profile that fits.",
      button: "Request a demo",
    },
  },

  fa: {
    hero: {
      badge: "محصول پاپلی",
      title: "حفاظت در برابر DDoS",
      description:
        "نقاط پایانی IoT، APIها و داشبوردها را زیر حملهٔ حجمی و حملهٔ لایهٔ کاربرد در دسترس نگه می‌دارد، تا وقتی ترافیک پالایش می‌شود، دادهٔ میدانی بدون وقفه برسد.",
      primary: "درخواست دمو",
      secondary: "تماس با فروش",
    },
    offer: {
      heading: "این محصول چه می‌کند",
      subheading: "یک محصول، یک گردش‌کار، از دادهٔ میدانی تا عملیات روزمره.",
      cards: [
        {
          title: "پالایش همیشه‌فعال",
          description:
            "ترافیک به‌طور پیوسته در لبهٔ شبکه بازرسی می‌شود، پس سیل‌های حجمی پیش از رسیدن به نقاط دریافت داده جذب می‌شوند.",
          items: [
            "مهار حملهٔ حجمی در لایهٔ ۳ و ۴",
            "تشخیص خودکار حمله",
            "بدون سوئیچ دستی",
          ],
        },
        {
          title: "نقاط پایانی محافظت‌شده",
          description:
            "بروکرهای MQTT، APIهای REST و پنل اپراتور به‌جای پورت باز، پشت محدودیت نرخ، فهرست مجاز و TLS دوطرفه قرار می‌گیرند.",
          items: [
            "محدودیت نرخ به تفکیک مشتری",
            "فهرست IP مجاز برای گیت‌وی‌ها",
            "هویت دستگاه با TLS دوطرفه",
          ],
        },
        {
          title: "قابل‌مشاهده در زمان حمله",
          description:
            "شروع حمله، حجم مسدودشده و سلامت سرویس به شکل هشدار و تاریخچه دیده می‌شوند؛ مستنداتی که اپراتور و حسابرس می‌توانند به آن تکیه کنند.",
          items: [
            "هشدار لحظه‌ای دسترس‌پذیری",
            "خط زمانی و گزارش حمله",
            "تاریخچهٔ حسابرسی مناسب SLA",
          ],
        },
      ],
    },
    panel: {
      heading: "درون پلتفرم",
      description:
        "رویدادهای دسترس‌پذیری و امنیت در همان فضای هشداری می‌نشینند که تیم شما امروز با آن کار می‌کند.",
    },
    capabilities: {
      heading: "قابلیت‌های کلیدی",
      subheading: "با استقرار این محصول، در عملیات روزمره چه تغییر می‌کند.",
      cards: [
        {
          icon: "shieldCheck",
          title: "دفاع از لایهٔ ۳ تا ۷",
          description: "حملهٔ حجمی، پروتکلی و لایهٔ کاربرد با یک مجموعه سیاست واحد مدیریت می‌شود.",
        },
        {
          icon: "activity",
          title: "دریافت داده قطع نمی‌شود",
          description: "تله‌متری دستگاه‌ها همچنان می‌رسد، در حالی که ترافیک مخرب بالادست حذف می‌شود.",
        },
        {
          icon: "globe",
          title: "ظرفیت توزیع‌شده",
          description: "ترافیک حمله در ظرفیت پالایش جذب می‌شود، نه روی سرورهای اصلی شما.",
        },
        {
          icon: "lock",
          title: "دسترسی سخت‌شده",
          description: "گواهی دستگاه، کلید API با دامنهٔ محدود و دسترسی مبتنی بر نقش روی هر نقطهٔ ورود.",
        },
      ],
    },
    relatedHeading: "قابلیت‌های مرتبط پلتفرم",
    productsHeading: "محصولات دیگر",
    products: [
      {
        href: "/aiot-platform",
        title: "پلتفرم AIoT",
        tagline: "اتصال، پایش و کنترل هوشمند زیرساخت شما در مقیاس بزرگ.",
      },
      {
        href: "/edge-computing",
        title: "رایانش لبه",
        tagline: "پردازش داده کنار ماشین، با تأخیر کم و هزینهٔ پهنای باند کم.",
      },
      {
        href: "/features/ota-updates",
        title: "به‌روزرسانی OTA",
        tagline: "ارسال فرم‌ور به ناوگان‌های پراکنده بدون مراجعهٔ حضوری.",
      },
      {
        href: "/intelligence-insight",
        title: "بینش هوشمند",
        tagline: "تبدیل تله‌متری خام به پیش‌بینی، ناهنجاری و تصمیم.",
      },
    ],
    cta: {
      heading: "دسترس‌پذیری‌ای که عملیات شما می‌تواند روی آن حساب کند",
      description:
        "دربارهٔ سطح در معرض بودن خود با ما صحبت کنید؛ APIهای عمومی، نقاط بروکر، سایت‌های دوردست، و اینکه کدام پروفایل حفاظتی مناسب شماست.",
      button: "درخواست دمو",
    },
  },

  ar: {
    hero: {
      badge: "منتج بابيلي",
      title: "الحماية من DDoS",
      description:
        "أبقِ نقاط IoT والواجهات البرمجية ولوحات المعلومات متاحة تحت الهجمات الحجمية وهجمات طبقة التطبيق، فتستمر بيانات الميدان في الوصول بينما يجري تنقية حركة المرور.",
      primary: "طلب عرض توضيحي",
      secondary: "تحدّث إلى المبيعات",
    },
    offer: {
      heading: "ماذا يفعل هذا المنتج",
      subheading: "منتج واحد ومسار عمل واحد، من بيانات الميدان إلى العمليات اليومية.",
      cards: [
        {
          title: "تنقية دائمة التشغيل",
          description:
            "تُفحص حركة المرور باستمرار عند حافة الشبكة، فتُمتص الفيضانات الحجمية قبل أن تصل إلى نقاط استقبال بياناتك.",
          items: [
            "تخفيف حجمي في الطبقتين ٣ و٤",
            "كشف تلقائي للهجمات",
            "بلا تبديل يدوي",
          ],
        },
        {
          title: "نقاط نهاية محمية",
          description:
            "وسطاء MQTT وواجهات REST ولوحة المشغّل تقف خلف حدود المعدل وقوائم السماح وTLS المتبادل بدل المنافذ المفتوحة.",
          items: [
            "حدود معدل لكل عميل",
            "قوائم IP مسموحة للبوابات",
            "هوية أجهزة بـ TLS متبادل",
          ],
        },
        {
          title: "واضح أثناء الهجوم",
          description:
            "بداية الهجوم والحجم المحجوب وصحة الخدمة تظهر كتنبيهات وسجل، وهي أدلة يعتمد عليها مشغّلوكم ومدققوكم.",
          items: [
            "تنبيهات إتاحة فورية",
            "خط زمني وتقارير للهجوم",
            "سجل تدقيق يناسب اتفاقية الخدمة",
          ],
        },
      ],
    },
    panel: {
      heading: "داخل المنصة",
      description:
        "أحداث الإتاحة والأمن تصل إلى مساحة التنبيهات نفسها التي يستخدمها فريقكم اليوم.",
    },
    capabilities: {
      heading: "القدرات الرئيسية",
      subheading: "ما الذي يتغير في العمليات اليومية بمجرد تشغيل هذا المنتج.",
      cards: [
        {
          icon: "shieldCheck",
          title: "دفاع من الطبقة ٣ إلى ٧",
          description: "الهجمات الحجمية والبروتوكولية وهجمات طبقة التطبيق تُدار بمجموعة سياسات واحدة.",
        },
        {
          icon: "activity",
          title: "الاستقبال لا يتوقف",
          description: "تستمر قياسات الأجهزة في الوصول بينما تُسقط حركة المرور الخبيثة في الأعلى.",
        },
        {
          icon: "globe",
          title: "سعة موزّعة",
          description: "تُمتص حركة الهجوم عبر سعة التنقية، لا عبر خوادمكم الأصلية.",
        },
        {
          icon: "lock",
          title: "وصول مُحصّن",
          description: "شهادات للأجهزة، ومفاتيح واجهات محدودة النطاق، ووصول حسب الدور على كل نقطة دخول.",
        },
      ],
    },
    relatedHeading: "قدرات المنصة ذات الصلة",
    productsHeading: "منتجات أخرى",
    products: [
      {
        href: "/aiot-platform",
        title: "منصة AIoT",
        tagline: "اربط بنيتك التحتية وراقبها وتحكم بها بذكاء على نطاق واسع.",
      },
      {
        href: "/edge-computing",
        title: "الحوسبة الطرفية",
        tagline: "معالجة البيانات بجانب الآلة، بزمن استجابة أقل وكلفة نطاق أقل.",
      },
      {
        href: "/features/ota-updates",
        title: "تحديثات OTA",
        tagline: "إرسال البرامج الثابتة إلى الأساطيل الموزعة دون زيارة ميدانية.",
      },
      {
        href: "/intelligence-insight",
        title: "رؤى ذكية",
        tagline: "تحويل القياسات الخام إلى تنبؤات وحالات شذوذ وقرارات.",
      },
    ],
    cta: {
      heading: "إتاحة تعتمد عليها عملياتكم",
      description:
        "تحدّثوا معنا عن مواطن انكشافكم، الواجهات العامة ونقاط الوسيط والمواقع البعيدة، وعن ملف الحماية الذي يناسبكم.",
      button: "طلب عرض توضيحي",
    },
  },
};
