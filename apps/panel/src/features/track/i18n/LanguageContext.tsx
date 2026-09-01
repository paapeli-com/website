import React, { createContext, useContext } from "react";
import { translations, LABELS, Language, TranslationKey } from "./translations";
import { isRTLLanguage, setAppLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";

type LanguageContextType = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  /** Localize digits to Persian/Arabic-Indic for fa/ar. */
  num: (n: number | string) => string;
  /** Localized relative time (e.g. "5m ago" / "۵ دقیقه پیش"). */
  relTime: (iso: string) => string;
  /** Localize a mock-data token (subtype / zone name); passes unknown through. */
  label: (token: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/* Language itself lives in the shell (src/shared/i18n/appLanguage.ts) so the
   header's switcher and this provider can never disagree; what stays here is
   this feature's own translation table and formatting helpers. */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useAppLanguage();
  const isRTL = isRTLLanguage(language);
  const setLanguage = setAppLanguage;

  const t = (key: TranslationKey) => translations[language][key] || translations.en[key] || key;

  const num = (n: number | string) => {
    const s = String(n);
    if (language === "fa") return s.replace(/\d/g, (d) => FA_DIGITS[+d]);
    if (language === "ar") return s.replace(/\d/g, (d) => AR_DIGITS[+d]);
    return s;
  };

  const relTime = (iso: string) => {
    const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (language === "fa") {
      if (m < 1) return "همین الان";
      if (m < 60) return `${num(m)} دقیقه پیش`;
      if (h < 24) return `${num(h)} ساعت و ${num(m % 60)} دقیقه پیش`;
      return `${num(d)} روز پیش`;
    }
    if (language === "ar") {
      if (m < 1) return "الآن";
      if (m < 60) return `منذ ${num(m)} دقيقة`;
      if (h < 24) return `منذ ${num(h)} ساعة و${num(m % 60)} دقيقة`;
      return `منذ ${num(d)} يوم`;
    }
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ${m % 60}m ago`;
    return `${d}d ago`;
  };

  const label = (token: string) => LABELS[language][token] ?? token;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, num, relTime, label }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
