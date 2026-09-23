import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';

export interface PaapeliAlarmListItem {
    id: string;
    name: string;
    severity: string;
    status: string;
    creationTime: number;
}

export interface AlarmAssignee {
    userId: string;
    displayName?: string;
    email?: string;
}

/** An alarm from the workspace-product list — carries its device and asset. */
export interface WorkspaceAlarmItem {
    id: string;
    alarmName: string;
    severity: string;
    status: string;
    deviceId: string;
    deviceName?: string;
    assetId?: string;
    assetName?: string;
    /** ISO date-time. */
    createdAt: string;
    /** Always null until the server implements alarm assignment. */
    assignedTo: AlarmAssignee | null;
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

export type EscalationActionType = 'CALL';

export interface EscalationAction {
    id?: string;
    position?: number;
    actionType: EscalationActionType;
    /** An active member of the same workspace. */
    userId: string;
}

export interface EscalationStep {
    id?: string;
    position?: number;
    /** Wait before executing this step. */
    delaySeconds: number;
    actions: EscalationAction[];
}

/** A rule's escalation chain; steps and actions are in execution order. */
export interface AlarmEscalationChain {
    id: string;
    alarmRuleId: string;
    enabled: boolean;
    steps: EscalationStep[];
    createdAt: string;
    updatedAt: string;
}

/** Body of the create-or-replace call; at least one step is required. */
export interface AlarmEscalationChainRequest {
    enabled: boolean;
    steps: {
        delaySeconds: number;
        actions: { actionType: EscalationActionType; userId: string }[];
    }[];
}

export interface CreateAlarmRuleRequest {
    name: string;
    /** Optional — leave it out entirely rather than sending an empty string,
        which the gateway rejects. */
    description?: string;
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
    /** List the alarms of every device in the workspace product (one-based pages, size 1-100). */
    async getWorkspaceAlarms(
        workspaceId: string,
        productKey: string,
        page: number,
        size: number,
    ): Promise<PageResponse<WorkspaceAlarmItem>> {
        const { data } = await napiHttpHandler.get<PageResponse<WorkspaceAlarmItem>>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}`,
            { page, size },
        );
        return data;
    },
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
    /** Get an alarm rule's escalation chain. 404 when the rule has none. */
    async getEscalationChain(
        workspaceId: string,
        productKey: string,
        alarmRuleId: string,
    ): Promise<AlarmEscalationChain> {
        const { data } = await napiHttpHandler.get<AlarmEscalationChain>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/${alarmRuleId}/escalation-chain`,
        );
        return data;
    },
    /** Create or replace an active alarm rule's escalation chain (atomic). */
    async putEscalationChain(
        workspaceId: string,
        productKey: string,
        alarmRuleId: string,
        req: AlarmEscalationChainRequest,
    ): Promise<AlarmEscalationChain> {
        const { data } = await napiHttpHandler.put<AlarmEscalationChain>(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/${alarmRuleId}/escalation-chain`,
            req,
        );
        return data;
    },
    /** Delete an alarm rule's escalation chain. Idempotent when the rule has none (204). */
    async deleteEscalationChain(
        workspaceId: string,
        productKey: string,
        alarmRuleId: string,
    ): Promise<void> {
        await napiHttpHandler.del(
            `/api/v1/aiot/alarms/${workspaceId}/${productKey}/rule/${alarmRuleId}/escalation-chain`,
        );
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
