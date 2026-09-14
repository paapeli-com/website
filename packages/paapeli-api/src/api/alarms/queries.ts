import { useQueries, useQuery } from '@tanstack/react-query';
import { alarmService, type PaapeliAlarmListItem } from './alarms';

/** Alarms are listed per device and paged at most 100 at a time. */
const DEVICE_ALARMS_PAGE_SIZE = 100;
/** Safety net against a server that never reports its last page. */
const DEVICE_ALARMS_MAX_PAGES = 50;

/**
 * Every alarm of each given device — one query per device, each walking all
 * of that device's pages. Keys share useGetDeviceAlarmsQuery's
 * ['deviceAlarms', ws, pk, deviceId] prefix, so the ack/clear mutations'
 * invalidations refresh them too.
 */
export function useGetDevicesAlarmsQueries(
    workspaceId: string,
    productKey: string,
    deviceIds: string[],
    enabled = true,
) {
    return useQueries({
        queries: deviceIds.map((deviceId) => ({
            queryKey: ['deviceAlarms', workspaceId, productKey, deviceId, 'all'],
            queryFn: async (): Promise<PaapeliAlarmListItem[]> => {
                const all: PaapeliAlarmListItem[] = [];
                // Pages are one-based.
                for (let page = 1; page <= DEVICE_ALARMS_MAX_PAGES; page++) {
                    const res = await alarmService.getDeviceAlarms(
                        workspaceId, productKey, deviceId, page, DEVICE_ALARMS_PAGE_SIZE,
                    );
                    all.push(...(res.data ?? []));
                    if (!res.hasNext) break;
                }
                return all;
            },
            enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
        })),
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
) {
    return useQuery({
        queryKey: ['alarmRules', workspaceId, productKey, deviceId, page, size],
        queryFn: () => alarmService.getAlarmRules(workspaceId, productKey, deviceId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}
