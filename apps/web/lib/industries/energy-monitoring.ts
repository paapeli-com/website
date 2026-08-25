import type { IndustryConfig } from "@/components/industry/types";

import hero from "@/src/assets/energy-hero.jpg";
import meter from "@/src/assets/energy-meter.jpg";
import solar from "@/src/assets/energy-solar.jpg";
import storage from "@/src/assets/energy-storage.jpg";

export const energyMonitoringConfig: IndustryConfig = {
  slug: "energy-monitoring",
  /* The platform capabilities this solution leans on. */
  features: ["realtime-monitoring", "anomaly-detection", "predictive-analytics", "alerts-events"],
  hero,
  images: [meter, storage, solar],
  whyOrder: [0, 2, 1],

  copy: {
    en: {
      hero: {
        title: "AIoT technology for energy monitoring",
        description:
          "Paapeli is an AIoT technology provider. Energy-intensive sites and the ESCOs, panel builders and contractors that serve them can both use our cloud infrastructure, edge computing and IoT to measure, verify and reduce consumption.",
        primary: "Request Demo",
        secondary: "Talk to Sales",
      },
      offer: {
        heading: "What Paapeli delivers for energy",
        subheading:
          "A measurement-and-verification grade AIoT stack that owners and energy contractors can deploy or white-label.",
        cards: [
          {
            title: "Sub-metering and load breakdown",
            description: "See exactly which line, machine or floor consumes what, at any hour of the day.",
            items: ["kWh, power factor, harmonics", "Cost allocation per unit", "Energy intensity per output"],
          },
          {
            title: "Peak demand and tariff optimization",
            description: "Forecast peaks, shift loads and avoid demand penalties before they are billed.",
            items: ["Peak forecasting", "Load-shifting alerts", "Tariff-aware reporting"],
          },
          {
            title: "Renewables and carbon reporting",
            description: "Combine solar, storage and grid data into one auditable energy and emissions record.",
            items: ["Inverter and BMS integration", "Self-consumption tracking", "Carbon reporting"],
          },
        ],
      },
      impact: {
        heading: "Impact of AIoT energy monitoring",
        stats: [
          { icon: "money", label: "Reduces total energy cost", prefix: "by", value: "10-20%" },
          { icon: "downtime", label: "Cuts peak demand charges", prefix: "up to", value: "25%" },
          { icon: "leaf", label: "Lowers reported carbon intensity", prefix: "by", value: "15%" },
        ],
        roiHeading: "Typical payback of an energy monitoring rollout",
        roiValue: "12",
        roiCaption: "Months to full payback in most sites",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "Built for energy contractors and ESCOs",
            description:
              "Run measurement and verification for many client sites from one multi-tenant platform, under your own brand.",
            items: ["Multi-site, multi-tenant", "White-label reports", "Savings verification"],
          },
          {
            title: "Works with the meters you already install",
            description:
              "Modbus and OPC UA meters, inverters and PLCs connect through edge gateways without rewiring the plant.",
            items: ["Modbus, OPC UA, MQTT", "Retrofit friendly", "No control-side changes"],
          },
          {
            title: "A flexible commercial model",
            description:
              "Start pay-as-you-go per metering point, or deploy the platform privately for utilities and regulated clients.",
            items: ["Per metering point pricing", "Private deployment", "Project-based scaling"],
          },
        ],
      },
      cta: {
        heading: "Power your energy services with Paapeli",
        description:
          "Whether you pay the energy bill or deliver savings projects to those who do, our AIoT platform is ready to scale with you.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای پایش انرژی",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مصرف‌کنندگان بزرگ انرژی و همچنین شرکت‌های خدمات انرژی (ESCO)، تابلوسازان و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای اندازه‌گیری، صحه‌گذاری و کاهش مصرف استفاده کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای حوزهٔ انرژی ارائه می‌دهد",
        subheading:
          "یک پشتهٔ AIoT در سطح اندازه‌گیری و صحه‌گذاری که مالکان و پیمانکاران انرژی می‌توانند مستقر یا با برند خود ارائه کنند.",
        cards: [
          {
            title: "کنتورگذاری جزئی و تفکیک بار",
            description: "دقیقاً ببینید کدام خط، ماشین یا طبقه در هر ساعت چه مقدار مصرف می‌کند.",
            items: ["کیلووات‌ساعت، ضریب توان، هارمونیک", "تخصیص هزینه به هر واحد", "شدت انرژی به ازای تولید"],
          },
          {
            title: "بهینه‌سازی پیک مصرف و تعرفه",
            description: "پیک‌ها را پیش‌بینی کنید، بار را جابه‌جا کنید و پیش از صدور صورتحساب از جرایم پیک جلوگیری کنید.",
            items: ["پیش‌بینی پیک", "هشدار جابه‌جایی بار", "گزارش‌گیری مبتنی بر تعرفه"],
          },
          {
            title: "انرژی‌های تجدیدپذیر و گزارش کربن",
            description: "داده‌های خورشیدی، ذخیره‌ساز و شبکه را در یک سابقهٔ قابل ممیزی انرژی و انتشار یکپارچه کنید.",
            items: ["یکپارچگی با اینورتر و BMS", "پایش خودمصرفی", "گزارش انتشار کربن"],
          },
        ],
      },
      impact: {
        heading: "اثر پایش انرژی با AIoT",
        stats: [
          { icon: "money", label: "کاهش هزینهٔ کل انرژی", prefix: "به میزان", value: "10-20%" },
          { icon: "downtime", label: "کاهش هزینهٔ پیک مصرف", prefix: "تا", value: "25%" },
          { icon: "leaf", label: "کاهش شدت کربن گزارش‌شده", prefix: "به میزان", value: "15%" },
        ],
        roiHeading: "بازگشت سرمایهٔ معمول یک پروژهٔ پایش انرژی",
        roiValue: "12",
        roiCaption: "ماه تا بازگشت کامل سرمایه در بیشتر سایت‌ها",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "ساخته‌شده برای پیمانکاران انرژی و ESCOها",
            description:
              "اندازه‌گیری و صحه‌گذاری چندین سایت مشتری را از یک پلتفرم چندمستأجری و با برند خودتان اجرا کنید.",
            items: ["چندسایتی و چندمستأجری", "گزارش‌های با برند شما", "صحه‌گذاری صرفه‌جویی"],
          },
          {
            title: "سازگار با کنتورهایی که هم‌اکنون نصب می‌کنید",
            description:
              "کنتورها، اینورترها و PLCهای Modbus و OPC UA از طریق گیت‌وی لبه و بدون سیم‌کشی مجدد متصل می‌شوند.",
            items: ["Modbus، OPC UA، MQTT", "مناسب بازسازی و ارتقا", "بدون تغییر در سمت کنترل"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "با پرداخت به ازای هر نقطهٔ اندازه‌گیری شروع کنید یا پلتفرم را برای شرکت‌های برق و مشتریان تحت مقررات به‌صورت خصوصی مستقر کنید.",
            items: ["قیمت‌گذاری به ازای نقطهٔ اندازه‌گیری", "استقرار خصوصی", "مقیاس‌پذیری پروژه‌محور"],
          },
        ],
      },
      cta: {
        heading: "خدمات انرژی خود را با پاپلی تقویت کنید",
        description:
          "چه خودتان قبض انرژی را پرداخت کنید و چه پروژه‌های صرفه‌جویی به دیگران ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT لمراقبة الطاقة",
        description:
          "بابيلي مزوّد لتقنية AIoT. تستطيع المواقع كثيفة الاستهلاك وشركات خدمات الطاقة (ESCO) وصانعو اللوحات والمقاولون استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لقياس الاستهلاك والتحقق منه وخفضه.",
        primary: "طلب عرض توضيحي",
        secondary: "تحدّث إلى المبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي لقطاع الطاقة",
        subheading:
          "منظومة AIoT بمستوى القياس والتحقق يمكن للمالكين ومقاولي الطاقة نشرها أو تقديمها بعلامتهم الخاصة.",
        cards: [
          {
            title: "القياس الفرعي وتفصيل الأحمال",
            description: "شاهد بدقة أي خط أو آلة أو طابق يستهلك ماذا، في أي ساعة من اليوم.",
            items: ["كيلوواط ساعة ومعامل القدرة والتوافقيات", "توزيع الكلفة لكل وحدة", "كثافة الطاقة لكل إنتاج"],
          },
          {
            title: "تحسين ذروة الطلب والتعرفة",
            description: "توقّع الذروات وانقل الأحمال وتجنّب غرامات الطلب قبل صدور الفاتورة.",
            items: ["التنبؤ بالذروة", "تنبيهات نقل الأحمال", "تقارير تراعي التعرفة"],
          },
          {
            title: "الطاقة المتجددة وتقارير الكربون",
            description: "ادمج بيانات الطاقة الشمسية والتخزين والشبكة في سجل واحد قابل للتدقيق للطاقة والانبعاثات.",
            items: ["تكامل مع العاكسات وأنظمة BMS", "تتبّع الاستهلاك الذاتي", "تقارير انبعاث الكربون"],
          },
        ],
      },
      impact: {
        heading: "أثر مراقبة الطاقة بـ AIoT",
        stats: [
          { icon: "money", label: "يقلل كلفة الطاقة الإجمالية", prefix: "بنسبة", value: "10-20%" },
          { icon: "downtime", label: "يخفض رسوم ذروة الطلب", prefix: "حتى", value: "25%" },
          { icon: "leaf", label: "يخفض كثافة الكربون المُبلّغ عنها", prefix: "بنسبة", value: "15%" },
        ],
        roiHeading: "فترة الاسترداد المعتادة لمشروع مراقبة الطاقة",
        roiValue: "12",
        roiCaption: "شهراً حتى الاسترداد الكامل في معظم المواقع",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "مبنيّة لمقاولي الطاقة وشركات ESCO",
            description: "نفّذ القياس والتحقق لمواقع عملاء كثيرة من منصة واحدة متعددة المستأجرين وبعلامتك الخاصة.",
            items: ["متعدد المواقع والمستأجرين", "تقارير بعلامتك الخاصة", "التحقق من الوفورات"],
          },
          {
            title: "يعمل مع العدادات التي تركّبها أصلاً",
            description:
              "عدادات Modbus وOPC UA والعاكسات ووحدات PLC تتصل عبر بوابات طرفية دون إعادة تمديد الأسلاك.",
            items: ["Modbus وOPC UA وMQTT", "مناسب للتحديث والتطوير", "بلا تغييرات في جانب التحكم"],
          },
          {
            title: "نموذج تجاري مرن",
            description:
              "ابدأ بالدفع حسب الاستخدام لكل نقطة قياس، أو انشر المنصة بشكل خاص لشركات المرافق والعملاء الخاضعين للتنظيم.",
            items: ["تسعير لكل نقطة قياس", "نشر خاص", "توسّع حسب المشروع"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدمات الطاقة لديك مع بابيلي",
        description:
          "سواء كنت تدفع فاتورة الطاقة أو تقدّم مشاريع الوفورات لمن يدفعها، منصة AIoT لدينا جاهزة للتوسّع معك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
