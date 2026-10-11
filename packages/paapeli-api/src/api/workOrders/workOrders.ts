import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';
import type { WorkOrderTaskInput } from './workOrderTasks';

export type WorkOrderApiStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELLED';
export type WorkOrderApiPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WorkOrderApiSource = 'MANUAL' | 'ALARM' | 'ANOMALY' | 'FORECAST';
export type WorkOrderApiWorkType = 'REACTIVE' | 'PREVENTIVE' | 'OTHER';
export type WorkOrderApiSort = 'NEWEST' | 'OLDEST' | 'PRIORITY' | 'DUE';

/** A work order as the gateway returns it. */
export interface WorkOrderResponse {
    id: string;
    title: string;
    description?: string | null;
    status: WorkOrderApiStatus;
    priority: WorkOrderApiPriority;
    source: WorkOrderApiSource;
    deviceId?: string | null;
    assetId?: string | null;
    /** The equipment's name, kept on the order as text. */
    subjectLabel?: string | null;
    locationLabel?: string | null;
    /** The alarm that raised it, when one did. */
    alarmId?: string | null;
    /** An identifier from whatever else raised it, such as an anomaly. */
    externalRef?: string | null;
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    /** ISO date-time. */
    dueAt?: string | null;
    /** null when the gateway raised the order itself, from an alarm. */
    createdByUserId?: string | null;
    createdAt: string;
    updatedAt: string;
    closedAt?: string | null;
    workType?: WorkOrderApiWorkType | null;
    /** Why it is on hold; null in any other status. */
    holdReason?: string | null;
    /** The alarm rule that raised it, when one did. */
    alarmRuleId?: string | null;
    /** How often that rule fired again on the device while the order was in hand. */
    repeatCount?: number;
    lastRepeatedAt?: string | null;
}

export interface CreateWorkOrderRequest {
    title: string;
    description?: string | null;
    /** Defaults to OPEN. */
    status?: WorkOrderApiStatus;
    priority: WorkOrderApiPriority;
    /** Defaults to MANUAL. */
    source?: WorkOrderApiSource;
    deviceId?: string | null;
    assetId?: string | null;
    subjectLabel?: string | null;
    locationLabel?: string | null;
    alarmId?: string | null;
    externalRef?: string | null;
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    dueAt?: string | null;
    workType?: WorkOrderApiWorkType | null;
    holdReason?: string | null;
    /** A template whose tasks the order starts with; ignored when tasks is given. */
    templateId?: string | null;
    /** The tasks the order starts with, in order. */
    tasks?: WorkOrderTaskInput[] | null;
}

/** Every editable field; the order is replaced with these, so a null clears. */
export interface UpdateWorkOrderRequest {
    title: string;
    description?: string | null;
    status: WorkOrderApiStatus;
    priority: WorkOrderApiPriority;
    deviceId?: string | null;
    assetId?: string | null;
    subjectLabel?: string | null;
    locationLabel?: string | null;
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    dueAt?: string | null;
    workType?: WorkOrderApiWorkType | null;
    /** Kept only while status is ON_HOLD. */
    holdReason?: string | null;
}

export interface WorkOrderListFilter {
    /** Orders in any of these statuses. */
    status?: WorkOrderApiStatus | WorkOrderApiStatus[];
    priority?: WorkOrderApiPriority;
    source?: WorkOrderApiSource;
    workType?: WorkOrderApiWorkType;
    assigneeUserId?: string;
    /** Only orders nobody is assigned to. */
    unassigned?: boolean;
    assignedTeam?: string;
    deviceId?: string;
    alarmId?: string;
    /** Only orders past their due time that are still in hand. */
    overdue?: boolean;
    /** Found, case-insensitively, in the title or the equipment name. */
    search?: string;
    /** Defaults to NEWEST. */
    sort?: WorkOrderApiSort;
}

/** The work orders of a workspace product, counted. */
export interface WorkOrderSummary {
    open: number;
    inProgress: number;
    onHold: number;
    done: number;
    cancelled: number;
    /** Past the due time and still in hand. */
    overdue: number;
    /** In hand and assigned to nobody. */
    unassigned: number;
    /** In hand and assigned to the caller. */
    mine: number;
    createdLast30: number;
    doneLast30: number;
    doneOnTimeLast30: number;
    doneLateLast30: number;
    /** From raised to finished, over the last 30 days; null when none finished. */
    averageHoursToDone?: number | null;
}

/** One change for several orders; a field left out is kept as it is on each. */
export interface BulkWorkOrderRequest {
    ids: string[];
    status?: WorkOrderApiStatus;
    priority?: WorkOrderApiPriority;
    assigneeUserId?: string;
    /** true clears the assignee. */
    unassign?: boolean;
    assignedTeam?: string;
    /** true deletes the orders and ignores every other field. */
    delete?: boolean;
}

export interface BulkWorkOrderResponse {
    succeeded: string[];
    failed: string[];
}

export type WorkOrderEventType = 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UPDATED' | 'NOTE' | 'REPEATED';

/** One thing that happened to a work order. */
export interface WorkOrderEvent {
    id: string;
    type: WorkOrderEventType;
    /** null when the gateway acted itself. */
    actorUserId?: string | null;
    /** STATUS_CHANGED: the status before. ASSIGNED: the user assigned before. REPEATED: toValue is the count. */
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
    createdAt: string;
}

const base = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/work-orders/${workspaceId}/${productKey}`;

export const workOrderService = {
    /** One-based pages, size 1-100. */
    async list(
        workspaceId: string,
        productKey: string,
        filter: WorkOrderListFilter = {},
        page = 1,
        size = 25,
    ): Promise<PageResponse<WorkOrderResponse>> {
        const { status, ...rest } = filter;
        const { data } = await napiHttpHandler.get<PageResponse<WorkOrderResponse>>(
            base(workspaceId, productKey),
            {
                ...rest,
                // Several statuses go as one comma-separated value.
                ...(status ? { status: Array.isArray(status) ? status.join(',') : status } : {}),
                page,
                size,
            },
        );
        return data;
    },

    async summary(workspaceId: string, productKey: string): Promise<WorkOrderSummary> {
        const { data } = await napiHttpHandler.get<WorkOrderSummary>(`${base(workspaceId, productKey)}/summary`);
        return data;
    },

    /** One failure does not stop the rest: the answer lists which went through. */
    async bulk(
        workspaceId: string,
        productKey: string,
        request: BulkWorkOrderRequest,
    ): Promise<BulkWorkOrderResponse> {
        const { data } = await napiHttpHandler.post<BulkWorkOrderResponse>(
            `${base(workspaceId, productKey)}/bulk`,
            request,
        );
        return data;
    },

    async get(workspaceId: string, productKey: string, workOrderId: string): Promise<WorkOrderResponse> {
        const { data } = await napiHttpHandler.get<WorkOrderResponse>(
            `${base(workspaceId, productKey)}/${workOrderId}`,
        );
        return data;
    },

    async create(
        workspaceId: string,
        productKey: string,
        request: CreateWorkOrderRequest,
    ): Promise<WorkOrderResponse> {
        const { data } = await napiHttpHandler.post<WorkOrderResponse>(base(workspaceId, productKey), request);
        return data;
    },

    async update(
        workspaceId: string,
        productKey: string,
        workOrderId: string,
        request: UpdateWorkOrderRequest,
    ): Promise<WorkOrderResponse> {
        const { data } = await napiHttpHandler.put<WorkOrderResponse>(
            `${base(workspaceId, productKey)}/${workOrderId}`,
            request,
        );
        return data;
    },

    async remove(workspaceId: string, productKey: string, workOrderId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `${base(workspaceId, productKey)}/${workOrderId}`,
        );
        return data;
    },

    /** Oldest first. */
    async listEvents(workspaceId: string, productKey: string, workOrderId: string): Promise<WorkOrderEvent[]> {
        const { data } = await napiHttpHandler.get<WorkOrderEvent[]>(
            `${base(workspaceId, productKey)}/${workOrderId}/events`,
        );
        return data;
    },

    async addNote(
        workspaceId: string,
        productKey: string,
        workOrderId: string,
        note: string,
    ): Promise<WorkOrderEvent> {
        const { data } = await napiHttpHandler.post<WorkOrderEvent>(
            `${base(workspaceId, productKey)}/${workOrderId}/notes`,
            { note },
        );
        return data;
    },
};
