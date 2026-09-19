import { RotateCw } from "lucide-react";
import { useTheme } from "@paapeli/brand/theme";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import cryingLogoLight from "@/shared/assets/crying-logo-light.webp";
import cryingLogoDark from "@/shared/assets/crying-logo-dark.webp";

/**
 * What a page shows in place of its content when it couldn't load — the
 * request failed, or it ran past the load timeout (see usePageLoad). Centered
 * in the pane with a single way forward.
 *
 * Shared, and translated through the shell's table, so the shell's own
 * fallback and every feature's pages say the same thing.
 */
export function LoadFailed({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const t = useShellT();
  // The swirl is black on light and white on dark, so there is one animation
  // per theme; only the one in use is fetched.
  const { dark } = useTheme();
  return (
    <div
      role="alert"
      className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center", className)}
    >
      {/* The Paapeli logo, crying. Decorative — the text below says what happened. */}
      <img
        src={dark ? cryingLogoDark : cryingLogoLight}
        alt=""
        aria-hidden="true"
        width={112}
        height={126}
        className="h-[126px] w-28 select-none"
        draggable={false}
      />
      <p className="text-sm font-medium text-foreground">{t("Couldn't load this page")}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        {t("Something went wrong or it took too long. Please try again.")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        <RotateCw className="h-3.5 w-3.5" />
        {t("Retry")}
      </button>
    </div>
  );
}
