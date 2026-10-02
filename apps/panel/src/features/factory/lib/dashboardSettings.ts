import type { DashboardSettings, DashboardTimeWindow, DashboardTimeZone, IsoDuration } from "@paapeli/api";

/* The choices the dashboard form and the canvas toolbar offer for a
 * dashboard's settings, and the conversions between them and the ISO-8601
 * values the gateway stores in `definition.settings`. */

export type SettingsLang = "en" | "ar" | "fa";
type Labels = Record<SettingsLang, string>;

/** `null` means manual refresh. */
export const REFRESH_OPTIONS: Array<{ value: IsoDuration | null; label: Labels }> = [
  { value: null, label: { en: "Manual", ar: "يدوي", fa: "دستی" } },
  { value: "PT30S", label: { en: "Every 30 seconds", ar: "كل 30 ثانية", fa: "هر ۳۰ ثانیه" } },
  { value: "PT1M", label: { en: "Every minute", ar: "كل دقيقة", fa: "هر دقیقه" } },
  { value: "PT5M", label: { en: "Every 5 minutes", ar: "كل 5 دقائق", fa: "هر ۵ دقیقه" } },
  { value: "PT15M", label: { en: "Every 15 minutes", ar: "كل 15 دقيقة", fa: "هر ۱۵ دقیقه" } },
  { value: "PT1H", label: { en: "Every hour", ar: "كل ساعة", fa: "هر ساعت" } },
];

export const TIME_WINDOW_OPTIONS: Array<{ value: IsoDuration; label: Labels }> = [
  { value: "PT15M", label: { en: "Last 15 minutes", ar: "آخر 15 دقيقة", fa: "۱۵ دقیقه گذشته" } },
  { value: "PT1H", label: { en: "Last hour", ar: "آخر ساعة", fa: "ساعت گذشته" } },
  { value: "PT6H", label: { en: "Last 6 hours", ar: "آخر 6 ساعات", fa: "۶ ساعت گذشته" } },
  { value: "PT24H", label: { en: "Last 24 hours", ar: "آخر 24 ساعة", fa: "۲۴ ساعت گذشته" } },
  { value: "P7D", label: { en: "Last 7 days", ar: "آخر 7 أيام", fa: "۷ روز گذشته" } },
  { value: "P30D", label: { en: "Last 30 days", ar: "آخر 30 يوماً", fa: "۳۰ روز گذشته" } },
];

/** IANA zones offered by name; anything else stored on a dashboard is still shown. */
export const IANA_ZONES: Array<{ zoneId: string; label: Labels }> = [
  { zoneId: "UTC", label: { en: "(UTC) Coordinated Universal Time", ar: "(UTC) التوقيت العالمي المنسق", fa: "(UTC) زمان هماهنگ جهانی" } },
  { zoneId: "Asia/Tehran", label: { en: "(UTC+03:30) Tehran", ar: "(UTC+03:30) طهران", fa: "(UTC+03:30) تهران" } },
  { zoneId: "Asia/Riyadh", label: { en: "(UTC+03:00) Riyadh", ar: "(UTC+03:00) الرياض", fa: "(UTC+03:00) ریاض" } },
  { zoneId: "Asia/Dubai", label: { en: "(UTC+04:00) Dubai", ar: "(UTC+04:00) دبي", fa: "(UTC+04:00) دبی" } },
  { zoneId: "Europe/Istanbul", label: { en: "(UTC+03:00) Istanbul", ar: "(UTC+03:00) إسطنبول", fa: "(UTC+03:00) استانبول" } },
  { zoneId: "Europe/Berlin", label: { en: "(UTC+01:00) Central European Time", ar: "(UTC+01:00) توقيت وسط أوروبا", fa: "(UTC+01:00) زمان اروپای مرکزی" } },
  { zoneId: "America/New_York", label: { en: "(UTC-05:00) Eastern Time", ar: "(UTC-05:00) التوقيت الشرقي", fa: "(UTC-05:00) زمان شرقی آمریکا" } },
];

export const TIME_ZONE_MODE_LABELS: Record<"workspace" | "browser", Labels> = {
  workspace: { en: "Workspace time zone", ar: "المنطقة الزمنية لمساحة العمل", fa: "منطقه زمانی فضای کاری" },
  browser: { en: "Viewer's browser time zone", ar: "المنطقة الزمنية لمتصفح المشاهد", fa: "منطقه زمانی مرورگر بیننده" },
};

/** DashboardTimeZone ⇄ a single <Select> value: "workspace" | "browser" | "iana:<zoneId>". */
export const timeZoneToValue = (tz: DashboardTimeZone | undefined): string =>
  !tz ? "workspace" : tz.type === "iana" ? `iana:${tz.zoneId}` : tz.type;

export const valueToTimeZone = (v: string): DashboardTimeZone =>
  v.startsWith("iana:") ? { type: "iana", zoneId: v.slice(5) } : v === "browser" ? { type: "browser" } : { type: "workspace" };

export const timeZoneLabel = (tz: DashboardTimeZone | undefined, lang: SettingsLang): string => {
  if (!tz || tz.type !== "iana") return TIME_ZONE_MODE_LABELS[tz?.type ?? "workspace"][lang];
  return IANA_ZONES.find((z) => z.zoneId === tz.zoneId)?.label[lang] ?? tz.zoneId;
};

/**
 * The IANA zone to format times in. There is no workspace time-zone setting
 * to read yet, so "workspace" falls back to the browser's zone like "browser".
 */
export const resolveTimeZone = (tz: DashboardTimeZone | undefined): string => {
  if (tz?.type === "iana") return tz.zoneId;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** The settings a new dashboard gets (matches the form's initial state). */
export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  // A new dashboard opens on the last hour. Anything wider buries a live
  // reading in yesterday's data before you have added a single panel.
  timeWindow: { type: "relative", last: "PT1H" },
  refreshInterval: null,
  timeZone: { type: "workspace" },
};

/**
 * Milliseconds in an ISO-8601 duration. Handles the day/time designators
 * dashboards use (PnDTnHnMnS, and PnW); years and months are not fixed
 * lengths and aren't offered, so they are rejected rather than guessed.
 */
export const isoDurationToMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const week = /^P(\d+(?:\.\d+)?)W$/.exec(iso);
  if (week) return Number(week[1]) * 7 * 86_400_000;
  const m = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso);
  if (!m || iso === "P" || iso.endsWith("T")) return null;
  const [, d, h, min, s] = m.map((x) => (x ? Number(x) : 0)) as number[];
  return ((d * 24 + h) * 60 + min) * 60_000 + s * 1000;
};

export const timeWindowMs = (w: DashboardTimeWindow | null | undefined): number =>
  (w?.type === "relative" ? isoDurationToMs(w.last) : null) ?? 3_600_000;

export const timeWindowLabel = (w: DashboardTimeWindow | null | undefined, lang: SettingsLang): string => {
  const last = w?.type === "relative" ? w.last : undefined;
  return TIME_WINDOW_OPTIONS.find((o) => o.value === last)?.label[lang] ?? last ?? "";
};
