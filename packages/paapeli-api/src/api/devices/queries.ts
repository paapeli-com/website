import { useQuery } from '@tanstack/react-query';
import { deviceService } from './devices';

export function useGetDeviceByIdQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['device', workspaceId, productKey, deviceId],
        queryFn: () => deviceService.getDeviceById(workspaceId, productKey, deviceId),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}

export function useGetDeviceActivitiesQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceActivities', workspaceId, productKey, deviceId, page, size],
        queryFn: () =>
            deviceService.getDeviceActivities(workspaceId, productKey, deviceId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}

export function useGetTenantDevicesQuery(
    workspaceId: string,
    productKey: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['tenantDevices', workspaceId, productKey, page, size],
        queryFn: () => deviceService.getTenantDevices(workspaceId, productKey, page, size),
        enabled: enabled && !!workspaceId && !!productKey,
    });
}

export function useGetAssetDevicesQuery(
    workspaceId: string,
    productKey: string,
    assetId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['assetDevices', workspaceId, productKey, assetId, page, size],
        queryFn: () =>
            deviceService.getAssetDevices(workspaceId, productKey, assetId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!assetId,
    });
}
