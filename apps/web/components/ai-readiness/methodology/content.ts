import {
  BadgeCheck,
  BarChart4,
  Boxes,
  Building2,
  Cloud,
  Database,
  Eye,
  FileSpreadsheet,
  Gauge,
  Gem,
  Globe2,
  Layers,
  Lock,
  RefreshCw,
  ScrollText,
  Settings2,
  Shield,
  ShieldAlert,
  Target,
  Users,
} from 'lucide-react';

/**
 * All copy for the methodology page, kept out of the section components so it
 * can be revised — or lifted into lib/i18n/translations.ts — without touching
 * layout code.
 */

/* Hero ------------------------------------------------------------------- */

export const heroLead =
  'این روش‌شناسی با ترکیب معتبرترین استانداردهای جهانی و بومی‌سازی برای سازمان‌های ایرانی طراحی شده است تا تصویری دقیق و قابل اجرا از سطح آمادگی سازمان شما برای هوش مصنوعی ارائه دهد.';

/** The seven axes listed beside the hero illustration. */
export const heroDimensions = [
  { icon: Target, label: 'استراتژی' },
  { icon: Database, label: 'داده' },
  { icon: Cloud, label: 'فناوری' },
  { icon: Users, label: 'افراد و مهارت‌ها' },
  { icon: Settings2, label: 'مدل عملیاتی' },
  { icon: Gem, label: 'ارزش و Use Case' },
  { icon: Shield, label: 'حاکمیت' },
];

/* "این روش‌شناسی بر چه پایه‌ای استوار است؟" -------------------------------- */

export const pillars = [
  {
    icon: Globe2,
    title: 'استانداردهای جهانی',
    body: 'بر پایه پژوهش‌ها و چارچوب‌های جهانی در حوزه AI Readiness و تحول دیجیتال',
  },
  {
    icon: Building2,
    title: 'بومی‌سازی برای ایران',
    body: 'انطباق با واقعیت‌های اقتصادی، فرهنگی و رگولاتوری سازمان‌های ایرانی و صنایع داخلی',
  },
  {
    icon: Gauge,
    title: 'مدیریتی و عملیاتی',
    body: 'تمرکز بر تصمیم‌سازی، اولویت‌بندی و اقدام‌پذیری، نه صرفاً گزارش آکادمیک',
  },
  {
    icon: RefreshCw,
    title: 'اعتبارسنجی و بهبود',
    body: 'بازبینی مستمر مدل و کالیبراسیون بر اساس بازخورد سازمان‌ها و تحولات بازار',
  },
];

/* "منابع و چارچوب‌های مرجع" ------------------------------------------------ */

/** Ordered right-to-left as designed. Rendered as wordmarks: these are
 *  references to published frameworks, not partnership badges. */
export const referenceSources = [
  { name: 'BCG / Accenture', body: 'لنز تحول و ارزش‌آفرینی سازمانی' },
  { name: 'McKinsey', body: 'مدل‌های عملیاتی و پذیرش AI در سازمان' },
  { name: 'Kearney', body: 'چارچوب بلوغ سازمانی و سنجش آمادگی' },
  { name: 'PwC', body: 'معیارهای ارزیابی مسئولانه و ظرفیت‌های قابلیت AI' },
];

/* "ابعاد مورد ارزیابی" ---------------------------------------------------- */

export const methodologyDimensions = [
  { icon: Cloud, title: 'فناوری', body: 'معماری، زیرساخت، ابزارها و آمادگی فنی سازمان' },
  { icon: Database, title: 'داده', body: 'کیفیت، دسترس‌پذیری، یکپارچگی و حاکمیت داده' },
  {
    icon: Gem,
    title: 'ارزش و Use Case',
    body: 'کیفیت و چگونگی انتخاب موارد استفاده، ارزش مورد انتظار و آمادگی برای اجرا',
  },
  {
    icon: Target,
    title: 'استراتژی',
    body: 'وضوح چشم‌انداز، اولویت‌ها و هم‌راستایی با اهداف کسب‌وکار',
  },
  { icon: Shield, title: 'حاکمیت', body: 'سیاست‌ها، ریسک، اخلاق، امنیت و انطباق با مقررات' },
  { icon: Settings2, title: 'مدل عملیاتی', body: 'فرآیندها، ساختار، نحوه اجرا و مقیاس‌پذیری' },
  {
    icon: Users,
    title: 'افراد و مهارت‌ها',
    body: 'توانمندی‌ها، فرهنگ، جذب و توسعه استعدادهای AI',
  },
];

/* "پنج سطح بلوغ" ---------------------------------------------------------- */

export const maturityLevels = [
  {
    number: '۱',
    title: 'ابتدایی',
    body: 'آغاز مسیر با آگاهی محدود و اقدامات اولیه و پراکنده',
  },
  {
    number: '۲',
    title: 'در حال شکل‌گیری',
    body: 'تعریف، پایلوت‌ها، آزمایش‌ها و اقدامات محدود',
  },
  {
    number: '۳',
    title: 'در حال توسعه',
    body: 'اجرای پایدارتر با ابعاد و قابلیت‌های پایه',
  },
  {
    number: '۴',
    title: 'پیشرفته',
    body: 'یکپارچگی در فرآیندها و ایجاد ارزش پایدار',
  },
  {
    number: '۵',
    title: 'رهبر',
    body: 'توانمندی برتر، مقیاس‌پذیر و نوآورانه',
  },
];

/* "از پاسخ تا Diagnosis" -------------------------------------------------- */

export const pipeline = [
  {
    icon: FileSpreadsheet,
    title: 'گردآوری پاسخ‌ها',
    body: 'پاسخ‌های شما به ۴۵ سؤال در هفت بُعد جمع‌آوری می‌شود',
  },
  {
    icon: BarChart4,
    title: 'امتیازدهی ابعادی',
    body: 'هر بُعد بر اساس مدل چندجانبه استاندارد می‌شود',
  },
  {
    icon: Layers,
    title: 'تعیین سطح بلوغ',
    body: 'سطح بلوغ هر بُعد و سطح کلی سازمان تعیین می‌شود',
  },
  {
    icon: Boxes,
    title: 'تحلیل مقایسه‌ای',
    body: 'مقایسه با بنچمارک‌های داخلی و گروه مرجع',
  },
  {
    icon: ScrollText,
    title: 'خروجی‌های عملی',
    body: 'گلوگاه‌ها، راهکارها و اولویت‌های شخصی‌سازی‌شده',
  },
];

export const pipelineNote =
  'مدل امتیازدهی شفاف و پایدار و بر پایه اصول علمی است. جزئیات فرمول‌ها محرمانه نیست، اما به‌صورت کلی اعلام می‌شود.';

/* "داده‌های مورد استفاده" -------------------------------------------------- */

export const dataSources = [
  {
    icon: RefreshCw,
    title: 'به‌روزرسانی مستمر',
    body: 'به‌روزرسانی مدل بر اساس تغییرات بازار و بازخورد سازمان‌ها',
  },
  {
    icon: Globe2,
    title: 'بنچمارک‌های جهانی',
    body: 'منابع معتبر بین‌المللی و تحقیقات روز دنیا',
  },
  {
    icon: Building2,
    title: 'داده‌های مقایسه‌ای داخلی',
    body: 'تجمیع ناشناس از سازمان‌های ایرانی در صنایع مختلف',
  },
  {
    icon: BadgeCheck,
    title: 'داده‌های ورودی شما',
    body: 'پاسخ‌های شما به پرسشنامه (ارزیابی ۴۵ سؤالی)',
  },
];

/* "شفافیت و حدود استفاده" ------------------------------------------------- */

export const transparency = [
  {
    icon: ShieldAlert,
    tone: 'orange' as const,
    title: 'محدودیت مسئولیت',
    body: 'این ارزیابی مشاوره نیست و تصمیم نهایی بر عهده مدیریت سازمان شماست.',
  },
  {
    icon: Eye,
    tone: 'green' as const,
    title: 'استفاده غیرعمومی',
    body: 'نتایج صرفاً برای بهبود تصمیم‌سازی داخلی سازمان شما استفاده می‌شود.',
  },
  {
    icon: Lock,
    tone: 'green' as const,
    title: 'محرمانگی کامل',
    body: 'اطلاعات شما محرمانه بوده و به هیچ سازمان یا شخص ثالثی ارائه نمی‌شود.',
  },
];
