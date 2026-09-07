import { useQuery } from '@tanstack/react-query';
import { productDeviceTypesService } from './productDeviceTypes';

export function useGetProductDeviceTypesQuery(
    productKey: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['productDeviceTypes', productKey],
        queryFn: () =>
            productDeviceTypesService.getProductDeviceTypes(productKey),
        enabled: enabled && !!productKey,
    });
}
