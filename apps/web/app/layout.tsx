import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Providers from './providers';

import { poppins, tajawal, vazirmatn } from './fonts';

const RTL_LANGS = ['fa', 'ar'];


export const metadata: Metadata = {
  title: 'Paapeli - AI-Powered IoT Cloud Platform',
  description:
    "Build, connect, and manage IoT infrastructure intelligently with Paapeli's AI-powered cloud platform. Device management, real-time analytics, and secure OTA updates.",

  authors: [{ name: 'Paapeli' }],

  alternates: {
    canonical: 'https://www.paapeli.com/',
    languages: {
      en: 'https://www.paapeli.com/',
      fa: 'https://www.paapeli.com/fa/',
      ar: 'https://www.paapeli.com/ar/',
      'x-default': 'https://www.paapeli.com/',
    },
  },

  openGraph: {
    title: 'Paapeli - AI-Powered IoT Cloud Platform',
    description:
      'Connect devices, collect insights, and control your IoT infrastructure from anywhere with Paapeli.',
    url: 'https://www.paapeli.com/',
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
      </body>
    </html>
  );
}
