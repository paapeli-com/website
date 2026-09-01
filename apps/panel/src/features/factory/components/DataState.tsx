import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { Button } from "@/features/factory/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface DataStateProps {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  /** Match the surrounding section so the spinner/text stay proportional. */
  size?: Size;
  className?: string;
}

const TEXT: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const ICON: Record<Size, string> = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" };
const PAD: Record<Size, string> = { sm: "py-6 gap-2", md: "py-10 gap-3", lg: "py-16 gap-4" };

/**
 * Shared async data-state for anything wired to the API. Shows the branded
 * Paapeli spinner with a "Loading" label while fetching, or an error message
 * with a Refresh button on failure. The size adapts to the surrounding section.
 */
export const DataState = ({ loading, error, onRetry, size = "md", className }: DataStateProps) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-center", PAD[size], className)}>
        <LoadingSpinner size={size} />
        <p className={cn("text-muted-foreground", TEXT[size])}>{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-center", PAD[size], className)}>
        <AlertCircle className={cn("text-destructive/70", ICON[size])} />
        <p className={cn("text-muted-foreground max-w-[240px]", TEXT[size])}>{t("errorLoadingData")}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {t("refresh")}
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default DataState;
