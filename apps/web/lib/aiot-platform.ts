import type { FeatureSlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* Copy for the AIoT Platform page, one block per locale.              */
/*                                                                    */
/* The page is the product landing the feature and industry pages      */
/* point back at, so it borrows their rhythm: a full-bleed hero, three */
/* reveal cards, the panel itself, a capability grid and two link      */
/* rails. The capability rail names come from FEATURE_INDEX rather     */
/* than from here, so a feature renamed there is renamed here too.     */
/* ------------------------------------------------------------------ */

export type CapabilityIcon =
  | "cloud"
  | "shield"
  | "zap"
  | "database"
  | "network"
  | "settings";

export type RevealCopy = {
  title: string;
  description: string;
  items: [string, string, string];
};

/** A sibling product page. These are not in FEATURE_INDEX, so they carry
    their own name and line per locale. */
export type ProductLink = {
  href: string;
  title: string;
  tagline: string;
};

export type PlatformCopy = {
  hero: { badge: string; title: string; description: string; primary: string; secondary: string };
  offer: { heading: string; subheading: string; cards: [RevealCopy, RevealCopy, RevealCopy] };
  panel: { heading: string; description: string };
  capabilities: {
    heading: string;
    subheading: string;
    cards: { icon: CapabilityIcon; title: string; description: string }[];
  };
  /** Heading above the linked feature pages; the names come from site-links. */
  relatedHeading: string;
  productsHeading: string;
  products: ProductLink[];
  cta: { heading: string; description: string; button: string };
};

/** The platform capabilities linked at the foot, named from FEATURE_INDEX. */
export const RELATED_FEATURES: FeatureSlug[] = [
  "device-management",
  "realtime-monitoring",
  "alerts-events",
  "flexible-deployment",
];

export const PLATFORM_COPY: Record<string, PlatformCopy> = {
  en: {
    hero: {
      badge: "Paapeli product",
      title: "AIoT Platform",
      description:
        "An AI-powered IoT cloud platform to connect, monitor and intelligently control your infrastructure at scale — for asset owners and for the contractors who operate on their behalf.",
      primary: "Request a demo",
      secondary: "Talk to Sales",
    },
    offer: {
      heading: "What this product does",
      subheading: "One product, one workflow — from field data to daily operations.",
      cards: [
        {
          title: "Connect anything",
          description:
            "MQTT, OPC-UA, Modbus and CoAP are native, so brownfield equipment joins the platform without custom middleware.",
          items: [
            "Industrial protocol support",
            "Gateways for offline sites",
            "Device profiles and bulk setup",
          ],
        },
        {
          title: "Monitor and control",
          description:
            "Live values, trends, thresholds and alerts across every location, with role- and location-aware access for each team.",
          items: ["Custom dashboards", "Multi-channel alerting", "Role and location permissions"],
        },
        {
          title: "Deploy your way",
          description:
            "Run on Paapeli cloud, in a private region or fully on-premise, with white-label options for technology partners and EPC contractors.",
          items: ["Cloud, private or on-premise", "Solution templates", "White-label for partners"],
        },
      ],
    },
    panel: {
      heading: "Inside the platform",
      description: "One workspace: locations, devices, live values, dashboards and work orders.",
    },
    capabilities: {
      heading: "Key capabilities",
      subheading: "What changes in daily operations once this product is in place.",
      cards: [
        {
          icon: "cloud",
          title: "Cloud-native core",
          description: "Elastic ingestion and processing that grows from one pilot site to a national fleet.",
        },
        {
          icon: "shield",
          title: "End-to-end security",
          description: "Encrypted transport and storage, signed device identity and full audit history.",
        },
        {
          icon: "zap",
          title: "Real-time pipeline",
          description: "Sub-second telemetry, rule evaluation and alerting on live streams.",
        },
        {
          icon: "database",
          title: "Long-term history",
          description: "Time-series storage with downsampling, so multi-year trends stay queryable.",
        },
        {
          icon: "network",
          title: "Open protocols",
          description: "MQTT, OPC-UA, Modbus, CoAP and LoRaWAN, without vendor lock-in.",
        },
        {
          icon: "settings",
          title: "APIs and integrations",
          description: "REST and webhook APIs to connect the ERP, CMMS, BI and ticketing systems you already run.",
        },
      ],
    },
    relatedHeading: "Related platform capabilities",
    productsHeading: "Other products",
    products: [
      {
        href: "/edge-computing",
        title: "Edge Computing",
        tagline: "Process data next to the machine — low latency, low bandwidth cost.",
      },
      {
        href: "/features/ota-updates",
        title: "OTA Updates",
        tagline: "Ship firmware to distributed fleets without a site visit.",
      },
      {
        href: "/ddos-protection",
        title: "DDoS Protection",
        tagline: "Keep IoT endpoints and APIs reachable under volumetric attack.",
      },
      {
        href: "/intelligence-insight",
        title: "Intelligence & Insight",
        tagline: "Turn raw telemetry into forecasts, anomalies and decisions.",
      },
    ],
    cta: {
      heading: "See the platform on your own data",
      description:
        "Book a walkthrough and we will map your sites, devices and reporting needs onto Paapeli.",
      button: "Request a demo",
    },
  },

  fa: {
    hero: {
      badge: "محصول پاپلی",
      title: "پلتفرم AIoT",
      description:
        "یک پلتفرم ابری اینترنت اشیا با هوش مصنوعی، برای اتصال، پایش و کنترل هوشمند زیرساخت شما در مقیاس بزرگ؛ هم برای مالکان دارایی و هم برای پیمانکارانی که از طرف آن‌ها بهره‌برداری می‌کنند.",
      primary: "درخواست دمو",
      secondary: "تماس با فروش",
    },
    offer: {
      heading: "این محصول چه می‌کند",
      subheading: "یک محصول، یک گردش‌کار، از دادهٔ میدانی تا عملیات روزمره.",
      cards: [
        {
          title: "هر چیزی را متصل کنید",
          description:
            "MQTT، OPC-UA، Modbus و CoAP به‌صورت بومی پشتیبانی می‌شوند، پس تجهیزات قدیمی بدون میان‌افزار سفارشی به پلتفرم می‌پیوندند.",
          items: [
            "پشتیبانی از پروتکل‌های صنعتی",
            "گیت‌وی برای سایت‌های بدون شبکه",
            "پروفایل دستگاه و راه‌اندازی گروهی",
          ],
        },
        {
          title: "پایش و کنترل",
          description:
            "مقادیر زنده، روندها، آستانه‌ها و هشدارها در همهٔ مکان‌ها، با دسترسی مبتنی بر نقش و مکان برای هر تیم.",
          items: ["داشبورد سفارشی", "هشدار چندکاناله", "دسترسی بر پایهٔ نقش و مکان"],
        },
        {
          title: "به شیوهٔ خودتان مستقر کنید",
          description:
            "روی ابر پاپلی، در یک ناحیهٔ خصوصی یا کاملاً داخل سازمان اجرا کنید، با گزینهٔ برچسب سفید برای شرکای فناوری و پیمانکاران EPC.",
          items: ["ابری، خصوصی یا داخلی", "قالب‌های راهکار", "برچسب سفید برای شرکا"],
        },
      ],
    },
    panel: {
      heading: "درون پلتفرم",
      description: "یک فضای کاری: مکان‌ها، دستگاه‌ها، مقادیر زنده، داشبوردها و دستور کارها.",
    },
    capabilities: {
      heading: "قابلیت‌های کلیدی",
      subheading: "با استقرار این محصول، در عملیات روزمره چه تغییر می‌کند.",
      cards: [
        {
          icon: "cloud",
          title: "هستهٔ ابری بومی",
          description: "دریافت و پردازش کشسان که از یک سایت آزمایشی تا یک ناوگان ملی رشد می‌کند.",
        },
        {
          icon: "shield",
          title: "امنیت سرتاسری",
          description: "انتقال و ذخیره‌سازی رمزنگاری‌شده، هویت امضاشدهٔ دستگاه و تاریخچهٔ کامل حسابرسی.",
        },
        {
          icon: "zap",
          title: "خط لولهٔ بی‌درنگ",
          description: "تله‌متری زیر یک ثانیه، ارزیابی قواعد و هشدار روی جریان‌های زنده.",
        },
        {
          icon: "database",
          title: "تاریخچهٔ بلندمدت",
          description: "ذخیره‌سازی سری‌زمانی با کاهش نمونه، تا روندهای چندساله قابل پرس‌وجو بمانند.",
        },
        {
          icon: "network",
          title: "پروتکل‌های باز",
          description: "MQTT، OPC-UA، Modbus، CoAP و LoRaWAN، بدون وابستگی به یک فروشنده.",
        },
        {
          icon: "settings",
          title: "API و یکپارچه‌سازی",
          description: "API‌های REST و وب‌هوک برای اتصال به همان ERP، CMMS، BI و سامانهٔ تیکتی که امروز دارید.",
        },
      ],
    },
    relatedHeading: "قابلیت‌های مرتبط پلتفرم",
    productsHeading: "محصولات دیگر",
    products: [
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
        href: "/ddos-protection",
        title: "حفاظت در برابر DDoS",
        tagline: "در دسترس نگه‌داشتن نقاط پایانی و APIهای IoT زیر حملهٔ حجمی.",
      },
      {
        href: "/intelligence-insight",
        title: "بینش هوشمند",
        tagline: "تبدیل تله‌متری خام به پیش‌بینی، ناهنجاری و تصمیم.",
      },
    ],
    cta: {
      heading: "پلتفرم را روی دادهٔ خودتان ببینید",
      description:
        "یک جلسهٔ نمایش بگیرید تا سایت‌ها، دستگاه‌ها و نیازهای گزارشی شما را روی پاپلی نگاشت کنیم.",
      button: "درخواست دمو",
    },
  },

  ar: {
    hero: {
      badge: "منتج بابيلي",
      title: "منصة AIoT",
      description:
        "منصة سحابية لإنترنت الأشياء مدعومة بالذكاء الاصطناعي، لربط بنيتك التحتية ومراقبتها والتحكم بها بذكاء وعلى نطاق واسع؛ لمالكي الأصول وللمقاولين الذين يشغّلونها نيابة عنهم.",
      primary: "طلب عرض توضيحي",
      secondary: "تحدّث إلى المبيعات",
    },
    offer: {
      heading: "ماذا يفعل هذا المنتج",
      subheading: "منتج واحد ومسار عمل واحد، من بيانات الميدان إلى العمليات اليومية.",
      cards: [
        {
          title: "اربط أي شيء",
          description:
            "MQTT وOPC-UA وModbus وCoAP مدعومة أصلاً، فتنضم المعدات القائمة إلى المنصة دون برمجيات وسيطة مخصصة.",
          items: [
            "دعم البروتوكولات الصناعية",
            "بوابات للمواقع بلا شبكة",
            "ملفات الأجهزة والإعداد الجماعي",
          ],
        },
        {
          title: "راقب وتحكّم",
          description:
            "قيم حيّة واتجاهات وعتبات وتنبيهات في كل المواقع، مع صلاحيات حسب الدور والموقع لكل فريق.",
          items: ["لوحات معلومات مخصصة", "تنبيه متعدد القنوات", "صلاحيات حسب الدور والموقع"],
        },
        {
          title: "انشر بطريقتك",
          description:
            "شغّلها على سحابة بابيلي أو في منطقة خاصة أو محلياً بالكامل، مع خيارات العلامة البيضاء لشركاء التقنية ومقاولي EPC.",
          items: ["سحابي أو خاص أو محلي", "قوالب الحلول", "علامة بيضاء للشركاء"],
        },
      ],
    },
    panel: {
      heading: "داخل المنصة",
      description: "مساحة عمل واحدة: المواقع والأجهزة والقيم الحيّة ولوحات المعلومات وأوامر العمل.",
    },
    capabilities: {
      heading: "القدرات الرئيسية",
      subheading: "ما الذي يتغير في العمليات اليومية بمجرد تشغيل هذا المنتج.",
      cards: [
        {
          icon: "cloud",
          title: "نواة سحابية أصلية",
          description: "استقبال ومعالجة مرنان ينموان من موقع تجريبي واحد إلى أسطول على مستوى الدولة.",
        },
        {
          icon: "shield",
          title: "أمن من الطرف إلى الطرف",
          description: "نقل وتخزين مشفّران، وهوية أجهزة موقّعة، وسجل تدقيق كامل.",
        },
        {
          icon: "zap",
          title: "مسار فوري",
          description: "قياسات دون الثانية، وتقييم للقواعد وتنبيه على التدفقات الحيّة.",
        },
        {
          icon: "database",
          title: "تاريخ طويل المدى",
          description: "تخزين للسلاسل الزمنية مع تقليل العينات، لتبقى اتجاهات السنوات قابلة للاستعلام.",
        },
        {
          icon: "network",
          title: "بروتوكولات مفتوحة",
          description: "MQTT وOPC-UA وModbus وCoAP وLoRaWAN، دون ارتباط بمورّد واحد.",
        },
        {
          icon: "settings",
          title: "واجهات برمجية وتكاملات",
          description: "واجهات REST وWebhook لربط أنظمة ERP وCMMS وBI والتذاكر التي تستخدمونها اليوم.",
        },
      ],
    },
    relatedHeading: "قدرات المنصة ذات الصلة",
    productsHeading: "منتجات أخرى",
    products: [
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
        href: "/ddos-protection",
        title: "الحماية من DDoS",
        tagline: "إبقاء نقاط IoT والواجهات البرمجية متاحة تحت الهجمات الحجمية.",
      },
      {
        href: "/intelligence-insight",
        title: "رؤى ذكية",
        tagline: "تحويل القياسات الخام إلى تنبؤات وحالات شذوذ وقرارات.",
      },
    ],
    cta: {
      heading: "شاهد المنصة على بياناتك أنت",
      description:
        "احجز جولة توضيحية وسنرسم مواقعك وأجهزتك واحتياجاتك من التقارير على بابيلي.",
      button: "طلب عرض توضيحي",
    },
  },
};
