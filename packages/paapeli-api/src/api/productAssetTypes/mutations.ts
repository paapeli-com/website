import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateProductAssetTypeRequest,
    productAssetTypesService,
    UpdateProductAssetTypeRequest,
} from './productAssetTypes';

export function useCreateProductAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createProductAssetType'],
        mutationFn: ({
            productKey,
            ...req
        }: CreateProductAssetTypeRequest & { productKey: string }) =>
            productAssetTypesService.createProductAssetType(productKey, req),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypes', productKey],
            });
        },
    });
}

export function useEditProductAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['editProductAssetType'],
        mutationFn: ({
            productKey,
            assetType,
            ...req
        }: UpdateProductAssetTypeRequest & {
            productKey: string;
            assetType: string;
        }) => productAssetTypesService.editProductAssetType(productKey, assetType, req),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypes', productKey],
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

export function useAllowChildAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['allowChildAssetType'],
        mutationFn: ({
            productKey,
            parentAssetType,
            childAssetType,
        }: {
            productKey: string;
            parentAssetType: string;
            childAssetType: string;
        }) => productAssetTypesService.allowChild(productKey, parentAssetType, childAssetType),
        onSuccess: (_data, { productKey, parentAssetType }) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypeAllowedChildren', productKey, parentAssetType],
            });
        },
    });
}

export function useDisallowChildAssetTypeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['disallowChildAssetType'],
        mutationFn: ({
            productKey,
            parentAssetType,
            childAssetType,
        }: {
            productKey: string;
            parentAssetType: string;
            childAssetType: string;
        }) =>
            productAssetTypesService.disallowChild(productKey, parentAssetType, childAssetType),
        onSuccess: (_data, { productKey, parentAssetType }) => {
            queryClient.invalidateQueries({
                queryKey: ['productAssetTypeAllowedChildren', productKey, parentAssetType],
            });
        },
    });
}
