import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AiFailureForecast, AiForecastStatus } from "@paapeli/api";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/factory/components/ui/tabs";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Wrench,
  Bell,
  EyeOff,
  Eye,
  MoreHorizontal,
  Download,
  AlertTriangle,
  Check,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/features/factory/hooks/use-toast";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import {
  WorkOrderSheet,
  type WorkOrderSource,
} from "@/features/factory/components/anomalies/WorkOrderSheet";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { formatDateTime } from "@/shared/lib/formatDate";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiForecasts } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import { AiStatusBar } from "@/features/factory/components/ai/AiStatusBar";
import {
  FORECAST_STATUS_KEY,
  RISK_BADGE,
  RISK_RANK,
  ROW_BORDER,
  STATUS_BADGE,
  optionsOf,
  useLocationPath,
  type Risk,
} from "@/features/factory/components/ai/aiShared";

/** A forecast as the list shows it. */
interface Row {
  forecast: AiFailureForecast;
  name: string;
  devId: string;
  type: string;
  location: string;
  health: number;
  risk: Risk;
  date: string;
  rulDays: number | null;
  cause: string;
  actions: string[];
}

const AIoTForecastFailures = () => {
  const navigate = useNavigate();
  const { language, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();
  const forecasts = useAiForecasts();
  const { setForecastStatus } = useAiActions();

  const riskLabel = (r: Risk): string =>
    ({ Critical: tt("riskCriticalShort"), High: tt("riskHighShort"), Medium: tt("riskMediumShort"), Low: tt("riskLowShort") })[r] || r;
  const statusLabel = (s: AiForecastStatus) => tt(FORECAST_STATUS_KEY[s]);

  const ROWS: Row[] = useMemo(
    () =>
      (forecasts.data ?? []).map((f) => ({
        forecast: f,
        name: f.deviceName,
        devId: f.deviceId,
        type: f.deviceType,
        location: pathOf(f.assetId),
        health: f.health,
        risk: f.risk,
        date: f.predictedFailureAt ? formatDateTime(f.predictedFailureAt, language) : ai.tr("noFailureWithin90"),
        rulDays: f.rulDays ?? null,
        cause: `${f.causeKey} · ${ai.category(f.causeCategory)}`,
        actions: f.actions.map(ai.action),
      })),
    [forecasts.data, pathOf, language, ai],
  );

  const [tab, setTab] = useState("overview");
  const [riskFilter, setRiskFilter] = useState<Risk | "all">("all");
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeWindow, setTimeWindow] = useState("all");
  const [sortKey, setSortKey] = useState("highestRisk");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [woSource, setWoSource] = useState<WorkOrderSource | null>(null);
  const [statusFilter, setStatusFilter] = useState<AiForecastStatus | "all">("all");

  const toSource = (r: Row): WorkOrderSource => ({
    id: r.devId,
    asset: r.name,
    devId: r.devId,
    location: r.location,
    severity: r.risk,
    suggestedActions: r.actions,
    fallbackAction: ai.action("INSPECT_ASSET"),
    kind: "forecast",
    deviceId: r.devId,
    assetId: r.forecast.assetId,
  });

  const updateStatus = (ids: string[], next: AiForecastStatus, label?: string) => {
    Promise.all(ids.map((deviceId) => setForecastStatus.mutateAsync({ deviceId, status: next })))
      .then(() => toast({ title: label ?? statusLabel(next), description: ids.length === 1 ? ROWS.find((r) => r.devId === ids[0])?.name : formatNumber(ids.length) }))
      .catch((e) => toast({ title: statusLabel(next), description: apiErrorMessage(e, statusLabel(next)), variant: "destructive" }));
  };

  const filtered = useMemo(() => {
    const windowDays = timeWindow === "all" ? null : parseInt(timeWindow, 10);
    return ROWS.filter((r) => {
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (locFilter !== "all" && r.location !== locFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.forecast.status !== statusFilter) return false;
      if (windowDays !== null && (r.rulDays === null || r.rulDays > windowDays)) return false;
      if (search && !`${r.name} ${r.type} ${r.location} ${r.cause}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      switch (sortKey) {
        case "lowestHealth": return a.health - b.health;
        case "shortestRUL": return (a.rulDays ?? Infinity) - (b.rulDays ?? Infinity);
        case "highestRisk":
        default: return RISK_RANK[b.risk] - RISK_RANK[a.risk] || a.health - b.health;
      }
    });
  }, [ROWS, riskFilter, locFilter, typeFilter, statusFilter, search, sortKey, timeWindow]);

  const counts = useMemo(() => ({
    critical: ROWS.filter((r) => r.risk === "Critical").length,
    high: ROWS.filter((r) => r.risk === "High").length,
    medium: ROWS.filter((r) => r.risk === "Medium").length,
    low: ROWS.filter((r) => r.risk === "Low").length,
  }), [ROWS]);

  /* What to do first: each at-risk device's top recommendation, worst first. */
  const recommendations = useMemo(
    () =>
      ROWS.filter((r) => (r.risk === "Critical" || r.risk === "High") && r.forecast.status !== "DISMISSED" && r.forecast.status !== "RESOLVED")
        .sort((a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk] || a.health - b.health)
        .map((r) => ({
          row: r,
          action: r.actions[0] ?? ai.action("INSPECT_ASSET"),
          impact: `${tt("failureProbability")} (${ai.tr("probabilityWithin", { days: formatNumber(30) })}): ${formatNumber(r.forecast.probability30d)}%`,
        })),
    [ROWS, ai, tt, formatNumber],
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.devId)));
  };

  const openAsset = (r: Row) => navigate(lp(`/aiot/forecast-failures/${r.devId}`));

  const goAssetsTabFiltered = (r: Risk | "all") => {
    setRiskFilter(r);
    setTab("assets");
  };

  const locations = optionsOf(ROWS.map((r) => r.location));
  const types = optionsOf(ROWS.map((r) => r.type));

  // ---------- Overview Tab ----------
  const Overview = (
    <div className="space-y-4">
      <KpiSection storageKey="aiot-forecast">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: "Critical" as Risk, label: tt("riskCritical"), value: counts.critical, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
          { key: "High" as Risk, label: tt("riskHigh"), value: counts.high, accent: "text-orange-500", bg: "from-orange-50 to-transparent dark:from-orange-500/10" },
          { key: "Medium" as Risk, label: tt("riskMedium"), value: counts.medium, accent: "text-yellow-500", bg: "from-yellow-50 to-transparent dark:from-yellow-500/10" },
          { key: "Low" as Risk, label: tt("riskLow"), value: counts.low, accent: "text-blue-500", bg: "from-blue-50 to-transparent dark:from-blue-500/10" },
        ]).map((k) => {
          const isActive = riskFilter === k.key && tab === "assets";
          return (
            <button
              key={k.key}
              onClick={() => goAssetsTabFiltered(k.key)}
              className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} ${isActive ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground leading-none">
                  {ROWS.length === 0 ? <NoDataValue /> : formatNumber(k.value)}
                </span>
                {ROWS.length > 0 && <span className="text-[11px] text-muted-foreground">{tt("assetsWord")}</span>}
              </div>
            </button>
          );
        })}
      </div>
      </KpiSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{tt("needsAttention")}</h3>
                <p className="text-xs text-muted-foreground">{tt("needsAttentionDesc")}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setTab("assets")}>{tt("viewAll")}</Button>
            </div>
            <div className="divide-y border rounded-md">
              {ROWS.length === 0 && <NoData size="sm" />}
              {ROWS.filter((r) => r.risk === "Critical" || r.risk === "High")
                .sort((a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk] || a.health - b.health)
                .slice(0, 5)
                .map((r) => (
                <button
                  key={r.devId}
                  onClick={() => openAsset(r)}
                  className={`${ROW_BORDER[r.risk]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{r.name}</span>
                      <Badge className={`${RISK_BADGE[r.risk]} text-[10px]`}>{riskLabel(r.risk)}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.type} · {r.location || "—"}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-xs text-muted-foreground">{tt("rul")}</div>
                    <div className="text-sm font-semibold">{r.rulDays === null ? "—" : `${formatNumber(Math.round(r.rulDays))}${tt("daysShort")}`}</div>
                  </div>
                  <div className="w-20 shrink-0">
                    <Progress value={r.health} className="h-1.5" />
                    <div className="text-[10px] text-muted-foreground text-end mt-0.5">{formatNumber(r.health)}%</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{tt("suggestedActions")}</h3>
                <p className="text-xs text-muted-foreground">{tt("suggestedActionsDesc")}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setTab("recommendations")}>{tt("viewAll")}</Button>
            </div>
            <div className="space-y-2">
              {recommendations.length === 0 && <NoData size="sm" />}
              {recommendations.slice(0, 4).map((r) => (
                <button key={r.row.devId} onClick={() => openAsset(r.row)} className="w-full text-start border rounded-md p-2.5 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{r.row.name}</span>
                    <Badge className={`${RISK_BADGE[r.row.risk]} text-[10px]`}>{riskLabel(r.row.risk)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{r.action}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ---------- Assets At Risk Tab ----------
  const AssetsTab = (
    <div className="space-y-3">
      {(() => {
        const filterFields: FilterField[] = [
          {
            key: "risk", label: tt("riskLevel"), value: riskFilter,
            onChange: (v) => setRiskFilter(v as Risk | "all"),
            options: [
              { value: "all", label: tt("all") },
              { value: "Critical", label: tt("riskCriticalShort") },
              { value: "High", label: tt("riskHighShort") },
              { value: "Medium", label: tt("riskMediumShort") },
              { value: "Low", label: tt("riskLowShort") },
            ],
          },
          {
            key: "location", label: tt("location"), value: locFilter, onChange: setLocFilter,
            options: [{ value: "all", label: tt("all") }, ...locations.map((l) => ({ value: l, label: l }))],
          },
          {
            key: "assetType", label: tt("assetType"), value: typeFilter, onChange: setTypeFilter,
            options: [{ value: "all", label: tt("all") }, ...types.map((v) => ({ value: v, label: v }))],
          },
          {
            key: "status", label: tt("statusLabelGeneric"), value: statusFilter,
            onChange: (v) => setStatusFilter(v as AiForecastStatus | "all"),
            options: [
              { value: "all", label: tt("all") },
              ...(Object.keys(FORECAST_STATUS_KEY) as AiForecastStatus[]).map((s) => ({ value: s, label: statusLabel(s) })),
            ],
          },
          {
            key: "timeWindow", label: tt("timeWindow"), value: timeWindow, onChange: setTimeWindow,
            options: [
              { value: "all", label: tt("all") },
              { value: "7", label: "7d" },
              { value: "30", label: "30d" },
              { value: "90", label: "90d" },
            ],
          },
        ];
        const sortOptions: SortOption[] = [
          { key: "highestRisk", label: tt("sortHighestRisk") },
          { key: "lowestHealth", label: tt("sortLowestHealth") },
          { key: "shortestRUL", label: tt("sortShortestRUL") },
        ];
        const handleExport = () => {
          const header = ["name", "devId", "location", "type", "health", "risk", "rulDays", "predictedFailure", "probability30d", "cause", "status"];
          const rows = filtered.map((r) => [r.name, r.devId, r.location, r.type, r.health, r.risk, r.rulDays ?? "", r.forecast.predictedFailureAt ?? "", r.forecast.probability30d, r.forecast.causeKey, r.forecast.status]);
          const csv = [header.join(","), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `forecast-${Date.now()}.csv`; a.click();
          URL.revokeObjectURL(url);
        };
        const actionItems: ActionItem[] = [
          { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
        ];
        const activeFilterCount = [riskFilter, locFilter, typeFilter, statusFilter, timeWindow].filter((v) => v !== "all").length;
        return (
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: tt("searchAssetsPlaceholder") }}
            view={{ value: listView, onChange: setListView, available: ["table"] }}
            onRefresh={() => forecasts.refetch()}
            isRefreshing={forecasts.isFetching}
            filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setRiskFilter("all"); setLocFilter("all"); setTypeFilter("all"); setStatusFilter("all"); setTimeWindow("all"); } }}
            sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
            actions={actionItems}
            selectionCount={selected.size}
          />
        );
      })()}

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
          <span className="text-sm font-medium">{formatNumber(selected.size)} {tt("selectedCount")}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => { updateStatus([...selected], "ACKNOWLEDGED", tt("toastPredictionAcknowledged")); setSelected(new Set()); }}>
              {tt("actionAcknowledgeMenu")}
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => { updateStatus([...selected], "DISMISSED", tt("predictionIgnoredToast")); setSelected(new Set()); }}>
              {tt("ignorePredictions")}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-md bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-8">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-start font-medium">{tt("colAsset")}</th>
              <th className="px-3 py-2 text-start font-medium">{tt("colLocation")}</th>
              <th className="px-3 py-2 text-start font-medium w-[140px]">{tt("colHealth")}</th>
              <th className="px-3 py-2 text-start font-medium">{tt("colRisk")}</th>
              <th className="px-3 py-2 text-start font-medium">{tt("colPredicted")}</th>
              <th className="px-3 py-2 text-start font-medium">{tt("colRUL")}</th>
              <th className="px-3 py-2 text-start font-medium">{tt("statusLabelGeneric")}</th>
              <th className="px-3 py-2 text-end font-medium">{tt("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center">
                  {ROWS.length === 0 ? <NoData /> : (
                    <>
                      <p className="font-medium">{tt("noPredictedFailures")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tt("tryAdjustingFilters")}</p>
                    </>
                  )}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.devId}
                onClick={() => openAsset(r)}
                className={`${ROW_BORDER[r.risk]} border-b hover:bg-muted/40 cursor-pointer`}
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(r.devId)}
                    onCheckedChange={(v) => {
                      const s = new Set(selected);
                      if (v) s.add(r.devId); else s.delete(r.devId);
                      setSelected(s);
                    }}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.cause}</div>
                </td>
                <td className="px-3 py-2.5">{r.location ? <LocationCell path={r.location} /> : "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Progress value={r.health} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium w-9 text-end">{formatNumber(r.health)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5"><Badge className={`${RISK_BADGE[r.risk]} text-[10px]`}>{riskLabel(r.risk)}</Badge></td>
                <td className="px-3 py-2.5 text-xs">{r.date}</td>
                <td className="px-3 py-2.5 text-xs font-medium">{r.rulDays === null ? "—" : `${formatNumber(r.rulDays)} ${tt("days")}`}</td>
                <td className="px-3 py-2.5">
                  <Badge className={`${STATUS_BADGE[r.forecast.status]} text-[10px]`}>{statusLabel(r.forecast.status)}</Badge>
                </td>
                <td className="px-3 py-2.5 text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openAsset(r)}>
                      <Eye className="h-3.5 w-3.5" /> {tt("view")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAsset(r)}><Eye className="h-4 w-4 me-2" /> {tt("viewAnalysis")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setWoSource(toSource(r))}><Wrench className="h-4 w-4 me-2" /> {tt("createWorkOrder")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus([r.devId], "ACKNOWLEDGED", tt("toastPredictionAcknowledged"))}><Check className="h-4 w-4 me-2" /> {tt("actionAcknowledgeMenu")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus([r.devId], "INVESTIGATING", tt("toastInvestigationStarted"))}><Search className="h-4 w-4 me-2" /> {tt("actionStartInvestigating")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus([r.devId], "RESOLVED", tt("toastPredictionResolved"))}><CheckCircle2 className="h-4 w-4 me-2" /> {tt("actionMarkResolved")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(lp("/alarms"))}><Bell className="h-4 w-4 me-2" /> {tt("createAlarmRule")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus([r.devId], "DISMISSED", tt("predictionIgnoredToast"))}><EyeOff className="h-4 w-4 me-2" /> {tt("ignorePrediction")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---------- Recommendations Tab ----------
  const RecommendationsTab = (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{tt("aiGeneratedActions")}</div>
      <div className="border rounded-md bg-card divide-y">
        {recommendations.length === 0 && <NoData />}
        {recommendations.map(({ row: r, action, impact }) => (
          <div key={r.devId} className={`${ROW_BORDER[r.risk]} p-4 flex flex-col md:flex-row md:items-center gap-3`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.type}</span>
                <Badge className={`${RISK_BADGE[r.risk]} text-[10px]`}>{riskLabel(r.risk)}</Badge>
              </div>
              <p className="text-sm">{action}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span>{r.location || "—"}</span>
                <span>·</span>
                <span className="text-orange-600">{impact}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => openAsset(r)}>
                <Eye className="h-3.5 w-3.5" /> {tt("analysis")}
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setWoSource(toSource(r))}>
                <Wrench className="h-3.5 w-3.5" /> {tt("createWorkOrder")}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => updateStatus([r.devId], "DISMISSED", tt("predictionIgnoredToast"))}>
                <EyeOff className="h-3.5 w-3.5" /> {tt("dismiss")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <UniformPage>
      <PageHeader
        title={tt("forecastTitle")}
        count={ROWS.length || null}
        countLabel={tt("assetsAtRiskLabel")}
      />
      <AiStatusBar />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-transparent border-b rounded-none h-auto p-0 gap-6">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {tt("overviewTab")}
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              <AlertTriangle className="h-3.5 w-3.5" />
              {tt("assetsAtRisk")}
              <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">{formatNumber(ROWS.length)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {tt("recommendationsTab")}
              <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">{formatNumber(recommendations.length)}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{Overview}</TabsContent>
        <TabsContent value="assets">{AssetsTab}</TabsContent>
        <TabsContent value="recommendations">{RecommendationsTab}</TabsContent>
      </Tabs>

      <WorkOrderSheet
        open={!!woSource}
        onOpenChange={(o) => !o && setWoSource(null)}
        source={woSource}
      />
    </UniformPage>
  );
};

export default AIoTForecastFailures;
