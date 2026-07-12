import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-baseline gap-3 min-w-0 text-start" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        {showCount && (
          <span dir={isRTL ? "rtl" : "ltr"} className="text-xs text-muted-foreground whitespace-nowrap inline-flex items-baseline gap-1">
            {isRTL ? (
              <>
                <span className="tabular-nums">{displayCount}</span>
                {countLabel && <span>{countLabel}</span>}
              </>
            ) : (
              <>
                {countLabel && <span>{countLabel}</span>}
                <span className="tabular-nums">{displayCount}</span>
              </>
            )}
          </span>

        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

export default PageHeader;
