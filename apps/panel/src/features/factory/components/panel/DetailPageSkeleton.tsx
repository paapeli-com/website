import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { LoadingOverlay } from "@/shared/components/LoadingOverlay";
import { TableCell, TableRow } from "@/features/factory/components/ui/table";

/**
 * Skeleton for detail pages (a device, a gateway, a work order): title block,
 * a row of stat cards, then the main content beside a narrower side column.
 *
 * Companion to ListPageSkeleton, and follows the same convention — the
 * structure of the page with the branded Paapeli spinner kept on top, so the
 * skeleton adds to the loading signal instead of replacing it.
 */
export function DetailPageSkeleton({
  stats = 4,
  /** Rows of content in the main column. */
  rows = 6,
}: {
  stats?: number;
  rows?: number;
}) {
  return (
    <div className="relative">
      <div className="space-y-4" aria-hidden="true">
        {/* Title, breadcrumb-ish subtitle and the header actions. */}
        <div className="flex items-start gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border bg-card p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-4 border-b px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-44" />
                <div className="flex-1" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>

          {/* Side column: a couple of small property cards. */}
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
                <Skeleton className="h-4 w-28" />
                {Array.from({ length: 4 }).map((_, r) => (
                  <div key={r} className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <LoadingOverlay />
    </div>
  );
}

/**
 * Placeholder rows for a table that is still loading, in place of a single
 * "Loading…" cell. Renders TableRow/TableCell, so it goes inside a TableBody
 * and inherits the table's own column widths.
 */
export function TableRowsSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} aria-hidden="true">
          {Array.from({ length: columns }).map((_, c) => (
            <TableCell key={c}>
              {/* First column reads as the label, the rest as short values. */}
              <Skeleton className={c === 0 ? "h-3.5 w-40" : "h-3.5 w-20"} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
