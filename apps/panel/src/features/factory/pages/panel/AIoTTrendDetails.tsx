import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import {
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
import {
  TRENDS,
  DIRECTION_BADGE,
  type Trend,
} from "@/features/factory/data/trends";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const buildSeries = (trend: Trend) => {
  const past = 30;
  const future = 14;
  const startVal = 100;
  const totalDelta = (trend.changePct / 100) * startVal;
  const endVal = startVal + totalDelta;
  const projectedEnd = endVal + totalDelta * 0.5;
  const out: {
    t: string;
    actual?: number;
    projected?: number;
    historicalAvg: number;
  }[] = [];
  for (let i = 0; i < past; i++) {
    const v =
      startVal + (totalDelta * i) / (past - 1) + (Math.random() - 0.5) * 1.4;
    out.push({
      t: `${i - past + 1}d`,
      actual: Number(v.toFixed(1)),
      historicalAvg: startVal,
    });
  }
  // bridge point
  out[out.length - 1].projected = out[out.length - 1].actual;
  for (let j = 1; j <= future; j++) {
    const v = endVal + ((projectedEnd - endVal) * j) / future;
    out.push({
      t: `+${j}d`,
      projected: Number(v.toFixed(1)),
      historicalAvg: startVal,
    });
  }
  return out;
};

const AIoTTrendDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);

  const trend: Trend | undefined = useMemo(
    () => TRENDS.find((t) => t.id === id),
    [id],
  );

  const series = useMemo(() => (trend ? buildSeries(trend) : []), [trend]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareId, setCompareId] = useState<string>("");

  const compareTrend = useMemo(
    () => TRENDS.find((t) => t.id === compareId),
    [compareId],
  );
  const compareSeries = useMemo(
    () => (compareTrend ? buildSeries(compareTrend) : []),
    [compareTrend],
  );
  const mergedCompare = useMemo(() => {
    if (!compareTrend) return [];
    return series.map((row, i) => ({
      t: row.t,
      a: row.actual ?? row.projected,
      b: compareSeries[i]?.actual ?? compareSeries[i]?.projected,
    }));
  }, [series, compareSeries, compareTrend]);

  const handleExport = () => {
    if (!trend) return;
    const headers = ["time", "historicalAvg", "actual", "projected"];
    const rows = series.map((r) =>
      [r.t, r.historicalAvg, r.actual ?? "", r.projected ?? ""].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trend-${trend.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t("trendExportedToast"), description: `${trend.name} · CSV` });
  };

  const openCompare = () => {
    const first = TRENDS.find((t) => t.id !== trend?.id);
    if (first && !compareId) setCompareId(first.id);
    setCompareOpen(true);
  };

  const dirLabel = (d: string) =>
    d === "Increasing" ? t("increasingDir") : d === "Decreasing" ? t("decreasingDir") : t("stableDir");

  if (!trend) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("trendNotFound")}</p>
          <Button
            variant="link"
            onClick={() => navigate(lp("/aiot/analyze-trends"))}
            className="mt-2"
          >
            {t("backToAnalyzeTrends")}
          </Button>
        </div>
      </>
    );
  }

  const DirIcon =
    trend.direction === "Increasing"
      ? ArrowUpRight
      : trend.direction === "Decreasing"
      ? ArrowDownRight
      : Minus;
  const dirTone =
    trend.direction === "Increasing"
      ? "text-red-600"
      : trend.direction === "Decreasing"
      ? "text-blue-600"
      : "text-muted-foreground";

  return (
    <>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate(lp("/aiot/analyze-trends"))}
                className="cursor-pointer"
              >
                {t("analyzeTrendsLabel")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate(lp("/aiot/analyze-trends"))}
                className="cursor-pointer"
              >
                {t("trendsExplorer")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{trend.name} {t("trendBreadcrumb")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => navigate(lp("/aiot/analyze-trends"))}
          >
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{trend.name}</h1>
            <p className="text-xs text-muted-foreground">
              {trend.asset} · {trend.devId} · {trend.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={DIRECTION_BADGE[trend.direction]}>{dirLabel(trend.direction)}</Badge>
          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${dirTone}`}>
            <DirIcon className="h-4 w-4" />
            {trend.changePct > 0 ? "+" : ""}
            {formatNumber(trend.changePct)}%
          </span>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Section 1 — Trend Summary */}
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("trendSummaryTitle")}</div>
            <Row label={t("trendNameLabel")} value={trend.name} />
            <Row label={t("colAsset")} value={trend.asset} />
            <Row label={t("location")} value={trend.location} mono />
            <Row label={t("metricLabel")} value={trend.metric} />
            <Row
              label={t("trendDirectionLabel")}
              value={<Badge className={DIRECTION_BADGE[trend.direction]}>{dirLabel(trend.direction)}</Badge>}
            />
            <Row
              label={t("trendChangeLabel")}
              value={
                <span className={`font-semibold ${dirTone}`}>
                  {trend.changePct > 0 ? "+" : ""}
                  {formatNumber(trend.changePct)}%
                </span>
              }
            />
            <Row label={t("confidence")} value={`${formatNumber(trend.confidence)}%`} />
            <Row label={t("timeRangeLabel")} value={trend.timeRange} />
          </CardContent>
        </Card>

        {/* Section 2 — Trend Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("trendChartTitle")}</div>
                <p className="text-xs text-muted-foreground">
                  {t("trendChartDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={openCompare}
              >
                <GitCompare className="h-3.5 w-3.5" /> {t("compareBtn")}
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine
                  x="0d"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="historicalAvg"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                  name={t("historicalAverageLine")}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name={t("actualTrendLine")}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  name={t("projectedTrendLine")}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section 3 — AI Interpretation */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold">{t("aiInterpretation")}</div>
            </div>
            <ul className="space-y-2">
              {trend.interpretation.map((line, i) => (
                <li
                  key={i}
                  className="border rounded-md p-3 text-sm leading-relaxed bg-muted/30"
                >
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Section 4 — Contributing Factors */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("contributingFactorsTitle")}</div>
            <div className="space-y-2.5">
              {trend.factors.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{f.label}</span>
                    <span className="font-medium">{formatNumber(f.weight)}%</span>
                  </div>
                  <Progress value={f.weight} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 5 — Recommendations */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("recommendationsTitle")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {trend.recommendations.map((r) => {
                const done = !!completed[r];
                return (
                  <div
                    key={r}
                    className={`border rounded-md p-3 flex items-center justify-between gap-3 ${done ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <span
                      className={`text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {r}
                    </span>
                    <Button
                      size="sm"
                      variant={done ? "ghost" : "outline"}
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setCompleted((p) => ({ ...p, [r]: !p[r] }));
                        toast({
                          title: done ? t("actionUndone") : t("actionAcknowledgedToast"),
                          description: r,
                        });
                      }}
                    >
                      {done ? t("undo") : (<><Check className="h-3.5 w-3.5" /> {t("acknowledge")}</>)}
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
        <Button variant="outline" className="gap-1.5" onClick={openCompare}>
          <GitCompare className="h-4 w-4" /> {t("compareBtn")}
        </Button>
        <Button
          className="gap-1.5"
          onClick={() => navigate(lp("/aiot/analyze-trends"))}
        >
          <TrendingUp className="h-4 w-4" /> {t("backToExplorer")}
        </Button>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("compareTrend")}</DialogTitle>
            <DialogDescription>
              {t("compareTrendDesc").replace("{name}", trend.name).replace("{asset}", trend.asset)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={compareId} onValueChange={setCompareId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectTrend")} />
              </SelectTrigger>
              <SelectContent>
                {TRENDS.filter((tr) => tr.id !== trend.id).map((tr) => (
                  <SelectItem key={tr.id} value={tr.id}>
                    {tr.name} · {tr.asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {compareTrend && (
              <div className="border rounded-md p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={mergedCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="a"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name={trend.name}
                    />
                    <Line
                      type="monotone"
                      dataKey="b"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                      name={compareTrend.name}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t mt-2">
                  <div>
                    <div className="text-muted-foreground">{trend.name}</div>
                    <div className="font-semibold">
                      {trend.changePct > 0 ? "+" : ""}
                      {formatNumber(trend.changePct)}% · {formatNumber(trend.confidence)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{compareTrend.name}</div>
                    <div className="font-semibold">
                      {compareTrend.changePct > 0 ? "+" : ""}
                      {formatNumber(compareTrend.changePct)}% · {formatNumber(compareTrend.confidence)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>
              {t("close")}
            </Button>
            {compareTrend && (
              <Button
                onClick={() => {
                  setCompareOpen(false);
                  navigate(lp(`/aiot/analyze-trends/${compareTrend.id}`));
                }}
              >
                {t("openTrendBtn").replace("{name}", compareTrend.name)}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};



const Row = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={`text-sm text-end ${mono ? "text-xs" : ""}`}>{value}</span>
  </div>
);

export default AIoTTrendDetails;
