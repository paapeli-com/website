import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';

export interface PaapeliAlarmListItem {
    id: string;
    name: string;
    severity: string;
    status: string;
    creationTime: number;
}

export type RuleOperator = 'GT' | 'LT' | 'EQ' | 'NEQ' | 'GTE' | 'LTE';
export type RuleValueType = 'STRING_LITERAL' | 'NUMBER_LITERAL' | 'BOOLEAN_LITERAL' | 'NULL';
export type RuleCombinator = 'AND' | 'OR';
export type RuleTriggerType = 'SIMPLE' | 'DURATION' | 'REPEATING';
export type DurationUnit =
    | 'NANOSECONDS'
    | 'MICROSECONDS'
    | 'MILLISECONDS'
    | 'SECONDS'
    | 'MINUTES'
    | 'HOURS'
    | 'DAYS';

/** A single condition, e.g. `temperature GT 80`. */
export interface LeafRule {
    field: string;
    operator: RuleOperator;
    value?: unknown;
    valueType?: RuleValueType;
}

/** A group of rules combined with AND/OR — nests recursively with `LeafRule`. */
export interface RuleGroup {
    combinator: RuleCombinator;
    rules: RuleExpression[];
}

export type RuleExpression = LeafRule | RuleGroup;

/** Trigger condition for one severity level of an alarm rule. */
export interface CreateRule {
    expression: RuleExpression;
    type: RuleTriggerType;
    /** Only for type DURATION/REPEATING. */
    duration?: number;
    unit?: DurationUnit;
    /** Only for type REPEATING. */
    count?: number;
}

/** `CreateRule`, as stored — the expression is flattened to a string server-side. */
export interface SeverityRule {
    dashboardId?: string;
    triggerType: RuleTriggerType;
    triggerExpression: string;
    unit?: DurationUnit;
    value?: number;
    count?: number;
}

/** Where a rule is in its asynchronous provisioning lifecycle. */
export type AlarmRuleProvisioningState = 'PROVISIONING' | 'ACTIVE' | 'FAILED' | 'DELETING';

export interface AlarmRuleItem {
    /** Stable Paapeli alarm-rule id — the one the delete endpoint takes. */
    id: string;
    thingsBoardId?: string;
    /** The device that owns the rule. */
    deviceId: string;
    name: string;
    description?: string;
    arguments: string[];
    /** Keyed by severity level, e.g. "CRITICAL" / "WARNING". */
    alarmRules: Record<string, SeverityRule>;
    provisioningState: AlarmRuleProvisioningState;
    workflowId?: string;
    /** Why provisioning failed, when it did. */
    lastError?: string;
    createdAt: string;
}

export interface CreateAlarmRuleRequest {
    name: string;
    description: string;
    /** Keyed by severity level, e.g. "CRITICAL" / "WARNING". At least one entry required. */
    createRules: Record<string, CreateRule>;
    clearRule?: RuleExpression;
}

/** Creation is asynchronous (202): the rule starts out PROVISIONING. */
export interface CreateAlarmRuleResponse {
    id: string;
    provisioningState: AlarmRuleProvisioningState;
    workflowId?: string;
    createdAt: string;
}

export const alarmService = {
    async getDeviceAlarms(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<PaapeliAlarmListItem>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<PaapeliAlarmListItem>
        >(`/api/v1/aiot/alarms/${workspaceId}/${productKey}/device/${deviceId}`, {
            page,
            size,
        });
        return data;
    },
    /** Acknowledge a triggered alarm. */
    async ackAlarm(
        workspaceId: string,
        productKey: string,
        alarmId: string,
        deviceId: string,
    ): Promise<PaapeliAlarmListItem> {
        const { data } = await napiHttpHandler.post<PaapeliAlarmListItem>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/ack/${alarmId}/device/${deviceId}`,
        );
        return data;
    },
    /** Clear (resolve) an alarm. */
    async clearAlarm(
        workspaceId: string,
        productKey: string,
        alarmId: string,
        deviceId: string,
    ): Promise<PaapeliAlarmListItem> {
        const { data } = await napiHttpHandler.post<PaapeliAlarmListItem>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/clear/${alarmId}/device/${deviceId}`,
        );
        return data;
    },
    /**
     * List every alarm rule in the workspace product, including rules still
     * provisioning or failed. Optionally narrowed to one device.
     */
    async getWorkspaceAlarmRules(
        workspaceId: string,
        productKey: string,
        page: number,
        size: number,
        deviceId?: string,
    ): Promise<PageResponse<AlarmRuleItem>> {
        const { data } = await napiHttpHandler.get<PageResponse<AlarmRuleItem>>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule`,
            { page, size, ...(deviceId ? { deviceId } : {}) },
        );
        return data;
    },
    /** List the alarm (monitoring) rules configured for a device. */
    async getAlarmRules(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<AlarmRuleItem>> {
        const { data } = await napiHttpHandler.get<PageResponse<AlarmRuleItem>>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/device/${deviceId}`,
            { page, size },
        );
        return data;
    },
    /** Create a monitoring rule for a device. */
    async createAlarmRule(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        req: CreateAlarmRuleRequest,
    ): Promise<CreateAlarmRuleResponse> {
        const { data } = await napiHttpHandler.post<CreateAlarmRuleResponse>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/device/${deviceId}`,
            req,
        );
        return data;
    },
    async deleteAlarmRule(
        workspaceId: string,
        productKey: string,
        alarmRuleId: string,
        deviceId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/${alarmRuleId}/device/${deviceId}`,
        );
        return data;
    },
};
