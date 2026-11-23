import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useNavigate, useParams } from "react-router-dom";
import type { AiForecastStatus } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import {
  WorkOrderSheet,
  type WorkOrderSource,
} from "@/features/factory/components/anomalies/WorkOrderSheet";
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
  ChevronLeft,
  Check,
  EyeOff,
  Wrench,
  Bell,
  AlertTriangle,
  Undo2,
  ClipboardList,
  Search,
  Loader2,
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
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiCompletedActions, useAiForecast } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import {
  FORECAST_STATUS_KEY,
  RISK_BADGE,
  RISK_COLOR,
  STATUS_BADGE,
  useLocationPath,
  useWorkOrdersFor,
} from "@/features/factory/components/ai/aiShared";

const AIoTForecastDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();

  const { data: forecast, isLoading } = useAiForecast(id);
  const completed = useAiCompletedActions("FORECAST", id);
  const { toggleAction, setForecastStatus } = useAiActions();
  const workOrders = useWorkOrdersFor(id);
  const [woOpen, setWoOpen] = useState(false);

  const series = useMemo(
    () =>
      (forecast?.healthSeries ?? []).map((p) => ({
        t: formatDateTime(p.ts, language),
        health: p.health ?? undefined,
        projected: p.projected ?? undefined,
      })),
    [forecast?.healthSeries, language],
  );
  const today = useMemo(() => {
    const last = (forecast?.healthSeries ?? []).filter((p) => p.health != null).pop();
    return last ? formatDateTime(last.ts, language) : undefined;
  }, [forecast?.healthSeries, language]);

  if (isLoading) {
    return (
      <UniformPage>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </UniformPage>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("predictionNotFound")}</p>
        <Button variant="link" onClick={() => navigate(lp("/aiot/forecast-failures"))} className="mt-2">
          {t("backToForecastFailures")}
        </Button>
      </div>
    );
  }

  const location = pathOf(forecast.assetId);
  const done = new Set((completed.data ?? []).map((c) => c.code));
  const settled = forecast.status === "RESOLVED" || forecast.status === "DISMISSED";
  const statusLabel = (s: AiForecastStatus) => tt(FORECAST_STATUS_KEY[s]);

  const woSource: WorkOrderSource = {
    id: forecast.deviceId,
    asset: forecast.deviceName,
    devId: forecast.deviceId,
    location,
    severity: forecast.risk,
    suggestedActions: forecast.actions.map(ai.action),
    fallbackAction: ai.action("INSPECT_ASSET"),
    kind: "forecast",
    deviceId: forecast.deviceId,
    assetId: forecast.assetId,
  };

  const setStatus = (status: AiForecastStatus, label: string) =>
    setForecastStatus.mutate(
      { deviceId: forecast.deviceId, status },
      {
        onSuccess: () => toast({ title: label, description: forecast.deviceName }),
        onError: (e) => toast({ title: label, description: apiErrorMessage(e, label), variant: "destructive" }),
      },
    );

  const toggle = (code: string, isDone: boolean) =>
    toggleAction.mutate(
      { kind: "FORECAST", sourceId: forecast.deviceId, code, done: !isDone },
      {
        onSuccess: () => toast({ title: isDone ? t("actionUndone") : t("actionCompleted"), description: ai.action(code) }),
        onError: (e) => toast({ title: ai.action(code), description: apiErrorMessage(e, ai.action(code)), variant: "destructive" }),
      },
    );

  const causeSignal = forecast.signals.find((s) => s.key === forecast.causeKey);

  return (
    <UniformPage>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <HomeCrumb />
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
              <BreadcrumbPage>{forecast.deviceName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/aiot/forecast-failures"))}>
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{forecast.deviceName}</h1>
            <p className="text-xs text-muted-foreground">
              {forecast.deviceType} · {location || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={RISK_BADGE[forecast.risk]}>{forecast.risk}</Badge>
          <Badge className={STATUS_BADGE[forecast.status]}>{statusLabel(forecast.status)}</Badge>
          <Badge variant="secondary">
            {t("rul")} {forecast.rulDays == null ? "—" : `${formatNumber(forecast.rulDays)}${t("daysShort")}`}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("assetSummary")}</div>
            <Row label={t("colAsset")} value={forecast.deviceName} />
            <Row label={t("type")} value={forecast.deviceType} />
            <Row label={t("location")} value={location || "—"} mono />
            <Row label={t("colRisk")} value={<Badge className={RISK_BADGE[forecast.risk]}>{forecast.risk}</Badge>} />
            <Row
              label={t("predictedFailure")}
              value={forecast.predictedFailureAt ? formatDateTime(forecast.predictedFailureAt, language) : ai.tr("noFailureWithin90")}
            />
            <Row
              label={t("remainingUsefulLife")}
              value={forecast.rulDays == null ? "—" : `${formatNumber(forecast.rulDays)} ${t("days")}`}
            />
            <Row label={ai.tr("model")} value={ai.modelLabel(forecast.model)} />
            <Row label={ai.tr("lastAnalyzed")} value={formatDateTime(forecast.computedAt, language)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-2">{t("whyThisPrediction")}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{ai.forecastText(forecast)}</p>
            {forecast.signals.length > 0 && (
              <div className="mt-3 overflow-x-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 text-start font-medium">{ai.tr("signal")}</th>
                      <th className="px-2 py-1.5 text-end font-medium">{ai.tr("current")}</th>
                      <th className="px-2 py-1.5 text-end font-medium">{ai.tr("baseline")}</th>
                      <th className="px-2 py-1.5 text-end font-medium">{ai.tr("threshold")}</th>
                      <th className="px-2 py-1.5 text-start font-medium w-[30%]" />
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.signals.map((s) => (
                      <tr key={s.key} className="border-t">
                        <td className="px-2 py-1.5">
                          <div className="font-medium">{s.key}</div>
                          <div className="text-muted-foreground">{ai.category(s.category)}</div>
                        </td>
                        <td className="px-2 py-1.5 text-end">{ai.num(s.current)}</td>
                        <td className="px-2 py-1.5 text-end">{ai.num(s.baseline)}</td>
                        <td className="px-2 py-1.5 text-end">
                          {ai.num(s.threshold)}
                          <div className="text-muted-foreground">
                            {ai.tr(s.thresholdSource === "ALARM_RULE" ? "thresholdFromRule" : "thresholdLearned")}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <Progress value={Math.round(s.degradation * 100)} className="h-1.5" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
                    stroke={RISK_COLOR[forecast.risk]}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - forecast.health / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{formatNumber(forecast.health)}</span>
                  <span className="text-[10px] text-muted-foreground">/ {formatNumber(100)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{t("compositeHealthDesc")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("failureProbability")}</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { d: 7, v: forecast.probability7d },
                { d: 30, v: forecast.probability30d },
                { d: 90, v: forecast.probability90d },
              ].map((p) => (
                <div key={p.d} className="border rounded-md p-2 text-center">
                  <div className={`text-lg font-bold ${p.v >= 50 ? "text-red-600" : p.v >= 20 ? "text-orange-600" : "text-foreground"}`}>
                    {formatNumber(p.v)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">{formatNumber(p.d)} {t("days")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("healthTrendTitle")}</div>
                <p className="text-xs text-muted-foreground">{t("healthTrendDesc")}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} minTickGap={24} />
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
                {today && <ReferenceLine x={today} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey="health" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={t("healthScore")} />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  name={ai.tr("projectedHealth")}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("rootCauseAnalysis")}</div>
            <div className="space-y-2.5">
              {forecast.causes.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
              {forecast.causes.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.key}</span>
                    <span className="font-medium">{formatNumber(c.weight)}%</span>
                  </div>
                  <Progress value={c.weight} className="h-2" />
                </div>
              ))}
            </div>
            {causeSignal && (
              <p className="text-[11px] text-muted-foreground mt-3">
                {ai.category(causeSignal.category)} · {ai.tr("threshold")} {ai.num(causeSignal.threshold)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{t("recommendedActions")}</div>
              <span className="text-xs text-muted-foreground">
                {formatNumber(forecast.actions.filter((a) => done.has(a)).length)} / {formatNumber(forecast.actions.length)} {t("completedSuffix")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {forecast.actions.map((code) => {
                const isDone = done.has(code);
                return (
                  <div
                    key={code}
                    className={`border rounded-md p-3 flex items-center justify-between gap-3 ${isDone ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isDone && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                      <span className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{ai.action(code)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={isDone ? "ghost" : "outline"}
                      className="h-7 text-xs gap-1 shrink-0"
                      disabled={toggleAction.isPending}
                      onClick={() => toggle(code, isDone)}
                    >
                      {isDone ? <><Undo2 className="h-3.5 w-3.5" /> {t("undo")}</> : t("runAction")}
                    </Button>
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
                    <button
                      key={w.id}
                      onClick={() => navigate(lp(`/work-orders/${w.id}`))}
                      className="w-full text-start px-3 py-2 flex items-center gap-3 text-sm hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{w.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {w.assignedTeam || "—"} · {formatDateTime(w.createdAt, language)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={RISK_BADGE[w.priority]}>{w.priority}</Badge>
                        <Badge variant="secondary">{w.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={settled || forecast.status === "ACKNOWLEDGED"}
          onClick={() => setStatus("ACKNOWLEDGED", tt("toastPredictionAcknowledged"))}
        >
          <Check className="h-4 w-4" /> {tt("actionAcknowledgeMenu")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={settled || forecast.status === "INVESTIGATING"}
          onClick={() => setStatus("INVESTIGATING", tt("toastInvestigationStarted"))}
        >
          <Search className="h-4 w-4" /> {tt("actionStartInvestigating")}
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => navigate(lp("/alarms"))}>
          <Bell className="h-4 w-4" /> {t("createAlarmRule")}
        </Button>
        {settled ? (
          <Button variant="outline" className="gap-1.5" onClick={() => setStatus("OPEN", statusLabel("OPEN"))}>
            <Undo2 className="h-4 w-4" /> {statusLabel("OPEN")}
          </Button>
        ) : (
          <>
            <Button variant="outline" className="gap-1.5" onClick={() => setStatus("DISMISSED", tt("predictionIgnoredToast"))}>
              <EyeOff className="h-4 w-4" /> {t("ignorePrediction")}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setStatus("RESOLVED", tt("toastPredictionResolved"))}>
              <Check className="h-4 w-4" /> {tt("actionMarkResolved")}
            </Button>
          </>
        )}
        <Button className="gap-1.5" onClick={() => setWoOpen(true)}>
          <Wrench className="h-4 w-4" /> {t("createWorkOrder")}
        </Button>
      </div>

      <WorkOrderSheet open={woOpen} onOpenChange={setWoOpen} source={woSource} />
    </UniformPage>
  );
};

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={`text-sm text-end ${mono ? "text-xs" : ""}`}>{value}</span>
  </div>
);

export default AIoTForecastDetails;
