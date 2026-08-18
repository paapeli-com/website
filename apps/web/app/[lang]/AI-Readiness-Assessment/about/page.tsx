import type { Metadata } from 'next';
import { vazirmatn } from '@/app/fonts';

import '@/components/ai-readiness/theme.css';
import { AiHeader, subPageNav } from '@/components/ai-readiness/AiHeader';
import { AiFooter } from '@/components/ai-readiness/AiFooter';
import { FinalCtaSection } from '@/components/ai-readiness/FinalCtaSection';
import { aiLinks, AI_BASE, companySites } from '@/components/ai-readiness/links';
import {
  AboutHero,
  OutcomeSection,
  PartnershipSection,
  ResearchSection,
  WhoSection,
  WhyItMattersSection,
} from '@/components/ai-readiness/about/sections';
import { companies, outcomeCards, whyCards } from '@/components/ai-readiness/about/content';

const URL = `https://www.paapeli.com${AI_BASE}/about`;
const TITLE = 'درباره ارزیابی آمادگی هوش مصنوعی | Paapeli × Rayka';
const DESCRIPTION =
  'چرا این ارزیابی مهم است، چه کسانی پشت آن هستند، و چه چیزی به سازمان شما می‌دهد. ترکیب نگاه مدیریتی رایکا با توانمندی فناوری پاپلی برای تبدیل بینش به اثر واقعی.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'درباره ارزیابی آمادگی هوش مصنوعی',
    'رایکا',
    'پاپلی',
    'مشاوره مدیریت هوش مصنوعی',
    'خلق ارزش از AI',
    'مقیاس‌دهی هوش مصنوعی',
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

/** Structured data mirroring what the page actually shows. */
function StructuredData() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': URL,
        url: URL,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: 'fa-IR',
        isPartOf: { '@type': 'WebSite', url: 'https://www.paapeli.com/', name: 'Paapeli' },
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
          { '@type': 'ListItem', position: 2, name: 'درباره ارزیابی', item: URL },
        ],
      },
      ...companies.map((c) => ({
        '@type': 'Organization',
        name: c.name,
        url: c.site,
        description: c.body,
        knowsAbout: c.tags.map((t) => t.label),
      })),
      {
        '@type': 'ItemList',
        name: 'این ارزیابی چرا مهم است؟',
        inLanguage: 'fa-IR',
        itemListElement: whyCards.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.title,
          description: c.body,
        })),
      },
      {
        '@type': 'ItemList',
        name: 'این ارزیابی چه چیزی به شما می‌دهد؟',
        inLanguage: 'fa-IR',
        itemListElement: outcomeCards.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.title,
          description: c.body,
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
 * "درباره ارزیابی" page. Shares the palette, type and components of the
 * landing page — see the note there for why `lang="fa-IR"` rather than `fa`.
 */
export default function AboutPage() {
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

      {/* Tell crawlers the two partner sites are deliberate outbound links. */}
      <link rel="preconnect" href={companySites.paapeli} />
      <link rel="preconnect" href={companySites.rayka} />

      <StructuredData />
      <AiHeader
        navItems={subPageNav}
        brandHref={aiLinks.landing}
        activeHref={aiLinks.aboutPage}
      />

      <main>
        <AboutHero />
        <WhyItMattersSection />
        <WhoSection />
        <PartnershipSection />
        <ResearchSection />
        <OutcomeSection />
        <FinalCtaSection
          title="اکنون سازمان خود را ارزیابی کنید"
          body="این ارزیابی به شما کمک می‌کند از گزارش و بینش، به تصمیم و اقدام برسید."
          secondaryLabel="بازگشت به صفحه اصلی"
          secondaryHref={aiLinks.landing}
        />
      </main>

      <AiFooter />
    </div>
  );
}
