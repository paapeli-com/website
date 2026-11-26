import type { Locale } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Titles and descriptions, per page and per language.                 */
/*                                                                     */
/* Every page used to go out under the home page's title, so a search  */
/* result could not tell one from another and Google had little reason */
/* to keep more than one of them. The wording here is the site's own:  */
/* the feature and industry pages carry it in lib/features and         */
/* lib/industries, and the rest is written to match what the page      */
/* actually says.                                                      */
/*                                                                     */
/* The home page is here too. It used to fall back to the site-wide    */
/* English title, so /fa and /ar went into search results under an    */
/* English headline even though the page itself was Persian/Arabic.   */
/* The root layout keeps the "%s | Paapeli" template for every other  */
/* page and takes only the default from this entry.                   */
/* ------------------------------------------------------------------ */

export type PageMeta = { title: string; description: string };

export const PAGE_META: Record<string, Partial<Record<Locale, PageMeta>>> = {
  "/": {
    en: {
      title: "Paapeli - AI-Powered IoT Cloud Platform",
      description:
        "Build, connect, and manage IoT infrastructure intelligently with Paapeli's AI-powered cloud platform. Device management, real-time analytics, and secure OTA updates.",
    },
    fa: {
      title: "پاپلی | پلتفرم ابری اینترنت اشیا با هوش مصنوعی",
      description:
        "زیرساخت اینترنت اشیای خود را با پلتفرم ابری پاپلی هوشمندانه بسازید، متصل کنید و مدیریت کنید: مدیریت دستگاه، پایش و تحلیل لحظه‌ای داده و به‌روزرسانی امن از راه دور (OTA).",
    },
    ar: {
      title: "بابيلي | منصة سحابية لإنترنت الأشياء بالذكاء الاصطناعي",
      description:
        "ابنِ بنية إنترنت الأشياء واربطها وأدِرها بذكاء مع منصة بابيلي السحابية: إدارة الأجهزة، والمراقبة والتحليلات اللحظية، وتحديثات OTA الآمنة عن بُعد.",
    },
  },
  "/aiot-platform": {
    en: {
      title: "The Paapeli AIoT platform",
      description:
        "Device management, real-time monitoring, OTA updates and AI analytics in one cloud platform, running on our cloud or inside your own infrastructure.",
    },
    fa: {
      title: "پلتفرم AIoT پاپلی",
      description:
        "مدیریت دستگاه، پایش لحظه‌ای، به‌روزرسانی OTA و تحلیل هوش مصنوعی در یک پلتفرم ابری؛ روی ابر پاپلی یا زیرساخت خودتان.",
    },
    ar: {
      title: "منصة AIoT من بابيلي",
      description:
        "إدارة الأجهزة والمراقبة اللحظية وتحديثات OTA وتحليلات الذكاء الاصطناعي في منصة سحابية واحدة، على سحابتنا أو داخل بنيتك التحتية.",
    },
  },
  "/careers": {
    en: {
      title: "Careers and internships at Paapeli",
      description:
        "Join the team building Paapeli's cloud, AI and IoT platform. Now hiring a senior business developer, a senior backend engineer (Java / AIoT) and a senior Go developer (Cloud Management) in Tehran.",
    },
    fa: {
      title: "فرصت‌های همکاری و کارآموزی در پاپلی",
      description:
        "به تیمی بپیوندید که پلتفرم ابری، هوش مصنوعی و اینترنت اشیای پاپلی را می‌سازد. استخدام توسعه‌دهنده ارشد کسب‌وکار، توسعه‌دهنده ارشد بک‌اند (Java / AIoT) و توسعه‌دهنده ارشد Go (Cloud Management) در تهران.",
    },
    ar: {
      title: "الوظائف والتدريب في بابيلي",
      description:
        "انضم إلى الفريق الذي يبني منصة بابيلي السحابية للذكاء الاصطناعي وإنترنت الأشياء. نوظف الآن مطور أعمال أول ومطورًا خلفيًا أول (Java / AIoT) ومطور Go أول (Cloud Management) في طهران.",
    },
  },
  "/contact": {
    en: {
      title: "Contact Paapeli",
      description:
        "Talk to the team about a deployment, a pilot, or a question the documentation did not answer.",
    },
    fa: {
      title: "تماس با پاپلی",
      description:
        "دربارهٔ استقرار، اجرای آزمایشی یا هر پرسشی که در مستندات پاسخش را نیافتید، با تیم ما صحبت کنید.",
    },
    ar: {
      title: "تواصل مع بابيلي",
      description:
        "تحدث مع الفريق حول التنفيذ أو مشروع تجريبي أو أي سؤال لم تجد إجابته في الوثائق.",
    },
  },
  "/ddos-protection": {
    en: {
      title: "DDoS protection for IoT infrastructure",
      description:
        "Keep devices, dashboards and APIs reachable while an attack is in progress, with traffic filtering built into the platform rather than bolted on.",
    },
    fa: {
      title: "محافظت از زیرساخت اینترنت اشیا در برابر حملات DDoS",
      description:
        "دستگاه‌ها، داشبوردها و APIها حتی در میانهٔ حمله در دسترس می‌مانند؛ فیلترینگ ترافیک درون خود پلتفرم، نه به‌صورت افزودنی.",
    },
    ar: {
      title: "الحماية من هجمات DDoS لبنية إنترنت الأشياء",
      description:
        "إبقاء الأجهزة ولوحات التحكم وواجهات البرمجة متاحة أثناء الهجوم، بتصفية للحركة مدمجة في المنصة نفسها.",
    },
  },
  "/edge-computing": {
    en: {
      title: "Edge computing for IoT deployments",
      description:
        "Process data next to the machines that produce it: lower latency, less bandwidth, and local control that keeps working when the link to the cloud does not.",
    },
    fa: {
      title: "پردازش لبه برای استقرارهای اینترنت اشیا",
      description:
        "پردازش داده در کنار همان دستگاهی که تولیدش می‌کند: تأخیر کمتر، پهنای باند کمتر و کنترل محلی که با قطع‌شدن ارتباط ابر هم کار می‌کند.",
    },
    ar: {
      title: "الحوسبة الطرفية لمشاريع إنترنت الأشياء",
      description:
        "معالجة البيانات بجوار الأجهزة التي تنتجها: زمن استجابة أقل، واستهلاك أقل للنطاق، وتحكم محلي يستمر عند انقطاع الاتصال بالسحابة.",
    },
  },
  "/energy-monitoring": {
    en: {
      title: "AIoT technology for energy monitoring",
      description:
        "Paapeli is an AIoT technology provider. Energy-intensive sites and the ESCOs, panel builders and contractors that serve them can both use our cloud infrastructure, edge computing and IoT to measure, verify and reduce consumption.",
    },
    fa: {
      title: "فناوری AIoT برای پایش انرژی",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مصرف‌کنندگان بزرگ انرژی و همچنین شرکت‌های خدمات انرژی (ESCO)، تابلوسازان و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای اندازه‌گیری، صحه‌گذاری و کاهش مصرف استفاده کنند.",
    },
    ar: {
      title: "تقنية AIoT لمراقبة الطاقة",
      description:
        "بابيلي مزوّد لتقنية AIoT. تستطيع المواقع كثيفة الاستهلاك وشركات خدمات الطاقة (ESCO) وصانعو اللوحات والمقاولون استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لقياس الاستهلاك والتحقق منه وخفضه.",
    },
  },
  "/features/alerts-events": {
    en: {
      title: "Alerts & event management",
      description:
        "Detect critical events instantly and get alerted before they turn critical, with rules, severities, escalation policies and the channels your team already uses.",
    },
    fa: {
      title: "هشدارها و مدیریت رویداد",
      description:
        "رویدادهای حیاتی را بی‌درنگ تشخیص دهید و پیش از بحرانی شدن هشدار بگیرید، با قواعد، سطوح اهمیت، سیاست‌های تشدید و همان کانال‌هایی که تیم شما امروز استفاده می‌کند.",
    },
    ar: {
      title: "التنبيهات وإدارة الأحداث",
      description:
        "اكتشف الأحداث الحرجة فورًا واحصل على تنبيه قبل تفاقمها، بقواعد ومستويات خطورة وسياسات تصعيد وقنوات يستخدمها فريقك فعلًا.",
    },
  },
  "/features/anomaly-detection": {
    en: {
      title: "Anomaly detection on live data",
      description:
        "Identify abnormal data patterns to catch problems early and prevent sudden failures, including the slow drifts no fixed threshold would ever trigger.",
    },
    fa: {
      title: "تشخیص ناهنجاری روی دادهٔ زنده",
      description:
        "الگوهای غیرعادی داده را شناسایی کنید تا مشکل را زود بگیرید و از خرابی ناگهانی جلوگیری کنید، از جمله انحراف‌های آرامی که هیچ آستانهٔ ثابتی آن‌ها را نمی‌گیرد.",
    },
    ar: {
      title: "كشف الشذوذ على البيانات الحيّة",
      description:
        "حدّد الأنماط غير الطبيعية لالتقاط المشكلات مبكرًا ومنع الأعطال المفاجئة، بما فيها الانحرافات البطيئة التي لا تلتقطها أي عتبة ثابتة.",
    },
  },
  "/features/device-management": {
    en: {
      title: "Device & gateway management at scale",
      description:
        "Manage devices and gateways at scale with support for industrial protocols such as MQTT, OPC-UA and Modbus. One inventory, one health view, one place to provision.",
    },
    fa: {
      title: "مدیریت دستگاه و گیت‌وی در مقیاس بزرگ",
      description:
        "دستگاه‌ها و گیت‌وی‌ها را در مقیاس بزرگ و با پشتیبانی از پروتکل‌های صنعتی مانند MQTT، OPC-UA و Modbus مدیریت کنید. یک فهرست واحد، یک نمای سلامت و یک نقطه برای راه‌اندازی.",
    },
    ar: {
      title: "إدارة الأجهزة والبوابات على نطاق واسع",
      description:
        "أدِر الأجهزة والبوابات على نطاق واسع بدعم بروتوكولات صناعية مثل MQTT وOPC-UA وModbus. مخزون واحد وعرض صحة واحد ومكان واحد للتهيئة.",
    },
  },
  "/features/flexible-deployment": {
    en: {
      title: "Flexible deployment, cloud or on-premise",
      description:
        "Deploy Paapeli on our cloud or on your own servers, based on your infrastructure, security and compliance requirements. Same platform, same panel, your choice of where the data lives.",
    },
    fa: {
      title: "استقرار انعطاف‌پذیر، ابری یا داخلی",
      description:
        "پاپلی را بر اساس زیرساخت، الزامات امنیتی و انطباق سازمان خود، روی ابر ما یا روی سرورهای خودتان مستقر کنید. پلتفرم و پنل یکسان است و انتخاب محل نگهداری داده با شماست.",
    },
    ar: {
      title: "نشر مرن، سحابي أو داخلي",
      description:
        "انشر بابيلي على سحابتنا أو على خوادمك وفق متطلبات بنيتك التحتية والأمن والامتثال. المنصة نفسها واللوحة نفسها، وأنت تختار مكان بقاء البيانات.",
    },
  },
  "/features/ota-updates": {
    en: {
      title: "OTA firmware & software updates",
      description:
        "Push firmware and software to distributed devices without site visits. Staged rollouts, safety guards and a full audit trail keep every fleet current and compliant.",
    },
    fa: {
      title: "به‌روزرسانی فرم‌ور و نرم‌افزار از راه دور",
      description:
        "فرم‌ور و نرم‌افزار را بدون مراجعهٔ میدانی روی دستگاه‌های پراکنده منتشر کنید. انتشار مرحله‌ای، محافظ‌های ایمنی و تاریخچهٔ کامل حسابرسی، هر ناوگان را به‌روز و منطبق نگه می‌دارد.",
    },
    ar: {
      title: "تحديثات البرامج الثابتة والبرمجيات عن بُعد",
      description:
        "انشر البرامج الثابتة والبرمجيات على الأجهزة الموزعة دون زيارات ميدانية. الإطلاق المرحلي وحمايات السلامة وسجل تدقيق كامل تُبقي كل أسطول محدّثًا ومتوافقًا.",
    },
  },
  "/features/predictive-analytics": {
    en: {
      title: "Predictive analytics & failure forecasting",
      description:
        "Analyze trends and forecast equipment failures so maintenance is planned around risk and reliability, not around the calendar.",
    },
    fa: {
      title: "تحلیل پیش‌بین و پیش‌بینی خرابی",
      description:
        "روندها را تحلیل و خرابی تجهیزات را پیش‌بینی کنید تا نگهداری بر پایهٔ ریسک و قابلیت اطمینان برنامه‌ریزی شود، نه بر پایهٔ تقویم.",
    },
    ar: {
      title: "التحليلات التنبؤية والتنبؤ بالأعطال",
      description:
        "حلّل الاتجاهات وتنبّأ بأعطال المعدات لتُخطَّط الصيانة حسب المخاطر والموثوقية لا حسب التقويم.",
    },
  },
  "/features/realtime-monitoring": {
    en: {
      title: "Real-time monitoring of devices and systems",
      description:
        "Follow device data and system performance moment by moment to keep full visibility over operations, from a single sensor value up to plant-level KPIs.",
    },
    fa: {
      title: "پایش لحظه‌ای دستگاه‌ها و سامانه",
      description:
        "دادهٔ دستگاه و کارایی سامانه را لحظه‌به‌لحظه دنبال کنید تا دید کاملی از عملیات داشته باشید، از مقدار یک حسگر تا شاخص‌های سطح کارخانه.",
    },
    ar: {
      title: "مراقبة لحظية للأجهزة والأنظمة",
      description:
        "تابع بيانات الأجهزة وأداء النظام لحظة بلحظة لتبقى الرؤية كاملة على العمليات، من قيمة مستشعر واحد إلى مؤشرات المصنع.",
    },
  },
  "/features/solution-templates": {
    en: {
      title: "Solution templates for every industry",
      description:
        "Start from a ready industry template, with device profiles, dashboards, alert rules and a location structure already in place, and reach value in days instead of quarters.",
    },
    fa: {
      title: "قالب‌های آمادهٔ راهکار برای هر صنعت",
      description:
        "از یک قالب آمادهٔ صنعتی شروع کنید که پروفایل دستگاه، داشبورد، قواعد هشدار و ساختار مکان را از پیش دارد، و در چند روز به ارزش برسید، نه چند فصل.",
    },
    ar: {
      title: "قوالب حلول لكل صناعة",
      description:
        "ابدأ من قالب صناعي جاهز يضم ملفات الأجهزة واللوحات وقواعد التنبيه وبنية المواقع، وحقّق القيمة في أيام لا في أشهر.",
    },
  },
  "/fleet-tracking": {
    en: {
      title: "AIoT technology for fleet and asset tracking",
      description:
        "Paapeli is an AIoT technology provider. Fleet owners and the telematics providers and contractors serving them can both use our cloud infrastructure, edge computing and IoT to track vehicles, equipment and cargo at scale.",
    },
    fa: {
      title: "فناوری AIoT برای ردیابی ناوگان و دارایی‌ها",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مالکان ناوگان و همچنین ارائه‌دهندگان تله‌متیکس و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای ردیابی خودرو، تجهیزات و بار در مقیاس بزرگ استفاده کنند.",
    },
    ar: {
      title: "تقنية AIoT لتتبّع الأساطيل والأصول",
      description:
        "بابيلي مزوّد لتقنية AIoT. يستطيع مالكو الأساطيل ومزوّدو التيليماتكس والمقاولون الذين يخدمونهم استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتتبّع المركبات والمعدات والشحنات على نطاق واسع.",
    },
  },
  "/intelligence-insight": {
    en: {
      title: "Intelligence Insight: AI analytics on device data",
      description:
        "Turn telemetry into trends, forecasts and recommendations, with dashboards and KPIs you assemble yourself rather than wait for.",
    },
    fa: {
      title: "اینتلیجنس اینسایت: تحلیل هوش مصنوعی روی دادهٔ دستگاه‌ها",
      description:
        "تبدیل داده‌های تله‌متری به روند، پیش‌بینی و پیشنهاد؛ با داشبورد و شاخص‌هایی که خودتان می‌سازید.",
    },
    ar: {
      title: "رؤى ذكية: تحليلات الذكاء الاصطناعي لبيانات الأجهزة",
      description:
        "تحويل بيانات القياس عن بُعد إلى اتجاهات وتنبؤات وتوصيات، مع لوحات ومؤشرات تبنيها بنفسك.",
    },
  },
  "/oil-gas": {
    en: {
      title: "AIoT technology for oil and gas",
      description:
        "Paapeli is an AIoT technology provider. Oil and gas operators and EPC or field-service contractors alike can build on our cloud infrastructure, edge computing, and IoT stack to deliver smarter, safer energy services.",
    },
    fa: {
      title: "فناوری AIoT برای نفت و گاز",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. بهره‌برداران نفت و گاز و پیمانکاران EPC و خدمات میدانی، هر دو می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای ارائهٔ خدمات انرژی هوشمندتر و ایمن‌تر استفاده کنند.",
    },
    ar: {
      title: "تقنية AIoT للنفط والغاز",
      description:
        "بابيلي مزوّد لتقنية AIoT. يمكن لمشغّلي النفط والغاز ولمقاولي EPC والخدمات الميدانية الاعتماد على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتقديم خدمات طاقة أذكى وأكثر أماناً.",
    },
  },
  "/pricing": {
    en: {
      title: "Pricing",
      description:
        "Plans for a first prototype through to an industrial fleet, with pay-as-you-go and on-premise options alongside the hosted tiers.",
    },
    fa: {
      title: "تعرفه‌ها",
      description:
        "پلن‌ها از یک نمونهٔ اولیه تا ناوگان صنعتی، به‌همراه گزینه‌های پرداخت‌به‌اندازهٔ‌مصرف و استقرار درون‌سازمانی.",
    },
    ar: {
      title: "الأسعار",
      description:
        "خطط تناسب النموذج الأول وحتى الأسطول الصناعي، مع خيارات الدفع حسب الاستخدام والتركيب داخل المؤسسة.",
    },
  },
  "/request-demo": {
    en: {
      title: "Request a demo",
      description:
        "See the platform running against your own use case, with an engineer walking through devices, dashboards and alerts.",
    },
    fa: {
      title: "درخواست دموی پلتفرم",
      description:
        "پلتفرم را روی سناریوی خودتان ببینید؛ یک مهندس دستگاه‌ها، داشبوردها و هشدارها را قدم‌به‌قدم نشان می‌دهد.",
    },
    ar: {
      title: "اطلب عرضًا توضيحيًا",
      description:
        "شاهد المنصة تعمل على حالتك الخاصة، مع مهندس يشرح الأجهزة ولوحات التحكم والتنبيهات.",
    },
  },
  "/smart-agriculture": {
    en: {
      title: "AIoT technology for smart agriculture",
      description:
        "Paapeli is an AIoT technology provider. Growers and the irrigation companies, agritech firms and contractors serving them can all use our cloud infrastructure, edge computing and IoT to save water and raise yield.",
    },
    fa: {
      title: "فناوری AIoT برای کشاورزی هوشمند",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. کشاورزان و همچنین شرکت‌های آبیاری، اگری‌تک‌ها و پیمانکاران می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای صرفه‌جویی آب و افزایش عملکرد محصول استفاده کنند.",
    },
    ar: {
      title: "تقنية AIoT للزراعة الذكية",
      description:
        "بابيلي مزوّد لتقنية AIoT. يستطيع المزارعون وشركات الري وشركات التقنية الزراعية والمقاولون استخدام بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتوفير المياه ورفع الإنتاجية.",
    },
  },
  "/smart-buildings": {
    en: {
      title: "AIoT technology for smart buildings",
      description:
        "Paapeli is an AIoT technology provider. Property owners, facility managers and the MEP contractors and system integrators serving them can all build on our cloud infrastructure, edge computing and IoT to run comfortable, efficient buildings.",
    },
    fa: {
      title: "فناوری AIoT برای ساختمان‌های هوشمند",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. مالکان ساختمان، مدیران تسهیلات و همچنین پیمانکاران تأسیسات و مجریان سیستم می‌توانند بر پایهٔ زیرساخت ابری، محاسبات لبه و IoT ما، ساختمان‌هایی آسوده و کم‌مصرف را اداره کنند.",
    },
    ar: {
      title: "تقنية AIoT للمباني الذكية",
      description:
        "بابيلي مزوّد لتقنية AIoT. يستطيع ملّاك العقارات ومديرو المرافق ومقاولو الأعمال الكهروميكانيكية ومكاملو الأنظمة البناء على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتشغيل مبانٍ مريحة وموفّرة.",
    },
  },
  "/smart-manufacturing": {
    en: {
      title: "AIoT technology for smart manufacturing",
      description:
        "Paapeli is an AIoT technology provider. Plant owners and the automation integrators and contractors who serve them can both build on our cloud, edge and IoT stack to run smarter, more available production lines.",
    },
    fa: {
      title: "فناوری AIoT برای تولید هوشمند",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. صاحبان کارخانه و همچنین پیمانکاران و مجریان اتوماسیون می‌توانند بر پایهٔ زیرساخت ابری، محاسبات لبه و IoT ما، خطوط تولید هوشمندتر و در دسترس‌تری را اجرا کنند.",
    },
    ar: {
      title: "تقنية AIoT للتصنيع الذكي",
      description:
        "بابيلي مزوّد لتقنية AIoT. يستطيع أصحاب المصانع ومكاملو الأتمتة والمقاولون الذين يخدمونهم البناء على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتشغيل خطوط إنتاج أذكى وأكثر جاهزية.",
    },
  },
  "/status": {
    en: {
      title: "Platform status",
      description:
        "Current availability of the Paapeli cloud, its APIs and the ingestion pipeline, with incident history.",
    },
    fa: {
      title: "وضعیت پلتفرم",
      description:
        "وضعیت لحظه‌ای ابر پاپلی، APIها و مسیر دریافت داده، به‌همراه تاریخچهٔ رخدادها.",
    },
    ar: {
      title: "حالة المنصة",
      description:
        "الحالة الحالية لسحابة بابيلي وواجهات البرمجة ومسار استقبال البيانات، مع سجل الأعطال.",
    },
  },
};

/** The meta for a route in one language, falling back to English. */
export function metaFor(locale: Locale, route: string): PageMeta | undefined {
  const entry = PAGE_META[route];
  if (!entry) return undefined;
  return entry[locale] ?? entry.en;
}
