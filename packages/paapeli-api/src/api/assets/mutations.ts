import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, CreateAssetRequest, UpdateAssetRequest } from './assets';

export function useProvisionAssetRootMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['provisionAssetRoot'],
        mutationFn: ({
            workspaceId,
            productKey,
        }: {
            workspaceId: string;
            productKey: string;
        }) => assetsService.provisionRoot(workspaceId, productKey),
        onSuccess: (_data, { workspaceId, productKey }) => {
            queryClient.invalidateQueries({ queryKey: ['assetRoot', workspaceId, productKey] });
        },
    });
}

export function useCreateAssetChildMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createAssetChild'],
        mutationFn: ({
            workspaceId,
            productKey,
            parentAssetId,
            ...req
        }: CreateAssetRequest & {
            workspaceId: string;
            productKey: string;
            parentAssetId: string;
        }) => assetsService.createChild(workspaceId, productKey, parentAssetId, req),
        onSuccess: (_data, { workspaceId, productKey, parentAssetId }) => {
            queryClient.invalidateQueries({
                queryKey: ['assetChildren', workspaceId, productKey, parentAssetId],
            });
            queryClient.invalidateQueries({ queryKey: ['assetRoot', workspaceId, productKey] });
        },
    });
}

export function useUpdateAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['updateAsset'],
        mutationFn: ({
            workspaceId,
            productKey,
            parentAssetId: _parentAssetId,
            ...req
        }: UpdateAssetRequest & {
            workspaceId: string;
            productKey: string;
            /** Only used to target cache invalidation on success, if known. */
            parentAssetId?: string;
        }) => assetsService.updateAsset(workspaceId, productKey, req),
        onSuccess: (_data, { workspaceId, productKey, parentAssetId }) => {
            queryClient.invalidateQueries({
                // Omitting parentAssetId invalidates every parent's children
                // list for this workspace product — a broader but still-safe
                // refresh when the caller doesn't have it handy.
                queryKey: parentAssetId
                    ? ['assetChildren', workspaceId, productKey, parentAssetId]
                    : ['assetChildren', workspaceId, productKey],
            });
        },
    });
}

export function useDeleteAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteAsset'],
        mutationFn: ({
            workspaceId,
            productKey,
            assetId,
        }: {
            workspaceId: string;
            productKey: string;
            assetId: string;
            /** Only used to target cache invalidation on success, if known. */
            parentAssetId?: string;
        }) => assetsService.deleteAsset(workspaceId, productKey, assetId),
        onSuccess: (_data, { workspaceId, productKey, parentAssetId }) => {
            queryClient.invalidateQueries({
                queryKey: parentAssetId
                    ? ['assetChildren', workspaceId, productKey, parentAssetId]
                    : ['assetChildren', workspaceId, productKey],
            });
            queryClient.invalidateQueries({ queryKey: ['assetRoot', workspaceId, productKey] });
        },
    });
}
