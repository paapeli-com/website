import type { Metadata } from 'next';
import { vazirmatn } from '@/app/fonts';

import '@/components/ai-readiness/theme.css';
import { AiHeader, subPageNav } from '@/components/ai-readiness/AiHeader';
import { AiFooter } from '@/components/ai-readiness/AiFooter';
import { FinalCtaSection } from '@/components/ai-readiness/FinalCtaSection';
import { aiLinks, AI_BASE } from '@/components/ai-readiness/links';
import {
  ArchiveSection,
  AudienceSection,
  DownloadSection,
  HighlightsSection,
  ReportHero,
} from '@/components/ai-readiness/report/sections';
import { highlights, report } from '@/components/ai-readiness/report/content';

const URL = `https://www.paapeli.com${AI_BASE}/report`;
const TITLE = 'گزارش جامع وضعیت هوش مصنوعی در ایران، شماره ۰ | Paapeli × Rayka';
const DESCRIPTION =
  'مروری مدیریتی بر روندهای جهانی AI، مسیر تحول دیجیتال و وضعیت فعلی هوش مصنوعی در ایران: نفوذ در صنایع، زیرساخت، چالش‌ها و فرصت‌ها. دریافت رایگان نسخه PDF.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'گزارش هوش مصنوعی ایران',
    'وضعیت AI در ایران',
    'تحول دیجیتال',
    'هوش مصنوعی مولد',
    'نفوذ AI در صنایع',
    'زیرساخت هوش مصنوعی',
    'Paapeli',
    'Rayka',
  ],
  alternates: { canonical: URL },
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

function StructuredData() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Report',
        '@id': URL,
        url: URL,
        name: report.title,
        alternativeHeadline: report.subtitle,
        description: report.lead,
        inLanguage: 'fa-IR',
        reportNumber: report.number,
        numberOfPages: 42,
        fileFormat: 'application/pdf',
        isAccessibleForFree: true,
        author: [
          { '@type': 'Organization', name: 'Paapeli' },
          { '@type': 'Organization', name: 'Rayka' },
        ],
        publisher: { '@type': 'Organization', name: 'Paapeli' },
        about: highlights.map((h) => h.title),
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
          { '@type': 'ListItem', position: 2, name: 'مطالعه گزارش', item: URL },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'آنچه در این گزارش خواهید خواند',
        inLanguage: 'fa-IR',
        itemListElement: highlights.map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: h.title,
          description: h.body,
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
 * "مطالعه گزارش" page. Shares the palette, type and chrome of the landing
 * page — see the note there for why `lang="fa-IR"` rather than `fa`.
 */
export default function ReportPage() {
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
      <AiHeader navItems={subPageNav} activeHref={aiLinks.report} />

      <main>
        <ReportHero />
        <HighlightsSection />
        <AudienceSection />
        <DownloadSection />
        <ArchiveSection />
        <FinalCtaSection
          title="گزارش را خواندید، حالا نوبت ارزیابی سازمان شماست"
          body="بعد از مطالعه گزارش، آمادگی سازمان خود برای هوش مصنوعی را در چند دقیقه ارزیابی کنید."
          secondaryLabel="بازگشت به صفحه اصلی"
          secondaryHref={aiLinks.landing}
        />
      </main>

      <AiFooter />
    </div>
  );
}
