import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { LoadingOverlay } from "@/shared/components/LoadingOverlay";

/**
 * The greenhouses portfolio while it loads: the KPI row, the toolbar and a
 * grid of cards, with the Paapeli spinner on top, like ListPageSkeleton does
 * for the table pages.
 */
export function GreenhousesSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="relative">
      <div className="space-y-4" aria-hidden="true">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card px-3 py-2.5 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-56" />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LoadingOverlay />
    </div>
  );
}
