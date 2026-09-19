type Lang = "en" | "ar" | "fa";

/* Dates in the calendar the reader actually keeps.
 *
 * A Persian reader counts in the Persian (Jalali) calendar and an Arabic
 * reader in the Hijri one, so "9/16/2026" is not a translation of anything —
 * it is a different year. Intl does the conversion; all this picks is the
 * locale to hand it.
 *
 * The calendar is spelled out with the -u-ca- extension rather than left to
 * the locale's default or passed as the `calendar` option. fa-IR does default
 * to the Persian calendar and ar-SA to Hijri, but the default is the CLDR's
 * to change, and this is not a detail to discover from a bug report. The
 * extension form also needs nothing of Intl beyond locale parsing.
 *
 * Digits follow the locale too: Persian and Arabic-Indic numerals come out of
 * Intl already, so nothing else has to localise them.
 */
const LOCALE: Record<Lang, string> = {
  en: "en-US",
  fa: "fa-IR-u-ca-persian",
  ar: "ar-SA-u-ca-islamic-umalqura",
};

const localeFor = (language: string) => LOCALE[(language as Lang) in LOCALE ? (language as Lang) : "en"];

const toDate = (value: string | number | Date): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "16/06/1405" — the date alone, in the reader's calendar. */
export function formatDate(value: string | number | Date, language: string, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(localeFor(language));
}

/** The same with the time of day; `seconds` for a telemetry reading. */
export function formatDateTime(
  value: string | number | Date,
  language: string,
  { seconds = false, fallback = "—" }: { seconds?: boolean; fallback?: string } = {},
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleString(localeFor(language), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
  });
}
