import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface PaapeliProductAssetType {
    /** Product key this asset type belongs to. */
    productKey: string;
    /** Stable asset type key used when creating assets. */
    assetType: string;
    /** Human-readable label for the asset type. */
    label: string;
    description?: string;
}

export const productAssetTypesService = {
    async getProductAssetTypes(
        productKey: string,
    ): Promise<PaapeliProductAssetType[]> {
        const { data } = await napiHttpHandler.get<{
            data: PaapeliProductAssetType[];
        }>(`/api/v1/aiot/product-asset-type/${productKey}`);
        return data.data;
    },
    async createProductAssetType(
        req: PaapeliProductAssetType,
    ): Promise<PaapeliProductAssetType> {
        const { data } = await napiHttpHandler.post<PaapeliProductAssetType>(
            '/api/v1/aiot/product-asset-type',
            req,
        );
        return data;
    },
    /** productKey and assetType identify the row and are not changed. */
    async editProductAssetType(
        req: PaapeliProductAssetType,
    ): Promise<PaapeliProductAssetType> {
        const { data } = await napiHttpHandler.put<PaapeliProductAssetType>(
            '/api/v1/aiot/product-asset-type',
            req,
        );
        return data;
    },
    async deleteProductAssetType(
        productKey: string,
        assetType: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/product-asset-type/${productKey}/${assetType}`,
        );
        return data;
    },
};
