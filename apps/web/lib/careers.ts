import type { Locale } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Everything the careers page says, in the three site languages.      */
/*                                                                     */
/* The copy lives here rather than in the page so the two of them can  */
/* be read on their own: the page is layout, this is what a visitor    */
/* actually reads. A position that closes moves from `open` to         */
/* `archived` and keeps its wording, which is what the archive tab     */
/* shows.                                                              */
/*                                                                     */
/* `reference` is deliberately English in all three languages. It is   */
/* what the application email is titled with, and a subject line that  */
/* changes script depending on who applied is not sortable.            */
/* ------------------------------------------------------------------ */

/** A stack chip, coloured the way the position it belongs to is. */
export type Tone = "sky" | "violet" | "orange";

export type Track = {
  /** Stable across languages, so the picked track survives a translation. */
  id: string;
  stack: string;
  tone: Tone;
  title: string;
  body: string;
  /** What an intern on this track spends the three months doing. */
  does: string;
  /** What they are asked to bring, at the level an intern brings it. */
  expects: string;
  /** The longer wording the track picker inside the form shows. */
  option: string;
};

export type Highlight = { title: string; body: string };

/** A headed list on a position, the way a full job description reads. */
export type Section = { title: string; items: string[] };

export type Chip = {
  label: string;
  /** Draws the chip in Paapeli orange, for the one that carries weight. */
  accent?: boolean;
};

/** Anything the application form can be opened for. */
export type ApplyTarget = {
  id: string;
  reference: string;
  /** Names the position under the form heading. */
  shortTitle: string;
  /**
   * The small orange line above the form's heading, naming the kind of
   * application this is. It follows the position's own employment tag,
   * so an internship says so and a full time role says that instead.
   * An open application has no kind to name and leaves it off.
   */
  formEyebrow?: string;
  tracks?: Track[];
};

export type Position = ApplyTarget & {
  status: "open" | "archived";
  statusLabel: string;
  team: string;
  teamTone: Tone;
  location: string;
  term: string;
  /** How the work is engaged: an internship today, "full time" the day
      a permanent role is posted here. One tag, one word to change. */
  employment: string;
  title: string;
  /** How many people we are taking, shown next to the title. */
  capacity?: string;
  body: string;
  /** The same two lines a track carries, for a position that has no
      tracks to hang them on. */
  does?: string;
  expects?: string;
  highlights?: Highlight[];
  /** Responsibilities, requirements and the like, for a role that is
      described in full rather than in two lines. */
  sections?: Section[];
  chipsLabel: string;
  chips: Chip[];
  /** The line under the apply button. */
  applyNote: string;
};

export type CareersContent = {
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    lead: string;
  };
  values: { step: string; title: string; body: string }[];
  roles: {
    heading: string;
    lead: string;
    openTab: string;
    archiveTab: string;
    emptyArchive: string;
    /** The button on every position card. */
    apply: string;
    /** Heads the two lines under a track, or under a position without one. */
    doesLabel: string;
    expectsLabel: string;
  };
  positions: Position[];
  general: ApplyTarget & {
    label: string;
    title: string;
    body: string;
    action: string;
  };
  form: FormCopy;
};

export type FormCopy = {
  title: string;
  selected: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  link: string;
  linkPlaceholder: string;
  track: string;
  about: string;
  aboutPlaceholder: string;
  resume: string;
  resumeDrop: string;
  resumeHint: string;
  resumeRemove: string;
  resumeMissing: string;
  resumeWrongType: string;
  resumeTooBig: string;
  submit: string;
  submitting: string;
  success: string;
  /** The application landed but the PDF did not travel with it. */
  partial: string;
  failure: string;
  close: string;
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Persian reads its own digits. English and Arabic keep the Latin ones. */
export function localeDigits(value: number | string, locale: Locale): string {
  if (locale !== "fa") return String(value);
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

const en: CareersContent = {
  hero: {
    badge: "Growth and innovation at Paapeli",
    title: "Build the next generation of systems",
    titleAccent: "where cloud, AI and IoT meet",
    lead: "Paapeli builds cloud infrastructure, intelligent processing and industrial data connectivity at the frontier of what technology can do. We are looking for curious, precise and bold minds to architect the future of scalable intelligent systems together.",
  },
  values: [
    {
      step: "01",
      title: "Problems at industrial scale",
      body: "Work on distributed architectures, the reliability of cloud infrastructure and real time processing of large industrial data, with high availability and the lowest latency we can reach.",
    },
    {
      step: "02",
      title: "Fast growth and deep teamwork",
      body: "A structured learning path, direct technical and product mentorship, and a clear route to growing with the team.",
    },
    {
      step: "03",
      title: "Output first, balanced work",
      body: "The day starts at 10 in the morning, focus time is respected, documentation is part of how we work, and you have a direct say in key product decisions.",
    },
  ],
  roles: {
    heading: "Openings and internships",
    lead: "Pick the role that fits you and grow with the Paapeli team.",
    openTab: "Open roles",
    archiveTab: "Archive",
    emptyArchive:
      "Nothing is archived yet. Send an open application and we will come back to you when the right role opens.",
    apply: "Send your resume",
    doesLabel: "In this role:",
    expectsLabel: "What we expect:",
  },
  positions: [
    {
      id: "senior-backend-aiot",
      reference: "Senior Backend Engineer (Java / AIoT)",
      shortTitle: "Senior Backend Engineer (Java / AIoT)",
      formEyebrow: "Paapeli job application",
      status: "open",
      statusLabel: "Accepting applications",
      team: "Backend & AIoT Platform",
      teamTone: "orange",
      location: "Tehran",
      term: "Senior level",
      employment: "Full time",
      title: "Senior Backend Engineer (Java / AIoT)",
      body: "Paapeli builds a platform that connects devices, processes their data and makes industries and businesses smarter. We are looking for a senior backend engineer to take technical ownership of the AIoT product's backend and to have a direct hand in its architecture, development and reliability.",
      sections: [
        {
          title: "Responsibilities",
          items: [
            "Take technical ownership of the AIoT platform backend: learn the existing codebase, then maintain and extend it in Java and Spring Boot",
            "Design and build the APIs and services behind device management, telemetry, alarms and device commands",
            "Extend the integration layer over the platform's IoT core and the MQTT path that device data arrives on",
            "Build and harden multi-tenancy, authentication and role based access control",
            "Improve the performance, security, reliability and observability of services in production",
            "Design data models and optimise the database and asynchronous processing",
            "Bring AI capabilities into the product together with the AI team",
            "Document technical decisions, review code and set the engineering standards of the backend team",
          ],
        },
        {
          title: "Requirements",
          items: [
            "At least 5 years of experience building and running production services in Java and Spring Boot",
            "Strong REST API design, OpenAPI documentation, data modelling, SQL and query optimisation",
            "Hands on experience with authentication and access control (Spring Security, JWT, OAuth 2.0) and with multi-tenant systems",
            "Working knowledge of service architecture, distributed systems and event driven processing",
            "Experience with message brokers, caching and failure handling between services",
            "Able to debug production issues from logs and performance metrics",
            "Experience with automated testing, Git, Docker and CI/CD, and familiarity with deploying on Kubernetes",
            "Able to take over and understand an existing codebase, drive work independently and discuss technical disagreements constructively",
          ],
        },
        {
          title: "Nice to have",
          items: [
            "Experience with MQTT, time series data and stream processing",
            "A background in device data ingestion, device fleet management or OTA updates",
            "Experience designing rule, alarm and notification engines",
            "Practical familiarity with AI model APIs and inference services",
          ],
        },
        {
          title: "Why Paapeli",
          items: [
            "Direct impact on a growing product, working on real problems where IoT meets AI",
            "A real say in technical decisions and ownership of the backend architecture",
            "Compensation agreed in line with your experience, ability and scope of responsibility",
          ],
        },
      ],
      chipsLabel: "Stack:",
      chips: [
        { label: "Java" },
        { label: "Spring Boot" },
        { label: "REST API" },
        { label: "MQTT" },
        { label: "Docker / Kubernetes" },
      ],
      applyNote: "With a short note about your experience",
    },
    {
      id: "backend-intern",
      reference: "Backend Intern (Go / Java)",
      shortTitle: "Backend Intern (Go / Java)",
      formEyebrow: "Paapeli internship application",
      status: "archived",
      statusLabel: "Closed",
      team: "Backend & Cloud Infrastructure",
      teamTone: "sky",
      location: "Tehran (on site, starts at 10)",
      term: "Three months, with a path to staying on",
      employment: "Internship",
      title: "Backend Intern",
      capacity: "2 openings",
      body: "Paapeli is building an AI powered cloud platform. To grow two parts of that platform, we are inviting two backend development interns to join us:",
      tracks: [
        {
          id: "cloud-management",
          stack: "GO",
          tone: "sky",
          title: "Track 1: Cloud Management",
          body: "Build the core of our cloud infrastructure management, the distributed systems behind it and the Paapeli processing pipelines.",
          does: "You work alongside the team on small parts of our Go services, write a simple API, and move data between a service and the database with a mentor next to you.",
          expects: "Programming fundamentals, a grasp of what an API is, a little Go, and asking whenever you get stuck.",
          option: "Track 1: the Paapeli cloud core in Go (Cloud Management)",
        },
        {
          id: "aiot-platform",
          stack: "Java & Spring Boot",
          tone: "orange",
          title: "Track 2: AIoT Platform",
          body: "Build the IoT platform services, device management and real time industrial event handling.",
          does: "You work on the Java services with the team's guidance, store and read device data, and follow an event from the device all the way to the dashboard.",
          expects: "Java and object oriented basics, a little work with databases, and an appetite for learning Spring Boot.",
          option: "Track 2: the AIoT platform in Java and Spring Boot",
        },
      ],
      chipsLabel: "Core skills:",
      chips: [
        { label: "Backend fundamentals" },
        { label: "Designing and using APIs" },
        { label: "Databases" },
        { label: "Git and teamwork" },
      ],
      applyNote: "With a short note about your projects",
    },
    {
      id: "product-management-intern",
      reference: "Product Management Intern (AIoT)",
      shortTitle: "Product Management Intern (AIoT)",
      formEyebrow: "Paapeli internship application",
      status: "archived",
      statusLabel: "Closed",
      team: "Product Management",
      teamTone: "violet",
      location: "Tehran (on site, starts at 10)",
      term: "Three months, with a path to staying on",
      employment: "Internship",
      title: "Product Management Intern (AIoT)",
      body: "We are looking for a product management intern for the Paapeli AIoT product. In this role you help us understand what customers need, define the problems precisely, shape what the product does next, and follow the work through with the design and engineering team.",
      does: "You sit in the team's meetings, write down and summarise what users need, and document small features with a mentor next to you.",
      expects: "Clear and tidy writing, curiosity about what the user actually wants, and following a task through to the end.",
      highlights: [
        { title: "Deep curiosity", body: "A pull toward the root of a problem" },
        { title: "Asking the right questions", body: "A clear read on what users need" },
        { title: "Writing with order", body: "Crisp requirements and PRDs" },
        { title: "A taste for AI and IoT", body: "Real interest in product and technology" },
      ],
      chipsLabel: "To apply:",
      chips: [
        { label: "Send your resume" },
        { label: "A few lines on why product management appeals to you", accent: true },
      ],
      applyNote: "With a short note about what draws you in",
    },
  ],
  general: {
    id: "general",
    reference: "General application",
    shortTitle: "General application",
    label: "GENERAL APPLICATION",
    title: "Do not see the role you are looking for?",
    body: "If you work in AI, industrial hardware, DevOps, embedded systems or product development, and you want to make an impact at Paapeli scale, send us your resume.",
    action: "Send an open application",
  },
  form: {
    title: "Send your application",
    selected: "Selected role:",
    name: "Full name",
    namePlaceholder: "e.g. Ali Rezaei",
    phone: "Phone number",
    phonePlaceholder: "0912...",
    email: "Email",
    emailPlaceholder: "name@domain.com",
    link: "LinkedIn or GitHub (optional)",
    linkPlaceholder: "github.com/...",
    track: "Preferred track",
    about: "A short note about your projects or experience",
    aboutPlaceholder: "A few words about the university, personal or GitHub projects you have worked on so far...",
    resume: "Upload your resume (PDF, up to 5 MB)",
    resumeDrop: "Drag your resume here or choose a file",
    resumeHint: "Allowed format: PDF",
    resumeRemove: "Remove file",
    resumeMissing: "Please attach your resume as a PDF.",
    resumeWrongType: "Only a PDF file is accepted.",
    resumeTooBig: "The file is larger than 5 MB.",
    submit: "Send my resume",
    submitting: "Sending",
    success: "Thank you. Your application has been received and our team will be in touch.",
    partial:
      "Your application was received, but the file did not go through. Please email your resume to talk@paapeli.com.",
    failure: "That did not go through. Please try again, or email us at talk@paapeli.com.",
    close: "Close",
  },
};

const fa: CareersContent = {
  hero: {
    badge: "فرصت‌های رشد و نوآوری در پاپلی",
    title: "ساخت و توسعه سیستم‌های نسل بعد",
    titleAccent: "در تقاطع ابر، هوش مصنوعی و اینترنت اشیا",
    lead: "پاپلی زیرساخت ابری، پردازش هوشمند و اتصال داده‌های صنعتی را در مرزهای فناوری خلق می‌کند. ما به دنبال ذهن‌های کنجکاو، دقیق و جسور هستیم تا در کنار هم آینده سیستم‌های هوشمند مقیاس‌پذیر را معماری کنیم.",
  },
  values: [
    {
      step: "01",
      title: "حل مسائل در مقیاس صنعتی",
      body: "کار روی معماری‌های توزیع‌شده، پایداری زیرساخت‌های ابری و پردازش بلادرنگ کلان‌داده‌ها با قابلیت اطمینان بالا و کمترین تأخیر.",
    },
    {
      step: "02",
      title: "رشد شتاب‌یافته و کار عمیق تیمی",
      body: "ساختار یادگیری هدفمند، منتورشیپ مستقیم فنی و محصولی و مسیر شفاف برای رشد در کنار تیم.",
    },
    {
      step: "03",
      title: "تمرکز بر خروجی و تعادل حرفه‌ای",
      body: "ساعت شروع کار از ۱۰ صبح، احترام به زمان تمرکز، فرهنگ مستندسازی ساختاریافته و امکان اثرگذاری مستقیم بر تصمیمات کلیدی محصول.",
    },
  ],
  roles: {
    heading: "موقعیت‌های همکاری و کارآموزی",
    lead: "موقعیت مناسب خود را انتخاب کنید و همراه تیم پاپلی رشد کنید.",
    openTab: "فرصت‌های فعال",
    archiveTab: "آرشیو",
    emptyArchive:
      "فعلاً موقعیت آرشیوشده‌ای وجود ندارد. رزومه آزاد بفرستید تا با باز شدن موقعیت مناسب با شما تماس بگیریم.",
    apply: "ارسال رزومه",
    doesLabel: "در این نقش:",
    expectsLabel: "انتظار ما:",
  },
  positions: [
    {
      id: "senior-backend-aiot",
      reference: "Senior Backend Engineer (Java / AIoT)",
      shortTitle: "توسعه‌دهنده ارشد بک‌اند (Java / AIoT)",
      formEyebrow: "فرم درخواست همکاری پاپلی",
      status: "open",
      statusLabel: "پذیرش فعال",
      team: "Backend & AIoT Platform",
      teamTone: "orange",
      location: "تهران",
      term: "سطح ارشد",
      employment: "تمام‌وقت",
      title: "توسعه‌دهنده ارشد بک‌اند (Senior Backend Engineer - Java / AIoT)",
      body: "پاپلی پلتفرمی برای اتصال دستگاه‌ها، پردازش داده و هوشمندسازی صنایع و کسب‌وکارها می‌سازد. به دنبال یک توسعه‌دهنده ارشد بک‌اند هستیم که مسئولیت فنی بک‌اند محصول AIoT را به عهده بگیرد و در تصمیم‌های معماری، توسعه و پایداری محصول نقش مستقیم داشته باشد.",
      sections: [
        {
          title: "مسئولیت‌ها",
          items: [
            "به عهده گرفتن مالکیت فنی بک‌اند پلتفرم AIoT: شناخت کد موجود، نگهداری و توسعه آن با Java و Spring Boot",
            "طراحی و توسعه APIها و سرویس‌های مدیریت دستگاه، تله‌متری، هشدار و ارسال فرمان به دستگاه",
            "توسعه لایه یکپارچه‌سازی با هسته IoT پلتفرم و مسیر دریافت داده دستگاه‌ها روی MQTT",
            "پیاده‌سازی و بهبود چندمستاجری، احراز هویت و کنترل دسترسی نقش‌محور",
            "بهبود عملکرد، امنیت، پایداری و مشاهده‌پذیری سرویس‌ها در محیط عملیاتی",
            "طراحی مدل داده، بهینه‌سازی پایگاه داده و پردازش‌های غیرهم‌زمان",
            "اتصال قابلیت‌های هوش مصنوعی به محصول با همکاری تیم AI",
            "مستندسازی تصمیم‌های فنی، بازبینی کد و پایه‌گذاری استانداردهای مهندسی تیم بک‌اند",
          ],
        },
        {
          title: "الزامات",
          items: [
            "حداقل ۵ سال تجربه در توسعه و نگهداری سرویس‌های عملیاتی با Java و Spring Boot",
            "تسلط بر طراحی REST API، مستندسازی با OpenAPI، مدل‌سازی داده، SQL و بهینه‌سازی کوئری",
            "تجربه عملی در احراز هویت و کنترل دسترسی (Spring Security، JWT و OAuth 2.0) و طراحی سامانه‌های چندمستاجری",
            "شناخت عملی معماری سرویس‌ها، سیستم‌های توزیع‌شده و پردازش رویدادمحور",
            "تجربه کار با Message Broker و Cache و مدیریت خطا در ارتباط بین سرویس‌ها",
            "توانایی عیب‌یابی مشکلات محیط عملیاتی با تحلیل لاگ و شاخص‌های عملکرد",
            "تجربه کار با تست خودکار، Git، Docker و CI/CD و آشنایی با استقرار روی Kubernetes",
            "توانایی تحویل گرفتن و فهم یک کد موجود، پیش‌بردن مستقل کارها و گفت‌وگوی سازنده درباره اختلاف‌نظرهای فنی",
          ],
        },
        {
          title: "امتیاز محسوب می‌شود",
          items: [
            "تجربه MQTT، داده‌های سری زمانی و پردازش جریان داده",
            "سابقه توسعه سامانه‌های دریافت داده از دستگاه، مدیریت ناوگان دستگاه‌ها یا به‌روزرسانی OTA",
            "تجربه طراحی موتور قواعد، هشدار و اعلان",
            "آشنایی کاربردی با API مدل‌های هوش مصنوعی و سرویس‌های استنتاج",
          ],
        },
        {
          title: "چرا پاپلی",
          items: [
            "اثرگذاری مستقیم روی یک محصول در حال رشد و کار روی مسائل واقعی در مرز اینترنت اشیا و هوش مصنوعی",
            "مشارکت جدی در تصمیم‌های فنی و مالکیت معماری بک‌اند",
            "حقوق متناسب با سطح تجربه، توانمندی و دامنه مسئولیت، به صورت توافقی",
          ],
        },
      ],
      chipsLabel: "فناوری‌ها:",
      chips: [
        { label: "Java" },
        { label: "Spring Boot" },
        { label: "REST API" },
        { label: "MQTT" },
        { label: "Docker / Kubernetes" },
      ],
      applyNote: "همراه با توضیح کوتاه تجربه‌ها",
    },
    {
      id: "backend-intern",
      reference: "Backend Intern (Go / Java)",
      shortTitle: "کارآموز توسعه بک‌اند (Go / Java)",
      formEyebrow: "فرم درخواست کارآموزی پاپلی",
      status: "archived",
      statusLabel: "بسته شده",
      team: "Backend & Cloud Infrastructure",
      teamTone: "sky",
      location: "تهران (حضوری - شروع ۱۰ صبح)",
      term: "دوره ۳ ماهه با امکان ادامه همکاری",
      employment: "کارآموزی",
      title: "کارآموز توسعه بک‌اند (Backend Intern)",
      capacity: "۲ نفر ظرفیت",
      body: "پاپلی در حال توسعه یک پلتفرم ابری هوش مصنوعی است. برای گسترش دو بخش از این پلتفرم، از ۲ کارآموز توسعه بک‌اند دعوت به همکاری می‌کنیم:",
      tracks: [
        {
          id: "cloud-management",
          stack: "GO",
          tone: "sky",
          title: "مسیر ۱: Cloud Management",
          body: "توسعه هسته مدیریت زیرساخت ابری، سیستم‌های توزیع‌شده و خطوط پردازشی پاپلی.",
          does: "کنار تیم روی بخش‌های کوچکی از سرویس‌های Go کار می‌کنی، یک API ساده می‌نویسی و با راهنمایی منتور داده را بین سرویس و پایگاه داده جابه‌جا می‌کنی.",
          expects: "آشنایی با مبانی برنامه‌نویسی و مفهوم API، کمی Go، و اینکه هر جا گیر کردی سؤال بپرسی.",
          option: "مسیر ۱: هسته ابری پاپلی با Go (Cloud Management)",
        },
        {
          id: "aiot-platform",
          stack: "Java & Spring Boot",
          tone: "orange",
          title: "مسیر ۲: AIoT Platform",
          body: "توسعه سرویس‌های پلتفرم اینترنت اشیا، مدیریت دستگاه‌ها و رویدادهای بلادرنگ صنعتی.",
          does: "با راهنمایی تیم روی سرویس‌های Java کار می‌کنی، اطلاعات دستگاه‌ها را ذخیره و بازیابی می‌کنی و می‌بینی یک رویداد از دستگاه تا داشبورد چه مسیری را طی می‌کند.",
          expects: "آشنایی با مبانی Java و شیءگرایی، کمی کار با پایگاه داده، و علاقه به یادگیری Spring Boot.",
          option: "مسیر ۲: پلتفرم AIoT با Java و Spring Boot",
        },
      ],
      chipsLabel: "مهارت‌های پایه:",
      chips: [
        { label: "مبانی توسعه Backend" },
        { label: "طراحی و استفاده از API" },
        { label: "پایگاه داده" },
        { label: "Git و کار تیمی" },
      ],
      applyNote: "همراه با توضیح کوتاه پروژه‌ها",
    },
    {
      id: "product-management-intern",
      reference: "Product Management Intern (AIoT)",
      shortTitle: "کارآموز مدیریت محصول (AIoT)",
      formEyebrow: "فرم درخواست کارآموزی پاپلی",
      status: "archived",
      statusLabel: "بسته شده",
      team: "Product Management",
      teamTone: "violet",
      location: "تهران (حضوری - شروع ۱۰ صبح)",
      term: "دوره ۳ ماهه با امکان ادامه همکاری",
      employment: "کارآموزی",
      title: "کارآموز مدیریت محصول (Product Management Intern - AIoT)",
      body: "در پاپلی، برای محصول AIoT دنبال یک کارآموز مدیریت محصول هستیم. در این نقش کمک می‌کنی نیاز مشتری‌ها را بشناسیم، مسئله‌ها را دقیق تعریف کنیم، قابلیت‌های بعدی محصول را شکل بدهیم و اجرای آن‌ها را با تیم طراحی و توسعه پیگیری کنیم.",
      does: "در جلسات تیم شرکت می‌کنی، نیاز کاربر را می‌نویسی و جمع‌بندی می‌کنی و با راهنمایی منتور برای قابلیت‌های کوچک سند می‌نویسی.",
      expects: "نوشتن روشن و مرتب، کنجکاوی برای فهمیدن اینکه کاربر واقعاً چه می‌خواهد، و پیگیری کار تا آخر.",
      highlights: [
        { title: "کنجکاوی عمیق", body: "علاقه به واکاوی ریشه‌ای مسائل" },
        { title: "سؤال‌پرسیدن درست", body: "شناخت شفاف نیازهای کاربر" },
        { title: "نوشتن منظم", body: "تعریف شفاف نیازمندی‌ها و PRD" },
        { title: "شوق AI و IoT", body: "علاقه‌مند به محصول و فناوری" },
      ],
      chipsLabel: "پیش‌نیاز درخواست:",
      chips: [
        { label: "ارسال رزومه" },
        { label: "چند خط درباره اینکه چرا مدیریت محصول برایت جذاب است", accent: true },
      ],
      applyNote: "همراه با توضیح کوتاه انگیزه",
    },
  ],
  general: {
    id: "general",
    reference: "General application",
    shortTitle: "درخواست آزاد همکاری",
    label: "GENERAL APPLICATION",
    title: "موقعیت مد نظر خودت را در لیست نمی‌بینی؟",
    body: "اگر در حوزه‌های هوش مصنوعی، سخت‌افزار صنعتی، دواپس، سیستم‌های نهفته یا توسعه محصول تخصص داری و دوست داری در مقیاس پاپلی اثرگذار باشی، رزومه‌ات را برایمان بفرست.",
    action: "ارسال رزومه آزاد",
  },
  form: {
    title: "ارسال درخواست همکاری",
    selected: "موقعیت انتخاب‌شده:",
    name: "نام و نام خانوادگی",
    namePlaceholder: "مثلاً: علی رضایی",
    phone: "شماره تماس",
    phonePlaceholder: "0912...",
    email: "ایمیل",
    emailPlaceholder: "name@domain.com",
    link: "لینکدین یا گیت‌هاب (اختیاری)",
    linkPlaceholder: "github.com/...",
    track: "مسیر تخصصی مورد علاقه",
    about: "توضیح کوتاه درباره پروژه‌ها یا تجربیات انجام‌شده",
    aboutPlaceholder: "مختصری از پروژه‌های تحصیلی، شخصی یا گیت‌هاب که تاکنون روی آن‌ها کار کرده‌اید...",
    resume: "آپلود رزومه (PDF حداکثر ۵ مگابایت)",
    resumeDrop: "فایل رزومه را اینجا بکشید یا انتخاب کنید",
    resumeHint: "فرمت مجاز: PDF",
    resumeRemove: "حذف فایل",
    resumeMissing: "لطفاً رزومه خود را با فرمت PDF پیوست کنید.",
    resumeWrongType: "فقط فایل PDF پذیرفته می‌شود.",
    resumeTooBig: "حجم فایل بیشتر از ۵ مگابایت است.",
    submit: "ثبت و ارسال نهایی رزومه",
    submitting: "در حال ارسال",
    success: "ممنون. درخواست شما ثبت شد و تیم ما با شما تماس می‌گیرد.",
    partial:
      "درخواست شما ثبت شد، اما فایل رزومه ارسال نشد. لطفاً رزومه را به talk@paapeli.com ایمیل کنید.",
    failure: "ارسال نشد. دوباره تلاش کنید یا به talk@paapeli.com ایمیل بزنید.",
    close: "بستن",
  },
};

const ar: CareersContent = {
  hero: {
    badge: "فرص النمو والابتكار في بابيلي",
    title: "ابنِ أنظمة الجيل القادم",
    titleAccent: "عند تقاطع السحابة والذكاء الاصطناعي وإنترنت الأشياء",
    lead: "تبني بابيلي بنية سحابية ومعالجة ذكية واتصالًا لبيانات الصناعة عند حدود ما تقدمه التقنية. نبحث عن عقول فضولية ودقيقة وجريئة لنصمم معًا مستقبل الأنظمة الذكية القابلة للتوسع.",
  },
  values: [
    {
      step: "01",
      title: "حل مسائل بمقياس صناعي",
      body: "العمل على المعماريات الموزعة وموثوقية البنية السحابية ومعالجة البيانات الصناعية الضخمة لحظيًا بأعلى جاهزية وأقل زمن استجابة.",
    },
    {
      step: "02",
      title: "نمو سريع وعمل جماعي عميق",
      body: "مسار تعلم منظم وإرشاد تقني ومنتجي مباشر وطريق واضح للنمو مع الفريق.",
    },
    {
      step: "03",
      title: "تركيز على النتيجة وتوازن مهني",
      body: "يبدأ الدوام في العاشرة صباحًا، ونحترم وقت التركيز، والتوثيق جزء من طريقة عملنا، ولك أثر مباشر في قرارات المنتج الأساسية.",
    },
  ],
  roles: {
    heading: "الفرص والتدريب",
    lead: "اختر الدور المناسب لك وانمُ مع فريق بابيلي.",
    openTab: "فرص مفتوحة",
    archiveTab: "الأرشيف",
    emptyArchive:
      "لا يوجد شيء في الأرشيف حتى الآن. أرسل سيرة ذاتية مفتوحة وسنعاود التواصل معك عند فتح الدور المناسب.",
    apply: "إرسال السيرة الذاتية",
    doesLabel: "في هذا الدور:",
    expectsLabel: "ما نتوقعه:",
  },
  positions: [
    {
      id: "senior-backend-aiot",
      reference: "Senior Backend Engineer (Java / AIoT)",
      shortTitle: "مطور خلفي أول (Java / AIoT)",
      formEyebrow: "نموذج التقديم للعمل في بابيلي",
      status: "open",
      statusLabel: "التقديم مفتوح",
      team: "Backend & AIoT Platform",
      teamTone: "orange",
      location: "طهران",
      term: "مستوى أول",
      employment: "دوام كامل",
      title: "مطور خلفي أول (Senior Backend Engineer - Java / AIoT)",
      body: "تبني بابيلي منصة لربط الأجهزة ومعالجة بياناتها وجعل الصناعات والأعمال أكثر ذكاءً. نبحث عن مطور خلفي أول يتولى المسؤولية التقنية عن الواجهة الخلفية لمنتج AIoT ويكون له دور مباشر في قرارات المعمارية والتطوير واستقرار المنتج.",
      sections: [
        {
          title: "المسؤوليات",
          items: [
            "تولي الملكية التقنية للواجهة الخلفية لمنصة AIoT: فهم الشيفرة الحالية ثم صيانتها وتطويرها بلغة Java و Spring Boot",
            "تصميم وتطوير واجهات البرمجة والخدمات الخاصة بإدارة الأجهزة والقياسات والإنذارات وإرسال الأوامر إلى الأجهزة",
            "تطوير طبقة التكامل مع نواة إنترنت الأشياء في المنصة ومسار استقبال بيانات الأجهزة عبر MQTT",
            "بناء وتحسين تعدد المستأجرين والمصادقة والتحكم في الصلاحيات حسب الأدوار",
            "تحسين أداء الخدمات وأمانها واستقرارها وقابلية مراقبتها في بيئة الإنتاج",
            "تصميم نماذج البيانات وتحسين قاعدة البيانات والمعالجة غير المتزامنة",
            "ربط قدرات الذكاء الاصطناعي بالمنتج بالتعاون مع فريق الذكاء الاصطناعي",
            "توثيق القرارات التقنية ومراجعة الشيفرة ووضع المعايير الهندسية لفريق الواجهة الخلفية",
          ],
        },
        {
          title: "المتطلبات",
          items: [
            "خبرة لا تقل عن 5 سنوات في تطوير وتشغيل خدمات إنتاجية بلغة Java و Spring Boot",
            "إتقان تصميم REST API والتوثيق باستخدام OpenAPI ونمذجة البيانات و SQL وتحسين الاستعلامات",
            "خبرة عملية في المصادقة والتحكم في الصلاحيات (Spring Security و JWT و OAuth 2.0) وفي الأنظمة متعددة المستأجرين",
            "معرفة عملية بمعمارية الخدمات والأنظمة الموزعة والمعالجة المعتمدة على الأحداث",
            "خبرة في العمل مع Message Broker و Cache ومعالجة الأخطاء في التواصل بين الخدمات",
            "القدرة على تشخيص مشكلات بيئة الإنتاج عبر تحليل السجلات ومؤشرات الأداء",
            "خبرة في الاختبارات الآلية و Git و Docker و CI/CD ومعرفة بالنشر على Kubernetes",
            "القدرة على استلام شيفرة قائمة وفهمها، وإنجاز العمل باستقلالية، والنقاش البنّاء حول الخلافات التقنية",
          ],
        },
        {
          title: "مزايا إضافية",
          items: [
            "خبرة في MQTT وبيانات السلاسل الزمنية ومعالجة تدفق البيانات",
            "خلفية في أنظمة استقبال بيانات الأجهزة أو إدارة أساطيل الأجهزة أو تحديثات OTA",
            "خبرة في تصميم محركات القواعد والإنذارات والإشعارات",
            "معرفة عملية بواجهات نماذج الذكاء الاصطناعي وخدمات الاستدلال",
          ],
        },
        {
          title: "لماذا بابيلي",
          items: [
            "أثر مباشر في منتج ينمو، وعمل على مسائل حقيقية عند التقاء إنترنت الأشياء والذكاء الاصطناعي",
            "مشاركة فعلية في القرارات التقنية وملكية معمارية الواجهة الخلفية",
            "راتب يُتفق عليه بما يتناسب مع الخبرة والكفاءة ونطاق المسؤولية",
          ],
        },
      ],
      chipsLabel: "التقنيات:",
      chips: [
        { label: "Java" },
        { label: "Spring Boot" },
        { label: "REST API" },
        { label: "MQTT" },
        { label: "Docker / Kubernetes" },
      ],
      applyNote: "مع وصف قصير لخبراتك",
    },
    {
      id: "backend-intern",
      reference: "Backend Intern (Go / Java)",
      shortTitle: "متدرب تطوير خلفي (Go / Java)",
      formEyebrow: "نموذج التقديم للتدريب في بابيلي",
      status: "archived",
      statusLabel: "مغلق",
      team: "Backend & Cloud Infrastructure",
      teamTone: "sky",
      location: "طهران (حضوري، البداية 10 صباحًا)",
      term: "ثلاثة أشهر مع إمكانية الاستمرار",
      employment: "تدريب",
      title: "متدرب تطوير خلفي (Backend Intern)",
      capacity: "مقعدان",
      body: "تبني بابيلي منصة سحابية للذكاء الاصطناعي. لتوسيع جزأين من هذه المنصة ندعو متدربَين في تطوير الواجهة الخلفية للانضمام إلينا:",
      tracks: [
        {
          id: "cloud-management",
          stack: "GO",
          tone: "sky",
          title: "المسار 1: Cloud Management",
          body: "تطوير نواة إدارة البنية السحابية والأنظمة الموزعة وخطوط المعالجة في بابيلي.",
          does: "تعمل إلى جانب الفريق على أجزاء صغيرة من خدمات Go، وتكتب واجهة برمجة بسيطة، وتنقل البيانات بين الخدمة وقاعدة البيانات بإرشاد من مرشدك.",
          expects: "أساسيات البرمجة وفهم فكرة واجهة البرمجة، وقليل من Go، وأن تسأل كلما تعثرت.",
          option: "المسار 1: النواة السحابية لبابيلي بلغة Go (Cloud Management)",
        },
        {
          id: "aiot-platform",
          stack: "Java & Spring Boot",
          tone: "orange",
          title: "المسار 2: AIoT Platform",
          body: "تطوير خدمات منصة إنترنت الأشياء وإدارة الأجهزة والأحداث الصناعية اللحظية.",
          does: "تعمل على خدمات Java بإرشاد الفريق، وتخزن بيانات الأجهزة وتقرأها، وتتابع الحدث من الجهاز حتى لوحة التحكم.",
          expects: "أساسيات Java والبرمجة الكائنية، وقليل من العمل مع قواعد البيانات، ورغبة في تعلم Spring Boot.",
          option: "المسار 2: منصة AIoT بلغة Java و Spring Boot",
        },
      ],
      chipsLabel: "المهارات الأساسية:",
      chips: [
        { label: "أساسيات تطوير الخلفية" },
        { label: "تصميم واجهات البرمجة واستخدامها" },
        { label: "قواعد البيانات" },
        { label: "Git والعمل ضمن فريق" },
      ],
      applyNote: "مع وصف قصير لمشاريعك",
    },
    {
      id: "product-management-intern",
      reference: "Product Management Intern (AIoT)",
      shortTitle: "متدرب إدارة منتج (AIoT)",
      formEyebrow: "نموذج التقديم للتدريب في بابيلي",
      status: "archived",
      statusLabel: "مغلق",
      team: "Product Management",
      teamTone: "violet",
      location: "طهران (حضوري، البداية 10 صباحًا)",
      term: "ثلاثة أشهر مع إمكانية الاستمرار",
      employment: "تدريب",
      title: "متدرب إدارة منتج (Product Management Intern - AIoT)",
      body: "نبحث في بابيلي عن متدرب لإدارة منتج AIoT. في هذا الدور تساعدنا على فهم احتياجات العملاء وتعريف المسائل بدقة ورسم ملامح القدرات القادمة ومتابعة تنفيذها مع فريقي التصميم والتطوير.",
      does: "تحضر اجتماعات الفريق، وتدوّن احتياجات المستخدمين وتلخصها، وتوثّق القدرات الصغيرة بإرشاد من مرشدك.",
      expects: "كتابة واضحة ومرتبة، وفضول لمعرفة ما يريده المستخدم فعلًا، ومتابعة المهمة حتى نهايتها.",
      highlights: [
        { title: "فضول عميق", body: "شغف بالوصول إلى جذور المسائل" },
        { title: "طرح الأسئلة الصحيحة", body: "فهم واضح لاحتياجات المستخدم" },
        { title: "كتابة منظمة", body: "تعريف واضح للمتطلبات ووثائق المنتج" },
        { title: "شغف بالذكاء الاصطناعي وإنترنت الأشياء", body: "اهتمام حقيقي بالمنتج والتقنية" },
      ],
      chipsLabel: "متطلبات التقديم:",
      chips: [
        { label: "إرسال السيرة الذاتية" },
        { label: "بضعة أسطر عن سبب اهتمامك بإدارة المنتج", accent: true },
      ],
      applyNote: "مع وصف قصير لدوافعك",
    },
  ],
  general: {
    id: "general",
    reference: "General application",
    shortTitle: "طلب انضمام مفتوح",
    label: "GENERAL APPLICATION",
    title: "ألا تجد الدور الذي تبحث عنه؟",
    body: "إن كنت متخصصًا في الذكاء الاصطناعي أو العتاد الصناعي أو DevOps أو الأنظمة المدمجة أو تطوير المنتجات وتريد أثرًا بمقياس بابيلي، فأرسل لنا سيرتك الذاتية.",
    action: "إرسال سيرة ذاتية مفتوحة",
  },
  form: {
    title: "إرسال طلب الانضمام",
    selected: "الدور المختار:",
    name: "الاسم الكامل",
    namePlaceholder: "مثال: علي رضايي",
    phone: "رقم الهاتف",
    phonePlaceholder: "0912...",
    email: "البريد الإلكتروني",
    emailPlaceholder: "name@domain.com",
    link: "لينكدإن أو GitHub (اختياري)",
    linkPlaceholder: "github.com/...",
    track: "المسار المفضل",
    about: "وصف قصير لمشاريعك أو خبراتك",
    aboutPlaceholder: "نبذة عن مشاريعك الدراسية أو الشخصية أو تلك المنشورة على GitHub...",
    resume: "رفع السيرة الذاتية (PDF بحد أقصى 5 ميغابايت)",
    resumeDrop: "اسحب ملف السيرة الذاتية إلى هنا أو اختره",
    resumeHint: "الصيغة المسموحة: PDF",
    resumeRemove: "حذف الملف",
    resumeMissing: "الرجاء إرفاق سيرتك الذاتية بصيغة PDF.",
    resumeWrongType: "يُقبل ملف PDF فقط.",
    resumeTooBig: "حجم الملف أكبر من 5 ميغابايت.",
    submit: "إرسال الطلب والسيرة الذاتية",
    submitting: "جارٍ الإرسال",
    success: "شكرًا لك. وصلنا طلبك وسيتواصل معك فريقنا.",
    partial:
      "وصلنا طلبك، لكن الملف لم يُرسل. الرجاء إرسال سيرتك الذاتية إلى talk@paapeli.com.",
    failure: "لم يتم الإرسال. حاول مرة أخرى أو راسلنا على talk@paapeli.com.",
    close: "إغلاق",
  },
};

export const CAREERS: Record<Locale, CareersContent> = { en, fa, ar };

/** The careers copy for a language, falling back to English. */
export function careersContent(language: string): CareersContent {
  return CAREERS[language as Locale] ?? CAREERS.en;
}
