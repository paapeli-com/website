import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-predictive-1.jpg";
import img2 from "@/src/assets/f-predictive-2.jpg";
import img3 from "@/src/assets/f-predictive-3.jpg";
import hero from "@/src/assets/f-predictive-hero.jpg";
import panel from "@/src/assets/2-1-panel.jpg";

export const predictiveAnalyticsConfig: FeatureConfig = {
  slug: "predictive-analytics",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["smart-manufacturing", "oil-gas", "energy-monitoring", "fleet-tracking"],
  related: ["anomaly-detection", "realtime-monitoring", "alerts-events", "solution-templates"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Predictive analytics & failure forecasting",
        description:
          "Analyze trends and forecast equipment failures so maintenance is planned around risk and reliability, not around the calendar.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "Failure forecast per asset",
            description:
              "Assets are listed by predicted time to failure, with the driving signal and the estimated operational impact.",
            items: ["Remaining useful life estimate", "Root cause and impact", "7, 30 and 90-day horizons"],
          },
          {
            title: "Trend analysis and saving opportunities",
            description:
              "The platform surfaces where consumption or efficiency is drifting and quantifies the opportunity behind it.",
            items: ["Baseline versus current period", "Quantified saving per opportunity", "Per-location comparison"],
          },
          {
            title: "One picture for management",
            description:
              "Predictions roll up into availability, health and risk KPIs that a plant or portfolio owner can read in a minute.",
            items: ["Asset health distribution", "Availability and risk KPIs", "AI recommendations feed"],
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
            icon: "calendar",
            title: "Plan maintenance by risk",
            description: "Forecast horizons of 7, 30 and 90 days let planners group work into the right shutdown window.",
          },
          {
            icon: "chart",
            title: "Trends with an owner",
            description:
              "Consumption, efficiency and load trends come with the asset and location they belong to, not as loose charts.",
          },
          {
            icon: "wrench",
            title: "Recommendations you can act on",
            description: "Each opportunity states the expected saving and the action, so it can be approved or rejected on the spot.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Move from reactive to planned maintenance",
        description:
          "We can run your historical data through the models and review the forecast quality with your reliability team.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "تحلیل پیش‌بین و پیش‌بینی خرابی",
        description:
          "روندها را تحلیل و خرابی تجهیزات را پیش‌بینی کنید تا نگهداری بر پایهٔ ریسک و قابلیت اطمینان برنامه‌ریزی شود، نه بر پایهٔ تقویم.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "پیش‌بینی خرابی برای هر دارایی",
            description:
              "دارایی‌ها بر پایهٔ زمان تخمینی تا خرابی فهرست می‌شوند، همراه با سیگنال محرک و اثر عملیاتی برآوردی.",
            items: ["برآورد عمر مفید باقی‌مانده", "ریشه و اثر", "افق ۷، ۳۰ و ۹۰ روزه"],
          },
          {
            title: "تحلیل روند و فرصت‌های صرفه‌جویی",
            description:
              "پلتفرم نشان می‌دهد مصرف یا بازدهی کجا در حال انحراف است و فرصت پشت آن را کمّی می‌کند.",
            items: ["مقایسهٔ مبنا با دورهٔ جاری", "صرفه‌جویی کمّی برای هر فرصت", "مقایسه به تفکیک مکان"],
          },
          {
            title: "یک تصویر برای مدیریت",
            description:
              "پیش‌بینی‌ها در شاخص‌های دسترس‌پذیری، سلامت و ریسک تجمیع می‌شوند و در یک دقیقه قابل خواندن هستند برای مدیر کارخانه یا پرتفوی.",
            items: ["توزیع سلامت دارایی‌ها", "شاخص‌های دسترس‌پذیری و ریسک", "جریان توصیه‌های هوش مصنوعی"],
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
            icon: "calendar",
            title: "برنامه‌ریزی نگهداری بر پایهٔ ریسک",
            description: "افق‌های پیش‌بینی ۷، ۳۰ و ۹۰ روزه به برنامه‌ریز اجازه می‌دهد کارها را در زمان توقف مناسب گروه‌بندی کند.",
          },
          {
            icon: "chart",
            title: "روندهای وابسته به دارایی و مکان",
            description:
              "روند مصرف، بازدهی و بار همراه دارایی و مکان خود می‌آید، نه به‌شکل نمودارهای پراکنده.",
          },
          {
            icon: "wrench",
            title: "توصیه‌هایی که قابل اجرا هستند",
            description: "هر فرصت، صرفه‌جویی انتظاری و اقدام لازم را بیان می‌کند تا همان‌جا تأیید یا رد شود.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "از نگهداری واکنشی به نگهداری برنامه‌ریزی‌شده",
        description:
          "می‌توانیم دادهٔ تاریخی شما را از مدل‌ها بگذرانیم و کیفیت پیش‌بینی را با تیم قابلیت اطمینان شما بازبینی کنیم.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "التحليلات التنبؤية والتنبؤ بالأعطال",
        description:
          "حلّل الاتجاهات وتنبّأ بأعطال المعدات لتُخطَّط الصيانة حسب المخاطر والموثوقية لا حسب التقويم.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "تنبؤ بالعطل لكل أصل",
            description:
              "تُدرج الأصول حسب الزمن المتوقع للعطل، مع الإشارة المحرّكة والأثر التشغيلي المقدّر.",
            items: ["تقدير العمر المتبقي", "السبب والأثر", "آفاق 7 و30 و90 يومًا"],
          },
          {
            title: "تحليل الاتجاهات وفرص التوفير",
            description: "تُظهر المنصة أين ينحرف الاستهلاك أو الكفاءة وتقيس الفرصة خلفه.",
            items: ["خط الأساس مقابل الفترة الحالية", "توفير مقدّر لكل فرصة", "مقارنة لكل موقع"],
          },
          {
            title: "صورة واحدة للإدارة",
            description:
              "تتجمع التنبؤات في مؤشرات الجهوزية والصحة والمخاطر التي يقرأها مدير المصنع أو المحفظة في دقيقة.",
            items: ["توزيع صحة الأصول", "مؤشرات الجهوزية والمخاطر", "تدفق توصيات الذكاء الاصطناعي"],
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
            icon: "calendar",
            title: "خطّط الصيانة حسب المخاطر",
            description: "آفاق التنبؤ 7 و30 و90 يومًا تتيح تجميع الأعمال في نافذة التوقف المناسبة.",
          },
          {
            icon: "chart",
            title: "اتجاهات لها مالك",
            description: "اتجاهات الاستهلاك والكفاءة والحمل تأتي مع الأصل والموقع التابعة له، لا كرسوم متفرقة.",
          },
          {
            icon: "wrench",
            title: "توصيات قابلة للتنفيذ",
            description: "كل فرصة تذكر التوفير المتوقع والإجراء المطلوب ليُعتمد أو يُرفض فورًا.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "انتقل من الصيانة التفاعلية إلى المخططة",
        description: "يمكننا تمرير بياناتك التاريخية عبر النماذج ومراجعة جودة التنبؤ مع فريق الموثوقية لديك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
