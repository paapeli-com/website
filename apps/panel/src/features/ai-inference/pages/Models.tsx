import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import {
  Activity,
  ChevronRight,
  Code2,
  Copy,
  GitCompare,
  Layers,
  MessageSquare,
  Network,
  Play,
  Plus,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { AI_INFERENCE_BASE, centralApiKeysPath } from "@/shell/nav/aiInferenceNav";
import { listModels } from "../lib/catalog";
import type { InferenceModel, ModelTask } from "../lib/types";
import { useT } from "../i18n";
import { Badge, MetricCard, MetricRow, Page, PageHead, useAmount, useCurrency, useNum } from "../ui";

/* The model catalogue.
 *
 * The toolbar is the panel's shared ListToolbar — the same component the
 * device list uses, in the same order — rather than a second toolbar that
 * merely resembles it. Only the table view renders a usable catalogue, so
 * `available` names that one and the rest stay visibly disabled instead of
 * being buttons that do nothing.
 */

const TASK_ICON: Record<ModelTask, typeof MessageSquare> = {
  chat: MessageSquare,
  code: Code2,
  embedding: Network,
};

const PAGE_SIZE = 8;

export default function Models() {
  const t = useT();
  const currency = useCurrency();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();

  const all = useMemo(() => listModels(), []);

  const [query, setQuery] = useState("");
  const [task, setTask] = useState<"all" | ModelTask>("all");
  const [publisher, setPublisher] = useState("all");
  const [capability, setCapability] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sortKey, setSortKey] = useState("default");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const publishers = useMemo(
    () => Array.from(new Set(all.map((m) => m.publisher))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = all.filter((m) => {
      if (task !== "all" && m.task !== task) return false;
      if (publisher !== "all" && m.publisher !== publisher) return false;
      if (capability !== "all" && !m.capabilities.includes(capability as never)) return false;
      if (availability === "available" && !m.available) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });

    /* Sorting is over the whole filtered set, not the page on screen. */
    const sorted = [...rows];
    if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === "priceAsc") sorted.sort((a, b) => a.inputPrice - b.inputPrice);
    if (sortKey === "priceDesc") sorted.sort((a, b) => b.inputPrice - a.inputPrice);
    if (sortKey === "context") sorted.sort((a, b) => b.contextTokens - a.contextTokens);
    return sorted;
  }, [all, query, task, publisher, capability, availability, sortKey]);

  /* A filter change can leave the current page past the end of the list. */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const counts = useMemo(() => {
    /* The cards count what a project can actually call; the table below
       lists the whole catalogue, previews included. */
    const callable = all.filter((m) => m.available);
    return {
      all: all.length,
      available: callable.length,
      textCode: callable.filter((m) => m.task !== "embedding").length,
      embedding: callable.filter((m) => m.task === "embedding").length,
      chat: all.filter((m) => m.task === "chat").length,
      code: all.filter((m) => m.task === "code").length,
      embeddingAll: all.filter((m) => m.task === "embedding").length,
    };
  }, [all]);

  const selectedModels = all.filter((m) => selected.has(m.id));
  const pageSelected = paged.length > 0 && paged.every((m) => selected.has(m.id));
  const someSelected = paged.some((m) => selected.has(m.id));

  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      paged.forEach((m) => (checked ? next.add(m.id) : next.delete(m.id)));
      return next;
    });

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filterFields: FilterField[] = [
    {
      key: "publisher",
      label: t("Publisher"),
      value: publisher,
      onChange: (v) => { setPublisher(v); resetPage(); },
      options: [{ value: "all", label: t("All publishers") }, ...publishers.map((p) => ({ value: p, label: p }))],
    },
    {
      key: "capability",
      label: t("Task & capabilities"),
      value: capability,
      onChange: (v) => { setCapability(v); resetPage(); },
      options: [
        { value: "all", label: t("All capabilities") },
        { value: "tools", label: t("Tools") },
        { value: "json", label: t("JSON output") },
        { value: "streaming", label: t("Streaming") },
      ],
    },
    {
      key: "availability",
      label: t("Availability"),
      value: availability,
      onChange: (v) => { setAvailability(v); resetPage(); },
      options: [
        { value: "all", label: t("All models") },
        { value: "available", label: t("Available") },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "default", label: t("Model") },
    { key: "name", label: t("Model") + " A-Z" },
    { key: "priceAsc", label: t("Price / 1M tokens") + " ↑" },
    { key: "priceDesc", label: t("Price / 1M tokens") + " ↓" },
    { key: "context", label: t("Context") },
  ];

  /* Comparison only makes sense between models whose output is the same kind
     of thing: two chat models, or two embedding models. A chat model and an
     embedding model are not alternatives to each other. */
  const comparable =
    selectedModels.length === 2 &&
    (selectedModels[0].task === "embedding") === (selectedModels[1].task === "embedding");

  const actions: ActionItem[] = [
    {
      key: "compare",
      label: t("Compare selected"),
      icon: GitCompare,
      disabled: !comparable,
      onSelect: () => {
        if (!comparable) {
          toast.error(t("Select two models of the same type to compare."));
          return;
        }
        navigate(`${AI_INFERENCE_BASE}/models/${selectedModels[0].id}?compare=${selectedModels[1].id}`);
      },
    },
    {
      key: "copy",
      label: t("Copy model IDs"),
      icon: Copy,
      onSelect: () => {
        void navigator.clipboard.writeText(selectedModels.map((m) => m.modelId).join("\n"));
        toast.success(t("Model IDs copied."));
      },
    },
  ];

  const taskTabs: { key: "all" | ModelTask; label: string; count: number }[] = [
    { key: "all", label: t("All models"), count: counts.all },
    { key: "chat", label: t("Chat"), count: counts.chat },
    { key: "code", label: t("Code"), count: counts.code },
    { key: "embedding", label: t("Embedding"), count: counts.embeddingAll },
  ];

  return (
    <Page>
      <PageHead
        title={t("Models")}
        description={t("Find a model, try it, and connect it to your application.")}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(centralApiKeysPath(true))}
          >
            <Plus className="size-4 me-2" />
            {t("Create API key")}
          </Button>
        }
      />

      <MetricRow>
        <MetricCard active label={t("Available models")} value={num(counts.available)} unit={t("models")} icon={Layers} />
        <MetricCard label={t("Text & code")} value={num(counts.textCode)} unit={t("models")} icon={MessageSquare} tone="blue" />
        <MetricCard label={t("Embeddings")} value={num(counts.embedding)} unit={t("models")} icon={Network} tone="violet" />
        <MetricCard label={t("API status")} value={t("Operational")} icon={Activity} tone="emerald" foot={t("Ready to accept requests")} />
      </MetricRow>

      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <ListToolbar
          className="mb-4"
          search={{ value: query, onChange: (v) => { setQuery(v); resetPage(); }, placeholder: t("Search name, model ID or use case") }}
          /* Only the table renders a usable catalogue today. */
          view={{ value: "table", onChange: () => {}, available: ["table"] }}
          onRefresh={() => {
            setIsRefreshing(true);
            window.setTimeout(() => setIsRefreshing(false), 400);
          }}
          isRefreshing={isRefreshing}
          filter={{
            fields: filterFields,
            activeCount: [publisher, capability, availability].filter((v) => v !== "all").length,
            onClear: () => { setPublisher("all"); setCapability("all"); setAvailability("all"); resetPage(); },
          }}
          sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
          actions={actions}
          selectionCount={selected.size}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {taskTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setTask(tab.key); resetPage(); }}
              className={
                task === tab.key
                  ? "rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              }
            >
              {tab.label} <span className="tabular-nums">{num(tab.count)}</span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={pageSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(c) => toggleAll(!!c)}
                    aria-label={t("Models")}
                  />
                </TableHead>
                <TableHead>{t("Model")}</TableHead>
                <TableHead>{t("Task & capabilities")}</TableHead>
                <TableHead>{t("Context")}</TableHead>
                <TableHead>{t("Price / 1M tokens")}</TableHead>
                <TableHead className="text-end">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  selected={selected.has(m.id)}
                  onToggle={() => toggleOne(m.id)}
                  onOpen={() => navigate(`${AI_INFERENCE_BASE}/models/${m.id}`)}
                  onTry={() => navigate(`${AI_INFERENCE_BASE}/playground?model=${m.id}`)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {num((currentPage - 1) * PAGE_SIZE + 1)}–{num(Math.min(currentPage * PAGE_SIZE, filtered.length))}{" "}
            {t("of")} {num(filtered.length)} {t("models")}
          </span>
          {totalPages > 1 ? (
            <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
          ) : (
            <span>{t("Prices in {currency} · input and output billed separately").replace("{currency}", currency)}</span>
          )}
        </div>
        {totalPages > 1 && (
          <p className="mt-2 text-end text-xs text-muted-foreground">
            {t("Prices in {currency} · input and output billed separately").replace("{currency}", currency)}
          </p>
        )}
      </div>
    </Page>
  );

  function ModelRow({
    model,
    selected: isSelected,
    onToggle,
    onOpen,
    onTry,
  }: {
    model: InferenceModel;
    selected: boolean;
    onToggle: () => void;
    onOpen: () => void;
    onTry: () => void;
  }) {
    const Icon = TASK_ICON[model.task];
    return (
      <TableRow className="cursor-pointer" onClick={onOpen}>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={onToggle} aria-label={model.name} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{model.name}</span>
              {/* A model id is an identifier; it reads left to right in any language. */}
              <span className="block font-mono text-xs text-muted-foreground" dir="ltr">
                {model.modelId}
              </span>
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={model.task === "embedding" ? "embedding" : "chat"}>
              {t(model.task === "chat" ? "Chat" : model.task === "code" ? "Code" : "Embedding")}
            </Badge>
            {!model.available && <Badge tone="gray">{t("Not supported")}</Badge>}
          </span>
          <div className="mt-1 text-xs text-muted-foreground">
            {model.task === "embedding"
              ? `${amount(model.dimensions ?? 0)} ${t("dimensions")}`
              : model.capabilities
                  .filter((c) => c !== "streaming")
                  .map((c) => (c === "tools" ? t("Tools") : t("JSON output")))
                  .join(" · ")}
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium text-foreground tabular-nums">
            {num(Math.round(model.contextTokens / 1000))}K
          </span>
          <div className="text-xs text-muted-foreground">{t("tokens")}</div>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-foreground tabular-nums">
            {amount(model.inputPrice)} / {model.outputPrice === null ? "—" : amount(model.outputPrice)}
          </span>
          <div className="text-xs text-muted-foreground">
            {t("Input / output")} · {currency}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Button variant="outline" size="sm" onClick={onTry}>
              <Play className="size-3.5 me-1.5" />
              {t("Try in Playground")}
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={onOpen} aria-label={model.name}>
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
}
