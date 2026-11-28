import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Info, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { WALLET_PATH } from "@/shell/nav/aiInferenceNav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { getBudget, getModel, listRateLimits } from "../lib/catalog";
import { useT } from "../i18n";
import { Badge, DetailRow, Page, PageHead, SectionCard, UsageTabs, useAmount, useCurrency, useNum } from "../ui";
import { useProject } from "../routes";

/* Budget and capacity.
 *
 * Both are the service's to enforce. In the alpha this tab only shows what
 * the project has been given: nothing here is editable, and cost and balance
 * are a link to the one wallet in Cloud Management rather than a second copy.
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

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("model");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const spentPercent = (budget.spent / budget.monthly) * 100;

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
          <Badge tone="gray">
            <Lock className="size-3 me-1" />
            {t("Read-only in the alpha")}
          </Badge>
        }
      />

      <UsageTabs />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={t("Monthly budget")}>
          <p className="text-[13px] text-muted-foreground">{t("Applies to all API keys in this project.")}</p>

          <div className="mt-3">
            <DetailRow
              label={t("Budget in {currency}").replace("{currency}", currency)}
              value={<span className="tabular-nums">{amount(budget.monthly)}</span>}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">
              {amount(budget.spent)} {t("{currency} used this month").replace("{currency}", currency)}
            </span>
            <span className="tabular-nums text-muted-foreground">{num(spentPercent.toFixed(2))}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, spentPercent)}%` }} />
          </div>

          <div className="mt-3">
            <DetailRow
              label={t("Send a budget alert at")}
              value={<span className="tabular-nums">{num(budget.alertPercent)}% {t("of monthly budget")}</span>}
            />
          </div>

          <label className="mt-4 flex items-start gap-2.5">
            <Checkbox checked={budget.pauseAtLimit} disabled className="mt-0.5" />
            <span className="text-[13.5px] text-foreground">{t("Pause new requests when the budget is reached")}</span>
          </label>
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t("In-flight requests may finish after the limit is reached.")}
          </p>
        </SectionCard>

        <SectionCard title={t("Cost & balance")}>
          {/* One wallet for the whole account; this product does not keep a
              second one or show its balance. The link goes to the page that owns it. */}
          <p className="text-[13px] text-muted-foreground">{t("Shared wallet across Paapeli products.")}</p>

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
            onClick={() => navigate(WALLET_PATH)}
          >
            <ExternalLink className="size-4 me-1.5" />
            {t("Open wallet in Cloud Management")}
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
