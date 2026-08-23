import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useSubscribeWorkspaceProductMutation } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { RemoteBoundary } from "@/components/RemoteBoundary";
import { loadRemote } from "@/lib/remote";

interface Props {
  /** Federation remote id, as declared in vite.config.ts `remotes`. */
  id: string;
  /** Human-readable name, used in the error message. */
  name: string;
  /** Workspace-product key this remote's API calls are scoped under (see
   *  @paapeli/brand/config `productKeyFor`) — every endpoint like
   *  /api/v1/aiot/<resource>/{workspaceId}/{productKey}/… 404s until the
   *  workspace holds a subscription for it, so the host subscribes before
   *  mounting. Omit for a remote with no product scope (Cloud Management is
   *  workspace/account admin, not an AIoT product). */
  productKey?: string;
  load: () => Promise<{ default: ComponentType }>;
}

const RemoteFallback = () => (
  <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Loading…</div>
);

/* Once a (workspace, product) pair is confirmed subscribed this session,
   later mounts (navigating away and back) skip the call — the subscription
   is already active/provisioning/suspended and would just 409 again. */
const subscribedProducts = new Set<string>();

/* Mounts a federated remote: subscribes the active workspace to the
   remote's product (if any) before rendering it, retries a failed load on a
   fresh URL, and waits for the remote's stylesheet before rendering (see
   lib/remote.ts), with an inline error + "Try again" once automatic retries
   are exhausted. */
export function RemoteMount({ id, name, productKey, load }: Props) {
  const workspaceId = useActiveWorkspaceId();
  const [attempt, setAttempt] = useState(0);
  const subscribe = useSubscribeWorkspaceProductMutation();
  const firedRef = useRef<string | null>(null);

  const cacheKey = productKey && workspaceId ? `${workspaceId}:${productKey}` : null;
  const ready = !productKey || (!!cacheKey && subscribedProducts.has(cacheKey));

  useEffect(() => {
    if (!cacheKey || subscribedProducts.has(cacheKey)) return;
    const fireKey = `${cacheKey}#${attempt}`;
    if (firedRef.current === fireKey) return;
    firedRef.current = fireKey;
    subscribe.mutate(
      { workspaceId: workspaceId!, productKey: productKey! },
      {
        onSuccess: () => subscribedProducts.add(cacheKey),
        onError: (error: unknown) => {
          // 409 = the workspace already has an active/provisioning/suspended
          // subscription for this product — exactly the state we want, not a
          // real failure (see the subscribeProduct endpoint's docs).
          if ((error as { response?: { status?: number } })?.response?.status === 409) {
            subscribedProducts.add(cacheKey);
          }
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, attempt]);

  /* Warm the remote's JS bundle in parallel with the subscribe call above,
     rather than waiting for it — loadRemote() re-imports the same URL once
     the component actually mounts, which resolves from the module cache. */
  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, attempt]);

  /* React.lazy memoises its factory's result — a rejection included — so a
     manual retry needs a brand-new lazy component, not just a re-render.
     `load` is a stable module-scope function, so it stays out of the deps. */
  const Remote = useMemo(
    () => lazy(() => loadRemote(id, load)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, attempt],
  );

  // Only trust the mutation's error against the (workspace, product) it was
  // actually fired for — otherwise a stale error from a since-changed
  // workspace would flash before the effect above re-fires for the new one.
  const subscribeErrored =
    !ready &&
    subscribe.isError &&
    subscribe.variables?.workspaceId === workspaceId &&
    subscribe.variables?.productKey === productKey;

  if (subscribeErrored) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Couldn't set up {name}.</p>
        <button
          type="button"
          onClick={() => setAttempt((a) => a + 1)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!ready) return <RemoteFallback />;

  return (
    /* The key clears the boundary's captured error on retry. */
    <RemoteBoundary key={attempt} name={name} onRetry={() => setAttempt((a) => a + 1)}>
      <Suspense fallback={<RemoteFallback />}>
        <Remote />
      </Suspense>
    </RemoteBoundary>
  );
}
