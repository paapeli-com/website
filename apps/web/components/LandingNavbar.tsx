"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Blocks,
  Boxes,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
  Menu,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";
import paapeliLogoOnDark from "@/src/assets/paapeli-logo-on-dark.svg";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Mega-menu data (English copy from Figma; links are placeholders).  */
/* ------------------------------------------------------------------ */

type MenuItem = {
  /** Key into MENU_COPY, which holds the localized title and description. */
  id: string;
  href: string;
  /** Renders the "New" pill after the title. */
  isNew?: boolean;
  /** Swaps the chevron for a highlight icon in Paapeli orange. */
  featured?: boolean;
};
type MegaMenu = { columns: MenuItem[][] };

const MENUS: Record<string, MegaMenu> = {
  Products: {
    columns: [
      [
        { id: "aiotPlatform", href: "/aiot-platform" },
        { id: "edgeComputing", href: "/edge-computing" },
        /* Points at the designed feature page rather than the older stub. */
        { id: "ota", href: "/features/ota-updates" },
      ],
      [
        { id: "ddosProtection", href: "/ddos-protection" },
        { id: "intelligenceInsight", href: "/intelligence-insight" },
      ],
    ],
  },
  Solution: {
    columns: [
      [
        { id: "smartManufacturing", href: "/smart-manufacturing" },
        { id: "smartBuildings", href: "/smart-buildings" },
        { id: "assetFleetTracking", href: "/fleet-tracking" },
      ],
      [
        { id: "oilGasMonitoring", href: "/oil-gas" },
        { id: "smartAgriculture", href: "/smart-agriculture" },
        { id: "energyMonitoring", href: "/energy-monitoring" },
      ],
    ],
  },
  Ecosystem: {
    columns: [
      [
        { id: "developers", href: "https://api.paapeli.com/swagger-ui/index.html" },
        { id: "sdkApis", href: "https://docs.paapeli.com/docs/category/sdks" },
        { id: "partners", href: "#" },
      ],
      [
        { id: "whiteLabel", href: "#" },
        { id: "github", href: "https://github.com/paapeli-com" },
      ],
    ],
  },
  Resources: {
    columns: [
      [
        { id: "aiReadiness", href: "/AI-Readiness-Assessment", isNew: true, featured: true },
        { id: "docs", href: "https://docs.paapeli.com/" },
        { id: "reports", href: "/AI-Readiness-Assessment/report" },
      ],
      [
        { id: "blog", href: "https://paapeli.com/blog" },
        { id: "guides", href: "https://docs.paapeli.com/docs/category/getting-started" },
      ],
    ],
  },
};

/* Localized title + description for every mega-menu entry. */
const MENU_COPY: Record<string, Record<string, { title: string; description: string }>> = {
  en: {
    aiotPlatform: { title: "AIoT Platform", description: "AI-powered IoT cloud platform" },
    edgeComputing: { title: "Edge Computing", description: "Process data at the edge for faster insights" },
    ota: { title: "OTA", description: "Over-the-air firmware updates" },
    ddosProtection: { title: "DDoS Protection", description: "Secure your infrastructure from DDoS attacks" },
    intelligenceInsight: { title: "Intelligence Insight", description: "AI-powered analytics and insights" },
    smartManufacturing: { title: "Smart Manufacturing", description: "Connect machines, monitor production, and improve industrial performance." },
    oilGasMonitoring: { title: "Oil & Gas Monitoring", description: "Monitor distributed assets, operational conditions, and critical equipment." },
    smartBuildings: { title: "Smart Buildings", description: "Connect building systems and monitor energy, environment, and equipment." },
    smartAgriculture: { title: "Smart Agriculture", description: "Monitor environmental conditions, irrigation, and connected agricultural assets." },
    assetFleetTracking: { title: "Asset & Fleet Tracking", description: "Track vehicles, equipment, and mobile assets with real-time location and alerts." },
    energyMonitoring: { title: "Energy Monitoring", description: "Measure consumption, detect anomalies, and improve energy efficiency." },
    developers: { title: "Developer APIs", description: "Build industrial applications and integrations on top of the Paapeli platform." },
    sdkApis: { title: "SDKs", description: "Access SDKs and integration tools for connecting devices, systems, and external services." },
    partners: { title: "Partners", description: "Collaborate with Paapeli as a technology partner, system integrator, or hardware provider." },
    whiteLabel: { title: "White-Label Platform", description: "Launch your own branded industrial platform powered by Paapeli infrastructure." },
    github: { title: "GitHub", description: "Explore open-source components, code examples, and developer resources." },
    aiReadiness: { title: "AI Readiness Assessment", description: "Measure how ready your organisation is to create real value with AI across seven dimensions, free, in about 10 minutes." },
    docs: { title: "Documentation", description: "Technical docs and implementation guides." },
    reports: { title: "Reports & Insights", description: "Industry reports and data-driven insights." },
    blog: { title: "Blog", description: "Industry insights and platform updates." },
    guides: { title: "Guide", description: "Step-by-step guides to get you started." },
  },
  fa: {
    aiotPlatform: { title: "پلتفرم AIoT", description: "پلتفرم ابری اینترنت اشیا مبتنی بر هوش مصنوعی" },
    edgeComputing: { title: "رایانش لبه", description: "داده را در لبه پردازش کنید تا زودتر به بینش برسید" },
    ota: { title: "به‌روزرسانی OTA", description: "به‌روزرسانی فرم‌ور از راه دور" },
    ddosProtection: { title: "حفاظت در برابر DDoS", description: "زیرساخت خود را از حملات DDoS ایمن کنید" },
    intelligenceInsight: { title: "بینش هوشمند", description: "تحلیل و بینش مبتنی بر هوش مصنوعی" },
    smartManufacturing: { title: "تولید هوشمند", description: "ماشین‌ها را متصل کنید، تولید را پایش کنید و عملکرد صنعتی را بهبود دهید" },
    oilGasMonitoring: { title: "پایش نفت و گاز", description: "دارایی‌های پراکنده، شرایط عملیاتی و تجهیزات حیاتی را پایش کنید" },
    smartBuildings: { title: "ساختمان‌های هوشمند", description: "سامانه‌های ساختمان را متصل کنید و انرژی، محیط و تجهیزات را پایش کنید" },
    smartAgriculture: { title: "کشاورزی هوشمند", description: "شرایط محیطی، آبیاری و تجهیزات کشاورزی متصل را پایش کنید" },
    assetFleetTracking: { title: "ردیابی ناوگان و دارایی‌ها", description: "خودروها، تجهیزات و دارایی‌های متحرک را با موقعیت لحظه‌ای و هشدار ردیابی کنید" },
    energyMonitoring: { title: "پایش انرژی", description: "مصرف را اندازه بگیرید، ناهنجاری‌ها را تشخیص دهید و بهره‌وری انرژی را بالا ببرید" },
    developers: { title: "API برای توسعه‌دهندگان", description: "ساخت اپلیکیشن‌ها و یکپارچه‌سازی‌های صنعتی روی پلتفرم پاپلی" },
    sdkApis: { title: "SDK ها", description: "دسترسی به SDKها و ابزارهای یکپارچه‌سازی برای اتصال دستگاه‌ها، سامانه‌ها و سرویس‌های بیرونی" },
    partners: { title: "شرکا", description: "همکاری با پاپلی به‌عنوان شریک فناوری، مجری سامانه یا تأمین‌کنندهٔ سخت‌افزار" },
    whiteLabel: { title: "پلتفرم وایت‌لیبل", description: "راه‌اندازی پلتفرم صنعتی با برند خودتان، بر بستر زیرساخت پاپلی" },
    github: { title: "گیت‌هاب", description: "کاوش در کامپوننت‌های متن‌باز، نمونه‌کدها و منابع توسعه‌دهندگان" },
    aiReadiness: { title: "ارزیابی آمادگی هوش مصنوعی", description: "بسنجید سازمان شما تا چه اندازه برای خلق ارزش واقعی با هوش مصنوعی آماده است؛ در هفت بُعد، رایگان و حدود ۱۰ دقیقه" },
    docs: { title: "مستندات", description: "مستندات فنی و راهنمای پیاده‌سازی" },
    reports: { title: "گزارش‌ها و بینش‌ها", description: "گزارش‌های صنعتی و بینش‌های داده‌محور" },
    blog: { title: "بلاگ", description: "تحلیل‌های صنعتی و به‌روزرسانی‌های پلتفرم" },
    guides: { title: "راهنما", description: "راهنماهای گام‌به‌گام برای شروع کار" },
  },
  ar: {
    aiotPlatform: { title: "منصة AIoT", description: "منصة سحابية لإنترنت الأشياء مدعومة بالذكاء الاصطناعي" },
    edgeComputing: { title: "الحوسبة الطرفية", description: "عالج البيانات على الحافة للحصول على رؤى أسرع" },
    ota: { title: "تحديثات OTA", description: "تحديثات البرامج الثابتة عن بُعد" },
    ddosProtection: { title: "الحماية من DDoS", description: "أمّن بنيتك التحتية ضد هجمات DDoS" },
    intelligenceInsight: { title: "رؤى ذكية", description: "تحليلات ورؤى مدعومة بالذكاء الاصطناعي" },
    smartManufacturing: { title: "التصنيع الذكي", description: "اربط الآلات وراقب الإنتاج وحسّن الأداء الصناعي" },
    oilGasMonitoring: { title: "مراقبة النفط والغاز", description: "راقب الأصول الموزعة والظروف التشغيلية والمعدات الحرجة" },
    smartBuildings: { title: "المباني الذكية", description: "اربط أنظمة المبنى وراقب الطاقة والبيئة والمعدات" },
    smartAgriculture: { title: "الزراعة الذكية", description: "راقب الظروف البيئية والري والأصول الزراعية المتصلة" },
    assetFleetTracking: { title: "تتبع الأصول والأساطيل", description: "تتبع المركبات والمعدات والأصول المتنقلة بموقع لحظي وتنبيهات" },
    energyMonitoring: { title: "مراقبة الطاقة", description: "قِس الاستهلاك واكتشف الشذوذ وارفع كفاءة الطاقة" },
    developers: { title: "واجهات API للمطورين", description: "بناء تطبيقات وتكاملات صناعية فوق منصة بابيلي" },
    sdkApis: { title: "حِزم SDK", description: "الوصول إلى حِزم SDK وأدوات التكامل لربط الأجهزة والأنظمة والخدمات الخارجية" },
    partners: { title: "الشركاء", description: "التعاون مع بابيلي كشريك تقني أو مُكامِل أنظمة أو مزوّد أجهزة" },
    whiteLabel: { title: "منصة بعلامتك التجارية", description: "أطلق منصتك الصناعية بعلامتك التجارية اعتمادًا على بنية بابيلي" },
    github: { title: "GitHub", description: "استكشف المكونات مفتوحة المصدر وأمثلة الشيفرة وموارد المطورين" },
    aiReadiness: { title: "تقييم الجاهزية للذكاء الاصطناعي", description: "قِس مدى جاهزية مؤسستك لخلق قيمة حقيقية بالذكاء الاصطناعي عبر سبعة أبعاد، مجانًا وفي نحو 10 دقائق" },
    docs: { title: "التوثيق", description: "وثائق تقنية وأدلة التنفيذ" },
    reports: { title: "التقارير والرؤى", description: "تقارير القطاع ورؤى قائمة على البيانات" },
    blog: { title: "المدونة", description: "رؤى الصناعة وتحديثات المنصة" },
    guides: { title: "الدليل", description: "أدلة خطوة بخطوة للبدء" },
  },
};

/* Top-level items, in display order. `menu` links to a MEGA_MENU key.
   Route hrefs are language-relative and get prefixed with the active
   locale (e.g. "/pricing" -> "/en/pricing") when rendered. */
const NAV_ITEMS: { id: string; href?: string; menu?: keyof typeof MENUS }[] = [
  { id: "products", menu: "Products" },
  { id: "solution", menu: "Solution" },
  { id: "ecosystem", menu: "Ecosystem" },
  { id: "resources", menu: "Resources" },
  { id: "pricing", href: "/pricing" },
];

/* Top-level chrome copy per locale. Mega-menu contents stay English until
   translated copy exists. */
const NAV_COPY: Record<string, Record<string, string>> = {
  en: {
    products: "Products", solution: "Solution", ecosystem: "Ecosystem",
    resources: "Resources", pricing: "Pricing",
    dashboard: "Dashboard", toggleMenu: "Toggle menu", newBadge: "New",
  },
  fa: {
    products: "محصولات", solution: "راهکارها", ecosystem: "اکوسیستم",
    resources: "منابع", pricing: "تعرفه‌ها",
    dashboard: "داشبورد", toggleMenu: "باز و بسته کردن منو", newBadge: "جدید",
  },
  ar: {
    products: "المنتجات", solution: "الحلول", ecosystem: "النظام البيئي",
    resources: "المصادر", pricing: "الأسعار",
    dashboard: "لوحة التحكم", toggleMenu: "فتح القائمة", newBadge: "جديد",
  },
};

const LANGS = [
  { code: "en", label: "English (US)" },
  { code: "ar", label: "العربية" },
  { code: "fa", label: "فارسی" },
] as const;

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MegaMenuItem({ item }: { item: MenuItem }) {
  const { language } = useLanguage();
  const localize = (href: string) => (href.startsWith("/") ? `/${language}${href}` : href);
  const copy = (MENU_COPY[language] ?? MENU_COPY.en)[item.id];
  const newLabel = (NAV_COPY[language] ?? NAV_COPY.en).newBadge;
  /* Docs, the API reference and GitHub live off-site, so they open beside
     the marketing site instead of replacing it. */
  const external = item.href.startsWith("http");

  return (
    <Link
      href={localize(item.href)}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex w-full flex-col gap-1 rounded-lg border border-transparent p-3 transition-colors hover:border-[#ffcda1] hover:bg-[#fff7f0]"
    >
      <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        {copy.title}
        {/* The arrow only shows on hover, pointing into the reading direction. */}
        <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
        {item.isNew ? (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
            {newLabel}
          </span>
        ) : null}
      </p>
      <p className="text-[13px] leading-snug text-muted-foreground rtl:text-[12px]">{copy.description}</p>
    </Link>
  );
}

/* The bold panel on the trailing edge of every mega menu. Each menu gets its
   own pitch and its own destination, so the panel is the one place in the
   menu that argues for something rather than just listing links. */
const PROMO_COPY: Record<
  string,
  Record<string, { title: string; description: string; cta: string }>
> = {
  en: {
    Products: {
      title: "Build Intelligent Operations at Scale",
      description:
        "Connect devices, manage infrastructure, and turn operational data into AI-powered decisions.",
      cta: "Explore Platform",
    },
    Solution: {
      title: "One platform, six industries",
      description:
        "Manufacturing, oil & gas, energy, buildings, fleet and agriculture, each with a solution template that is ready on day one.",
      cta: "See the templates",
    },
    Ecosystem: {
      title: "Build on Paapeli",
      description:
        "APIs, SDKs and a white-label platform for integrators who ship an industrial product under their own brand.",
      cta: "Talk to Sales",
    },
    Resources: {
      title: "How ready are you for AI?",
      description:
        "Seven dimensions, about 10 minutes, free. Get a score for your organisation and a plan for what to fix first.",
      cta: "Start the assessment",
    },
    default: {
      title: "Build Intelligent Operations at Scale",
      description:
        "Connect devices, manage infrastructure, and turn operational data into AI-powered decisions.",
      cta: "Explore Platform",
    },
  },
  fa: {
    Products: {
      title: "عملیات هوشمند را در مقیاس بسازید",
      description:
        "دستگاه‌ها را متصل کنید، زیرساخت را مدیریت کنید و دادهٔ عملیاتی را به تصمیم‌های مبتنی بر هوش مصنوعی تبدیل کنید.",
      cta: "کاوش در پلتفرم",
    },
    Solution: {
      title: "یک پلتفرم، شش صنعت",
      description:
        "تولید، نفت و گاز، انرژی، ساختمان، ناوگان و کشاورزی، هر یک با یک قالب راهکار که از روز اول آماده است.",
      cta: "دیدن قالب‌ها",
    },
    Ecosystem: {
      title: "روی پاپلی بسازید",
      description:
        "APIها، SDKها و پلتفرم وایت‌لیبل، برای مجریانی که محصول صنعتی را با برند خودشان عرضه می‌کنند.",
      cta: "تماس با فروش",
    },
    Resources: {
      title: "چقدر برای هوش مصنوعی آماده‌اید؟",
      description:
        "هفت بُعد، حدود ۱۰ دقیقه، رایگان. امتیاز سازمان خود و برنامه‌ای برای اینکه از کجا شروع کنید بگیرید.",
      cta: "شروع ارزیابی",
    },
    default: {
      title: "عملیات هوشمند را در مقیاس بسازید",
      description:
        "دستگاه‌ها را متصل کنید، زیرساخت را مدیریت کنید و دادهٔ عملیاتی را به تصمیم‌های مبتنی بر هوش مصنوعی تبدیل کنید.",
      cta: "کاوش در پلتفرم",
    },
  },
  ar: {
    Products: {
      title: "ابنِ عمليات ذكية على نطاق واسع",
      description:
        "اربط الأجهزة، وأدِر البنية التحتية، وحوّل البيانات التشغيلية إلى قرارات مدعومة بالذكاء الاصطناعي.",
      cta: "استكشف المنصة",
    },
    Solution: {
      title: "منصة واحدة وست صناعات",
      description:
        "التصنيع والنفط والغاز والطاقة والمباني والأساطيل والزراعة، لكل منها قالب حل جاهز من اليوم الأول.",
      cta: "شاهد القوالب",
    },
    Ecosystem: {
      title: "ابنِ على بابيلي",
      description:
        "واجهات API وحِزم SDK ومنصة بعلامتك التجارية، للمُكامِلين الذين يقدّمون منتجًا صناعيًا باسمهم.",
      cta: "تحدّث إلى المبيعات",
    },
    Resources: {
      title: "ما مدى جاهزيتك للذكاء الاصطناعي؟",
      description:
        "سبعة أبعاد، نحو 10 دقائق، مجانًا. احصل على درجة مؤسستك وخطة لما يجب إصلاحه أولًا.",
      cta: "ابدأ التقييم",
    },
    default: {
      title: "ابنِ عمليات ذكية على نطاق واسع",
      description:
        "اربط الأجهزة، وأدِر البنية التحتية، وحوّل البيانات التشغيلية إلى قرارات مدعومة بالذكاء الاصطناعي.",
      cta: "استكشف المنصة",
    },
  },
};

/* Where each promo actually goes, and the icon that heads it. */
const PROMO_LINK: Record<string, { href: string; icon: LucideIcon }> = {
  Products: { href: "/aiot-platform", icon: Boxes },
  Solution: { href: "/features/solution-templates", icon: LayoutTemplate },
  Ecosystem: { href: "/contact", icon: Blocks },
  Resources: { href: "/AI-Readiness-Assessment", icon: Sparkles },
};

function PromoCard({ menuKey }: { menuKey: keyof typeof MENUS }) {
  const { language } = useLanguage();
  const table = PROMO_COPY[language] ?? PROMO_COPY.en;
  const copy = table[menuKey as string] ?? table.default;
  const link = PROMO_LINK[menuKey as string] ?? PROMO_LINK.Products;
  const Icon = link.icon;

  return (
    <aside className="hidden w-[280px] shrink-0 self-stretch xl:block">
      <div className="flex h-full flex-col items-start gap-4 rounded-xl border border-[#e5e7eb] bg-[#fbfcfd] p-6">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#fff1e6]">
          <Icon className="size-5 text-primary" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold leading-snug text-foreground">{copy.title}</p>
          <p className="text-[13px] leading-snug text-muted-foreground rtl:text-[12px]">
            {copy.description}
          </p>
        </div>
        <Link
          href={`/${language}${link.href}`}
          className="mt-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-primary px-4 text-[13px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {copy.cta}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </aside>
  );
}

function MegaMenuPanel({ menu, menuKey }: { menu: MegaMenu; menuKey: keyof typeof MENUS }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-9">
      <div className="flex items-start gap-12">
        {menu.columns.map((col, i) => (
          <div key={i} className="flex flex-1 flex-col gap-3">
            {col.map((item) => (
              <MegaMenuItem key={item.id} item={item} />
            ))}
          </div>
        ))}
        <PromoCard menuKey={menuKey} />
      </div>
    </div>
  );
}

/* Always-mounted dropdown wrapper. Handles three animations:
   • fade in/out as it opens and closes
   • height tween when switching between menus of different heights
   • content cross-fade (re-triggered via `key`) on each menu change      */
function MegaMenuDropdown({ openMenu }: { openMenu: keyof typeof MENUS | null }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  // Keep the last opened menu mounted so its content stays visible while the
  // dropdown collapses on close, instead of vanishing instantly.
  const [displayed, setDisplayed] = useState<keyof typeof MENUS | null>(openMenu);

  useEffect(() => {
    if (openMenu) setDisplayed(openMenu);
  }, [openMenu]);

  useEffect(() => {
    if (openMenu && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [openMenu, displayed]);

  return (
    <div
      aria-hidden={!openMenu}
      style={{ height: openMenu ? height : 0 }}
      className={cn(
        "absolute inset-x-0 top-full overflow-hidden bg-white transition-[height,opacity] duration-300 ease-out",
        openMenu
          ? "border-b border-[#e5e7eb] opacity-100 shadow-[0px_4px_6px_-4px_rgba(29,41,61,0.1),0px_10px_15px_-3px_rgba(29,41,61,0.1)]"
          : "pointer-events-none opacity-0"
      )}
    >
      <div ref={contentRef}>
        {displayed && (
          <div key={displayed} className="duration-200 animate-in fade-in">
            <MegaMenuPanel menu={MENUS[displayed]} menuKey={displayed} />
          </div>
        )}
      </div>
    </div>
  );
}

function LanguageMenu({ onDark = false }: { onDark?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium transition-colors",
          onDark ? "text-white/85 hover:text-white" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className="size-[18px] transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute end-0 top-full z-50 mt-2 w-44 rounded-lg border border-[#e5e7eb] bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {LANGS.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[#f9fafb]",
              language === lang.code ? "font-medium text-primary" : "text-muted-foreground"
            )}
          >
              {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main navbar                                                        */
/* ------------------------------------------------------------------ */

/**
 * `overlay` floats the bar transparently over a dark hero image and only
 * paints it solid once the page scrolls or a menu opens. Pages without a
 * dark hero leave it off and get the plain white bar.
 */
export const LandingNavbar = ({ overlay = false }: { overlay?: boolean }) => {
  const { isRTL, language } = useLanguage();
  const nav = NAV_COPY[language] ?? NAV_COPY.en;
  const [openMenu, setOpenMenu] = useState<keyof typeof MENUS | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  /* Transparent only while sitting untouched at the top of a dark hero. */
  const solid = !overlay || scrolled || openMenu !== null || mobileOpen;

  /* Prefix internal routes with the active locale; leave "#" links as-is. */
  const localize = (href: string) =>
    href.startsWith("/") ? `/${language}${href === "/" ? "" : href}` : href;

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      onMouseLeave={() => setOpenMenu(null)}
      className={cn(
        "z-50 w-full border-b transition-colors duration-300",
        overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
        solid ? "border-[#e5e7eb] bg-white" : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-6 py-3">
        {/* Logo */}
        <Link href={localize("/")} className="flex shrink-0 items-center gap-1.5">
          <span className="relative block size-[30px] shrink-0">
            <Image
              src={paapeliLogo}
              alt="Paapeli"
              width={30}
              height={30}
              priority
              className={cn("transition-opacity duration-300", solid ? "opacity-100" : "opacity-0")}
            />
            {overlay ? (
              <Image
                src={paapeliLogoOnDark}
                alt=""
                aria-hidden
                width={30}
                height={30}
                priority
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  solid ? "opacity-0" : "opacity-100"
                )}
              />
            ) : null}
          </span>
          <span className={cn("font-poppins text-xl font-semibold transition-colors", solid ? "text-foreground" : "text-white")}>
            Paapeli
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.menu ? (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setOpenMenu(item.menu!)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors",
                  solid ? "text-muted-foreground hover:text-foreground" : "text-white/85 hover:text-white"
                )}
              >
                {nav[item.id]}
                <ChevronDown
                  className={cn(
                    "size-[18px] transition-transform",
                    openMenu === item.menu && "rotate-180"
                  )}
                />
              </button>
            ) : (
              <Link
                key={item.id}
                href={localize(item.href ?? "#")}
                onMouseEnter={() => setOpenMenu(null)}
                className={cn(
                  "rounded-md text-sm font-medium transition-colors",
                  solid ? "text-muted-foreground hover:text-foreground" : "text-white/85 hover:text-white"
                )}
              >
                {nav[item.id]}
              </Link>
            )
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {/* Full navigation so the host redirects to the panel login on 8080. */}
          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
          >
            {nav.dashboard}
          </a>

          <div className={cn("hidden h-5 w-px transition-colors lg:block", solid ? "bg-[#e5e7eb]" : "bg-white/30")} />
          <div className="hidden lg:block">
            <LanguageMenu onDark={!solid} />
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={nav.toggleMenu}
            onClick={() => setMobileOpen((o) => !o)}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-lg transition-colors lg:hidden",
              solid ? "text-muted-foreground hover:bg-[#f9fafb]" : "text-white hover:bg-white/15"
            )}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      <MegaMenuDropdown openMenu={openMenu} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-100%)] overflow-y-auto border-t border-[#e5e7eb] bg-white px-6 py-4 shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1)] lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={localize(item.href ?? "#")}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f9fafb] hover:text-foreground"
              >
                {nav[item.id]}
              </Link>
            ))}
            <div className="mt-3 border-t border-[#e5e7eb] pt-3">
              <LanguageMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
