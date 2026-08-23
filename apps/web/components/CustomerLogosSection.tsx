"use client";

import { useLanguage } from "@/contexts/LanguageContext";

/* ------------------------------------------------------------------ */
/* Customer proof. The logo wall and its supporting copy are out until */
/* there are real customers to name.                                  */
/* ------------------------------------------------------------------ */

const COPY: Record<string, { heading: string }> = {
  en: { heading: "Trusted by leading companies and organisations" },
  fa: { heading: "مورد اعتماد شرکت‌ها و سازمان‌های پیشرو" },
  ar: { heading: "موثوق به من شركات ومؤسسات رائدة" },
};

export const CustomerLogosSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-10 pt-10 sm:pb-16 sm:pt-14"
    >
      <h2 className="w-full max-w-[960px] text-center text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
        {copy.heading}
      </h2>
    </section>
  );
};
