import type { Metadata } from 'next';
import { vazirmatn } from '@/app/fonts';

import '@/components/ai-readiness/theme.css';
import { AiHeader, subPageNav } from '@/components/ai-readiness/AiHeader';
import { AiFooter } from '@/components/ai-readiness/AiFooter';
import { FinalCtaSection } from '@/components/ai-readiness/FinalCtaSection';
import { aiLinks, AI_BASE } from '@/components/ai-readiness/links';
import {
  DataSection,
  MaturitySection,
  MethodologyDimensionsSection,
  MethodologyHero,
  PillarsSection,
  PipelineSection,
  SourcesSection,
  TransparencySection,
} from '@/components/ai-readiness/methodology/sections';
import {
  maturityLevels,
  methodologyDimensions,
  pipeline,
  referenceSources,
} from '@/components/ai-readiness/methodology/content';

const URL = `https://www.paapeli.com${AI_BASE}/methodology`;
const TITLE = 'روش‌شناسی ارزیابی آمادگی هوش مصنوعی | Paapeli × Rayka';
const DESCRIPTION =
  'چارچوب ارزیابی آمادگی AI چگونه ساخته شده است: هفت بُعد سنجش، پنج سطح بلوغ، منابع مرجع جهانی، فرآیند تبدیل پاسخ به تحلیل، و حدود استفاده از نتایج.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'روش‌شناسی ارزیابی آمادگی هوش مصنوعی',
    'چارچوب بلوغ AI',
    'سطوح بلوغ هوش مصنوعی',
    'AI readiness methodology',
    'ابعاد آمادگی AI',
    'حاکمیت داده',
    'Paapeli',
    'Rayka',
  ],
  /* No canonical here: it would name the English page from all three
     locales. app/[lang]/layout.tsx builds one per language. */
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: 'Paapeli',
    type: 'article',
    locale: 'fa_IR',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

/** Structured data mirroring what the page actually shows. */
function StructuredData() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': URL,
        url: URL,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: 'fa-IR',
        isPartOf: { '@type': 'WebSite', url: 'https://www.paapeli.com/', name: 'Paapeli' },
        citation: referenceSources.map((s) => s.name),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'ارزیابی آمادگی AI',
            item: `https://www.paapeli.com${AI_BASE}`,
          },
          { '@type': 'ListItem', position: 2, name: 'روش‌شناسی', item: URL },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'ابعاد مورد ارزیابی',
        inLanguage: 'fa-IR',
        itemListElement: methodologyDimensions.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: d.title,
          description: d.body,
        })),
      },
      {
        '@type': 'ItemList',
        name: 'پنج سطح بلوغ',
        inLanguage: 'fa-IR',
        itemListElement: maturityLevels.map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: l.title,
          description: l.body,
        })),
      },
      {
        '@type': 'HowTo',
        name: 'از پاسخ تا تشخیص',
        description: 'مسیر تبدیل پاسخ‌های ارزیابی به تحلیل و اقدام‌های عملی.',
        inLanguage: 'fa-IR',
        step: pipeline.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

/**
 * Methodology page. Shares the landing page's palette, type and components
 * wholesale — see the note in the landing page for why `lang="fa-IR"` rather
 * than plain `fa`.
 */
export default function MethodologyPage() {
  return (
    <div
      lang="fa-IR"
      dir="rtl"
      className={`ai-readiness min-h-screen ${vazirmatn.className}`}
      style={{ ['--ai-font' as string]: vazirmatn.style.fontFamily }}
    >
      <noscript>
        <style>{`.ai-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <StructuredData />
      <AiHeader
        navItems={subPageNav}
        brandHref={aiLinks.landing}
        activeHref={aiLinks.methodologyPage}
      />

      <main>
        <MethodologyHero />
        <PillarsSection />
        <SourcesSection />
        <MethodologyDimensionsSection />
        <MaturitySection />
        <PipelineSection />
        <DataSection />
        <TransparencySection />
        <FinalCtaSection
          title="اکنون سازمان خود را ارزیابی کنید"
          body="به جمع سازمان‌های پیشرو در مسیر آمادگی AI بپیوندید."
          secondaryLabel="بازگشت به صفحه اصلی"
          secondaryHref={aiLinks.landing}
        />
      </main>

      <AiFooter />
    </div>
  );
}
