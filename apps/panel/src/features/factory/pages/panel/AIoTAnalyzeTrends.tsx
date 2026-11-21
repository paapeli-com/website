import { CropContextChip } from "@/features/greenhouse/components/CropContext";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AiTrendDirection } from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MoreHorizontal,
  Download,
  Activity,
  Lightbulb,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ListToolbar,
  type ActionItem,
  type FilterField,
  type SortOption,
} from "@/features/factory/components/panel/ListToolbar";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useAiOpportunities, useAiTrends } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import { AiStatusBar } from "@/features/factory/components/ai/AiStatusBar";
import {
  DIRECTION_BADGE,
  DIRECTION_ROW_BORDER,
  OPPORTUNITY_STATUS_BADGE,
  OPPORTUNITY_STATUS_KEY,
  isDeteriorating,
  isImproving,
  optionsOf,
  useLocationPath,
} from "@/features/factory/components/ai/aiShared";

const AIoTAnalyzeTrends = () => {
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();
  const trends = useAiTrends();
  const opportunities = useAiOpportunities();

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [tab, setTab] = useState(initialTab);
  const [dirFilter, setDirFilter] = useState<AiTrendDirection | "all">("all");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("largestChange");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const all = useMemo(
    () => (trends.data ?? []).map((tr) => ({ ...tr, location: pathOf(tr.assetId) })),
    [trends.data, pathOf],
  );
  type Row = (typeof all)[number];
  /* Every signal has a trend per window; the page reads one window at a time. */
  const TRENDS = useMemo(() => all.filter((tr) => tr.window === timeRange), [all, timeRange]);
  const OPPORTUNITIES = opportunities.data ?? [];

  const openTrend = (id: string) => navigate(lp(`/aiot/analyze-trends/${id}`));
  const openOpportunity = (id: string) => navigate(lp(`/aiot/analyze-trends/opportunities/${id}`));

  const counts = {
    detected: TRENDS.filter((x) => x.direction !== "Stable").length,
    emerging: TRENDS.filter((x) => x.direction !== "Stable" && Math.abs(x.changePct) >= 10).length,
    improving: TRENDS.filter(isImproving).length,
    deteriorating: TRENDS.filter(isDeteriorating).length,
  };

  const increasing = TRENDS.filter((x) => x.direction === "Increasing").sort((a, b) => b.changePct - a.changePct);
  const decreasing = TRENDS.filter((x) => x.direction === "Decreasing").sort((a, b) => a.changePct - b.changePct);

  /* The largest significant moves, read out. */
  const insights = TRENDS.filter((x) => x.direction !== "Stable")
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 4)
    .map((x) => ({ id: x.id, title: `${x.deviceName} · ${x.key}`, text: ai.trendLines(x).slice(0, 2).join(" ") }));

  const dirLabel = (d: AiTrendDirection) =>
    d === "Increasing" ? tt("increasingDir") : d === "Decreasing" ? tt("decreasingDir") : tt("stableDir");

  const renderTrendRow = (x: Row, tone: "up" | "down") => (
    <button
      key={x.id}
      onClick={() => openTrend(x.id)}
      className={`${DIRECTION_ROW_BORDER[x.direction]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{x.key} · {ai.category(x.category)}</div>
        <div className="text-xs text-muted-foreground truncate">{x.deviceName} · {x.location || "—"}</div>
        <CropContextChip deviceId={x.deviceId} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-semibold shrink-0 ${tone === "up" ? "text-red-600" : "text-blue-600"}`}>
        {tone === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {formatNumber(Math.abs(x.changePct))}%
      </div>
    </button>
  );

  // ---------- Overview ----------
  const Overview = (
    <div className="space-y-4">
      <KpiSection storageKey="aiot-trends">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tt("trendsDetectedKpi"), value: counts.detected, icon: Activity, accent: "text-primary", bg: "from-primary/10 to-transparent" },
          { label: tt("emergingTrendsKpi"), value: counts.emerging, icon: Sparkles, accent: "text-amber-500", bg: "from-amber-50 to-transparent dark:from-amber-500/10" },
          { label: tt("improvingAssetsKpi"), value: counts.improving, icon: TrendingUp, accent: "text-emerald-500", bg: "from-emerald-50 to-transparent dark:from-emerald-500/10" },
          { label: tt("deterioratingAssetsKpi"), value: counts.deteriorating, icon: TrendingDown, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <button
              key={i}
              onClick={() => setTab("explorer")}
              className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} border-border`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground leading-none">
                  {TRENDS.length === 0 ? <NoDataValue /> : formatNumber(k.value)}
                </span>
                {TRENDS.length > 0 && <span className="text-[11px] text-muted-foreground">{tt("trendsWord")} · {ai.windowLabel(timeRange)}</span>}
              </div>
            </button>
          );
        })}
      </div>
      </KpiSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{tt("topIncreasingTrends")}</h3>
                <p className="text-xs text-muted-foreground">{tt("topIncreasingDesc")}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setDirFilter("Increasing"); setTab("explorer"); }}>
                {tt("viewAll")}
              </Button>
            </div>
            <div className="divide-y border rounded-md">
              {increasing.slice(0, 5).map((x) => renderTrendRow(x, "up"))}
              {increasing.length === 0 && (
                TRENDS.length === 0 ? <NoData size="sm" /> : (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">{tt("noIncreasingTrends")}</div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{tt("topDecreasingTrends")}</h3>
                <p className="text-xs text-muted-foreground">{tt("topDecreasingDesc")}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setDirFilter("Decreasing"); setTab("explorer"); }}>
                {tt("viewAll")}
              </Button>
            </div>
            <div className="divide-y border rounded-md">
              {decreasing.slice(0, 5).map((x) => renderTrendRow(x, "down"))}
              {decreasing.length === 0 && (
                TRENDS.length === 0 ? <NoData size="sm" /> : (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">{tt("noDecreasingTrends")}</div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{tt("aiTrendInsightsTitle")}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.length === 0 && <div className="md:col-span-2"><NoData size="sm" /></div>}
            {insights.map((ins) => (
              <button key={ins.id} onClick={() => openTrend(ins.id)} className="text-start border rounded-md p-3 hover:bg-muted/50">
                <div className="text-xs font-medium mb-1">{ins.title}</div>
                <p className="text-xs text-muted-foreground leading-snug">{ins.text}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ---------- Trends Explorer ----------
  const filtered = useMemo(() => {
    return TRENDS.filter((x) => {
      if (dirFilter !== "all" && x.direction !== dirFilter) return false;
      if (locFilter !== "all" && x.location !== locFilter) return false;
      if (typeFilter !== "all" && x.deviceType !== typeFilter) return false;
      if (metricFilter !== "all" && x.category !== metricFilter) return false;
      if (search && !`${x.key} ${x.deviceName} ${x.location} ${x.category}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      switch (sortKey) {
        case "confidence":
          return b.confidence - a.confidence;
        case "name":
          return a.key.localeCompare(b.key) || a.deviceName.localeCompare(b.deviceName);
        case "largestChange":
        default:
          return Math.abs(b.changePct) - Math.abs(a.changePct);
      }
    });
  }, [TRENDS, dirFilter, locFilter, typeFilter, metricFilter, search, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    const header = ["key", "category", "device", "location", "window", "direction", "changePct", "confidence", "pValue", "slopePerDay"];
    const rows = filtered.map((r) => [r.key, r.category, r.deviceName, r.location, r.window, r.direction, r.changePct, r.confidence, r.pValue, r.slopePerDay]);
    const csv = [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trends-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ExplorerTab = (() => {
    const filterFields: FilterField[] = [
      {
        key: "location",
        label: tt("location"),
        value: locFilter,
        onChange: setLocFilter,
        options: [{ value: "all", label: tt("all") }, ...optionsOf(TRENDS.map((x) => x.location)).map((l) => ({ value: l, label: l }))],
      },
      {
        key: "type",
        label: tt("deviceTypeLabel"),
        value: typeFilter,
        onChange: setTypeFilter,
        options: [{ value: "all", label: tt("all") }, ...optionsOf(TRENDS.map((x) => x.deviceType)).map((v) => ({ value: v, label: v }))],
      },
      {
        key: "metric",
        label: tt("metricLabel"),
        value: metricFilter,
        onChange: setMetricFilter,
        options: [{ value: "all", label: tt("all") }, ...optionsOf(TRENDS.map((x) => x.category)).map((c) => ({ value: c, label: ai.category(c) }))],
      },
      {
        key: "timeRange",
        label: tt("timeRangeLabel"),
        value: timeRange,
        onChange: (v) => { setTimeRange(v); setPage(1); },
        options: [
          { value: "7d", label: ai.windowLabel("7d") },
          { value: "30d", label: ai.windowLabel("30d") },
          { value: "90d", label: ai.windowLabel("90d") },
        ],
      },
      {
        key: "direction",
        label: tt("trendDirectionLabel"),
        value: dirFilter,
        onChange: (v) => setDirFilter(v as AiTrendDirection | "all"),
        options: [
          { value: "all", label: tt("all") },
          { value: "Increasing", label: tt("increasingDir") },
          { value: "Decreasing", label: tt("decreasingDir") },
          { value: "Stable", label: tt("stableDir") },
        ],
      },
    ];
    const sortOptions: SortOption[] = [
      { key: "largestChange", label: tt("sortLargestChange") },
      { key: "confidence", label: tt("sortHighestConfidence") },
      { key: "name", label: tt("sortNameAZ") },
    ];
    const actionItems: ActionItem[] = [{ key: "export", label: tt("exportCsv"), icon: Download, onSelect: handleExport }];
    const activeFilterCount = [dirFilter, locFilter, typeFilter, metricFilter].filter((v) => v !== "all").length;

    return (
      <div className="space-y-3">
        <ListToolbar
          search={{ value: search, onChange: setSearch, placeholder: tt("searchTrendsPh") }}
          view={{ value: listView, onChange: setListView, available: ["table"] }}
          onRefresh={() => trends.refetch()}
          isRefreshing={trends.isFetching}
          filter={{
            fields: filterFields,
            activeCount: activeFilterCount,
            onClear: () => {
              setDirFilter("all");
              setLocFilter("all");
              setTypeFilter("all");
              setMetricFilter("all");
            },
          }}
          sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
          actions={actionItems}
        />

        <div className="overflow-x-auto border rounded-md bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{tt("colTrend")}</th>
                <th className="px-3 py-2 text-start font-medium">{tt("colAsset")}</th>
                <th className="px-3 py-2 text-start font-medium hidden md:table-cell">{tt("colLocation")}</th>
                <th className="px-3 py-2 text-start font-medium">{tt("colDirection")}</th>
                <th className="px-3 py-2 text-start font-medium">{tt("colChange")}</th>
                <th className="px-3 py-2 text-start font-medium w-[140px]">{tt("colConfidence")}</th>
                <th className="px-3 py-2 text-end font-medium">{tt("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    {TRENDS.length === 0 ? <NoData /> : (
                      <>
                        <p className="font-medium">{tt("noTrendsFound")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tt("tryAdjustingFilters")}</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {slice.map((r) => {
                const DirIcon = r.direction === "Increasing" ? ArrowUpRight : r.direction === "Decreasing" ? ArrowDownRight : Minus;
                const dirTone = r.direction === "Increasing" ? "text-red-600" : r.direction === "Decreasing" ? "text-blue-600" : "text-muted-foreground";
                return (
                  <tr
                    key={r.id}
                    onClick={() => openTrend(r.id)}
                    className={`${DIRECTION_ROW_BORDER[r.direction]} border-b hover:bg-muted/40 cursor-pointer`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{r.key}</div>
                      <div className="text-xs text-muted-foreground">{ai.category(r.category)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm">{r.deviceName}</div>
                      <div className="text-xs text-muted-foreground">{r.deviceType}</div>
                      <CropContextChip deviceId={r.deviceId} />
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">{r.location ? <LocationCell path={r.location} /> : "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`${DIRECTION_BADGE[r.direction]} text-[10px]`}>{dirLabel(r.direction)}</Badge>
                    </td>
                    <td className={`px-3 py-2.5 text-sm font-semibold ${dirTone}`}>
                      <span className="inline-flex items-center gap-1">
                        <DirIcon className="h-3.5 w-3.5" />
                        {r.changePct > 0 ? "+" : ""}
                        {formatNumber(r.changePct)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={r.confidence} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium w-9 text-end">{formatNumber(r.confidence)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openTrend(r.id)}>
                          <Eye className="h-3.5 w-3.5" /> {tt("view")}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openTrend(r.id)}>
                              <Eye className="h-4 w-4 me-2" /> {tt("viewTrendAction")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExport}>
                              <Download className="h-4 w-4 me-2" /> {tt("export")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end mt-3">
            <SmartPagination currentPage={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    );
  })();

  // ---------- Opportunities ----------
  const OpportunitiesTab = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {OPPORTUNITIES.length === 0 && <div className="md:col-span-2"><NoData /></div>}
      {OPPORTUNITIES.map((o) => {
        const text = ai.opportunity(o);
        return (
          <Card key={o.id} className={`hover:shadow-sm transition-shadow ${o.active ? "" : "opacity-70"}`}>
            <CardContent className="p-4 flex flex-col gap-3 h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <h3 className="font-semibold text-sm truncate">{text.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{text.description}</p>
                  {!o.active && <p className="text-[11px] text-muted-foreground mt-1 italic">{ai.tr("opportunityInactive")}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{text.category}</Badge>
                  {o.status !== "NEW" && (
                    <Badge className={`${OPPORTUNITY_STATUS_BADGE[o.status]} text-[10px]`}>{tt(OPPORTUNITY_STATUS_KEY[o.status])}</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-md p-2">
                  <div className="text-[11px] text-muted-foreground">{text.impactLabel}</div>
                  <div className="text-lg font-bold text-emerald-600">{text.impactValue}</div>
                </div>
                <div className="border rounded-md p-2">
                  <div className="text-[11px] text-muted-foreground">{tt("confidence")}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={o.confidence} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium">{formatNumber(o.confidence)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex justify-end">
                <Button size="sm" onClick={() => openOpportunity(o.id)} className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {tt("viewDetails")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <UniformPage>
      <PageHeader title={tt("analyzeTrendsLabel")} count={counts.detected || null} countLabel={tt("trendsWord")} />
      <AiStatusBar />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-transparent border-b rounded-none h-auto p-0 gap-6">
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
                <Activity className="h-3.5 w-3.5" />
                {tt("overviewTab")}
              </TabsTrigger>
              <TabsTrigger value="explorer" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
                <TrendingUp className="h-3.5 w-3.5" />
                {tt("trendsExplorer")}
                <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">
                  {formatNumber(TRENDS.length)}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
                <Lightbulb className="h-3.5 w-3.5" />
                {tt("opportunitiesTabLabel")}
                <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">
                  {formatNumber(OPPORTUNITIES.length)}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          {tab === "overview" && (
            <div className="flex gap-1">
              {(["7d", "30d", "90d"] as const).map((w) => (
                <Button key={w} size="sm" variant={timeRange === w ? "default" : "outline"} className="h-7 text-xs" onClick={() => setTimeRange(w)}>
                  {ai.windowLabel(w)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="overview">{Overview}</TabsContent>
        <TabsContent value="explorer">{ExplorerTab}</TabsContent>
        <TabsContent value="opportunities">{OpportunitiesTab}</TabsContent>
      </Tabs>
    </UniformPage>
  );
};

export default AIoTAnalyzeTrends;
