import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface PaapeliAsset {
    /** Server generated - omit on create. */
    id?: string;
    /** Null for root assets. */
    parentId?: string | null;
    /** Server generated - omit on create. */
    createdTime?: number;
    /** Server managed - omit on create. */
    version?: number;
    name: string;
    type: string;
    label?: string | null;
    description?: string | null;
    customerId?: string | null;
}

export type CreateAssetRequest = Pick<
    PaapeliAsset,
    'name' | 'type' | 'label' | 'description' | 'parentId' | 'customerId'
>;

export interface EditAssetRequest {
    /** Asset ID to update. */
    id: string;
    name: string;
    label: string;
    description?: string;
}

export interface PaapeliTreeNode {
    id: string;
    name: string;
    type: string;
    label: string;
    children?: PaapeliTreeNode[];
}

export const assetsService = {
    /** @deprecated Use `addChildAsset` instead. */
    async create(req: CreateAssetRequest): Promise<PaapeliAsset> {
        const { data } = await napiHttpHandler.post<PaapeliAsset>(
            '/api/v1/aiot/assets',
            req,
        );
        return data;
    },
    /** @deprecated Use `getProductAssetTree` instead. */
    async getTree(rootAssetId: string): Promise<PaapeliTreeNode> {
        const { data } = await napiHttpHandler.get<PaapeliTreeNode>(
            `/api/v1/aiot/assets/tree/${rootAssetId}`,
        );
        return data;
    },
    /** Add a child asset under the product's root node (or under `parentId` when set). */
    async addChildAsset(
        productKey: string,
        req: CreateAssetRequest,
    ): Promise<PaapeliAsset> {
        const { data } = await napiHttpHandler.post<PaapeliAsset>(
            `/api/v1/aiot/assets/${productKey}`,
            req,
        );
        return data;
    },
    /**
     * Update name, label, and description of an existing child asset.
     * Type and hierarchy are unchanged; the product root asset is immutable.
     */
    async editAsset(
        productKey: string,
        req: EditAssetRequest,
    ): Promise<PaapeliAsset> {
        const { data } = await napiHttpHandler.put<PaapeliAsset>(
            `/api/v1/aiot/assets/${productKey}`,
            req,
        );
        return data;
    },
    /** Delete a child asset. The product root asset cannot be deleted. */
    async deleteAsset(
        productKey: string,
        assetId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/assets/${productKey}/${assetId}`,
        );
        return data;
    },
    /** Provision the single root asset for a product. Call once per product. */
    async provisionRootNode(productKey: string): Promise<PaapeliAsset> {
        const { data } = await napiHttpHandler.post<PaapeliAsset>(
            `/api/v1/aiot/assets/${productKey}/provision-root`,
        );
        return data;
    },
    async getProductAssetTree(productKey: string): Promise<PaapeliTreeNode> {
        const { data } = await napiHttpHandler.get<PaapeliTreeNode>(
            `/api/v1/aiot/assets/${productKey}/tree`,
        );
        return data;
    },
};
