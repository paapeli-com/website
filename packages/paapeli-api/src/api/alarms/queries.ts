import { useQuery } from '@tanstack/react-query';
import { alarmService } from './alarms';

export function useGetDeviceAlarmsQuery(
    deviceId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceAlarms', deviceId, page, size],
        queryFn: () => alarmService.getDeviceAlarms(deviceId, page, size),
        enabled: enabled && !!deviceId,
    });
}
