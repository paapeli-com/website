import { Check, Cpu, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PRODUCTS } from "@paapeli/brand/config";
import {
  useListWorkspaceProductsQuery,
  useSubscribeWorkspaceProductMutation,
} from "@paapeli/api";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Table, Toggle } from "@/features/cloud-management/ui";

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
const ENTITLEMENTS = [
  { label: "Connected assets", used: 8, limit: 25, text: "8 of 25" },
  { label: "Messages / month", used: 4.1, limit: 5, text: "4.1M of 5M" },
  { label: "Data retention", used: 12, limit: 24, text: "12 of 24 months" },
  { label: "Team members", used: 9, limit: 20, text: "9 of 20 seats" },
];

const PLAN_FACTS = [
  ["Base fee", "﷼ 42,000,000 / mo"],
  ["Committed assets", "25 assets"],
  ["Renewal", "1 Sep 2026"],
  ["Billing cycle", "Monthly, in arrears"],
];

const ADDONS = [
  ["Extra assets pack", "2 × 5 assets", "﷼ 6,000,000", "﷼ 12,000,000"],
  ["AI analytics — advanced", "1 workspace", "﷼ 18,000,000", "﷼ 18,000,000"],
  ["Extended retention (24 mo)", "—", "﷼ 9,000,000", "﷼ 9,000,000"],
  ["Priority support", "—", "﷼ 3,200,000", "﷼ 3,200,000"],
];

const NEXT_INVOICE = [
  ["Base fee", "﷼ 42,000,000"],
  ["Add-ons", "﷼ 42,200,000"],
  ["Overage", "﷼ 0"],
  ["VAT (9%)", "included"],
];

function ProductSubscriptions() {
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

  const handleSubscribe = (productKey: string) => {
    if (!selectedId || subscribe.isPending) return;
    subscribe.mutate(
      { workspaceId: selectedId, productKey },
      {
        onSuccess: () => toast.success(`Subscribed to ${nameFor(productKey)}`),
        onError: () => toast.error(`Could not subscribe to ${nameFor(productKey)}`),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-foreground">
          {selected ? `Products — ${selected.workspaceName}` : "Products"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Which products this workspace can use. This section is live.
        </p>
      </div>

      {workspacesLoading || (selectedId && isLoading) ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading products…
        </div>
      ) : !selectedId ? (
        <p className="text-sm text-muted-foreground">Select a workspace on the Workspaces page first.</p>
      ) : (subscribed ?? []).length === 0 ? (
        <EmptyState title="No products subscribed" description="Subscribe one below to get started." />
      ) : (
        <div className="flex flex-col gap-2">
          {subscribed!.map((p) => (
            <div
              key={p.workspaceProductId}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Cpu className="size-4 text-muted-foreground" />
                {nameFor(p.productKey)}
                <span className="font-mono text-xs text-muted-foreground">{p.productKey}</span>
              </span>
              <Badge tone={p.status === "ACTIVE" ? "ok" : p.status === "FAILED" ? "bad" : "gray"}>
                {p.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {selectedId && available.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">Subscribe a product</span>
          <div className="flex flex-wrap gap-2">
            {available.map((p) => (
              <Button
                key={p.productKey}
                variant="ghost"
                onClick={() => handleSubscribe(p.productKey)}
                disabled={subscribe.isPending}
              >
                {subscribe.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedId && available.length === 0 && (subscribed ?? []).length > 0 && (
        <p className="flex items-center gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
          <Check className="size-4" /> Every product this panel ships is subscribed.
        </p>
      )}
    </Card>
  );
}

export default function Subscriptions() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Subscriptions"
        description="Product subscriptions are live. Plan, entitlements, add-ons and renewal are preview data — there is no billing backend yet."
        actions={
          <>
            <Button variant="ghost">Compare plans</Button>
            <Button>Add subscription</Button>
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
                  <h2 className="text-base font-bold text-foreground">AIoT — Business</h2>
                  <Badge tone="ok">Active</Badge>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Subscription ID SUB-4471-AIOT · started 1 Sep 2025 · annual, auto-renew on
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost">Change plan</Button>
                <Button variant="danger">Cancel</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PLAN_FACTS.map(([l, v]) => (
                <div key={l} className="rounded-xl bg-muted/40 px-3.5 py-3">
                  <div className="text-xs text-muted-foreground">{l}</div>
                  <div className="text-sm font-semibold text-foreground">{v}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold text-foreground">Plan entitlements</h3>
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
          </Card>

          <Table
            columns={["Add-on", "Quantity", "Unit price", "Monthly"]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">Add-ons</h2>
                <Button variant="ghost">Add add-on</Button>
              </>
            }
            rows={ADDONS}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">Estimated next invoice</h2>
            <div className="text-2xl font-bold text-foreground">﷼ 84,200,000</div>
            <p className="text-xs text-muted-foreground">Issued 1 Sep 2026 · due in 14 days</p>
            <div className="h-px bg-border" />
            {NEXT_INVOICE.map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col">
            <h2 className="mb-1 text-sm font-bold text-foreground">Renewal settings</h2>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Auto-renew subscription</span>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Notify 30 days before renewal</span>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Allow overage beyond plan</span>
              <Toggle checked={false} />
            </div>
          </Card>

          <Card className="flex flex-col gap-2.5 border-primary/30 bg-primary/5">
            <h2 className="text-sm font-bold text-foreground">Need more capacity?</h2>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Enterprise adds unlimited assets, dedicated ingestion and a 99.95% SLA.
            </p>
            <div>
              <Button>Talk to sales</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
