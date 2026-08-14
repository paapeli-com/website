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

export function useGetAllowedChildrenQuery(
    productKey: string,
    parentAssetType: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['productAssetTypeAllowedChildren', productKey, parentAssetType],
        queryFn: () =>
            productAssetTypesService.getAllowedChildren(productKey, parentAssetType),
        enabled: enabled && !!productKey && !!parentAssetType,
    });
}
