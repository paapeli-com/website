import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  Play,
  CheckCircle2,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import {
  useWorkOrders,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/hooks/useWorkOrders";

const PRIORITY_BADGE: Record<WorkOrderPriority, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const STATUS_BADGE: Record<WorkOrderStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Cancelled: "bg-muted text-muted-foreground",
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm text-end">{value}</span>
  </div>
);

const WorkOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);
  const { getById, update, remove } = useWorkOrders();

  const wo = getById(id);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const priorityLabel = (p: WorkOrderPriority) =>
    ({
      Critical: t("woPriorityCritical"),
      High: t("woPriorityHigh"),
      Medium: t("woPriorityMedium"),
      Low: t("woPriorityLow"),
    }[p]);

  const statusLabel = (s: WorkOrderStatus) =>
    ({
      Open: t("woStatusOpen"),
      "In Progress": t("woStatusInProgress"),
      Done: t("woStatusDone"),
      Cancelled: t("woStatusCancelled"),
    }[s]);

  const teamLabel = (team: string) =>
    ({
      mechanical: t("teamMechanical"),
      electrical: t("teamElectrical"),
      instrumentation: t("teamInstrumentation"),
      operations: t("teamOperations"),
    }[team] || team);

  if (!wo) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("workOrderNotFound")}</p>
          <Button variant="link" onClick={() => navigate(lp("/work-orders"))} className="mt-2">
            {t("backToWorkOrders")}
          </Button>
        </div>
      </>
    );
  }

  const setStatus = (s: WorkOrderStatus, title: string) => {
    update(wo.id, { status: s });
    toast({ title, description: wo.id });
  };

  const confirmDelete = () => {
    remove(wo.id);
    toast({ title: t("deleted"), description: wo.id });
    navigate(lp("/work-orders"));
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
              <BreadcrumbPage>{wo.id}</BreadcrumbPage>
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
            onClick={() => navigate(lp("/work-orders"))}
          >
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-2 underline underline-offset-4">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              {wo.action}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={PRIORITY_BADGE[wo.priority]}>{priorityLabel(wo.priority)}</Badge>
          <Badge className={STATUS_BADGE[wo.status]}>{statusLabel(wo.status)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold text-sm mb-2">{t("summaryLabel")}</div>
            <Row label={t("workOrderIdLabel")} value={<span className="font-mono">{wo.id}</span>} />
            <Row label={t("assetLabel")} value={wo.asset} />
            <Row label={t("location")} value={wo.location} />
            <Row label={t("priorityLabel")} value={<Badge className={PRIORITY_BADGE[wo.priority]}>{priorityLabel(wo.priority)}</Badge>} />
            <Row label={t("status")} value={<Badge className={STATUS_BADGE[wo.status]}>{statusLabel(wo.status)}</Badge>} />
            <Row label={t("assignedTeam")} value={teamLabel(wo.assignedTeam)} />
            <Row label={t("createdByLabel")} value={wo.createdBy === "You" ? t("you") : wo.createdBy} />
            <Row label={t("createdAt")} value={new Date(wo.createdAt).toLocaleString(language === "fa" ? "fa-IR" : language === "ar" ? "ar-EG" : "en-US")} />
            {wo.anomalyId && (
              <Row
                label={t("sourceAnomaly")}
                value={
                  <button
                    onClick={() => navigate(lp(`/aiot/detect-anomalies/${wo.anomalyId}`))}
                    className="text-primary hover:underline"
                  >
                    {wo.anomalyId}
                  </button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="font-semibold text-sm mb-2">{t("actionLabel")}</div>
            <p className="text-sm">{wo.action}</p>
            <div className="font-semibold text-sm mt-4 mb-2">{t("notesLabel")}</div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {wo.notes || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate(lp(`/work-orders/${wo.id}/edit`))}
        >
          <Pencil className="h-4 w-4" /> {t("edit")}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={wo.status !== "Open"}
          onClick={() => setStatus("In Progress", t("startedToast"))}
        >
          <Play className="h-4 w-4" /> {t("startAction")}
        </Button>
        {wo.status === "Cancelled" || wo.status === "Done" ? (
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setStatus("Open", t("reopenedToast"))}
          >
            <Play className="h-4 w-4" /> {t("reopenAction")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setStatus("Cancelled", t("cancelledToast"))}
          >
            <X className="h-4 w-4" /> {t("cancel")}
          </Button>
        )}
        <Button
          className="gap-1.5"
          disabled={wo.status === "Done" || wo.status === "Cancelled"}
          onClick={() => setStatus("Done", t("completedToast"))}
        >
          <CheckCircle2 className="h-4 w-4" /> {t("markDone")}
        </Button>
        <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" /> {t("delete")}
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteWorkOrderTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteWorkOrderConfirm").replace("{id}", wo.id)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderDetails;
