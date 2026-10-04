import type { ReactNode } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";

/* A page root that reads the same in every language.

   data-uniform-type keeps the type at the Tailwind steps the page was written
   in; without it Persian and Arabic fall through to the marketing type scale
   and a `text-sm` card title renders a size or two larger (see index.css).
   `dir` makes the page's own direction explicit, so text-start, flex order and
   sentence punctuation follow the language. `contents` keeps the wrapper out
   of the layout, so it can replace a fragment without moving anything. */
export function UniformPage({ children }: { children: ReactNode }) {
  const { isRTL } = useLanguage();
  return (
    <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="contents">
      {children}
    </div>
  );
}
