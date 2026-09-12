import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

/* Depth of each placeholder row, shaped like a small location tree: a root,
   a couple of locations, and some areas under them. Fixed rather than random
   so the skeleton doesn't reshuffle on every render. */
const TREE_ROWS = [0, 1, 2, 2, 1, 2, 3, 1];

/* Name-bar widths, cycled down the rows. Varying them reads as content;
   identical bars read as a loading bar. */
const NAME_WIDTHS = ["w-28", "w-20", "w-24", "w-16", "w-32", "w-20", "w-24", "w-16"];

/**
 * Loading placeholder for the Locations tree, following the same convention as
 * ListPageSkeleton: the structure of the thing being loaded, with the branded
 * Paapeli spinner kept on top so the existing "it's loading" signal is not
 * traded away for the skeleton.
 *
 * The indent matches LocationTreeNode's — `ps-2` plus a 16px column per level
 * — so rows land where the real ones will and the swap doesn't jump.
 */
export function LocationTreeSkeleton() {
  return (
    <div className="relative">
      <div className="py-1" aria-hidden="true">
        {TREE_ROWS.map((depth, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 ps-2">
            {/* One 16px column per ancestor level, as in the real tree. */}
            {Array.from({ length: depth }).map((_, c) => (
              <span key={c} className="w-4 shrink-0" />
            ))}
            {/* Chevron, node icon, name. */}
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className={`h-3.5 ${NAME_WIDTHS[i % NAME_WIDTHS.length]}`} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16">
        <div className="rounded-full bg-background/70 p-3 shadow-sm backdrop-blur-sm">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading placeholder for the detail panel beside the tree. Without it the
 * right-hand card sits on its "select a location" prompt while the tree is
 * still arriving, which reads as an answer rather than as loading.
 */
export function LocationDetailSkeleton() {
  return (
    <div className="space-y-5 p-6" aria-hidden="true">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-24" />
      </div>

      {/* Context cards — same 2/5-column grid as the real panel. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border bg-card p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Asset list: the tab strip, then rows. */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-4 border-b px-4 pb-2 pt-3">
          {["w-20", "w-16", "w-14"].map((w) => (
            <Skeleton key={w} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-40" />
            <div className="flex-1" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
