import { useQuery } from '@tanstack/react-query';
import { deviceService } from './devices';

export function useGetDeviceByIdQuery(deviceId: string, enabled = true) {
    return useQuery({
        queryKey: ['device', deviceId],
        queryFn: () => deviceService.getDeviceById(deviceId),
        enabled: enabled && !!deviceId,
    });
}

export function useGetDeviceActivitiesQuery(
    deviceId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceActivities', deviceId, page, size],
        queryFn: () => deviceService.getDeviceActivities(deviceId, page, size),
        enabled: enabled && !!deviceId,
    });
}

export function useGetTenantDevicesQuery(page: number, size: number) {
    return useQuery({
        queryKey: ['tenantDevices', page, size],
        queryFn: () => deviceService.getTenantDevices(page, size),
    });
}

export function useGetAssetDevicesQuery(
    assetId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['assetDevices', assetId, page, size],
        queryFn: () => deviceService.getAssetDevices(assetId, page, size),
        enabled: enabled && !!assetId,
    });
}
