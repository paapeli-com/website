import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateProductDeviceCommandRequest,
    productDeviceCommandsService,
    UpdateProductDeviceCommandRequest,
} from './productDeviceCommands';

export function useCreateProductDeviceCommandMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createProductDeviceCommand'],
        mutationFn: ({
            productKey,
            deviceType,
            ...req
        }: CreateProductDeviceCommandRequest & {
            productKey: string;
            deviceType: string;
        }) =>
            productDeviceCommandsService.createProductDeviceCommand(
                productKey,
                deviceType,
                req,
            ),
        onSuccess: (_data, { productKey, deviceType }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceCommands', productKey, deviceType],
            });
        },
    });
}

export function useEditProductDeviceCommandMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['editProductDeviceCommand'],
        mutationFn: ({
            productKey,
            deviceType,
            commandKey,
            ...req
        }: UpdateProductDeviceCommandRequest & {
            productKey: string;
            deviceType: string;
            commandKey: string;
        }) =>
            productDeviceCommandsService.editProductDeviceCommand(
                productKey,
                deviceType,
                commandKey,
                req,
            ),
        onSuccess: (_data, { productKey, deviceType }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceCommands', productKey, deviceType],
            });
        },
    });
}

export function useDeleteProductDeviceCommandMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteProductDeviceCommand'],
        mutationFn: ({
            productKey,
            deviceType,
            commandKey,
        }: {
            productKey: string;
            deviceType: string;
            commandKey: string;
        }) =>
            productDeviceCommandsService.deleteProductDeviceCommand(
                productKey,
                deviceType,
                commandKey,
            ),
        onSuccess: (_data, { productKey, deviceType }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceCommands', productKey, deviceType],
            });
        },
    });
}
