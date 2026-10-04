import { useLocation } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { isSampleRoute, sampleDataEnabled } from "@/features/factory/data/sampleData";

const TEXT: Record<string, { title: string; body: string }> = {
  en: {
    title: "Sample data",
    body: "This section is being completed. The figures and charts on this page are samples, not measurements from your devices.",
  },
  fa: {
    title: "داده‌ی نمونه",
    body: "این بخش در حال تکمیل است. اعداد و نمودارهای این صفحه نمونه هستند و از دستگاه‌های شما اندازه‌گیری نشده‌اند.",
  },
  ar: {
    title: "بيانات نموذجية",
    body: "هذا القسم قيد الإكمال. الأرقام والمخططات في هذه الصفحة نماذج وليست قياسات من أجهزتك.",
  },
};

/* Stands above every page that sampleData.ts fills in, and nowhere else: the
   same two checks decide the data and the notice, so sample figures are never
   on screen without it. */
export function SampleDataNotice() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  if (!sampleDataEnabled() || !isSampleRoute(pathname)) return null;
  const text = TEXT[language] ?? TEXT.en;
  return (
    <div
      role="note"
      className="mx-4 mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 lg:mx-6"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <p className="text-[13px] leading-relaxed">
        <span className="font-semibold">{text.title}</span>
        <span className="mx-1.5">·</span>
        {text.body}
      </p>
    </div>
  );
}
