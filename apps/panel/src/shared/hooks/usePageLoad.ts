import { useCallback, useEffect, useState } from "react";

/** How long a page may sit on its loading state before we offer a retry. */
export const PAGE_LOAD_TIMEOUT_MS = 10_000;

/** The fields of a react-query result this module reads. */
interface QueryLike {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  data?: unknown;
}

/**
 * Collapses a query into the two things a page cares about.
 *
 * - `loading` also covers a retry in flight: after a failure react-query keeps
 *   `isError` set (and `isLoading` false) until a refetch succeeds, so without
 *   this the page would sit on its error screen while the retry runs.
 * - `failed` only when there is nothing to show — a background refetch that
 *   fails over data already on screen is not a page failure.
 */
export const queryLoad = (q: QueryLike) => ({
  loading: q.isLoading || (q.isError && q.isFetching),
  failed: q.isError && !q.isFetching && q.data === undefined,
});

export type PageLoadStatus = "loading" | "failed" | "ready";

/**
 * One page-level load state for every page: skeleton while `loading`, a retry
 * screen once the load has `failed` or has been loading longer than
 * `timeoutMs`, otherwise the page.
 *
 * `retry` restarts the timeout and calls `onRetry`, so a hung request gets a
 * fresh window instead of flipping straight back to the retry screen.
 */
export function usePageLoad({
  loading,
  failed = false,
  onRetry,
  timeoutMs = PAGE_LOAD_TIMEOUT_MS,
}: {
  loading: boolean;
  failed?: boolean;
  onRetry?: () => void;
  timeoutMs?: number;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setTimedOut(false);
    if (!loading) return;
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [loading, timeoutMs, attempt]);

  const retry = useCallback(() => {
    setAttempt((a) => a + 1);
    onRetry?.();
  }, [onRetry]);

  const status: PageLoadStatus =
    failed || (loading && timedOut) ? "failed" : loading ? "loading" : "ready";

  return { status, retry };
}
