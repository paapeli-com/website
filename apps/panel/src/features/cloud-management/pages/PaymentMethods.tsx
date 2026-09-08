import { MoreHorizontal } from "lucide-react";
import { Badge, Button, Card, NoData, NoDataValue, PageHeader, Table, Toggle } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";

/* @paapeli/api has no payments module yet.

   Two saved cards with issuer, last four digits and expiry, a bank account
   with a partial IBAN, five payment attempts (one of them failed), a wallet
   balance and a banner warning that a specific card expires next month. These
   name financial instruments the account does not have, and the expiry banner
   asks the user to act on one. Empty until there is a payments backend. */
const CARDS: { brand: string; last4: string; expiry: string; primary?: boolean }[] = [];

const PAYMENT_HISTORY: [string, string, string, string, string][] = [];

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
        description="Cards, bank accounts and prepaid balance."
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
            {CARDS.length === 0 && <Card><NoData /></Card>}
            {CARDS.map((c) => (
              <PaymentCard key={c.last4} {...c} />
            ))}
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
            <span className="text-2xl font-bold text-foreground"><NoDataValue /></span>
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

          {/* The "card expiring soon" banner named SAMAN 4417 and asked the
              user to replace it before the next invoice — an action prompt
              about a card that does not exist. It returns with the data. */}

        </div>
      </div>
    </div>
  );
}
