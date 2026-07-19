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
        mutationFn: (req: EditDeviceRequest) => deviceService.editDevice(req),
        onSuccess: (_data, req) => {
            queryClient.invalidateQueries({ queryKey: ['device', req.id] });
        },
    });
}

export function useCreateDeviceMutation() {
    return useMutation({
        mutationKey: ['createDevice'],
        mutationFn: (req: CreateDeviceRequest) =>
            deviceService.createDevice(req),
    });
}

export function useDeleteDeviceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteDevice'],
        mutationFn: (deviceId: string) => deviceService.deleteDevice(deviceId),
        onSuccess: (_data, deviceId) => {
            queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
        },
    });
}
