import { useQuery } from '@tanstack/react-query';
import { productAssetTypesService } from './productAssetTypes';

export function useGetProductAssetTypesQuery(
    productKey: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['productAssetTypes', productKey],
        queryFn: () => productAssetTypesService.getProductAssetTypes(productKey),
        enabled: enabled && !!productKey,
    });
}
