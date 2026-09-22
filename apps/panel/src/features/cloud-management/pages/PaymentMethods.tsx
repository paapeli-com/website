import { MoreHorizontal } from "lucide-react";
import { Badge, Button, Card, NoData, NoDataValue, PageHeader, Table, Toggle } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";

/* @paapeli/api has no payments module yet.

   Two saved cards with issuer, last four digits and expiry, a bank account
   with a partial IBAN, five payment attempts (one of them failed), a wallet
   balance and a banner warning that a specific card expires next month. These
   name financial instruments the account does not have, and the expiry banner
   asks the user to act on one. Empty until there is a payments backend.

   One thing here is not empty and is not a guess: paying is Toman only, over
   the TAP gateway. That is said on the page rather than left for someone to
   find out at the till. It is about how money moves, not about which currency
   an account is billed in, which is a separate thing on the billing page. */
const CARDS: { brand: string; last4: string; expiry: string; primary?: boolean }[] = [];

const PAYMENT_HISTORY: [string, string, string, string, string][] = [];

const SETTINGS = [
  "Charge primary method automatically",
  "Use wallet balance before card",
  "Email receipt to billing contacts",
  "Retry failed payments for 3 days",
];

function PaymentCard({ brand, last4, expiry, primary }: { brand: string; last4: string; expiry: string; primary?: boolean }) {
  const t = useShellT();
  return (
    <Card className={cn("flex items-center gap-4 p-4", primary && "border-primary/30 bg-primary/5")}>
      <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
        {brand}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground" dir="ltr">•••• •••• •••• {last4}</span>
          {primary && <Badge tone="brand">{t("Primary")}</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">{t("Expires")} {expiry}</span>
      </div>
      <MoreHorizontal className="size-[18px] text-muted-foreground" />
    </Card>
  );
}

export default function PaymentMethods() {
  const t = useShellT();

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like Dashboards and the device list. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Payment methods & wallet")}
        description={t("Cards, bank accounts and prepaid balance.")}
        actions={
          <>
            <Button variant="ghost">{t("Top up wallet")}</Button>
            <Button>{t("Add payment method")}</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">{t("Saved methods")}</h2>
            {/* Said once, where a method is added, rather than left to be
                discovered at the payment step. */}
            <p className="text-xs text-muted-foreground">
              {t("Payments are in Toman through the TAP gateway for now.")}
            </p>
            {CARDS.length === 0 && <Card><NoData /></Card>}
            {CARDS.map((c) => (
              <PaymentCard key={c.last4} {...c} />
            ))}
          </div>

          <Table
            columns={[t("Date"), t("Description"), t("Method"), t("Amount"), t("Status")]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">{t("Payment history")}</h2>
                <Button variant="ghost">{t("Export")}</Button>
              </>
            }
            rows={PAYMENT_HISTORY.map(([date, desc, method, amount, status]) => [
              date,
              desc,
              method,
              amount,
              <Badge key="s" tone={status === "Succeeded" ? "ok" : "bad"}>
                {t(status)}
              </Badge>,
            ])}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">{t("Wallet balance")}</h2>
            <span className="text-2xl font-bold text-foreground"><NoDataValue /></span>
            <div className="flex gap-2">
              <Button>{t("Top up")}</Button>
              <Button variant="ghost">{t("Auto top-up")}</Button>
            </div>
          </Card>

          <Card className="flex flex-col">
            <h2 className="mb-1 text-sm font-bold text-foreground">{t("Payment settings")}</h2>
            {SETTINGS.map((label, i) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13.5px] text-muted-foreground">{t(label)}</span>
                {/* Retrying a failed payment is the one that is off by default. */}
                <Toggle checked={i < 3} />
              </div>
            ))}
          </Card>

          {/* The "card expiring soon" banner named SAMAN 4417 and asked the
              user to replace it before the next invoice — an action prompt
              about a card that does not exist. It returns with the data. */}

        </div>
      </div>
    </div>
  );
}
