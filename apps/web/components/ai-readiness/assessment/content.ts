import {
  Banknote,
  Building2,
  Clock,
  Cpu,
  Database,
  Factory,
  Fuel,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Lightbulb,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';
import type { AssessmentMode } from './state';

/* ------------------------------------------------------------------ */
/* Step 1 — assessment modes                                           */
/* ------------------------------------------------------------------ */

/**
 * Ordered right-to-left as rendered: the free, no-signup tier sits on the
 * right where a Persian reader starts, and depth increases leftwards.
 */
export const modes: {
  id: AssessmentMode;
  title: string;
  badge: string;
  time: string;
  description: string;
  features: string[];
  cta: string;
  note?: string;
  recommended?: boolean;
  tone: 'green' | 'orange';
  icon: typeof Zap;
}[] = [
  {
    id: 'quick',
    title: 'ارزیابی سریع',
    badge: 'بدون ثبت‌نام',
    time: '۵ تا ۷ دقیقه',
    description: 'یک تصویر اولیه اما کاربردی از آمادگی سازمان شما برای AI.',
    // Four lines per card, so all three fit above the fold. Pairs were merged
    // rather than dropped — no capability is hidden from the comparison.
    features: [
      'حدود ۱۲ سؤال',
      'امتیاز کلی و هفت بُعد',
      'سه نقطه قوت و سه گلوگاه',
      'اقدامات پیشنهادی اولیه',
    ],
    cta: 'انتخاب ارزیابی سریع',
    recommended: true,
    tone: 'green',
    icon: Zap,
  },
  {
    id: 'full',
    title: 'ارزیابی کامل',
    badge: 'حساب رایگان',
    time: '۱۲ تا ۱۵ دقیقه',
    description: 'تحلیل عمیق‌تر، پرسش‌های تطبیقی و بررسی ارتباط میان ابعاد آمادگی.',
    features: [
      'حدود ۲۰ سؤال',
      'سؤال‌های متناسب با صنعت شما',
      'تحلیل ارتباط میان ابعاد',
      'گزارش قابل ذخیره و بنچمارک دقیق‌تر',
    ],
    note: 'برای ذخیره و مشاهده تحلیل کامل، ایجاد حساب رایگان لازم است.',
    cta: 'انتخاب ارزیابی کامل',
    tone: 'green',
    icon: Target,
  },
  {
    id: 'org',
    title: 'ارزیابی عمیق سازمانی',
    badge: 'سازمانی',
    time: '۲۰+ دقیقه · چند‌ذی‌نفعی',
    description:
      'برای سازمان‌هایی که به یک تشخیص چند‌ذی‌نفعی و مبتنی بر شواهد نیاز دارند.',
    features: [
      'چند پاسخ‌دهنده از یک سازمان',
      'مصاحبه هوشمند و بررسی شواهد',
      'تحلیل اختلاف دیدگاه مدیران',
      'بنچمارک و نقشه راه عمیق',
    ],
    cta: 'درخواست ارزیابی سازمانی',
    tone: 'orange',
    icon: Users,
  },
];

/** The reassurance strip under the mode cards. */
export const trustPoints = [
  {
    icon: Clock,
    title: 'مدت‌زمان واقعی',
    body: 'مدت‌زمان هر مسیر با توجه به انتخاب شما محاسبه می‌شود.',
  },
  {
    icon: Sparkles,
    title: 'تحلیل هوشمند',
    body: 'استفاده از مدل‌های تحلیلی پیشرفته و بینش‌های اختصاصی AI.',
  },
  {
    icon: Layers,
    title: 'مبتنی بر چارچوب معتبر',
    body: 'ترکیبی از چارچوب‌های جهانی McKinsey، Kearney، BCG و KPMG.',
  },
  {
    icon: ShieldCheck,
    title: 'محرمانه و امن',
    body: 'اطلاعات شما کاملاً محرمانه است و فقط برای تحلیل استفاده می‌شود.',
  },
];

/* ------------------------------------------------------------------ */
/* Step 2 — intake                                                     */
/* ------------------------------------------------------------------ */

export const industries = [
  { id: 'finance', label: 'بانکداری و مالی', icon: Banknote },
  { id: 'health', label: 'سلامت و درمان', icon: HeartPulse },
  { id: 'manufacturing', label: 'صنعت و تولید', icon: Factory },
  { id: 'energy', label: 'انرژی و نفت و گاز', icon: Fuel },
  { id: 'retail', label: 'خرده‌فروشی و تجارت', icon: ShoppingCart },
  { id: 'tech', label: 'فناوری و نرم‌افزار', icon: Cpu },
  { id: 'public', label: 'دولت و عمومی', icon: Landmark },
  { id: 'education', label: 'آموزش و پژوهش', icon: GraduationCap },
  { id: 'other', label: 'سایر صنایع', icon: Building2 },
];

export const orgSizes = [
  { id: 'xs', label: '۱ تا ۵۰ نفر' },
  { id: 'sm', label: '۵۱ تا ۲۰۰ نفر' },
  { id: 'md', label: '۲۰۱ تا ۱۰۰۰ نفر' },
  { id: 'lg', label: 'بیش از ۱۰۰۰ نفر' },
];

export const roles = [
  { id: 'ceo', label: 'مدیرعامل / هیئت‌مدیره', icon: Users },
  { id: 'strategy', label: 'مدیر تحول / استراتژی', icon: UserCog },
  { id: 'tech', label: 'مدیر فناوری / داده', icon: Database },
  { id: 'business', label: 'مدیر کسب‌وکار / عملیات', icon: Building2 },
  { id: 'other', label: 'سایر', icon: Lightbulb },
];

export const aiStages = [
  { id: 'none', label: 'هنوز شروع نکرده‌ایم' },
  { id: 'exploring', label: 'در حال بررسی و ایده‌پردازی' },
  { id: 'pilot', label: 'چند Pilot محدود داریم' },
  { id: 'operational', label: 'چند Use Case عملیاتی داریم' },
  { id: 'scaling', label: 'در حال Scale کردن AI هستیم' },
];

/** The five intake steps, in order. */
export const intakeSteps = [
  {
    key: 'industry' as const,
    question: 'سازمان شما در کدام صنعت فعالیت می‌کند؟',
    hint: 'صنعت خود را انتخاب کنید تا سؤال‌های متناسب با حوزه شما نمایش داده شود.',
    optional: false,
  },
  {
    key: 'size' as const,
    question: 'اندازه سازمان شما چقدر است؟',
    hint: 'تعداد تقریبی افراد شاغل در سازمان را انتخاب کنید.',
    optional: false,
  },
  {
    key: 'role' as const,
    question: 'نقش شما در سازمان چیست؟',
    hint: 'نقش خود را انتخاب کنید تا تجربه بهتری برای شما فراهم شود.',
    optional: false,
  },
  {
    key: 'aiStage' as const,
    question: 'سازمان شما در حال حاضر در چه مرحله‌ای از استفاده از AI قرار دارد؟',
    hint: 'نزدیک‌ترین گزینه به وضعیت فعلی سازمان را انتخاب کنید.',
    optional: false,
  },
  {
    key: 'orgName' as const,
    question: 'نام سازمان شما چیست؟',
    hint: 'این مورد اختیاری است و فقط در گزارش شما نمایش داده می‌شود.',
    optional: true,
  },
];

/** Sidebar / stepper labels for the three app stages. */
export const appSteps = [
  { title: 'انتخاب نوع ارزیابی', hint: 'مسیر متناسب با زمان شما' },
  { title: 'اطلاعات سازمان', hint: 'پنج سؤال کوتاه' },
  { title: 'شروع ارزیابی', hint: 'آماده برای پاسخ‌دهی' },
];

/* ------------------------------------------------------------------ */
/* Organisational request                                              */
/* ------------------------------------------------------------------ */

export const orgRequestFields = [
  { name: 'fullName', label: 'نام و نام خانوادگی', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'ایمیل', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'شماره تماس', type: 'tel', autoComplete: 'tel' },
  { name: 'company', label: 'نام سازمان', type: 'text', autoComplete: 'organization' },
  { name: 'role', label: 'سمت شغلی', type: 'text', autoComplete: 'organization-title' },
] as const;

export const orgRequestPoints = [
  { icon: Users, label: 'هماهنگی چند پاسخ‌دهنده از سازمان شما' },
  { icon: Rocket, label: 'برنامه‌ریزی مصاحبه و بررسی شواهد' },
  { icon: Layers, label: 'تدوین نقشه راه اختصاصی' },
];
