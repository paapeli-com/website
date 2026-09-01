import React, { createContext, useContext } from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';
import { translations, Language, TranslationKey } from '@/features/factory/i18n/translations';
import { isRTLLanguage, setAppLanguage, useAppLanguage } from '@/shared/i18n/appLanguage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  /** Convert digits to localized digits (Arabic-Indic for ar/fa). */
  formatNumber: (n: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/* Language itself lives in the shell (src/shared/i18n/appLanguage.ts) so the
   header's switcher and this provider can never disagree; what stays here is
   this feature's own translation table and number formatting. */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useAppLanguage();
  const isRTL = isRTLLanguage(language);
  const setLanguage = setAppLanguage;

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const formatNumber = (n: number | string): string => {
    const s = String(n);
    if (language === 'fa') {
      const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
      return s.replace(/[0-9]/g, (d) => fa[+d]);
    }
    if (language === 'ar') {
      const ar = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
      return s.replace(/[0-9]/g, (d) => ar[+d]);
    }
    return s;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, formatNumber }}>
      <DirectionProvider dir={isRTL ? 'rtl' : 'ltr'}>{children}</DirectionProvider>
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
