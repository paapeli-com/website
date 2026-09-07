import { useQuery } from '@tanstack/react-query';
import { deviceZonesService } from './deviceZones';

export function useGetDeviceZoneQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceZone', workspaceId, productKey, deviceId],
        queryFn: () =>
            deviceZonesService.getZone(workspaceId, productKey, deviceId),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}
