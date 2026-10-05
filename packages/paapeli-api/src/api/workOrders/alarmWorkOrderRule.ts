import napiHttpHandler from '../napiHttpHandler';
import type { WorkOrderApiPriority } from './workOrders';

/** The setting that makes an alarm rule raise a work order each time it fires. */
export interface AlarmWorkOrderRule {
    alarmRuleId: string;
    enabled: boolean;
    /** null: each order takes its priority from its alarm's severity. */
    priority?: WorkOrderApiPriority | null;
    /** Who each raised order goes to; null leaves it unassigned. */
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AlarmWorkOrderRuleRequest {
    /** Defaults to true. */
    enabled?: boolean;
    priority?: WorkOrderApiPriority | null;
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
}

const url = (workspaceId: string, productKey: string, alarmRuleId: string) =>
    `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/${alarmRuleId}/work-order-rule`;

export const alarmWorkOrderRuleService = {
    /** The rule's setting, or null when it raises no work orders (a 404). */
    async get(workspaceId: string, productKey: string, alarmRuleId: string): Promise<AlarmWorkOrderRule | null> {
        try {
            const { data } = await napiHttpHandler.get<AlarmWorkOrderRule>(url(workspaceId, productKey, alarmRuleId));
            return data;
        } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 404) return null;
            throw error;
        }
    },

    /** Creates the setting or replaces it. */
    async put(
        workspaceId: string,
        productKey: string,
        alarmRuleId: string,
        request: AlarmWorkOrderRuleRequest,
    ): Promise<AlarmWorkOrderRule> {
        const { data } = await napiHttpHandler.put<AlarmWorkOrderRule>(
            url(workspaceId, productKey, alarmRuleId),
            request,
        );
        return data;
    },

    /** Orders already raised stay. */
    async remove(workspaceId: string, productKey: string, alarmRuleId: string): Promise<void> {
        await napiHttpHandler.del(url(workspaceId, productKey, alarmRuleId));
    },
};
