import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
import { metadataForRoute } from '@/lib/route-metadata';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'fa' },
  ];
}

/**
 * This layout covers the home page, the only route that sits directly
 * under [lang]. Every other page carries its own route layout, which is
 * what lets all of them stay statically rendered — see lib/route-metadata.
 *
 * The locale comes from params. It used to be read out of the request
 * headers because params arrived as English for every locale in
 * production; that was the SPA catch-all in vercel.json sending every
 * address to the app root, and it is gone.
 */
export const generateMetadata = metadataForRoute('/');

export default async function LangLayout({ children, params }: {
  children: React.ReactNode;
  /* Next 15 hands params in as a promise; the code already awaited it. */
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;

  return (
    <LanguageProvider lang={lang}>
      {children}
    </LanguageProvider>
  );
}
