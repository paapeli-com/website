import { useNavigate } from "react-router-dom";
import { Badge, Button, PageHeader, Stat, Table } from "@/components/ui";

/* Placeholder data — @paapeli/api has no billing module yet. */
const INVOICES: { id: string; issued: string; period: string; amount: string; status: "ok" | "info"; method: string }[] = [
  { id: "INV-2026-07", issued: "1 Aug 2026", period: "Jul 2026", amount: "﷼ 89,600,000", status: "ok", method: "Card •••• 4417" },
  { id: "INV-2026-06", issued: "1 Jul 2026", period: "Jun 2026", amount: "﷼ 91,200,000", status: "ok", method: "Wallet" },
  { id: "INV-2026-05", issued: "1 Jun 2026", period: "May 2026", amount: "﷼ 88,400,000", status: "ok", method: "Card •••• 4417" },
  { id: "INV-2026-04", issued: "1 May 2026", period: "Apr 2026", amount: "﷼ 86,900,000", status: "ok", method: "Bank transfer" },
  { id: "INV-2026-03", issued: "1 Apr 2026", period: "Mar 2026", amount: "﷼ 84,100,000", status: "info", method: "Card •••• 4417" },
  { id: "INV-2026-02", issued: "1 Mar 2026", period: "Feb 2026", amount: "﷼ 82,700,000", status: "ok", method: "Wallet" },
  { id: "INV-2026-01", issued: "1 Feb 2026", period: "Jan 2026", amount: "﷼ 80,300,000", status: "ok", method: "Bank transfer" },
];

export default function Billing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Billing & invoices"
        description="Invoices, credit notes and the billing profile — preview data, no billing backend yet."
        actions={
          <>
            <Button variant="ghost">Export CSV</Button>
            <Button>Pay open balance</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open balance" value="﷼ 0" note="No unpaid invoices" tone="ok" />
        <Stat label="Current period" value="﷼ 84,200,000" note="Invoice issues 1 Sep 2026" />
        <Stat label="Paid in 2026" value="﷼ 603,200,000" note="Across 7 invoices" />
        <Stat label="Credit notes" value="﷼ 4,100,000" note="1 refund in Mar 2026" />
      </div>

      <Table
        columns={["Invoice", "Issued", "Period", "Amount", "Status", "Method", ""]}
        head={<h2 className="text-sm font-bold text-foreground">Invoices</h2>}
        rows={INVOICES.map((inv) => [
          inv.id,
          inv.issued,
          inv.period,
          inv.amount,
          <Badge key="s" tone={inv.status}>
            {inv.status === "ok" ? "Paid" : "Refunded"}
          </Badge>,
          inv.method,
          <button
            key="v"
            type="button"
            // Route-relative to the Routes root (see RemoteApp.tsx) — this
            // page matches "/billing" exactly, so the child route needs its
            // full path, not just the invoice id.
            onClick={() => navigate(`billing/${inv.id}`)}
            className="text-[12.5px] font-semibold text-primary hover:underline"
          >
            View
          </button>,
        ])}
      />
    </div>
  );
}
