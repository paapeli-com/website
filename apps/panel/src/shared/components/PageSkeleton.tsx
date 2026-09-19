import { LoadingOverlay } from "./LoadingOverlay";

const Bar = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

/**
 * Feature-agnostic page placeholder — a title, a toolbar and a table-ish card —
 * for the shell's fallback, which shows before any feature's chunk (and its
 * own, better-shaped skeletons) has loaded. Styled like the features'
 * skeletons so the hand-off from this to theirs doesn't jump.
 */
export function PageSkeleton() {
  return (
    <div className="relative p-4 lg:p-6">
      <div className="space-y-4" aria-hidden="true">
        <Bar className="h-7 w-40" />
        <div className="flex flex-wrap items-center gap-2">
          <Bar className="h-9 w-full max-w-sm" />
          <Bar className="h-9 w-24" />
          <Bar className="h-9 w-24" />
        </div>
        <div className="rounded-md border bg-card">
          {Array.from({ length: 7 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
              <Bar className="h-4 w-4 shrink-0 rounded-sm" />
              <Bar className="h-4 w-1/4" />
              <Bar className="h-4 w-20" />
              <Bar className="hidden h-4 w-20 sm:block" />
              <Bar className="hidden h-4 w-24 md:block" />
            </div>
          ))}
        </div>
      </div>
      <LoadingOverlay />
    </div>
  );
}
