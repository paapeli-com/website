import {
  BarChart3,
  Building2,
  Cloud,
  Database,
  Gem,
  Lock,
  MessagesSquare,
  Navigation,
  Settings2,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import type { Dimension } from './primitives';

/**
 * All copy for the AI-Readiness landing page. Kept out of the section
 * components so the wording can be revised — or lifted into
 * lib/i18n/translations.ts for an English/Arabic build — without touching
 * layout code.
 */

/* Hero scorecard preview -------------------------------------------------- */

export const heroScorecard: Dimension[] = [
  { label: 'استراتژی', value: 72 },
  { label: 'داده', value: 58 },
  { label: 'فناوری', value: 70 },
  { label: 'افراد و مهارت‌ها', value: 66 },
  { label: 'حاکمیت', value: 42 },
];

/* "از گزارش تا ارزیابی" --------------------------------------------------- */

export const whyCards = [
  {
    number: '۱',
    icon: BarChart3,
    title: 'کجا ایستاده‌ایم؟',
    body: 'سطح آمادگی سازمان شما برای استفاده و مقیاس‌دهی AI',
  },
  {
    number: '۲',
    icon: Lock,
    title: 'چه چیزی ما را عقب نگه داشته؟',
    body: 'شناسایی گلوگاه‌های اصلی سازمان',
  },
  {
    number: '۳',
    icon: Navigation,
    title: 'حرکت بعدی چیست؟',
    body: 'اولویت‌هایی که بیشترین اثر را در پیشرفت شما دارند',
  },
];

/* "ابعاد ارزیابی" --------------------------------------------------------- */

export const dimensionCards = [
  { icon: Cloud, title: 'فناوری', body: 'معماری، ابزارها و زیرساخت فناورانه' },
  { icon: Database, title: 'داده', body: 'دسترسی، کیفیت و حاکمیت داده‌ها' },
  { icon: Gem, title: 'ارزش و Use Case', body: 'کیفیت و اولویت‌بندی موارد استفاده' },
  { icon: Target, title: 'استراتژی', body: 'وضوح جهت‌گیری و تعهد مدیریتی' },
  { icon: Shield, title: 'حاکمیت', body: 'سیاست‌ها، ریسک و سنجش ارزش' },
  { icon: Settings2, title: 'مدل عملیاتی', body: 'فرآیندها، ساختار و روش کار' },
  { icon: Users, title: 'افراد و مهارت‌ها', body: 'توانمندی‌ها، فرهنگ و آمادگی سازمانی' },
];

/* "تجربه تعاملی" ---------------------------------------------------------- */

export const sampleQuestion =
  'آیا برای پروژه‌های AI در سازمان شما مالک مشخص، بودجه و KPI تعریف شده است؟';

export const sampleAnswers = ['بله', 'تا حدی', 'خیر', 'مطمئن نیستم'];

/* "خروجی شما" ------------------------------------------------------------- */

export const outputScorecard: Dimension[] = [
  { label: 'استراتژی', value: 70 },
  { label: 'داده', value: 50 },
  { label: 'فناوری', value: 68 },
  { label: 'افراد و مهارت‌ها', value: 62 },
  { label: 'حاکمیت', value: 40 },
];

export const outputNarrative =
  'سازمان شما از نظر تمایل مدیریتی جلوتر از قابلیت‌های داده و Governance حرکت کرده است. در وضعیت فعلی، افزایش Pilotها احتمالاً به Scale منجر نخواهد شد.';

export const outputHighlights = [
  {
    tone: 'neutral' as const,
    title: 'اولویت‌ها',
    items: ['ایجاد چارچوب حاکمیت', 'تقویت توانمندی داده'],
  },
  {
    tone: 'warning' as const,
    title: 'گلوگاه‌ها',
    items: ['حاکمیت و سنجش ارزش', 'کیفیت و یکپارچگی داده'],
  },
  {
    tone: 'positive' as const,
    title: 'نقاط قوت',
    items: ['تمایل مدیریتی', 'سرعت تصمیم‌گیری'],
  },
];

/* "روش‌شناسی" ------------------------------------------------------------- */

/** Ordered so the strip reads KPMG → McKinsey right-to-left, as designed. */
export const referenceFirms = ['KPMG', 'Deloitte', 'Kearney', 'BCG', 'McKinsey'];

/* "در سه گام" ------------------------------------------------------------- */

export const steps = [
  {
    number: '۱',
    icon: Building2,
    title: 'معرفی سازمان',
    body: 'صنعت، اندازه و نقش خود را مشخص کنید',
  },
  {
    number: '۲',
    icon: MessagesSquare,
    title: 'ارزیابی هوشمند',
    body: 'با کلیک، متن یا گفت‌وگوی فارسی پیش بروید',
  },
  {
    number: '۳',
    icon: BarChart3,
    title: 'تحلیل و Diagnosis',
    body: 'وضعیت، گلوگاه‌ها و اقدام‌های بعدی را دریافت کنید',
  },
];
