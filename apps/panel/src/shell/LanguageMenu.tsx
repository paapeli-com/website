import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { APP_LANGUAGES, setAppLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function LanguageMenu() {
  const language = useAppLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useShellT();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(iconBtn, open && "bg-muted text-foreground")}
        aria-label={t("Language")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-2 w-44 rounded-2xl border border-border bg-popover p-2 shadow-lg ltr:right-0 rtl:left-0"
        >
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="menuitemradio"
              aria-checked={language === lang.code}
              onClick={() => {
                setAppLanguage(lang.code);
                setOpen(false);
              }}
              /* Each label is written in its own script, so the row reads in
                 that language's direction rather than the app's current one. */
              dir={lang.code === "en" ? "ltr" : "rtl"}
              lang={lang.code}
              className={cn(
                "block w-full rounded-xl px-4 py-2.5 text-start text-[15px] transition-colors",
                language === lang.code
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
