import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';
import { PaapeliProductAssetType } from '../productAssetTypes/productAssetTypes';

export type AssetProvisioningState = 'PROVISIONING' | 'ACTIVE' | 'FAILED';

/**
 * A node in a workspace product's asset hierarchy. There is no single
 * "get whole tree" endpoint anymore — walk the hierarchy by fetching
 * `root` and then paging through `getChildren` per node as it's expanded.
 */
export interface Asset {
    id: string;
    /** Absent/undefined for the root asset. */
    parentId?: string;
    name: string;
    type: string;
    label?: string;
    description?: string;
    provisioningState: AssetProvisioningState;
    createdAt: string;
    updatedAt: string;
    /** Whether this asset has at least one child (avoids an extra fetch to find out). */
    hasChildren: boolean;
}

export type CreateAssetRequest = Pick<Asset, 'name' | 'type' | 'label' | 'description'>;

export interface UpdateAssetRequest {
    /** Asset ID to update. */
    id: string;
    name: string;
    label?: string;
    description?: string;
}

export const assetsService = {
    /** Get the single root asset for a workspace product. */
    async getRoot(workspaceId: string, productKey: string): Promise<Asset> {
        const { data } = await napiHttpHandler.get<Asset>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/root`,
        );
        return data;
    },
    /** Provision the root asset for a workspace product. Call once per workspace product. */
    async provisionRoot(workspaceId: string, productKey: string): Promise<Asset> {
        const { data } = await napiHttpHandler.post<Asset>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/root`,
        );
        return data;
    },
    /** List the direct children of an asset (paginated). */
    async getChildren(
        workspaceId: string,
        productKey: string,
        parentAssetId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<Asset>> {
        const { data } = await napiHttpHandler.get<PageResponse<Asset>>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/${parentAssetId}/children`,
            { page, size },
        );
        return data;
    },
    /** Create a child asset under `parentAssetId`. */
    async createChild(
        workspaceId: string,
        productKey: string,
        parentAssetId: string,
        req: CreateAssetRequest,
    ): Promise<Asset> {
        const { data } = await napiHttpHandler.post<Asset>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/${parentAssetId}/children`,
            req,
        );
        return data;
    },
    /**
     * Update name, label, and description of an existing asset.
     * Type and hierarchy are unchanged; the root asset is immutable.
     */
    async updateAsset(
        workspaceId: string,
        productKey: string,
        req: UpdateAssetRequest,
    ): Promise<Asset> {
        const { id, ...body } = req;
        const { data } = await napiHttpHandler.put<Asset>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/${id}`,
            body,
        );
        return data;
    },
    /** Delete an asset. The root asset cannot be deleted. */
    async deleteAsset(
        workspaceId: string,
        productKey: string,
        assetId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/${assetId}`,
        );
        return data;
    },
    /** List the asset types allowed as direct children of `parentAssetId`. */
    async getAllowedChildTypes(
        workspaceId: string,
        productKey: string,
        parentAssetId: string,
    ): Promise<PaapeliProductAssetType[]> {
        const { data } = await napiHttpHandler.get<{ data: PaapeliProductAssetType[] }>(
            `/api/v1/aiot/assets/${workspaceId}/${productKey}/${parentAssetId}/allowed-child-types`,
        );
        return data.data;
    },
};
