import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { DatabaseZap } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface NoDataProps {
  /** Match the surrounding section so the icon/text stay proportional. */
  size?: Size;
  className?: string;
  /** Replaces "No data" where the list is empty because the user hasn't
   *  created anything yet, so the text can say what to do next. */
  message?: string;
}

const TEXT: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const ICON: Record<Size, string> = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-9 w-9" };
const PAD: Record<Size, string> = { sm: "py-6 gap-1.5", md: "py-10 gap-2", lg: "py-16 gap-3" };

/**
 * The placeholder for a surface that has no backend behind it yet — the
 * counterpart to DataState, which covers surfaces that *are* wired to the API
 * and are loading or have failed.
 *
 * These screens used to render invented figures (fabricated KPIs, alarm rows,
 * OTA rollouts), which read as real data to anyone demoing the panel. They now
 * say so instead: "No data" / "فاقد دیتا" / "لا توجد بيانات". Swap a <NoData />
 * back out for the real query as each endpoint lands.
 */
export const NoData = ({ size = "md", className, message }: NoDataProps) => {
  const { t } = useLanguage();

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", PAD[size], className)}>
      <DatabaseZap className={cn("text-muted-foreground/40", ICON[size])} />
      <p className={cn("text-muted-foreground", TEXT[size])}>{message ?? t("noData")}</p>
    </div>
  );
};

/**
 * The same message where a single fabricated value used to sit — a stat tile's
 * number, a metric next to its unit. Renders inline so it can stand in for the
 * value without disturbing the tile's layout.
 */
export const NoDataValue = ({ className }: { className?: string }) => {
  const { t } = useLanguage();
  return <span className={cn("text-sm font-normal text-muted-foreground", className)}>—</span>;
};

export default NoData;
