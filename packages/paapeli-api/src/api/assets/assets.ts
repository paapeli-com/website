import napiHttpHandler from '../napiHttpHandler';

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

export interface PaapeliTreeNode {
    id: string;
    name: string;
    type: string;
    label: string;
    children?: PaapeliTreeNode[];
}

export const assetsService = {
    async create(req: CreateAssetRequest): Promise<PaapeliAsset> {
        const { data } = await napiHttpHandler.post<PaapeliAsset>(
            '/api/v1/aiot/assets',
            req,
        );
        return data;
    },
    async getTree(rootAssetId: string): Promise<PaapeliTreeNode> {
        const { data } = await napiHttpHandler.get<PaapeliTreeNode>(
            `/api/v1/aiot/assets/tree/${rootAssetId}`,
        );
        return data;
    },
};
