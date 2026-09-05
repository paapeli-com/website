import type { Metadata } from 'next';
import { vazirmatn } from '@/app/fonts';

import '@/components/ai-readiness/theme.css';
import { AiHeader } from '@/components/ai-readiness/AiHeader';
import { HeroSection } from '@/components/ai-readiness/HeroSection';
import { WhySection } from '@/components/ai-readiness/WhySection';
import { DimensionsSection } from '@/components/ai-readiness/DimensionsSection';
import { ExperienceSection } from '@/components/ai-readiness/ExperienceSection';
import { OutputSection } from '@/components/ai-readiness/OutputSection';
import { MethodologySection } from '@/components/ai-readiness/MethodologySection';
import { StepsSection } from '@/components/ai-readiness/StepsSection';
import { FinalCtaSection } from '@/components/ai-readiness/FinalCtaSection';
import { AiFooter } from '@/components/ai-readiness/AiFooter';
import { aiLinks } from '@/components/ai-readiness/links';
import { dimensionCards, steps } from '@/components/ai-readiness/content';

const URL = 'https://www.paapeli.com/AI-Readiness-Assessment';
const TITLE = 'ارزیابی آمادگی هوش مصنوعی سازمان | Paapeli × Rayka';
const DESCRIPTION =
  'در حدود ۱۰ دقیقه ببینید سازمان شما برای خلق ارزش واقعی از هوش مصنوعی چقدر آماده است. ارزیابی رایگان و مبتنی بر پژوهش در هفت بُعد: استراتژی، داده، فناوری، حاکمیت، مدل عملیاتی، افراد و ارزش.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ارزیابی آمادگی هوش مصنوعی',
    'آمادگی AI سازمان',
    'AI readiness assessment',
    'بلوغ هوش مصنوعی',
    'حاکمیت داده',
    'استراتژی هوش مصنوعی',
    'گزارش وضعیت AI در ایران',
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
    type: 'website',
    locale: 'fa_IR',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

/**
 * Structured data. `WebPage` carries the language and publisher; the `FAQPage`
 * mirrors the three questions the "از گزارش تا ارزیابی" section actually
 * answers on screen, and `HowTo` mirrors the visible three-step flow — both
 * describe real page content rather than inventing markup-only answers.
 */
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
        about: {
          '@type': 'Thing',
          name: 'ارزیابی آمادگی هوش مصنوعی',
          description: dimensionCards.map((d) => d.title).join('، '),
        },
      },
      {
        '@type': 'HowTo',
        name: 'ارزیابی آمادگی هوش مصنوعی در سه گام',
        description: DESCRIPTION,
        inLanguage: 'fa-IR',
        totalTime: 'PT10M',
        step: steps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
      {
        '@type': 'FAQPage',
        inLanguage: 'fa-IR',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'کجا ایستاده‌ایم؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'ارزیابی سطح آمادگی سازمان شما برای استفاده و مقیاس‌دهی هوش مصنوعی را در هفت بُعد مشخص می‌کند.',
            },
          },
          {
            '@type': 'Question',
            name: 'چه چیزی ما را عقب نگه داشته است؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'خروجی ارزیابی گلوگاه‌های اصلی سازمان، مانند حاکمیت، سنجش ارزش یا کیفیت داده، را شناسایی می‌کند.',
            },
          },
          {
            '@type': 'Question',
            name: 'ارزیابی چقدر طول می‌کشد و آیا رایگان است؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'ارزیابی اولیه رایگان است و حدود ۱۰ دقیقه زمان می‌برد.',
            },
          },
        ],
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
 * Persian-only campaign landing page.
 *
 * Reachable both bare (`/AI-Readiness-Assessment`, which middleware.ts
 * rewrites onto the `en` segment) and under `/fa/…`, so RTL and the Persian
 * face are pinned here rather than inherited from the active locale.
 *
 * `lang="fa-IR"` — not plain `fa` — is deliberate: globals.css pins fixed
 * font sizes on `[lang="fa"] div|p|a|li|h1…h5` at a specificity Tailwind
 * utilities cannot beat, and that attribute selector is an exact match, so
 * the regional subtag declares the language correctly while sidestepping the
 * type-scale override.
 */
export default function AiReadinessAssessmentPage() {
  return (
    <div
      lang="fa-IR"
      dir="rtl"
      className={`ai-readiness min-h-screen ${vazirmatn.className}`}
      style={{ ['--ai-font' as string]: vazirmatn.style.fontFamily }}
    >
      {/* Without scripts the reveal animation never runs, so unhide everything. */}
      <noscript>
        <style>{`.ai-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <StructuredData />
      <AiHeader activeHref={aiLinks.landing} />

      <main>
        <HeroSection />
        <WhySection />
        <DimensionsSection />
        <ExperienceSection />
        <OutputSection />
        <MethodologySection />
        <StepsSection />
        <FinalCtaSection />
      </main>

      <AiFooter />
    </div>
  );
}
