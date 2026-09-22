import { useNavigate } from "react-router-dom";
import { Badge, Button, NoDataValue, PageHeader, Stat, Table } from "@/features/cloud-management/ui";
import { useShellT } from "@/shared/i18n/shell";

/* @paapeli/api has no billing module yet.

   Seven invoices with issue dates, amounts, payment status and the card they
   were charged to, plus the four summary figures below, including "Paid in
   2026: 603,200,000". An invoice list is a financial record; showing an
   invented one is worse than showing none.

   Nothing here names a currency, and until an account carries one nothing
   should: which currency a customer is billed in belongs to the account, not
   to the language the panel happens to be in. */
const INVOICES: { id: string; issued: string; period: string; amount: string; status: "ok" | "info"; method: string }[] = [];

const SUMMARY = ["Open balance", "Current period", "Paid this year", "Credit notes"];

export default function Billing() {
  const navigate = useNavigate();
  const t = useShellT();

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like the rest of Cloud Management. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Billing & invoices")}
        description={t("Invoices, credit notes and the billing profile.")}
        actions={
          <>
            <Button variant="ghost">{t("Export CSV")}</Button>
            <Button>{t("Pay open balance")}</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY.map((label) => (
          <Stat key={label} label={t(label)} value={<NoDataValue />} />
        ))}
      </div>

      <Table
        columns={[t("Invoice"), t("Issued"), t("Period"), t("Amount"), t("Status"), t("Method"), ""]}
        head={<h2 className="text-sm font-bold text-foreground">{t("Invoices")}</h2>}
        rows={INVOICES.map((inv) => [
          inv.id,
          inv.issued,
          inv.period,
          inv.amount,
          <Badge key="s" tone={inv.status}>
            {inv.status === "ok" ? t("Paid") : t("Refunded")}
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
            {t("View")}
          </button>,
        ])}
      />
    </div>
  );
}
