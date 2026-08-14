import { useQuery } from '@tanstack/react-query';
import { productsService } from './products';

export function useGetProductsQuery(enabled = true) {
    return useQuery({
        queryKey: ['products'],
        queryFn: () => productsService.getProducts(),
        enabled,
    });
}
