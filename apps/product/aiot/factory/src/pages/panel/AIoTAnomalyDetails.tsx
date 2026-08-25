import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WorkOrderSheet } from "@/components/anomalies/WorkOrderSheet";
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
  X,
  Wrench,
  Bell,
  AlertTriangle,
  Undo2,
  ClipboardList,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
  Area,
  ComposedChart,
} from "recharts";
import {
  useAnomalyStore,
  type AnomalySeverity,
  type AnomalyStatus,
} from "@/hooks/useAnomalyStore";

const SEV_BADGE: Record<AnomalySeverity, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const STATUS_BADGE: Record<AnomalyStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Acknowledged: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Investigating: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Dismissed: "bg-muted text-muted-foreground",
  "False Positive": "bg-muted text-muted-foreground",
};

const buildSensorSeries = (anomalyScore: number) => {
  const len = 24;
  const out: { t: string; expectedMin: number; expectedMax: number; actual: number; anomaly?: number }[] = [];
  for (let i = 0; i < len; i++) {
    const base = 50 + Math.sin(i / 3) * 4;
    const expectedMin = base - 5;
    const expectedMax = base + 5;
    let actual = base + (Math.random() - 0.5) * 2;
    if (i > 16) actual = base + (i - 16) * anomalyScore * 4;
    out.push({
      t: `${i}h`,
      expectedMin,
      expectedMax,
      actual: Number(actual.toFixed(2)),
    });
  }
  out[out.length - 2].anomaly = out[out.length - 2].actual;
  return out;
};

const AIoTAnomalyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const {
    getById,
    updateStatus,
    completeAction,
    undoAction,
    getActions,
    getWorkOrders,
  } = useAnomalyStore();

  const anomaly = id ? getById(id) : undefined;
  const series = useMemo(() => buildSensorSeries(anomaly?.anomalyScore ?? 0.5), [anomaly?.anomalyScore]);

  const [woOpen, setWoOpen] = useState(false);

  const sevLabel = (s: AnomalySeverity) =>
    ({ Critical: t("alertCritical"), High: t("alertHigh"), Medium: t("alertMedium"), Low: t("alertLow") }[s]);
  const statusLabel = (s: AnomalyStatus) =>
    ({
      Open: t("chipOpen"),
      Acknowledged: t("alertStatusAcknowledged"),
      Investigating: t("chipInvestigating"),
      Resolved: t("chipResolved"),
      Dismissed: t("chipDismissed"),
      "False Positive": t("chipFalsePositive"),
    }[s]);


  if (!anomaly) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("anomalyNotFound")}</p>
          <Button
            variant="link"
            onClick={() => navigate(lp("/aiot/detect-anomalies"))}
            className="mt-2"
          >
            {t("backToDetectAnomalies")}
          </Button>
        </div>
      </>
    );
  }

  const completedActions = getActions(anomaly.id);
  const workOrders = getWorkOrders(anomaly.id);
  const isCompleted = (label: string) => completedActions.some((c) => c.label === label);
  const isResolved =
    anomaly.status === "Resolved" ||
    anomaly.status === "Dismissed" ||
    anomaly.status === "False Positive";

  const handleStatus = (s: AnomalyStatus, label: string) => {
    updateStatus(anomaly.id, s);
    toast({ title: label, description: anomaly.asset });
  };


  const anomalyPoint = series.find((p) => p.anomaly !== undefined);


  return (
    <>

      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/detect-anomalies"))} className="cursor-pointer">
                {t("detectAnomalies")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/detect-anomalies"))} className="cursor-pointer">
                {t("activeAnomalies")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{anomaly.asset}</BreadcrumbPage>
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
            onClick={() => navigate(lp("/aiot/detect-anomalies"))}
          >
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{anomaly.asset}</h1>
            <p className="text-xs text-muted-foreground">
              {anomaly.devId} · {anomaly.assetType} · {anomaly.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={SEV_BADGE[anomaly.severity]}>{sevLabel(anomaly.severity)}</Badge>
          <Badge className={STATUS_BADGE[anomaly.status]}>{statusLabel(anomaly.status)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Section 1 — Summary */}
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("anomalySummary")}</div>
            <Row label={t("assetLabel")} value={anomaly.asset} />
            <Row label={t("locationLabel")} value={anomaly.location} mono />
            <Row label={t("severity")} value={<Badge className={SEV_BADGE[anomaly.severity]}>{sevLabel(anomaly.severity)}</Badge>} />
            <Row label={t("detected")} value={new Date(anomaly.detectedAt).toLocaleString()} />
            <Row label={t("confidence")} value={`${formatNumber(anomaly.confidence)}%`} />
            <Row label={t("status")} value={<Badge className={STATUS_BADGE[anomaly.status]}>{statusLabel(anomaly.status)}</Badge>} />
          </CardContent>
        </Card>

        {/* Section 2 — What happened */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-2">{t("whatHappened")}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{anomaly.explanation}</p>
          </CardContent>
        </Card>


        {/* Section 3 — Sensor Trend (main visual) */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("sensorTrend")}</div>
                <p className="text-xs text-muted-foreground">
                  {t("sensorTrendDesc")}
                </p>
              </div>
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
                <Area
                  type="monotone"
                  dataKey="expectedMax"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.08}
                  name={t("expectedRange")}
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
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name={t("actualValue")}
                />

                {anomalyPoint && (
                  <ReferenceDot
                    x={anomalyPoint.t}
                    y={anomalyPoint.actual}
                    r={6}
                    fill="hsl(var(--destructive))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section 4 — AI Explanation */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("aiExplanation")}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Stat label={t("confidence")} value={`${formatNumber(anomaly.confidence)}%`} />
              <Stat label={t("detectionWindow")} value={anomaly.detectionWindow} />
              <Stat label={t("anomalyScore")} value={anomaly.anomalyScore.toFixed(2)} />
              <Stat label={t("sensorLabel")} value={anomaly.sensorType} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{anomaly.patternSummary}</p>
          </CardContent>
        </Card>

        {/* Section 5 — Possible Causes */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("possibleCauses")}</div>
            <div className="space-y-2.5">
              {anomaly.causes.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.label}</span>
                    <span className="font-medium">{formatNumber(c.weight)}%</span>
                  </div>
                  <Progress value={c.weight} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 6 — Suggested Actions */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{t("suggestedActions")}</div>
              <span className="text-xs text-muted-foreground">
                {t("actionsCompletedCount")
                  .replace("{done}", formatNumber(completedActions.length))
                  .replace("{total}", formatNumber(anomaly.suggestedActions.length))}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {anomaly.suggestedActions.map((a) => {
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
                          undoAction(anomaly.id, a);
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
                          completeAction(anomaly.id, a);
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
                  <Wrench className="h-3.5 w-3.5" /> {t("create")}
                </Button>
              </div>
            </div>

            {workOrders.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("workOrders")} ({formatNumber(workOrders.length)})</span>
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
                        <Badge className={SEV_BADGE[w.priority]}>{sevLabel(w.priority)}</Badge>
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
          disabled={isResolved || anomaly.status === "Acknowledged"}
          onClick={() => handleStatus("Acknowledged", t("acknowledgedToast"))}
        >
          <Check className="h-4 w-4" /> {t("acknowledge")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={isResolved || anomaly.status === "Investigating"}
          onClick={() => handleStatus("Investigating", t("investigationStarted"))}
        >
          <Bell className="h-4 w-4" /> {t("investigate")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={isResolved}
          onClick={() => handleStatus("Dismissed", t("dismissedToast"))}
        >
          <X className="h-4 w-4" /> {t("dismiss")}
        </Button>
        <Button
          className="gap-1.5"
          disabled={isResolved}
          onClick={() => handleStatus("Resolved", t("markedResolved"))}
        >
          <Check className="h-4 w-4" /> {t("resolve")}
        </Button>
      </div>


      <WorkOrderSheet open={woOpen} onOpenChange={setWoOpen} anomaly={anomaly} />
    </>
  );
};


const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={`text-sm text-end ${mono ? "text-xs" : ""}`}>{value}</span>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="border rounded-md p-2.5">
    <div className="text-[11px] text-muted-foreground">{label}</div>
    <div className="text-sm font-semibold mt-0.5">{value}</div>
  </div>
);

export default AIoTAnomalyDetails;
