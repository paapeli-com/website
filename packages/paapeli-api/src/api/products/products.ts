import napiHttpHandler from '../napiHttpHandler';

export interface ProductDTO {
    productKey: string;
    name: string;
}

export const productsService = {
    async getProducts(): Promise<ProductDTO[]> {
        const { data } = await napiHttpHandler.get<ProductDTO[]>(
            '/api/v1/aiot/products',
        );
        return data;
    },
    async createProduct(req: ProductDTO): Promise<ProductDTO> {
        const { data } = await napiHttpHandler.post<ProductDTO>(
            '/api/v1/aiot/products',
            req,
        );
        return data;
    },
};
