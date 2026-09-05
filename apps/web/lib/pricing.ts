/* ------------------------------------------------------------------ */
/* Pricing copy, one block per locale.                                 */
/*                                                                    */
/* The page template lives in app/[lang]/pricing/page.tsx and reads    */
/* PRICING_COPY[language], the same way the feature and industry       */
/* landings read their configs. Prices are not converted at runtime:   */
/* each market is priced in its own currency, so the number and the    */
/* currency word are written together per locale.                     */
/*                                                                    */
/* Persian and Arabic copy is written in its own numerals.             */
/* ------------------------------------------------------------------ */

export type PricingTabKey = "subscription" | "payg" | "onpremise";

export type PlanKey = "free" | "growth" | "professional" | "enterprise";

export type Feature = { label: string; value?: string; disabled?: boolean };

export type Plan = {
  key: PlanKey;
  name: string;
  badge?: string;
  /** The figure alone, in the locale's numerals ("$20", "۲ میلیون", "٧٥"). */
  price: string;
  /** Currency and period, set small beside the figure ("تومان/ماهانه"). */
  pricePeriod?: string;
  billing: "monthly-yearly" | "only-monthly" | "none";
  description: string;
  cta: {
    label: string;
    variant: "primary" | "secondary";
    icon: "arrow" | "briefcase";
    /** "panel" opens the dashboard, "contact" the sales form. */
    action: "panel" | "contact";
  };
  features: Feature[];
};

export type PricingCopy = {
  hero: { title: string; subtitle: string };
  tabs: Record<PricingTabKey, string>;
  billing: { monthly: string; yearly: string; onlyMonthly: string };
  plans: Plan[];
  faq: { heading: string; items: { question: string; answer: string }[] };
};

export const PRICING_COPY: Record<string, PricingCopy> = {
  en: {
    hero: {
      title: "Simple, transparent pricing",
      subtitle:
        "We believe in a dynamic approach where continuous testing and audience engagement drive innovation, helping us refine ideas.",
    },
    tabs: {
      subscription: "Subscription",
      payg: "Pay-as-you-Go",
      onpremise: "On-Premise",
    },
    billing: { monthly: "Monthly", yearly: "Yearly", onlyMonthly: "Only monthly" },
    plans: [
      {
        key: "free",
        name: "Free",
        price: "$0",
        pricePeriod: "/month",
        billing: "none",
        description: "For personal projects and evaluation",
        cta: { label: "Try for free", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "Connected devices", value: "5" },
          { label: "Data retention", value: "7 days" },
          { label: "Dashboards", value: "2" },
          { label: "Team members", value: "1" },
          { label: "Alert rules", value: "5" },
          { label: "Messages", value: "100,000" },
          { label: "OTA updates", disabled: true },
          { label: "AI modules", disabled: true },
        ],
      },
      {
        key: "growth",
        name: "Growth",
        badge: "Most popular",
        price: "$20",
        pricePeriod: "/month",
        billing: "monthly-yearly",
        description: "For small teams getting started with AIoT",
        cta: { label: "Get started", variant: "primary", icon: "arrow", action: "panel" },
        features: [
          { label: "Connected devices", value: "50" },
          { label: "Data retention", value: "30 days" },
          { label: "Dashboards", value: "10" },
          { label: "Team members", value: "5" },
          { label: "Alert rules", value: "50" },
          { label: "Messages", value: "2,000,000" },
          { label: "OTA updates", value: "Available" },
          { label: "AI modules", value: "Basic" },
        ],
      },
      {
        key: "professional",
        name: "Professional",
        price: "$100",
        pricePeriod: "/month",
        billing: "monthly-yearly",
        description: "For strategic scaling industrial operations",
        cta: { label: "Get started", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "Connected devices", value: "500" },
          { label: "Data retention", value: "1 year" },
          { label: "Dashboards", value: "Unlimited" },
          { label: "Team members", value: "25" },
          { label: "Alert rules", value: "Unlimited" },
          { label: "Messages", value: "25,000,000" },
          { label: "OTA updates", value: "Available" },
          { label: "AI modules", value: "Advanced" },
        ],
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "Custom",
        billing: "only-monthly",
        description: "For large-scale, mission-critical deployments",
        cta: { label: "Contact sales", variant: "secondary", icon: "briefcase", action: "contact" },
        features: [
          { label: "Connected devices", value: "Unlimited" },
          { label: "Data retention", value: "Custom" },
          { label: "Dashboards", value: "Unlimited" },
          { label: "Team members", value: "Unlimited" },
          { label: "Alert rules", value: "Unlimited" },
          { label: "Messages", value: "Custom" },
          { label: "OTA updates", value: "Available" },
          { label: "AI modules", value: "Advanced" },
        ],
      },
    ],
    faq: {
      heading: "Pricing FAQs",
      items: [
        {
          question: "Which plan is right for my organization?",
          answer:
            "Free is ideal for evaluation, Growth fits small teams starting with AIoT, and Professional supports scaling industrial operations. For mission-critical deployments, talk to us about Enterprise.",
        },
        {
          question: "Can I upgrade my plan as my deployment grows?",
          answer:
            "Yes. You can upgrade at any time and your devices, dashboards, and data carry over seamlessly. Changes take effect immediately and billing is prorated.",
        },
        {
          question: "Do you offer on-premise deployment?",
          answer:
            "Yes. Enterprise customers can deploy Paapeli on-premise, in private cloud environments, or in a hybrid architecture.",
        },
        {
          question: "What happens if I exceed my device limit?",
          answer:
            "Your devices keep running. We will notify you when you approach your limit so you can upgrade to a plan that fits your deployment.",
        },
        {
          question: "Do you offer a free trial?",
          answer:
            "Yes. The Free plan lets you evaluate Paapeli with up to 5 connected devices, no credit card required.",
        },
      ],
    },
  },

  fa: {
    hero: {
      title: "قیمت‌گذاری ساده و شفاف",
      subtitle:
        "ما به رویکردی پویا باور داریم؛ آزمون پیوسته و هم‌راهی با کاربران است که نوآوری را پیش می‌برد و ایده‌ها را پخته‌تر می‌کند.",
    },
    tabs: {
      subscription: "اشتراک",
      payg: "پرداخت به‌اندازهٔ مصرف",
      onpremise: "استقرار روی زیرساخت شما",
    },
    billing: { monthly: "ماهانه", yearly: "سالانه", onlyMonthly: "فقط ماهانه" },
    plans: [
      {
        key: "free",
        name: "رایگان",
        price: "۰",
        pricePeriod: "تومان/ماهانه",
        billing: "none",
        description: "برای پروژه‌های شخصی و ارزیابی اولیه",
        cta: { label: "رایگان امتحان کنید", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "دستگاه متصل", value: "۵" },
          { label: "نگهداری داده", value: "۷ روز" },
          { label: "داشبورد", value: "۲" },
          { label: "اعضای تیم", value: "۱" },
          { label: "قواعد هشدار", value: "۵" },
          { label: "پیام", value: "۱۰۰٬۰۰۰" },
          { label: "به‌روزرسانی OTA", disabled: true },
          { label: "ماژول‌های هوش مصنوعی", disabled: true },
        ],
      },
      {
        key: "growth",
        name: "رشد",
        badge: "محبوب‌ترین",
        price: "۲ میلیون",
        pricePeriod: "تومان/ماهانه",
        billing: "monthly-yearly",
        description: "برای تیم‌های کوچکی که با AIoT شروع می‌کنند",
        cta: { label: "شروع کنید", variant: "primary", icon: "arrow", action: "panel" },
        features: [
          { label: "دستگاه متصل", value: "۵۰" },
          { label: "نگهداری داده", value: "۳۰ روز" },
          { label: "داشبورد", value: "۱۰" },
          { label: "اعضای تیم", value: "۵" },
          { label: "قواعد هشدار", value: "۵۰" },
          { label: "پیام", value: "۲٬۰۰۰٬۰۰۰" },
          { label: "به‌روزرسانی OTA", value: "فعال" },
          { label: "ماژول‌های هوش مصنوعی", value: "پایه" },
        ],
      },
      {
        key: "professional",
        name: "حرفه‌ای",
        price: "۸ میلیون",
        pricePeriod: "تومان/ماهانه",
        billing: "monthly-yearly",
        description: "برای گسترش راهبردی عملیات صنعتی",
        cta: { label: "شروع کنید", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "دستگاه متصل", value: "۵۰۰" },
          { label: "نگهداری داده", value: "۱ سال" },
          { label: "داشبورد", value: "نامحدود" },
          { label: "اعضای تیم", value: "۲۵" },
          { label: "قواعد هشدار", value: "نامحدود" },
          { label: "پیام", value: "۲۵٬۰۰۰٬۰۰۰" },
          { label: "به‌روزرسانی OTA", value: "فعال" },
          { label: "ماژول‌های هوش مصنوعی", value: "پیشرفته" },
        ],
      },
      {
        key: "enterprise",
        name: "سازمانی",
        price: "توافقی",
        billing: "only-monthly",
        description: "برای استقرارهای بزرگ‌مقیاس و حیاتی",
        cta: { label: "تماس با فروش", variant: "secondary", icon: "briefcase", action: "contact" },
        features: [
          { label: "دستگاه متصل", value: "نامحدود" },
          { label: "نگهداری داده", value: "سفارشی" },
          { label: "داشبورد", value: "نامحدود" },
          { label: "اعضای تیم", value: "نامحدود" },
          { label: "قواعد هشدار", value: "نامحدود" },
          { label: "پیام", value: "سفارشی" },
          { label: "به‌روزرسانی OTA", value: "فعال" },
          { label: "ماژول‌های هوش مصنوعی", value: "پیشرفته" },
        ],
      },
    ],
    faq: {
      heading: "پرسش‌های متداول دربارهٔ تعرفه‌ها",
      items: [
        {
          question: "کدام پلن برای سازمان من مناسب است؟",
          answer:
            "پلن رایگان برای ارزیابی مناسب است، رشد برای تیم‌های کوچکی که تازه با AIoT شروع می‌کنند و حرفه‌ای برای گسترش عملیات صنعتی. برای استقرارهای حیاتی دربارهٔ پلن سازمانی با ما صحبت کنید.",
        },
        {
          question: "با بزرگ‌تر شدن استقرار می‌توانم پلن را ارتقا دهم؟",
          answer:
            "بله. هر زمان می‌توانید ارتقا دهید و دستگاه‌ها، داشبوردها و داده‌های شما بدون وقفه منتقل می‌شوند. تغییر بی‌درنگ اعمال می‌شود و صورت‌حساب به‌نسبت روزهای باقی‌مانده محاسبه می‌شود.",
        },
        {
          question: "امکان استقرار روی زیرساخت خودمان وجود دارد؟",
          answer:
            "بله. مشتریان سازمانی می‌توانند پاپلی را روی زیرساخت خود، در ابر خصوصی یا در معماری ترکیبی مستقر کنند.",
        },
        {
          question: "اگر از سقف دستگاه‌ها عبور کنم چه می‌شود؟",
          answer:
            "دستگاه‌های شما به کار خود ادامه می‌دهند. پیش از رسیدن به سقف به شما اطلاع می‌دهیم تا به پلنی متناسب با استقرارتان ارتقا دهید.",
        },
        {
          question: "دورهٔ آزمایشی رایگان دارید؟",
          answer:
            "بله. پلن رایگان به شما امکان می‌دهد پاپلی را با تا ۵ دستگاه متصل و بدون نیاز به کارت بانکی ارزیابی کنید.",
        },
      ],
    },
  },

  ar: {
    hero: {
      title: "أسعار بسيطة وشفافة",
      subtitle:
        "نؤمن بنهج ديناميكي يقوم على الاختبار المستمر والتفاعل مع الجمهور، فهو ما يدفع الابتكار ويصقل الأفكار.",
    },
    tabs: {
      subscription: "اشتراك",
      payg: "الدفع حسب الاستخدام",
      onpremise: "التثبيت على بنيتك",
    },
    billing: { monthly: "شهري", yearly: "سنوي", onlyMonthly: "شهري فقط" },
    plans: [
      {
        key: "free",
        name: "مجاني",
        price: "٠",
        pricePeriod: "ر.ق/شهرياً",
        billing: "none",
        description: "للمشاريع الشخصية والتجربة",
        cta: { label: "جرّب مجاناً", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "الأجهزة المتصلة", value: "٥" },
          { label: "الاحتفاظ بالبيانات", value: "٧ أيام" },
          { label: "لوحات المعلومات", value: "٢" },
          { label: "أعضاء الفريق", value: "١" },
          { label: "قواعد التنبيه", value: "٥" },
          { label: "الرسائل", value: "١٠٠٬٠٠٠" },
          { label: "تحديثات OTA", disabled: true },
          { label: "وحدات الذكاء الاصطناعي", disabled: true },
        ],
      },
      {
        key: "growth",
        name: "النمو",
        badge: "الأكثر شيوعاً",
        price: "٧٥",
        pricePeriod: "ر.ق/شهرياً",
        billing: "monthly-yearly",
        description: "للفرق الصغيرة التي تبدأ مع AIoT",
        cta: { label: "ابدأ الآن", variant: "primary", icon: "arrow", action: "panel" },
        features: [
          { label: "الأجهزة المتصلة", value: "٥٠" },
          { label: "الاحتفاظ بالبيانات", value: "٣٠ يوماً" },
          { label: "لوحات المعلومات", value: "١٠" },
          { label: "أعضاء الفريق", value: "٥" },
          { label: "قواعد التنبيه", value: "٥٠" },
          { label: "الرسائل", value: "٢٬٠٠٠٬٠٠٠" },
          { label: "تحديثات OTA", value: "متاحة" },
          { label: "وحدات الذكاء الاصطناعي", value: "أساسية" },
        ],
      },
      {
        key: "professional",
        name: "احترافي",
        price: "٣٦٥",
        pricePeriod: "ر.ق/شهرياً",
        billing: "monthly-yearly",
        description: "للتوسّع الاستراتيجي في العمليات الصناعية",
        cta: { label: "ابدأ الآن", variant: "secondary", icon: "arrow", action: "panel" },
        features: [
          { label: "الأجهزة المتصلة", value: "٥٠٠" },
          { label: "الاحتفاظ بالبيانات", value: "سنة واحدة" },
          { label: "لوحات المعلومات", value: "غير محدودة" },
          { label: "أعضاء الفريق", value: "٢٥" },
          { label: "قواعد التنبيه", value: "غير محدودة" },
          { label: "الرسائل", value: "٢٥٬٠٠٠٬٠٠٠" },
          { label: "تحديثات OTA", value: "متاحة" },
          { label: "وحدات الذكاء الاصطناعي", value: "متقدمة" },
        ],
      },
      {
        key: "enterprise",
        name: "مؤسسي",
        price: "حسب الطلب",
        billing: "only-monthly",
        description: "لعمليات النشر واسعة النطاق وبالغة الأهمية",
        cta: { label: "تواصل مع المبيعات", variant: "secondary", icon: "briefcase", action: "contact" },
        features: [
          { label: "الأجهزة المتصلة", value: "غير محدودة" },
          { label: "الاحتفاظ بالبيانات", value: "حسب الطلب" },
          { label: "لوحات المعلومات", value: "غير محدودة" },
          { label: "أعضاء الفريق", value: "غير محدودة" },
          { label: "قواعد التنبيه", value: "غير محدودة" },
          { label: "الرسائل", value: "حسب الطلب" },
          { label: "تحديثات OTA", value: "متاحة" },
          { label: "وحدات الذكاء الاصطناعي", value: "متقدمة" },
        ],
      },
    ],
    faq: {
      heading: "أسئلة شائعة حول الأسعار",
      items: [
        {
          question: "أي خطة تناسب مؤسستي؟",
          answer:
            "الخطة المجانية مثالية للتجربة، وخطة النمو تناسب الفرق الصغيرة التي تبدأ مع AIoT، والخطة الاحترافية تدعم توسّع العمليات الصناعية. أما عمليات النشر بالغة الأهمية فتحدّث إلينا عن الخطة المؤسسية.",
        },
        {
          question: "هل يمكنني ترقية خطتي مع نمو النشر لديّ؟",
          answer:
            "نعم. يمكنك الترقية في أي وقت، وتنتقل أجهزتك ولوحاتك وبياناتك دون انقطاع. يسري التغيير فوراً وتُحتسب الفوترة بالتناسب.",
        },
        {
          question: "هل توفّرون التثبيت على البنية المحلية؟",
          answer:
            "نعم. يمكن لعملاء الخطة المؤسسية تشغيل بابيلي على بنيتهم الخاصة، أو في سحابة خاصة، أو ضمن بنية هجينة.",
        },
        {
          question: "ماذا يحدث إذا تجاوزت حد الأجهزة؟",
          answer:
            "تستمر أجهزتك في العمل. سننبّهك عند اقترابك من الحد لتتمكّن من الترقية إلى خطة تناسب النشر لديك.",
        },
        {
          question: "هل تقدّمون تجربة مجانية؟",
          answer:
            "نعم. تتيح لك الخطة المجانية تقييم بابيلي بما يصل إلى ٥ أجهزة متصلة، دون الحاجة إلى بطاقة ائتمان.",
        },
      ],
    },
  },
};
