import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    PaapeliProductAssetType,
    productAssetTypesService,
} from './productAssetTypes';

export function useCreateProductAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createProductAssetType'],
        mutationFn: (req: PaapeliProductAssetType) =>
            productAssetTypesService.createProductAssetType(req),
        onSuccess: (_data, req) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypes', req.productKey],
            });
        },
    });
}

export function useEditProductAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['editProductAssetType'],
        mutationFn: (req: PaapeliProductAssetType) =>
            productAssetTypesService.editProductAssetType(req),
        onSuccess: (_data, req) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypes', req.productKey],
            });
        },
    });
}

export function useDeleteProductAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteProductAssetType'],
        mutationFn: ({
            productKey,
            assetType,
        }: {
            productKey: string;
            assetType: string;
        }) =>
            productAssetTypesService.deleteProductAssetType(
                productKey,
                assetType,
            ),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypes', productKey],
            });
        },
    });
}
