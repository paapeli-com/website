import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';

export type WorkOrderApiStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type WorkOrderApiPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WorkOrderApiSource = 'MANUAL' | 'ALARM' | 'ANOMALY' | 'FORECAST';

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
}

export interface WorkOrderListFilter {
    status?: WorkOrderApiStatus;
    priority?: WorkOrderApiPriority;
    assigneeUserId?: string;
    /** Found, case-insensitively, in the title or the equipment name. */
    search?: string;
}

export type WorkOrderEventType = 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UPDATED' | 'NOTE';

/** One thing that happened to a work order. */
export interface WorkOrderEvent {
    id: string;
    type: WorkOrderEventType;
    /** null when the gateway acted itself. */
    actorUserId?: string | null;
    /** STATUS_CHANGED: the status before. ASSIGNED: the user assigned before. */
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
    createdAt: string;
}

const base = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/work-orders/${workspaceId}/${productKey}`;

export const workOrderService = {
    /** Newest first; one-based pages, size 1-100. */
    async list(
        workspaceId: string,
        productKey: string,
        filter: WorkOrderListFilter = {},
        page = 1,
        size = 25,
    ): Promise<PageResponse<WorkOrderResponse>> {
        const { data } = await napiHttpHandler.get<PageResponse<WorkOrderResponse>>(
            base(workspaceId, productKey),
            { ...filter, page, size },
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
