import type { IndustryConfig } from "@/components/industry/types";

import hero from "@/src/assets/mfg-hero.jpg";
import line from "@/src/assets/mfg-line.jpg";
import machines from "@/src/assets/mfg-machines.jpg";
import operator from "@/src/assets/mfg-operator.jpg";

export const smartManufacturingConfig: IndustryConfig = {
  slug: "smart-manufacturing",
  /* The platform capabilities this solution leans on. */
  features: ["realtime-monitoring", "predictive-analytics", "anomaly-detection", "device-management"],
  hero,
  images: [line, machines, operator],
  whyOrder: [0, 2, 1],

  copy: {
    en: {
      hero: {
        title: "AIoT technology for smart manufacturing",
        description:
          "Paapeli is an AIoT technology provider. Plant owners and the automation integrators and contractors who serve them can both build on our cloud, edge and IoT stack to run smarter, more available production lines.",
        primary: "Request Demo",
        secondary: "Talk to Sales",
      },
      offer: {
        heading: "What Paapeli delivers for manufacturing",
        subheading:
          "A complete AIoT stack that plants and integrators can deploy directly or white-label inside their own service portfolio.",
        cards: [
          {
            title: "Line and OEE monitoring",
            description: "Live availability, performance and quality for every line, shift and product.",
            items: ["Real-time OEE breakdown", "Downtime reason capture", "Shift and product comparison"],
          },
          {
            title: "Machine condition and predictive maintenance",
            description: "Vibration, temperature and current signatures reveal wear long before a breakdown.",
            items: ["Failure forecasting", "Anomaly detection", "Automatic work orders"],
          },
          {
            title: "PLC and shop-floor connectivity",
            description: "Edge gateways connect legacy PLCs and new machines without touching control logic.",
            items: ["Modbus, OPC UA, MQTT", "Read-only, safe integration", "Fleet-wide OTA updates"],
          },
        ],
      },
      impact: {
        heading: "Impact of AIoT on production",
        stats: [
          { icon: "downtime", label: "Reduces unplanned downtime", prefix: "up to", value: "45%" },
          { icon: "growth", label: "Increases equipment effectiveness (OEE)", prefix: "by", value: "15-20%" },
          { icon: "money", label: "Reduces scrap and rework cost", prefix: "by", value: "10-25%" },
        ],
        roiHeading: "Approximate ROI from AIoT on the shop floor",
        roiValue: "220% ROI",
        roiCaption: "More than double the investment returned",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "Technology you can resell or white-label",
            description:
              "Paapeli is the engine behind your automation service, not a competing integrator. Deliver digitalization under your own brand and contracts.",
            items: ["White-label ready", "API-first integration", "No conflict of interest"],
          },
          {
            title: "Fast deployment for integrators",
            description:
              "Pre-integrated protocols, gateways and machine templates let you commission a smart line for a client in weeks.",
            items: ["Reusable machine templates", "Works with legacy PLCs", "Commissioning in weeks"],
          },
          {
            title: "A flexible commercial model",
            description:
              "Start pay-as-you-go on our cloud, or run the same platform inside the plant network. Scale per line, per site or per customer.",
            items: ["Pay-as-you-go cloud", "On-premise deployment", "Per-line scaling"],
          },
        ],
      },
      cta: {
        heading: "Power your manufacturing services with Paapeli",
        description:
          "Whether you run the plant or deliver automation projects to it, our AIoT platform is ready to scale with you.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای تولید هوشمند",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. صاحبان کارخانه و همچنین پیمانکاران و مجریان اتوماسیون می‌توانند بر پایهٔ زیرساخت ابری، محاسبات لبه و IoT ما، خطوط تولید هوشمندتر و در دسترس‌تری را اجرا کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای صنعت تولید ارائه می‌دهد",
        subheading:
          "یک پشتهٔ کامل AIoT که کارخانه‌ها و مجریان می‌توانند مستقیماً مستقر کنند یا با برند خود در سبد خدماتشان ارائه دهند.",
        cards: [
          {
            title: "پایش خط تولید و OEE",
            description: "در دسترس‌بودن، عملکرد و کیفیت به‌صورت زنده برای هر خط، شیفت و محصول.",
            items: ["تفکیک لحظه‌ای OEE", "ثبت علت توقفات", "مقایسهٔ شیفت و محصول"],
          },
          {
            title: "پایش وضعیت ماشین و نگهداشت پیش‌بینانه",
            description: "امضای لرزش، دما و جریان، فرسایش را مدت‌ها پیش از خرابی آشکار می‌کند.",
            items: ["پیش‌بینی خرابی", "تشخیص ناهنجاری", "صدور خودکار دستور کار"],
          },
          {
            title: "اتصال PLC و کف کارگاه",
            description: "گیت‌وی‌های لبه، PLCهای قدیمی و ماشین‌های جدید را بدون دست‌زدن به منطق کنترل متصل می‌کنند.",
            items: ["Modbus، OPC UA، MQTT", "یکپارچه‌سازی امن و فقط‌خواندنی", "به‌روزرسانی OTA در کل ناوگان"],
          },
        ],
      },
      impact: {
        heading: "اثر AIoT بر تولید",
        stats: [
          { icon: "downtime", label: "کاهش توقفات برنامه‌ریزی‌نشده", prefix: "تا", value: "45%" },
          { icon: "growth", label: "افزایش اثربخشی تجهیزات (OEE)", prefix: "به میزان", value: "15-20%" },
          { icon: "money", label: "کاهش هزینهٔ ضایعات و دوباره‌کاری", prefix: "به میزان", value: "10-25%" },
        ],
        roiHeading: "بازگشت سرمایهٔ تقریبی AIoT در کف کارگاه",
        roiValue: "220% ROI",
        roiCaption: "بازگشت بیش از دو برابر سرمایه",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "فناوری قابل فروش مجدد یا ارائه با برند شما",
            description:
              "پاپلی موتور پشت خدمت اتوماسیون شماست، نه یک مجری رقیب. دیجیتالی‌سازی را با برند و قراردادهای خودتان ارائه دهید.",
            items: ["آمادهٔ ارائه با برند شما", "یکپارچه‌سازی مبتنی بر API", "بدون تضاد منافع"],
          },
          {
            title: "استقرار سریع برای مجریان",
            description:
              "پروتکل‌ها، گیت‌وی‌ها و قالب‌های ماشین از پیش یکپارچه‌شده به شما اجازه می‌دهند خط هوشمند مشتری را در چند هفته راه‌اندازی کنید.",
            items: ["قالب‌های قابل استفادهٔ مجدد ماشین", "سازگار با PLCهای قدیمی", "راه‌اندازی در چند هفته"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "با پرداخت به‌اندازهٔ مصرف روی کلاد ما شروع کنید یا همان پلتفرم را در شبکهٔ کارخانه اجرا کنید. به ازای هر خط، سایت یا مشتری مقیاس دهید.",
            items: ["کلاد با پرداخت به‌اندازهٔ مصرف", "استقرار درون‌سازمانی", "مقیاس‌پذیری به ازای هر خط"],
          },
        ],
      },
      cta: {
        heading: "خدمات تولید هوشمند خود را با پاپلی تقویت کنید",
        description:
          "چه کارخانه را اداره کنید و چه پروژه‌های اتوماسیون به آن ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT للتصنيع الذكي",
        description:
          "بابيلي مزوّد لتقنية AIoT. يستطيع أصحاب المصانع ومكاملو الأتمتة والمقاولون الذين يخدمونهم البناء على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتشغيل خطوط إنتاج أذكى وأكثر جاهزية.",
        primary: "طلب عرض توضيحي",
        secondary: "تحدّث إلى المبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي لقطاع التصنيع",
        subheading:
          "منظومة AIoT متكاملة يمكن للمصانع والمكاملين نشرها مباشرة أو تقديمها بعلامتهم التجارية ضمن محفظة خدماتهم.",
        cards: [
          {
            title: "مراقبة الخط والفعالية الكلية (OEE)",
            description: "الجاهزية والأداء والجودة بشكل حيّ لكل خط ووردية ومنتج.",
            items: ["تفصيل لحظي للـ OEE", "تسجيل أسباب التوقف", "مقارنة الورديات والمنتجات"],
          },
          {
            title: "حالة الآلات والصيانة التنبؤية",
            description: "بصمات الاهتزاز والحرارة والتيار تكشف التآكل قبل العطل بوقت طويل.",
            items: ["التنبؤ بالأعطال", "كشف الشذوذ", "أوامر عمل تلقائية"],
          },
          {
            title: "ربط وحدات PLC وأرضية المصنع",
            description: "بوابات طرفية تربط وحدات PLC القديمة والآلات الحديثة دون المساس بمنطق التحكم.",
            items: ["Modbus وOPC UA وMQTT", "تكامل آمن للقراءة فقط", "تحديثات OTA عبر الأسطول"],
          },
        ],
      },
      impact: {
        heading: "أثر AIoT على الإنتاج",
        stats: [
          { icon: "downtime", label: "يقلل التوقف غير المخطط له", prefix: "حتى", value: "45%" },
          { icon: "growth", label: "يزيد فعالية المعدات (OEE)", prefix: "بنسبة", value: "15-20%" },
          { icon: "money", label: "يقلل كلفة الهدر وإعادة التشغيل", prefix: "بنسبة", value: "10-25%" },
        ],
        roiHeading: "العائد التقريبي على الاستثمار من AIoT في أرضية المصنع",
        roiValue: "220% ROI",
        roiCaption: "أكثر من ضعف الاستثمار المسترد",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "تقنية قابلة لإعادة البيع أو للعلامة الخاصة",
            description:
              "بابيلي هو المحرّك خلف خدمة الأتمتة لديك، وليس مكاملاً منافساً. قدّم التحول الرقمي بعلامتك وعقودك.",
            items: ["جاهزة للعلامة الخاصة", "تكامل يعتمد الـ API أولاً", "بلا تضارب مصالح"],
          },
          {
            title: "نشر سريع للمكاملين",
            description:
              "بروتوكولات وبوابات وقوالب آلات مدمجة مسبقاً تتيح لك تشغيل خط ذكي لعميلك خلال أسابيع.",
            items: ["قوالب آلات قابلة لإعادة الاستخدام", "يعمل مع وحدات PLC القديمة", "التشغيل خلال أسابيع"],
          },
          {
            title: "نموذج تجاري مرن",
            description:
              "ابدأ بالدفع حسب الاستخدام على سحابتنا أو شغّل المنصة نفسها داخل شبكة المصنع. توسّع لكل خط أو موقع أو عميل.",
            items: ["سحابة بالدفع حسب الاستخدام", "نشر داخل المؤسسة", "توسّع لكل خط إنتاج"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدمات التصنيع لديك مع بابيلي",
        description:
          "سواء كنت تدير المصنع أو تقدّم له مشاريع الأتمتة، منصة AIoT لدينا جاهزة للتوسّع معك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
