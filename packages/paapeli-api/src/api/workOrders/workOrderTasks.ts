import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

/** One thing to do inside a work order. */
export interface WorkOrderTask {
    id: string;
    title: string;
    /** Must be done before the order can be finished. */
    required: boolean;
    done: boolean;
    /** Who ticked it; null while it is not done. */
    doneByUserId?: string | null;
    doneAt?: string | null;
}

/** A task as a form sends it. */
export interface WorkOrderTaskInput {
    /** A task the order already has, to keep; left out for a new one. */
    id?: string;
    title: string;
    /** Defaults to true. */
    required?: boolean;
}

/** A named list of tasks that work orders are raised with. */
export interface WorkOrderTemplate {
    id: string;
    name: string;
    description?: string | null;
    tasks: { title: string; required: boolean }[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkOrderTemplateRequest {
    name: string;
    description?: string | null;
    tasks: WorkOrderTaskInput[];
}

const orders = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/work-orders/${workspaceId}/${productKey}`;
const templates = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/work-order-templates/${workspaceId}/${productKey}`;

export const workOrderTaskService = {
    /** In the order they are to be done. */
    async list(workspaceId: string, productKey: string, workOrderId: string): Promise<WorkOrderTask[]> {
        const { data } = await napiHttpHandler.get<WorkOrderTask[]>(
            `${orders(workspaceId, productKey)}/${workOrderId}/tasks`,
        );
        return data;
    },

    /** The whole list: a task with an id is kept, one without is added, the rest are removed. */
    async replace(
        workspaceId: string,
        productKey: string,
        workOrderId: string,
        tasks: WorkOrderTaskInput[],
    ): Promise<WorkOrderTask[]> {
        const { data } = await napiHttpHandler.put<WorkOrderTask[]>(
            `${orders(workspaceId, productKey)}/${workOrderId}/tasks`,
            { tasks },
        );
        return data;
    },

    async setDone(
        workspaceId: string,
        productKey: string,
        workOrderId: string,
        taskId: string,
        done: boolean,
    ): Promise<WorkOrderTask> {
        const { data } = await napiHttpHandler.put<WorkOrderTask>(
            `${orders(workspaceId, productKey)}/${workOrderId}/tasks/${taskId}/done`,
            { done },
        );
        return data;
    },
};

export const workOrderTemplateService = {
    /** By name, each with its tasks. */
    async list(workspaceId: string, productKey: string): Promise<WorkOrderTemplate[]> {
        const { data } = await napiHttpHandler.get<WorkOrderTemplate[]>(templates(workspaceId, productKey));
        return data;
    },

    async create(
        workspaceId: string,
        productKey: string,
        request: WorkOrderTemplateRequest,
    ): Promise<WorkOrderTemplate> {
        const { data } = await napiHttpHandler.post<WorkOrderTemplate>(templates(workspaceId, productKey), request);
        return data;
    },

    /** Replaces the name, description and whole task list. */
    async update(
        workspaceId: string,
        productKey: string,
        templateId: string,
        request: WorkOrderTemplateRequest,
    ): Promise<WorkOrderTemplate> {
        const { data } = await napiHttpHandler.put<WorkOrderTemplate>(
            `${templates(workspaceId, productKey)}/${templateId}`,
            request,
        );
        return data;
    },

    /** Orders already raised with it keep their tasks. */
    async remove(workspaceId: string, productKey: string, templateId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `${templates(workspaceId, productKey)}/${templateId}`,
        );
        return data;
    },
};
