import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import { Check, ExternalLink, Info, TrendingUp } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { getBudget, getModel, listRateLimits } from "../lib/catalog";
import { useT } from "../i18n";
import { Page, PageHead, SectionCard, useAmount, useCurrency, useNum } from "../ui";
import { useProject } from "../routes";

/* Budget and capacity.
 *
 * Both are the service's to enforce. This screen records what the project
 * wants and shows what it has been given; a checkbox here does not stop a
 * request, and the page says so rather than implying a switch is a control.
 */
export default function Limits() {
  const t = useT();
  const currency = useCurrency();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();
  const { projectName } = useProject();

  const budget = getBudget();
  const limits = listRateLimits();

  const [monthly, setMonthly] = useState(String(budget.monthly));
  const [alertPercent, setAlertPercent] = useState(String(budget.alertPercent));
  const [pause, setPause] = useState(budget.pauseAtLimit);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("model");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const spentPercent = (budget.spent / (Number(monthly) || budget.monthly)) * 100;

  const rows = limits
    .filter((l) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (getModel(l.modelId)?.name ?? l.modelId).toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortKey === "requests") return b.requestsPerMinute - a.requestsPerMinute;
      if (sortKey === "tokens") return b.tokensPerMinute - a.tokensPerMinute;
      return (getModel(a.modelId)?.name ?? "").localeCompare(getModel(b.modelId)?.name ?? "");
    });

  const sortOptions: SortOption[] = [
    { key: "model", label: t("Model") },
    { key: "requests", label: t("Requests / minute") },
    { key: "tokens", label: t("Tokens / minute") },
  ];

  return (
    <Page>
      <PageHead
        title={t("Limits & budget")}
        description={t("Control project spend and review the capacity available to your applications.")}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => toast.success(t("Save changes"))}
          >
            <Check className="size-4 me-2" />
            {t("Save changes")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={t("Monthly budget")}>
          <p className="text-[13px] text-muted-foreground">{t("Applies to all API keys in this project.")}</p>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Budget in {currency}").replace("{currency}", currency)}</span>
            <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" dir="ltr" />
          </label>

          <div className="mt-3 flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">
              {amount(budget.spent)} {t("{currency} used this month").replace("{currency}", currency)}
            </span>
            <span className="tabular-nums text-muted-foreground">{num(spentPercent.toFixed(2))}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, spentPercent)}%` }} />
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Send a budget alert at")}</span>
            <select
              value={alertPercent}
              onChange={(e) => setAlertPercent(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              {["50", "80", "90", "100"].map((p) => (
                <option key={p} value={p}>
                  {num(p)}% {t("of monthly budget")}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 flex items-start gap-2.5">
            <Checkbox checked={pause} onCheckedChange={(c) => setPause(!!c)} className="mt-0.5" />
            <span className="text-[13.5px] text-foreground">{t("Pause new requests when the budget is reached")}</span>
          </label>
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t("In-flight requests may finish after the limit is reached.")}
          </p>
        </SectionCard>

        <SectionCard title={t("Organization credit")}>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {amount(4_932_680)} <span className="text-[13px] font-normal text-muted-foreground">{currency}</span>
          </p>
          {/* One wallet for the whole account; this product does not keep a
              second one. The link goes to the billing page that already owns it. */}
          <p className="mt-1 text-[13px] text-muted-foreground">{t("Shared wallet across Paapeli products.")}</p>

          <div className="mt-4 text-[13.5px]">
            <div className="flex items-center justify-between border-b border-border/60 py-2.5">
              <span className="text-muted-foreground">{t("Project")}</span>
              <span className="font-medium text-foreground">{projectName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 py-2.5">
              <span className="text-muted-foreground">{t("Billing unit")}</span>
              <span className="font-medium text-foreground">{currency}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">{t("Alert recipients")}</span>
              <span className="font-medium text-foreground">{t("Project administrators")}</span>
            </div>
          </div>

          <Button
            variant="link"
            className="mt-2 h-auto p-0 text-primary"
            onClick={() => navigate("/CloudManagement/billing")}
          >
            <ExternalLink className="size-4 me-1.5" />
            {t("Manage shared billing")}
          </Button>
        </SectionCard>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{t("Model rate limits")}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("Shared by all project keys · enforced by the service")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/CloudManagement/subscriptions")}>
            <TrendingUp className="size-4 me-2" />
            {t("Request increase")}
          </Button>
        </div>

        <ListToolbar
          className="mb-4"
          search={{ value: query, onChange: setQuery, placeholder: t("Search name, model ID or use case") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={() => {
            setIsRefreshing(true);
            window.setTimeout(() => setIsRefreshing(false), 400);
          }}
          isRefreshing={isRefreshing}
          sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
          selectionCount={0}
        />

        <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Model")}</TableHead>
                <TableHead>{t("Requests / minute")}</TableHead>
                <TableHead>{t("Tokens / minute")}</TableHead>
                <TableHead>{t("Scope")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.modelId}>
                  <TableCell className="font-medium text-foreground">{getModel(l.modelId)?.name ?? l.modelId}</TableCell>
                  <TableCell className="tabular-nums">{amount(l.requestsPerMinute)}</TableCell>
                  <TableCell className="tabular-nums">{amount(l.tokensPerMinute)}</TableCell>
                  <TableCell>{t("Project + model")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          {t("Budget and rate limits are enforced by the service, not by this screen.")}
        </p>
      </div>
    </Page>
  );
}
