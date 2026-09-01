import { useSyncExternalStore } from "react";
import { DEFAULT_BRAND } from "@paapeli/brand/config";

/* The one language the whole panel runs in.

   The header lives in the shell, above every feature's router, so it can't
   read a feature's LanguageProvider — and the features each used to own an
   isolated copy of this state (different localStorage keys, different
   defaults), so switching in one left the other behind. This module is the
   single source of truth: the shell menu writes it, and both feature
   providers subscribe to it for their own `t()` helpers. */

export type AppLanguage = "en" | "fa" | "ar";

export const APP_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fa", label: "فارسی" },
];

const STORAGE_KEY = "lang";

const isLanguage = (v: unknown): v is AppLanguage => v === "en" || v === "fa" || v === "ar";

export const isRTLLanguage = (lang: AppLanguage) => lang === "fa" || lang === "ar";

function initialLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_BRAND.defaultLang;
  // `?lang=` override (used by previews/screenshots), then saved, then brand default.
  const q = new URLSearchParams(window.location.search).get("lang");
  if (isLanguage(q)) return q;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(saved) ? saved : DEFAULT_BRAND.defaultLang;
}

let current: AppLanguage = initialLanguage();
const listeners = new Set<() => void>();

function applyToDocument(lang: AppLanguage) {
  const rtl = isRTLLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  // The factory feature's stylesheet keys a few overrides off `body.rtl`.
  document.body?.classList.toggle("rtl", rtl);
}

if (typeof window !== "undefined") applyToDocument(current);

export function getAppLanguage(): AppLanguage {
  return current;
}

export function setAppLanguage(lang: AppLanguage) {
  if (lang === current) return;
  current = lang;
  window.localStorage.setItem(STORAGE_KEY, lang);
  applyToDocument(lang);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Re-renders the caller whenever the language changes, from anywhere. */
export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(subscribe, getAppLanguage, getAppLanguage);
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Digits (and the thousands separator) in the script the language is read in. */
export function localizeDigits(lang: AppLanguage, value: string | number): string {
  const s = String(value);
  if (lang === "fa") return s.replace(/\d/g, (d) => FA_DIGITS[+d]).replace(/,/g, "٬");
  if (lang === "ar") return s.replace(/\d/g, (d) => AR_DIGITS[+d]).replace(/,/g, "٬");
  return s;
}
