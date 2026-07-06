import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language, TranslationKey } from "./translations";
import { DEFAULT_BRAND } from "@/brand/brand";

type LanguageContextType = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  /** Localize digits to Persian/Arabic-Indic for fa/ar. */
  num: (n: number | string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return DEFAULT_BRAND.defaultLang;
    // `?lang=` override (used by previews/screenshots), then saved, then default.
    const q = new URLSearchParams(window.location.search).get("lang") as Language | null;
    if (q && ["en", "fa", "ar"].includes(q)) return q;
    const saved = window.localStorage.getItem("track_lang") as Language | null;
    return saved && ["en", "fa", "ar"].includes(saved) ? saved : DEFAULT_BRAND.defaultLang;
  });

  const isRTL = language === "fa" || language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    window.localStorage.setItem("track_lang", language);
  }, [language, isRTL]);

  const setLanguage = (l: Language) => setLanguageState(l);

  const t = (key: TranslationKey) => translations[language][key] || translations.en[key] || key;

  const num = (n: number | string) => {
    const s = String(n);
    if (language === "fa") return s.replace(/\d/g, (d) => FA_DIGITS[+d]);
    if (language === "ar") return s.replace(/\d/g, (d) => AR_DIGITS[+d]);
    return s;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, num }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
