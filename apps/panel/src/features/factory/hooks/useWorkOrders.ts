import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListWorkspaceMembersQuery,
  workOrderService,
  type BulkWorkOrderRequest,
  type UpdateWorkOrderRequest,
  type WorkOrderApiPriority,
  type WorkOrderApiSource,
  type WorkOrderApiStatus,
  type WorkOrderApiWorkType,
  type WorkOrderListFilter,
  type WorkOrderTaskInput,
  type WorkOrderResponse,
} from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { apiErrorMessage } from "@/shared/lib/apiError";

export type WorkOrderPriority = "Critical" | "High" | "Medium" | "Low";
export type WorkOrderStatus = "Open" | "In Progress" | "On Hold" | "Done" | "Cancelled";

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
  /** The device it is about, when it points at one. */
  deviceId?: string;
  /** The location tree node it is at, when it points at one. */
  assetId?: string;
  source: WorkOrderApiSource;
  assigneeUserId?: string;
  /** The assignee's name, from the workspace roster. */
  assignee: string;
  /** ISO date-time the work is due by. */
  dueAt?: string;
  workType?: WorkOrderApiWorkType;
  /** Why it is on hold; empty in any other status. */
  holdReason?: string;
  /** How often its alarm rule fired again on the device while it was in hand. */
  repeatCount?: number;
  updatedAt?: string;
  closedAt?: string;
}

export const STATUS_FROM_API: Record<WorkOrderApiStatus, WorkOrderStatus> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  DONE: "Done",
  CANCELLED: "Cancelled",
};
export const STATUS_TO_API: Record<WorkOrderStatus, WorkOrderApiStatus> = {
  Open: "OPEN",
  "In Progress": "IN_PROGRESS",
  "On Hold": "ON_HOLD",
  Done: "DONE",
  Cancelled: "CANCELLED",
};
export const PRIORITY_FROM_API: Record<WorkOrderApiPriority, WorkOrderPriority> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};
export const PRIORITY_TO_API = { Critical: "CRITICAL", High: "HIGH", Medium: "MEDIUM", Low: "LOW" } as const;

/** Whether nobody has finished or cancelled the order yet. */
export const isInHand = (status: WorkOrderStatus) => status !== "Done" && status !== "Cancelled";

/** Past its due time and still in hand. */
export const isOverdue = (wo: Pick<WorkOrder, "dueAt" | "status">) =>
  !!wo.dueAt && isInHand(wo.status) && new Date(wo.dueAt).getTime() < Date.now();

type NameOf = (userId?: string | null) => string;

const toWorkOrder = (w: WorkOrderResponse, nameOf: NameOf): WorkOrder => ({
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
  deviceId: w.deviceId ?? undefined,
  assetId: w.assetId ?? undefined,
  source: w.source,
  assigneeUserId: w.assigneeUserId ?? undefined,
  assignee: nameOf(w.assigneeUserId),
  dueAt: w.dueAt ?? undefined,
  workType: w.workType ?? undefined,
  holdReason: w.holdReason ?? undefined,
  repeatCount: w.repeatCount ?? 0,
  updatedAt: w.updatedAt,
  closedAt: w.closedAt ?? undefined,
});

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

export type NewWorkOrder = Omit<
  WorkOrder,
  "id" | "createdAt" | "createdBy" | "status" | "source" | "assignee" | "repeatCount" | "updatedAt" | "closedAt"
> &
  Partial<Pick<WorkOrder, "status" | "source">>;

/** The request that leaves `raw` as it is except for `patch`. */
const merged = (raw: WorkOrderResponse, patch: Partial<WorkOrder>): UpdateWorkOrderRequest => ({
  title: patch.action ?? raw.title,
  description: patch.notes !== undefined ? patch.notes || null : raw.description ?? null,
  status: patch.status ? STATUS_TO_API[patch.status] : raw.status,
  priority: patch.priority ? PRIORITY_TO_API[patch.priority] : raw.priority,
  deviceId: "deviceId" in patch ? patch.deviceId || null : raw.deviceId ?? null,
  assetId: "assetId" in patch ? patch.assetId || null : raw.assetId ?? null,
  subjectLabel: patch.asset !== undefined ? patch.asset || null : raw.subjectLabel ?? null,
  locationLabel: patch.location !== undefined ? patch.location || null : raw.locationLabel ?? null,
  assigneeUserId: "assigneeUserId" in patch ? patch.assigneeUserId || null : raw.assigneeUserId ?? null,
  assignedTeam: patch.assignedTeam !== undefined ? patch.assignedTeam || null : raw.assignedTeam ?? null,
  dueAt: "dueAt" in patch ? patch.dueAt || null : raw.dueAt ?? null,
  workType: "workType" in patch ? patch.workType ?? null : raw.workType ?? null,
  holdReason: "holdReason" in patch ? patch.holdReason || null : raw.holdReason ?? null,
});

const createRequest = (wo: NewWorkOrder, tasks?: WorkOrderTaskInput[]) => ({
  title: wo.action,
  description: wo.notes || null,
  status: wo.status ? STATUS_TO_API[wo.status] : undefined,
  priority: PRIORITY_TO_API[wo.priority],
  source: wo.source ?? (wo.anomalyId ? "ANOMALY" : "MANUAL"),
  deviceId: wo.deviceId ?? null,
  assetId: wo.assetId ?? null,
  subjectLabel: wo.asset || null,
  locationLabel: wo.location || null,
  alarmId: wo.alarmId ?? null,
  externalRef: wo.anomalyId ?? null,
  assigneeUserId: wo.assigneeUserId ?? null,
  assignedTeam: wo.assignedTeam || null,
  dueAt: wo.dueAt ?? null,
  workType: wo.workType ?? null,
  holdReason: wo.holdReason || null,
  ...(tasks ? { tasks } : {}),
});

/** Every cached view of the workspace's orders starts with this. */
const rootKey = (workspaceId: string) => ["workOrders", workspaceId, PRODUCT_KEY];

/** Names from the workspace roster, for the user IDs an order carries. */
const useMemberNames = (): NameOf => {
  const workspaceId = useWorkspaceId() ?? "";
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);
  return useMemo(() => {
    const names = new Map(
      (members.data?.data ?? []).map((m) => [m.userId, m.displayName?.trim() || m.email || ""]),
    );
    return (userId) => (userId ? names.get(userId) ?? "" : "");
  }, [members.data]);
};

/**
 * One page of the workspace product's work orders, filtered and sorted on the
 * server. The page before stays on screen while the next one loads, so the
 * table does not blink between pages.
 */
export const useWorkOrderPage = (filter: WorkOrderListFilter, page: number, size: number, enabled = true) => {
  const workspaceId = useWorkspaceId() ?? "";
  const nameOf = useMemberNames();
  const query = useQuery({
    queryKey: [...rootKey(workspaceId), "page", filter, page, size],
    queryFn: () => workOrderService.list(workspaceId, PRODUCT_KEY, filter, page, size),
    enabled: enabled && !!workspaceId,
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => (query.data?.data ?? []).map((w) => toWorkOrder(w, nameOf)), [query.data, nameOf]);
  return {
    items,
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading || !workspaceId,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
};

/** The workspace product's orders counted: by status, overdue, mine, and the last 30 days. */
export const useWorkOrderSummary = () => {
  const workspaceId = useWorkspaceId() ?? "";
  return useQuery({
    queryKey: [...rootKey(workspaceId), "summary"],
    queryFn: () => workOrderService.summary(workspaceId, PRODUCT_KEY),
    enabled: !!workspaceId,
  });
};

/**
 * The work order an alarm has, if it has one: the newest of them. Asked of the
 * server when an alarm's row is opened, for an alarm whose order is not among
 * the ones already on screen.
 */
export const findWorkOrderOfAlarm = async (workspaceId: string, alarmId: string) => {
  const page = await workOrderService.list(workspaceId, PRODUCT_KEY, { alarmId }, 1, 1);
  return page.data[0];
};

/**
 * The orders alarms raised, newest first, one request's worth. Enough for the
 * alarms list to say which of its rows already have one; an older alarm is
 * looked up when its row is opened (see findWorkOrderOfAlarm).
 */
export const useAlarmWorkOrders = () => {
  const workspaceId = useWorkspaceId() ?? "";
  const query = useQuery({
    queryKey: [...rootKey(workspaceId), "ofAlarms"],
    queryFn: () => workOrderService.list(workspaceId, PRODUCT_KEY, { source: "ALARM" }, 1, PAGE_SIZE),
    enabled: !!workspaceId,
  });
  return useMemo(() => {
    const byAlarm = new Map<string, string>();
    // Newest first, so the first order seen for an alarm is its latest.
    for (const order of query.data?.data ?? []) {
      if (order.alarmId && !byAlarm.has(order.alarmId)) byAlarm.set(order.alarmId, order.id);
    }
    return byAlarm;
  }, [query.data]);
};

/** One work order by its ID, with its history. */
export const useWorkOrder = (id?: string) => {
  const workspaceId = useWorkspaceId() ?? "";
  const nameOf = useMemberNames();
  const enabled = !!workspaceId && !!id;
  const query = useQuery({
    queryKey: [...rootKey(workspaceId), "one", id],
    queryFn: () => workOrderService.get(workspaceId, PRODUCT_KEY, id!),
    enabled,
    retry: false,
  });
  const events = useQuery({
    queryKey: [...rootKey(workspaceId), "events", id],
    queryFn: () => workOrderService.listEvents(workspaceId, PRODUCT_KEY, id!),
    enabled,
  });
  const workOrder = useMemo(() => (query.data ? toWorkOrder(query.data, nameOf) : undefined), [query.data, nameOf]);
  return {
    workOrder,
    events: events.data ?? [],
    nameOf,
    isLoading: query.isLoading || !workspaceId,
    isError: query.isError,
  };
};

/**
 * Changing work orders. Each change waits for the server and then drops every
 * cached list, count and order, so whatever is on screen is read again.
 */
export const useWorkOrderActions = () => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();

  const refresh = useCallback(
    (touchedAlarm = false) => {
      void queryClient.invalidateQueries({ queryKey: rootKey(workspaceId) });
      // Finishing an order acknowledges its alarm on the server: show that.
      if (touchedAlarm) void queryClient.invalidateQueries({ queryKey: ["workspaceAlarms", workspaceId] });
    },
    [queryClient, workspaceId],
  );

  /** `tasks` is what the order starts with, in order. */
  const create = useCallback(
    async (wo: NewWorkOrder, tasks?: WorkOrderTaskInput[]) => {
      const created = await workOrderService.create(workspaceId, PRODUCT_KEY, createRequest(wo, tasks));
      refresh();
      return created;
    },
    [refresh, workspaceId],
  );

  /** Reads the order as it is now and replaces only what `patch` names. */
  const update = useCallback(
    async (id: string, patch: Partial<WorkOrder>) => {
      const raw = await workOrderService.get(workspaceId, PRODUCT_KEY, id);
      const saved = await workOrderService.update(workspaceId, PRODUCT_KEY, id, merged(raw, patch));
      refresh(saved.status === "DONE" && !!saved.alarmId);
      return saved;
    },
    [refresh, workspaceId],
  );

  const bulk = useCallback(
    async (request: BulkWorkOrderRequest) => {
      const result = await workOrderService.bulk(workspaceId, PRODUCT_KEY, request);
      refresh(request.status === "DONE");
      return result;
    },
    [refresh, workspaceId],
  );

  const remove = useCallback(
    async (id: string) => {
      await workOrderService.remove(workspaceId, PRODUCT_KEY, id);
      refresh();
    },
    [refresh, workspaceId],
  );

  const addNote = useCallback(
    async (id: string, note: string) => {
      const event = await workOrderService.addNote(workspaceId, PRODUCT_KEY, id, note);
      void queryClient.invalidateQueries({ queryKey: [...rootKey(workspaceId), "events", id] });
      return event;
    },
    [queryClient, workspaceId],
  );

  return { create, update, bulk, remove, addNote };
};

/**
 * Every work order of the workspace product at once, for the surfaces that
 * look one up or count them (the home pages, an alarm's row). The Work Orders
 * page itself reads a page at a time: see useWorkOrderPage.
 *
 * `update` and `remove` change the list on screen at once and then tell the
 * server; if the server refuses, the list is put back and the reason is shown.
 * `create` waits for the server, because the order's id comes from it.
 */
export const useWorkOrders = () => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [...rootKey(workspaceId), "all"], [workspaceId]);
  const nameOf = useMemberNames();

  const query = useQuery({
    queryKey,
    queryFn: () => fetchAll(workspaceId),
    enabled: !!workspaceId,
  });

  const items = useMemo<WorkOrder[]>(
    () => (query.data ?? []).map((w) => toWorkOrder(w, nameOf)),
    [query.data, nameOf],
  );

  const fail = useCallback((error: unknown, previous: WorkOrderResponse[] | undefined) => {
    queryClient.setQueryData(queryKey, previous);
    toast.error(apiErrorMessage(error, "Couldn't save the work order"));
  }, [queryClient, queryKey]);

  const create = useCallback(
    async (wo: NewWorkOrder): Promise<WorkOrder> => {
      const created = await workOrderService.create(workspaceId, PRODUCT_KEY, createRequest(wo));
      queryClient.setQueryData<WorkOrderResponse[]>(queryKey, (prev) => [created, ...(prev ?? [])]);
      return toWorkOrder(created, () => "");
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
        // Finishing an order acknowledges its alarm on the server: show that.
        if (saved.status === "DONE" && saved.alarmId) {
          queryClient.invalidateQueries({ queryKey: ["workspaceAlarms", workspaceId] });
        }
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
