import { useQuery } from '@tanstack/react-query';
import { assetsService } from './assets';

/** @deprecated Use `useGetProductAssetTreeQuery` instead. */
export function useGetAssetTreeQuery(rootAssetId: string, enabled = true) {
    return useQuery({
        queryKey: ['assetTree', rootAssetId],
        queryFn: () => assetsService.getTree(rootAssetId),
        enabled: enabled && !!rootAssetId,
    });
}

export function useGetProductAssetTreeQuery(productKey: string, enabled = true) {
    return useQuery({
        queryKey: ['productAssetTree', productKey],
        queryFn: () => assetsService.getProductAssetTree(productKey),
        enabled: enabled && !!productKey,
    });
}
