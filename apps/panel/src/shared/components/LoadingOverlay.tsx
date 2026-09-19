import { cn } from "@/shared/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * The branded spinner laid over a skeleton. Every loading state pairs the two:
 * the skeleton shows what is coming, the spinner says it is still coming.
 * Place inside a `relative` container that holds the skeleton.
 */
export function LoadingOverlay({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 flex items-start justify-center pt-32", className)}>
      <div className="rounded-full bg-background p-4 shadow-sm">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}
