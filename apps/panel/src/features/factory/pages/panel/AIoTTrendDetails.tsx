import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AiTrend } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { HomeCrumb } from "@/shell/HomeCrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  ChevronLeft,
  AlertTriangle,
  TrendingUp,
  Minus,
  Sparkles,
  Download,
  GitCompare,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Undo2,
  Loader2,
} from "lucide-react";
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { formatDateTime } from "@/shared/lib/formatDate";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiCompletedActions, useAiTrend, useAiTrends } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import { DIRECTION_BADGE, useLocationPath } from "@/features/factory/components/ai/aiShared";

const AIoTTrendDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const ai = useAiText();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();

  const { data: trend, isLoading } = useAiTrend(id);
  const allTrends = useAiTrends();
  const completed = useAiCompletedActions("TREND", id);
  const { toggleAction } = useAiActions();
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareId, setCompareId] = useState<string>("");

  /* The band is the projection's 10th..90th percentile, drawn as the high
     edge with the low edge painted over it in the page colour. */
  const series = useMemo(
    () =>
      (trend?.series ?? []).map((p) => ({
        t: formatDateTime(p.ts, language),
        actual: p.actual ?? undefined,
        projected: p.projected ?? undefined,
        bandHigh: p.projectedHigh ?? undefined,
        bandLow: p.projectedLow ?? undefined,
        baseline: trend?.baseline,
      })),
    [trend, language],
  );
  const now = useMemo(() => {
    const last = (trend?.series ?? []).filter((p) => p.actual != null).pop();
    return last ? formatDateTime(last.ts, language) : undefined;
  }, [trend, language]);

  const candidates = useMemo(
    () => (allTrends.data ?? []).filter((x) => trend && x.id !== trend.id && x.window === trend.window),
    [allTrends.data, trend],
  );
  const compareTrend = candidates.find((x) => x.id === compareId);
  /* Compared as percent of each one's own starting level, on shared timestamps. */
  const mergedCompare = useMemo(() => {
    if (!trend || !compareTrend) return [];
    const normalise = (x: AiTrend) => {
      const first = x.series.find((p) => p.actual != null)?.actual ?? 0;
      const scale = Math.abs(first) > 1e-9 ? Math.abs(first) : 1;
      return new Map(
        x.series.map((p) => {
          const v = p.actual ?? p.projected;
          return [p.ts, v == null ? undefined : ((v - first) / scale) * 100];
        }),
      );
    };
    const a = normalise(trend);
    const b = normalise(compareTrend);
    const stamps = Array.from(new Set([...a.keys(), ...b.keys()])).sort((x, y) => x - y);
    return stamps.map((ts) => ({ t: formatDateTime(ts, language), a: a.get(ts), b: b.get(ts) }));
  }, [trend, compareTrend, language]);

  if (isLoading) {
    return (
      <UniformPage>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </UniformPage>
    );
  }

  if (!trend) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("trendNotFound")}</p>
        <Button variant="link" onClick={() => navigate(lp("/aiot/analyze-trends"))} className="mt-2">
          {t("backToAnalyzeTrends")}
        </Button>
      </div>
    );
  }

  const location = pathOf(trend.assetId);
  const done = new Set((completed.data ?? []).map((c) => c.code));
  const title = `${trend.key} · ${ai.category(trend.category)}`;

  const handleExport = () => {
    const headers = ["timestamp", "actual", "projected", "projectedLow", "projectedHigh"];
    const rows = trend.series.map((r) =>
      [new Date(r.ts).toISOString(), r.actual ?? "", r.projected ?? "", r.projectedLow ?? "", r.projectedHigh ?? ""].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trend-${trend.deviceName}-${trend.key}-${trend.window}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t("trendExportedToast"), description: `${title} · CSV` });
  };

  const openCompare = () => {
    if (!compareId && candidates[0]) setCompareId(candidates[0].id);
    setCompareOpen(true);
  };

  const toggle = (code: string, isDone: boolean) =>
    toggleAction.mutate(
      { kind: "TREND", sourceId: trend.id, code, done: !isDone },
      {
        onSuccess: () => toast({ title: isDone ? t("actionUndone") : t("actionAcknowledgedToast"), description: ai.action(code) }),
        onError: (e) => toast({ title: ai.action(code), description: apiErrorMessage(e, ai.action(code)), variant: "destructive" }),
      },
    );

  const dirLabel = (d: string) =>
    d === "Increasing" ? t("increasingDir") : d === "Decreasing" ? t("decreasingDir") : t("stableDir");
  const DirIcon = trend.direction === "Increasing" ? ArrowUpRight : trend.direction === "Decreasing" ? ArrowDownRight : Minus;
  const dirTone =
    trend.direction === "Increasing" ? "text-red-600" : trend.direction === "Decreasing" ? "text-blue-600" : "text-muted-foreground";

  return (
    <UniformPage>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <HomeCrumb />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/analyze-trends"))} className="cursor-pointer">
                {t("analyzeTrendsLabel")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/analyze-trends?tab=explorer"))} className="cursor-pointer">
                {t("trendsExplorer")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title} {t("trendBreadcrumb")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/aiot/analyze-trends"))}>
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {trend.deviceName} · {trend.deviceType} · {location || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ai.windowLabel(trend.window)}</Badge>
          <Badge className={DIRECTION_BADGE[trend.direction]}>{dirLabel(trend.direction)}</Badge>
          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${dirTone}`}>
            <DirIcon className="h-4 w-4" />
            {trend.changePct > 0 ? "+" : ""}
            {formatNumber(trend.changePct)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("trendSummaryTitle")}</div>
            <Row label={t("trendNameLabel")} value={trend.key} />
            <Row label={t("colAsset")} value={trend.deviceName} />
            <Row label={t("location")} value={location || "—"} mono />
            <Row label={t("metricLabel")} value={ai.category(trend.category)} />
            <Row label={t("trendDirectionLabel")} value={<Badge className={DIRECTION_BADGE[trend.direction]}>{dirLabel(trend.direction)}</Badge>} />
            <Row
              label={t("trendChangeLabel")}
              value={<span className={`font-semibold ${dirTone}`}>{trend.changePct > 0 ? "+" : ""}{formatNumber(trend.changePct)}%</span>}
            />
            <Row label={t("confidence")} value={`${formatNumber(trend.confidence)}%`} />
            <Row label={ai.tr("pValue")} value={trend.pValue < 0.001 ? "< 0.001" : ai.num(trend.pValue, 3)} />
            <Row label={ai.tr("seasonality")} value={`${formatNumber(Math.round(trend.seasonality * 100))}%`} />
            <Row label={t("timeRangeLabel")} value={ai.windowLabel(trend.window)} />
            <Row label={ai.tr("model")} value={ai.modelLabel(trend.model)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("trendChartTitle")}</div>
                <p className="text-xs text-muted-foreground">{t("trendChartDesc")}</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 gap-1.5" onClick={openCompare} disabled={candidates.length === 0}>
                <GitCompare className="h-3.5 w-3.5" /> {t("compareBtn")}
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} minTickGap={32} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {now && <ReferenceLine x={now} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
                <Area type="monotone" dataKey="bandHigh" stroke="none" fill="hsl(var(--destructive))" fillOpacity={0.1} name={ai.tr("projectionBand")} />
                <Area type="monotone" dataKey="bandLow" stroke="none" fill="hsl(var(--background))" fillOpacity={1} name=" " legendType="none" />
                <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name={t("historicalAverageLine")} />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={t("actualTrendLine")} />
                <Line type="monotone" dataKey="projected" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 4" dot={false} name={t("projectedTrendLine")} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold">{t("aiInterpretation")}</div>
            </div>
            <ul className="space-y-2">
              {ai.trendLines(trend).map((line, i) => (
                <li key={i} className="border rounded-md p-3 text-sm leading-relaxed bg-muted/30">{line}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-2">{ai.tr("detectedBy")}: {ai.tr("trendMethod")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("contributingFactorsTitle")}</div>
            <p className="text-[11px] text-muted-foreground mb-2">{ai.tr("correlatedSignals")}</p>
            <div className="space-y-2.5">
              {trend.factors.length === 0 && <p className="text-xs text-muted-foreground">{ai.tr("noFactors")}</p>}
              {trend.factors.map((f) => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{f.key}</span>
                    <span className="font-medium">{formatNumber(f.weight)}%</span>
                  </div>
                  <Progress value={f.weight} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("recommendationsTitle")}</div>
            {trend.actions.length === 0 && <p className="text-sm text-muted-foreground">{ai.tr("noActionsStable")}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {trend.actions.map((code) => {
                const isDone = done.has(code);
                return (
                  <div
                    key={code}
                    className={`border rounded-md p-3 flex items-center justify-between gap-3 ${isDone ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <span className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{ai.action(code)}</span>
                    <Button
                      size="sm"
                      variant={isDone ? "ghost" : "outline"}
                      className="h-7 text-xs gap-1 shrink-0"
                      disabled={toggleAction.isPending}
                      onClick={() => toggle(code, isDone)}
                    >
                      {isDone ? <><Undo2 className="h-3.5 w-3.5" /> {t("undo")}</> : <><Check className="h-3.5 w-3.5" /> {t("acknowledge")}</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={handleExport}>
          <Download className="h-4 w-4" /> {t("export")}
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={openCompare} disabled={candidates.length === 0}>
          <GitCompare className="h-4 w-4" /> {t("compareBtn")}
        </Button>
        <Button className="gap-1.5" onClick={() => navigate(lp("/aiot/analyze-trends?tab=explorer"))}>
          <TrendingUp className="h-4 w-4" /> {t("backToExplorer")}
        </Button>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("compareTrend")}</DialogTitle>
            <DialogDescription>
              {t("compareTrendDesc").replace("{name}", trend.key).replace("{asset}", trend.deviceName)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={compareId} onValueChange={setCompareId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectTrend")} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((x) => (
                  <SelectItem key={x.id} value={x.id}>{x.key} · {x.deviceName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {compareTrend && (
              <div className="border rounded-md p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={mergedCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} minTickGap={32} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="a" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name={`${trend.key} · ${trend.deviceName}`} />
                    <Line type="monotone" dataKey="b" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} connectNulls name={`${compareTrend.key} · ${compareTrend.deviceName}`} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t mt-2">
                  {[trend, compareTrend].map((x) => (
                    <div key={x.id}>
                      <div className="text-muted-foreground">{x.key} · {x.deviceName}</div>
                      <div className="font-semibold">
                        {x.changePct > 0 ? "+" : ""}
                        {formatNumber(x.changePct)}% · {formatNumber(x.confidence)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>{t("close")}</Button>
            {compareTrend && (
              <Button
                onClick={() => {
                  setCompareOpen(false);
                  navigate(lp(`/aiot/analyze-trends/${compareTrend.id}`));
                }}
              >
                {t("openTrendBtn").replace("{name}", compareTrend.key)}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniformPage>
  );
};

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={`text-sm text-end ${mono ? "text-xs" : ""}`}>{value}</span>
  </div>
);

export default AIoTTrendDetails;
