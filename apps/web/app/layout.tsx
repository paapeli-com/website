import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Providers from './providers';
import { SITE_URL } from '@/lib/seo';

import { poppins, tajawal, vazirmatn } from './fonts';

const RTL_LANGS = ['fa', 'ar'];

/* The docs site measures with this same ID on purpose: docs.paapeli.com
   and www.paapeli.com are one property, so a visit that starts on the
   marketing site and ends in the documentation stays one session. */
const GA_MEASUREMENT_ID = 'G-03JWQ664FV';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  /* The default is the home page's own title; every other page sets its
     own in lib/page-meta.ts and gets the brand appended by the template. */
  title: {
    default: 'Paapeli - AI-Powered IoT Cloud Platform',
    template: '%s | Paapeli',
  },
  description:
    "Build, connect, and manage IoT infrastructure intelligently with Paapeli's AI-powered cloud platform. Device management, real-time analytics, and secure OTA updates.",

  authors: [{ name: 'Paapeli' }],

  /* No canonical or hreflang here. This layout sits above the [lang]
     segment and cannot know which page is being served, so whatever it
     declares lands on all of them — which is how every page came to name
     the home page as its canonical. app/[lang]/layout.tsx builds them
     per page instead. */

  openGraph: {
    title: 'Paapeli - AI-Powered IoT Cloud Platform',
    description:
      'Connect devices, collect insights, and control your IoT infrastructure from anywhere with Paapeli.',
    siteName: 'Paapeli',
    type: 'website',
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {

    const { lang } = params;

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
            {children}
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
