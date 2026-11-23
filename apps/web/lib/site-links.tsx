"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import Link from "next/link";

import { useLanguage } from "@/contexts/LanguageContext";
import { localePath } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* One registry for every page that other pages are allowed to name.  */
/*                                                                    */
/* Prose across the site keeps mentioning the same things: a solution */
/* page says "anomaly detection", a feature page says "oil & gas".    */
/* Rather than hand-wiring a link at each mention across six config   */
/* files times three languages, every page is listed once here with   */
/* the phrases that refer to it, and <LinkedText/> turns the first    */
/* mention inside any block of copy into a link.                      */
/* ------------------------------------------------------------------ */

export type FeatureSlug =
  | "flexible-deployment"
  | "device-management"
  | "realtime-monitoring"
  | "alerts-events"
  | "ota-updates"
  | "anomaly-detection"
  | "predictive-analytics"
  | "solution-templates";

export type IndustrySlug =
  | "smart-manufacturing"
  | "oil-gas"
  | "smart-buildings"
  | "smart-agriculture"
  | "fleet-tracking"
  | "energy-monitoring";

/** Language-relative href; the active locale is prefixed at render time. */
export const featureHref = (slug: FeatureSlug) => "/features/" + slug;
export const industryHref = (slug: IndustrySlug) => "/" + slug;

/* The phrases that count as naming a page. Multi-word wherever a single
   word would be too greedy: "fleet" and "manufacturing" on their own turn
   up in ordinary sentences, so only the full names are listed. */
type Terms = Record<string, string[]>;

export const FEATURE_TERMS: Record<FeatureSlug, Terms> = {
  "flexible-deployment": {
    en: ["flexible deployment", "cloud or on-premise", "on-premise deployment"],
    fa: ["استقرار انعطاف‌پذیر"],
    ar: ["النشر المرن", "نشر مرن"],
  },
  "device-management": {
    en: [
      "device & gateway management",
      "device and gateway management",
      "gateway management",
      "device management",
    ],
    fa: ["مدیریت دستگاه و گیت‌وی", "مدیریت دستگاه"],
    ar: ["إدارة الأجهزة والبوابات", "إدارة الأجهزة"],
  },
  "realtime-monitoring": {
    en: ["real-time monitoring", "realtime monitoring", "live monitoring"],
    fa: ["پایش لحظه‌ای", "پایش بی‌درنگ"],
    ar: ["المراقبة الفورية", "المراقبة اللحظية"],
  },
  "alerts-events": {
    en: ["alerts & event management", "alerts and event management", "event management"],
    fa: ["هشدارها و مدیریت رویداد", "مدیریت رویداد"],
    ar: ["التنبيهات وإدارة الأحداث", "إدارة الأحداث"],
  },
  "ota-updates": {
    en: ["OTA updates", "over-the-air updates", "OTA"],
    fa: ["به‌روزرسانی‌های OTA", "به‌روزرسانی OTA", "OTA"],
    ar: ["تحديثات OTA", "OTA"],
  },
  "anomaly-detection": {
    en: ["anomaly detection", "anomaly alerts"],
    fa: ["تشخیص ناهنجاری"],
    ar: ["كشف الشذوذ"],
  },
  "predictive-analytics": {
    en: ["predictive analytics", "predictive maintenance", "failure forecasting"],
    fa: ["تحلیل پیش‌بین", "نگهداری پیش‌بینانه", "پیش‌بینی خرابی"],
    ar: ["التحليلات التنبؤية", "الصيانة التنبؤية"],
  },
  "solution-templates": {
    en: ["solution templates", "industry templates"],
    fa: ["قالب‌های آمادهٔ راهکار", "قالب‌های راهکار", "قالب صنعتی"],
    ar: ["قوالب الحلول", "قوالب صناعية"],
  },
};

export const INDUSTRY_TERMS: Record<IndustrySlug, Terms> = {
  "smart-manufacturing": {
    en: ["smart manufacturing"],
    fa: ["تولید هوشمند"],
    ar: ["التصنيع الذكي"],
  },
  "oil-gas": {
    en: ["oil & gas", "oil and gas"],
    fa: ["نفت و گاز"],
    ar: ["النفط والغاز"],
  },
  "smart-buildings": {
    en: ["smart buildings", "smart building"],
    fa: ["ساختمان‌های هوشمند"],
    ar: ["المباني الذكية"],
  },
  "smart-agriculture": {
    en: ["smart agriculture", "precision agriculture"],
    fa: ["کشاورزی هوشمند"],
    ar: ["الزراعة الذكية"],
  },
  "fleet-tracking": {
    en: ["asset & fleet tracking", "asset and fleet tracking", "fleet tracking"],
    fa: ["ردیابی ناوگان"],
    ar: ["تتبع الأساطيل", "تتبع الأسطول"],
  },
  "energy-monitoring": {
    en: ["energy monitoring"],
    fa: ["پایش انرژی"],
    ar: ["مراقبة الطاقة"],
  },
};

/* ------------------------------------------------------------------ */
/* Display names. Whenever one page points at another by name (a chip, */
/* a "related capabilities" card, a menu row) the label comes from     */
/* here, so the eight features are named the same way everywhere.      */
/* ------------------------------------------------------------------ */

type Named = { title: string; tagline: string };

export const FEATURE_INDEX: Record<FeatureSlug, Record<string, Named>> = {
  "flexible-deployment": {
    en: { title: "Flexible deployment", tagline: "Run Paapeli on our cloud or inside your own infrastructure." },
    fa: { title: "استقرار انعطاف‌پذیر", tagline: "پاپلی را روی ابر ما یا زیرساخت داخلی خودتان اجرا کنید." },
    ar: { title: "النشر المرن", tagline: "شغّل بابيلي على سحابتنا أو داخل بنيتك التحتية الخاصة." },
  },
  "device-management": {
    en: { title: "Device & gateway management", tagline: "Thousands of devices with MQTT, OPC-UA and Modbus support." },
    fa: { title: "مدیریت دستگاه و گیت‌وی", tagline: "هزاران دستگاه با پشتیبانی MQTT، OPC-UA و Modbus." },
    ar: { title: "إدارة الأجهزة والبوابات", tagline: "آلاف الأجهزة بدعم MQTT وOPC-UA وModbus." },
  },
  "realtime-monitoring": {
    en: { title: "Real-time monitoring", tagline: "Live device data and system performance on one screen." },
    fa: { title: "پایش لحظه‌ای", tagline: "دادهٔ زندهٔ دستگاه و کارایی سامانه در یک نما." },
    ar: { title: "المراقبة الفورية", tagline: "بيانات حيّة للأجهزة وأداء النظام على شاشة واحدة." },
  },
  "alerts-events": {
    en: { title: "Alerts & event management", tagline: "Detect critical events instantly, before they escalate." },
    fa: { title: "هشدارها و مدیریت رویداد", tagline: "رویدادهای حیاتی را پیش از بحرانی شدن تشخیص دهید." },
    ar: { title: "التنبيهات وإدارة الأحداث", tagline: "اكتشف الأحداث الحرجة فورًا قبل أن تتفاقم." },
  },
  "ota-updates": {
    en: { title: "OTA updates", tagline: "Keep firmware current, remotely and safely." },
    fa: { title: "به‌روزرسانی OTA", tagline: "فرم‌ور دستگاه‌ها را از راه دور و ایمن به‌روز نگه دارید." },
    ar: { title: "تحديثات OTA", tagline: "حافظ على تحديث البرامج الثابتة عن بُعد وبأمان." },
  },
  "anomaly-detection": {
    en: { title: "Anomaly detection", tagline: "Catch abnormal behaviour early, before it becomes a failure." },
    fa: { title: "تشخیص ناهنجاری", tagline: "رفتار غیرعادی را زود بگیرید، پیش از آنکه به خرابی برسد." },
    ar: { title: "كشف الشذوذ", tagline: "التقط السلوك غير الطبيعي مبكرًا قبل أن يتحول إلى عطل." },
  },
  "predictive-analytics": {
    en: { title: "Predictive analytics", tagline: "Forecast equipment failures and plan maintenance by risk." },
    fa: { title: "تحلیل پیش‌بین", tagline: "خرابی تجهیزات را پیش‌بینی و نگهداری را بر پایهٔ ریسک برنامه‌ریزی کنید." },
    ar: { title: "التحليلات التنبؤية", tagline: "تنبّأ بأعطال المعدات وخطّط الصيانة حسب المخاطر." },
  },
  "solution-templates": {
    en: { title: "Solution templates", tagline: "Start from a ready industry template instead of a blank platform." },
    fa: { title: "قالب‌های آمادهٔ راهکار", tagline: "به‌جای پلتفرم خالی، از یک قالب آمادهٔ صنعتی شروع کنید." },
    ar: { title: "قوالب الحلول", tagline: "ابدأ من قالب صناعي جاهز بدل منصة فارغة." },
  },
};

export const INDUSTRY_INDEX: Record<IndustrySlug, Record<string, string>> = {
  "smart-manufacturing": { en: "Smart Manufacturing", fa: "تولید هوشمند", ar: "التصنيع الذكي" },
  "oil-gas": { en: "Oil & Gas", fa: "نفت و گاز", ar: "النفط والغاز" },
  "smart-buildings": { en: "Smart Buildings", fa: "ساختمان‌های هوشمند", ar: "المباني الذكية" },
  "smart-agriculture": { en: "Smart Agriculture", fa: "کشاورزی هوشمند", ar: "الزراعة الذكية" },
  "fleet-tracking": { en: "Fleet Tracking", fa: "ردیابی ناوگان", ar: "تتبع الأساطيل" },
  "energy-monitoring": { en: "Energy Monitoring", fa: "پایش انرژی", ar: "مراقبة الطاقة" },
};

/** Heading above the capability rail on every industry landing. */
export const CAPABILITIES_RAIL: Record<string, string> = {
  en: "Platform capabilities behind this solution",
  fa: "قابلیت‌های پلتفرم پشت این راهکار",
  ar: "قدرات المنصة خلف هذا الحل",
};

export const featureName = (slug: FeatureSlug, language: string) =>
  FEATURE_INDEX[slug][language] ?? FEATURE_INDEX[slug].en;

export const industryName = (slug: IndustrySlug, language: string) =>
  INDUSTRY_INDEX[slug][language] ?? INDUSTRY_INDEX[slug].en;

/* One flat table of phrase to href, longest phrase first so that
   "device & gateway management" wins over "device management". */
type Candidate = { phrase: string; href: string };

const buildTable = (language: string): Candidate[] => {
  const rows: Candidate[] = [];

  for (const [slug, terms] of Object.entries(FEATURE_TERMS)) {
    for (const phrase of terms[language] ?? terms.en) {
      rows.push({ phrase, href: featureHref(slug as FeatureSlug) });
    }
  }
  for (const [slug, terms] of Object.entries(INDUSTRY_TERMS)) {
    for (const phrase of terms[language] ?? terms.en) {
      rows.push({ phrase, href: industryHref(slug as IndustrySlug) });
    }
  }

  return rows.sort((a, b) => b.phrase.length - a.phrase.length);
};

const TABLES: Record<string, Candidate[]> = {};
const tableFor = (language: string) => (TABLES[language] ??= buildTable(language));

/* Arabic script plus the zero-width non-joiner Persian sets words with. */
const ARABIC = /[؀-ۿ‌]/;
const LATIN = /[A-Za-z0-9]/;

/** Rejects a match that is really the middle of a longer word. */
const isEdge = (char: string | undefined, phrase: string) => {
  if (char === undefined) return true;
  return /[A-Za-z]/.test(phrase[0]) ? !LATIN.test(char) : !ARABIC.test(char);
};

type Match = { start: number; end: number; href: string };

/**
 * Finds at most one mention per destination, so a paragraph that says "OTA"
 * four times links the first one and leaves the rest as plain text.
 */
function findMatches(text: string, language: string, self?: string): Match[] {
  const haystack = text.toLowerCase();
  const taken: Match[] = [];
  const linked = new Set<string>();

  for (const { phrase, href } of tableFor(language)) {
    if (href === self || linked.has(href)) continue;

    const needle = phrase.toLowerCase();
    let from = 0;

    while (from <= haystack.length - needle.length) {
      const start = haystack.indexOf(needle, from);
      if (start === -1) break;
      const end = start + needle.length;

      const clean =
        isEdge(text[start - 1], phrase) &&
        isEdge(text[end], phrase) &&
        !taken.some((m) => start < m.end && end > m.start);

      if (clean) {
        taken.push({ start, end, href });
        linked.add(href);
        break;
      }
      from = start + 1;
    }
  }

  return taken.sort((a, b) => a.start - b.start);
}

/**
 * Renders a line of copy, turning the name of any page this site owns into a
 * link to it. `self` is the current page's href, so a page never links to
 * itself.
 */
export function LinkedText({
  text,
  self,
  className,
}: {
  text: string;
  self?: string;
  className?: string;
}) {
  const { language } = useLanguage();

  const nodes = useMemo<ReactNode[]>(() => {
    const matches = findMatches(text, language, self);
    if (matches.length === 0) return [text];

    const linkClass =
      className ??
      "font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary";

    const out: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((m, i) => {
      if (m.start > cursor) {
        out.push(<Fragment key={"t" + i}>{text.slice(cursor, m.start)}</Fragment>);
      }
      /* localePath, not "/" + language: Persian has no prefix, and
         "/fa/..." only 301s back to the address this should have been. */
      out.push(
        <Link key={"l" + i} href={localePath(language, m.href)} className={linkClass}>
          {text.slice(m.start, m.end)}
        </Link>,
      );
      cursor = m.end;
    });

    if (cursor < text.length) out.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);
    return out;
  }, [text, language, self, className]);

  return <>{nodes}</>;
}
