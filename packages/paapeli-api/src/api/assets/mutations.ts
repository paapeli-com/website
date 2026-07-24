import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, CreateAssetRequest } from './assets';

/** @deprecated Use `useAddChildAssetMutation` instead. */
export function useCreateAssetMutation() {
    return useMutation({
        mutationKey: ['createAsset'],
        mutationFn: (req: CreateAssetRequest) => assetsService.create(req),
    });
}

export function useAddChildAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['addChildAsset'],
        mutationFn: ({
            productKey,
            ...req
        }: CreateAssetRequest & { productKey: string }) =>
            assetsService.addChildAsset(productKey, req),
        onSuccess: (_data, { productKey }) => {
            queryClient.invalidateQueries({ queryKey: ['productAssetTree', productKey] });
        },
    });
}

export function useProvisionRootNodeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['provisionRootNode'],
        mutationFn: (productKey: string) =>
            assetsService.provisionRootNode(productKey),
        onSuccess: (_data, productKey) => {
            queryClient.invalidateQueries({ queryKey: ['productAssetTree', productKey] });
        },
    });
}
