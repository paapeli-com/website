import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'fa' },
  ];
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