import { useMemo } from "react";
import { useGetProductAssetTreeQuery, type PaapeliTreeNode } from "@paapeli/api";
import { PRODUCT_KEY } from "@/lib/product";

export interface AssetLocationOption {
  /** Asset id — this is what device creation sends as `assetId`. */
  id: string;
  /** Full breadcrumb, e.g. "Root Directory > Factory A > Line 1". */
  path: string;
}

/**
 * Flattens the product asset tree (the same tree the Locations page manages)
 * into the flat option list used by the location pickers. Every node is
 * assignable, including the root, since a device just needs an asset to hang
 * off of.
 */
export const useAssetLocations = () => {
  const { data, isLoading, isError } = useGetProductAssetTreeQuery(PRODUCT_KEY);

  const options = useMemo(() => {
    const out: AssetLocationOption[] = [];
    const walk = (node: PaapeliTreeNode, ancestors: string[]) => {
      const path = [...ancestors, node.name];
      out.push({ id: node.id, path: path.join(" > ") });
      node.children?.forEach((c) => walk(c, path));
    };
    if (data) walk(data, []);
    return out;
  }, [data]);

  return { options, isLoading, isError };
};
