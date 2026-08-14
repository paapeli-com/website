import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { OPPORTUNITIES, type Opportunity } from "@/data/trends";
import { WorkOrderSheet, type WorkOrderSource } from "@/components/anomalies/WorkOrderSheet";
import {
  useOpportunityStore,
  OPPORTUNITY_STATUS_BADGE,
  type OpportunityStatus,
} from "@/hooks/useOpportunityStore";

const AIoTOpportunityDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, formatNumber, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const opp: Opportunity | undefined = useMemo(
    () => OPPORTUNITIES.find((o) => o.id === id),
    [id],
  );

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [stepsDone, setStepsDone] = useState<Record<number, boolean>>({});
  const [woOpen, setWoOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState<OpportunityStatus>("Planned");
  const { getStatus, setStatus } = useOpportunityStore();
  const currentStatus = opp ? getStatus(opp.id) : "New";

  const statusLabel = (s: OpportunityStatus) => {
    switch (s) {
      case "Planned": return t("statusPlanned");
      case "In Progress": return t("statusInProgressOpp");
      case "Implemented": return t("statusImplemented");
      case "Dismissed": return t("statusDismissedOpt");
      default: return s;
    }
  };

  const woSource: WorkOrderSource | null = opp
    ? {
        id: opp.id,
        asset: opp.affectedAssets[0] || opp.title,
        devId: opp.id,
        location: opp.affectedAssets.join(", "),
        severity: "Medium",
        suggestedActions: opp.recommendedActions,
        fallbackAction: `Implement ${opp.title}`,
        kind: "forecast",
      }
    : null;

  const handleStartImplementation = (next: OpportunityStatus) => {
    if (!opp) return;
    setStatus(opp.id, next);
    toast({
      title: next === "Implemented" ? t("markedImplementedToast") : t("implementationStartedToast"),
      description: opp.title,
    });
    setStartOpen(false);
  };

  const handleDismiss = () => {
    if (!opp) return;
    setStatus(opp.id, "Dismissed");
    toast({ title: t("opportunityDismissedToast"), description: opp.title });
  };


  if (!opp) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("opportunityNotFound")}</p>
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
                {t("opportunitiesLabel")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{opp.title}</BreadcrumbPage>
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
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {opp.title}
            </h1>
            <p className="text-xs text-muted-foreground">{opp.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{opp.category}</Badge>
          <Badge className={OPPORTUNITY_STATUS_BADGE[currentStatus]}>{statusLabel(currentStatus)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">{t("opportunitySummaryTitle")}</div>
            <Row label={t("titleLabel")} value={opp.title} />
            <Row label={t("categoryLabel")} value={opp.category} />
            <Row label={t("confidence")} value={`${formatNumber(opp.confidence)}%`} />
            <Row label={t("affectedAssets")} value={`${formatNumber(opp.affectedAssets.length)}`} />
            <Row
              label={t("statusLabelGeneric")}
              value={<Badge className={OPPORTUNITY_STATUS_BADGE[currentStatus]}>{statusLabel(currentStatus)}</Badge>}
            />
          </CardContent>
        </Card>

        {/* Potential Impact + Estimated Savings */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("potentialImpactTitle")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border rounded-md p-3">
                <div className="text-[11px] text-muted-foreground">{opp.impactLabel}</div>
                <div className="text-2xl font-bold text-emerald-600">{opp.impactValue}</div>
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
                <div className="text-sm font-semibold mt-1">{opp.estimatedSavings}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affected Assets */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("affectedAssets")}</div>
            <div className="border rounded-md divide-y">
              {opp.affectedAssets.map((a) => (
                <div key={a} className="px-3 py-2 text-sm">{a}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Explanation */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold">{t("aiExplanation")}</div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {opp.explanation}
            </p>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("recommendedActions")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {opp.recommendedActions.map((r) => {
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

        {/* Implementation Steps */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="font-semibold mb-3">{t("implementationStepsTitle")}</div>
            <ol className="space-y-2">
              {opp.implementationSteps.map((s, i) => {
                const done = !!stepsDone[i];
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 border rounded-md p-3 ${done ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40" : ""}`}
                  >
                    <span
                      className={`h-6 w-6 shrink-0 rounded-full text-xs font-semibold flex items-center justify-center ${done ? "bg-emerald-500 text-white" : "bg-muted text-foreground"}`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : formatNumber(i + 1)}
                    </span>
                    <span
                      className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {s}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setStepsDone((p) => ({ ...p, [i]: !p[i] }))}
                    >
                      {done ? t("undo") : t("markDone")}
                    </Button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        {currentStatus !== "Dismissed" && currentStatus !== "Implemented" && (
          <Button variant="ghost" className="gap-1.5" onClick={handleDismiss}>
            <X className="h-4 w-4" /> {t("dismiss")}
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => setWoOpen(true)}
        >
          <Wrench className="h-4 w-4" /> {t("createWorkOrder")}
        </Button>
        {currentStatus === "In Progress" ? (
          <Button
            className="gap-1.5"
            onClick={() => handleStartImplementation("Implemented")}
          >
            <CheckCircle2 className="h-4 w-4" /> {t("markImplementedBtn")}
          </Button>
        ) : currentStatus === "Implemented" ? (
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => handleStartImplementation("In Progress")}
          >
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
          if (currentStatus === "New") setStatus(opp.id, "Planned");
        }}
      />

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("startImplementation")}</DialogTitle>
            <DialogDescription>
              {t("startImplementationDesc").replace("{title}", opp.title)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">{t("initialStatusLabel")}</div>
            <Select
              value={planStatus}
              onValueChange={(v) => setPlanStatus(v as OpportunityStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planned">{t("statusPlanned")}</SelectItem>
                <SelectItem value="In Progress">{t("statusInProgressOpp")}</SelectItem>
                <SelectItem value="Implemented">{t("statusImplemented")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">{t("stepsCountLabel")} </span>
                {formatNumber(opp.implementationSteps.length)}
              </div>
              <div>
                <span className="text-muted-foreground">{t("affectedAssetsListLabel")} </span>
                {opp.affectedAssets.join(", ")}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => handleStartImplementation(planStatus)}>
              {t("confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

const Row = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="text-sm text-end">{value}</span>
  </div>
);

export default AIoTOpportunityDetails;
