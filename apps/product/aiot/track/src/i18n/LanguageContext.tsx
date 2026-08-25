import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, LABELS, Language, TranslationKey } from "./translations";
import { DEFAULT_BRAND } from "@paapeli/brand/config";

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
