import { AlertCircle, MoreHorizontal, Wallet } from "lucide-react";
import { Badge, Button, Card, PageHeader, Table, Toggle } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";

/* Placeholder data — @paapeli/api has no payments module yet. */
const CARDS: { brand: string; last4: string; expiry: string; primary?: boolean }[] = [
  { brand: "SAMAN", last4: "4417", expiry: "09 / 2026", primary: true },
  { brand: "MELLAT", last4: "8823", expiry: "04 / 2029" },
];

const PAYMENT_HISTORY: [string, string, string, string, string][] = [
  ["3 Aug 2026", "Invoice INV-2026-07", "Card •••• 4417", "﷼ 89,600,000", "Succeeded"],
  ["21 Jul 2026", "Wallet top-up", "Bank transfer", "﷼ 50,000,000", "Succeeded"],
  ["2 Jul 2026", "Invoice INV-2026-06", "Wallet", "﷼ 91,200,000", "Succeeded"],
  ["1 Jul 2026", "Invoice INV-2026-06 (retry)", "Card •••• 8823", "﷼ 91,200,000", "Failed"],
  ["3 Jun 2026", "Invoice INV-2026-05", "Card •••• 4417", "﷼ 88,400,000", "Succeeded"],
];

function PaymentCard({ brand, last4, expiry, primary }: { brand: string; last4: string; expiry: string; primary?: boolean }) {
  return (
    <Card className={cn("flex items-center gap-4 p-4", primary && "border-primary/30 bg-primary/5")}>
      <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
        {brand}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">•••• •••• •••• {last4}</span>
          {primary && <Badge tone="brand">Primary</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">Expires {expiry}</span>
      </div>
      <MoreHorizontal className="size-[18px] text-muted-foreground" />
    </Card>
  );
}

export default function PaymentMethods() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Payment methods & wallet"
        description="Cards, bank accounts and prepaid balance — preview data, no payments backend yet."
        actions={
          <>
            <Button variant="ghost">Top up wallet</Button>
            <Button>Add payment method</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">Saved methods</h2>
            {CARDS.map((c) => (
              <PaymentCard key={c.last4} {...c} />
            ))}
            <Card className="flex items-center gap-4 p-4">
              <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Wallet className="size-[18px]" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Bank transfer — Bank Melli</span>
                <span className="text-xs text-muted-foreground">IR•• •••• •••• •••• 7712 · for invoices over ﷼ 100M</span>
              </div>
              <MoreHorizontal className="size-[18px] text-muted-foreground" />
            </Card>
          </div>

          <Table
            columns={["Date", "Description", "Method", "Amount", "Status"]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">Payment history</h2>
                <Button variant="ghost">Export</Button>
              </>
            }
            rows={PAYMENT_HISTORY.map(([date, desc, method, amount, status]) => [
              date,
              desc,
              method,
              amount,
              <Badge key="s" tone={status === "Succeeded" ? "ok" : "bad"}>
                {status}
              </Badge>,
            ])}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">Wallet balance</h2>
            <span className="text-2xl font-bold text-foreground">﷼ 32,500,000</span>
            <p className="text-xs text-muted-foreground">Covers roughly 11 days at your current burn rate.</p>
            <div className="flex gap-2">
              <Button>Top up</Button>
              <Button variant="ghost">Auto top-up</Button>
            </div>
          </Card>

          <Card className="flex flex-col">
            <h2 className="mb-1 text-sm font-bold text-foreground">Payment settings</h2>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Charge primary method automatically</span>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Use wallet balance before card</span>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Email receipt to billing contacts</span>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">Retry failed payments for 3 days</span>
              <Toggle checked={false} />
            </div>
          </Card>

          <Card className="flex gap-3 border-primary/30 bg-primary/5">
            <AlertCircle className="size-[18px] shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold text-foreground">Card expiring soon</h2>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                SAMAN •••• 4417 expires 09/2026. Update it before the next invoice to avoid a failed charge.
              </p>
              <button type="button" className="mt-1 w-fit text-[13px] font-semibold text-primary hover:underline">
                Update card
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
