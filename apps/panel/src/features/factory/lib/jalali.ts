/* The Persian (Jalali) calendar, for picking a date in it.
 *
 * Reading a date in the Persian calendar is Intl's job (see
 * shared/lib/formatDate.ts). Going the other way, from a Persian year, month
 * and day to a moment, Intl does not do, so it is worked out from what Intl
 * does say: the day the year starts is found by asking it about the few March
 * days Nowruz can fall on, and the rest is counting, since the first six
 * months have 31 days, the next five 30, and the last 29 or 30.
 */

export interface JalaliDay {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
}

const reader = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** The Persian date of a moment, in the browser's own time zone. */
export const toJalali = (date: Date): JalaliDay => {
  const parts = reader.formatToParts(date);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: read("year"), month: read("month"), day: read("day") };
};

/* Noon, so a daylight-saving shift at midnight cannot move the day. */
const noon = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day, 12);

const nowruzCache = new Map<number, Date>();

/** The first day of a Persian year, at noon. */
const nowruz = (year: number): Date => {
  const cached = nowruzCache.get(year);
  if (cached) return cached;
  for (let day = 18; day <= 23; day++) {
    const candidate = noon(year + 621, 2, day);
    const j = toJalali(candidate);
    if (j.year === year && j.month === 1 && j.day === 1) {
      nowruzCache.set(year, candidate);
      return candidate;
    }
  }
  // Never reached for a year Intl knows; the usual day keeps the picker working.
  return noon(year + 621, 2, 21);
};

const DAY_MS = 86_400_000;

/** How many days a Persian month has. */
export const jalaliMonthLength = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const yearLength = Math.round((nowruz(year + 1).getTime() - nowruz(year).getTime()) / DAY_MS);
  return yearLength - 336;
};

/** A Persian date as a moment, at the given time of day in the browser's zone. */
export const fromJalali = ({ year, month, day }: JalaliDay, hours = 12, minutes = 0): Date => {
  const before = month <= 7 ? (month - 1) * 31 : 186 + (month - 7) * 30;
  const start = nowruz(year);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + before + day - 1, hours, minutes);
};

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Saturday first, as a Persian week runs. */
export const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/** Where a moment's weekday sits in a week that starts on Saturday: 0 to 6. */
export const saturdayFirstIndex = (date: Date) => (date.getDay() + 1) % 7;
