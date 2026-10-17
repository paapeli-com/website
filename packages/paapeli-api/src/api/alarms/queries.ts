import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import {
    alarmService,
    type AlarmAnalyticsParams,
    type AlarmEscalationChain,
    type WorkspaceAlarmItem,
} from './alarms';

/**
 * The escalation chain of each given alarm rule, one query per rule. A rule
 * without a chain answers 404, which resolves to `null` rather than an error.
 */
export function useGetEscalationChainsQueries(
    workspaceId: string,
    productKey: string,
    alarmRuleIds: string[],
    enabled = true,
) {
    return useQueries({
        queries: alarmRuleIds.map((alarmRuleId) => ({
            queryKey: ['escalationChain', workspaceId, productKey, alarmRuleId],
            queryFn: async (): Promise<AlarmEscalationChain | null> => {
                try {
                    return await alarmService.getEscalationChain(workspaceId, productKey, alarmRuleId);
                } catch (error) {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 404) return null;
                    throw error;
                }
            },
            enabled: enabled && !!workspaceId && !!productKey && !!alarmRuleId,
        })),
    });
}

/** The server clamps alarm pages to at most 100. */
const WORKSPACE_ALARMS_PAGE_SIZE = 100;
/** Safety net against a server that never reports its last page. */
const WORKSPACE_ALARMS_MAX_PAGES = 50;

/**
 * Every alarm in the workspace product, walking all pages into one array.
 * Keyed ['workspaceAlarms', ws, pk], which the ack/clear mutations invalidate.
 */
async function fetchAllWorkspaceAlarms(workspaceId: string, productKey: string) {
    const all: WorkspaceAlarmItem[] = [];
    // Pages are one-based.
    for (let page = 1; page <= WORKSPACE_ALARMS_MAX_PAGES; page++) {
        const res = await alarmService.getWorkspaceAlarms(
            workspaceId, productKey, page, WORKSPACE_ALARMS_PAGE_SIZE,
        );
        all.push(...(res.data ?? []));
        if (!res.hasNext) break;
    }
    return all;
}

export function useGetWorkspaceAlarmsQuery(workspaceId: string, productKey: string, enabled = true) {
    return useQuery({
        queryKey: ['workspaceAlarms', workspaceId, productKey, 'all'],
        queryFn: () => fetchAllWorkspaceAlarms(workspaceId, productKey),
        enabled: enabled && !!workspaceId && !!productKey,
    });
}

/**
 * The same list for several products at once — for callers that aren't scoped
 * to one (the shell's notifications menu). Keys match
 * useGetWorkspaceAlarmsQuery's, so both share the cache and the ack/clear
 * mutations' invalidations refresh them together.
 */
export function useGetWorkspaceAlarmsQueries(
    workspaceId: string,
    productKeys: string[],
    enabled = true,
) {
    return useQueries({
        queries: productKeys.map((productKey) => ({
            queryKey: ['workspaceAlarms', workspaceId, productKey, 'all'],
            queryFn: () => fetchAllWorkspaceAlarms(workspaceId, productKey),
            enabled: enabled && !!workspaceId && !!productKey,
        })),
    });
}

/**
 * Alarm analytics for one window. Keyed ['alarmAnalytics', ws, pk, params],
 * which the ack/clear mutations invalidate. Changing the window keeps the
 * previous figures on screen until the new ones arrive.
 */
export function useGetAlarmAnalyticsQuery(
    workspaceId: string,
    productKey: string,
    params: AlarmAnalyticsParams,
    enabled = true,
) {
    return useQuery({
        queryKey: ['alarmAnalytics', workspaceId, productKey, params],
        queryFn: () => alarmService.getAlarmAnalytics(workspaceId, productKey, params),
        enabled: enabled && !!workspaceId && !!productKey,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    });
}

export function useGetDeviceAlarmsQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceAlarms', workspaceId, productKey, deviceId, page, size],
        queryFn: () => alarmService.getDeviceAlarms(workspaceId, productKey, deviceId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}

export function useGetWorkspaceAlarmRulesQuery(
    workspaceId: string,
    productKey: string,
    page: number,
    size: number,
    options: { deviceId?: string; enabled?: boolean; refetchInterval?: number | false } = {},
) {
    const { deviceId, enabled = true, refetchInterval } = options;
    return useQuery({
        queryKey: ['alarmRules', workspaceId, productKey, 'workspace', deviceId ?? null, page, size],
        queryFn: () =>
            alarmService.getWorkspaceAlarmRules(workspaceId, productKey, page, size, deviceId),
        enabled: enabled && !!workspaceId && !!productKey,
        refetchInterval,
    });
}

export function useGetAlarmRulesQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    page: number,
    size: number,
    enabled = true,
    refetchInterval: number | false = false,
) {
    return useQuery({
        queryKey: ['alarmRules', workspaceId, productKey, deviceId, page, size],
        queryFn: () => alarmService.getAlarmRules(workspaceId, productKey, deviceId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
        refetchInterval,
    });
}
