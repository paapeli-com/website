import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListWorkspaceMembersQuery,
  workOrderService,
  type UpdateWorkOrderRequest,
  type WorkOrderApiPriority,
  type WorkOrderApiSource,
  type WorkOrderApiStatus,
  type WorkOrderResponse,
} from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { apiErrorMessage } from "@/shared/lib/apiError";

export type WorkOrderPriority = "Critical" | "High" | "Medium" | "Low";
export type WorkOrderStatus = "Open" | "In Progress" | "Done" | "Cancelled";

/* The work order as the pages read it. The pages were written against a
   browser-only store; these are its field names, now filled from the gateway
   (GET /work-orders/{ws}/{pk}), so the pages did not have to change shape. */
export interface WorkOrder {
  id: string;
  /** The anomaly (or other source) that raised it: the gateway's externalRef. */
  anomalyId?: string;
  /** The equipment's name: subjectLabel. */
  asset: string;
  /** locationLabel. */
  location: string;
  /** What is to be done: title. */
  action: string;
  priority: WorkOrderPriority;
  assignedTeam: string;
  /** description. */
  notes: string;
  createdAt: string;
  /** The creator's name, or "" when the gateway raised the order itself. */
  createdBy: string;
  status: WorkOrderStatus;
  /** The alarm that raised it, when one did. */
  alarmId?: string;
  source: WorkOrderApiSource;
  assigneeUserId?: string;
  /** The assignee's name, from the workspace roster. */
  assignee: string;
}

const STATUS_FROM_API: Record<WorkOrderApiStatus, WorkOrderStatus> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};
const STATUS_TO_API: Record<WorkOrderStatus, WorkOrderApiStatus> = {
  Open: "OPEN",
  "In Progress": "IN_PROGRESS",
  Done: "DONE",
  Cancelled: "CANCELLED",
};
const PRIORITY_FROM_API: Record<WorkOrderApiPriority, WorkOrderPriority> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};
const PRIORITY_TO_API = { Critical: "CRITICAL", High: "HIGH", Medium: "MEDIUM", Low: "LOW" } as const;

/** One request reads this many; a workspace's orders are read up to MAX_PAGES of them. */
const PAGE_SIZE = 100;
const MAX_PAGES = 5;

async function fetchAll(workspaceId: string): Promise<WorkOrderResponse[]> {
  const all: WorkOrderResponse[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await workOrderService.list(workspaceId, PRODUCT_KEY, {}, page, PAGE_SIZE);
    all.push(...res.data);
    if (!res.hasNext) break;
  }
  return all;
}

type NewWorkOrder = Omit<WorkOrder, "id" | "createdAt" | "createdBy" | "status" | "source" | "assignee"> &
  Partial<Pick<WorkOrder, "status" | "source">>;

/** The request that leaves `raw` as it is except for `patch`. */
const merged = (raw: WorkOrderResponse, patch: Partial<WorkOrder>): UpdateWorkOrderRequest => ({
  title: patch.action ?? raw.title,
  description: patch.notes !== undefined ? patch.notes || null : raw.description ?? null,
  status: patch.status ? STATUS_TO_API[patch.status] : raw.status,
  priority: patch.priority ? PRIORITY_TO_API[patch.priority] : raw.priority,
  deviceId: raw.deviceId ?? null,
  assetId: raw.assetId ?? null,
  subjectLabel: patch.asset !== undefined ? patch.asset || null : raw.subjectLabel ?? null,
  locationLabel: patch.location !== undefined ? patch.location || null : raw.locationLabel ?? null,
  assigneeUserId: patch.assigneeUserId !== undefined ? patch.assigneeUserId || null : raw.assigneeUserId ?? null,
  assignedTeam: patch.assignedTeam !== undefined ? patch.assignedTeam || null : raw.assignedTeam ?? null,
  dueAt: raw.dueAt ?? null,
});

/**
 * The workspace product's work orders, from the gateway.
 *
 * `update` and `remove` change the list on screen at once and then tell the
 * server; if the server refuses, the list is put back and the reason is shown.
 * `create` waits for the server, because the order's id comes from it.
 */
export const useWorkOrders = () => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["workOrders", workspaceId, PRODUCT_KEY], [workspaceId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchAll(workspaceId),
    enabled: !!workspaceId,
  });
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);

  const items = useMemo<WorkOrder[]>(() => {
    const nameOf = (userId?: string | null) => {
      if (!userId) return "";
      const m = members.data?.data.find((x) => x.userId === userId);
      return m?.displayName?.trim() || m?.email || "";
    };
    return (query.data ?? []).map((w) => ({
      id: w.id,
      anomalyId: w.externalRef ?? undefined,
      asset: w.subjectLabel ?? "",
      location: w.locationLabel ?? "",
      action: w.title,
      priority: PRIORITY_FROM_API[w.priority],
      assignedTeam: w.assignedTeam ?? "",
      notes: w.description ?? "",
      createdAt: w.createdAt,
      createdBy: nameOf(w.createdByUserId),
      status: STATUS_FROM_API[w.status],
      alarmId: w.alarmId ?? undefined,
      source: w.source,
      assigneeUserId: w.assigneeUserId ?? undefined,
      assignee: nameOf(w.assigneeUserId),
    }));
  }, [query.data, members.data]);

  const fail = useCallback((error: unknown, previous: WorkOrderResponse[] | undefined) => {
    queryClient.setQueryData(queryKey, previous);
    toast.error(apiErrorMessage(error, "Couldn't save the work order"));
  }, [queryClient, queryKey]);

  const create = useCallback(
    async (wo: NewWorkOrder): Promise<WorkOrder> => {
      const created = await workOrderService.create(workspaceId, PRODUCT_KEY, {
        title: wo.action,
        description: wo.notes || null,
        status: wo.status ? STATUS_TO_API[wo.status] : undefined,
        priority: PRIORITY_TO_API[wo.priority],
        source: wo.source ?? (wo.anomalyId ? "ANOMALY" : "MANUAL"),
        subjectLabel: wo.asset || null,
        locationLabel: wo.location || null,
        alarmId: wo.alarmId ?? null,
        externalRef: wo.anomalyId ?? null,
        assigneeUserId: wo.assigneeUserId ?? null,
        assignedTeam: wo.assignedTeam || null,
      });
      queryClient.setQueryData<WorkOrderResponse[]>(queryKey, (prev) => [created, ...(prev ?? [])]);
      return {
        id: created.id,
        anomalyId: created.externalRef ?? undefined,
        asset: created.subjectLabel ?? "",
        location: created.locationLabel ?? "",
        action: created.title,
        priority: PRIORITY_FROM_API[created.priority],
        assignedTeam: created.assignedTeam ?? "",
        notes: created.description ?? "",
        createdAt: created.createdAt,
        createdBy: "",
        status: STATUS_FROM_API[created.status],
        alarmId: created.alarmId ?? undefined,
        source: created.source,
        assigneeUserId: created.assigneeUserId ?? undefined,
        assignee: "",
      };
    },
    [queryClient, queryKey, workspaceId],
  );

  const update = useCallback(
    async (id: string, patch: Partial<WorkOrder>): Promise<void> => {
      const previous = queryClient.getQueryData<WorkOrderResponse[]>(queryKey);
      const raw = previous?.find((w) => w.id === id);
      if (!raw) return;
      const request = merged(raw, patch);
      queryClient.setQueryData<WorkOrderResponse[]>(queryKey, (prev) =>
        (prev ?? []).map((w) => (w.id === id ? { ...w, ...request } : w)),
      );
      try {
        const saved = await workOrderService.update(workspaceId, PRODUCT_KEY, id, request);
        queryClient.setQueryData<WorkOrderResponse[]>(queryKey, (prev) => (prev ?? []).map((w) => (w.id === id ? saved : w)));
      } catch (error) {
        fail(error, previous);
      }
    },
    [fail, queryClient, queryKey, workspaceId],
  );

  const removeMany = useCallback(
    async (ids: string[]): Promise<void> => {
      const previous = queryClient.getQueryData<WorkOrderResponse[]>(queryKey);
      queryClient.setQueryData<WorkOrderResponse[]>(queryKey, (prev) => (prev ?? []).filter((w) => !ids.includes(w.id)));
      try {
        await Promise.all(ids.map((id) => workOrderService.remove(workspaceId, PRODUCT_KEY, id)));
      } catch (error) {
        fail(error, previous);
        // Some may have gone through before one failed: read what is really there.
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    [fail, queryClient, queryKey, workspaceId],
  );

  const remove = useCallback((id: string) => removeMany([id]), [removeMany]);
  const getById = useCallback((id?: string) => items.find((it) => it.id === id), [items]);

  return { items, isLoading: query.isLoading, isError: query.isError, create, update, remove, removeMany, getById };
};
