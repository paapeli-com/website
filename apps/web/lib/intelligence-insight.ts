import type { FeatureSlug } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* Copy for the Intelligence & Insight page, one block per locale.     */
/*                                                                    */
/* Same shape as lib/aiot-platform.ts, lib/ddos-protection.ts and      */
/* lib/edge-computing.ts. This is the last of the four products to     */
/* move onto the shared design, so the set now reads as one family and */
/* a change to one has an obvious counterpart in the other three.      */
/* ------------------------------------------------------------------ */

export type CapabilityIcon = "brain" | "alert" | "trending" | "chart";

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

export type InsightCopy = {
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
  "anomaly-detection",
  "predictive-analytics",
  "realtime-monitoring",
  "solution-templates",
];

export const INSIGHT_COPY: Record<string, InsightCopy> = {
  en: {
    hero: {
      badge: "Paapeli product",
      title: "Intelligence & Insight",
      description:
        "Turn raw telemetry into forecasts, anomaly signals and clear operational decisions, so teams act on what is about to happen rather than only on what already did.",
      primary: "Request a demo",
      secondary: "Talk to Sales",
    },
    offer: {
      heading: "What this product does",
      subheading: "One product, one workflow, from field data to daily operations.",
      cards: [
        {
          title: "Anomaly detection",
          description:
            "Models learn each asset's normal behaviour, then flag drift and irregular patterns that fixed thresholds never catch.",
          items: ["Per-asset baselines", "Drift and pattern alerts", "Fewer false alarms"],
        },
        {
          title: "Forecasting",
          description:
            "Short-horizon forecasts for consumption, load and sensor trends, with confidence bands operators can plan around.",
          items: [
            "Consumption and load forecasts",
            "Confidence bands",
            "Remaining-useful-life signals",
          ],
        },
        {
          title: "From insight to work",
          description:
            "Every signal can open a work order with the equipment and location filled in and a checklist to follow, so insight ends in a task rather than a chart.",
          items: ["Work orders with checklists", "AI summaries for shifts", "Exportable reports"],
        },
      ],
    },
    panel: {
      heading: "Inside the platform",
      description:
        "Forecasts, anomaly scores and AI summaries next to the live values they were derived from.",
    },
    capabilities: {
      heading: "Key capabilities",
      subheading: "What changes in daily operations once this product is in place.",
      cards: [
        {
          icon: "brain",
          title: "Models on your data",
          description:
            "Baselines are trained per asset and location, not on a generic industry average.",
        },
        {
          icon: "alert",
          title: "Early warning",
          description: "Degradation is surfaced days before a threshold breach or unplanned stop.",
        },
        {
          icon: "trending",
          title: "Planning-grade forecasts",
          description:
            "Load, consumption and capacity outlooks feed maintenance and energy planning.",
        },
        {
          icon: "chart",
          title: "Executive reporting",
          description: "KPI dashboards and periodic reports for management, HSE and asset owners.",
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
        href: "/ddos-protection",
        title: "DDoS Protection",
        tagline: "Keep IoT endpoints and APIs reachable under volumetric attack.",
      },
    ],
    cta: {
      heading: "Put your telemetry to work",
      description:
        "Bring a sample of your historical data and we will show you what the models surface on it.",
      button: "Request a demo",
    },
  },

  fa: {
    hero: {
      badge: "محصول پاپلی",
      title: "بینش هوشمند",
      description:
        "تله‌متری خام را به پیش‌بینی، نشانهٔ ناهنجاری و تصمیم عملیاتی روشن تبدیل می‌کند، تا تیم‌ها به‌جای واکنش به آنچه رخ داده، برای آنچه در راه است اقدام کنند.",
      primary: "درخواست دمو",
      secondary: "تماس با فروش",
    },
    offer: {
      heading: "این محصول چه می‌کند",
      subheading: "یک محصول، یک گردش‌کار، از دادهٔ میدانی تا عملیات روزمره.",
      cards: [
        {
          title: "تشخیص ناهنجاری",
          description:
            "مدل‌ها رفتار عادی هر دارایی را یاد می‌گیرند و بعد رانش و الگوهای نامنظمی را نشان می‌دهند که آستانه‌های ثابت هرگز نمی‌گیرند.",
          items: [
            "خط پایه به تفکیک هر دارایی",
            "هشدار رانش و الگو",
            "هشدار اشتباه کمتر",
          ],
        },
        {
          title: "پیش‌بینی",
          description:
            "پیش‌بینی کوتاه‌مدت برای مصرف، بار و روند سنسورها، همراه با بازهٔ اطمینانی که اپراتور می‌تواند بر پایهٔ آن برنامه بریزد.",
          items: [
            "پیش‌بینی مصرف و بار",
            "بازهٔ اطمینان",
            "نشانهٔ عمر باقی‌ماندهٔ تجهیز",
          ],
        },
        {
          title: "از بینش تا کار",
          description:
            "هر نشانه می‌تواند یک دستور کار باز کند که تجهیز و موقعیتش پر شده و چک‌لیست کار را دارد؛ پس بینش به یک وظیفه ختم می‌شود، نه به یک نمودار.",
          items: [
            "دستور کار با چک‌لیست",
            "خلاصهٔ هوش مصنوعی برای هر شیفت",
            "گزارش قابل خروجی‌گرفتن",
          ],
        },
      ],
    },
    panel: {
      heading: "درون پلتفرم",
      description:
        "پیش‌بینی‌ها، امتیاز ناهنجاری و خلاصه‌های هوش مصنوعی، کنار همان مقادیر زنده‌ای که از آن‌ها به دست آمده‌اند.",
    },
    capabilities: {
      heading: "قابلیت‌های کلیدی",
      subheading: "با استقرار این محصول، چه چیزی در عملیات روزمره تغییر می‌کند.",
      cards: [
        {
          icon: "brain",
          title: "مدل روی دادهٔ خود شما",
          description:
            "خط پایه برای هر دارایی و هر موقعیت آموزش می‌بیند، نه بر مبنای میانگین عمومی صنعت.",
        },
        {
          icon: "alert",
          title: "هشدار زودهنگام",
          description: "افت عملکرد، روزها پیش از عبور از آستانه یا توقف ناخواسته آشکار می‌شود.",
        },
        {
          icon: "trending",
          title: "پیش‌بینی در حد برنامه‌ریزی",
          description: "چشم‌انداز بار، مصرف و ظرفیت، خوراک برنامهٔ نگهداری و انرژی می‌شود.",
        },
        {
          icon: "chart",
          title: "گزارش مدیریتی",
          description: "داشبورد شاخص‌ها و گزارش دوره‌ای برای مدیریت، HSE و مالک دارایی.",
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
        tagline: "ارسال فرم‌ور به ناوگان پراکنده، بدون اعزام نیرو به محل.",
      },
      {
        href: "/ddos-protection",
        title: "حفاظت در برابر DDoS",
        tagline: "نگه‌داشتن نقاط پایانی IoT و APIها در دسترس، زیر حملهٔ حجمی.",
      },
    ],
    cta: {
      heading: "دادهٔ خود را به کار بگیرید",
      description:
        "نمونه‌ای از دادهٔ تاریخی خود را بیاورید تا نشان دهیم مدل‌ها چه چیزی از آن بیرون می‌کشند.",
      button: "درخواست دمو",
    },
  },

  ar: {
    hero: {
      badge: "منتج بابيلي",
      title: "رؤى ذكية",
      description:
        "حوّل بيانات القياس الخام إلى تنبؤات وإشارات شذوذ وقرارات تشغيلية واضحة، لتتحرك الفرق نحو ما هو على وشك الحدوث لا نحو ما حدث بالفعل فقط.",
      primary: "طلب عرض توضيحي",
      secondary: "تحدّث إلى المبيعات",
    },
    offer: {
      heading: "ما الذي يقدمه هذا المنتج",
      subheading: "منتج واحد وسير عمل واحد، من بيانات الميدان إلى العمليات اليومية.",
      cards: [
        {
          title: "كشف الشذوذ",
          description:
            "تتعلم النماذج السلوك الطبيعي لكل أصل، ثم تُبرز الانحراف والأنماط غير المنتظمة التي لا تلتقطها العتبات الثابتة.",
          items: [
            "خط أساس لكل أصل",
            "تنبيهات الانحراف والأنماط",
            "إنذارات كاذبة أقل",
          ],
        },
        {
          title: "التنبؤ",
          description:
            "تنبؤات قصيرة المدى للاستهلاك والحمل واتجاهات الحساسات، مع نطاقات ثقة يمكن للمشغّل التخطيط على أساسها.",
          items: [
            "تنبؤات الاستهلاك والحمل",
            "نطاقات الثقة",
            "مؤشرات العمر المتبقي للمعدة",
          ],
        },
        {
          title: "من الرؤية إلى العمل",
          description:
            "كل إشارة يمكن أن تفتح أمر عمل فيه المعدّة والموقع وقائمة مهام للتنفيذ، فتنتهي الرؤية بمهمة لا برسم بياني.",
          items: [
            "أوامر عمل بقوائم مهام",
            "ملخصات ذكاء اصطناعي لكل وردية",
            "تقارير قابلة للتصدير",
          ],
        },
      ],
    },
    panel: {
      heading: "داخل المنصة",
      description:
        "التنبؤات ودرجات الشذوذ وملخصات الذكاء الاصطناعي بجوار القيم الحية التي اشتُقت منها.",
    },
    capabilities: {
      heading: "القدرات الأساسية",
      subheading: "ما الذي يتغير في العمليات اليومية بعد تشغيل هذا المنتج.",
      cards: [
        {
          icon: "brain",
          title: "نماذج على بياناتك أنت",
          description:
            "تُدرَّب خطوط الأساس لكل أصل ولكل موقع، لا على متوسط عام للقطاع.",
        },
        {
          icon: "alert",
          title: "إنذار مبكر",
          description: "يظهر التدهور قبل أيام من تجاوز العتبة أو التوقف غير المخطط له.",
        },
        {
          icon: "trending",
          title: "تنبؤات صالحة للتخطيط",
          description: "تغذّي توقعات الحمل والاستهلاك والسعة خطط الصيانة والطاقة.",
        },
        {
          icon: "chart",
          title: "تقارير للإدارة",
          description: "لوحات مؤشرات وتقارير دورية للإدارة والسلامة ومالكي الأصول.",
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
        tagline: "عالج البيانات بجوار الآلة، بزمن استجابة أقل وكلفة نطاق أقل.",
      },
      {
        href: "/features/ota-updates",
        title: "تحديثات OTA",
        tagline: "أرسل البرامج الثابتة إلى الأساطيل الموزعة دون زيارة الموقع.",
      },
      {
        href: "/ddos-protection",
        title: "الحماية من DDoS",
        tagline: "أبقِ نقاط إنترنت الأشياء وواجهات API متاحة تحت الهجمات الحجمية.",
      },
    ],
    cta: {
      heading: "شغّل بياناتك",
      description:
        "أحضر عينة من بياناتك التاريخية ونعرض لك ما تستخرجه النماذج منها.",
      button: "طلب عرض توضيحي",
    },
  },
};
