import { useMemo } from "react";
import { useGetProductAssetTreeQuery, type ProductAssetTreeNode } from "./useProductAssetTree";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";

export interface AssetLocationOption {
  /** Asset id — this is what device creation sends as `assetId`. */
  id: string;
  /** Full breadcrumb, e.g. "Main Directory > Factory A > Line 1". */
  path: string;
}

/* The tree root's display name in paths. The server names the ROOT asset after
   the product key (e.g. "smartFactory") and won't rename it, so the panel shows
   this instead — as the Locations page does (see nodeDisplayName). Kept in
   English because paths are also stored as text (dashboards); LocationCell
   translates it for display. */
export const ROOT_LOCATION_NAME = "Main Directory";

/**
 * Flattens the product asset tree (the same tree the Locations page manages)
 * into the flat option list used by the location pickers. Every node is
 * assignable, including the root, since a device just needs an asset to hang
 * off of.
 */
export const useAssetLocations = () => {
  // Workspace selected in the host's account menu; empty until it has one,
  // which leaves the query disabled (see @paapeli/brand/workspace).
  const workspaceId = useWorkspaceId();
  const { data, isLoading, isError } = useGetProductAssetTreeQuery(workspaceId ?? "", currentProductKey());

  const options = useMemo(() => {
    const out: AssetLocationOption[] = [];
    const walk = (node: ProductAssetTreeNode, ancestors: string[]) => {
      // The walk starts at the root, so a node with no ancestors is the root.
      const path = [...ancestors, ancestors.length === 0 ? ROOT_LOCATION_NAME : node.name];
      out.push({ id: node.id, path: path.join(" > ") });
      node.children?.forEach((c) => walk(c, path));
    };
    if (data) walk(data, []);
    return out;
  }, [data]);

  // Without a workspace the query is disabled, which react-query reports as
  // "not loading" — for the pickers that's still "not ready yet", not "empty".
  return { options, isLoading: isLoading || !workspaceId, isError };
};
