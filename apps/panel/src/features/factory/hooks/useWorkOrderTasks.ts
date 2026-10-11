import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  workOrderTaskService,
  workOrderTemplateService,
  type WorkOrderTask,
  type WorkOrderTaskInput,
  type WorkOrderTemplateRequest,
} from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

/** A task while a form is editing it: `key` only tells the rows apart. */
export interface DraftTask {
  key: string;
  /** Set for a task the order already has, so what was done on it is kept. */
  id?: string;
  title: string;
  required: boolean;
}

let draftCounter = 0;
export const newDraftTask = (title = "", required = true, id?: string): DraftTask => ({
  key: `task-${++draftCounter}`,
  id,
  title,
  required,
});

/** The drafts worth sending: the ones with a title. */
export const toTaskInputs = (drafts: DraftTask[]): WorkOrderTaskInput[] =>
  drafts
    .filter((d) => d.title.trim())
    .map((d) => ({ ...(d.id ? { id: d.id } : {}), title: d.title.trim(), required: d.required }));

const templatesKey = (workspaceId: string) => ["workOrderTemplates", workspaceId, PRODUCT_KEY];
const tasksKey = (workspaceId: string, workOrderId?: string) => ["workOrders", workspaceId, PRODUCT_KEY, "tasks", workOrderId];

/** The workspace product's templates: named lists of tasks to raise orders with. */
export const useWorkOrderTemplates = (enabled = true) => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: templatesKey(workspaceId),
    queryFn: () => workOrderTemplateService.list(workspaceId, PRODUCT_KEY),
    enabled: enabled && !!workspaceId,
  });
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: templatesKey(workspaceId) }),
    [queryClient, workspaceId],
  );

  /** Creates the template, or replaces the one with this ID. */
  const save = useCallback(
    async (request: WorkOrderTemplateRequest, templateId?: string) => {
      const saved = templateId
        ? await workOrderTemplateService.update(workspaceId, PRODUCT_KEY, templateId, request)
        : await workOrderTemplateService.create(workspaceId, PRODUCT_KEY, request);
      await refresh();
      return saved;
    },
    [refresh, workspaceId],
  );

  const remove = useCallback(
    async (templateId: string) => {
      await workOrderTemplateService.remove(workspaceId, PRODUCT_KEY, templateId);
      await refresh();
    },
    [refresh, workspaceId],
  );

  return { templates: query.data ?? [], isLoading: query.isLoading, save, remove };
};

/** A work order's tasks, and ticking them. */
export const useWorkOrderTasks = (workOrderId?: string) => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const queryKey = tasksKey(workspaceId, workOrderId);
  const query = useQuery({
    queryKey,
    queryFn: () => workOrderTaskService.list(workspaceId, PRODUCT_KEY, workOrderId!),
    enabled: !!workspaceId && !!workOrderId,
  });

  /* The tick shows at once and is put back if the server refuses it. */
  const setDone = useCallback(
    async (taskId: string, done: boolean) => {
      const previous = queryClient.getQueryData<WorkOrderTask[]>(queryKey);
      queryClient.setQueryData<WorkOrderTask[]>(queryKey, (tasks) =>
        (tasks ?? []).map((task) => (task.id === taskId ? { ...task, done } : task)),
      );
      try {
        const saved = await workOrderTaskService.setDone(workspaceId, PRODUCT_KEY, workOrderId!, taskId, done);
        queryClient.setQueryData<WorkOrderTask[]>(queryKey, (tasks) =>
          (tasks ?? []).map((task) => (task.id === taskId ? saved : task)),
        );
      } catch (error) {
        queryClient.setQueryData(queryKey, previous);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, workspaceId, workOrderId],
  );

  const replace = useCallback(
    async (id: string, tasks: WorkOrderTaskInput[]) => {
      const saved = await workOrderTaskService.replace(workspaceId, PRODUCT_KEY, id, tasks);
      queryClient.setQueryData(tasksKey(workspaceId, id), saved);
      return saved;
    },
    [queryClient, workspaceId],
  );

  const tasks = query.data ?? [];
  return {
    tasks,
    isLoading: query.isLoading,
    /** Required tasks still to do: the order cannot be finished while there are any. */
    requiredLeft: tasks.filter((task) => task.required && !task.done).length,
    setDone,
    replace,
  };
};
