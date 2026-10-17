import napiHttpHandler from '../napiHttpHandler';
import { PageResponse } from '../type';
import type { WorkOrderApiPriority } from '../workOrders';

export type NotificationType =
    | 'WORK_ORDER_ASSIGNED'
    | 'WORK_ORDER_STATUS_CHANGED'
    | 'WORK_ORDER_RAISED'
    | 'ALARM_ESCALATED'
    | 'OTA_DEPLOYMENT_COMPLETED'
    | 'OTA_DEPLOYMENT_FAILED'
    /** The workspace sent its alarm texts for the day; detail is the limit. Owners and admins, once a day. */
    | 'SMS_DAILY_LIMIT_REACHED';

/** Something the signed-in user should know about, in one workspace product. */
export interface NotificationResponse {
    id: string;
    type: NotificationType;
    /** The name of what it is about, such as a work order's title. */
    title: string;
    /**
     * WORK_ORDER_ASSIGNED and WORK_ORDER_RAISED: the equipment's name, if any.
     * WORK_ORDER_STATUS_CHANGED: the new status.
     * ALARM_ESCALATED: the device's name.
     * OTA_DEPLOYMENT_*: "updated/total" devices; title is the firmware.
     */
    detail?: string | null;
    priority?: WorkOrderApiPriority | null;
    workOrderId?: string | null;
    /** The alarm it is about: the escalated one, or the one that raised the work order. */
    alarmId?: string | null;
    /** null when the gateway acted itself. */
    actorUserId?: string | null;
    read: boolean;
    readAt?: string | null;
    createdAt: string;
}

export interface UnreadNotificationCount {
    unread: number;
}

const base = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/notifications/${workspaceId}/${productKey}`;

export const notificationService = {
    /** The signed-in user's own, newest first; one-based pages, size 1-100. */
    async list(
        workspaceId: string,
        productKey: string,
        unreadOnly = false,
        page = 1,
        size = 25,
    ): Promise<PageResponse<NotificationResponse>> {
        const { data } = await napiHttpHandler.get<PageResponse<NotificationResponse>>(
            base(workspaceId, productKey),
            { unreadOnly, page, size },
        );
        return data;
    },

    async unreadCount(workspaceId: string, productKey: string): Promise<UnreadNotificationCount> {
        const { data } = await napiHttpHandler.get<UnreadNotificationCount>(
            `${base(workspaceId, productKey)}/unread-count`,
        );
        return data;
    },

    async markRead(workspaceId: string, productKey: string, notificationId: string): Promise<NotificationResponse> {
        const { data } = await napiHttpHandler.post<NotificationResponse>(
            `${base(workspaceId, productKey)}/${notificationId}/read`,
            {},
        );
        return data;
    },

    async markAllRead(workspaceId: string, productKey: string): Promise<UnreadNotificationCount> {
        const { data } = await napiHttpHandler.post<UnreadNotificationCount>(
            `${base(workspaceId, productKey)}/read-all`,
            {},
        );
        return data;
    },
};
