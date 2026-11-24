/* The device-type catalog is written by hand in the admin panel, in English
   only, and has no field for other languages. The one type every workspace
   is offered, the platform's default, is the first thing a new user sees on
   the device form, so its name is translated here. Every other type keeps the
   label it was given, which is usually a model name and reads the same in any
   language (for example "gt06 GPS tracker"). */
const DEFAULT_TYPE: Record<string, string> = {
  fa: "دستگاه عمومی",
  ar: "جهاز عام",
};

export const deviceTypeLabel = (label: string | undefined, fallback: string, language: string): string => {
  const text = label || fallback;
  if (text.trim().toLowerCase() === "general device") return DEFAULT_TYPE[language] ?? text;
  return text;
};
