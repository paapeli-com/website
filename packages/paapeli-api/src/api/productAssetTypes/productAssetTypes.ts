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

export type CreateProductAssetTypeRequest = Pick<
    PaapeliProductAssetType,
    'assetType' | 'label' | 'description'
>;

export type UpdateProductAssetTypeRequest = Pick<
    PaapeliProductAssetType,
    'label' | 'description'
>;

export const productAssetTypesService = {
    async getProductAssetTypes(
        productKey: string,
    ): Promise<PaapeliProductAssetType[]> {
        const { data } = await napiHttpHandler.get<{
            data: PaapeliProductAssetType[];
        }>(`/api/v1/aiot/products/${productKey}/asset-types`);
        return data.data;
    },
    async createProductAssetType(
        productKey: string,
        req: CreateProductAssetTypeRequest,
    ): Promise<PaapeliProductAssetType> {
        const { data } = await napiHttpHandler.post<PaapeliProductAssetType>(
            `/api/v1/aiot/products/${productKey}/asset-types`,
            req,
        );
        return data;
    },
    async editProductAssetType(
        productKey: string,
        assetType: string,
        req: UpdateProductAssetTypeRequest,
    ): Promise<PaapeliProductAssetType> {
        const { data } = await napiHttpHandler.put<PaapeliProductAssetType>(
            `/api/v1/aiot/products/${productKey}/asset-types/${assetType}`,
            req,
        );
        return data;
    },
    async deleteProductAssetType(
        productKey: string,
        assetType: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/products/${productKey}/asset-types/${assetType}`,
        );
        return data;
    },
    /** List the asset types allowed as direct children of `parentAssetType`. */
    async getAllowedChildren(
        productKey: string,
        parentAssetType: string,
    ): Promise<PaapeliProductAssetType[]> {
        const { data } = await napiHttpHandler.get<{
            data: PaapeliProductAssetType[];
        }>(
            `/api/v1/aiot/products/${productKey}/asset-types/${parentAssetType}/allowed-children`,
        );
        return data.data;
    },
    /** Allow `childAssetType` as a direct child of `parentAssetType`. */
    async allowChild(
        productKey: string,
        parentAssetType: string,
        childAssetType: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.put<PaapeliMessage>(
            `/api/v1/aiot/products/${productKey}/asset-types/${parentAssetType}/allowed-children/${childAssetType}`,
        );
        return data;
    },
    /** Remove the direct-child rule between `parentAssetType` and `childAssetType`. */
    async disallowChild(
        productKey: string,
        parentAssetType: string,
        childAssetType: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/products/${productKey}/asset-types/${parentAssetType}/allowed-children/${childAssetType}`,
        );
        return data;
    },
};
