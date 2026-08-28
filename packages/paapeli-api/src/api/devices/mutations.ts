import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateDeviceRequest,
    deviceService,
    EditDeviceRequest,
} from './devices';

export function useEditDeviceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['editDevice'],
        mutationFn: ({
            workspaceId,
            productKey,
            ...req
        }: EditDeviceRequest & { workspaceId: string; productKey: string }) =>
            deviceService.editDevice(workspaceId, productKey, req),
        onSuccess: (_data, { workspaceId, productKey, id }) => {
            queryClient.invalidateQueries({ queryKey: ['device', workspaceId, productKey, id] });
        },
    });
}

export function useCreateDeviceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createDevice'],
        mutationFn: ({
            workspaceId,
            productKey,
            ...req
        }: CreateDeviceRequest & { workspaceId: string; productKey: string }) =>
            deviceService.createDevice(workspaceId, productKey, req),
        onSuccess: (_data, { workspaceId, productKey, assetId }) => {
            // Without this the new device does not show up in either listing
            // it belongs to until something else happens to refetch them.
            queryClient.invalidateQueries({
                queryKey: ['tenantDevices', workspaceId, productKey],
            });
            queryClient.invalidateQueries({
                queryKey: ['assetDevices', workspaceId, productKey, assetId],
            });
        },
    });
}

export function useDeleteDeviceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteDevice'],
        mutationFn: ({
            workspaceId,
            productKey,
            deviceId,
        }: {
            workspaceId: string;
            productKey: string;
            deviceId: string;
        }) => deviceService.deleteDevice(workspaceId, productKey, deviceId),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({
                queryKey: ['device', workspaceId, productKey, deviceId],
            });
            // Drop it from the listings too, or the tables keep showing it.
            queryClient.invalidateQueries({
                queryKey: ['tenantDevices', workspaceId, productKey],
            });
            queryClient.invalidateQueries({
                queryKey: ['assetDevices', workspaceId, productKey],
            });
        },
    });
}
