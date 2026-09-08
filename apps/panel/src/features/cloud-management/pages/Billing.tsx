import { useNavigate } from "react-router-dom";
import { Badge, Button, NoDataValue, PageHeader, Stat, Table } from "@/features/cloud-management/ui";

/* @paapeli/api has no billing module yet.

   Seven invoices with issue dates, amounts, payment status and the card they
   were charged to — plus the four summary figures below, including "Paid in
   2026: ﷼ 603,200,000". An invoice list is a financial record; showing an
   invented one is worse than showing none. */
const INVOICES: { id: string; issued: string; period: string; amount: string; status: "ok" | "info"; method: string }[] = [];

export default function Billing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Billing & invoices"
        description="Invoices, credit notes and the billing profile."
        actions={
          <>
            <Button variant="ghost">Export CSV</Button>
            <Button>Pay open balance</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Open balance", "Current period", "Paid this year", "Credit notes"].map((label) => (
          <Stat key={label} label={label} value={<NoDataValue />} />
        ))}
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
