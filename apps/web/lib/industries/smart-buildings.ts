import type { IndustryConfig } from "@/components/industry/types";

import hero from "@/src/assets/bld-hero.jpg";
import hvac from "@/src/assets/bld-hvac.jpg";
import lobby from "@/src/assets/bld-lobby.jpg";
import meters from "@/src/assets/bld-meters.jpg";

export const smartBuildingsConfig: IndustryConfig = {
  slug: "smart-buildings",
  /* The platform capabilities this solution leans on. */
  features: ["realtime-monitoring", "alerts-events", "solution-templates", "flexible-deployment"],
  hero,
  images: [hvac, meters, lobby],
  whyOrder: [0, 2, 1],

  copy: {
    en: {
      hero: {
        title: "AIoT technology for smart buildings",
        description:
          "Paapeli is an AIoT technology provider. Property owners, facility managers and the MEP contractors and system integrators serving them can all build on our cloud infrastructure, edge computing and IoT to run comfortable, efficient buildings.",
        primary: "Request Demo",
        secondary: "Talk to Sales",
      },
      offer: {
        heading: "What Paapeli delivers for buildings",
        subheading:
          "A complete AIoT stack that owners and contractors can deploy directly or white-label inside their own facility services.",
        cards: [
          {
            title: "HVAC and plant monitoring",
            description: "Chillers, AHUs, pumps and boilers on one live screen across every property.",
            items: ["Setpoint and runtime trends", "Fault and filter alerts", "Work orders from any alarm"],
          },
          {
            title: "Energy and water sub-metering",
            description: "Consumption per floor, tenant or system, ready for billing and benchmarking.",
            items: ["Tenant cost allocation", "Peak and baseline analysis", "Leak and waste detection"],
          },
          {
            title: "Comfort, air quality and occupancy",
            description: "Temperature, carbon dioxide and occupancy drive ventilation instead of fixed schedules.",
            items: ["Air quality and humidity monitoring", "Occupancy-based ventilation", "Comfort complaint tracking"],
          },
        ],
      },
      impact: {
        heading: "Impact of AIoT on building operations",
        stats: [
          { icon: "money", label: "Reduces HVAC energy cost", prefix: "by", value: "15-30%" },
          { icon: "downtime", label: "Reduces reactive maintenance calls", prefix: "up to", value: "40%" },
          { icon: "people", label: "Fewer tenant comfort complaints", prefix: "up to", value: "35%" },
        ],
        roiHeading: "Approximate ROI from smart building retrofits",
        roiValue: "180% ROI",
        roiCaption: "Mostly from energy and maintenance savings",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "Vendor-neutral over existing BMS",
            description:
              "Read from the BMS and field devices you already have. No rip-and-replace, no lock-in to one controller brand.",
            items: ["BACnet, Modbus, MQTT", "Retrofit friendly", "No control-side risk"],
          },
          {
            title: "A portfolio platform for contractors",
            description:
              "Facility contractors manage many client buildings from one multi-tenant platform and sell monitoring as a recurring service under their brand.",
            items: ["Multi-site, multi-tenant", "White-label ready", "Recurring service revenue"],
          },
          {
            title: "A flexible commercial model",
            description: "Pay per building or per device on our cloud, or run the same platform inside the property network.",
            items: ["Per-building pricing", "Private deployment", "Grows with the portfolio"],
          },
        ],
      },
      cta: {
        heading: "Power your building services with Paapeli",
        description:
          "Whether you own the property or deliver MEP and facility projects to owners, our AIoT platform is ready to scale with you.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای ساختمان‌های هوشمند",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مالکان ساختمان، مدیران تسهیلات و همچنین پیمانکاران تأسیسات و مجریان سیستم می‌توانند بر پایهٔ زیرساخت ابری، محاسبات لبه و IoT ما، ساختمان‌هایی راحت‌تر و کم‌مصرف‌تر را اداره کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای ساختمان‌ها ارائه می‌دهد",
        subheading:
          "یک راهکار کامل AIoT که مالکان و پیمانکاران می‌توانند مستقیماً مستقر کنند یا در خدمات تسهیلات خود با برند خودشان ارائه دهند.",
        cards: [
          {
            title: "پایش تأسیسات و HVAC",
            description: "چیلرها، هواسازها، پمپ‌ها و بویلرها در یک نمای زنده برای همهٔ ساختمان‌ها.",
            items: ["روند Setpoint و ساعت کارکرد", "هشدار خرابی و فیلتر", "دستور کار از هر هشدار"],
          },
          {
            title: "کنتورگذاری تفکیکی انرژی و آب",
            description: "مصرف به تفکیک طبقه، مستأجر یا سیستم، آمادهٔ صدور صورتحساب و مقایسه.",
            items: ["تخصیص هزینه به مستأجران", "تحلیل پیک و مصرف پایه", "تشخیص نشتی و اتلاف"],
          },
          {
            title: "آسایش، کیفیت هوا و حضور",
            description: "دما، دی‌اکسید کربن و میزان حضور، تهویه را هدایت می‌کنند، نه زمان‌بندی‌های ثابت.",
            items: ["پایش کیفیت هوا و رطوبت", "تهویه بر پایهٔ حضور", "پیگیری شکایات آسایش"],
          },
        ],
      },
      impact: {
        heading: "اثر AIoT بر بهره‌برداری ساختمان",
        stats: [
          { icon: "money", label: "کاهش هزینهٔ انرژی HVAC", prefix: "به میزان", value: "15-30%" },
          { icon: "downtime", label: "کاهش مراجعات تعمیرات اضطراری", prefix: "تا", value: "40%" },
          { icon: "people", label: "کاهش شکایات آسایش مستأجران", prefix: "تا", value: "35%" },
        ],
        roiHeading: "بازگشت سرمایهٔ تقریبی هوشمندسازی ساختمان",
        roiValue: "180% ROI",
        roiCaption: "عمدتاً از صرفه‌جویی انرژی و نگهداری",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "مستقل از برند، روی BMS موجود",
            description:
              "از BMS و تجهیزات موجود شما داده می‌خوانیم. نیازی به تعویض کامل سیستم یا وابستگی به برند خاصی از کنترلر نیست.",
            items: ["BACnet، Modbus، MQTT", "مناسب بازسازی", "بدون ریسک در سمت کنترل"],
          },
          {
            title: "پلتفرم مدیریت چند ساختمان برای پیمانکاران",
            description:
              "پیمانکاران تسهیلات می‌توانند چندین ساختمان مشتری را از یک پلتفرم چندمستأجری مدیریت کنند و پایش را به‌صورت خدمت تکرارشونده با برند خود بفروشند.",
            items: ["چندسایتی و چندمستأجری", "آمادهٔ ارائه با برند شما", "درآمد خدمات تکرارشونده"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "به ازای هر ساختمان یا هر دستگاه روی ابر پاپلی پرداخت کنید یا همان پلتفرم را در شبکهٔ ساختمان اجرا کنید.",
            items: ["قیمت‌گذاری به ازای ساختمان", "استقرار خصوصی", "رشد همراه با پرتفوی"],
          },
        ],
      },
      cta: {
        heading: "خدمات ساختمانی خود را با پاپلی تقویت کنید",
        description:
          "چه مالک ساختمان باشید و چه پروژه‌های تأسیسات و تسهیلات به مالکان ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT للمباني الذكية",
        description:
          "بابيلي مزوّد لتقنية AIoT. يستطيع ملّاك العقارات ومديرو المرافق ومقاولو الأعمال الكهروميكانيكية ومكاملو الأنظمة البناء على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتشغيل مبانٍ مريحة وموفّرة.",
        primary: "طلب عرض توضيحي",
        secondary: "تحدّث إلى المبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي للمباني",
        subheading:
          "منظومة AIoT متكاملة يمكن للملّاك والمقاولين نشرها مباشرة أو تقديمها بعلامتهم الخاصة ضمن خدمات المرافق لديهم.",
        cards: [
          {
            title: "مراقبة التكييف والمعدات",
            description: "المبرّدات ووحدات مناولة الهواء والمضخات والغلايات على شاشة حيّة واحدة لكل العقارات.",
            items: ["اتجاهات نقاط الضبط وساعات التشغيل", "تنبيهات الأعطال والفلاتر", "أوامر عمل من أي إنذار"],
          },
          {
            title: "القياس الفرعي للطاقة والمياه",
            description: "الاستهلاك لكل طابق أو مستأجر أو نظام، جاهز للفوترة والمقارنة المرجعية.",
            items: ["توزيع الكلفة على المستأجرين", "تحليل الذروة وخط الأساس", "كشف التسرب والهدر"],
          },
          {
            title: "الراحة وجودة الهواء والإشغال",
            description: "الحرارة وثاني أكسيد الكربون والإشغال تقود التهوية بدل الجداول الثابتة.",
            items: ["مراقبة جودة الهواء والرطوبة", "تهوية حسب الإشغال", "متابعة شكاوى الراحة"],
          },
        ],
      },
      impact: {
        heading: "أثر AIoT على تشغيل المباني",
        stats: [
          { icon: "money", label: "يقلل كلفة طاقة التكييف", prefix: "بنسبة", value: "15-30%" },
          { icon: "downtime", label: "يقلل طلبات الصيانة الطارئة", prefix: "حتى", value: "40%" },
          { icon: "people", label: "شكاوى راحة أقل من المستأجرين", prefix: "حتى", value: "35%" },
        ],
        roiHeading: "العائد التقريبي على الاستثمار من تحديث المباني الذكية",
        roiValue: "180% ROI",
        roiCaption: "معظمه من وفورات الطاقة والصيانة",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "محايدة تجاه المورّد وفوق نظام BMS الحالي",
            description:
              "نقرأ من نظام إدارة المبنى والأجهزة الميدانية الموجودة لديك. بلا هدم واستبدال ولا ارتباط بعلامة متحكم واحدة.",
            items: ["BACnet وModbus وMQTT", "مناسب للتحديث", "بلا مخاطرة في جانب التحكم"],
          },
          {
            title: "منصة محفظة للمقاولين",
            description:
              "يدير مقاولو المرافق مبانيَ عملاء كثيرة من منصة واحدة متعددة المستأجرين ويبيعون المراقبة كخدمة متكررة بعلامتهم.",
            items: ["متعدد المواقع والمستأجرين", "جاهزة للعلامة الخاصة", "إيراد خدمات متكرر"],
          },
          {
            title: "نموذج تجاري مرن",
            description: "ادفع لكل مبنى أو لكل جهاز على سحابتنا، أو شغّل المنصة نفسها داخل شبكة العقار.",
            items: ["تسعير لكل مبنى", "نشر خاص", "ينمو مع المحفظة"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدمات المباني لديك مع بابيلي",
        description:
          "سواء كنت تملك العقار أو تقدّم مشاريع كهروميكانيكية ومرافق للملّاك، منصة AIoT لدينا جاهزة للتوسّع معك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
