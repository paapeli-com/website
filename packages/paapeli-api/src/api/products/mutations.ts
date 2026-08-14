import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductDTO, productsService } from './products';

export function useCreateProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createProduct'],
        mutationFn: (req: ProductDTO) => productsService.createProduct(req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
