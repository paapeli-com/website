import { useQuery } from '@tanstack/react-query';
import { alarmService } from './alarms';

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
