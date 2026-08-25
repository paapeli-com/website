import { useQuery } from "@tanstack/react-query";
import { assetsService, type Asset } from "@paapeli/api";

/**
 * The new asset API has no "get whole tree" endpoint — only `getRoot` plus
 * paginated `getChildren` per node. The Locations page (and its dialogs)
 * still work in terms of a fully-loaded tree, so this reconstructs one
 * client-side: fetch the root, then recursively page through every node's
 * children. Fine for the asset counts these products actually have; if a
 * workspace product ever grows large enough for this to matter, Locations
 * should move to lazy per-node fetching instead of widening this.
 */
export interface ProductAssetTreeNode {
    id: string;
    name: string;
    type: string;
    label?: string | null;
    children: ProductAssetTreeNode[];
}

const CHILDREN_PAGE_SIZE = 200;

async function fetchAllChildren(
    workspaceId: string,
    productKey: string,
    parentId: string,
): Promise<Asset[]> {
    const collected: Asset[] = [];
    let page = 0;
    while (true) {
        const res = await assetsService.getChildren(
            workspaceId,
            productKey,
            parentId,
            page,
            CHILDREN_PAGE_SIZE,
        );
        collected.push(...res.data);
        if (!res.hasNext) break;
        page += 1;
    }
    return collected;
}

async function fetchSubtree(
    workspaceId: string,
    productKey: string,
    node: Asset,
): Promise<ProductAssetTreeNode> {
    let children: ProductAssetTreeNode[] = [];
    if (node.hasChildren) {
        const childAssets = await fetchAllChildren(workspaceId, productKey, node.id);
        children = await Promise.all(
            childAssets.map((c) => fetchSubtree(workspaceId, productKey, c)),
        );
    }
    return { id: node.id, name: node.name, type: node.type, label: node.label, children };
}

export function useGetProductAssetTreeQuery(
    workspaceId: string,
    productKey: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ["productAssetTree", workspaceId, productKey],
        queryFn: async () => {
            const root = await assetsService.getRoot(workspaceId, productKey);
            return fetchSubtree(workspaceId, productKey, root);
        },
        enabled: enabled && !!workspaceId && !!productKey,
        // A missing root (ASSET_TREE_NOT_FOUND) is a normal empty state, not
        // a transient failure — don't hammer the backend retrying it.
        retry: false,
    });
}
