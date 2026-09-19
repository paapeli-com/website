import { getAppLanguage } from "@/shared/i18n/appLanguage";

type Lang = "en" | "ar" | "fa";

/* Dates in the calendar the reader actually keeps.
 *
 * A Persian reader counts in the Persian (Jalali) calendar and an Arabic
 * reader in the Hijri one, so "9/16/2026" is not a translation of anything —
 * it is a different year. Intl does the conversion; all this picks is the
 * locale to hand it.
 *
 * The calendar is spelled out with the -u-ca- extension rather than left to
 * the locale's default. fa-IR does default to the Persian calendar, but ar-EG
 * and a bare "ar" default to Gregorian, which is how several pages ended up
 * looking localised while still printing the wrong year. The extension form
 * also needs nothing of Intl beyond locale parsing.
 *
 * Digits follow the locale too: Persian and Arabic-Indic numerals come out of
 * Intl already, so nothing else has to localise them.
 *
 * `language` is optional and defaults to the panel's active language, which
 * these read straight from the store rather than from a hook. That is what
 * makes them usable from a module-level helper as much as from a component,
 * and it means a new page gets the right calendar by calling formatDate(x)
 * and nothing else. A language switch still re-renders every caller, since
 * the providers that own the switch subscribe to the same store.
 */
const LOCALE: Record<Lang, string> = {
  en: "en-US",
  fa: "fa-IR-u-ca-persian",
  ar: "ar-SA-u-ca-islamic-umalqura",
};

/** The locale string to hand Intl, for callers that need their own options. */
export const dateLocale = (language: string = getAppLanguage()): string =>
  LOCALE[(language as Lang) in LOCALE ? (language as Lang) : "en"];

const toDate = (value: string | number | Date | undefined | null): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** The date alone, in the reader's calendar. */
export function formatDate(
  value: string | number | Date | undefined | null,
  language?: string,
  fallback = "—",
): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString(dateLocale(language)) : fallback;
}

/** The same with the time of day; `seconds` for a telemetry reading. */
export function formatDateTime(
  value: string | number | Date | undefined | null,
  language?: string,
  { seconds = false, fallback = "—" }: { seconds?: boolean; fallback?: string } = {},
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleString(dateLocale(language), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
  });
}

/** Time of day alone, for a row that already says which day it is. */
export function formatTime(
  value: string | number | Date | undefined | null,
  language?: string,
  fallback = "—",
): string {
  const d = toDate(value);
  return d ? d.toLocaleTimeString(dateLocale(language)) : fallback;
}
