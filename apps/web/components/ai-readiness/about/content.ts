import {
  Boxes,
  Cloud,
  Cpu,
  Database,
  Gauge,
  Gem,
  ListChecks,
  MessagesSquare,
  Network,
  Rocket,
  Search,
  Settings2,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Workflow,
} from 'lucide-react';
import { companySites } from '../links';

/** All copy for the "درباره ارزیابی" page. */

/* Hero -------------------------------------------------------------------- */

export const heroLead =
  'این ارزیابی با ترکیب نگاه مدیریتی، تجربه اجرایی و توانمندی‌های فناوری طراحی شده است تا به سازمان‌ها کمک کند مسیر واقعی خلق ارزش از هوش مصنوعی را شناسایی کنند.';

/** Inputs feeding the hero diagram. */
export const heroInputs = [
  { icon: Target, label: 'استراتژی و اهداف' },
  { icon: Users, label: 'مدیریت و توانمندسازی' },
  { icon: Database, label: 'فناوری و داده' },
  { icon: Settings2, label: 'اجرا و راهکارهای AI' },
];

/** Outcomes the diagram resolves into. */
export const heroOutcomes = ['Value', 'Effectiveness', 'Productivity', 'Scale'];

/* "این ارزیابی چرا مهم است؟" ---------------------------------------------- */

export const whyCards = [
  {
    icon: Boxes,
    title: 'مقیاس‌پذیری',
    body: 'تمرکز بر اینکه سازمان از Pilot عبور کند و AI را به‌صورت پایدار و قابل تکرار در مقیاس اجرا کند.',
  },
  {
    icon: TrendingUp,
    title: 'Productivity',
    body: 'بررسی ظرفیت سازمان برای افزایش بهره‌وری از طریق اتوماسیون، کمک به تصمیم‌گیری و حذف اصطکاک‌های اجرایی.',
  },
  {
    icon: Gauge,
    title: 'Effectiveness',
    body: 'سنجش اینکه AI فقط کار را سریع‌تر نمی‌کند، بلکه تصمیم‌ها و نتایج را نیز بهتر می‌کند.',
  },
  {
    icon: Gem,
    title: 'خلق ارزش',
    body: 'تمرکز بر شناسایی فرصت‌هایی که به ارزش کسب‌وکار، درآمد، کیفیت تصمیم‌گیری یا کاهش هزینه منجر می‌شوند.',
  },
];

export const whyFootnote =
  'الهام‌گرفته از بینش‌های McKinsey درباره value creation، workflow redesign و scaling AI';

/* "چه کسانی پشت این ارزیابی هستند؟" --------------------------------------- */

export const companies = [
  {
    key: 'paapeli' as const,
    name: 'پاپلی',
    role: 'فناوری، زیرساخت ابری و هوش مصنوعی',
    site: companySites.paapeli,
    siteLabel: 'paapeli.com',
    body: 'پاپلی یک شرکت فناوری با تیمی برجسته و سال‌ها تجربه در حوزه زیرساخت ابری، هوش مصنوعی و اجرای پروژه‌های بزرگ است. تمرکز پاپلی بر طراحی و پیاده‌سازی زیرساخت، پلتفرم‌ها و راهکارهای AI برای سازمان‌هاست.',
    tags: [
      { icon: Cloud, label: 'زیرساخت ابری' },
      { icon: Database, label: 'داده و معماری' },
      { icon: Cpu, label: 'راهکارهای AI' },
    ],
  },
  {
    key: 'rayka' as const,
    name: 'رایکا',
    role: 'مشاوره مدیریت',
    site: companySites.rayka,
    siteLabel: 'raykaconsulting.com',
    body: 'رایکا یک شرکت مشاوره مدیریت است که به سازمان‌ها کمک می‌کند از insight به impact حرکت کنند. رویکرد رایکا ترکیبی از تحلیل، ساختاردهی مسئله و همراهی در اجراست تا تصمیم‌های مدیریتی به نتایج واقعی تبدیل شوند.',
    tags: [
      { icon: Search, label: 'تحلیل عمیق' },
      { icon: Network, label: 'استراتژی و ساختار' },
      { icon: Rocket, label: 'همراهی در اجرا' },
    ],
  },
];

/* "چرا همکاری رایکا و پاپلی مهم است؟" ------------------------------------- */

export const partnershipLead =
  'بسیاری از پروژه‌های AI یا در سطح استراتژی متوقف می‌شوند، یا بدون پیوند با کسب‌وکار و قابلیت‌های سازمانی به نتیجه نمی‌رسند. این همکاری برای پر کردن همین شکاف طراحی شده است.';

export const partnershipCards = [
  {
    icon: Users,
    tone: 'green' as const,
    title: 'نگاه مدیریتی',
    body: 'تعریف مسئله، اولویت‌بندی، هم‌راستاسازی با اهداف کسب‌وکار و تدوین مسیر ارزش‌آفرینی',
  },
  {
    icon: Cpu,
    tone: 'green' as const,
    title: 'توانمندی فناوری',
    body: 'ترجمه نیازهای کسب‌وکار به معماری، زیرساخت، داده و راهکارهای اجرایی AI',
  },
  {
    icon: Trophy,
    tone: 'orange' as const,
    title: 'احتمال موفقیت بالاتر',
    body: 'ترکیب استراتژی، اجرا و فناوری برای افزایش شانس پیاده‌سازی موفق، adoption و تحقق اثر واقعی',
  },
];

/* "پژوهش‌ها چه می‌گویند؟" -------------------------------------------------- */

export const researchQuotes = [
  {
    title: 'Scale نیازمند تغییر سازمانی است',
    body: 'مقیاس‌دهی AI صرفاً یک rollout فنی نیست؛ به governance، change management و مدل عملیاتی و KPI مناسب نیاز دارد.',
    source: "McKinsey, Moving past gen AI's honeymoon phase, 2024",
  },
  {
    title: 'ارزش از بازطراحی می‌آید',
    body: 'Deploy کردن ابزار به‌تنهایی کافی نیست؛ سازمان‌هایی که workflowها را بازطراحی می‌کنند، شانس بیشتری برای خلق ارزش دارند.',
    source: 'McKinsey, The state of AI, 2025',
  },
  {
    title: 'AI فقط ابزار بهره‌وری نیست',
    body: 'شرکت‌های پیشرو از AI هم برای efficiency و هم برای effectiveness استفاده می‌کنند؛ یعنی هم سریع‌تر می‌شوند و هم بهتر تصمیم می‌گیرند.',
    source: 'McKinsey, Growth favors the bold, 2026',
  },
];

export const researchNote =
  'بنابراین، این ارزیابی به‌دنبال سنجش هم‌زمان آمادگی مدیریتی، اجرایی و فناوری سازمان است.';

/* "این ارزیابی چه چیزی به شما می‌دهد؟" ------------------------------------ */

export const outcomeCards = [
  {
    icon: MessagesSquare,
    title: 'زبان مشترک برای تصمیم',
    body: 'چارچوبی برای گفت‌وگوی بین مدیران، تیم‌های کسب‌وکار و فناوری',
  },
  {
    icon: ListChecks,
    title: 'اولویت‌های اقدام',
    body: 'اقداماتی که بیشترین اثر را در کوتاه‌مدت و میان‌مدت دارند',
  },
  {
    icon: Search,
    title: 'شناسایی گلوگاه‌ها',
    body: 'مهم‌ترین موانع خلق ارزش و پیاده‌سازی موفق',
  },
  {
    icon: Workflow,
    title: 'تصویر وضعیت فعلی',
    body: 'جایگاه فعلی سازمان شما در مسیر آمادگی AI',
  },
];
