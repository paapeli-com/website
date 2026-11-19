import type { Language } from "@/features/factory/i18n/translations";
import type { FactorySolution } from "@/features/factory/lib/product";

/* Where a solution words the same page differently. Smart Greenhouse uses
   Smart Factory's pages (see lib/product.ts), and most of their copy fits both:
   devices, gateways, alarms and work orders are the same things in a
   greenhouse. Where a grower would call something else by another name, the
   word is replaced here, for that solution only; every other key falls through
   to translations.ts unchanged. */
const TEXT: Partial<Record<FactorySolution, Record<Language, Record<string, string>>>> = {
  SmartGreenhouse: {
    en: {
      locations: "Greenhouses",
      allLocations: "All greenhouses",
      searchLocation: "Search greenhouses and zones",
      noLocationTree: "No greenhouses yet",
    },
    fa: {
      locations: "گلخانه‌ها",
      allLocations: "همه گلخانه‌ها",
      searchLocation: "جستجوی گلخانه و بخش",
      noLocationTree: "هنوز گلخانه‌ای ثبت نشده است",
    },
    ar: {
      locations: "الدفيئات",
      allLocations: "جميع الدفيئات",
      searchLocation: "بحث في الدفيئات والمناطق",
      noLocationTree: "لا توجد دفيئات بعد",
    },
  },
};

/** The solution's own wording for a key, or undefined to use the shared one. */
export const solutionText = (solution: FactorySolution, language: Language, key: string): string | undefined =>
  TEXT[solution]?.[language]?.[key];

/* The location tree's levels as the server names them, in each language. The
   server keeps one English label per asset type; these are the greenhouse's
   (see the gateway's V59 migration). A type not listed here keeps the
   server's label. */
const ASSET_TYPES: Record<string, Record<Language, string>> = {
  GREENHOUSE: { en: "Greenhouse", fa: "گلخانه", ar: "دفيئة" },
  ZONE: { en: "Zone", fa: "بخش", ar: "منطقة" },
  BED: { en: "Growing bed", fa: "بستر کشت", ar: "حوض زراعي" },
};

export const assetTypeLabel = (assetType: string, serverLabel: string, language: Language): string =>
  ASSET_TYPES[assetType]?.[language] ?? serverLabel;
