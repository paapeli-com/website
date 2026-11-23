import { CropContextChip } from "@/features/greenhouse/components/CropContext";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useNavigate, useParams } from "react-router-dom";
import type { AiAnomalyStatus } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Progress } from "@/features/factory/components/ui/progress";
import { WorkOrderSheet, type WorkOrderSource } from "@/features/factory/components/anomalies/WorkOrderSheet";
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
  X,
  Wrench,
  Bell,
  AlertTriangle,
  Undo2,
  ClipboardList,
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
  ReferenceDot,
  Area,
  ComposedChart,
} from "recharts";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiAnomaly, useAiCompletedActions } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import {
  ACTIVE_ANOMALY,
  ANOMALY_STATUS_KEY,
  RISK_BADGE as SEV_BADGE,
  STATUS_BADGE,
  useLocationPath,
  useWorkOrdersFor,
  type Risk,
} from "@/features/factory/components/ai/aiShared";

const AIoTAnomalyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();

  const { data: anomaly, isLoading } = useAiAnomaly(id);
  const completed = useAiCompletedActions("ANOMALY", id);
  const { toggleAction, setAnomalyStatus } = useAiActions();
  const workOrders = useWorkOrdersFor(id);
  const [woOpen, setWoOpen] = useState(false);

  const sevLabel = (s: Risk) =>
    ({ Critical: t("alertCritical"), High: t("alertHigh"), Medium: t("alertMedium"), Low: t("alertLow") })[s];
  const statusLabel = (s: AiAnomalyStatus) => tt(ANOMALY_STATUS_KEY[s]);

  /* The band is drawn as two stacked areas: the low edge in the page colour
     over the high edge, so only the range between them shows. */
  const series = useMemo(
    () =>
      (anomaly?.series ?? []).map((p) => ({
        t: formatDateTime(p.ts, language),
        ts: p.ts,
        actual: p.actual ?? undefined,
        expected: p.expected ?? undefined,
        expectedMin: p.expectedLow ?? undefined,
        expectedMax: p.expectedHigh ?? undefined,
      })),
    [anomaly?.series, language],
  );
  const peak = useMemo(() => {
    if (!anomaly) return undefined;
    const at = Date.parse(anomaly.peakAt);
    return series.find((p) => p.ts === at);
  }, [anomaly, series]);

  if (isLoading) {
    return (
      <UniformPage>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </UniformPage>
    );
  }

  if (!anomaly) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("anomalyNotFound")}</p>
        <Button variant="link" onClick={() => navigate(lp("/aiot/detect-anomalies"))} className="mt-2">
          {t("backToDetectAnomalies")}
        </Button>
      </div>
    );
  }

  const location = pathOf(anomaly.assetId);
  const text = ai.anomalyText(anomaly);
  const done = new Set((completed.data ?? []).map((c) => c.code));
  const isResolved = !ACTIVE_ANOMALY.includes(anomaly.status);

  const handleStatus = (s: AiAnomalyStatus, label: string) =>
    setAnomalyStatus.mutate(
      { id: anomaly.id, status: s },
      {
        onSuccess: () => toast({ title: label, description: anomaly.deviceName }),
        onError: (e) => toast({ title: label, description: apiErrorMessage(e, label), variant: "destructive" }),
      },
    );

  const toggle = (code: string, isDone: boolean) =>
    toggleAction.mutate(
      { kind: "ANOMALY", sourceId: anomaly.id, code, done: !isDone },
      {
        onSuccess: () => toast({ title: isDone ? t("actionUndone") : t("actionCompleted"), description: ai.action(code) }),
        onError: (e) => toast({ title: ai.action(code), description: apiErrorMessage(e, ai.action(code)), variant: "destructive" }),
      },
    );

  const woSource: WorkOrderSource = {
    id: anomaly.id,
    asset: anomaly.deviceName,
    devId: anomaly.deviceId,
    location,
    severity: anomaly.severity,
    suggestedActions: anomaly.actions.map(ai.action),
    fallbackAction: ai.action("VERIFY_SENSOR_READING"),
    kind: "anomaly",
    deviceId: anomaly.deviceId,
    assetId: anomaly.assetId,
  };

  return (
    <UniformPage>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <HomeCrumb />
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
              <BreadcrumbPage>{anomaly.deviceName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/aiot/detect-anomalies"))}>
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold">{anomaly.deviceName}</h1>
            <CropContextChip deviceId={anomaly.deviceId} className="text-xs" />
            <p className="text-xs text-muted-foreground">
              {ai.kind(anomaly.kind)} · {anomaly.key} · {anomaly.deviceType} · {location || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {anomaly.thresholdCrossed && (
            <Badge className="bg-red-600 text-white">{ai.tr("thresholdCrossed")}</Badge>
          )}
          <Badge className={SEV_BADGE[anomaly.severity]}>{sevLabel(anomaly.severity)}</Badge>
          <Badge className={STATUS_BADGE[anomaly.status]}>{statusLabel(anomaly.status)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("anomalySummary")}</div>
            <Row label={t("assetLabel")} value={anomaly.deviceName} />
            <Row label={t("locationLabel")} value={location || "—"} mono />
            <Row label={t("severity")} value={<Badge className={SEV_BADGE[anomaly.severity]}>{sevLabel(anomaly.severity)}</Badge>} />
            <Row label={t("detected")} value={formatDateTime(anomaly.peakAt, language)} />
            <Row label={t("confidence")} value={`${formatNumber(anomaly.confidence)}%`} />
            <Row label={t("status")} value={<Badge className={STATUS_BADGE[anomaly.status]}>{statusLabel(anomaly.status)}</Badge>} />
            {isResolved && anomaly.statusChangedByName && (
              <Row label={t("colResolvedBy")} value={anomaly.statusChangedByName} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-2">{t("whatHappened")}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{text.explanation}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{t("sensorTrend")} · {anomaly.key}</div>
                <p className="text-xs text-muted-foreground">{t("sensorTrendDesc")}</p>
              </div>
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
                <Area type="monotone" dataKey="expectedMax" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.12} name={t("expectedRange")} />
                <Area type="monotone" dataKey="expectedMin" stroke="none" fill="hsl(var(--background))" fillOpacity={1} name=" " legendType="none" />
                <Line type="monotone" dataKey="expected" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name={ai.tr("expectedValue")} />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={t("actualValue")} />
                {peak && peak.actual !== undefined && (
                  <ReferenceDot x={peak.t} y={peak.actual} r={6} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={2} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("aiExplanation")}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Stat label={t("confidence")} value={`${formatNumber(anomaly.confidence)}%`} />
              <Stat label={t("detectionWindow")} value={`${formatNumber(text.windowHours)} h`} />
              <Stat label={t("anomalyScore")} value={ai.num(anomaly.score)} />
              <Stat label={ai.tr("zScore")} value={ai.tr("zScoreValue", { z: ai.num(Math.abs(anomaly.zScore), 1) })} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{text.summary}</p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {ai.tr("detectedBy")}: {text.method} · {ai.tr("model")}: {ai.modelLabel(anomaly.model)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("possibleCauses")}</div>
            <div className="space-y-2.5">
              {anomaly.causes.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.key}</span>
                    <span className="font-medium">{formatNumber(c.weight)}%</span>
                  </div>
                  <Progress value={c.weight} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{t("suggestedActions")}</div>
              <span className="text-xs text-muted-foreground">
                {t("actionsCompletedCount")
                  .replace("{done}", formatNumber(anomaly.actions.filter((a) => done.has(a)).length))
                  .replace("{total}", formatNumber(anomaly.actions.length))}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {anomaly.actions.map((code) => {
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
                        <Badge className={SEV_BADGE[w.priority]}>{sevLabel(w.priority)}</Badge>
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
        {isResolved ? (
          <Button variant="outline" className="gap-1.5" onClick={() => handleStatus("OPEN", statusLabel("OPEN"))}>
            <Undo2 className="h-4 w-4" /> {statusLabel("OPEN")}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={anomaly.status === "ACKNOWLEDGED"}
              onClick={() => handleStatus("ACKNOWLEDGED", t("acknowledgedToast"))}
            >
              <Check className="h-4 w-4" /> {t("acknowledge")}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={anomaly.status === "INVESTIGATING"}
              onClick={() => handleStatus("INVESTIGATING", t("investigationStarted"))}
            >
              <Bell className="h-4 w-4" /> {t("investigate")}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => handleStatus("FALSE_POSITIVE", t("chipFalsePositive"))}>
              <X className="h-4 w-4" /> {t("chipFalsePositive")}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => handleStatus("DISMISSED", t("dismissedToast"))}>
              <X className="h-4 w-4" /> {t("dismiss")}
            </Button>
            <Button className="gap-1.5" onClick={() => handleStatus("RESOLVED", t("markedResolved"))}>
              <Check className="h-4 w-4" /> {t("resolve")}
            </Button>
          </>
        )}
      </div>

      <WorkOrderSheet
        open={woOpen}
        onOpenChange={setWoOpen}
        source={woSource}
        onCreated={() => {
          if (anomaly.status === "OPEN") handleStatus("INVESTIGATING", t("investigationStarted"));
        }}
      />
    </UniformPage>
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
