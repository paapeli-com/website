import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
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
  Archive,
  Activity,
  GitCompare,
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
import {
  TRENDS,
  OPPORTUNITIES,
  DIRECTION_BADGE,
  DIRECTION_ROW_BORDER,
  type Trend,
  type TrendDirection,
} from "@/features/factory/data/trends";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const AIoTAnalyzeTrends = () => {
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;

  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [tab, setTab] = useState(initialTab);
  const [dirFilter, setDirFilter] = useState<TrendDirection | "all">("all");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("largestChange");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openTrend = (id: string) => navigate(lp(`/aiot/analyze-trends/${id}`));
  const openOpportunity = (id: string) =>
    navigate(lp(`/aiot/analyze-trends/opportunities/${id}`));

  const counts = {
    detected: TRENDS.length,
    emerging: TRENDS.filter((t) => Math.abs(t.changePct) >= 10).length,
    improving: TRENDS.filter(
      (t) =>
        (t.direction === "Increasing" &&
          ["Efficiency", "Throughput", "Utilization"].includes(t.metric)) ||
        (t.direction === "Decreasing" &&
          ["Energy", "Temperature"].includes(t.metric)),
    ).length,
    deteriorating: TRENDS.filter(
      (t) =>
        (t.direction === "Increasing" &&
          ["Energy", "Temperature", "Pressure"].includes(t.metric)) ||
        (t.direction === "Decreasing" &&
          ["Efficiency", "Throughput", "Utilization", "Flow"].includes(t.metric)),
    ).length,
  };

  const increasing = TRENDS.filter((t) => t.direction === "Increasing").sort(
    (a, b) => b.changePct - a.changePct,
  );
  const decreasing = TRENDS.filter((t) => t.direction === "Decreasing").sort(
    (a, b) => a.changePct - b.changePct,
  );

  /* The four "AI insights" were four fixed sentences, translated but never
     computed, each deep-linking to a trend id that had to exist in TRENDS. */
  const insights: { id: string; title: string; text: string }[] = [];

  // ---------- Overview ----------
  const Overview = (
    <div className="space-y-4">
      <KpiSection storageKey="aiot-trends">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {[
          {
            label: tt("trendsDetectedKpi"),
            value: counts.detected,
            icon: Activity,
            accent: "text-primary",
            bg: "from-primary/10 to-transparent",
            onClick: () => setTab("explorer"),
          },
          {
            label: tt("emergingTrendsKpi"),
            value: counts.emerging,
            icon: Sparkles,
            accent: "text-amber-500",
            bg: "from-amber-50 to-transparent dark:from-amber-500/10",
            onClick: () => setTab("explorer"),
          },
          {
            label: tt("improvingAssetsKpi"),
            value: counts.improving,
            icon: TrendingUp,
            accent: "text-emerald-500",
            bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
            onClick: () => setTab("explorer"),
          },
          {
            label: tt("deterioratingAssetsKpi"),
            value: counts.deteriorating,
            icon: TrendingDown,
            accent: "text-red-500",
            bg: "from-red-50 to-transparent dark:from-red-500/10",
            onClick: () => setTab("explorer"),
          },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <button
              key={i}
              onClick={k.onClick}
              className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} border-border`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {k.label}
                </span>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground leading-none">
                  {TRENDS.length === 0 ? <NoDataValue /> : formatNumber(k.value)}
                </span>
                {TRENDS.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">{tt("trendsWord")}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      </KpiSection>



      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{tt("topIncreasingTrends")}</h3>
                <p className="text-xs text-muted-foreground">
                  {tt("topIncreasingDesc")}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => {
                  setDirFilter("Increasing");
                  setTab("explorer");
                }}
              >
                {tt("viewAll")}
              </Button>
            </div>
            <div className="divide-y border rounded-md">
              {increasing.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTrend(t.id)}
                  className={`${DIRECTION_ROW_BORDER[t.direction]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.asset} · {t.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 text-sm font-semibold shrink-0">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {formatNumber(Math.abs(t.changePct))}%
                  </div>
                </button>
              ))}
              {increasing.length === 0 && (
                TRENDS.length === 0 ? <NoData size="sm" /> : (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    {tt("noIncreasingTrends")}
                  </div>
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
                <p className="text-xs text-muted-foreground">
                  {tt("topDecreasingDesc")}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => {
                  setDirFilter("Decreasing");
                  setTab("explorer");
                }}
              >
                {tt("viewAll")}
              </Button>
            </div>
            <div className="divide-y border rounded-md">
              {decreasing.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTrend(t.id)}
                  className={`${DIRECTION_ROW_BORDER[t.direction]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.asset} · {t.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold shrink-0">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    {formatNumber(Math.abs(t.changePct))}%
                  </div>
                </button>
              ))}
              {decreasing.length === 0 && (
                TRENDS.length === 0 ? <NoData size="sm" /> : (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    {tt("noDecreasingTrends")}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* AI Insights */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{tt("aiTrendInsightsTitle")}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.length === 0 && <div className="md:col-span-2"><NoData size="sm" /></div>}
            {insights.map((ins) => (
              <button
                key={ins.id}
                onClick={() => openTrend(ins.id)}
                className="text-start border rounded-md p-3 hover:bg-muted/50"
              >
                <div className="text-xs font-medium mb-1">{ins.title}</div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {ins.text}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ---------- Trends Explorer ----------
  const filtered = useMemo(() => {
    return TRENDS.filter((t) => {
      if (dirFilter !== "all" && t.direction !== dirFilter) return false;
      if (locFilter !== "all" && !t.location.toLowerCase().includes(locFilter)) return false;
      if (typeFilter !== "all" && t.assetType.toLowerCase() !== typeFilter) return false;
      if (metricFilter !== "all" && t.metric.toLowerCase() !== metricFilter) return false;
      if (
        search &&
        !`${t.name} ${t.asset} ${t.location} ${t.metric}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return true;
    }).sort((a, b) => {
      switch (sortKey) {
        case "confidence":
          return b.confidence - a.confidence;
        case "name":
          return a.name.localeCompare(b.name);
        case "largestChange":
        default:
          return Math.abs(b.changePct) - Math.abs(a.changePct);
      }
    });
  }, [dirFilter, locFilter, typeFilter, metricFilter, search, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    const header = ["name", "asset", "devId", "location", "metric", "direction", "changePct", "confidence", "timeRange"];
    const csv = [
      header.join(","),
      ...filtered.map((r) =>
        header
          .map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
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
        options: [
          { value: "all", label: tt("all") },
          { value: "factory a", label: "Factory A" },
          { value: "factory b", label: "Factory B" },
        ],
      },
      {
        key: "type",
        label: tt("deviceTypeLabel"),
        value: typeFilter,
        onChange: setTypeFilter,
        options: [
          { value: "all", label: tt("all") },
          { value: "pump", label: "Pump" },
          { value: "compressor", label: "Compressor" },
          { value: "boiler", label: "Boiler" },
          { value: "heat exchanger", label: "Heat Exchanger" },
          { value: "conveyor", label: "Conveyor" },
          { value: "line", label: "Line" },
          { value: "factory", label: "Factory" },
        ],
      },
      {
        key: "metric",
        label: tt("metricLabel"),
        value: metricFilter,
        onChange: setMetricFilter,
        options: [
          { value: "all", label: tt("all") },
          { value: "energy", label: "Energy" },
          { value: "temperature", label: "Temperature" },
          { value: "pressure", label: "Pressure" },
          { value: "flow", label: "Flow" },
          { value: "efficiency", label: "Efficiency" },
          { value: "throughput", label: "Throughput" },
          { value: "utilization", label: "Utilization" },
        ],
      },
      {
        key: "timeRange",
        label: tt("timeRangeLabel"),
        value: timeRange,
        onChange: setTimeRange,
        options: [
          { value: "7d", label: "7d" },
          { value: "30d", label: "30d" },
          { value: "90d", label: "90d" },
        ],
      },
      {
        key: "direction",
        label: tt("trendDirectionLabel"),
        value: dirFilter,
        onChange: (v) => setDirFilter(v as TrendDirection | "all"),
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
    const actionItems: ActionItem[] = [
      { key: "export", label: tt("exportCsv"), icon: Download, onSelect: handleExport },
      { key: "archive", label: tt("archive"), icon: Archive, comingSoon: true },
    ];
    const activeFilterCount = [dirFilter, locFilter, typeFilter, metricFilter].filter(
      (v) => v !== "all",
    ).length;

    return (
      <div className="space-y-3">
        <ListToolbar
          search={{ value: search, onChange: setSearch, placeholder: tt("searchTrendsPh") }}
          view={{ value: listView, onChange: setListView, available: ["table"] }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
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
                const DirIcon =
                  r.direction === "Increasing"
                    ? ArrowUpRight
                    : r.direction === "Decreasing"
                    ? ArrowDownRight
                    : Minus;
                const dirTone =
                  r.direction === "Increasing"
                    ? "text-red-600"
                    : r.direction === "Decreasing"
                    ? "text-blue-600"
                    : "text-muted-foreground";
                const dirLabel =
                  r.direction === "Increasing" ? tt("increasingDir")
                  : r.direction === "Decreasing" ? tt("decreasingDir")
                  : tt("stableDir");
                return (
                  <tr
                    key={r.id}
                    onClick={() => openTrend(r.id)}
                    className={`${DIRECTION_ROW_BORDER[r.direction]} border-b hover:bg-muted/40 cursor-pointer`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.metric}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm">{r.asset}</div>
                      <div className="text-xs text-muted-foreground">{r.devId}</div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <LocationCell path={r.location} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className={`${DIRECTION_BADGE[r.direction]} text-[10px]`}>
                        {dirLabel}
                      </Badge>
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
                        <span className="text-xs font-medium w-9 text-end">
                          {formatNumber(r.confidence)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-3 py-2.5 text-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs"
                          onClick={() => openTrend(r.id)}
                        >
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
                            <DropdownMenuItem
                              onClick={() =>
                                toast({
                                  title: tt("compareModeToast"),
                                  description: tt("addedToComparison").replace("{name}", r.name),
                                })
                              }
                            >
                              <GitCompare className="h-4 w-4 me-2" /> {tt("compareAction")}
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
      {OPPORTUNITIES.length === 0 && <NoData />}
      {OPPORTUNITIES.map((o) => (
        <Card key={o.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <h3 className="font-semibold text-sm truncate">{o.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {o.description}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {o.category}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-md p-2">
                <div className="text-[11px] text-muted-foreground">{o.impactLabel}</div>
                <div className="text-lg font-bold text-emerald-600">
                  {o.impactValue}
                </div>
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
      ))}
    </div>
  );

  return (
    <>
      {/* No count while nothing is served — "0 trends" reads as a measurement. */}
      <PageHeader title={tt("analyzeTrendsLabel")} count={TRENDS.length || null} countLabel={tt("trendsWord")} />


      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
        className="space-y-4"
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-transparent border-b rounded-none h-auto p-0 gap-6">
            <TabsTrigger
              value="overview"
              className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0"
            >
              <Activity className="h-3.5 w-3.5" />
              {tt("overviewTab")}
            </TabsTrigger>
            <TabsTrigger
              value="explorer"
              className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {tt("trendsExplorer")}
              <Badge
                variant="secondary"
                className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none"
              >
                {formatNumber(TRENDS.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="opportunities"
              className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {tt("opportunitiesTabLabel")}
              <Badge
                variant="secondary"
                className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none"
              >
                {formatNumber(OPPORTUNITIES.length)}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{Overview}</TabsContent>
        <TabsContent value="explorer">{ExplorerTab}</TabsContent>
        <TabsContent value="opportunities">{OpportunitiesTab}</TabsContent>
      </Tabs>
    </>
  );
};

export default AIoTAnalyzeTrends;
