import type { Metadata } from 'next';
import Script from 'next/script';

import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
import { metadataForRoute } from '@/lib/route-metadata';
import { SITE_URL } from '@/lib/seo';
import Providers from '../providers';

import { poppins, tajawal, vazirmatn } from '../fonts';

/* ------------------------------------------------------------------ */
/* The document, and the home page's metadata.                         */
/*                                                                     */
/* This is the root layout. It sits under [lang] rather than above it  */
/* because <html lang> and dir have to be right in the HTML that comes */
/* off the server: globals.css hangs the Persian and Arabic fonts, the */
/* 1.85 line-height and the RTL rules off [lang="fa"] / [lang="ar"],   */
/* so a document that arrives without the attribute paints every       */
/* Persian page left-to-right in the Latin font and only rights itself */
/* once the client sets them — a full reflow on every visit. Above     */
/* [lang] there is no way to know the language, which is exactly why   */
/* it lives here.                                                      */
/*                                                                     */
/* Every address reaches a locale: the middleware rewrites bare paths  */
/* to /en, so "/" and "/pricing" render this document too.             */
/* ------------------------------------------------------------------ */

const RTL_LANGS = ['fa', 'ar'];

/* The docs site measures with this same ID on purpose: docs.paapeli.com
   and www.paapeli.com are one property, so a visit that starts on the
   marketing site and ends in the documentation stays one session. */
const GA_MEASUREMENT_ID = 'G-03JWQ664FV';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'fa' },
  ];
}

/**
 * The site-wide defaults, plus the home page's own canonical and
 * hreflang — this layout covers "/" and nothing else, because every
 * other page carries its own route layout (see lib/route-metadata).
 *
 * The title template declared here is what lets those route layouts
 * export a bare title and still come out "Pricing | Paapeli".
 */
export async function generateMetadata({ params }: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const home = await metadataForRoute('/')({ params });

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: 'Paapeli - AI-Powered IoT Cloud Platform',
      template: '%s | Paapeli',
    },
    description:
      "Build, connect, and manage IoT infrastructure intelligently with Paapeli's AI-powered cloud platform. Device management, real-time analytics, and secure OTA updates.",

    authors: [{ name: 'Paapeli' }],

    icons: {
      icon: '/favicon.ico',
      apple: '/favicon.ico',
      shortcut: '/favicon.ico',
    },

    ...home,

    openGraph: {
      title: 'Paapeli - AI-Powered IoT Cloud Platform',
      description:
        'Connect devices, collect insights, and control your IoT infrastructure from anywhere with Paapeli.',
      siteName: 'Paapeli',
      type: 'website',
      ...home.openGraph,
    },
  };
}

export default async function LangLayout({ children, params }: {
  children: React.ReactNode;
  /* Next 15 hands params in as a promise. */
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;

  const fontClass =
    lang === 'ar'
      ? tajawal.className
      : lang === 'fa'
      ? vazirmatn.className
      : poppins.className;

  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} className={poppins.variable} suppressHydrationWarning>
      <body className={fontClass}>
        <Providers>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LanguageProvider lang={lang}>{children}</LanguageProvider>
          </TooltipProvider>
        </Providers>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            /* GA4's own "language" is the browser's, which says nothing
               about which of the three translations was read. The locale
               is in the address — English at the bare path, Persian and
               Arabic behind a prefix — so it rides along with every hit
               as content_language. */
            var seg = location.pathname.split('/')[1];
            var contentLanguage = (seg === 'fa' || seg === 'ar') ? seg : 'en';
            gtag('config', '${GA_MEASUREMENT_ID}', { content_language: contentLanguage });
          `}
        </Script>
      </body>
    </html>
  );
}
