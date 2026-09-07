import napiHttpHandler from '../napiHttpHandler';

/** Product-specific ThingsBoard resources to provision. */
export type TbProvisioningTemplate = 'NONE' | 'GPS_TRACKING_V1';

export interface ProductDTO {
    productKey: string;
    name: string;
    /** Defaults to 'NONE' server-side. */
    tbProvisioningTemplate?: TbProvisioningTemplate;
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
