import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { ChevronLeft, Wrench } from "lucide-react";
import {
  useWorkOrders,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/features/factory/hooks/useWorkOrders";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const WorkOrderForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => localizedPath(p, language);
  const { getById, create, update } = useWorkOrders();

  const existing = isEdit ? getById(id) : undefined;

  const [asset, setAsset] = useState("");
  const [location, setLocation] = useState("");
  const [action, setAction] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("Medium");
  const [status, setStatus] = useState<WorkOrderStatus>("Open");
  const [team, setTeam] = useState("mechanical");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setAsset(existing.asset);
      setLocation(existing.location);
      setAction(existing.action);
      setPriority(existing.priority);
      setStatus(existing.status);
      setTeam(existing.assignedTeam);
      setNotes(existing.notes);
    }
  }, [existing?.id]);

  const validate = () => {
    if (!asset.trim()) return t("assetRequired");
    if (!location.trim()) return t("locationRequired");
    if (!action.trim()) return t("actionRequiredField");
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      toast({ title: t("actionRequiredToast"), description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && existing) {
        update(existing.id, {
          asset: asset.trim(),
          location: location.trim(),
          action: action.trim(),
          priority,
          status,
          assignedTeam: team,
          notes: notes.trim(),
        });
        toast({ title: t("workOrderUpdated"), description: existing.id });
        navigate(lp(`/work-orders/${existing.id}`));
      } else {
        const wo = create({
          asset: asset.trim(),
          location: location.trim(),
          action: action.trim(),
          priority,
          assignedTeam: team,
          notes: notes.trim(),
        });
        toast({ title: t("workOrderCreated"), description: `${wo.id} · ${wo.action}` });
        navigate(lp("/work-orders"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(lp("/work-orders"))} className="cursor-pointer">
                {t("workOrders")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isEdit ? `${t("edit")} ${existing?.id ?? ""}` : t("newWorkOrder")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={() => navigate(lp("/work-orders"))}
        >
          <ChevronLeft className="h-4 w-4" /> {t("back")}
        </Button>
        <h1 className="text-lg font-bold">{isEdit ? t("editWorkOrder") : t("newWorkOrder")}</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t("assetLabel")} *</Label>
              <Input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder={t("assetPlaceholder")}
              />
            </div>
            <div>
              <Label className="text-xs">{t("location")} *</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("locationPlaceholderWO")}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">{t("actionLabel")} *</Label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder={t("actionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">{t("priorityLabel")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
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
            {isEdit && (
              <div>
                <Label className="text-xs">{t("status")}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as WorkOrderStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">{t("woStatusOpen")}</SelectItem>
                    <SelectItem value="In Progress">{t("woStatusInProgress")}</SelectItem>
                    <SelectItem value="Done">{t("woStatusDone")}</SelectItem>
                    <SelectItem value="Cancelled">{t("woStatusCancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">{t("notesLabel")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("additionalContextPlaceholder")}
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(lp("/work-orders"))}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={submitting} className="gap-1.5">
          <Wrench className="h-4 w-4" />
          {isEdit ? t("saveChanges") : t("createWorkOrder")}
        </Button>
      </div>
    </>
  );
};

export default WorkOrderForm;
