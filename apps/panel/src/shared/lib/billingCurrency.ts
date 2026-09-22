import { useSyncExternalStore } from "react";
import { localizeDigits, useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

/* Which currency an account is billed in.
 *
 * This is deliberately NOT derived from the panel's language. They are two
 * different jobs: the language decides how an amount is written, the account
 * decides what the amount is in. Tying them together gets both wrong at once —
 * an Iranian reading the panel in English would be billed in dollars, and
 * anyone who switched to Persian to look around would be billed in Toman.
 *
 * So: the currency belongs to the workspace's billing profile, one value for
 * everyone in it, because two people in the same workspace have to see the
 * same bill. There is no endpoint carrying it yet, so it lives in this browser
 * and starts from a guess. When the field exists on the workspace, this module
 * is the one place that changes.
 *
 * The guess is the browser's timezone, not the language: someone in Tehran has
 * Asia/Tehran whatever the panel is set to, which is exactly the case the
 * language cannot answer. It is only ever a default — every surface that shows
 * money shows the currency with it, and the billing profile can change it.
 *
 * One currency per workspace, no conversion anywhere in the client: an invoice
 * is issued in one currency and keeps it. */

export type CurrencyCode = "TOMAN" | "QAR" | "USD";

export const CURRENCIES: CurrencyCode[] = ["TOMAN", "QAR", "USD"];

/** What the currency is called, in the language the reader is reading. */
const NAMES: Record<CurrencyCode, Record<AppLanguage, string>> = {
  TOMAN: { en: "Toman", fa: "تومان", ar: "تومان" },
  QAR: { en: "QAR", fa: "ریال قطر", ar: "ر.ق" },
  USD: { en: "USD", fa: "دلار", ar: "دولار" },
};

const STORAGE_KEY = "paapeli.billing.currency";

const isCurrency = (v: unknown): v is CurrencyCode =>
  v === "TOMAN" || v === "QAR" || v === "USD";

/** Where the account is, as far as the browser can tell. */
function inferCurrency(): CurrencyCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (tz === "Asia/Tehran") return "TOMAN";
    if (tz === "Asia/Qatar") return "QAR";
  } catch {
    /* no Intl, or it threw: fall through to the default */
  }
  return "USD";
}

function initialCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isCurrency(saved)) return saved;
  } catch {
    /* private mode / storage blocked: the guess still stands */
  }
  return inferCurrency();
}

let current: CurrencyCode = initialCurrency();
const listeners = new Set<() => void>();

export function getBillingCurrency(): CurrencyCode {
  return current;
}

/** Changing this changes every amount in the panel at once, by design. */
export function setBillingCurrency(code: CurrencyCode) {
  if (code === current) return;
  current = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* the choice still applies for this session */
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** The currency's name, in the language it is being read in. */
export function currencyName(code: CurrencyCode, lang: AppLanguage): string {
  return NAMES[code][lang];
}

/**
 * An amount, written the way the reader reads numbers, in the currency the
 * account is billed in. Number then name, which works in all three languages
 * and is how the panel already writes amounts.
 */
export function formatMoney(
  amount: number,
  code: CurrencyCode,
  lang: AppLanguage,
): string {
  const digits = localizeDigits(lang, amount.toLocaleString("en-US"));
  return `${digits} ${currencyName(code, lang)}`;
}

/**
 * The currency this account is billed in, and how to write amounts in it.
 * Re-renders the caller when it changes, from anywhere — the header chip and
 * the billing page have to agree.
 */
export function useBillingCurrency() {
  const currency = useSyncExternalStore(subscribe, getBillingCurrency, getBillingCurrency);
  const language = useAppLanguage();
  return {
    currency,
    setCurrency: setBillingCurrency,
    /** The currency's name on its own, for a number rendered separately. */
    name: currencyName(currency, language),
    /** An amount and its currency together. */
    format: (amount: number) => formatMoney(amount, currency, language),
  };
}
