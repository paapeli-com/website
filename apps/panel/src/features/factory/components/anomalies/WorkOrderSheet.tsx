import { useEffect, useState } from "react";
import { useWorkOrders } from "@/features/factory/hooks/useWorkOrders";
import { apiErrorMessage } from "@/shared/lib/apiError";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/features/factory/components/ui/sheet";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import { Wrench } from "lucide-react";
import { useToast } from "@/features/factory/hooks/use-toast";
import { ToastAction } from "@/features/factory/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";

type AnomalySeverity = "Critical" | "High" | "Medium" | "Low";

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
  /** Source category: the order's source (ANOMALY or FORECAST). */
  kind?: "anomaly" | "forecast";
  /** The Paapeli device it is about, so the order links to it. */
  deviceId?: string | null;
  /** The location it is at. */
  assetId?: string | null;
}

interface WorkOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: WorkOrderSource | null;
  onCreated?: () => void;
}

export const WorkOrderSheet = ({
  open,
  onOpenChange,
  source,
  onCreated,
}: WorkOrderSheetProps) => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { create: createWorkOrder } = useWorkOrders();
  const [saving, setSaving] = useState(false);
  const isRtl = language === "fa" || language === "ar";
  const langPrefix = language === "en" ? "" : `/${language}`;

  const src: WorkOrderSource | null = source ?? null;

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

  const handleSubmit = async () => {
    if (!action.trim()) {
      toast({
        title: t("actionRequiredToast"),
        description: t("describeActionDesc"),
        variant: "destructive",
      });
      return;
    }
    if (saving) return;
    setSaving(true);
    let wo;
    try {
      wo = await createWorkOrder({
        anomalyId: src.id,
        source: src.kind === "forecast" ? "FORECAST" : "ANOMALY",
        asset: src.asset,
        location: src.location,
        deviceId: src.deviceId ?? undefined,
        assetId: src.assetId ?? undefined,
        action: action.trim(),
        priority,
        assignedTeam: team,
        notes: notes.trim(),
      });
    } catch (error) {
      toast({ title: t("actionRequiredToast"), description: apiErrorMessage(error, t("actionRequiredToast")), variant: "destructive" });
      return;
    } finally {
      setSaving(false);
    }
    toast({
      title: t("workOrderCreated"),
      description: wo.action,
      action: (
        <ToastAction
          altText={t("view")}
          onClick={() => navigate(`${langPrefix}/work-orders/${wo.id}`)}
        >
          {t("view")}
        </ToastAction>
      ),
    });
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
