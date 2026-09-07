import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateProductDeviceTypeRequest,
    productDeviceTypesService,
    UpdateProductDeviceTypeRequest,
} from './productDeviceTypes';

export function useCreateProductDeviceTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createProductDeviceType'],
        mutationFn: ({
            productKey,
            ...req
        }: CreateProductDeviceTypeRequest & { productKey: string }) =>
            productDeviceTypesService.createProductDeviceType(productKey, req),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceTypes', productKey],
            });
        },
    });
}

export function useEditProductDeviceTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['editProductDeviceType'],
        mutationFn: ({
            productKey,
            deviceType,
            ...req
        }: UpdateProductDeviceTypeRequest & {
            productKey: string;
            deviceType: string;
        }) =>
            productDeviceTypesService.editProductDeviceType(
                productKey,
                deviceType,
                req,
            ),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceTypes', productKey],
            });
        },
    });
}

export function useDeleteProductDeviceTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteProductDeviceType'],
        mutationFn: ({
            productKey,
            deviceType,
        }: {
            productKey: string;
            deviceType: string;
        }) =>
            productDeviceTypesService.deleteProductDeviceType(
                productKey,
                deviceType,
            ),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productDeviceTypes', productKey],
            });
        },
    });
}
