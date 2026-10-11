import { apiErrorMessage } from "@/shared/lib/apiError";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useListWorkspaceMembersQuery, type WorkOrderApiWorkType } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
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
import { BellRing, ChevronLeft, Wrench } from "lucide-react";
import {
  useWorkOrder,
  useWorkOrderActions,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/features/factory/hooks/useWorkOrders";
import {
  PRIORITIES,
  STATUSES,
  SearchSelect,
  TEAMS,
  WORK_TYPES,
  useWorkOrderLabels,
} from "@/features/factory/components/workOrders/shared";
import { DueDatePicker } from "@/features/factory/components/workOrders/DueDatePicker";
import { TaskListEditor } from "@/features/factory/components/workOrders/tasks";
import {
  newDraftTask,
  toTaskInputs,
  useWorkOrderTasks,
  useWorkOrderTemplates,
  type DraftTask,
} from "@/features/factory/hooks/useWorkOrderTasks";
import { localizedPath } from "@/features/factory/lib/localizedPath";

/* Select needs a non-empty value for "none of them". */
const NO_TEAM = "none";
const NO_TYPE = "none";
const NO_TEMPLATE = "none";

const WorkOrderForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const labels = useWorkOrderLabels();
  const lp = (p: string) => localizedPath(p, language);
  const workspaceId = useWorkspaceId() ?? "";

  const { workOrder: existing, isLoading } = useWorkOrder(id);
  const { create, update } = useWorkOrderActions();
  const { items: devices } = useDevices();
  const { options: locations } = useAssetLocations();
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);
  const { templates } = useWorkOrderTemplates();
  const existingTasks = useWorkOrderTasks(id);

  /* Another page can hand over what it already knows: the alarms list sends
     the alarm, its device and a title, so the order starts filled in. */
  const fromAlarmId = params.get("alarmId") ?? "";

  const [action, setAction] = useState(params.get("title") ?? "");
  const [deviceId, setDeviceId] = useState(params.get("deviceId") ?? "");
  const [assetId, setAssetId] = useState("");
  /* What the order was saved with, kept for an order whose device or location
     has since been deleted: the names still read, though nothing is selected. */
  const [assetLabel, setAssetLabel] = useState(params.get("asset") ?? "");
  const [locationLabel, setLocationLabel] = useState(params.get("location") ?? "");
  const [priority, setPriority] = useState<WorkOrderPriority>(
    PRIORITIES.includes(params.get("priority") as WorkOrderPriority) ? (params.get("priority") as WorkOrderPriority) : "Medium",
  );
  const [status, setStatus] = useState<WorkOrderStatus>("Open");
  const [assignee, setAssignee] = useState("");
  const [team, setTeam] = useState(NO_TEAM);
  const [workType, setWorkType] = useState<string>(fromAlarmId ? "REACTIVE" : NO_TYPE);
  const [dueAt, setDueAt] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState(NO_TEMPLATE);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // An order being edited shows the tasks it has; their ids keep what was done.
  useEffect(() => {
    if (!isEdit || existingTasks.isLoading) return;
    setTasks(existingTasks.tasks.map((task) => newDraftTask(task.title, task.required, task.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingTasks.isLoading]);

  /* A template only fills the list in: the tasks can still be changed, and
     the order keeps its own copy of them. */
  const chooseTemplate = (next: string) => {
    setTemplateId(next);
    const template = templates.find((x) => x.id === next);
    if (template) setTasks(template.tasks.map((task) => newDraftTask(task.title, task.required)));
  };

  // The order loads from the server: an edit opened directly fills in once it arrives.
  useEffect(() => {
    if (!existing) return;
    setAction(existing.action);
    setDeviceId(existing.deviceId ?? "");
    setAssetId(existing.assetId ?? "");
    setAssetLabel(existing.asset);
    setLocationLabel(existing.location);
    setPriority(existing.priority);
    setStatus(existing.status);
    setAssignee(existing.assigneeUserId ?? "");
    setTeam(existing.assignedTeam || NO_TEAM);
    setWorkType(existing.workType ?? NO_TYPE);
    setDueAt(existing.dueAt ?? "");
    setHoldReason(existing.holdReason ?? "");
    setNotes(existing.notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id, existing?.updatedAt]);

  const deviceOptions = useMemo(
    () => devices.map((d) => ({ value: d.id, label: d.name, hint: d.location })),
    [devices],
  );
  const locationOptions = useMemo(() => locations.map((l) => ({ value: l.id, label: l.path })), [locations]);
  const memberOptions = useMemo(
    () => (members.data?.data ?? [])
      .filter((m) => m.status === "ACTIVE" || m.userId === assignee)
      .map((m) => ({
        value: m.userId,
        label: m.displayName?.trim() || m.email || m.userId,
        hint: m.displayName?.trim() ? m.email ?? undefined : undefined,
      })),
    [members.data, assignee],
  );

  const device = devices.find((d) => d.id === deviceId);

  /* A device sits at one place in the location tree, so choosing it settles
     the location too; the location can still be changed afterwards. */
  const chooseDevice = (next: string) => {
    setDeviceId(next);
    const chosen = devices.find((d) => d.id === next);
    if (chosen) {
      setAssetLabel(chosen.name);
      if (chosen.assetId) {
        setAssetId(chosen.assetId);
        setLocationLabel(chosen.location ?? "");
      }
    } else {
      setAssetLabel("");
    }
  };

  // A device handed over in the address fills its location in once the list is here.
  useEffect(() => {
    if (!isEdit && deviceId && device && !assetId) chooseDevice(deviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id]);

  const chooseLocation = (next: string) => {
    setAssetId(next);
    setLocationLabel(locations.find((l) => l.id === next)?.path ?? "");
  };

  const knownTeam = team === NO_TEAM || (TEAMS as readonly string[]).includes(team);

  const handleSave = async () => {
    if (!action.trim()) {
      toast({ title: t("actionRequiredToast"), description: t("actionRequiredField"), variant: "destructive" });
      return;
    }
    if (status === "On Hold" && !holdReason.trim()) {
      toast({ title: t("actionRequiredToast"), description: t("woReasonRequired"), variant: "destructive" });
      return;
    }
    const fields = {
      action: action.trim(),
      asset: device?.name ?? assetLabel,
      location: locations.find((l) => l.id === assetId)?.path ?? locationLabel,
      deviceId: deviceId || undefined,
      assetId: assetId || undefined,
      priority,
      assigneeUserId: assignee || undefined,
      assignedTeam: team === NO_TEAM ? "" : team,
      workType: workType === NO_TYPE ? undefined : (workType as WorkOrderApiWorkType),
      dueAt: dueAt || undefined,
      notes: notes.trim(),
    };
    setSubmitting(true);
    try {
      if (isEdit && existing) {
        // Tasks first: finishing the order is refused while a required one is not done.
        await existingTasks.replace(existing.id, toTaskInputs(tasks));
        await update(existing.id, { ...fields, status, holdReason: status === "On Hold" ? holdReason.trim() : "" });
        toast({ title: t("workOrderUpdated"), description: fields.action });
        navigate(lp(`/work-orders/${existing.id}`));
      } else {
        const created = await create(
          {
            ...fields,
            ...(fromAlarmId ? { alarmId: fromAlarmId, source: "ALARM" as const } : {}),
          },
          toTaskInputs(tasks),
        );
        toast({ title: t("workOrderCreated"), description: created.title });
        navigate(lp(fromAlarmId ? `/work-orders/${created.id}` : "/work-orders"));
      }
    } catch (error) {
      // The server said why (a field too long, no permission): show that.
      toast({ title: t("actionRequiredToast"), description: apiErrorMessage(error, t("actionRequiredToast")), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t("loading")}</div>;
  }

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
              <BreadcrumbPage>{isEdit ? existing?.action ?? t("editWorkOrder") : t("newWorkOrder")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
        </Button>
        <h1 className="text-lg font-bold">{isEdit ? t("editWorkOrder") : t("newWorkOrder")}</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4 max-w-3xl">
          {(fromAlarmId || existing?.alarmId) && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <BellRing className="h-4 w-4 shrink-0 text-primary" />
              <span>{t("woFromAlarmHint")}</span>
            </div>
          )}

          <div>
            <Label className="text-xs">{t("woTitleLabel")} *</Label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder={t("actionPlaceholder")}
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t("woEquipment")}</Label>
              <SearchSelect
                value={deviceId}
                onChange={chooseDevice}
                options={deviceOptions}
                placeholder={!deviceId && assetLabel ? assetLabel : t("woSelectDevice")}
                searchPlaceholder={t("woSearchDevice")}
                emptyLabel={t("woNothingFound")}
                noneLabel={t("woNone")}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("woDeviceHint")}</p>
            </div>
            <div>
              <Label className="text-xs">{t("location")}</Label>
              <SearchSelect
                value={assetId}
                onChange={chooseLocation}
                options={locationOptions}
                placeholder={!assetId && locationLabel ? locationLabel : t("woSelectLocation")}
                searchPlaceholder={t("woSearchLocation")}
                emptyLabel={t("woNothingFound")}
                noneLabel={t("woNone")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">{t("priorityLabel")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{labels.priority(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("woWorkType")}</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TYPE}>{t("woNone")}</SelectItem>
                  {WORK_TYPES.map((w) => <SelectItem key={w} value={w}>{labels.workType(w)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("woDue")}</Label>
              <DueDatePicker value={dueAt} onChange={setDueAt} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">{t("woAssignee")}</Label>
              <SearchSelect
                value={assignee}
                onChange={setAssignee}
                options={memberOptions}
                placeholder={t("woUnassigned")}
                searchPlaceholder={t("woSearchMember")}
                emptyLabel={t("woNothingFound")}
                noneLabel={t("woUnassigned")}
              />
            </div>
            <div>
              <Label className="text-xs">{t("assignedTeam")}</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEAM}>{t("ruleWorkOrderNoTeam")}</SelectItem>
                  {TEAMS.map((key) => <SelectItem key={key} value={key}>{labels.team(key)}</SelectItem>)}
                  {!knownTeam && <SelectItem value={team}>{team}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div>
                <Label className="text-xs">{t("status")}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as WorkOrderStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{labels.status(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isEdit && status === "On Hold" && (
            <div>
              <Label className="text-xs">{t("woHoldReason")} *</Label>
              <Input value={holdReason} onChange={(e) => setHoldReason(e.target.value)} maxLength={500} />
            </div>
          )}

          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="text-sm font-medium">{t("woTasks")}</Label>
              <div className="w-full sm:w-64">
                <Select value={templateId} onValueChange={chooseTemplate} disabled={templates.length === 0}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}>{t("woFromTemplate")}</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TaskListEditor tasks={tasks} onChange={setTasks} disabled={submitting} />
            <p className="text-[11px] text-muted-foreground">{t("woTasksHint")}</p>
          </div>

          <div>
            <Label className="text-xs">{t("descriptionLabel")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("additionalContextPlaceholder")}
              rows={5}
              maxLength={4000}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-background border-t flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
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
