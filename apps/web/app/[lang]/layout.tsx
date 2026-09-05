import { headers } from 'next/headers';
import type { Metadata } from 'next';

import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
import { DEFAULT_LOCALE, LOCALES, alternatesFor, routeOf, type Locale } from '@/lib/seo';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'fa' },
  ];
}

/**
 * The canonical and hreflang links for whatever page is being rendered.
 *
 * A layout is not told which page sits under it, so the address comes
 * from the x-pathname header the middleware sets — the middleware
 * rewrites "/gps-tracking" to "/en/gps-tracking", and without the header
 * the rendered page has no way back to the address the visitor asked
 * for. Every page under here inherits these, which matters because 32
 * of the 39 pages are client components and cannot export metadata of
 * their own.
 */
export async function generateMetadata({ params }: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = LOCALES.includes(lang as Locale)
    ? (lang as Locale)
    : DEFAULT_LOCALE;

  const requestHeaders = await headers();
  const route = routeOf(requestHeaders.get('x-pathname') ?? '/');
  const alternates = alternatesFor(locale, route);

  return {
    alternates,
    openGraph: { url: alternates.canonical },
  };
}

export default async function LangLayout({ children, params }: {
  children: React.ReactNode;
  params: { lang: Language };
}) {
  const { lang } = await params;

  return (
    <LanguageProvider lang={lang}>
      {children}
    </LanguageProvider>
  );
}
