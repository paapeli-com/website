import type { FeatureSlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* Copy for the Edge Computing page, one block per locale.             */
/*                                                                    */
/* Same shape as lib/ddos-protection.ts and lib/aiot-platform.ts, so   */
/* the three product pages read alike and a change to one has an       */
/* obvious counterpart in the others. Four capability cards, which is  */
/* what the design asks for and what the grid lays out four-up.        */
/*                                                                    */
/* The hero and closing CTA keep the Persian and Arabic wording the    */
/* previous version of this page already published, so a returning     */
/* reader meets the same sentences under the new design.               */
/* ------------------------------------------------------------------ */

export type CapabilityIcon = "cpu" | "wifiOff" | "gauge" | "shieldCheck";

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

export type EdgeCopy = {
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
  "device-management",
  "realtime-monitoring",
  "ota-updates",
];

export const EDGE_COPY: Record<string, EdgeCopy> = {
  en: {
    hero: {
      badge: "Paapeli product",
      title: "Edge Computing",
      description:
        "Run filtering, rules and AI inference next to the machine. Sites keep working when the link drops, and only the data worth keeping travels to the cloud.",
      primary: "Request a demo",
      secondary: "Talk to Sales",
    },
    offer: {
      heading: "What this product does",
      subheading: "One product, one workflow, from field data to daily operations.",
      cards: [
        {
          title: "Local processing",
          description:
            "Aggregate, deduplicate and evaluate rules on the gateway, so control loops do not wait for a round trip to the cloud.",
          items: [
            "Millisecond local rules",
            "On-device AI inference",
            "Edge-side data reduction",
          ],
        },
        {
          title: "Store & forward",
          description:
            "When cellular or satellite links drop, measurements are buffered locally and replayed in order once the link returns.",
          items: ["No data gaps", "Ordered replay", "Bandwidth-aware sync"],
        },
        {
          title: "Managed remotely",
          description:
            "Gateways are inventoried, monitored and updated from the same panel as the devices behind them, OTA updates included.",
          items: [
            "Remote configuration",
            "Health and connectivity view",
            "OTA for edge software",
          ],
        },
      ],
    },
    panel: {
      heading: "Inside the platform",
      description:
        "Gateway inventory: firmware, connectivity, buffered messages and the devices attached to each one.",
    },
    capabilities: {
      heading: "Key capabilities",
      subheading: "What changes in daily operations once this product is in place.",
      cards: [
        {
          icon: "cpu",
          title: "Edge runtime",
          description:
            "Containerised logic on industrial hardware, from DIN-rail gateways to on-site servers.",
        },
        {
          icon: "wifiOff",
          title: "Offline autonomy",
          description: "Alarms and interlocks keep running locally while the site is disconnected.",
        },
        {
          icon: "gauge",
          title: "Lower bandwidth cost",
          description: "Send summaries and events instead of every raw sample on metered links.",
        },
        {
          icon: "shieldCheck",
          title: "Trusted edge",
          description:
            "Signed images, encrypted local storage and mutual TLS back to the platform.",
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
        href: "/ddos-protection",
        title: "DDoS Protection",
        tagline: "Keep IoT endpoints and APIs reachable under volumetric attack.",
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
      heading: "Bring compute to the site",
      description:
        "Tell us about your sites and your connectivity and we will map out what should run locally and what belongs in the cloud.",
      button: "Request a demo",
    },
  },

  fa: {
    hero: {
      badge: "محصول پاپلی",
      title: "رایانش لبه",
      description:
        "پالایش، قواعد و استنتاج هوش مصنوعی را کنار همان ماشین اجرا کنید. سایت در قطعی ارتباط به کار ادامه می‌دهد و فقط دادهٔ ارزشمند به ابر می‌رود.",
      primary: "درخواست دمو",
      secondary: "تماس با فروش",
    },
    offer: {
      heading: "این محصول چه می‌کند",
      subheading: "یک محصول، یک گردش‌کار، از دادهٔ میدانی تا عملیات روزمره.",
      cards: [
        {
          title: "پردازش محلی",
          description:
            "تجمیع، حذف داده‌های تکراری و ارزیابی قواعد روی گیت‌وی انجام می‌شود، پس حلقه‌های کنترلی منتظر رفت و برگشت به ابر نمی‌مانند.",
          items: [
            "قواعد محلی در چند میلی‌ثانیه",
            "استنتاج هوش مصنوعی روی دستگاه",
            "کاهش حجم داده در لبه",
          ],
        },
        {
          title: "ذخیره و ارسال (Store & Forward)",
          description:
            "وقتی ارتباط شبکهٔ موبایل یا ماهواره قطع می‌شود، اندازه‌گیری‌ها به‌صورت محلی نگهداری و پس از بازگشت ارتباط به ترتیب ارسال می‌شوند.",
          items: [
            "بدون حفره در داده",
            "ارسال مجدد به ترتیب زمانی",
            "هم‌گام‌سازی متناسب با پهنای باند",
          ],
        },
        {
          title: "مدیریت از راه دور",
          description:
            "گیت‌وی‌ها از همان پنلی که دستگاه‌های پشت آن‌ها را مدیریت می‌کند فهرست، پایش و به‌روزرسانی می‌شوند، از جمله با به‌روزرسانی OTA.",
          items: [
            "پیکربندی از راه دور",
            "نمای سلامت و ارتباط",
            "OTA برای نرم‌افزار لبه",
          ],
        },
      ],
    },
    panel: {
      heading: "درون پلتفرم",
      description:
        "فهرست گیت‌وی‌ها: فرم‌ور، وضعیت ارتباط، پیام‌های نگه‌داشته‌شده و دستگاه‌های متصل به هر گیت‌وی.",
    },
    capabilities: {
      heading: "قابلیت‌های کلیدی",
      subheading: "با استقرار این محصول، چه چیزی در عملیات روزمره تغییر می‌کند.",
      cards: [
        {
          icon: "cpu",
          title: "Edge Runtime",
          description:
            "اجرای منطق کانتینری روی سخت‌افزار صنعتی، از گیت‌وی DIN-Rail تا سرور داخل سایت.",
        },
        {
          icon: "wifiOff",
          title: "عملکرد مستقل در حالت آفلاین",
          description: "هشدارها و قفل‌های ایمنی (Interlock) هنگام قطع ارتباط سایت، به‌صورت محلی اجرا می‌شوند.",
        },
        {
          icon: "gauge",
          title: "هزینهٔ پهنای باند کمتر",
          description: "روی ارتباط‌هایی که هزینهٔ حجمی دارند، به‌جای همهٔ داده‌های خام فقط خلاصه‌ها و رویدادها ارسال می‌شوند.",
        },
        {
          icon: "shieldCheck",
          title: "لبهٔ قابل اعتماد",
          description:
            "Image امضاشده، ذخیره‌سازی محلی رمزنگاری‌شده و mTLS در ارتباط با پلتفرم.",
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
        href: "/ddos-protection",
        title: "حفاظت در برابر DDoS",
        tagline: "حفظ دسترس‌پذیری Endpointها و APIهای IoT در برابر حملات حجمی.",
      },
      {
        href: "/features/ota-updates",
        title: "به‌روزرسانی OTA",
        tagline: "ارسال فرم‌ور به ناوگان پراکنده، بدون اعزام نیرو به محل.",
      },
      {
        href: "/intelligence-insight",
        title: "بینش هوشمند",
        tagline: "تبدیل تله‌متری خام به پیش‌بینی، ناهنجاری و تصمیم.",
      },
    ],
    cta: {
      heading: "پردازش را به سایت ببرید",
      description:
        "از سایت‌ها و وضعیت ارتباطی خود بگویید تا مشخص کنیم چه چیزی باید محلی اجرا شود و چه چیزی جایش در ابر است.",
      button: "درخواست دمو",
    },
  },

  ar: {
    hero: {
      badge: "منتج بابيلي",
      title: "الحوسبة الطرفية",
      description:
        "شغّل الفلترة والقواعد واستدلال الذكاء الاصطناعي بجوار الآلة. يواصل الموقع عمله عند انقطاع الوصلة، ولا يسافر إلى السحابة سوى البيانات التي تستحق الحفظ.",
      primary: "طلب عرض توضيحي",
      secondary: "تحدّث إلى المبيعات",
    },
    offer: {
      heading: "ما الذي يقدمه هذا المنتج",
      subheading: "منتج واحد وسير عمل واحد، من بيانات الميدان إلى العمليات اليومية.",
      cards: [
        {
          title: "معالجة محلية",
          description:
            "يتم التجميع وإزالة التكرار وتقييم القواعد على البوابة، فلا تنتظر حلقات التحكم رحلة ذهاب وعودة إلى السحابة.",
          items: [
            "قواعد محلية خلال أجزاء من الثانية",
            "استدلال الذكاء الاصطناعي على الجهاز",
            "تقليل حجم البيانات عند الحافة",
          ],
        },
        {
          title: "التخزين وإعادة الإرسال",
          description:
            "عند انقطاع الوصلات الخلوية أو الفضائية، تُخزَّن القياسات محليًا ثم تُرسَل بالترتيب فور عودة الاتصال.",
          items: [
            "لا فجوات في البيانات",
            "إعادة إرسال مرتّبة زمنيًا",
            "مزامنة تراعي النطاق المتاح",
          ],
        },
        {
          title: "إدارة عن بُعد",
          description:
            "تُدرَج البوابات وتُراقَب وتُحدَّث من اللوحة نفسها التي تدير الأجهزة خلفها، بما في ذلك تحديثات OTA.",
          items: [
            "تهيئة عن بُعد",
            "عرض الصحة والاتصال",
            "OTA لبرمجيات الحافة",
          ],
        },
      ],
    },
    panel: {
      heading: "داخل المنصة",
      description:
        "سجل البوابات: البرامج الثابتة وحالة الاتصال والرسائل المخزّنة والأجهزة المرتبطة بكل بوابة.",
    },
    capabilities: {
      heading: "القدرات الأساسية",
      subheading: "ما الذي يتغير في العمليات اليومية بعد تشغيل هذا المنتج.",
      cards: [
        {
          icon: "cpu",
          title: "بيئة تشغيل طرفية",
          description:
            "منطق يعمل في حاويات على عتاد صناعي، من بوابات السكة إلى خوادم داخل الموقع.",
        },
        {
          icon: "wifiOff",
          title: "استقلالية دون اتصال",
          description: "تستمر التنبيهات والتعشيقات محليًا أثناء انقطاع الموقع عن الشبكة.",
        },
        {
          icon: "gauge",
          title: "كلفة نطاق أقل",
          description: "أرسل ملخصات وأحداثًا بدل كل عينة خام على الوصلات المحدودة.",
        },
        {
          icon: "shieldCheck",
          title: "حافة موثوقة",
          description: "صور موقّعة وتخزين محلي مشفّر وTLS متبادل في العودة إلى المنصة.",
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
        href: "/ddos-protection",
        title: "الحماية من DDoS",
        tagline: "أبقِ نقاط إنترنت الأشياء وواجهات API متاحة تحت الهجمات الحجمية.",
      },
      {
        href: "/features/ota-updates",
        title: "تحديثات OTA",
        tagline: "أرسل البرامج الثابتة إلى الأساطيل الموزعة دون زيارة الموقع.",
      },
      {
        href: "/intelligence-insight",
        title: "رؤى ذكية",
        tagline: "حوّل القياسات الخام إلى تنبؤات وشذوذ وقرارات.",
      },
    ],
    cta: {
      heading: "انقل المعالجة إلى الموقع",
      description:
        "أخبرنا عن مواقعك وحالة الاتصال لديك ونحدد ما ينبغي تشغيله محليًا وما مكانه السحابة.",
      button: "طلب عرض توضيحي",
    },
  },
};
