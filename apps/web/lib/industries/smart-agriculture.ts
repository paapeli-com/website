import type { IndustryConfig } from "@/components/industry/types";

import greenhouse from "@/src/assets/agri-greenhouse.jpg";
import hero from "@/src/assets/agri-hero.jpg";
import irrigation from "@/src/assets/agri-irrigation.jpg";
import sensor from "@/src/assets/agri-sensor.jpg";

export const smartAgricultureConfig: IndustryConfig = {
  hero,
  images: [sensor, irrigation, greenhouse],
  whyOrder: [0, 1, 2],

  copy: {
    en: {
      hero: {
        title: "AIoT technology for smart agriculture",
        description:
          "Paapeli is an AIoT technology provider. Growers and the irrigation companies, agritech firms and contractors serving them can all use our cloud infrastructure, edge computing and IoT to save water and raise yield.",
        primary: "Request Demo",
        secondary: "Talk to Sales",
      },
      offer: {
        heading: "What Paapeli delivers for agriculture",
        subheading:
          "A field-proven AIoT stack that farms and agritech contractors can deploy directly or white-label for their own customers.",
        cards: [
          {
            title: "Soil, crop and weather monitoring",
            description: "Solar-powered field nodes report moisture, salinity and micro-climate over long-range radio.",
            items: ["Multi-depth soil moisture", "LoRaWAN and cellular", "Years of battery life"],
          },
          {
            title: "Irrigation and pump control",
            description: "Schedule and verify irrigation from real soil data instead of fixed cycles.",
            items: ["Pump run-time and flow", "Dry-run and pressure alarms", "Water use per hectare"],
          },
          {
            title: "Greenhouse climate and AI advice",
            description: "Models learn each crop cycle and flag stress, disease risk and equipment faults early.",
            items: ["Anomaly detection", "Disease-risk alerts", "Yield forecasting"],
          },
        ],
      },
      impact: {
        heading: "Impact of AIoT on the farm",
        stats: [
          { icon: "water", label: "Reduces water consumption", prefix: "up to", value: "30%" },
          { icon: "growth", label: "Increases crop yield", prefix: "by", value: "10-20%" },
          { icon: "money", label: "Cuts pumping energy cost", prefix: "by", value: "15-25%" },
        ],
        roiHeading: "Approximate ROI from precision irrigation",
        roiValue: "170% ROI",
        roiCaption: "Within the first two growing seasons",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "Built for remote, low-power sites",
            description:
              "Fields have weak coverage and no mains power. Our devices buffer offline, sync later and run for years on solar.",
            items: ["Offline store and forward", "Solar and battery operation", "Fleet-wide OTA updates"],
          },
          {
            title: "Technology contractors can resell",
            description:
              "Irrigation and agritech companies deliver Paapeli-powered monitoring under their own brand and support contracts.",
            items: ["White-label ready", "Multi-farm tenancy", "No conflict of interest"],
          },
          {
            title: "A flexible commercial model",
            description: "Pay per device or per hectare on our cloud, and scale project by project as you win new farms.",
            items: ["Per-device pricing", "Seasonal scaling", "Project-based rollout"],
          },
        ],
      },
      cta: {
        heading: "Power your agriculture services with Paapeli",
        description:
          "Whether you farm the land or deliver irrigation and agritech projects to those who do, our AIoT platform is ready to scale with you.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای کشاورزی هوشمند",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. کشاورزان و همچنین شرکت‌های آبیاری، اگری‌تک‌ها و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای صرفه‌جویی آب و افزایش عملکرد محصول استفاده کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای کشاورزی ارائه می‌دهد",
        subheading:
          "یک پشتهٔ AIoT آزموده در مزرعه که مزارع و پیمانکاران اگری‌تک می‌توانند مستقیماً مستقر کنند یا با برند خود به مشتریانشان ارائه دهند.",
        cards: [
          {
            title: "پایش خاک، محصول و هوا",
            description: "گره‌های خورشیدی مزرعه، رطوبت، شوری و ریزاقلیم را از طریق رادیوی برد بلند گزارش می‌دهند.",
            items: ["رطوبت خاک در چند عمق", "LoRaWAN و سلولی", "چند سال عمر باتری"],
          },
          {
            title: "کنترل آبیاری و پمپ",
            description: "آبیاری را بر پایهٔ دادهٔ واقعی خاک برنامه‌ریزی و راستی‌آزمایی کنید، نه چرخه‌های ثابت.",
            items: ["زمان کارکرد و دبی پمپ", "هشدار کارکرد خشک و افت فشار", "مصرف آب به ازای هکتار"],
          },
          {
            title: "اقلیم گلخانه و توصیهٔ هوش مصنوعی",
            description: "مدل‌ها هر دورهٔ کشت را یاد می‌گیرند و تنش، خطر بیماری و خرابی تجهیزات را زودتر اعلام می‌کنند.",
            items: ["تشخیص ناهنجاری", "هشدار خطر بیماری", "پیش‌بینی عملکرد محصول"],
          },
        ],
      },
      impact: {
        heading: "اثر AIoT در مزرعه",
        stats: [
          { icon: "water", label: "کاهش مصرف آب", prefix: "تا", value: "30%" },
          { icon: "growth", label: "افزایش عملکرد محصول", prefix: "به میزان", value: "10-20%" },
          { icon: "money", label: "کاهش هزینهٔ انرژی پمپاژ", prefix: "به میزان", value: "15-25%" },
        ],
        roiHeading: "بازگشت سرمایهٔ تقریبی آبیاری دقیق",
        roiValue: "170% ROI",
        roiCaption: "در دو فصل نخست کشت",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "ساخته‌شده برای سایت‌های دور و کم‌مصرف",
            description:
              "مزارع پوشش ضعیف و برق شهری ندارند. دستگاه‌های ما آفلاین ذخیره می‌کنند، بعداً هم‌گام می‌شوند و سال‌ها با انرژی خورشیدی کار می‌کنند.",
            items: ["ذخیره و ارسال آفلاین", "کارکرد با خورشید و باتری", "به‌روزرسانی OTA در کل ناوگان"],
          },
          {
            title: "فناوری قابل فروش مجدد توسط پیمانکاران",
            description:
              "شرکت‌های آبیاری و اگری‌تک، پایش مبتنی بر پاپلی را با برند و قراردادهای پشتیبانی خودشان ارائه می‌کنند.",
            items: ["آمادهٔ ارائه با برند شما", "چندمستأجری برای چند مزرعه", "بدون تضاد منافع"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "به ازای هر دستگاه یا هر هکتار روی کلاد ما پرداخت کنید و با جذب مزارع جدید، پروژه‌به‌پروژه مقیاس دهید.",
            items: ["قیمت‌گذاری به ازای دستگاه", "مقیاس‌پذیری فصلی", "استقرار پروژه‌محور"],
          },
        ],
      },
      cta: {
        heading: "خدمات کشاورزی خود را با پاپلی تقویت کنید",
        description:
          "چه خودتان کشت کنید و چه پروژه‌های آبیاری و اگری‌تک به کشاورزان ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT للزراعة الذكية",
        description:
          "بابيلي مزوّد لتقنية AIoT. يستطيع المزارعون وشركات الري وشركات التقنية الزراعية والمقاولون استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتوفير المياه ورفع الإنتاجية.",
        primary: "طلب عرض توضيحي",
        secondary: "تحدّث إلى المبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي للزراعة",
        subheading:
          "منظومة AIoT مجرّبة ميدانياً يمكن للمزارع ومقاولي التقنية الزراعية نشرها مباشرة أو تقديمها بعلامتهم لعملائهم.",
        cards: [
          {
            title: "مراقبة التربة والمحصول والطقس",
            description: "عقد حقلية تعمل بالطاقة الشمسية ترسل الرطوبة والملوحة والمناخ الدقيق عبر راديو بعيد المدى.",
            items: ["رطوبة التربة على أعماق متعددة", "LoRaWAN وشبكة خلوية", "سنوات من عمر البطارية"],
          },
          {
            title: "التحكم في الري والمضخات",
            description: "جدول الري وتحقّق منه بناءً على بيانات التربة الفعلية بدل الدورات الثابتة.",
            items: ["زمن تشغيل المضخة والتدفق", "إنذارات التشغيل الجاف والضغط", "استهلاك المياه لكل هكتار"],
          },
          {
            title: "مناخ البيوت المحمية ونصائح الذكاء الاصطناعي",
            description: "تتعلّم النماذج كل دورة زراعية وتنذر مبكراً بالإجهاد وخطر الأمراض وأعطال المعدات.",
            items: ["كشف الشذوذ", "تنبيهات خطر الأمراض", "التنبؤ بالإنتاجية"],
          },
        ],
      },
      impact: {
        heading: "أثر AIoT في المزرعة",
        stats: [
          { icon: "water", label: "يقلل استهلاك المياه", prefix: "حتى", value: "30%" },
          { icon: "growth", label: "يزيد إنتاجية المحصول", prefix: "بنسبة", value: "10-20%" },
          { icon: "money", label: "يخفض كلفة طاقة الضخ", prefix: "بنسبة", value: "15-25%" },
        ],
        roiHeading: "العائد التقريبي على الاستثمار من الري الدقيق",
        roiValue: "170% ROI",
        roiCaption: "خلال أول موسمين زراعيين",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "مصمّمة للمواقع النائية ومنخفضة الطاقة",
            description:
              "الحقول ذات تغطية ضعيفة وبلا كهرباء رئيسية. أجهزتنا تخزّن دون اتصال وتتزامن لاحقاً وتعمل سنوات بالطاقة الشمسية.",
            items: ["تخزين وإرسال دون اتصال", "تشغيل بالطاقة الشمسية والبطارية", "تحديثات OTA عبر الأسطول"],
          },
          {
            title: "تقنية يستطيع المقاولون إعادة بيعها",
            description:
              "تقدّم شركات الري والتقنية الزراعية مراقبة مدعومة ببابيلي تحت علامتها وعقود الدعم الخاصة بها.",
            items: ["جاهزة للعلامة الخاصة", "تعدّد المستأجرين لعدة مزارع", "بلا تضارب مصالح"],
          },
          {
            title: "نموذج تجاري مرن",
            description: "ادفع لكل جهاز أو لكل هكتار على سحابتنا، وتوسّع مشروعاً بعد مشروع مع كل مزرعة جديدة.",
            items: ["تسعير لكل جهاز", "توسّع موسمي", "نشر قائم على المشاريع"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدماتك الزراعية مع بابيلي",
        description:
          "سواء كنت تزرع الأرض أو تقدّم مشاريع الري والتقنية الزراعية لمن يزرعها، منصة AIoT لدينا جاهزة للتوسّع معك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
