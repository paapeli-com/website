import { headers } from 'next/headers';
import type { Metadata } from 'next';

import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
import { metaFor } from '@/lib/page-meta';
import { alternatesFor, localeOf, routeOf } from '@/lib/seo';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'fa' },
  ];
}

/**
 * The title, description, canonical and hreflang links for whatever page
 * is being rendered.
 *
 * A layout is not told which page sits under it, so the address comes
 * from the x-pathname header the middleware sets — the middleware
 * rewrites "/gps-tracking" to "/en/gps-tracking", and without the header
 * the rendered page has no way back to the address the visitor asked
 * for. Every page under here inherits these, which matters because 32
 * of the 39 pages are client components and cannot export metadata of
 * their own.
 *
 * The locale is read from that same header rather than from the layout's
 * own params: in production those came back as English for every locale,
 * which pointed each Persian and Arabic page at its English twin.
 */
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get('x-pathname') ?? '/';
  const locale = localeOf(pathname);
  const route = routeOf(pathname);

  const alternates = alternatesFor(locale, route);
  const meta = metaFor(locale, route);

  return {
    ...(meta && { title: meta.title, description: meta.description }),
    alternates,
    openGraph: {
      url: alternates.canonical,
      ...(meta && { title: meta.title, description: meta.description }),
    },
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
