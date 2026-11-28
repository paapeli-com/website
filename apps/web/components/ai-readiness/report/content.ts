import {
  Building2,
  Cpu,
  FileText,
  Globe2,
  Layers,
  LineChart,
  Lightbulb,
  Rocket,
  ShieldAlert,
  Sparkles,
  Users,
  UserCog,
} from 'lucide-react';

/** All copy for the "مطالعه گزارش" page. */

/* Hero -------------------------------------------------------------------- */

export const report = {
  number: '۰',
  title: 'گزارش جامع وضعیت هوش مصنوعی در ایران',
  subtitle: 'از تحول دیجیتال تا هوش مصنوعی مولد',
  lead: 'این گزارش تصویری مدیریتی از روندهای جهانی و داخلی ارائه می‌دهد و به مدیران کمک می‌کند جایگاه سازمان خود را در مسیر AI بهتر درک کنند.',
  published: 'آبان ۱۴۰۳',
  pages: '۴۲',
  readingTime: '۲۰ دقیقه',
  language: 'فارسی',
  format: 'PDF',
};

/** The strip under the hero copy. */
export const heroMeta = [
  { label: 'شماره گزارش', value: report.number },
  { label: 'تاریخ انتشار', value: report.published },
  { label: 'تعداد صفحات', value: report.pages },
  { label: 'زمان مطالعه', value: report.readingTime },
  { label: 'فرمت', value: report.format },
];

/* "آنچه در این گزارش خواهید خواند" ---------------------------------------- */

export const highlights = [
  {
    number: '۱',
    icon: Globe2,
    title: 'روندهای جهانی AI',
    body: 'تحلیل روندهای کلیدی جهانی و مسیر حرکت از دیجیتال‌سازی تا هوش مصنوعی مولد و تغییر الگوهای خلق ارزش',
  },
  {
    number: '۲',
    icon: Lightbulb,
    title: 'توسعه و نوآوری فنی در ایران',
    body: 'مروری بر ظرفیت‌های فنی، فعالیت‌های پژوهشی، استارتاپ‌ها و محصولات هوش مصنوعی در کشور',
  },
  {
    number: '۳',
    icon: LineChart,
    title: 'نفوذ AI در صنایع',
    body: 'میزان نفوذ و کاربرد هوش مصنوعی در بانکداری، سلامت، صنعت، خرده‌فروشی، انرژی، دولت و آموزش',
  },
  {
    number: '۴',
    icon: Layers,
    title: 'وضعیت زیرساخت و فناوری',
    body: 'زیرساخت ابری، داده، توان محاسباتی و پلتفرم‌ها و ابزارهای در دسترس سازمان‌های ایرانی',
  },
  {
    number: '۵',
    icon: ShieldAlert,
    title: 'چالش‌های کلیدی',
    body: 'داده، مهارت، حاکمیت، سرمایه‌گذاری، زیرساخت و فاصله میان Pilot تا Scale',
  },
  {
    number: '۶',
    icon: Rocket,
    title: 'فرصت‌های اصلی سازمان‌ها',
    body: 'بهره‌وری، کیفیت تصمیم‌گیری، بهبود تجربه مشتری و خلق مدل‌های کسب‌وکاری جدید',
  },
];

export const managerialMessage =
  'پیام مدیریتی گزارش: موفقیت در AI فقط به ابزار وابسته نیست و به استراتژی، مدل عملیاتی، حاکمیت و توسعه توانمندی نیاز دارد.';

/* "این گزارش برای چه کسانی مفید است؟" ------------------------------------- */

export const audience = [
  {
    icon: Users,
    title: 'مدیرعامل و هیئت‌مدیره',
    body: 'برای درک تصویر کلان، ریسک‌ها و مسیر ارزش‌آفرینی AI در کسب‌وکار',
  },
  {
    icon: UserCog,
    title: 'مدیران تحول دیجیتال و استراتژی',
    body: 'برای تدوین نقشه راه و اولویت‌بندی اقدامات سازمان',
  },
  {
    icon: Cpu,
    title: 'مدیران فناوری و داده',
    body: 'برای تصمیم‌گیری درباره سرمایه‌گذاری و توسعه زیرساخت‌های AI',
  },
  {
    icon: Sparkles,
    title: 'مدیران کسب‌وکار و نوآوری',
    body: 'برای شناسایی فرصت‌های جدید و بهبود بهره‌وری',
  },
];

/* "درباره این نسخه گزارش" -------------------------------------------------- */

export const editionFacts = [
  { icon: Globe2, label: 'تمرکز', value: 'جهان و ایران' },
  { icon: Cpu, label: 'موضوع', value: 'تحول دیجیتال و هوش مصنوعی' },
  { icon: FileText, label: 'نوع خروجی', value: 'مدیریتی و تصمیم‌محور' },
  { icon: Building2, label: 'تهیه‌کنندگان', value: 'رایکا و پاپلی' },
];

export const previewBullets = [
  'تحلیل جامع داده‌ها و تحقیقات معتبر داخلی و بین‌المللی',
  'بیش از ۲۰ نمودار، جدول و اینفوگرافیک تحلیلی',
  'قابل استفاده برای تدوین استراتژی و برنامه‌ریزی AI',
];

/* Download form ------------------------------------------------------------ */

export const industryOptions = [
  'مالی و بانکی',
  'سلامت',
  'صنعت و تولید',
  'انرژی',
  'خرده‌فروشی',
  'فناوری',
  'دولت',
  'آموزش',
  'سایر',
];

export const orgSizeOptions = [
  '۱ تا ۱۰ نفر',
  '۱۱ تا ۵۰ نفر',
  '۵۱ تا ۲۰۰ نفر',
  '۲۰۱ تا ۱۰۰۰ نفر',
  'بیش از ۱۰۰۰ نفر',
];

export const formFields = [
  { name: 'fullName', label: 'نام و نام خانوادگی', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'ایمیل', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'شماره تماس', type: 'tel', autoComplete: 'tel' },
  { name: 'company', label: 'نام شرکت / سازمان', type: 'text', autoComplete: 'organization' },
  { name: 'role', label: 'سمت شغلی', type: 'text', autoComplete: 'organization-title' },
] as const;

export const consentLabel =
  'با دریافت گزارش و ارتباط بعدی درباره گزارش‌ها و ارزیابی‌های مرتبط موافقم.';

export const privacyNote =
  'اطلاعات شما محرمانه است و صرفاً برای ارسال گزارش و ارتباطات مرتبط استفاده می‌شود.';

/* Archive ------------------------------------------------------------------ */

export const archive = [
  {
    number: '۰',
    title: 'وضعیت هوش مصنوعی در ایران',
    note: 'از تحول دیجیتال تا هوش مصنوعی مولد',
    date: 'آبان ۱۴۰۳',
    tags: ['AI', 'ایران', 'Transformation'],
    status: 'published' as const,
  },
  {
    number: '۱',
    title: 'هوش مصنوعی در خدمات مالی ایران',
    note: 'کاربردها، ریسک‌ها و مسیر پیاده‌سازی',
    date: 'زمستان ۱۴۰۳',
    tags: ['AI', 'Industry'],
    status: 'upcoming' as const,
  },
  {
    number: '۲',
    title: 'هوش مصنوعی در صنایع تولیدی ایران',
    note: 'بهره‌وری، نگهداشت و کیفیت',
    date: 'بهار ۱۴۰۴',
    tags: ['AI', 'Industry'],
    status: 'upcoming' as const,
  },
  {
    number: '۳',
    title: 'زیرساخت و حکمرانی داده برای AI',
    note: 'داده، معماری و حاکمیت',
    date: 'تابستان ۱۴۰۴',
    tags: ['ایران', 'Transformation'],
    status: 'upcoming' as const,
  },
];
