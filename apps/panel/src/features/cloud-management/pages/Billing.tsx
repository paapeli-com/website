import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useBillingAccountQuery } from "@paapeli/api";
import { useWorkspaceSelection } from "../contexts/WorkspaceContext";
import { apiProblem } from "@/shared/lib/apiError";
import { Badge, Button, NoDataValue, PageHeader, Stat, Table, useComingSoon } from "@/features/cloud-management/ui";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { CURRENCIES, currencyName, useBillingCurrency } from "@/shared/lib/billingCurrency";
import { cn } from "@/shared/lib/utils";

/* The account read carries no invoice data.

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
  const soon = useComingSoon();
  const language = useAppLanguage();
  const { currency, setCurrency } = useBillingCurrency();
  const { selectedId } = useWorkspaceSelection();
  const account = useBillingAccountQuery(selectedId ?? "");
  if (!selectedId || account.isFetching || account.isError || !account.data) {
    const status = apiProblem(account.error).status;
    const messages: Record<number, string> = {
      400: "The selected workspace ID is invalid.",
      401: "Your session is no longer valid.",
      403: "You do not have billing access in this workspace.",
    };
    const failed = account.isError && !account.isFetching;
    const message = failed ? messages[status ?? 0] ?? "Billing is temporarily unavailable." :
      selectedId ? "Checking billing access…" : "Select a workspace to view billing.";
    return <div className="flex flex-col items-start gap-3 p-6">
      <PageHeader title={t("Billing & invoices")} />
      <p role="status">{t(message)}</p>
      {failed && <Button onClick={() => void account.refetch()}>{t("Retry")}</Button>}
    </div>;
  }

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like the rest of Cloud Management. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Billing & invoices")}
        description={`${t("Workspace role")}: ${account.data.role}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => soon("Export CSV")}>{t("Export CSV")}</Button>
            <Button onClick={() => soon("Pay open balance")}>{t("Pay open balance")}</Button>
          </>
        }
      />

      {/* The currency lives with the billing profile, which is this page, not
          with the per-user settings: two people in one workspace have to see
          the same bill, so it is not something each of them picks. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-foreground">{t("Billing currency")}</span>
          <span className="text-xs text-muted-foreground">
            {t("Every amount in the panel is shown in this currency.")}
          </span>
        </div>
        {/* Three currencies, so a segmented control rather than a dropdown.
            Built from this feature's own primitives: the factory's Select
            reads the factory's LanguageProvider, which this page is not
            inside. */}
        <div className="inline-flex shrink-0 rounded-xl bg-muted p-1">
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                code === currency ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {currencyName(code, language)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY.map((label) => (
          <Stat key={label} label={t(label)} value={<NoDataValue />} />
        ))}
      </div>

      <Table
        columns={[t("Invoice"), t("Issued"), t("Period"), t("Amount"), t("Status"), t("Method"), ""]}
        head={<h2 className="text-sm font-bold text-foreground">{t("Invoices")}</h2>}
        empty={{
          icon: FileText,
          title: t("No invoices yet"),
          description: t("Your invoices appear here once your first billing period closes."),
        }}
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
            // Absolute: a relative path resolves against this page's own
            // route (/CloudManagement/billing/billing/…), not the area's root.
            onClick={() => navigate(`/CloudManagement/billing/${inv.id}`)}
            className="text-[12.5px] font-semibold text-primary hover:underline"
          >
            {t("View")}
          </button>,
        ])}
      />
    </div>
  );
}
