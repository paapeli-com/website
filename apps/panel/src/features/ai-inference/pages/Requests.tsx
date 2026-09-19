import { useMemo, useState } from "react";
import { Activity, CheckCircle2, ChevronRight, Download, Shield, Timer } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { getModel, listRequests } from "../lib/catalog";
import type { RequestStatus } from "../lib/types";
import { formatTime } from "@/shared/lib/formatDate";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { useT } from "../i18n";
import { Badge, MetricCard, MetricRow, Page, PageHead, useAmount, useNum } from "../ui";

/* The request log: metadata only.
 *
 * No prompt and no response body. Storing what people sent a model is a
 * retention decision with legal weight, and it is not one a console screen
 * gets to make on the service's behalf — so this view shows what a request
 * cost and how it ended, and says as much underneath.
 *
 * 429 and 503 are kept apart. "Rate limited" means the project asked for more
 * than its share; "unavailable" means the service could not serve it. Reading
 * one as the other sends someone to the wrong fix.
 */

const STATUS_TONE: Record<RequestStatus, "ok" | "warn" | "bad" | "gray"> = {
  ok: "ok",
  rate_limited: "warn",
  unavailable: "bad",
  error: "bad",
};

const PAGE_SIZE = 6;

export default function RequestsPage() {
  const t = useT();
  const num = useNum();
  const amount = useAmount();
  const language = useAppLanguage();

  const all = useMemo(() => listRequests(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("24h");
  const [sortKey, setSortKey] = useState("newest");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = all.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      const model = getModel(r.modelId);
      return r.id.toLowerCase().includes(q) || (model?.name ?? r.modelId).toLowerCase().includes(q);
    });
    const sorted = [...rows];
    if (sortKey === "newest") sorted.sort((a, b) => b.at.localeCompare(a.at));
    if (sortKey === "oldest") sorted.sort((a, b) => a.at.localeCompare(b.at));
    if (sortKey === "latency") sorted.sort((a, b) => b.latencySeconds - a.latencySeconds);
    if (sortKey === "cost") sorted.sort((a, b) => b.cost - a.cost);
    return sorted;
  }, [all, query, status, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const successRate = (all.filter((r) => r.status === "ok").length / all.length) * 100;
  const latencies = [...all.map((r) => r.latencySeconds)].sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: t("Status"),
      value: status,
      onChange: (v) => { setStatus(v); setPage(1); },
      options: [
        { value: "all", label: t("All statuses") },
        { value: "ok", label: `200 ${t("OK")}` },
        { value: "rate_limited", label: `429 ${t("limited")}` },
        { value: "unavailable", label: `503 ${t("unavailable")}` },
        { value: "error", label: t("error") },
      ],
    },
    {
      key: "range",
      label: t("Last 24 hours"),
      value: range,
      onChange: setRange,
      options: [
        { value: "24h", label: t("Last 24 hours") },
        { value: "7d", label: t("Last 7 days") },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "newest", label: t("Latest requests") },
    { key: "oldest", label: t("Request ID / time") },
    { key: "latency", label: t("Latency") },
    { key: "cost", label: t("Cost") },
  ];

  const actions: ActionItem[] = [
    {
      key: "export",
      label: t("Export CSV"),
      icon: Download,
      onSelect: () => {
        const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
        const header = ["Request ID", "Time (UTC)", "Model", "HTTP status", "Input tokens", "Output tokens", "Latency (s)", "Cost (Toman)"].map(esc).join(",");
        const body = filtered
          .map((r) =>
            [r.id, r.at, getModel(r.modelId)?.modelId ?? r.modelId, r.httpStatus, r.inputTokens, r.outputTokens ?? "", r.latencySeconds, r.cost]
              .map((v) => esc(String(v)))
              .join(","),
          )
          .join("\n");
        const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ai-inference-requests.csv";
        a.click();
        URL.revokeObjectURL(url);
      },
    },
  ];

  const statusLabel = (r: (typeof all)[number]) =>
    `${r.httpStatus} ${t(r.status === "ok" ? "OK" : r.status === "rate_limited" ? "limited" : r.status === "unavailable" ? "unavailable" : "error")}`;

  return (
    <Page>
      <PageHead
        title={t("Requests")}
        description={t("Inspect response codes, latency and token usage.")}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
          >
            {t("Refresh")}
          </Button>
        }
      />

      <MetricRow>
        <MetricCard active label={t("Requests today")} value={amount(2480)} unit={t("calls")} icon={Activity} />
        <MetricCard label={t("Success rate")} value={num(successRate.toFixed(1))} unit="%" icon={CheckCircle2} tone="emerald" />
        <MetricCard label={t("P50 latency")} value={num(percentile(0.5).toFixed(2))} unit="s" icon={Timer} tone="blue" />
        <MetricCard label={t("P95 latency")} value={num(percentile(0.95).toFixed(2))} unit="s" icon={Timer} tone="violet" />
      </MetricRow>

      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <ListToolbar
          className="mb-4"
          search={{ value: query, onChange: (v) => { setQuery(v); setPage(1); }, placeholder: t("Search by request ID or model") }}
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={() => {
            setIsRefreshing(true);
            window.setTimeout(() => setIsRefreshing(false), 400);
          }}
          isRefreshing={isRefreshing}
          filter={{
            fields: filterFields,
            activeCount: status === "all" ? 0 : 1,
            onClear: () => { setStatus("all"); setPage(1); },
          }}
          sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
          actions={actions}
          selectionCount={0}
        />

        <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Request ID / time")}</TableHead>
                <TableHead>{t("Model")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Input / output tokens")}</TableHead>
                <TableHead>{t("Latency")}</TableHead>
                <TableHead className="text-end">{t("Cost")} · {t("Toman")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {/* A request id is an identifier, not prose. */}
                    <span className="block font-mono text-[13px] text-foreground" dir="ltr">{r.id}</span>
                    <span className="block text-xs text-muted-foreground">{formatTime(r.at, language)} UTC</span>
                  </TableCell>
                  <TableCell>{getModel(r.modelId)?.name ?? r.modelId}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[r.status]}>{statusLabel(r)}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {num(r.inputTokens)} / {r.outputTokens === null ? "—" : num(r.outputTokens)}
                  </TableCell>
                  <TableCell className="tabular-nums">{num(r.latencySeconds.toFixed(2))} s</TableCell>
                  <TableCell className="text-end">
                    <span className="inline-flex items-center gap-2">
                      <span className="tabular-nums">{num(r.cost.toFixed(2))}</span>
                      <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{t("Latest requests")}</span>
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="size-3.5" />
        {t("Request metadata only. Prompt and response content are not stored in this view.")}
      </p>
    </Page>
  );
}
