import { DatabaseZap } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/features/track/i18n/LanguageContext";

type Size = "sm" | "md" | "lg";

const TEXT: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const ICON: Record<Size, string> = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-9 w-9" };
const PAD: Record<Size, string> = { sm: "py-6 gap-1.5", md: "py-10 gap-2", lg: "py-16 gap-3" };

/**
 * The placeholder for a surface with no backend behind it. Every page in this
 * feature is in that state today — see data/mockData.ts — so this stands in
 * for the map markers, device rows, alerts and trip history until the gateway
 * serves them.
 */
export const NoData = ({ size = "md", className }: { size?: Size; className?: string }) => {
  const { t } = useLanguage();

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", PAD[size], className)}>
      <DatabaseZap className={cn("text-muted-foreground/40", ICON[size])} />
      <p className={cn("text-muted-foreground", TEXT[size])}>{t("noData")}</p>
    </div>
  );
};

/** The same message inline, where a single value used to sit. */
export const NoDataValue = ({ className }: { className?: string }) => {
  const { t } = useLanguage();
  return <span className={cn("text-sm font-normal text-muted-foreground", className)}>{t("noData")}</span>;
};

export default NoData;
