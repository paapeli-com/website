import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Download, Layers, Wallet } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { getModel, getUsage, listAvailableModels } from "../lib/catalog";
import { listKeysForProduct } from "@/shared/lib/apiKeys";
import { AI_INFERENCE_PRODUCT_ID } from "@/shared/lib/productRegistry";
import { formatDate } from "@/shared/lib/formatDate";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { useT } from "../i18n";
import { MetricCard, MetricRow, Page, PageHead, SectionCard, useAmount, useCurrency, useNum } from "../ui";
import { useProject } from "../routes";

/* Consumption and spend.
 *
 * The four cards are summed from the table underneath them rather than written
 * separately (see lib/catalog.ts), so a reader can add up the rows and get the
 * same answer. A refresh returns the same figures; nothing is resampled.
 */
export default function Usage() {
  const t = useT();
  const currency = useCurrency();
  const num = useNum();
  const amount = useAmount();
  const language = useAppLanguage();
  const { projectId } = useProject();

  const usage = getUsage();
  const models = useMemo(() => listAvailableModels(), []);
  const keys = listKeysForProduct(AI_INFERENCE_PRODUCT_ID, projectId);

  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [keyFilter, setKeyFilter] = useState("all");
  const [range, setRange] = useState("7d");
  const [sortKey, setSortKey] = useState("cost");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = usage.byModel.filter((r) => {
      if (modelFilter !== "all" && r.modelId !== modelFilter) return false;
      if (!q) return true;
      const name = getModel(r.modelId)?.name ?? r.modelId;
      return name.toLowerCase().includes(q) || r.modelId.toLowerCase().includes(q);
    });
    const sorted = [...list];
    if (sortKey === "cost") sorted.sort((a, b) => b.cost - a.cost);
    if (sortKey === "requests") sorted.sort((a, b) => b.requests - a.requests);
    if (sortKey === "name") sorted.sort((a, b) => (getModel(a.modelId)?.name ?? "").localeCompare(getModel(b.modelId)?.name ?? ""));
    return sorted;
  }, [usage.byModel, query, modelFilter, sortKey]);

  /* Whatever is on screen is what gets exported. */
  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Model", "Model ID", "Requests", "Input tokens", "Output tokens", `Cost (${currency})`].map(esc).join(",");
    const body = rows
      .map((r) => {
        const m = getModel(r.modelId);
        return [m?.name ?? r.modelId, m?.modelId ?? r.modelId, r.requests, r.inputTokens, r.outputTokens ?? "", r.cost]
          .map((v) => esc(String(v)))
          .join(",");
      })
      .join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-inference-usage.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("Export CSV"));
  };

  const filterFields: FilterField[] = [
    {
      key: "range",
      label: t("Last 7 days"),
      value: range,
      onChange: setRange,
      options: [
        { value: "7d", label: t("Last 7 days") },
        { value: "30d", label: t("Last 30 days") },
      ],
    },
    {
      key: "model",
      label: t("Model"),
      value: modelFilter,
      onChange: setModelFilter,
      options: [{ value: "all", label: t("All models") }, ...models.map((m) => ({ value: m.id, label: m.name }))],
    },
    {
      key: "key",
      label: t("API keys"),
      value: keyFilter,
      onChange: setKeyFilter,
      options: [
        { value: "all", label: t("All API keys") },
        ...keys.map((k) => ({ value: k.id, label: k.name })),
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "cost", label: t("Cost") },
    { key: "requests", label: t("Requests") },
    { key: "name", label: t("Model") },
  ];

  /* A read-only rollup: exporting is the only thing that makes sense here, so
     that is the only thing offered. */
  const actions: ActionItem[] = [
    { key: "export", label: t("Export CSV"), icon: Download, onSelect: exportCsv },
  ];

  const maxCost = Math.max(...usage.daily.map((d) => d.cost));

  return (
    <Page>
      <PageHead
        title={t("Usage & cost")}
        description={t("Track consumption and spend across your project.")}
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4 me-2" />
            {t("Export CSV")}
          </Button>
        }
      />

      <MetricRow>
        <MetricCard active label={t("Model cost")} value={amount(usage.cost)} unit={currency} icon={Wallet} />
        <MetricCard label={t("Total requests")} value={amount(usage.requests)} unit={t("calls")} icon={Layers} tone="blue" />
        <MetricCard
          label={t("Input tokens")}
          value={`${num((usage.inputTokens / 1_000_000).toFixed(2))}M`}
          unit={t("tokens")}
          icon={ArrowDownLeft}
          tone="violet"
        />
        <MetricCard
          label={t("Output tokens")}
          value={`${num((usage.outputTokens / 1_000_000).toFixed(2))}M`}
          unit={t("tokens")}
          icon={ArrowUpRight}
          tone="emerald"
        />
      </MetricRow>

      <div className="mt-5">
        <SectionCard
          title={t("Daily cost")}
          action={
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
              {t("Model usage")}
            </span>
          }
        >
          {/* Bars are drawn from the same daily figures the total is summed
              from; nothing here is generated at render time. */}
          <div className="flex h-56 items-end gap-3" dir="ltr">
            {usage.daily.map((d, i) => {
              const last = i === usage.daily.length - 1;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  {last && <span className="text-xs font-medium text-primary tabular-nums">{amount(d.cost)}</span>}
                  <div
                    className={last ? "w-full rounded-t-md bg-primary" : "w-full rounded-t-md bg-primary/30"}
                    style={{ height: `${Math.max(6, (d.cost / maxCost) * 100)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{formatDate(d.date, language)}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">{t("Usage by model")}</h2>
          <span className="text-xs text-muted-foreground">{t("Input and output are billed separately")}</span>
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
          filter={{
            fields: filterFields,
            activeCount: [modelFilter, keyFilter].filter((v) => v !== "all").length,
            onClear: () => { setModelFilter("all"); setKeyFilter("all"); },
          }}
          sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
          actions={actions}
          selectionCount={0}
        />

        <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Model")}</TableHead>
                <TableHead>{t("Requests")}</TableHead>
                <TableHead>{t("Input tokens")}</TableHead>
                <TableHead>{t("Output tokens")}</TableHead>
                <TableHead className="text-end">{t("Cost")} · {currency}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.modelId}>
                  <TableCell className="font-medium text-foreground">{getModel(r.modelId)?.name ?? r.modelId}</TableCell>
                  <TableCell className="tabular-nums">{amount(r.requests)}</TableCell>
                  <TableCell className="tabular-nums">{amount(r.inputTokens)}</TableCell>
                  <TableCell className="tabular-nums">{r.outputTokens === null ? "—" : amount(r.outputTokens)}</TableCell>
                  <TableCell className="text-end font-semibold tabular-nums">{amount(r.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 text-end text-xs text-muted-foreground">{t("Updated just now · UTC")}</p>
      </div>
    </Page>
  );
}
