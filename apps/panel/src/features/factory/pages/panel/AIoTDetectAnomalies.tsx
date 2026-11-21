import { CropContextChip } from "@/features/greenhouse/components/CropContext";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useNavigate } from "react-router-dom";
import type { AiAnomaly, AiAnomalyStatus } from "@paapeli/api";
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
  AlertTriangle,
  Eye,
  Check,
  X,
  Wrench,
  MoreHorizontal,
  Download,
  Activity,
  Radar,
} from "lucide-react";
import {
  ListToolbar,
  type ActionItem,
  type FilterField,
  type SortOption,
} from "@/features/factory/components/panel/ListToolbar";
import { WorkOrderSheet, type WorkOrderSource } from "@/features/factory/components/anomalies/WorkOrderSheet";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiAnomalies, useAiStatus } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import { AiStatusBar } from "@/features/factory/components/ai/AiStatusBar";
import {
  ACTIVE_ANOMALY,
  ANOMALY_STATUS_KEY,
  RISK_BADGE as SEV_BADGE,
  RISK_RANK,
  ROW_BORDER,
  STATUS_BADGE,
  optionsOf,
  useLocationPath,
  type Risk,
} from "@/features/factory/components/ai/aiShared";

const AIoTDetectAnomalies = () => {
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();
  const anomalies = useAiAnomalies();
  const status = useAiStatus();
  const { setAnomalyStatus } = useAiActions();

  const items = useMemo(
    () => (anomalies.data ?? []).map((a) => ({ ...a, location: pathOf(a.assetId), title: ai.kind(a.kind) })),
    [anomalies.data, pathOf, ai],
  );
  type Item = (typeof items)[number];

  const formatRelative = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("justNow");
    if (m < 60) return t("minAgo").replace("{n}", formatNumber(m));
    const h = Math.floor(m / 60);
    if (h < 24) return t("hoursAgo").replace("{n}", formatNumber(h));
    return t("daysAgo").replace("{n}", formatNumber(Math.floor(h / 24)));
  };
  const statusLabel = (s: AiAnomalyStatus) => tt(ANOMALY_STATUS_KEY[s]);

  const [tab, setTab] = useState("overview");
  const [sevFilter, setSevFilter] = useState<Risk | "all">("all");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sensorFilter, setSensorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("severity");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [woAnomaly, setWoAnomaly] = useState<Item | null>(null);

  const openAnomaly = (id: string) => navigate(lp(`/aiot/detect-anomalies/${id}`));

  const changeStatus = (a: AiAnomaly, next: AiAnomalyStatus, label: string) =>
    setAnomalyStatus.mutate(
      { id: a.id, status: next },
      {
        onSuccess: () => toast({ title: label, description: a.deviceName }),
        onError: (e) => toast({ title: label, description: apiErrorMessage(e, label), variant: "destructive" }),
      },
    );

  const active = items.filter((a) => ACTIVE_ANOMALY.includes(a.status));
  const investigated = items.filter((a) => !ACTIVE_ANOMALY.includes(a.status));

  const counts = {
    critical: active.filter((a) => a.severity === "Critical").length,
    high: active.filter((a) => a.severity === "High").length,
    medium: active.filter((a) => a.severity === "Medium").length,
    investigatedToday: investigated.filter(
      (a) => a.statusChangedAt && Date.now() - new Date(a.statusChangedAt).getTime() < 86_400_000,
    ).length,
  };

  const applyFilters = (list: Item[]) =>
    list
      .filter((a) => {
        if (sevFilter !== "all" && a.severity !== sevFilter) return false;
        if (locFilter !== "all" && a.location !== locFilter) return false;
        if (typeFilter !== "all" && a.deviceType !== typeFilter) return false;
        if (sensorFilter !== "all" && a.category !== sensorFilter) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (search && !`${a.deviceName} ${a.key} ${a.title} ${a.location}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "confidence":
            return b.confidence - a.confidence;
          case "recent":
            return new Date(b.peakAt).getTime() - new Date(a.peakAt).getTime();
          case "severity":
          default:
            return RISK_RANK[b.severity] - RISK_RANK[a.severity] || new Date(b.peakAt).getTime() - new Date(a.peakAt).getTime();
        }
      });

  const toSource = (a: Item): WorkOrderSource => ({
    id: a.id,
    asset: a.deviceName,
    devId: a.deviceId,
    location: a.location,
    severity: a.severity,
    suggestedActions: a.actions.map(ai.action),
    fallbackAction: ai.action("VERIFY_SENSOR_READING"),
    kind: "anomaly",
    deviceId: a.deviceId,
    assetId: a.assetId,
  });

  const avgConfidence = items.length ? Math.round(items.reduce((s, a) => s + a.confidence, 0) / items.length) : null;

  // ---------- Overview Tab ----------
  const Overview = (
    <div className="space-y-4">
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
              <span className="text-xl font-bold text-foreground leading-none">
                {items.length === 0 ? <NoDataValue /> : formatNumber(k.value)}
              </span>
              {items.length > 0 && <span className="text-[11px] text-muted-foreground">{t("anomaliesWord")}</span>}
            </div>
          </button>
        ))}
      </div>
      </KpiSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{t("needsInvestigation")}</h3>
                <p className="text-xs text-muted-foreground">{t("needsInvestigationDesc")}</p>
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
                        <span className="font-medium text-sm truncate">{a.deviceName}</span>
                        <Badge className={`${SEV_BADGE[a.severity]} text-[10px]`}>{a.severity}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{a.title} · {a.key}</div>
                      <CropContextChip deviceId={a.deviceId} />
                    </div>
                    <div className="text-end shrink-0">
                      <div className="text-[10px] text-muted-foreground">{t("detectedLabel")}</div>
                      <div className="text-xs font-medium">{formatRelative(a.peakAt)}</div>
                    </div>
                    <div className="w-16 shrink-0 text-end">
                      <div className="text-[10px] text-muted-foreground">{t("confidence")}</div>
                      <div className="text-xs font-semibold">{formatNumber(a.confidence)}%</div>
                    </div>
                  </button>
                ))}
              {active.filter((a) => a.severity === "Critical" || a.severity === "High").length === 0 && (
                items.length === 0 ? <NoData size="sm" /> : (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">{t("noHighSeverityNow")}</div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{t("aiFindings")}</h3>
                <p className="text-xs text-muted-foreground">{t("aiFindingsDesc")}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setTab("active")}>
                {t("viewAll")}
              </Button>
            </div>
            <div className="space-y-2">
              {active.length === 0 && <NoData size="sm" />}
              {active.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAnomaly(a.id)}
                  className="w-full text-start border rounded-md p-2.5 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{a.deviceName}</span>
                    <Badge className={`${SEV_BADGE[a.severity]} text-[10px]`}>{a.severity}</Badge>
                  </div>
                  <CropContextChip deviceId={a.deviceId} className="mb-1" />
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{ai.anomalyText(a).explanation}</p>
                  {a.causes.length > 1 && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {t("possiblePrefix")} {a.causes.slice(0, 2).map((c) => c.key).join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{t("aiMonitoringSummary")}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { label: t("devicesAnalyzed"), value: status.data?.lastRunAt ? status.data.devicesAnalyzed : null },
              { label: t("anomaliesDetectedLabel"), value: items.length || null },
              { label: t("averageConfidence"), value: avgConfidence === null ? null : `${formatNumber(avgConfidence)}%` },
              { label: t("criticalAssetsLabel"), value: items.length ? new Set(active.filter((a) => a.severity === "Critical").map((a) => a.deviceId)).size : null },
            ] as { label: string; value: number | string | null }[]).map((s, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl font-bold mt-1">
                  {s.value === null ? <NoDataValue /> : typeof s.value === "number" ? formatNumber(s.value) : s.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderToolbar = (isInvestigated: boolean) => {
    const pool = isInvestigated ? investigated : active;
    const filterFields: FilterField[] = [
      {
        key: "sev",
        label: t("severity"),
        value: sevFilter,
        onChange: (v) => setSevFilter(v as Risk | "all"),
        options: [
          { value: "all", label: tt("all") },
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
        options: [{ value: "all", label: tt("all") }, ...optionsOf(items.map((a) => a.location)).map((l) => ({ value: l, label: l }))],
      },
      {
        key: "type",
        label: t("deviceTypeLabel"),
        value: typeFilter,
        onChange: setTypeFilter,
        options: [{ value: "all", label: tt("all") }, ...optionsOf(items.map((a) => a.deviceType)).map((v) => ({ value: v, label: v }))],
      },
      {
        key: "sensor",
        label: t("sensorTypeLabel"),
        value: sensorFilter,
        onChange: setSensorFilter,
        options: [{ value: "all", label: tt("all") }, ...optionsOf(items.map((a) => a.category)).map((c) => ({ value: c, label: ai.category(c) }))],
      },
      {
        key: "status",
        label: t("status"),
        value: statusFilter,
        onChange: setStatusFilter,
        options: [
          { value: "all", label: tt("all") },
          ...(isInvestigated
            ? (["RESOLVED", "DISMISSED", "FALSE_POSITIVE"] as AiAnomalyStatus[])
            : ACTIVE_ANOMALY
          ).map((s) => ({ value: s, label: statusLabel(s) })),
        ],
      },
    ];
    const sortOptions: SortOption[] = [
      { key: "severity", label: t("sortHighestSeverity") },
      { key: "confidence", label: t("sortHighestConfidence") },
      { key: "recent", label: t("sortMostRecent") },
    ];
    const handleExport = () => {
      const header = ["device", "key", "kind", "severity", "status", "confidence", "peakAt", "peakValue", "expectedValue", "location"];
      const rows = applyFilters(pool).map((a) => [a.deviceName, a.key, a.kind, a.severity, a.status, a.confidence, a.peakAt, a.peakValue, a.expectedValue ?? "", a.location]);
      const csv = [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `anomalies-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };
    const actionItems: ActionItem[] = [{ key: "export", label: t("exportCsv"), icon: Download, onSelect: handleExport }];
    const activeFilterCount = [sevFilter, locFilter, typeFilter, sensorFilter, statusFilter].filter((v) => v !== "all").length;

    return (
      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: t("searchAnomaliesPh") }}
        view={{ value: listView, onChange: setListView, available: ["table"] }}
        onRefresh={() => anomalies.refetch()}
        isRefreshing={anomalies.isFetching}
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

  const renderTable = (rows: Item[], isInvestigated: boolean) => {
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
                  <td colSpan={8} className="px-3 py-12 text-center">
                    {items.length === 0 ? <NoData /> : (
                      <>
                        <p className="font-medium">{t("noAnomaliesFound")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("tryAdjustingFilters")}</p>
                      </>
                    )}
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
                    <div className="font-medium">{r.deviceName}</div>
                    <div className="text-xs text-muted-foreground">{r.deviceType}</div>
                    <CropContextChip deviceId={r.deviceId} />
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {r.location ? <LocationCell path={r.location} /> : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-sm">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">{r.key} · {ai.category(r.category)}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={`${SEV_BADGE[r.severity]} text-[10px]`}>{r.severity}</Badge>
                  </td>
                  {isInvestigated ? (
                    <>
                      <td className="px-3 py-2.5 text-xs">{formatDateTime(r.statusChangedAt, language)}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${STATUS_BADGE[r.status]} text-[10px]`}>{statusLabel(r.status)}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{r.statusChangedByName || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-xs">{formatRelative(r.peakAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={r.confidence} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium w-9 text-end">{formatNumber(r.confidence)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${STATUS_BADGE[r.status]} text-[10px]`}>{statusLabel(r.status)}</Badge>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openAnomaly(r.id)}>
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
                            <DropdownMenuItem onClick={() => changeStatus(r, "ACKNOWLEDGED", t("acknowledgedToast"))}>
                              <Check className="h-4 w-4 me-2" /> {t("acknowledge")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(r, "DISMISSED", t("dismissedToast"))}>
                              <X className="h-4 w-4 me-2" /> {t("dismiss")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(r, "FALSE_POSITIVE", t("chipFalsePositive"))}>
                              <X className="h-4 w-4 me-2" /> {t("chipFalsePositive")}
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

  return (
    <UniformPage>
      <PageHeader title={t("detectAnomalies")} count={active.length || null} countLabel={t("anomaliesWord")} />
      <AiStatusBar />

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
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              <Activity className="h-3.5 w-3.5" />
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("activeAnomalies")}
              <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">
                {formatNumber(active.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="investigated" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none pb-2 px-0">
              {t("investigatedTab")}
              <Badge variant="secondary" className="ms-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] leading-none">
                {formatNumber(investigated.length)}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{Overview}</TabsContent>
        <TabsContent value="active">
          <div className="space-y-3">
            {renderToolbar(false)}
            {renderTable(applyFilters(active), false)}
          </div>
        </TabsContent>
        <TabsContent value="investigated">
          <div className="space-y-3">
            {renderToolbar(true)}
            {renderTable(applyFilters(investigated), true)}
          </div>
        </TabsContent>
      </Tabs>

      <WorkOrderSheet
        open={!!woAnomaly}
        onOpenChange={(o) => !o && setWoAnomaly(null)}
        source={woAnomaly ? toSource(woAnomaly) : null}
        onCreated={() => {
          if (woAnomaly && woAnomaly.status === "OPEN") changeStatus(woAnomaly, "INVESTIGATING", t("investigationStarted"));
        }}
      />
    </UniformPage>
  );
};

export default AIoTDetectAnomalies;
