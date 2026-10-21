import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  useListActiveWorkspacesQuery,
  useListWorkspaceProductsQuery,
  useSubscribeWorkspaceProductMutation,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { queryLoad, usePageLoad } from "@/shared/hooks/usePageLoad";

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

/** How often to look again while the workspace's product is being set up. */
const PROVISIONING_POLL_MS = 3000;
/** How often to ask again to set it up while it stays PROVISIONING. */
const RESUBSCRIBE_MS = 60_000;

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

function describe(error: unknown): string {
  const status = statusOf(error);
  if (status === 403) {
    return "Only an owner or admin can set it up. Ask one of them to open it once; after that it works for everyone.";
  }
  if (status === 404) return "The workspace or the product no longer exists.";
  if (status) return `Setting it up failed: the server returned ${status}.`;
  return "Setting it up failed: the request didn't reach the server.";
}

/**
 * Ensures the active workspace has this feature's product before rendering it.
 *
 * It asks the server what the workspace already has rather than inferring it
 * from a POST's error code, and renders the feature only once its product is
 * ACTIVE: the gateway refuses every product-scoped request until then (409
 * PRODUCT_UNAVAILABLE), so a feature rendered earlier is a page of errors.
 * Meanwhile it waits out PROVISIONING, and says why for SUSPENDED, a setup
 * that failed again, or one this account may not start (403). The notice sits
 * inside the shell, so the rest of the panel stays a click away.
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
  const workspacesQuery = useListActiveWorkspacesQuery(!!productKey);
  const { data: workspaces, isLoading: workspacesLoading } = workspacesQuery;

  // What the workspace actually has, rather than what a POST's status implies.
  const productsQuery = useListWorkspaceProductsQuery(
    workspaceId ?? "",
    !!key && !ready,
  );
  const { data: products, isFetching: productsFetching } = productsQuery;
  /* Only ACTIVE lets the feature in: the gateway answers every product-scoped
     request for one still provisioning, failed or suspended with a 409
     PRODUCT_UNAVAILABLE, so rendering it then is a page of errors. */
  const status = products?.find((p) => p.productKey === productKey)?.status;

  const subscribe = useSubscribeWorkspaceProductMutation();
  /* Once per attempt; while PROVISIONING, once a minute as well: a setup whose
     request was cut off stays PROVISIONING until a subscribe takes it over,
     which the gateway allows once it has sat untouched for a few minutes. */
  const fireKey = key
    ? `${key}#${attempt}` + (status === "PROVISIONING" ? `#${Math.floor(Date.now() / RESUBSCRIBE_MS)}` : "")
    : null;
  // Set up again this attempt and it failed again: say so rather than loop.
  const setupFailed = status === "FAILED" && firedRef.current === fireKey && !subscribe.isPending;

  useEffect(() => {
    if (!key || ready || !products) return;

    if (status === "ACTIVE") {
      confirmed.add(key);
      setConfirmedKey(key);
      setFailure(null);
      return;
    }
    // Suspended: subscribing only 409s; say so (below).
    if (status === "SUSPENDED") return;

    // Not subscribed yet, its setup failed, or it may have been abandoned:
    // subscribing (re)starts setup. A setup really in progress just 409s.
    if (firedRef.current === fireKey) return;
    firedRef.current = fireKey;

    subscribe.mutate(
      { workspaceId: workspaceId!, productKey: productKey! },
      {
        onSuccess: (product) => {
          setFailure(null);
          if (product.status === "ACTIVE") {
            confirmed.add(key);
            setConfirmedKey(key);
          } else {
            void productsQuery.refetch();
          }
        },
        onError: (error: unknown) => {
          // 409 = a subscription is already there; what state it is in, the list says.
          if (statusOf(error) === 409) {
            void productsQuery.refetch();
            return;
          }
          console.error(`[panel] couldn't enable "${productKey}" for workspace ${workspaceId}:`, error);
          setFailure(describe(error));
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, products, status, attempt]);

  // Being set up: look again every few seconds until it is ACTIVE or FAILED.
  useEffect(() => {
    if (ready || status !== "PROVISIONING") return;
    const timer = window.setInterval(() => void productsQuery.refetch(), PROVISIONING_POLL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status]);

  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((a) => a + 1);
  }, []);

  // Either lookup failing leaves nothing to wait on, so the fallback offers a
  // retry of whichever did instead of spinning forever.
  const lookupFailed = workspaceId ? queryLoad(productsQuery).failed : queryLoad(workspacesQuery).failed;
  const retryLookup = useCallback(() => {
    if (workspaceId) void productsQuery.refetch();
    else void workspacesQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // No product scope — pass straight through.
  if (!productKey) return <>{children}</>;

  if (ready) return <>{children}</>;

  // Enabling failed. The product is not ACTIVE (or it would not have been
  // asked), so every page of the feature would be refused: say why instead.
  if (failure) {
    return (
      <ProductNotice title={`${name} isn't set up for this workspace.`} onRetry={retry}>
        {failure}
      </ProductNotice>
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
    return <FeatureFallback failed={lookupFailed} onRetry={retryLookup} />;
  }

  if (status === "SUSPENDED") {
    return (
      <ProductNotice title={`${name} is suspended in this workspace.`}>
        Its data stays as it was, but nothing can be read or changed until it is resumed.
      </ProductNotice>
    );
  }
  if (setupFailed) {
    return (
      <ProductNotice title={`${name} couldn't be set up for this workspace.`} onRetry={retry}>
        Setting it up failed on the server. Retrying starts it again.
      </ProductNotice>
    );
  }
  if (status === "PROVISIONING") {
    return (
      <ProductNotice busy title={`Setting up ${name} for this workspace…`}>
        This takes a moment the first time. The page opens by itself once it's ready.
      </ProductNotice>
    );
  }

  if (productsFetching || subscribe.isPending) return <FeatureFallback onRetry={retryLookup} />;

  return <FeatureFallback failed={lookupFailed} onRetry={retryLookup} />;
}

/** Why the feature isn't shown yet, centred where it would be. */
function ProductNotice({
  title,
  busy = false,
  onRetry,
  children,
}: {
  title: string;
  busy?: boolean;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      {busy && <Loader2 className="size-6 animate-spin text-primary" aria-hidden />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{children}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Retry
        </button>
      )}
    </div>
  );
}

const reloadPage = () => window.location.reload();

/* Shown while a feature's chunk loads and while its product is being enabled:
   a page skeleton with the branded spinner on top, and — if that fails or
   outlasts the load timeout — a retry. A stuck chunk has nothing to refetch,
   so without an `onRetry` the retry reloads the page. */
export const FeatureFallback = ({ failed = false, onRetry = reloadPage }: { failed?: boolean; onRetry?: () => void }) => {
  const { status, retry } = usePageLoad({ loading: !failed, failed, onRetry });
  return status === "failed" ? <LoadFailed onRetry={retry} /> : <PageSkeleton />;
};
