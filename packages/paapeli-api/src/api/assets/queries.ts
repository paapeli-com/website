import { useQuery } from '@tanstack/react-query';
import { assetsService } from './assets';

export function useGetAssetRootQuery(
    workspaceId: string,
    productKey: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['assetRoot', workspaceId, productKey],
        queryFn: () => assetsService.getRoot(workspaceId, productKey),
        enabled: enabled && !!workspaceId && !!productKey,
    });
}

export function useGetAssetChildrenQuery(
    workspaceId: string,
    productKey: string,
    parentAssetId: string,
    page: number,
    size: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['assetChildren', workspaceId, productKey, parentAssetId, page, size],
        queryFn: () =>
            assetsService.getChildren(workspaceId, productKey, parentAssetId, page, size),
        enabled: enabled && !!workspaceId && !!productKey && !!parentAssetId,
    });
}

export function useGetAllowedChildTypesQuery(
    workspaceId: string,
    productKey: string,
    parentAssetId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['assetAllowedChildTypes', workspaceId, productKey, parentAssetId],
        queryFn: () =>
            assetsService.getAllowedChildTypes(workspaceId, productKey, parentAssetId),
        enabled: enabled && !!workspaceId && !!productKey && !!parentAssetId,
    });
}
