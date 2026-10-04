import { ReactNode } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  count?: string | number | null;
  countLabel?: string;
  actions?: ReactNode;
}

/**
 * Standardized page header used across Devices, Locations, Alarms,
 * Forecast Equipment Failures, etc. RTL-aware: title aligns to start,
 * counts use localized digits for Arabic/Persian.
 */
export const PageHeader = ({ title, count, countLabel, actions }: PageHeaderProps) => {
  const { formatNumber, isRTL } = useLanguage();
  const showCount = count !== undefined && count !== null && count !== "";
  const displayCount = showCount ? formatNumber(count as string | number) : "";

  return (
    /* data-uniform-type: the title is written at text-lg and reads at that size
       in every language. Without it Persian and Arabic take the marketing
       heading scale and each page's title renders much larger than the AI
       pages', which are already marked. */
    <div data-uniform-type className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-baseline gap-3 min-w-0 text-start" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        {showCount && (
          <span dir={isRTL ? "rtl" : "ltr"} className="text-xs text-muted-foreground whitespace-nowrap inline-flex items-baseline gap-1">
            {/* Count then label in every language: "24 devices" / "۲۴ دستگاه". */}
            <span className="tabular-nums">{displayCount}</span>
            {countLabel && <span>{countLabel}</span>}
          </span>

        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

export default PageHeader;
