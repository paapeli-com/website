import napiHttpHandler from '../napiHttpHandler';
import type { WorkOrderApiPriority } from './workOrders';

export type AlarmSeverityFloor = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';

/** The setting that makes an alarm rule raise work orders, and what holds it back. */
export interface AlarmWorkOrderRule {
    alarmRuleId: string;
    enabled: boolean;
    /** null: each order takes its priority from its alarm's severity. */
    priority?: WorkOrderApiPriority | null;
    /** Who each raised order goes to; null leaves it unassigned. */
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    /** The least severe alarm that still raises an order; null raises for all. */
    minSeverity?: AlarmSeverityFloor | null;
    /** While an order of the rule is in hand for a device, count a repeat on it instead of raising another. */
    mergeRepeats: boolean;
    /** After an order of the rule is closed for a device, raise nothing for it for this long. */
    cooldownMinutes: number;
    /** The most orders the rule raises in any 24 hours; null for no limit. */
    dailyLimit?: number | null;
    /** The template whose tasks each raised order gets. */
    templateId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AlarmWorkOrderRuleRequest {
    /** Defaults to true. */
    enabled?: boolean;
    priority?: WorkOrderApiPriority | null;
    assigneeUserId?: string | null;
    assignedTeam?: string | null;
    minSeverity?: AlarmSeverityFloor | null;
    /** Defaults to true. */
    mergeRepeats?: boolean;
    /** Defaults to 0. */
    cooldownMinutes?: number;
    dailyLimit?: number | null;
    templateId?: string | null;
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
