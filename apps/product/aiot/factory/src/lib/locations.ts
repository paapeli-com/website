import type { TreeNode } from "@/components/locations/LocationTreeNode";

// Single source for location data — backed by the Location feature (side menu → Location).
// Today it reads the same localStorage tree the Location page manages; in future this is
// the seam where a real API call replaces loadLocationTree().
export const LOCATIONS_STORAGE_KEY = "paapeli-locations-tree-v1";

// Mirrors the seed used by the Location page so options exist before the user opens it.
const seedLocationTree = (): TreeNode => ({
  id: "org-root",
  name: "Root Directory",
  type: "organization",
  children: [
    {
      id: "loc-qazvin",
      name: "Qazvin",
      type: "location",
      children: [
        {
          id: "loc-factory-a",
          name: "Factory A",
          type: "location",
          children: [
            {
              id: "loc-sulfonation",
              name: "Sulfonation",
              type: "area",
              directAssetCount: 18,
              children: [
                { id: "loc-line-1", name: "Line 1", type: "area", directAssetCount: 12, children: [] },
                { id: "loc-line-2", name: "Line 2", type: "area", directAssetCount: 12, children: [] },
              ],
            },
            { id: "loc-nitration", name: "Nitration", type: "area", directAssetCount: 24, children: [] },
            { id: "loc-packaging", name: "Packaging", type: "area", directAssetCount: 16, children: [] },
          ],
        },
        {
          id: "loc-factory-b",
          name: "Factory B",
          type: "location",
          directAssetCount: 0,
          children: [
            { id: "loc-line-b1", name: "Line B1", type: "area", directAssetCount: 8, children: [] },
          ],
        },
      ],
    },
  ],
});

export const loadLocationTree = (): TreeNode => {
  try {
    const raw = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as TreeNode;
    }
  } catch {}
  return seedLocationTree();
};

export interface LocationOption {
  id: string;
  path: string; // full breadcrumb, e.g. "Qazvin > Factory A > Sulfonation > Line 1"
}

// Flattens the location tree into assignable options (location + area nodes), skipping
// the organization root and any asset leaves.
export const getLocationOptions = (): LocationOption[] => {
  const out: LocationOption[] = [];
  const walk = (node: TreeNode, ancestors: string[]) => {
    if (node.type === "organization") {
      node.children?.forEach((c) => walk(c, ancestors));
      return;
    }
    if (node.type === "asset") return;
    const path = [...ancestors, node.name];
    out.push({ id: node.id, path: path.join(" > ") });
    node.children?.forEach((c) => walk(c, path));
  };
  walk(loadLocationTree(), []);
  return out;
};

// Root (top-most) location used as the default when the user doesn't pick one.
export const getDefaultLocationPath = (): string => getLocationOptions()[0]?.path || "";
