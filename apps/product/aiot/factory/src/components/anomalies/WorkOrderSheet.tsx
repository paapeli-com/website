import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useAnomalyStore,
  type Anomaly,
  type AnomalySeverity,
} from "@/hooks/useAnomalyStore";

export interface WorkOrderSource {
  /** Unique source id. For anomalies this is the anomaly id; for forecasts use the device id. */
  id: string;
  asset: string;
  devId: string;
  location: string;
  /** Used to seed the priority dropdown. */
  severity: AnomalySeverity;
  /** Recommended actions to populate the action dropdown. */
  suggestedActions: string[];
  /** Fallback action text when there are no suggestions. */
  fallbackAction?: string;
  /** Source category; only "anomaly" triggers anomaly status updates. */
  kind?: "anomaly" | "forecast";
}

interface WorkOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Generic source. Preferred. */
  source?: WorkOrderSource | null;
  /** Legacy: pass an anomaly directly. */
  anomaly?: Anomaly | null;
  onCreated?: () => void;
}

const fromAnomaly = (a: Anomaly): WorkOrderSource => ({
  id: a.id,
  asset: a.asset,
  devId: a.devId,
  location: a.location,
  severity: a.severity,
  suggestedActions: a.suggestedActions,
  fallbackAction: `Investigate ${a.anomaly.toLowerCase()}`,
  kind: "anomaly",
});

export const WorkOrderSheet = ({
  open,
  onOpenChange,
  source,
  anomaly,
  onCreated,
}: WorkOrderSheetProps) => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { createWorkOrder, updateStatus } = useAnomalyStore();
  const isRtl = language === "fa" || language === "ar";
  const langPrefix = language === "en" ? "" : `/${language}`;

  const src: WorkOrderSource | null =
    source ?? (anomaly ? fromAnomaly(anomaly) : null);

  const CUSTOM = "__custom__";
  const [action, setAction] = useState("");
  const [actionChoice, setActionChoice] = useState<string>("");
  const [customAction, setCustomAction] = useState("");
  const [priority, setPriority] = useState<AnomalySeverity>("High");
  const [team, setTeam] = useState("mechanical");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && src) {
      const first = src.suggestedActions[0] || src.fallbackAction || "";
      setAction(first);
      setActionChoice(src.suggestedActions.length > 0 ? first : CUSTOM);
      setCustomAction(src.suggestedActions.length > 0 ? "" : first);
      setPriority(src.severity);
      setTeam("mechanical");
      setNotes("");
    }
  }, [open, src?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!src) return null;

  const handleSubmit = () => {
    if (!action.trim()) {
      toast({
        title: t("actionRequiredToast"),
        description: t("describeActionDesc"),
        variant: "destructive",
      });
      return;
    }
    const wo = createWorkOrder({
      anomalyId: src.id,
      asset: src.asset,
      location: src.location,
      action: action.trim(),
      priority,
      assignedTeam: team,
      notes: notes.trim(),
    });
    toast({
      title: t("workOrderCreated"),
      description: `${wo.id} · ${wo.action}`,
      action: (
        <ToastAction
          altText={t("view")}
          onClick={() => navigate(`${langPrefix}/work-orders/${wo.id}`)}
        >
          {t("view")}
        </ToastAction>
      ),
    });
    if (src.kind === "anomaly" && anomaly && anomaly.status === "Open") {
      updateStatus(anomaly.id, "Investigating");
    }
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full sm:max-w-md flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>{t("createWorkOrder")}</SheetTitle>
          <SheetDescription>
            {src.asset} · {src.devId}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1">
          <div>
            <Label className="text-xs">{t("assetLabel")}</Label>
            <Input value={src.asset} readOnly />
          </div>
          <div>
            <Label className="text-xs">{t("location")}</Label>
            <Input value={src.location} readOnly />
          </div>
          <div>
            <Label className="text-xs">{t("actionLabel")}</Label>
            {src.suggestedActions.length > 0 ? (
              <>
                <Select
                  value={actionChoice}
                  onValueChange={(v) => {
                    setActionChoice(v);
                    if (v === CUSTOM) {
                      setAction(customAction);
                    } else {
                      setAction(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRecommendedAction")} />
                  </SelectTrigger>
                  <SelectContent>
                    {src.suggestedActions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM}>{t("customEllipsis")}</SelectItem>
                  </SelectContent>
                </Select>
                {actionChoice === CUSTOM && (
                  <Input
                    className="mt-2"
                    autoFocus
                    placeholder={t("describeWorkOrderTask")}
                    value={customAction}
                    onChange={(e) => {
                      setCustomAction(e.target.value);
                      setAction(e.target.value);
                    }}
                  />
                )}
              </>
            ) : (
              <Input value={action} onChange={(e) => setAction(e.target.value)} />
            )}
          </div>
          <div>
            <Label className="text-xs">{t("priorityLabel")}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as AnomalySeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">{t("woPriorityCritical")}</SelectItem>
                <SelectItem value="High">{t("woPriorityHigh")}</SelectItem>
                <SelectItem value="Medium">{t("woPriorityMedium")}</SelectItem>
                <SelectItem value="Low">{t("woPriorityLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("assignedTeam")}</Label>
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanical">{t("teamMechanical")}</SelectItem>
                <SelectItem value="electrical">{t("teamElectrical")}</SelectItem>
                <SelectItem value="instrumentation">{t("teamInstrumentation")}</SelectItem>
                <SelectItem value="operations">{t("teamOperations")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("notesLabel")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("additionalContextPlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} className="gap-1.5">
            <Wrench className="h-4 w-4" /> {t("createWorkOrder")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
