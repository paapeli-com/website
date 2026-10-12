import { UniformPage } from "@/features/factory/components/UniformPage";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AiOpportunityStatus } from "@paapeli/api";
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
  Lightbulb,
  Check,
  Sparkles,
  Wrench,
  Play,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { WorkOrderSheet, type WorkOrderSource } from "@/features/factory/components/anomalies/WorkOrderSheet";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useAiActions, useAiCompletedActions, useAiOpportunity } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import {
  OPPORTUNITY_STATUS_BADGE,
  OPPORTUNITY_STATUS_KEY,
  useLocationPath,
} from "@/features/factory/components/ai/aiShared";

const AIoTOpportunityDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const tt = t as (k: string) => string;
  const ai = useAiText();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const pathOf = useLocationPath();

  const { data: opp, isLoading } = useAiOpportunity(id);
  const completed = useAiCompletedActions("OPPORTUNITY", id);
  const { toggleAction, setOpportunityStatus } = useAiActions();
  const [woOpen, setWoOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState<AiOpportunityStatus>("PLANNED");

  if (isLoading) {
    return (
      <UniformPage>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </UniformPage>
    );
  }

  if (!opp) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("opportunityNotFound")}</p>
        <Button variant="link" onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))} className="mt-2">
          {t("backToAnalyzeTrends")}
        </Button>
      </div>
    );
  }

  const text = ai.opportunity(opp);
  const done = new Set((completed.data ?? []).map((c) => c.code));
  const statusLabel = (s: AiOpportunityStatus) => tt(OPPORTUNITY_STATUS_KEY[s]);
  const first = opp.devices[0];

  const woSource: WorkOrderSource = {
    id: opp.id,
    asset: opp.devices.length === 1 && first ? first.name : text.title,
    devId: first?.id ?? opp.id,
    location: opp.devices.length === 1 && first ? pathOf(first.assetId) : opp.devices.map((d) => d.name).join(", "),
    severity: "Medium",
    suggestedActions: opp.actions.map(ai.action),
    fallbackAction: text.title,
    kind: "forecast",
    deviceId: opp.devices.length === 1 ? first?.id : null,
    assetId: opp.devices.length === 1 ? first?.assetId : null,
  };

  const setStatus = (next: AiOpportunityStatus, title: string) =>
    setOpportunityStatus.mutate(
      { id: opp.id, status: next },
      {
        onSuccess: () => toast({ title, description: text.title }),
        onError: (e) => toast({ title, description: apiErrorMessage(e, title), variant: "destructive" }),
      },
    );

  const toggle = (code: string, isDone: boolean, label: string) =>
    toggleAction.mutate(
      { kind: "OPPORTUNITY", sourceId: opp.id, code, done: !isDone },
      {
        onSuccess: () => toast({ title: isDone ? t("actionUndone") : t("actionAcknowledgedToast"), description: label }),
        onError: (e) => toast({ title: label, description: apiErrorMessage(e, label), variant: "destructive" }),
      },
    );

  return (
    <UniformPage>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/analyze-trends"))} className="cursor-pointer">
                {t("analyzeTrendsLabel")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))} className="cursor-pointer">
                {t("opportunitiesLabel")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{text.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/aiot/analyze-trends?tab=opportunities"))}>
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {text.title}
            </h1>
            <p className="text-xs text-muted-foreground">{text.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{text.category}</Badge>
          <Badge className={OPPORTUNITY_STATUS_BADGE[opp.status]}>{statusLabel(opp.status)}</Badge>
        </div>
      </div>

      {!opp.active && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          {ai.tr("opportunityInactive")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("opportunitySummaryTitle")}</div>
            <Row label={t("titleLabel")} value={text.title} />
            <Row label={t("categoryLabel")} value={text.category} />
            <Row label={ai.tr("signal")} value={`${opp.key} · ${ai.category(opp.keyCategory)}`} />
            <Row label={t("confidence")} value={`${formatNumber(opp.confidence)}%`} />
            <Row label={t("affectedAssets")} value={formatNumber(opp.devices.length)} />
            <Row label={t("statusLabelGeneric")} value={<Badge className={OPPORTUNITY_STATUS_BADGE[opp.status]}>{statusLabel(opp.status)}</Badge>} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("potentialImpactTitle")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border rounded-md p-3">
                <div className="text-[11px] text-muted-foreground">{text.impactLabel}</div>
                <div className="text-2xl font-bold text-emerald-600">{text.impactValue}</div>
              </div>
              <div className="border rounded-md p-3">
                <div className="text-[11px] text-muted-foreground">{t("confidence")}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={opp.confidence} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">{formatNumber(opp.confidence)}%</span>
                </div>
              </div>
              <div className="border rounded-md p-3">
                <div className="text-[11px] text-muted-foreground">{t("estimatedSavingsLabel")}</div>
                <div className="text-sm font-semibold mt-1">{text.estimatedSavings}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("affectedAssets")}</div>
            <div className="border rounded-md divide-y">
              {opp.devices.map((d) => (
                <div key={d.id} className="px-3 py-2 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{pathOf(d.assetId) || "—"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold">{t("aiExplanation")}</div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{text.explanation}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("recommendedActions")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {opp.actions.map((code) => {
                const isDone = done.has(code);
                const label = ai.action(code);
                return (
                  <div
                    key={code}
                    className={`border rounded-md p-3 flex items-center justify-between gap-3 ${isDone ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <span className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{label}</span>
                    <Button
                      size="sm"
                      variant={isDone ? "ghost" : "outline"}
                      className="h-7 text-xs gap-1 shrink-0"
                      disabled={toggleAction.isPending}
                      onClick={() => toggle(code, isDone, label)}
                    >
                      {isDone ? t("undo") : <><Check className="h-3.5 w-3.5" /> {t("acknowledge")}</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("implementationStepsTitle")}</div>
            <ol className="space-y-2">
              {opp.steps.map((code, i) => {
                const isDone = done.has(code);
                const label = ai.step(code);
                return (
                  <li
                    key={code}
                    className={`flex items-center gap-3 border rounded-md p-3 ${isDone ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-full text-xs font-semibold flex items-center justify-center ${isDone ? "bg-emerald-500 text-white" : "bg-muted text-foreground"}`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : formatNumber(i + 1)}
                    </span>
                    <span className={`text-sm flex-1 ${isDone ? "line-through text-muted-foreground" : ""}`}>{label}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={toggleAction.isPending} onClick={() => toggle(code, isDone, label)}>
                      {isDone ? t("undo") : t("markDone")}
                    </Button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        {opp.status !== "DISMISSED" && opp.status !== "IMPLEMENTED" && (
          <Button variant="ghost" className="gap-1.5" onClick={() => setStatus("DISMISSED", t("opportunityDismissedToast"))}>
            <X className="h-4 w-4" /> {t("dismiss")}
          </Button>
        )}
        <Button variant="outline" className="gap-1.5" onClick={() => setWoOpen(true)}>
          <Wrench className="h-4 w-4" /> {t("createWorkOrder")}
        </Button>
        {opp.status === "IN_PROGRESS" ? (
          <Button className="gap-1.5" onClick={() => setStatus("IMPLEMENTED", t("markedImplementedToast"))}>
            <CheckCircle2 className="h-4 w-4" /> {t("markImplementedBtn")}
          </Button>
        ) : opp.status === "IMPLEMENTED" || opp.status === "DISMISSED" ? (
          <Button variant="outline" className="gap-1.5" onClick={() => setStatus("IN_PROGRESS", t("implementationStartedToast"))}>
            <Play className="h-4 w-4" /> {t("reopenImplementationBtn")}
          </Button>
        ) : (
          <Button className="gap-1.5" onClick={() => setStartOpen(true)}>
            <Play className="h-4 w-4" /> {t("startImplementation")}
          </Button>
        )}
      </div>

      <WorkOrderSheet
        open={woOpen}
        onOpenChange={setWoOpen}
        source={woSource}
        onCreated={() => {
          if (opp.status === "NEW") setStatus("PLANNED", statusLabel("PLANNED"));
        }}
      />

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("startImplementation")}</DialogTitle>
            <DialogDescription>{t("startImplementationDesc").replace("{title}", text.title)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">{t("initialStatusLabel")}</div>
            <Select value={planStatus} onValueChange={(v) => setPlanStatus(v as AiOpportunityStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">{t("statusPlanned")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("statusInProgressOpp")}</SelectItem>
                <SelectItem value="IMPLEMENTED">{t("statusImplemented")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">{t("stepsCountLabel")} </span>
                {formatNumber(opp.steps.length)}
              </div>
              <div>
                <span className="text-muted-foreground">{t("affectedAssetsListLabel")} </span>
                {opp.devices.map((d) => d.name).join(", ")}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>{t("cancel")}</Button>
            <Button
              onClick={() => {
                setStatus(planStatus, planStatus === "IMPLEMENTED" ? t("markedImplementedToast") : t("implementationStartedToast"));
                setStartOpen(false);
              }}
            >
              {t("confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniformPage>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="text-sm text-end">{value}</span>
  </div>
);

export default AIoTOpportunityDetails;
