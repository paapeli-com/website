import { useState } from "react";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useNavigate, useParams } from "react-router-dom";
import type { WorkOrderApiStatus, WorkOrderEvent } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Textarea } from "@/features/factory/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  ChevronLeft,
  Play,
  Pause,
  CheckCircle2,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  ClipboardList,
  MoreHorizontal,
  Repeat,
  MessageSquare,
  UserPlus,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import {
  STATUS_FROM_API,
  isInHand,
  isOverdue,
  useWorkOrder,
  useWorkOrderActions,
  type WorkOrderStatus,
} from "@/features/factory/hooks/useWorkOrders";
import {
  PRIORITY_BADGE,
  StatusNoteDialog,
  StatusPill,
  useWorkOrderLabels,
  type ExplainedStatus,
} from "@/features/factory/components/workOrders/shared";
import { LocationCell } from "@/features/factory/components/panel/LocationCell";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-end min-w-0 break-words">{value}</span>
  </div>
);

const EVENT_ICON: Record<WorkOrderEvent["type"], typeof Play> = {
  CREATED: PlusCircle,
  STATUS_CHANGED: RefreshCw,
  ASSIGNED: UserPlus,
  UPDATED: Pencil,
  NOTE: MessageSquare,
  REPEATED: Repeat,
};

const WorkOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const labels = useWorkOrderLabels();
  const lp = (p: string) => localizedPath(p, language);
  const { workOrder: wo, events, nameOf, isLoading } = useWorkOrder(id);
  const { update, remove, addNote } = useWorkOrderActions();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ExplainedStatus | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (!wo && isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t("loading")}</div>;
  }

  if (!wo) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("workOrderNotFound")}</p>
        <Button variant="link" onClick={() => navigate(lp("/work-orders"))} className="mt-2">
          {t("backToWorkOrders")}
        </Button>
      </div>
    );
  }

  const fail = (error: unknown) =>
    toast({ title: t("error"), description: apiErrorMessage(error, t("error")), variant: "destructive" });

  const setStatus = async (status: WorkOrderStatus, title: string, why = "") => {
    try {
      await update(wo.id, { status, holdReason: status === "On Hold" ? why : "" });
      // Why it was cancelled, or what was done, belongs in the order's history.
      if (why && status !== "On Hold") await addNote(wo.id, why);
      toast({ title, description: wo.action });
    } catch (error) {
      fail(error);
    }
  };

  const saveNote = async () => {
    if (!note.trim() || savingNote) return;
    setSavingNote(true);
    try {
      await addNote(wo.id, note.trim());
      setNote("");
    } catch (error) {
      fail(error);
    } finally {
      setSavingNote(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await remove(wo.id);
      toast({ title: t("deleted"), description: wo.action });
      navigate(lp("/work-orders"));
    } catch (error) {
      fail(error);
    }
  };

  const statusName = (value?: string | null) =>
    value && value in STATUS_FROM_API ? labels.status(STATUS_FROM_API[value as WorkOrderApiStatus]) : value ?? "";

  const describe = (event: WorkOrderEvent) => {
    switch (event.type) {
      case "CREATED":
        return t("woEvCreated");
      case "STATUS_CHANGED":
        return t("woEvStatus").replace("{from}", statusName(event.fromValue)).replace("{to}", statusName(event.toValue));
      case "ASSIGNED":
        return event.toValue
          ? t("woEvAssigned").replace("{to}", nameOf(event.toValue) || event.toValue)
          : t("woEvUnassigned");
      case "UPDATED":
        return t("woEvUpdated");
      case "REPEATED":
        return t("woEvRepeated").replace("{n}", formatNumber(event.toValue ?? ""));
      case "NOTE":
      default:
        return event.note ?? "";
    }
  };

  const late = isOverdue(wo);
  const inHand = isInHand(wo.status);

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
              <BreadcrumbPage className="truncate max-w-[320px]">{wo.action}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(lp("/work-orders"))}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
          </Button>
          <h1 className="text-lg font-bold truncate flex items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{wo.action}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!!wo.repeatCount && (
            <Badge variant="outline" className="gap-1">
              <Repeat className="h-3 w-3" />
              {t("woRepeats").replace("{n}", formatNumber(wo.repeatCount))}
            </Badge>
          )}
          {late && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{t("woOverdue")}</Badge>}
          <Badge className={PRIORITY_BADGE[wo.priority]}>{labels.priority(wo.priority)}</Badge>
          <StatusPill status={wo.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold text-sm mb-2">{t("summaryLabel")}</div>
            <Row
              label={t("woEquipment")}
              value={
                wo.deviceId ? (
                  <button onClick={() => navigate(lp(`/devices/${wo.deviceId}`))} className="text-primary hover:underline">
                    {wo.asset || t("woOpenDevice")}
                  </button>
                ) : (
                  wo.asset || "—"
                )
              }
            />
            <Row label={t("location")} value={wo.location ? <LocationCell path={wo.location} /> : "—"} />
            <Row label={t("woAssignee")} value={wo.assignee || <span className="text-muted-foreground">{t("woUnassigned")}</span>} />
            <Row label={t("assignedTeam")} value={wo.assignedTeam ? labels.team(wo.assignedTeam) : "—"} />
            <Row
              label={t("woDue")}
              value={wo.dueAt ? <span className={late ? "text-red-600 font-medium" : ""}>{formatDateTime(wo.dueAt, language)}</span> : "—"}
            />
            <Row label={t("woWorkType")} value={wo.workType ? labels.workType(wo.workType) : "—"} />
            <Row label={t("woSource")} value={labels.source(wo.source)} />
            <Row label={t("createdByLabel")} value={wo.createdBy || (wo.source === "ALARM" ? t("woSystem") : "—")} />
            <Row label={t("createdAt")} value={formatDateTime(wo.createdAt, language)} />
            {wo.closedAt && <Row label={t("woClosedAt")} value={formatDateTime(wo.closedAt, language)} />}
            {wo.alarmId && (
              <Row
                label={t("woSourceAlarm")}
                value={
                  <button onClick={() => navigate(lp("/alarms"))} className="text-primary hover:underline">
                    {t("woOpenAlarms")}
                  </button>
                }
              />
            )}
            {wo.anomalyId && wo.source !== "ALARM" && (
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
            <Row label={t("workOrderIdLabel")} value={<span className="font-mono text-xs break-all" dir="ltr">{wo.id}</span>} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              {wo.status === "On Hold" && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                  <div className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">{t("woHoldReason")}</div>
                  <div dir="auto" className="whitespace-pre-wrap break-words">{wo.holdReason || "—"}</div>
                </div>
              )}
              <div className="font-semibold text-sm mb-2">{t("descriptionLabel")}</div>
              <p dir="auto" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                {wo.notes || "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="font-semibold text-sm mb-3">{t("woHistory")}</div>
              <ol className="space-y-3">
                {events.map((event) => {
                  const Icon = EVENT_ICON[event.type] ?? RefreshCw;
                  const isNote = event.type === "NOTE";
                  return (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-muted inline-flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          dir="auto"
                          className={isNote ? "rounded-lg border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap break-words" : "text-sm"}
                        >
                          {describe(event)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {event.actorUserId ? nameOf(event.actorUserId) || "—" : t("woSystem")}
                          {" · "}
                          {formatDateTime(event.createdAt, language)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-4 border-t pt-4">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("woNotePlaceholder")}
                  rows={2}
                  maxLength={4000}
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline" onClick={saveNote} disabled={!note.trim() || savingNote} className="gap-1.5">
                    <MessageSquare className="h-4 w-4" /> {t("woAddNote")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("woMoreActions")} title={t("woMoreActions")}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {inHand && (
              <DropdownMenuItem onClick={() => setNoteTarget("Cancelled")}>
                <X className="h-4 w-4 me-2" /> {t("cancel")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 me-2" /> {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="gap-1.5" onClick={() => navigate(lp(`/work-orders/${wo.id}/edit`))}>
          <Pencil className="h-4 w-4" /> {t("edit")}
        </Button>
        {inHand ? (
          <>
            {(wo.status === "Open" || wo.status === "In Progress") && (
              <Button variant="outline" className="gap-1.5" onClick={() => setNoteTarget("On Hold")}>
                <Pause className="h-4 w-4" /> {t("woHoldAction")}
              </Button>
            )}
            {wo.status !== "In Progress" && (
              <Button variant="outline" className="gap-1.5" onClick={() => setStatus("In Progress", t("startedToast"))}>
                <Play className="h-4 w-4" /> {wo.status === "On Hold" ? t("woResumeAction") : t("startAction")}
              </Button>
            )}
            <Button className="gap-1.5" onClick={() => setNoteTarget("Done")}>
              <CheckCircle2 className="h-4 w-4" /> {t("markDone")}
            </Button>
          </>
        ) : (
          <Button variant="outline" className="gap-1.5" onClick={() => setStatus("Open", t("reopenedToast"))}>
            <Play className="h-4 w-4" /> {t("reopenAction")}
          </Button>
        )}
      </div>

      <StatusNoteDialog
        target={noteTarget}
        onClose={() => setNoteTarget(null)}
        onConfirm={(status, why) =>
          setStatus(
            status,
            status === "Done" ? t("completedToast") : status === "Cancelled" ? t("cancelledToast") : t("woOnHoldToast"),
            why,
          )
        }
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteWorkOrderTitle")}</DialogTitle>
            <DialogDescription>{t("deleteWorkOrderConfirm").replace("{id}", wo.action)}</DialogDescription>
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
