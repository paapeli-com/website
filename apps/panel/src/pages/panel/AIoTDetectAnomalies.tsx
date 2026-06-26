import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { PageHeader } from "@/components/PageHeader";
import { LocationCell } from "@/components/panel/LocationCell";
import { SmartPagination } from "@/components/SmartPagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Eye,
  Check,
  X,
  Wrench,
  MoreHorizontal,
  Download,
  Archive,
  Activity,
  Radar,
} from "lucide-react";
import {
  ListToolbar,
  type ActionItem,
  type FilterField,
  type SortOption,
} from "@/components/panel/ListToolbar";
import {
  useAnomalyStore,
  type Anomaly,
  type AnomalySeverity,
  type AnomalyStatus,
} from "@/hooks/useAnomalyStore";
import { WorkOrderSheet } from "@/components/anomalies/WorkOrderSheet";
import { KpiSection } from "@/components/panel/KpiSection";


const SEV_BADGE: Record<AnomalySeverity, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const ROW_BORDER: Record<AnomalySeverity, string> = {
  Critical: "border-s-4 border-red-500",
  High: "border-s-4 border-orange-500",
  Medium: "border-s-4 border-yellow-500",
  Low: "border-s-4 border-blue-400",
};

const STATUS_BADGE: Record<AnomalyStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Acknowledged: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Investigating: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Dismissed: "bg-muted text-muted-foreground",
  "False Positive": "bg-muted text-muted-foreground",
};

const AIoTDetectAnomalies = () => {
  const { language, formatNumber, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const { items, updateStatus } = useAnomalyStore();

  const formatRelative = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("justNow");
    if (m < 60) return t("minAgo").replace("{n}", formatNumber(m));
    const h = Math.floor(m / 60);
    if (h < 24) return t("hoursAgo").replace("{n}", formatNumber(h));
    return t("daysAgo").replace("{n}", formatNumber(Math.floor(h / 24)));
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString(language === "en" ? "en-US" : language) : "—";


  const [tab, setTab] = useState("overview");
  const [sevFilter, setSevFilter] = useState<AnomalySeverity | "all">("all");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sensorFilter, setSensorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("severity");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [woAnomaly, setWoAnomaly] = useState<Anomaly | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openAnomaly = (id: string) => navigate(lp(`/aiot/detect-anomalies/${id}`));

  const active = items.filter((a) =>
    ["Open", "Acknowledged", "Investigating"].includes(a.status),
  );
  const investigated = items.filter((a) =>
    ["Resolved", "Dismissed", "False Positive"].includes(a.status),
  );

  const counts = {
    critical: items.filter((a) => a.severity === "Critical").length,
    high: items.filter((a) => a.severity === "High").length,
    medium: items.filter((a) => a.severity === "Medium").length,
    investigatedToday: investigated.filter(
      (a) => a.resolvedAt && Date.now() - new Date(a.resolvedAt).getTime() < 86_400_000,
    ).length,
  };

  const applyFilters = (list: Anomaly[]) => {
    const rank: Record<AnomalySeverity, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return list
      .filter((a) => {
        if (sevFilter !== "all" && a.severity !== sevFilter) return false;
        if (locFilter !== "all" && !a.location.toLowerCase().includes(locFilter)) return false;
        if (typeFilter !== "all" && a.assetType.toLowerCase() !== typeFilter) return false;
        if (sensorFilter !== "all" && a.sensorType.toLowerCase() !== sensorFilter) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (
          search &&
          !`${a.asset} ${a.devId} ${a.anomaly} ${a.location}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "confidence":
            return b.confidence - a.confidence;
          case "recent":
            return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
          case "severity":
          default:
            return rank[b.severity] - rank[a.severity];
        }
      });
  };

  // ---------- Overview Tab ----------
  const Overview = (
    <div className="space-y-4">
      {/* KPI cards */}
      <KpiSection storageKey="aiot-anomalies">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: t("criticalAnomaliesKpi"), value: counts.critical, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10", targetTab: "active", sev: "Critical" as const },
          { label: t("highSeverityKpi"), value: counts.high, accent: "text-orange-500", bg: "from-orange-50 to-transparent dark:from-orange-500/10", targetTab: "active", sev: "High" as const },
          { label: t("mediumSeverityKpi"), value: counts.medium, accent: "text-yellow-500", bg: "from-yellow-50 to-transparent dark:from-yellow-500/10", targetTab: "active", sev: "Medium" as const },
          { label: t("investigatedTodayKpi"), value: counts.investigatedToday, accent: "text-emerald-500", bg: "from-emerald-50 to-transparent dark:from-emerald-500/10", targetTab: "investigated", sev: "all" as const },
        ]).map((k, i) => (
          <button
            key={i}
            onClick={() => {
              setSevFilter(k.sev);
              setStatusFilter("all");
              setPage(1);
              setTab(k.targetTab);
            }}
            className={`relative text-start rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm bg-gradient-to-br ${k.bg} border-border`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground truncate">{k.label}</span>
              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground leading-none">{formatNumber(k.value)}</span>
              <span className="text-[11px] text-muted-foreground">{t("anomaliesWord")}</span>
            </div>
          </button>
        ))}
      </div>
      </KpiSection>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Needs Investigation */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{t("needsInvestigation")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("needsInvestigationDesc")}
                </p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setTab("active")}>
                {t("viewAll")}
              </Button>
            </div>
            <div className="divide-y border rounded-md">
              {active
                .filter((a) => a.severity === "Critical" || a.severity === "High")
                .slice(0, 5)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openAnomaly(a.id)}
                    className={`${ROW_BORDER[a.severity]} w-full text-start px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{a.asset}</span>
                        <Badge className={`${SEV_BADGE[a.severity]} text-[10px]`}>{a.severity}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{a.anomaly}</div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="text-[10px] text-muted-foreground">{t("detectedLabel")}</div>
                      <div className="text-xs font-medium">{formatRelative(a.detectedAt)}</div>
                    </div>
                    <div className="w-16 shrink-0 text-end">
                      <div className="text-[10px] text-muted-foreground">{t("confidence")}</div>
                      <div className="text-xs font-semibold">{formatNumber(a.confidence)}%</div>
                    </div>
                  </button>
                ))}
              {active.filter((a) => a.severity === "Critical" || a.severity === "High").length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("noHighSeverityNow")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Findings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{t("aiFindings")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("aiFindingsDesc")}
                </p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setTab("active")}>
                {t("viewAll")}
              </Button>
            </div>
            <div className="space-y-2">
              {active.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAnomaly(a.id)}
                  className="w-full text-start border rounded-md p-2.5 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{a.asset}</span>
                    <Badge className={`${SEV_BADGE[a.severity]} text-[10px]`}>{a.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {a.explanation}
                  </p>
                  {a.causes.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {t("possiblePrefix")} {a.causes.slice(0, 2).map((c) => c.label).join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Monitoring Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{t("aiMonitoringSummary")}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("devicesAnalyzed"), value: 312 },
              { label: t("anomaliesDetectedLabel"), value: items.length },
              {
                label: t("averageConfidence"),
                value: items.length
                  ? `${formatNumber(Math.round(items.reduce((s, a) => s + a.confidence, 0) / items.length))}%`
                  : "—",
              },
              { label: t("criticalAssetsLabel"), value: counts.critical },
            ].map((s, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl font-bold mt-1">
                  {typeof s.value === "number" ? formatNumber(s.value) : s.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );


  // ---------- Table renderer ----------
  const renderToolbar = (isInvestigated: boolean) => {
    const filterFields: FilterField[] = [
      {
        key: "sev",
        label: t("severity"),
        value: sevFilter,
        onChange: (v) => setSevFilter(v as any),
        options: [
          { value: "all", label: t("allLocationsFilter").includes("All") ? "All" : "All" },
          { value: "Critical", label: t("riskCriticalShort") },
          { value: "High", label: t("riskHighShort") },
          { value: "Medium", label: t("riskMediumShort") },
          { value: "Low", label: t("riskLowShort") },
        ],
      },
      {
        key: "loc",
        label: t("location"),
        value: locFilter,
        onChange: setLocFilter,
        options: [
          { value: "all", label: "All" },
          { value: "factory a", label: "Factory A" },
          { value: "factory b", label: "Factory B" },
        ],
      },
      {
        key: "type",
        label: t("deviceTypeLabel"),
        value: typeFilter,
        onChange: setTypeFilter,
        options: [
          { value: "all", label: "All" },
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
        key: "sensor",
        label: t("sensorTypeLabel"),
        value: sensorFilter,
        onChange: setSensorFilter,
        options: [
          { value: "all", label: "All" },
          { value: "vibration", label: "Vibration" },
          { value: "temperature", label: "Temperature" },
          { value: "pressure", label: "Pressure" },
          { value: "flow", label: "Flow" },
          { value: "current", label: "Current" },
          { value: "speed", label: "Speed" },
          { value: "position", label: "Position" },
        ],
      },
      {
        key: "status",
        label: t("status"),
        value: statusFilter,
        onChange: setStatusFilter,
        options: isInvestigated
          ? [
              { value: "all", label: "All" },
              { value: "Resolved", label: t("chipResolved") },
              { value: "Dismissed", label: t("chipDismissed") },
              { value: "False Positive", label: t("chipFalsePositive") },
            ]
          : [
              { value: "all", label: "All" },
              { value: "Open", label: t("chipOpen") },
              { value: "Acknowledged", label: t("acknowledged") },
              { value: "Investigating", label: t("chipInvestigating") },
            ],
      },
    ];
    const sortOptions: SortOption[] = [
      { key: "severity", label: t("sortHighestSeverity") },
      { key: "confidence", label: t("sortHighestConfidence") },
      { key: "recent", label: t("sortMostRecent") },
    ];
    const handleExport = () => {
      const list = isInvestigated ? investigated : active;
      const header = ["asset", "devId", "anomaly", "severity", "status", "confidence", "detectedAt", "location"];
      const csv = [
        header.join(","),
        ...list.map((r) =>
          header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anomalies-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const actionItems: ActionItem[] = [
      { key: "export", label: t("exportCsv"), icon: Download, onSelect: handleExport },
      { key: "archive", label: t("archive"), icon: Archive, comingSoon: true },
    ];
    const activeFilterCount = [sevFilter, locFilter, typeFilter, sensorFilter, statusFilter].filter(
      (v) => v !== "all",
    ).length;

    return (
      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: t("searchAnomaliesPh") }}
        view={{ value: listView, onChange: setListView, available: ["table"] }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        filter={{
          fields: filterFields,
          activeCount: activeFilterCount,
          onClear: () => {
            setSevFilter("all");
            setLocFilter("all");
            setTypeFilter("all");
            setSensorFilter("all");
            setStatusFilter("all");
          },
        }}
        sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
        actions={actionItems}
      />
    );
  };


  const renderTable = (rows: Anomaly[], isInvestigated: boolean) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const slice = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

    return (
      <>
        <div className="overflow-x-auto border rounded-md bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t("colAsset")}</th>
                <th className="px-3 py-2 text-start font-medium hidden md:table-cell">{t("colLocation")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colAnomaly")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("colSeverity")}</th>
                {isInvestigated ? (
                  <>
                    <th className="px-3 py-2 text-start font-medium">{t("colResolved")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("colResolution")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("colResolvedBy")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-start font-medium">{t("colDetected")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("colConfidence")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("colStatus")}</th>
                  </>
                )}
                <th className="px-3 py-2 text-end font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr>
                  <td colSpan={isInvestigated ? 8 : 8} className="px-3 py-12 text-center">
                    <p className="font-medium">{t("noAnomaliesFound")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("tryAdjustingFilters")}</p>
                  </td>
                </tr>
              )}

              {slice.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openAnomaly(r.id)}
                  className={`${ROW_BORDER[r.severity]} border-b hover:bg-muted/40 cursor-pointer`}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{r.asset}</div>
                    <div className="text-xs text-muted-foreground">{r.devId} · {r.assetType}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <LocationCell path={r.location} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-sm">{r.anomaly}</div>
                    <div className="text-[11px] text-muted-foreground">{r.sensorType}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={`${SEV_BADGE[r.severity]} text-[10px]`}>{r.severity}</Badge>
                  </td>
                  {isInvestigated ? (
                    <>
                      <td className="px-3 py-2.5 text-xs">{formatDate(r.resolvedAt)}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${STATUS_BADGE[r.status]} text-[10px]`}>
                          {r.resolutionType || r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{r.resolvedBy || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-xs">{formatRelative(r.detectedAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={r.confidence} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium w-9 text-end">
                            {formatNumber(r.confidence)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${STATUS_BADGE[r.status]} text-[10px]`}>{r.status}</Badge>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs"
                        onClick={() => openAnomaly(r.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> {t("view")}
                      </Button>
                      {!isInvestigated && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAnomaly(r.id)}>
                              <Eye className="h-4 w-4 me-2" /> {t("viewAnalysis")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                updateStatus(r.id, "Acknowledged");
                                toast({ title: t("acknowledgedToast"), description: r.asset });
                              }}
                            >
                              <Check className="h-4 w-4 me-2" /> {t("acknowledge")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                updateStatus(r.id, "Dismissed");
                                toast({ title: t("dismissedToast"), description: r.asset });
                              }}
                            >
                              <X className="h-4 w-4 me-2" /> {t("dismiss")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWoAnomaly(r)}>
                              <Wrench className="h-4 w-4 me-2" /> {t("createWorkOrder")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end mt-3">
            <SmartPagination currentPage={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </>
    );
  };

  const ActiveTab = (
    <div className="space-y-3">
      {renderToolbar(false)}
      {renderTable(applyFilters(active), false)}
    </div>
  );

  const InvestigatedTab = (
    <div className="space-y-3">
      {renderToolbar(true)}
      {renderTable(applyFilters(investigated), true)}
    </div>
  );

  return (
    <PanelLayout pageTitle={t("detectAnomalies")}>
      <PageHeader
        title={t("detectAnomalies")}
        count={items.length}
        countLabel={t("anomaliesWord")}
      />

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
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("activeAnomalies")}
              <Badge
                variant="secondary"
                className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none"
              >
                {formatNumber(active.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="investigated"
              className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0"
            >
              {t("investigatedTab")}
              <Badge
                variant="secondary"
                className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none"
              >
                {formatNumber(investigated.length)}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="overview">{Overview}</TabsContent>
        <TabsContent value="active">{ActiveTab}</TabsContent>
        <TabsContent value="investigated">{InvestigatedTab}</TabsContent>
      </Tabs>

      <WorkOrderSheet
        open={!!woAnomaly}
        onOpenChange={(o) => !o && setWoAnomaly(null)}
        anomaly={woAnomaly}
      />
    </PanelLayout>
  );
};

export default AIoTDetectAnomalies;
