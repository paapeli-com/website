import { useMemo } from "react";
import {
  useGetAllowedChildrenQuery,
  useGetProductAssetTypesQuery,
} from "@paapeli/api";

export interface AllowedChildType {
  /** Server key, sent as the asset's `type` when creating it. */
  assetType: string;
  /** Human-readable label from the product's asset-type catalogue. */
  label: string;
}

/**
 * Which child asset types a node of `parentAssetType` may contain, labelled
 * from the product's asset-type catalogue:
 *
 *   GET /products/{productKey}/asset-types                           → labels
 *   GET /products/{productKey}/asset-types/{parent}/allowed-children → the set
 *
 * Both are cached per product/parent, so the tree's "..." menu and the Add
 * dialog share them. Callers pass `enabled` so nothing is fetched until a menu
 * or dialog actually opens — this is never a page-mount request.
 */
export function useAllowedChildTypes(
  productKey: string,
  parentAssetType: string | undefined,
  enabled = true,
) {
  const catalogue = useGetProductAssetTypesQuery(productKey, enabled);
  const allowed = useGetAllowedChildrenQuery(
    productKey,
    parentAssetType ?? "",
    enabled,
  );

  const options = useMemo<AllowedChildType[]>(() => {
    const labels = new Map(
      (catalogue.data ?? []).map((type) => [type.assetType, type.label]),
    );
    return (allowed.data ?? []).map((child) => ({
      assetType: child.assetType,
      // The catalogue is the label authority; the allowed-children payload
      // carries one too, and the raw key is the last resort.
      label: labels.get(child.assetType) || child.label || child.assetType,
    }));
  }, [catalogue.data, allowed.data]);

  return {
    options,
    isLoading: allowed.isLoading || catalogue.isLoading,
    isError: allowed.isError || catalogue.isError,
  };
}
