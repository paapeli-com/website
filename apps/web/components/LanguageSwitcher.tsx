'use client';

import { Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/src/i18n/translations';

const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  { code: 'fa' as Language, name: 'Persian', nativeName: 'فارسی' },
];

export const LanguageSwitcher = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const pathname = usePathname();

  /* The same page in another language, which means dropping the locale
     prefix the current path carries and putting the new one on.

     The lookahead matters: without it "/energy-monitoring" starts with
     "/en" and gets chopped down to "ergy-monitoring". Only a whole path
     segment is a locale.

     English lives at the bare path. Linking it to "/en/..." would point
     every page at a 301 to its own bare address, which spends a
     crawler's budget on a URL that only sends it somewhere else. */
  const getPathForLanguage = (lang: Language) => {
    const pathWithoutLang = pathname.replace(/^\/(en|ar|fa)(?=\/|$)/, '');
    return lang === 'en'
      ? pathWithoutLang || '/'
      : `/${lang}${pathWithoutLang || ''}`;
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={(e) => {
        const menu = e.currentTarget.querySelector('[data-lang-menu]') as HTMLElement;
        if (menu) {
          clearTimeout((menu as any).hideTimeout);
          menu.classList.remove('hidden');
        }
      }}
      onMouseLeave={(e) => {
        const menu = e.currentTarget.querySelector('[data-lang-menu]') as HTMLElement;
        if (menu) {
          (menu as any).hideTimeout = setTimeout(() => {
            menu.classList.add('hidden');
          }, 200);
        }
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="language-switcher-btn gap-2 border-white/20 bg-white/10 backdrop-blur-sm text-black hover:bg-white/20 hover:text-[#FF7A00]"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {languages.find((l) => l.code === language)?.nativeName}
        </span>
      </Button>

      <div
        data-lang-menu
        className={`hidden absolute ${
          isRTL ? 'left-0' : 'right-0'
        } top-full mt-2 w-40 bg-card border border-border rounded-md shadow-lg z-50`}
        onMouseEnter={(e) => {
          const menu = e.currentTarget as HTMLElement;
          clearTimeout((menu as any).hideTimeout);
        }}
        onMouseLeave={(e) => {
          const menu = e.currentTarget as HTMLElement;
          (menu as any).hideTimeout = setTimeout(() => {
            menu.classList.add('hidden');
          }, 200);
        }}
      >
        <div className="py-1">
          {languages.map((lang) => (
            <Link
              key={lang.code}
              href={getPathForLanguage(lang.code)}
              hrefLang={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`block w-full px-4 py-2 text-sm hover:bg-accent ${
                language === lang.code
                  ? 'bg-primary/10 text-primary font-medium'
                  : ''
              }`}
            >
              {lang.nativeName}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
