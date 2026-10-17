import { toast } from "@/shared/lib/toast";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { useBrand } from "@/shell/BrandProvider";

export function Footer() {
  const { t } = useLanguage();
  const { brand } = useBrand();
  const year = new Date().getFullYear();
  const soon = () => toast(t("comingSoon"));
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground lg:px-6">
      <div>© {year} {brand.appName}.</div>
      <div className="flex items-center gap-4">
        <button onClick={soon} className="underline-offset-4 hover:text-foreground hover:underline">{t("privacyPolicy")}</button>
        <button onClick={soon} className="underline-offset-4 hover:text-foreground hover:underline">{t("faq")}</button>
        <button onClick={soon} className="underline-offset-4 hover:text-foreground hover:underline">{t("aboutUs")}</button>
      </div>
    </footer>
  );
}
