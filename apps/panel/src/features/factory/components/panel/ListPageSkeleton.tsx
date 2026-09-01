import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

interface ListPageSkeletonProps {
  /** Number of skeleton table rows to render */
  rows?: number;
  /** Number of columns in the skeleton table */
  columns?: number;
  /** Number of toolbar action buttons (excluding the primary CTA) */
  toolbarButtons?: number;
  /** Show the primary CTA (e.g. "New Device") button on the right side of the toolbar */
  showPrimaryCta?: boolean;
}

/**
 * Generic skeleton for list pages (Devices, Gateways, Dashboards, Alarms, etc.).
 * Renders a structural preview of the page (header, toolbar, table, pagination)
 * with the branded Paapeli spinner overlaid in the center.
 */
export function ListPageSkeleton({
  rows = 9,
  columns = 8,
  toolbarButtons = 3,
  showPrimaryCta = true,
}: ListPageSkeletonProps) {
  return (
    <div className="relative">
      {/* Skeleton page structure */}
      <div className="space-y-4" aria-hidden="true">
        {/* Header area */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-full max-w-sm" />
          {Array.from({ length: toolbarButtons }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
          <div className="flex-1" />
          {showPrimaryCta && <Skeleton className="h-9 w-32" />}
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card">
          {/* Header row */}
          <div className="border-b px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded-sm" />
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4"
                style={{ width: i === 0 ? "20%" : `${Math.max(60, 100)}px` }}
              />
            ))}
          </div>
          {/* Body rows */}
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="border-b last:border-b-0 px-4 py-4 flex items-center gap-4"
            >
              <Skeleton className="h-4 w-4 rounded-sm" />
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton
                  key={c}
                  className="h-4"
                  style={{ width: c === 0 ? "20%" : `${Math.max(60, 100)}px` }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Centered Paapeli spinner on top */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-32">
        <div className="rounded-full bg-background/70 backdrop-blur-sm p-4 shadow-sm">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </div>
  );
}
