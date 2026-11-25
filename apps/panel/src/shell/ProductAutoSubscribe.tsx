import { useEffect, useRef } from "react";
import { useListActiveWorkspacesQuery, useListWorkspaceProductsQuery, workspacesService } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { LISTED_PRODUCTS } from "@/shared/config";

/* Every product the panel ships is active in every workspace.
 *
 * A workspace used to get a product only when someone opened it there or
 * added it from Subscriptions, so a new product showed in some workspaces
 * and not in others. Now, whenever an owner or an admin is in a workspace,
 * any product it lacks is subscribed in the background. A member or a viewer
 * may not subscribe, so their workspace catches up on its admin's next visit
 * (or when they open the product, as ProductGate already does).
 *
 * A subscription also provisions the product on the gateway, which only the
 * gateway can do, so this is the panel's job rather than a database backfill.
 * Each workspace and product is asked once per session; a 409 means it is
 * already there. Renders nothing. */
const PRODUCT_KEYS = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []).flatMap((s) => (s.productKey ? [s.productKey] : []));
const asked = new Set<string>();

export function ProductAutoSubscribe() {
  const workspaceId = useActiveWorkspaceId();
  const { data: workspaces } = useListActiveWorkspacesQuery();
  const role = workspaces?.find((w) => w.workspaceId === workspaceId)?.role;
  const mayManage = role === "OWNER" || role === "ADMIN";
  const products = useListWorkspaceProductsQuery(workspaceId ?? "", !!workspaceId && mayManage);
  const running = useRef(false);

  useEffect(() => {
    if (!workspaceId || !mayManage || !products.data || running.current) return;
    const have = new Set(products.data.map((p) => p.productKey));
    const missing = PRODUCT_KEYS.filter((key) => !have.has(key) && !asked.has(`${workspaceId}:${key}`));
    if (!missing.length) return;
    missing.forEach((key) => asked.add(`${workspaceId}:${key}`));
    running.current = true;
    (async () => {
      // One at a time: each one provisions on the gateway.
      for (const productKey of missing) {
        try {
          await workspacesService.subscribeWorkspaceProduct(workspaceId, { productKey });
        } catch (error) {
          // 409: already subscribed. Anything else waits for the next session.
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status !== 409) console.warn(`[panel] could not subscribe ${productKey} for workspace ${workspaceId}`, error);
        }
      }
      running.current = false;
      void products.refetch();
    })();
    // products.data changes are what this reacts to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, mayManage, products.data]);

  return null;
}
