import { Cpu } from "lucide-react";
import { Badge, Button, Card, PageHeader, ProgressBar, Table, Toggle } from "@/features/cloud-management/ui";

/* Placeholder data throughout — @paapeli/api has no subscriptions/billing
   module yet. This renders the design's shape so the page is ready to
   wire up once that backend exists. */
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

export default function Subscriptions() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Subscriptions"
        description="Plan, entitlements, add-ons and renewal settings — preview data, no billing backend yet."
        actions={
          <>
            <Button variant="ghost">Compare plans</Button>
            <Button>Add subscription</Button>
          </>
        }
      />

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
