import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceZonesService, Zone } from './deviceZones';

interface DeviceZoneTarget {
    workspaceId: string;
    productKey: string;
    deviceId: string;
}

export function useSaveDeviceZoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['saveDeviceZone'],
        mutationFn: ({
            workspaceId,
            productKey,
            deviceId,
            zone,
        }: DeviceZoneTarget & { zone: Zone }) =>
            deviceZonesService.saveZone(
                workspaceId,
                productKey,
                deviceId,
                zone,
            ),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({
                queryKey: ['deviceZone', workspaceId, productKey, deviceId],
            });
        },
    });
}

export function useDeleteDeviceZoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteDeviceZone'],
        mutationFn: ({ workspaceId, productKey, deviceId }: DeviceZoneTarget) =>
            deviceZonesService.deleteZone(workspaceId, productKey, deviceId),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({
                queryKey: ['deviceZone', workspaceId, productKey, deviceId],
            });
        },
    });
}
