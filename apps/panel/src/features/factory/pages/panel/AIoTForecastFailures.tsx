import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { PageHeader } from "@/features/factory/components/PageHeader";
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
  Archive,
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
import {
  FORECAST_ASSETS,
  RISK_BADGE,
  ROW_BORDER,
  type ForecastAsset,
  type ForecastRisk,
} from "@/features/factory/data/forecastAssets";
import {
  useForecastStore,
  FORECAST_STATUS_BADGE,
  type ForecastStatus,
} from "@/features/factory/hooks/useForecastStore";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";

interface Recommendation {
  asset: string;
  devId: string;
  action: string;
  priority: ForecastRisk;
  impact: string;
  location: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  { asset: "Pump P101", devId: "DEV-101", action: "Inspect bearing — abnormal vibration signature detected", priority: "Critical", impact: "Reduce failure risk by 45%", location: "Factory A > Sulfonation > Line 1" },
  { asset: "Boiler Pump BP-2", devId: "DEV-810", action: "Check suction pressure to prevent cavitation damage", priority: "Critical", impact: "Avoid 12h unplanned downtime", location: "Factory A > Boiler > Line 1" },
  { asset: "Compressor C3", devId: "DEV-205", action: "Lubricate shaft and re-balance rotor", priority: "High", impact: "Reduce vibration by 25%", location: "Factory A > Sulfonation > Line 2" },
  { asset: "Motor M12", devId: "DEV-322", action: "Schedule cooling system inspection", priority: "High", impact: "Stabilize operating temperature", location: "Factory B > Processing > Line 1" },
  { asset: "Heat Exchanger HX-7", devId: "DEV-705", action: "Plan chemical cleaning cycle for fouled tubes", priority: "High", impact: "Restore 8% efficiency", location: "Factory B > Processing > Line 2" },
  { asset: "Furnace Fan F2", devId: "DEV-411", action: "Inspect electrical supply for current spikes", priority: "Medium", impact: "Prevent winding damage", location: "Factory A > Furnace > Line 3" },
];

const toSource = (r: ForecastAsset): WorkOrderSource => ({
  id: r.devId,
  asset: r.id,
  devId: r.devId,
  location: r.location,
  severity: r.risk,
  suggestedActions: r.recommendedActions,
  fallbackAction: `Inspect ${r.cause.toLowerCase()}`,
  kind: "forecast",
});

const AIoTForecastFailures = () => {
  const navigate = useNavigate();
  const { language, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { getStatus, setStatus } = useForecastStore();
  const tt = t as (k: string) => string;
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const riskLabel = (r: ForecastRisk): string => {
    const map: Record<ForecastRisk, string> = {
      Critical: tt("riskCriticalShort"),
      High: tt("riskHighShort"),
      Medium: tt("riskMediumShort"),
      Low: tt("riskLowShort"),
    };
    return map[r] || r;
  };

  const ROWS = FORECAST_ASSETS;

  const [tab, setTab] = useState("overview");
  const [riskFilter, setRiskFilter] = useState<ForecastRisk | "all">("all");
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeWindow, setTimeWindow] = useState("30d");
  const [sortKey, setSortKey] = useState("highestRisk");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [woSource, setWoSource] = useState<WorkOrderSource | null>(null);
  const [statusFilter, setStatusFilter] = useState<ForecastStatus | "all">("all");

  const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 500); };

  const statusLabel = (s: ForecastStatus) =>
    ({ Open: tt("fcStatusOpen"), Acknowledged: tt("fcStatusAcknowledged"), Investigating: tt("fcStatusInvestigating"), Resolved: tt("fcStatusResolved"), Dismissed: tt("fcStatusDismissed") } as Record<ForecastStatus, string>)[s];

  const updateStatus = (devId: string, next: ForecastStatus, label?: string) => {
    setStatus(devId, next);
    toast({ title: label ?? statusLabel(next), description: devId });
  };


  const filtered = useMemo(() => {
    const rank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return ROWS.filter((r) => {
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (locFilter !== "all" && !r.location.toLowerCase().includes(locFilter)) return false;
      if (typeFilter !== "all" && r.type.toLowerCase() !== typeFilter) return false;
      if (statusFilter !== "all" && getStatus(r.devId) !== statusFilter) return false;
      if (search && !`${r.id} ${r.devId} ${r.location} ${r.cause}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      switch (sortKey) {
        case "lowestHealth": return a.health - b.health;
        case "shortestRUL": return a.rulDays - b.rulDays;
        case "highestRisk":
        default: return (rank[b.risk] || 0) - (rank[a.risk] || 0);
      }
    });
  }, [ROWS, riskFilter, locFilter, typeFilter, statusFilter, search, sortKey, getStatus]);

  const counts = useMemo(() => ({
    critical: ROWS.filter((r) => r.risk === "Critical").length,
    high: ROWS.filter((r) => r.risk === "High").length,
    medium: ROWS.filter((r) => r.risk === "Medium").length,
    low: ROWS.filter((r) => r.risk === "Low").length,
  }), [ROWS]);

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.devId)));
  };

  const openAsset = (r: ForecastAsset) => {
    navigate(lp(`/aiot/forecast-failures/${r.devId}`));
  };

  const goAssetsTabFiltered = (r: ForecastRisk | "all") => {
    setRiskFilter(r);
    setTab("assets");
  };

  // ---------- Overview Tab ----------
  const Overview = (
    <div className="space-y-4">
      <KpiSection storageKey="aiot-forecast">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: "Critical" as ForecastRisk, label: tt("riskCritical"), value: counts.critical, icon: AlertTriangle, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
          { key: "High" as ForecastRisk, label: tt("riskHigh"), value: counts.high, icon: AlertTriangle, accent: "text-orange-500", bg: "from-orange-50 to-transparent dark:from-orange-500/10" },
          { key: "Medium" as ForecastRisk, label: tt("riskMedium"), value: counts.medium, icon: AlertTriangle, accent: "text-yellow-500", bg: "from-yellow-50 to-transparent dark:from-yellow-500/10" },
          { key: "Low" as ForecastRisk, label: tt("riskLow"), value: counts.low, icon: AlertTriangle, accent: "text-blue-500", bg: "from-blue-50 to-transparent dark:from-blue-500/10" },
        ]).map((k) => {
          const Icon = k.icon;
          const isActive = riskFilter === k.key && tab === "assets";
          return (
            <button
              key={k.key}
              onClick={() => goAssetsTabFiltered(k.key)}
              className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} ${isActive ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground leading-none">{formatNumber(k.value)}</span>
                <span className="text-[11px] text-muted-foreground">{tt("assetsWord")}</span>
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
              {ROWS.filter((r) => r.risk === "Critical" || r.risk === "High").slice(0, 5).map((r) => (
                <button
                  key={r.devId}
                  onClick={() => openAsset(r)}
                  className={`${ROW_BORDER[r.risk]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{r.id}</span>
                      <Badge className={`${RISK_BADGE[r.risk]} text-[10px]`}>{riskLabel(r.risk)}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.devId} · {r.type} · {r.location}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-xs text-muted-foreground">{tt("rul")}</div>
                    <div className="text-sm font-semibold">{formatNumber(r.rulDays)}{tt("daysShort")}</div>
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
              {RECOMMENDATIONS.slice(0, 4).map((r, i) => (
                <div key={i} className="border rounded-md p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{r.asset}</span>
                    <Badge className={`${RISK_BADGE[r.priority]} text-[10px]`}>{riskLabel(r.priority)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{r.action}</p>
                </div>
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
            onChange: (v) => setRiskFilter(v as any),
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
            options: [
              { value: "all", label: tt("all") },
              { value: "factory a", label: "Factory A" },
              { value: "factory b", label: "Factory B" },
            ],
          },
          {
            key: "assetType", label: tt("assetType"), value: typeFilter, onChange: setTypeFilter,
            options: [
              { value: "all", label: tt("all") },
              { value: "pump", label: "Pump" },
              { value: "motor", label: "Motor" },
              { value: "compressor", label: "Compressor" },
              { value: "fan", label: "Fan" },
              { value: "conveyor", label: "Conveyor" },
              { value: "valve", label: "Valve" },
              { value: "heat exchanger", label: "Heat Exchanger" },
            ],
          },
          {
            key: "status", label: tt("statusLabelGeneric"), value: statusFilter,
            onChange: (v) => setStatusFilter(v as ForecastStatus | "all"),
            options: [
              { value: "all", label: tt("all") },
              { value: "Open", label: tt("fcStatusOpen") },
              { value: "Acknowledged", label: tt("fcStatusAcknowledged") },
              { value: "Investigating", label: tt("fcStatusInvestigating") },
              { value: "Resolved", label: tt("fcStatusResolved") },
              { value: "Dismissed", label: tt("fcStatusDismissed") },
            ],
          },

          {
            key: "timeWindow", label: tt("timeWindow"), value: timeWindow, onChange: setTimeWindow,
            options: [
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
              { value: "90d", label: "90d" },
            ],
          },
        ];
        const sortOptions: SortOption[] = [
          { key: "highestRisk", label: tt("sortHighestRisk") },
          { key: "lowestHealth", label: tt("sortLowestHealth") },
          { key: "shortestRUL", label: tt("sortShortestRUL") },
        ];
        const handleExport = () => {
          const header = ["id", "devId", "location", "type", "risk", "cause"];
          const csv = [header.join(","), ...filtered.map((r) => header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `forecast-${Date.now()}.csv`; a.click();
          URL.revokeObjectURL(url);
        };
        const actionItems: ActionItem[] = [
          { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
          { key: "archive", label: tt("archive"), icon: Archive, comingSoon: true },
        ];
        const activeFilterCount = [riskFilter, locFilter, typeFilter, statusFilter].filter((v) => v !== "all").length;
        return (
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: tt("searchAssetsPlaceholder") }}
            view={{ value: listView, onChange: setListView, available: ["table"] }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setRiskFilter("all"); setLocFilter("all"); setTypeFilter("all"); setStatusFilter("all"); } }}
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
            <Button size="sm" variant="outline" className="h-8">{tt("createWorkOrders")}</Button>
            <Button size="sm" variant="outline" className="h-8">{tt("assign")}</Button>
            <Button size="sm" variant="outline" className="h-8">{tt("ignorePredictions")}</Button>
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
                  <p className="font-medium">{tt("noPredictedFailures")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tt("tryAdjustingFilters")}</p>
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
                      v ? s.add(r.devId) : s.delete(r.devId);
                      setSelected(s);
                    }}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{r.id}</div>
                  <div className="text-xs text-muted-foreground">{r.devId} · {r.type}</div>
                </td>
                <td className="px-3 py-2.5"><LocationCell path={r.location} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Progress value={r.health} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium w-9 text-end">{formatNumber(r.health)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5"><Badge className={`${RISK_BADGE[r.risk]} text-[10px]`}>{riskLabel(r.risk)}</Badge></td>
                <td className="px-3 py-2.5 text-xs">{r.date}</td>
                <td className="px-3 py-2.5 text-xs font-medium">{formatNumber(r.rulDays)} {tt("days")}</td>
                <td className="px-3 py-2.5">
                  {(() => {
                    const st = getStatus(r.devId);
                    return (
                      <Badge className={`${FORECAST_STATUS_BADGE[st]} text-[10px]`}>{statusLabel(st)}</Badge>
                    );
                  })()}
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
                        <DropdownMenuItem onClick={() => updateStatus(r.devId, "Acknowledged", tt("toastPredictionAcknowledged"))}><Check className="h-4 w-4 me-2" /> {tt("actionAcknowledgeMenu")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r.devId, "Investigating", tt("toastInvestigationStarted"))}><Search className="h-4 w-4 me-2" /> {tt("actionStartInvestigating")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r.devId, "Resolved", tt("toastPredictionResolved"))}><CheckCircle2 className="h-4 w-4 me-2" /> {tt("actionMarkResolved")}</DropdownMenuItem>
                        <DropdownMenuItem><Bell className="h-4 w-4 me-2" /> {tt("createAlarmRule")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r.devId, "Dismissed", tt("predictionIgnoredToast"))}><EyeOff className="h-4 w-4 me-2" /> {tt("ignorePrediction")}</DropdownMenuItem>

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
        {RECOMMENDATIONS.map((r, i) => {
          const asset = ROWS.find((a) => a.devId === r.devId);
          return (
            <div key={i} className={`${ROW_BORDER[r.priority]} p-4 flex flex-col md:flex-row md:items-center gap-3`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.asset}</span>
                  <span className="text-xs text-muted-foreground">{r.devId}</span>
                  <Badge className={`${RISK_BADGE[r.priority]} text-[10px]`}>{riskLabel(r.priority)}</Badge>
                </div>
                <p className="text-sm">{r.action}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>{r.location}</span>
                  <span>·</span>
                  <span className="text-emerald-600">{tt("expectedImpact")}: {r.impact}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {asset && (
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => openAsset(asset)}>
                    <Eye className="h-3.5 w-3.5" /> {tt("analysis")}
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => asset && setWoSource(toSource(asset))}
                  disabled={!asset}
                >
                  <Wrench className="h-3.5 w-3.5" /> {tt("createWorkOrder")}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5">
                  <EyeOff className="h-3.5 w-3.5" /> {tt("dismiss")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title={tt("forecastTitle")}
        count={ROWS.length}
        countLabel={tt("assetsAtRiskLabel")}
      />

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
              <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">{formatNumber(RECOMMENDATIONS.length)}</Badge>
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
    </>
  );
};

export default AIoTForecastFailures;
