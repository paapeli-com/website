import { useQuery } from '@tanstack/react-query';
import { assetsService } from './assets';

export function useGetAssetTreeQuery(rootAssetId: string, enabled = true) {
    return useQuery({
        queryKey: ['assetTree', rootAssetId],
        queryFn: () => assetsService.getTree(rootAssetId),
        enabled: enabled && !!rootAssetId,
    });
}
