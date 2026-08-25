import type { IndustryConfig } from "@/components/industry/types";

import hero from "@/src/assets/oilgas-hero.jpg";
import pipeline from "@/src/assets/oilgas-pipeline.jpg";
import refinery from "@/src/assets/oilgas-refinery.jpg";
import tank from "@/src/assets/oilgas-tank.jpg";

export const oilGasConfig: IndustryConfig = {
  slug: "oil-gas",
  /* The platform capabilities this solution leans on. */
  features: ["realtime-monitoring", "alerts-events", "anomaly-detection", "predictive-analytics"],
  hero,
  images: [refinery, pipeline, tank],
  whyOrder: [0, 1, 2],
  /* The platform stands on the left of the frame, where English copy starts. */
  mirrorHeroInLtr: true,

  copy: {
    en: {
      hero: {
        title: "AIoT technology for oil and gas",
        description:
          "Paapeli is an AIoT technology provider. Oil and gas operators and EPC or field-service contractors alike can build on our cloud infrastructure, edge computing, and IoT stack to deliver smarter, safer energy services.",
        primary: "Request Demo",
        secondary: "Contact Sales",
      },
      offer: {
        heading: "What Paapeli delivers for oil and gas",
        subheading:
          "A complete AIoT stack that operators and contractors can deliver under their own brand or fold into an existing service portfolio.",
        cards: [
          {
            title: "Asset and process monitoring",
            description: "A live view of pumps, compressors, and process units across every site.",
            items: ["Vibration and temperature trends", "Threshold and anomaly alerts", "A work order from any alert"],
          },
          {
            title: "Pipeline and wellhead telemetry",
            description: "Pressure, flow, and leak signals from remote sites over cellular, satellite, or LoRaWAN.",
            items: ["Works offline and syncs later", "Leak and pressure-drop detection", "OTA updates across the fleet"],
          },
          {
            title: "Predictive maintenance and AI",
            description: "Models learn normal behaviour and flag failures weeks before a shutdown.",
            items: ["Failure prediction", "Anomaly detection", "Maintenance scheduling"],
          },
        ],
      },
      impact: {
        heading: "Predictive maintenance with AIoT",
        stats: [
          { icon: "downtime", label: "Reduces unplanned downtime", prefix: "up to", value: "50%" },
          { icon: "money", label: "Reduces maintenance costs", prefix: "by", value: "10-40%" },
          { icon: "growth", label: "Increases productivity (OEE)", prefix: "by", value: "15-20%" },
        ],
        roiHeading: "Approximate return on investment with AI predictive maintenance",
        roiValue: "250% ROI",
        roiCaption: "Returning over twice the investment",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "Technology you can resell or white-label",
            description:
              "Paapeli is the engine behind your service, not a competing operator. Deliver Paapeli-based digitalisation under your own brand and contracts.",
            items: ["Ready to deliver under your brand", "API-based integration", "No conflict of interest"],
          },
          {
            title: "Fast deployment for contractors",
            description:
              "Pre-integrated protocols, edge gateways, and device templates let you roll out smart field services for customers in weeks, not years.",
            items: ["Modbus, OPC UA, MQTT", "Cellular, satellite, LoRaWAN", "Reusable project templates"],
          },
          {
            title: "A flexible commercial model",
            description:
              "Start on our pay-as-you-go cloud or run the same platform inside your own network. Scale per project, per asset, or per end customer.",
            items: ["Pay-as-you-go cloud", "Private network deployment", "Per-project scalability"],
          },
        ],
      },
      cta: {
        heading: "Strengthen your oil and gas services with Paapeli",
        description:
          "Whether you operate assets directly or deliver smart services to the industry, our AIoT platform is ready to grow with you.",
        button: "Contact Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای نفت و گاز",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. بهره‌برداران نفت و گاز و پیمانکاران EPC و خدمات میدانی، هر دو می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای ارائهٔ خدمات انرژی هوشمندتر و ایمن‌تر استفاده کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای نفت و گاز ارائه می‌دهد",
        subheading:
          "یک پشتهٔ کامل AIoT که بهره‌برداران و پیمانکاران می‌توانند با برند خود ارائه دهند یا در سبد خدمات خود یکپارچه کنند.",
        cards: [
          {
            title: "پایش دارایی و فرایند",
            description: "یک نمای زنده از پمپ‌ها، کمپرسورها و واحدهای فرایندی در همهٔ سایت‌ها.",
            items: ["روند لرزش و دما", "هشدار آستانه و ناهنجاری", "دستور کار از هر هشدار"],
          },
          {
            title: "تله‌متری خط لوله و سرچاهی",
            description: "سیگنال فشار، جریان و نشت از سایت‌های دور روی سلولی، ماهواره یا LoRaWAN.",
            items: ["کار آفلاین و هم‌گام‌سازی بعدی", "تشخیص نشت و افت فشار", "به‌روزرسانی OTA در کل ناوگان"],
          },
          {
            title: "نگهداشت پیش‌بینانه و هوش مصنوعی",
            description: "مدل‌ها رفتار عادی را یاد می‌گیرند و خرابی را هفته‌ها پیش از توقف اعلام می‌کنند.",
            items: ["پیش‌بینی خرابی", "تشخیص ناهنجاری", "برنامه‌ریزی نگهداشت"],
          },
        ],
      },
      impact: {
        heading: "نگهداشت پیش‌بینانه با AIoT",
        stats: [
          { icon: "downtime", label: "کاهش خرابی‌های برنامه‌ریزی‌نشده", prefix: "تا", value: "50%" },
          { icon: "money", label: "کاهش هزینه‌های نگهداری", prefix: "به میزان", value: "10-40%" },
          { icon: "growth", label: "افزایش بهره‌وری (OEE)", prefix: "به میزان", value: "15-20%" },
        ],
        roiHeading: "بازگشت سرمایهٔ تقریبی با نگهداشت پیش‌بینانهٔ هوش مصنوعی",
        roiValue: "250% ROI",
        roiCaption: "بازگشت بیش از دو برابر سرمایه",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "فناوری قابل فروش مجدد یا ارائه با برند شما",
            description:
              "پاپلی موتور پشت خدمت شماست، نه یک بهره‌بردار رقیب. دیجیتالی‌سازی مبتنی بر پاپلی را با برند و قراردادهای خودتان ارائه دهید.",
            items: ["آمادهٔ ارائه با برند شما", "یکپارچه‌سازی مبتنی بر API", "بدون تضاد منافع"],
          },
          {
            title: "استقرار سریع برای پیمانکاران",
            description:
              "پروتکل‌های از پیش یکپارچه، گیت‌وی‌های لبه و قالب‌های دستگاه به شما امکان می‌دهند خدمات میدانی هوشمند را برای مشتریان در هفته‌ها، نه سال‌ها، مستقر کنید.",
            items: ["Modbus، OPC UA، MQTT", "سلولی، ماهواره، LoRaWAN", "قالب‌های پروژهٔ قابل استفادهٔ مجدد"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "با پرداخت به‌اندازهٔ مصرف روی کلاد ما شروع کنید یا همان پلتفرم را در شبکهٔ خودتان اجرا کنید. به ازای هر پروژه، دارایی یا مشتری نهایی مقیاس بگیرید.",
            items: ["کلاد با پرداخت به‌اندازهٔ مصرف", "استقرار در شبکهٔ خصوصی", "مقیاس‌پذیری مبتنی بر پروژه"],
          },
        ],
      },
      cta: {
        heading: "خدمات نفت و گاز خود را با پاپلی تقویت کنید",
        description:
          "چه دارایی‌ها را مستقیماً بهره‌برداری کنید و چه خدمات هوشمند را به صنعت ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT للنفط والغاز",
        description:
          "بابيلي مزوّد لتقنية AIoT. يمكن لمشغّلي النفط والغاز ولمقاولي EPC والخدمات الميدانية الاعتماد على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتقديم خدمات طاقة أذكى وأكثر أماناً.",
        primary: "طلب عرض توضيحي",
        secondary: "اتصل بالمبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي للنفط والغاز",
        subheading:
          "منظومة AIoT متكاملة يمكن للمشغّلين والمقاولين تقديمها بعلامتهم التجارية أو دمجها في محفظة خدماتهم.",
        cards: [
          {
            title: "مراقبة الأصول والعمليات",
            description: "رؤية حيّة للمضخات والضواغط ووحدات المعالجة في كل المواقع.",
            items: ["اتجاهات الاهتزاز والحرارة", "تنبيهات العتبة والشذوذ", "أمر عمل من أي تنبيه"],
          },
          {
            title: "قياس عن بُعد لخطوط الأنابيب ورؤوس الآبار",
            description:
              "إشارات الضغط والتدفق والتسرب من المواقع النائية عبر الشبكة الخلوية أو الأقمار الصناعية أو LoRaWAN.",
            items: ["يعمل دون اتصال ويتزامن لاحقاً", "كشف التسرب وهبوط الضغط", "تحديثات OTA عبر الأسطول"],
          },
          {
            title: "الصيانة التنبؤية والذكاء الاصطناعي",
            description: "تتعلّم النماذج السلوك الطبيعي وتنذر بالأعطال قبل التوقف بأسابيع.",
            items: ["التنبؤ بالأعطال", "كشف الشذوذ", "جدولة الصيانة"],
          },
        ],
      },
      impact: {
        heading: "الصيانة التنبؤية مع AIoT",
        stats: [
          { icon: "downtime", label: "يقلل التوقف غير المخطط له", prefix: "حتى", value: "50%" },
          { icon: "money", label: "يقلل تكاليف الصيانة", prefix: "بنسبة", value: "10-40%" },
          { icon: "growth", label: "يزيد الإنتاجية (OEE)", prefix: "بنسبة", value: "15-20%" },
        ],
        roiHeading: "العائد التقريبي على الاستثمار مع الصيانة التنبؤية بالذكاء الاصطناعي",
        roiValue: "250% ROI",
        roiCaption: "إعادة أكثر من ضعف الاستثمار",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "تقنية قابلة لإعادة البيع أو للعلامة الخاصة",
            description:
              "بابيلي هو المحرّك خلف خدمتك، وليس مشغّلاً منافساً. قدّم التحول الرقمي المبني على بابيلي بعلامتك وعقودك.",
            items: ["جاهزة للتقديم بعلامتك", "تكامل عبر واجهات API", "بلا تضارب مصالح"],
          },
          {
            title: "نشر سريع للمقاولين",
            description:
              "بروتوكولات مدمجة مسبقاً وبوابات طرفية وقوالب أجهزة تتيح لك إطلاق خدمات ميدانية ذكية لعملائك خلال أسابيع لا سنوات.",
            items: ["Modbus وOPC UA وMQTT", "خلوي وأقمار صناعية وLoRaWAN", "قوالب مشاريع قابلة لإعادة الاستخدام"],
          },
          {
            title: "نموذج تجاري مرن",
            description:
              "ابدأ على سحابتنا بنظام الدفع حسب الاستخدام أو شغّل المنصة نفسها داخل شبكتك. توسّع لكل مشروع أو أصل أو عميل نهائي.",
            items: ["سحابة بالدفع حسب الاستخدام", "نشر داخل شبكة خاصة", "قابلية توسّع حسب المشروع"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدمات النفط والغاز لديك مع بابيلي",
        description:
          "سواء كنت تشغّل الأصول مباشرة أو تقدّم خدمات ذكية للقطاع، منصة AIoT لدينا جاهزة للنمو معك.",
        button: "اتصل بالمبيعات",
      },
    },
  },
};
