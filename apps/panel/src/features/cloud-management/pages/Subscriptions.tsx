import { Check, Cpu, Loader2, Package, Plus } from "lucide-react";
import { toast } from "@/shared/lib/toast";
import { PRODUCTS } from "@paapeli/brand/config";
import {
  useListWorkspaceProductsQuery,
  useSubscribeWorkspaceProductMutation,
} from "@paapeli/api";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, NoData, NoDataValue, PageHeader, ProgressBar, SkeletonList, Table, Toggle, useComingSoon } from "@/features/cloud-management/ui";
import { useShellT } from "@/shared/i18n/shell";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* The PLAN/BILLING data below is placeholder — @paapeli/api has no
   subscriptions or billing module, so plans, entitlements, add-ons and
   invoices have nothing behind them.

   Product subscriptions are the exception and are real: the workspace's
   subscribed products come from GET /workspaces/{id}/products and subscribing
   posts to the matching POST. That card is at the top of the page. */

/** The products this panel knows how to open. Deliberately the brand config
    rather than GET /api/v1/aiot/products — the panel only routes to the
    solutions it actually ships, and this keeps the page to one request. */
const SUBSCRIBABLE = PRODUCTS.flatMap((p) => p.solutions ?? []);
/* A named plan tier, a subscription id, a base fee, four entitlement meters,
   four priced add-ons and a next-invoice estimate — all invented, and all of
   it describes a commercial agreement. Empty until a subscriptions module
   exists. The product-subscription card above stays: it is real. */
const ENTITLEMENTS: { label: string; used: number; limit: number; text: string }[] = [];
const PLAN_FACTS: [string, string][] = [];
const ADDONS: string[][] = [];
const NEXT_INVOICE: [string, string][] = [];

function ProductSubscriptions() {
  const t = useShellT();
  const { selectedId, selected, isLoading: workspacesLoading } = useWorkspaceSelection();
  const { data: subscribed, isLoading } = useListWorkspaceProductsQuery(
    selectedId ?? "",
    !!selectedId,
  );
  const subscribe = useSubscribeWorkspaceProductMutation();

  const subscribedKeys = new Set((subscribed ?? []).map((p) => p.productKey));
  const available = SUBSCRIBABLE.filter((p) => !subscribedKeys.has(p.productKey));
  const nameFor = (key: string) =>
    SUBSCRIBABLE.find((p) => p.productKey === key)?.name ?? key;

  /* Persian and Arabic put the product name in the middle of the
     sentence, not on the end of it, so the sentence carries a slot
     rather than being glued together from two translated halves. */
  const say = (phrase: string, productKey: string) =>
    t(phrase).replace("{product}", t(nameFor(productKey)));

  const handleSubscribe = (productKey: string) => {
    if (!selectedId || subscribe.isPending) return;
    subscribe.mutate(
      { workspaceId: selectedId, productKey },
      {
        onSuccess: () => toast.success(say("Subscribed to {product}", productKey)),
        onError: (error) =>
          toast.error(apiErrorMessage(error, say("Could not subscribe to {product}", productKey))),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-foreground">
          {selected ? `${t("Products")} · ${selected.workspaceName}` : t("Products")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("Which products this workspace can use. This section is live.")}
        </p>
      </div>

      {workspacesLoading || (selectedId && isLoading) ? (
        <SkeletonList rows={3} />
      ) : !selectedId ? (
        <p className="text-sm text-muted-foreground">{t("Select a workspace on the Workspaces page first.")}</p>
      ) : (subscribed ?? []).length === 0 ? (
        <EmptyState title={t("No products subscribed")} description={t("Subscribe one below to get started.")} />
      ) : (
        <div className="flex flex-col gap-2">
          {subscribed!.map((p) => (
            <div
              key={p.workspaceProductId}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Cpu className="size-4 text-muted-foreground" />
                {t(nameFor(p.productKey))}
                <span className="font-mono text-xs text-muted-foreground">{p.productKey}</span>
              </span>
              <Badge tone={p.status === "ACTIVE" ? "ok" : p.status === "FAILED" ? "bad" : "gray"}>
                {t(p.status)}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {selectedId && available.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">{t("Subscribe a product")}</span>
          <div className="flex flex-wrap gap-2">
            {available.map((p) => (
              <Button
                key={p.productKey}
                variant="ghost"
                onClick={() => handleSubscribe(p.productKey)}
                disabled={subscribe.isPending}
              >
                {subscribe.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {t(p.name)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedId && available.length === 0 && (subscribed ?? []).length > 0 && (
        <p className="flex items-center gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
          <Check className="size-4" /> {t("Every product this panel ships is subscribed.")}
        </p>
      )}
    </Card>
  );
}

export default function Subscriptions() {
  const t = useShellT();
  const soon = useComingSoon();
  /* No billing backend yet, so no plan: until there is one, its controls
     would act on nothing, and the card says so instead of offering them. */
  const hasPlan = PLAN_FACTS.length > 0;

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads
       at those steps in every language, like Home and Workspaces. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Subscriptions")}
        description={t(
          "Product subscriptions are live. Plan, entitlements, add-ons and renewal have no billing backend yet.",
        )}
        actions={
          <>
            <Button variant="ghost" onClick={() => soon("Compare plans")}>{t("Compare plans")}</Button>
            <Button onClick={() => soon("Add subscription")}>{t("Add subscription")}</Button>
          </>
        }
      />

      <ProductSubscriptions />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cpu className="size-5" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">AIoT</h2>
                </div>
                <p className="text-[13px] text-muted-foreground"><NoDataValue /></p>
              </div>
              {hasPlan && (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => soon("Change plan")}>{t("Change plan")}</Button>
                  <Button variant="danger" onClick={() => soon("Cancel")}>{t("Cancel")}</Button>
                </div>
              )}
            </div>

            {!hasPlan && (
              <EmptyState
                icon={Package}
                title={t("No plan yet")}
                description={t("Plans, entitlements and add-ons appear here once billing is available for your account.")}
              />
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PLAN_FACTS.map(([l, v]) => (
                <div key={l} className="rounded-xl bg-muted/40 px-3.5 py-3">
                  <div className="text-xs text-muted-foreground">{l}</div>
                  <div className="text-sm font-semibold text-foreground">{v}</div>
                </div>
              ))}
            </div>

            {hasPlan && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold text-foreground">{t("Plan entitlements")}</h3>
              {ENTITLEMENTS.length === 0 && <NoData />}
              {ENTITLEMENTS.map((e) => (
                <div key={e.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">{e.label}</span>
                    <span className="font-medium text-foreground">{e.text}</span>
                  </div>
                  <ProgressBar pct={Math.round((e.used / e.limit) * 100)} />
                </div>
              ))}
            </div>
            )}
          </Card>

          <Table
            columns={[t("Add-on"), t("Quantity"), t("Unit price"), t("Monthly")]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">{t("Add-ons")}</h2>
                {hasPlan && <Button variant="ghost" onClick={() => soon("Add add-on")}>{t("Add add-on")}</Button>}
              </>
            }
            rows={ADDONS}
            empty={{ icon: Package, title: t("No add-ons yet") }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">{t("Estimated next invoice")}</h2>
            <div className="text-2xl font-bold text-foreground"><NoDataValue /></div>
            <div className="h-px bg-border" />
            {NEXT_INVOICE.map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col">
            <h2 className="mb-1 text-sm font-bold text-foreground">{t("Renewal settings")}</h2>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">{t("Auto-renew subscription")}</span>
              <Toggle checked onChange={() => soon("Renewal settings")} />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">{t("Notify 30 days before renewal")}</span>
              <Toggle checked onChange={() => soon("Renewal settings")} />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">{t("Allow overage beyond plan")}</span>
              <Toggle checked={false} onChange={() => soon("Renewal settings")} />
            </div>
          </Card>

          <Card className="flex flex-col gap-2.5 border-primary/30 bg-primary/5">
            <h2 className="text-sm font-bold text-foreground">{t("Need more capacity?")}</h2>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {t("Enterprise adds unlimited assets, dedicated ingestion and a 99.95% SLA.")}
            </p>
            <div>
              <Button onClick={() => soon("Talk to sales")}>{t("Talk to sales")}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
