import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number;
}

/**
 * Enterprise-style pagination with ellipsis.
 * Pattern: 1 … (prev) [current] (next) … last
 * RTL aware. Localized digits via formatNumber.
 */
export const SmartPagination = ({
  currentPage,
  totalPages,
  onChange,
  siblingCount = 1,
}: SmartPaginationProps) => {
  const { isRTL, formatNumber } = useLanguage();
  if (totalPages <= 1) return null;

  const buildRange = (): (number | "ellipsis-l" | "ellipsis-r")[] => {
    const total = totalPages;
    const range: (number | "ellipsis-l" | "ellipsis-r")[] = [];
    const showAllThreshold = 7 + siblingCount * 2;
    if (total <= showAllThreshold) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }
    const left = Math.max(currentPage - siblingCount, 2);
    const right = Math.min(currentPage + siblingCount, total - 1);
    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < total - 1;

    range.push(1);
    if (showLeftEllipsis) range.push("ellipsis-l");
    for (let i = left; i <= right; i++) range.push(i);
    if (showRightEllipsis) range.push("ellipsis-r");
    range.push(total);
    return range;
  };

  const pages = buildRange();
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center gap-1" dir={isRTL ? "rtl" : "ltr"}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <PrevIcon className="h-4 w-4" />
      </Button>
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={`${p}-${i}`} className="px-1.5 text-muted-foreground select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 min-w-8 px-2 rounded-full text-sm transition ${
              p === currentPage
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted text-foreground"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {formatNumber(p)}
          </button>
        )
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <NextIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SmartPagination;
