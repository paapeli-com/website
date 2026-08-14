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
    return useMutation({
        mutationKey: ['createDevice'],
        mutationFn: ({
            workspaceId,
            productKey,
            ...req
        }: CreateDeviceRequest & { workspaceId: string; productKey: string }) =>
            deviceService.createDevice(workspaceId, productKey, req),
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
        },
    });
}
