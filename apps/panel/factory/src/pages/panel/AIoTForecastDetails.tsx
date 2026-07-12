import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  WorkOrderSheet,
  type WorkOrderSource,
} from "@/components/anomalies/WorkOrderSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronLeft,
  Check,
  EyeOff,
  Wrench,
  Bell,
  AlertTriangle,
  Undo2,
  ClipboardList,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  ReferenceDot,
} from "recharts";
import {
  FORECAST_ASSETS,
  RISK_BADGE,
  RISK_COLOR,
  type ForecastAsset,
} from "@/data/forecastAssets";
import { useAnomalyStore } from "@/hooks/useAnomalyStore";

const buildHealthSeries = (currentHealth: number) => {
  const len = 24;
  const out: { t: string; expectedMin: number; expectedMax: number; health: number; predicted?: number }[] = [];
  const start = Math.min(100, currentHealth + 35);
  for (let i = 0; i < len; i++) {
    const v = start - ((start - currentHealth) * i) / (len - 1) + (Math.random() - 0.5) * 1.5;
    out.push({
      t: `${i - len + 1}d`,
      expectedMin: 70,
      expectedMax: 95,
      health: Number(v.toFixed(1)),
    });
  }
  out[out.length - 1].predicted = out[out.length - 1].health;
  return out;
};

const AIoTForecastDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const asset: ForecastAsset | undefined = useMemo(
    () => FORECAST_ASSETS.find((a) => a.devId === id),
    [id],
  );

  const series = useMemo(() => buildHealthSeries(asset?.health ?? 60), [asset?.health]);
  const lastPoint = series[series.length - 1];

  const { completeAction, undoAction, getActions, getWorkOrders } = useAnomalyStore();
  const sourceId = asset?.devId ?? "";
  const completedActions = getActions(sourceId);
  const workOrders = getWorkOrders(sourceId);
  const isCompleted = (label: string) => completedActions.some((c) => c.label === label);

  const [woOpen, setWoOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!asset) {
    return (
      <PanelLayout pageTitle={t("predictionDetailsTitle")}>
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("predictionNotFound")}</p>
          <Button
            variant="link"
            onClick={() => navigate(lp("/aiot/forecast-failures"))}
            className="mt-2"
          >
            {t("backToForecastFailures")}
          </Button>
        </div>
      </PanelLayout>
    );
  }


  const woSource: WorkOrderSource = {
    id: asset.devId,
    asset: asset.id,
    devId: asset.devId,
    location: asset.location,
    severity: asset.risk,
    suggestedActions: asset.recommendedActions,
    fallbackAction: `Inspect ${asset.cause.toLowerCase()}`,
    kind: "forecast",
  };

  return (
    <PanelLayout pageTitle={`${t("predictionDetailsTitle")} · ${asset.id}`}>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/forecast-failures"))} className="cursor-pointer">
                {t("forecastTitle")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/forecast-failures"))} className="cursor-pointer">
                {t("assetsAtRisk")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{asset.id}</BreadcrumbPage>
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
            onClick={() => navigate(lp("/aiot/forecast-failures"))}
          >
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{asset.id}</h1>
            <p className="text-xs text-muted-foreground">
              {asset.devId} · {asset.type} · {asset.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={RISK_BADGE[asset.risk]}>{asset.risk}</Badge>
          <Badge variant="secondary">
            {t("rul")} {formatNumber(asset.rulDays)}{t("daysShort")}
          </Badge>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("assetSummary")}</div>
            <Row label={t("colAsset")} value={asset.id} />
            <Row label={t("type")} value={asset.type} />
            <Row label={t("location")} value={asset.location} mono />
            <Row label={t("colRisk")} value={<Badge className={RISK_BADGE[asset.risk]}>{asset.risk}</Badge>} />
            <Row label={t("predictedFailure")} value={asset.date} />
            <Row label={t("remainingUsefulLife")} value={`${formatNumber(asset.rulDays)} ${t("days")}`} />
          </CardContent>
        </Card>

        {/* What's happening */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-2">{t("whyThisPrediction")}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("whyThisPredictionDesc")
                .replace("{asset}", asset.id)
                .replace("{days}", formatNumber(asset.rulDays))
                .replace("{cause}", asset.cause.toLowerCase())}
            </p>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("healthScore")}</div>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={RISK_COLOR[asset.risk]}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - asset.health / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{formatNumber(asset.health)}</span>
                  <span className="text-[10px] text-muted-foreground">/ {formatNumber(100)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-1">
                {t("compositeHealthDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failure Probability */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("failureProbability")}</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { d: 7, v: Math.min(98, 100 - asset.health + 40) },
                { d: 30, v: Math.min(99, 100 - asset.health + 55) },
                { d: 90, v: Math.min(99, 100 - asset.health + 62) },
              ].map((p) => (
                <div key={p.d} className="border rounded-md p-2 text-center">
                  <div className="text-lg font-bold text-orange-600">{formatNumber(p.v)}%</div>
                  <div className="text-[11px] text-muted-foreground">{formatNumber(p.d)} {t("days")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Health Trend chart */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("healthTrendTitle")}</div>
                <p className="text-xs text-muted-foreground">
                  {t("healthTrendDesc")}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="expectedMax"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.08}
                  name={t("healthyRange")}
                />
                <Area
                  type="monotone"
                  dataKey="expectedMin"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                  name=" "
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name={t("healthScore")}
                />
                <ReferenceDot
                  x={lastPoint.t}
                  y={lastPoint.health}
                  r={6}
                  fill="hsl(var(--destructive))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Root cause */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("rootCauseAnalysis")}</div>
            <div className="space-y-2.5">
              {[
                { l: asset.cause, v: 72 },
                { l: t("tempRiseLabel"), v: 18 },
                { l: t("pressureInstabilityLabel"), v: 10 },
              ].map((c) => (
                <div key={c.l}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.l}</span>
                    <span className="font-medium">{formatNumber(c.v)}%</span>
                  </div>
                  <Progress value={c.v} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Recommended actions */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{t("recommendedActions")}</div>
              <span className="text-xs text-muted-foreground">
                {formatNumber(completedActions.length)} / {formatNumber(asset.recommendedActions.length)} {t("completedSuffix")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {asset.recommendedActions.map((a) => {
                const done = isCompleted(a);
                return (
                  <div
                    key={a}
                    className={`border rounded-md p-3 flex items-center justify-between gap-3 ${done ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {done && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                      <span className={`text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}>{a}</span>
                    </div>
                    {done ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          undoAction(sourceId, a);
                          toast({ title: t("actionUndone"), description: a });
                        }}
                      >
                        <Undo2 className="h-3.5 w-3.5" /> {t("undo")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          completeAction(sourceId, a);
                          toast({ title: t("actionCompleted"), description: a });
                        }}
                      >
                        {t("runAction")}
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="border rounded-md p-3 flex items-center justify-between gap-3 bg-primary/5">
                <span className="text-sm font-medium">{t("createWorkOrder")}</span>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setWoOpen(true)}>
                  <Wrench className="h-3.5 w-3.5" /> {t("createBtn")}
                </Button>
              </div>
            </div>

            {workOrders.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("workOrdersWithCount").replace("{n}", formatNumber(workOrders.length))}</span>
                </div>
                <div className="border rounded-md divide-y">
                  {workOrders.map((w) => (
                    <div key={w.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{w.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {w.id} · {w.assignedTeam} · {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={RISK_BADGE[w.priority]}>{w.priority}</Badge>
                        <Badge variant="secondary">{w.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => toast({ title: t("assignedToTechnicianToast"), description: asset.id })}
        >
          <Check className="h-4 w-4" /> {t("assignToTechnician")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => toast({ title: t("alarmRuleDraftedToast"), description: asset.id })}
        >
          <Bell className="h-4 w-4" /> {t("createAlarmRule")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={dismissed}
          onClick={() => {
            setDismissed(true);
            toast({ title: t("predictionIgnoredToast"), description: asset.id });
          }}
        >
          <EyeOff className="h-4 w-4" /> {t("ignorePrediction")}
        </Button>
        <Button className="gap-1.5" onClick={() => setWoOpen(true)}>
          <Wrench className="h-4 w-4" /> {t("createWorkOrder")}
        </Button>
      </div>

      <WorkOrderSheet open={woOpen} onOpenChange={setWoOpen} source={woSource} />
    </PanelLayout>
  );
};


const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={`text-sm text-end ${mono ? "text-xs" : ""}`}>{value}</span>
  </div>
);

export default AIoTForecastDetails;
