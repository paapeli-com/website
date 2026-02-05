'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { translations, Language, TranslationKey } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode; lang?: Language }> = ({ children, lang }) => {
  const router = useRouter();
  const pathname = usePathname();

  const getInitialLanguage = (): Language => {
    if (lang && ['en', 'ar', 'fa'].includes(lang)) {
      return lang;
    }

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang && ['en', 'ar', 'fa'].includes(savedLang)) {
        return savedLang;
      }
    }

    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage());
  const isRTL = language === 'ar' || language === 'fa';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }

    const currentPath = pathname || '/';
    const pathWithoutLang = currentPath.replace(/^\/(en|ar|fa)/, '');
    const newPath = lang === 'en' ? (pathWithoutLang || '/') : `/${lang}${pathWithoutLang || ''}`;
    router.push(newPath);
  };

  useEffect(() => {
    if (lang && ['en', 'ar', 'fa'].includes(lang)) {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lang', lang);
      }
    }
  }, [lang]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.classList.toggle('rtl', isRTL);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', language);
    }
  }, [language, isRTL]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
