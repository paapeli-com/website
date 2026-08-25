import type { IndustryConfig } from "@/components/industry/types";

import assets from "@/src/assets/fleet-assets.jpg";
import coldchain from "@/src/assets/fleet-coldchain.jpg";
import hero from "@/src/assets/fleet-hero.jpg";
import telematics from "@/src/assets/fleet-telematics.jpg";

export const fleetTrackingConfig: IndustryConfig = {
  slug: "fleet-tracking",
  /* The platform capabilities this solution leans on. */
  features: ["realtime-monitoring", "ota-updates", "alerts-events", "predictive-analytics"],
  hero,
  images: [telematics, assets, coldchain],
  whyOrder: [0, 1, 2],

  copy: {
    en: {
      hero: {
        title: "AIoT technology for fleet and asset tracking",
        description:
          "Paapeli is an AIoT technology provider. Fleet owners and the telematics providers and contractors serving them can both use our cloud infrastructure, edge computing and IoT to track vehicles, equipment and cargo at scale.",
        primary: "Request Demo",
        secondary: "Talk to Sales",
      },
      offer: {
        heading: "What Paapeli delivers for fleets",
        subheading:
          "A complete tracking and telemetry stack that operators and service providers can deploy directly or white-label.",
        cards: [
          {
            title: "Live location and driving behaviour",
            description: "Second-by-second position, trips and harsh-driving events for every vehicle.",
            items: ["Trip history and replay", "Speeding and harsh braking alerts", "Geofence entry and exit"],
          },
          {
            title: "Equipment and asset utilization",
            description: "Track heavy equipment, trailers and unpowered assets with long-life battery trackers.",
            items: ["Engine hours and idle time", "Theft and unauthorized use alerts", "Maintenance by usage"],
          },
          {
            title: "Cold chain and cargo telemetry",
            description: "Temperature, humidity and door events proven end-to-end for sensitive cargo.",
            items: ["Temperature excursion alerts", "Offline buffering, later sync", "Auditable delivery reports"],
          },
        ],
      },
      impact: {
        heading: "Impact of AIoT on fleet operations",
        stats: [
          { icon: "money", label: "Reduces fuel consumption", prefix: "by", value: "10-15%" },
          { icon: "downtime", label: "Reduces idle time and unauthorized use", prefix: "up to", value: "30%" },
          { icon: "shield", label: "Fewer accidents with driver scoring", prefix: "up to", value: "20%" },
        ],
        roiHeading: "Approximate ROI from fleet telematics",
        roiValue: "300% ROI",
        roiCaption: "Typically paid back within the first year",
      },
      why: {
        heading: "Why partners choose Paapeli",
        cards: [
          {
            title: "A tracking platform you can brand",
            description:
              "Service providers deliver Paapeli-powered tracking under their own name, pricing and SLAs. We never sell to their customers.",
            items: ["White-label portal", "Multi-tenant by design", "No conflict of interest"],
          },
          {
            title: "Any tracker, any network",
            description:
              "Bring your own hardware or use ours. Cellular, satellite and LoRaWAN devices report into one data model.",
            items: ["Open device protocols", "Offline store and forward", "Remote OTA updates"],
          },
          {
            title: "A flexible commercial model",
            description:
              "Pay per active asset on our cloud, or run the platform in your own network for regulated customers.",
            items: ["Per-asset pricing", "Private deployment", "Scales to thousands of units"],
          },
        ],
      },
      cta: {
        heading: "Power your tracking services with Paapeli",
        description:
          "Whether you own the fleet or deliver telematics to fleet owners, our AIoT platform is ready to scale with you.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        title: "فناوری AIoT برای ردیابی ناوگان و دارایی‌ها",
        description:
          "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مالکان ناوگان و همچنین ارائه‌دهندگان تله‌متیکس و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای ردیابی خودرو، تجهیزات و بار در مقیاس بزرگ استفاده کنند.",
        primary: "درخواست دمو",
        secondary: "تماس با فروش",
      },
      offer: {
        heading: "آنچه پاپلی برای ناوگان ارائه می‌دهد",
        subheading:
          "یک پشتهٔ کامل ردیابی و تله‌متری که بهره‌برداران و ارائه‌دهندگان خدمات می‌توانند مستقیماً یا با برند خود ارائه دهند.",
        cards: [
          {
            title: "موقعیت زنده و رفتار رانندگی",
            description: "موقعیت لحظه‌به‌لحظه، سفرها و رویدادهای رانندگی پرخطر برای هر خودرو.",
            items: ["تاریخچه و بازپخش مسیر", "هشدار سرعت غیرمجاز و ترمز شدید", "ورود و خروج از ژئوفنس"],
          },
          {
            title: "بهره‌وری تجهیزات و دارایی‌ها",
            description: "ماشین‌آلات سنگین، تریلرها و دارایی‌های بدون برق را با ردیاب‌های باتری‌بلندمدت پایش کنید.",
            items: ["ساعت کارکرد و زمان بیکاری", "هشدار سرقت و استفادهٔ غیرمجاز", "نگهداشت بر پایهٔ میزان استفاده"],
          },
          {
            title: "زنجیرهٔ سرد و تله‌متری بار",
            description: "دما، رطوبت و رویدادهای درب برای بارهای حساس، به‌صورت سرتاسری مستند می‌شود.",
            items: ["هشدار انحراف دما", "ذخیرهٔ آفلاین و هم‌گام‌سازی بعدی", "گزارش‌های قابل ممیزی تحویل"],
          },
        ],
      },
      impact: {
        heading: "اثر AIoT بر عملیات ناوگان",
        stats: [
          { icon: "money", label: "کاهش مصرف سوخت", prefix: "به میزان", value: "10-15%" },
          { icon: "downtime", label: "کاهش زمان بیکاری و استفادهٔ غیرمجاز", prefix: "تا", value: "30%" },
          { icon: "shield", label: "کاهش تصادفات با امتیازدهی رانندگان", prefix: "تا", value: "20%" },
        ],
        roiHeading: "بازگشت سرمایهٔ تقریبی تله‌متیکس ناوگان",
        roiValue: "300% ROI",
        roiCaption: "معمولاً در همان سال نخست بازمی‌گردد",
      },
      why: {
        heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
        cards: [
          {
            title: "پلتفرم ردیابی با برند شما",
            description:
              "ارائه‌دهندگان خدمات، ردیابی مبتنی بر پاپلی را با نام، قیمت‌گذاری و SLA خودشان عرضه می‌کنند. ما هرگز به مشتریان آن‌ها نمی‌فروشیم.",
            items: ["پورتال با برند شما", "چندمستأجری از پایه", "بدون تضاد منافع"],
          },
          {
            title: "هر ردیاب، هر شبکه",
            description:
              "سخت‌افزار خودتان را بیاورید یا از سخت‌افزار ما استفاده کنید. دستگاه‌های سلولی، ماهواره‌ای و LoRaWAN در یک مدل داده واحد گزارش می‌دهند.",
            items: ["پروتکل‌های باز دستگاه", "ذخیره و ارسال آفلاین", "به‌روزرسانی از راه دور (OTA)"],
          },
          {
            title: "مدل تجاری انعطاف‌پذیر",
            description:
              "به ازای هر دارایی فعال روی کلاد ما پرداخت کنید یا پلتفرم را برای مشتریان تحت مقررات در شبکهٔ خودتان اجرا کنید.",
            items: ["قیمت‌گذاری به ازای هر دارایی", "استقرار خصوصی", "مقیاس‌پذیر تا هزاران دستگاه"],
          },
        ],
      },
      cta: {
        heading: "خدمات ردیابی خود را با پاپلی تقویت کنید",
        description:
          "چه مالک ناوگان باشید و چه خدمات تله‌متیکس به مالکان ناوگان بدهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        title: "تقنية AIoT لتتبّع الأساطيل والأصول",
        description:
          "بابيلي مزوّد لتقنية AIoT. يستطيع مالكو الأساطيل ومزوّدو التيليماتكس والمقاولون الذين يخدمونهم استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتتبّع المركبات والمعدات والشحنات على نطاق واسع.",
        primary: "طلب عرض توضيحي",
        secondary: "تحدّث إلى المبيعات",
      },
      offer: {
        heading: "ما تقدّمه بابيلي للأساطيل",
        subheading:
          "منظومة تتبّع وقياس عن بُعد متكاملة يمكن للمشغّلين ومزوّدي الخدمات نشرها مباشرة أو تقديمها بعلامتهم الخاصة.",
        cards: [
          {
            title: "الموقع الحيّ وسلوك القيادة",
            description: "الموقع لحظة بلحظة والرحلات وأحداث القيادة الخطرة لكل مركبة.",
            items: ["سجل الرحلات وإعادة التشغيل", "تنبيهات السرعة والكبح الحاد", "الدخول والخروج من السياج الجغرافي"],
          },
          {
            title: "استغلال المعدات والأصول",
            description: "تتبّع المعدات الثقيلة والمقطورات والأصول غير المزوّدة بالطاقة بأجهزة تتبّع طويلة العمر.",
            items: ["ساعات التشغيل ووقت الخمول", "تنبيهات السرقة والاستخدام غير المصرّح", "صيانة حسب الاستخدام"],
          },
          {
            title: "سلسلة التبريد وقياس الشحنات",
            description: "الحرارة والرطوبة وأحداث الأبواب موثّقة من طرف إلى طرف للشحنات الحساسة.",
            items: ["تنبيهات انحراف الحرارة", "تخزين دون اتصال ومزامنة لاحقة", "تقارير تسليم قابلة للتدقيق"],
          },
        ],
      },
      impact: {
        heading: "أثر AIoT على عمليات الأسطول",
        stats: [
          { icon: "money", label: "يقلل استهلاك الوقود", prefix: "بنسبة", value: "10-15%" },
          { icon: "downtime", label: "يقلل وقت الخمول والاستخدام غير المصرّح", prefix: "حتى", value: "30%" },
          { icon: "shield", label: "حوادث أقل مع تقييم السائقين", prefix: "حتى", value: "20%" },
        ],
        roiHeading: "العائد التقريبي على الاستثمار من تيليماتكس الأسطول",
        roiValue: "300% ROI",
        roiCaption: "يُسترد عادة خلال السنة الأولى",
      },
      why: {
        heading: "لماذا يختار الشركاء بابيلي",
        cards: [
          {
            title: "منصة تتبّع تحمل علامتك",
            description:
              "يقدّم مزوّدو الخدمات تتبّعاً مدعوماً ببابيلي باسمهم وتسعيرهم واتفاقيات مستواهم. نحن لا نبيع لعملائهم أبداً.",
            items: ["بوابة بعلامتك الخاصة", "تعدّد المستأجرين بالتصميم", "بلا تضارب مصالح"],
          },
          {
            title: "أي جهاز تتبّع وأي شبكة",
            description:
              "أحضر عتادك أو استخدم عتادنا. أجهزة الشبكة الخلوية والأقمار الصناعية وLoRaWAN ترسل إلى نموذج بيانات واحد.",
            items: ["بروتوكولات أجهزة مفتوحة", "تخزين وإرسال دون اتصال", "تحديثات OTA عن بُعد"],
          },
          {
            title: "نموذج تجاري مرن",
            description: "ادفع لكل أصل نشط على سحابتنا، أو شغّل المنصة داخل شبكتك للعملاء الخاضعين للتنظيم.",
            items: ["تسعير لكل أصل", "نشر خاص", "يتوسّع إلى آلاف الوحدات"],
          },
        ],
      },
      cta: {
        heading: "عزّز خدمات التتبّع لديك مع بابيلي",
        description:
          "سواء كنت تملك الأسطول أو تقدّم التيليماتكس لمالكيه، منصة AIoT لدينا جاهزة للتوسّع معك.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
