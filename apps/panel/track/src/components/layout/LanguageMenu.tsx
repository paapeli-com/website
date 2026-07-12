import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export function LanguageMenu({ withLabel = false }: { withLabel?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={
          withLabel
            ? "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            : "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        }
        aria-label="Language"
      >
        <Globe className="size-5" />
        {withLabel && <span>{current.label}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg ltr:right-0 rtl:left-0">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                language === l.code ? "font-medium text-primary" : "text-foreground",
              )}
            >
              <span>{l.flag}</span>
              <span className="flex-1 text-start">{l.label}</span>
              {language === l.code && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
