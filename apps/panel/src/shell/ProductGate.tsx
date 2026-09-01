import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import {
  useListActiveWorkspacesQuery,
  useListWorkspaceProductsQuery,
  useSubscribeWorkspaceProductMutation,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

interface Props {
  /** Human-readable feature name, used in messages. */
  name: string;
  /**
   * Workspace-product key this feature's API calls are scoped under (see
   * @paapeli/brand/config `productKeyFor`) — endpoints like
   * /api/v1/aiot/<resource>/{workspaceId}/{productKey}/… 404 until the
   * workspace holds a subscription for it. Omit for a feature with no product
   * scope (Cloud Management is workspace/account admin, not an AIoT product).
   */
  productKey?: string;
  children: ReactNode;
}

/* Once a (workspace, product) pair is known-good this session, later mounts
   skip the round-trip entirely. */
const confirmed = new Set<string>();

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

function describe(error: unknown): string {
  const status = statusOf(error);
  if (status === 403) return "this account isn't allowed to enable products for the active workspace";
  if (status === 404) return "the active workspace or product no longer exists";
  if (status && status >= 500) return `the server returned ${status}`;
  if (status) return `the server returned ${status}`;
  return "the request didn't reach the server";
}

/**
 * Ensures the active workspace has this feature's product before rendering it.
 *
 * Deliberately **never blocks on a failed subscribe**. It asks the server what
 * the workspace already has rather than inferring it from a POST's error code,
 * and if enabling genuinely fails it still renders the feature with a banner —
 * the feature's own pages handle their API errors, and a dead-end wall is
 * strictly worse than a degraded page you can still navigate out of.
 */
export function ProductGate({ name, productKey, children }: Props) {
  const workspaceId = useActiveWorkspaceId();
  const key = productKey && workspaceId ? `${workspaceId}:${productKey}` : null;

  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const firedRef = useRef<string | null>(null);

  const ready = !productKey || (!!key && (confirmed.has(key) || confirmedKey === key));

  // The workspace list is already fetched by the account menu — this shares
  // react-query's cache. We read it only to tell "still loading" apart from
  // "this user genuinely has no workspace", which would otherwise spin forever.
  const { data: workspaces, isLoading: workspacesLoading } = useListActiveWorkspacesQuery(!!productKey);

  // What the workspace actually has, rather than what a POST's status implies.
  const { data: products, isFetching: productsFetching } = useListWorkspaceProductsQuery(
    workspaceId ?? "",
    !!key && !ready,
  );

  const subscribe = useSubscribeWorkspaceProductMutation();

  useEffect(() => {
    if (!key || ready || !products) return;

    // Already subscribed — nothing to do, and no POST to 409 against.
    if (products.some((p) => p.productKey === productKey)) {
      confirmed.add(key);
      setConfirmedKey(key);
      setFailure(null);
      return;
    }

    const fireKey = `${key}#${attempt}`;
    if (firedRef.current === fireKey) return;
    firedRef.current = fireKey;

    subscribe.mutate(
      { workspaceId: workspaceId!, productKey: productKey! },
      {
        onSuccess: () => {
          confirmed.add(key);
          setConfirmedKey(key);
          setFailure(null);
        },
        onError: (error: unknown) => {
          // 409 = the workspace already holds an active/provisioning/suspended
          // subscription — the state we wanted, not a failure.
          if (statusOf(error) === 409) {
            confirmed.add(key);
            setConfirmedKey(key);
            setFailure(null);
            return;
          }
          console.error(`[panel] couldn't enable "${productKey}" for workspace ${workspaceId}:`, error);
          setFailure(describe(error));
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, products, attempt]);

  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((a) => a + 1);
  }, []);

  // No product scope — pass straight through.
  if (!productKey) return <>{children}</>;

  if (ready) return <>{children}</>;

  // Enabling failed. Render the feature anyway, with a banner explaining why
  // parts of it may be empty — never a wall.
  if (failure) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[13px] text-foreground">
          <TriangleAlert className="size-4 shrink-0 text-amber-600" />
          <span>
            {name} isn't fully set up for this workspace — {failure}. Some data may be missing.
          </span>
          <button type="button" onClick={retry} className="font-semibold text-primary hover:underline">
            Retry
          </button>
        </div>
        {children}
      </>
    );
  }

  // Waiting on the account menu to pick a workspace. If the user has none,
  // say so and point at where to make one instead of spinning forever.
  if (!workspaceId) {
    if (!workspacesLoading && workspaces && workspaces.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-medium text-foreground">No workspace yet.</p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            {name} runs inside a workspace. Create one to get started.
          </p>
          <Link
            to="/CloudManagement/workspaces"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Create a workspace
          </Link>
        </div>
      );
    }
    return <FeatureFallback />;
  }

  if (productsFetching || subscribe.isPending) return <FeatureFallback />;

  return <FeatureFallback />;
}

/* Shown while a feature's chunk loads and while its product is being enabled —
   the branded loader rather than bare text, since it fills the whole pane. */
export const FeatureFallback = () => (
  <div className="flex h-full min-h-[60vh] items-center justify-center p-8">
    <LoadingSpinner size="lg" />
  </div>
);
