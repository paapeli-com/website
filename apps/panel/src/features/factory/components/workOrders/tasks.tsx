import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import type { WorkOrderTask, WorkOrderTemplate } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  newDraftTask,
  toTaskInputs,
  useWorkOrderTemplates,
  type DraftTask,
} from "@/features/factory/hooks/useWorkOrderTasks";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";

const MAX_TASKS = 50;

/** The tasks of an order or a template while a form edits them. */
export const TaskListEditor = ({
  tasks,
  onChange,
  disabled,
}: {
  tasks: DraftTask[];
  onChange: (tasks: DraftTask[]) => void;
  disabled?: boolean;
}) => {
  const { t } = useLanguage();
  const set = (key: string, patch: Partial<DraftTask>) =>
    onChange(tasks.map((task) => (task.key === key ? { ...task, ...patch } : task)));
  const move = (index: number, by: number) => {
    const next = [...tasks];
    const [task] = next.splice(index, 1);
    next.splice(index + by, 0, task);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div key={task.key} className="flex items-center gap-2">
          <Input
            value={task.title}
            onChange={(e) => set(task.key, { title: e.target.value })}
            placeholder={t("woTaskPlaceholder")}
            maxLength={500}
            disabled={disabled}
            className="flex-1"
          />
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={task.required}
              onCheckedChange={(c) => set(task.key, { required: !!c })}
              disabled={disabled}
            />
            {t("woTaskRequired")}
          </label>
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-7" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-7" disabled={disabled || index === tasks.length - 1} onClick={() => move(index, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-7 text-muted-foreground hover:text-destructive"
              aria-label={t("woRemove")}
              title={t("woRemove")}
              disabled={disabled}
              onClick={() => onChange(tasks.filter((x) => x.key !== task.key))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || tasks.length >= MAX_TASKS}
        onClick={() => onChange([...tasks, newDraftTask()])}
      >
        <Plus className="h-4 w-4" /> {t("woAddTask")}
      </Button>
    </div>
  );
};

/** An order's tasks as the person doing the work ticks them off. */
export const TaskChecklist = ({
  tasks,
  onToggle,
  nameOf,
  disabled,
}: {
  tasks: WorkOrderTask[];
  onToggle: (task: WorkOrderTask, done: boolean) => void;
  nameOf: (userId?: string | null) => string;
  disabled?: boolean;
}) => {
  const { t } = useLanguage();
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <label
            className={cn(
              "flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/40",
              disabled ? "cursor-default" : "cursor-pointer",
            )}
          >
            <Checkbox
              className="mt-0.5"
              checked={task.done}
              disabled={disabled}
              onCheckedChange={(c) => onToggle(task, !!c)}
            />
            <span className="min-w-0 flex-1">
              <span dir="auto" className={cn("block text-sm break-words", task.done && "text-muted-foreground line-through")}>
                {task.title}
              </span>
              {task.done && nameOf(task.doneByUserId) && (
                <span className="block text-[11px] text-muted-foreground">{nameOf(task.doneByUserId)}</span>
              )}
            </span>
            {!task.required && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t("woTaskOptional")}
              </span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
};

/**
 * The workspace's templates: a list to pick from, and a form for the one
 * being written. A template is only a name and its tasks.
 */
export const TemplatesDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t, isRTL, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { templates, isLoading, save, remove } = useWorkOrderTemplates(open);
  /** The template in the form: "new" for one not saved yet, null for the list. */
  const [editing, setEditing] = useState<WorkOrderTemplate | "new" | null>(null);
  const [name, setName] = useState("");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setEditing(null); }, [open]);

  const edit = (template: WorkOrderTemplate | "new") => {
    setEditing(template);
    setName(template === "new" ? "" : template.name);
    setTasks(
      template === "new"
        ? [newDraftTask()]
        : template.tasks.map((task) => newDraftTask(task.title, task.required)),
    );
  };

  const fail = (error: unknown) =>
    toast({ title: t("error"), description: apiErrorMessage(error, t("error")), variant: "destructive" });

  const handleSave = async () => {
    if (!editing || busy || !name.trim()) return;
    setBusy(true);
    try {
      await save({ name: name.trim(), tasks: toTaskInputs(tasks) }, editing === "new" ? undefined : editing.id);
      toast({ title: t("woTemplateSaved"), description: name.trim() });
      setEditing(null);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (template: WorkOrderTemplate) => {
    if (busy) return;
    setBusy(true);
    try {
      await remove(template.id);
      toast({ title: t("woTemplateDeleted"), description: template.name });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{editing ? (editing === "new" ? t("woNewTemplate") : editing.name) : t("woTemplates")}</DialogTitle>
          <DialogDescription>{t("woTemplatesDesc")}</DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">{t("woTemplateName")} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoFocus />
            </div>
            <div>
              <Label className="text-xs">{t("woTasks")}</Label>
              <TaskListEditor tasks={tasks} onChange={setTasks} disabled={busy} />
            </div>
          </div>
        ) : isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground max-w-xs">{t("woNoTemplatesYet")}</p>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center gap-3 px-3 py-2.5">
                <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div dir="auto" className="text-sm font-medium truncate">{template.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("woTaskCount").replace("{n}", formatNumber(template.tasks.length))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("edit")} title={t("edit")} onClick={() => edit(template)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={t("delete")}
                  title={t("delete")}
                  disabled={busy}
                  onClick={() => handleDelete(template)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>{t("back")}</Button>
              <Button onClick={handleSave} disabled={busy || !name.trim()}>{busy ? t("saving") : t("save")}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>{t("close")}</Button>
              <Button onClick={() => edit("new")} className="gap-1.5">
                <Plus className="h-4 w-4" /> {t("woNewTemplate")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
