import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { ScrollArea } from "@/features/factory/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/factory/components/ui/tooltip";
import {
  Search,
  Plus,
  RefreshCw,
  ChevronsDownUp,
  ChevronsUpDown,
  Cpu,
} from "lucide-react";
import { LocationTreeNode, type TreeNode } from "@/features/factory/components/locations/LocationTreeNode";
import { LocationDetailPanel, type AssetPreview } from "@/features/factory/components/locations/LocationDetailPanel";
import { AddNodeDialog } from "@/features/factory/components/locations/AddNodeDialog";
import { RenameNodeDialog } from "@/features/factory/components/locations/RenameNodeDialog";
import { DeleteNodeDialog } from "@/features/factory/components/locations/DeleteNodeDialog";
import { EditLabelDialog } from "@/features/factory/components/locations/EditLabelDialog";
import {
  LocationTreeSkeleton,
  LocationDetailSkeleton,
} from "@/features/factory/components/locations/LocationsSkeleton";
import { toast } from "sonner";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { DataState } from "@/features/factory/components/DataState";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { nodeDisplayName } from "@/features/factory/lib/locationLabels";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import {
  useProvisionAssetRootMutation,
  useCreateProductAssetTypeMutation,
  useCreateAssetChildMutation,
  useGetAssetDevicesQuery,
} from "@paapeli/api";
import { useGetProductAssetTreeQuery, type ProductAssetTreeNode } from "@/features/factory/hooks/useProductAssetTree";
import { apiErrorMessage } from "@/shared/lib/apiError";


// The API returns free-form `type` strings (the product's own asset types) that
// don't always match our canonical kinds. Node icons and the root-only rules are
// keyed off a known set, so we canonicalize for those. Recognized types are kept
// as-is; anything else is inferred from the node's depth, following the fixed
// hierarchy: root(0) → Location(1) → Unit/Area(2) → Asset(3+).
// The raw type is kept on the node as `assetType` — the "..." add menu and the
// Add dialog read the real asset-type graph from the server off it.
const CANONICAL_TYPES = new Set(["organization", "location", "area", "asset"]);
const canonicalType = (raw: string | undefined | null, depth: number): string => {
  // The tree root is always the top container, whatever the server stored.
  if (depth <= 0) return "organization";
  const s = (raw || "").trim().toLowerCase();
  if (CANONICAL_TYPES.has(s)) return s;
  // Unknown/foreign type: infer from depth along root → Location → Unit → Asset.
  if (depth === 1) return "location";
  if (depth === 2) return "area";
  return "asset";
};

const mapApiTreeNode = (node: ProductAssetTreeNode, depth = 0): TreeNode => ({
  id: node.id,
  name: node.name,
  type: canonicalType(node.type, depth),
  assetType: node.type,
  label: node.label ?? undefined,
  children: node.children?.map((c) => mapApiTreeNode(c, depth + 1)) ?? [],
});

const EMPTY_TREE: TreeNode = { id: "root", name: "", type: "organization", children: [] };


// ---------- Helpers ----------
const collectMatchingIds = (root: TreeNode, query: string): Set<string> => {
  const result = new Set<string>();
  const walk = (n: TreeNode): boolean => {
    const selfMatch = n.name.toLowerCase().includes(query.toLowerCase());
    let childMatch = false;
    if (n.children) for (const c of n.children) if (walk(c)) childMatch = true;
    if (selfMatch || childMatch) { result.add(n.id); return true; }
    return false;
  };
  walk(root);
  return result;
};

const findNode = (root: TreeNode, id: string): TreeNode | null => {
  if (root.id === id) return root;
  if (root.children) for (const c of root.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
};

const findParent = (root: TreeNode, id: string, parent: TreeNode | null = null): TreeNode | null => {
  if (root.id === id) return parent;
  if (root.children) for (const c of root.children) {
    const f = findParent(c, id, root);
    if (f !== null) return f;
  }
  return null;
};

const findAncestry = (root: TreeNode, id: string): TreeNode[] => {
  const path: TreeNode[] = [];
  const walk = (n: TreeNode): boolean => {
    path.push(n);
    if (n.id === id) return true;
    if (n.children) for (const c of n.children) if (walk(c)) return true;
    path.pop();
    return false;
  };
  walk(root);
  return path.filter((n) => n.type !== "organization");
};

const collectIds = (n: TreeNode, acc: Set<string>) => {
  acc.add(n.id);
  n.children?.forEach((c) => collectIds(c, acc));
};

const mapTree = (root: TreeNode, fn: (n: TreeNode) => TreeNode | null): TreeNode | null => {
  const m = fn(root);
  if (!m) return null;
  if (m.children) m.children = m.children.map((c) => mapTree(c, fn)).filter(Boolean) as TreeNode[];
  return m;
};

/* Total device count (direct + descendants) per node. `directAssetCount` is
   only populated for the node currently selected — the API counts devices one
   asset at a time (GET /devices/{ws}/{pk}/asset/{assetId}), and walking the
   whole tree would be one request per node. Unvisited nodes therefore count 0
   rather than showing a made-up number. */
const computeAssetCounts = (root: TreeNode): Map<string, number> => {
  const map = new Map<string, number>();
  const walk = (n: TreeNode): number => {
    const direct = n.directAssetCount ?? 0;
    let sum = direct;
    if (n.children) for (const c of n.children) sum += walk(c);
    map.set(n.id, sum);
    return sum;
  };
  walk(root);
  return map;
};

/** One page of devices is all the detail panel previews. */
const ASSET_DEVICE_PAGE_SIZE = 100;

const Locations = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Workspace selected in the host's account menu — every asset endpoint is
  // scoped to /{workspaceId}/{productKey}. Null until the host has one, which
  // keeps the queries below disabled (see @paapeli/brand/workspace).
  const workspaceId = useWorkspaceId();

  const { data: apiTree, isLoading: treeLoading, isError: treeError, error: treeErrorObj, refetch: refetchTree } = useGetProductAssetTreeQuery(workspaceId ?? "", PRODUCT_KEY);

  // The backend returns this code when the product simply has no asset tree
  // yet — that's an empty state, not a failure, so don't show an error.
  const treeNotFound = (treeErrorObj as any)?.response?.data?.code === "ASSET_TREE_NOT_FOUND";

  /* No workspace yet means the query is still disabled rather than empty, so
     it counts as loading — otherwise the panel would flash its empty state
     before the host has picked a workspace. */
  const treeIsLoading = treeLoading || !workspaceId;

  const provisionRoot = useProvisionAssetRootMutation();
  const createAssetChild = useCreateAssetChildMutation();

  // Register the default asset type for this product once per mount. Safe to
  // no-op/409 on repeat visits — we don't surface that to the user.
  const createProductAssetType = useCreateProductAssetTypeMutation();
  const didRegisterAssetType = useRef(false);
  // useEffect(() => {
  //   if (didRegisterAssetType.current) return;
  //   didRegisterAssetType.current = true;
  //   createProductAssetType.mutate({
  //     productKey: PRODUCT_KEY,
  //     assetType: "moosdss",
  //     label: "Default",
  //   });
  // }, []); // eslint-disable-line

  const [tree, setTree] = useState<TreeNode>(EMPTY_TREE);

  /* Nodes this page has already auto-expanded. Expansion is "open by default"
     rather than "always open": every node is expanded the first time it is
     seen, but a node the user has since collapsed by hand is not re-opened by
     the next refetch (add, rename, duplicate and refresh all trigger one). */
  const autoExpanded = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!apiTree) return;
    const mapped = mapApiTreeNode(apiTree);
    setTree(mapped);

    const ids = new Set<string>();
    collectIds(mapped, ids);
    const unseen = [...ids].filter((id) => !autoExpanded.current.has(id));
    if (unseen.length === 0) return;
    unseen.forEach((id) => autoExpanded.current.add(id));
    setExpandedNodes((prev) => new Set([...prev, ...unseen]));
  }, [apiTree]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addDefaultType, setAddDefaultType] = useState<string | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelTarget, setLabelTarget] = useState<TreeNode | null>(null);

  /** Node whose subtree is mid-copy, so a second Duplicate can't interleave. */
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Select the root node once the tree has loaded
  useEffect(() => {
    if (!selectedNode && apiTree) {
      setSelectedNode(mapApiTreeNode(apiTree));
    }
  }, [apiTree]); // eslint-disable-line

  const matchingIds = useMemo(
    () => (searchQuery ? collectMatchingIds(tree, searchQuery) : new Set<string>()),
    [tree, searchQuery]
  );

  useMemo(() => {
    if (searchQuery && matchingIds.size > 0) {
      setExpandedNodes((prev) => new Set([...prev, ...matchingIds]));
    }
  }, [matchingIds, searchQuery]);

  const assetCounts = useMemo(() => computeAssetCounts(tree), [tree]);

  /* Devices hanging off whichever node is selected —
     GET /api/v1/aiot/devices/{workspaceId}/{productKey}/asset/{assetId}. */
  const { data: selectedDevicesPage } = useGetAssetDevicesQuery(
    workspaceId ?? "",
    PRODUCT_KEY,
    selectedNode?.id ?? "",
    0,
    ASSET_DEVICE_PAGE_SIZE,
  );

  const selectedAssetPreviews = useMemo<AssetPreview[]>(
    () =>
      (selectedDevicesPage?.data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        // The device record carries no gateway flag, so everything reads as a device.
        kind: "device" as const,
        typeLabel: d.type,
        // `active` is a boolean; there is no third "error" state behind it.
        status: d.active ? ("online" as const) : ("offline" as const),
        updated: d.updatedAt ?? d.createdAt,
      })),
    [selectedDevicesPage],
  );

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const expandAll = () => {
    const all = new Set<string>();
    collectIds(tree, all);
    setExpandedNodes(all);
  };
  const collapseAll = () => setExpandedNodes(new Set([tree.id]));

  // ----- Mutations -----
  // The dialog itself performs the create call against the API; here we just
  // refresh the tree from the server and reflect the new node in the UI.
  const handleAdd = () => {
    refetchTree();
    setExpandedNodes((p) => new Set([...p, addParentId || tree.id]));
    toast.success(t("success"));
  };

  // Apply an in-place edit to one node of the local tree, keeping the detail
  // panel's copy in sync when that node is the selected one.
  const patchNode = (nodeId: string, apply: (n: TreeNode) => void) => {
    setTree((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as TreeNode;
      const n = findNode(updated, nodeId);
      if (n) apply(n);
      return updated;
    });
    setSelectedNode((prev) => {
      if (!prev || prev.id !== nodeId) return prev;
      const next = { ...prev };
      apply(next);
      return next;
    });
  };

  // Both of these run after the dialog's edit call succeeded — they patch the
  // local tree for an immediate update while the invalidated query refetches.
  const handleRename = (newName: string) => {
    if (!renameTarget) return;
    patchNode(renameTarget.id, (n) => { n.name = newName; });
    toast.success(t("success"));
  };

  const handleEditLabel = (newLabel: string) => {
    if (!labelTarget) return;
    patchNode(labelTarget.id, (n) => { n.label = newLabel; });
    toast.success(t("success"));
  };

  // The dialog performs the delete call; here we drop the node from the local
  // tree so the UI updates immediately (the invalidated query refreshes it from
  // the server right after) and move the selection off the removed subtree.
  const handleDelete = () => {
    if (!deleteTarget) return;
    const removedIds = new Set<string>();
    collectIds(deleteTarget, removedIds);
    const parent = findParent(tree, deleteTarget.id);
    setTree((prev) => {
      const updated = mapTree(JSON.parse(JSON.stringify(prev)), (n) => (n.id === deleteTarget.id ? null : n));
      return updated || EMPTY_TREE;
    });
    if (selectedNode && removedIds.has(selectedNode.id)) setSelectedNode(parent);
    toast.success(t("deleted"));
  };

  /* Copy a subtree on the server rather than in local state, which is what
     this used to do — it invented `node-<timestamp>` ids that existed only in
     the browser, so the copy vanished on the next refetch and any action taken
     on it in the meantime failed against an id the backend had never issued.

     There is no server-side copy endpoint, so the subtree is recreated one
     POST at a time, depth-first, each child parented to the copy its own
     parent just produced. Sequential on purpose: a child cannot be created
     until its parent's real id comes back. */
  const handleDuplicate = async (node: TreeNode) => {
    if (duplicatingId) return;
    if (!workspaceId) return void toast.error(t("noWorkspaceSelected"));

    const parent = findParent(tree, node.id);
    if (!parent) return void toast.error(t("cannotDuplicateRoot"));

    setDuplicatingId(node.id);
    try {
      const copySubtree = async (parentAssetId: string, src: TreeNode, name: string) => {
        const created = await createAssetChild.mutateAsync({
          workspaceId,
          productKey: PRODUCT_KEY,
          parentAssetId,
          name,
          // The raw server-side asset type, not the canonical UI kind — the
          // backend validates it against the product's asset-type graph.
          type: src.assetType ?? src.type,
          label: src.label,
        });
        for (const child of src.children ?? []) {
          await copySubtree(created.id, child, child.name);
        }
      };

      // Only the top of the copy is renamed; descendants keep their names,
      // which stay unique because they land under a fresh parent.
      await copySubtree(parent.id, node, `${node.name} (copy)`);
      await refetchTree();
      toast.success(t("success"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("failedToDuplicate")));
      // Part of the subtree may have been created before the failure, so pull
      // the real shape back rather than leaving a half-copy on screen.
      await refetchTree();
    } finally {
      setDuplicatingId(null);
    }
  };

  // ----- UI handlers -----
  // Footer button: provisions the single root asset for the product. The root
  // is normally created at sign-in (see ensureWorkspaceSetup in
  // src/login/LoginPage), so this is the fallback when that step failed.
  // Children are added via each node's "..." menu once the root is there.
  const handleProvisionRoot = () => {
    if (provisionRoot.isPending) return;
    if (!workspaceId) return void toast.error(t("noWorkspaceSelected"));
    provisionRoot.mutate({ workspaceId, productKey: PRODUCT_KEY }, {
      onSuccess: async () => {
        /* The mutation invalidates ['assetRoot', ...] — a different query from
           the one this page reads (['productAssetTree', ...], defined in
           hooks/useProductAssetTree). Nothing was refetching, so the panel sat
           on the cached ASSET_TREE_NOT_FOUND error and the button looked dead.
           Refetch explicitly, the way handleAdd and handleRefresh do. */
        await refetchTree();
        toast.success(t("success"));
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, t("failedToProvisionRoot")));
      },
    });
  };

  // `assetType` is set when the user picked a specific type from the node's
  // "..." menu; the detail panel's add button leaves it unset so the dialog
  // asks which of the allowed types to create.
  const handleAddChild = (node: TreeNode, assetType?: string) => {
    setAddParentId(node.id);
    setAddDefaultType(assetType ?? null);
    setAddDialogOpen(true);
  };

  const openLabelDialog = (node: TreeNode) => {
    setLabelTarget(node);
    setLabelDialogOpen(true);
  };

  const buildLocationPath = (id: string) =>
    findAncestry(tree, id).map((n) => n.name).join(" / ");

  const getLocalizedPath = (path: string) => localizedPath(path, language);

  const handleAddAssetOnNode = (node: TreeNode) => {
    const path = buildLocationPath(node.id);
    navigate(getLocalizedPath(`/devices?action=add&location=${encodeURIComponent(path)}`));
  };

  const handleViewAllAssets = () => {
    if (!selectedNode) return;
    const path = buildLocationPath(selectedNode.id);
    navigate(getLocalizedPath(`/devices?location=${encodeURIComponent(path)}`));
  };

  const handleNavigateAsset = (assetId: string) => {
    navigate(getLocalizedPath(`/devices/${assetId}`));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTree();
    setRefreshing(false);
    toast.success(t("success"));
  };

  // ----- Derived for detail panel -----
  const ancestry = selectedNode ? findAncestry(tree, selectedNode.id) : [];
  const parentNode = selectedNode ? findParent(tree, selectedNode.id) : null;
  const previewAssets = selectedAssetPreviews;
  const totalAssetCount = selectedDevicesPage?.totalElements ?? 0;

  return (
    <>
      {/* Header */}
      <PageHeader title={t("locations")} />

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Left: Tree */}
        <Card dir={isRTL ? "rtl" : "ltr"} className={`${isRTL ? "w-[340px]" : "w-80"} shrink-0 flex flex-col`}>
          <CardHeader className="pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`font-medium ${isRTL ? "text-base" : "text-sm"}`}>{t("allLocations")}</CardTitle>
            </div>
            <div className="relative">
              <Search
                className="absolute top-2.5 h-4 w-4 text-muted-foreground"
                style={{ [isRTL ? "right" : "left"]: 10 }}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchLocation")}
                className={`h-9 ${isRTL ? "text-base" : "text-sm"}`}
                style={{ [isRTL ? "paddingRight" : "paddingLeft"]: 32 }}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 px-2 pb-2">
            {/* Loading gets the tree-shaped skeleton (spinner included, see
                LocationsSkeleton); DataState still owns the error case. The
                no-workspace-yet case is folded into treeIsLoading above. */}
            {treeIsLoading ? (
              <LocationTreeSkeleton />
            ) : treeError && !treeNotFound ? (
              <DataState error onRetry={() => refetchTree()} size="sm" />
            ) : treeNotFound ? (
              <div className="py-10 text-center text-sm text-muted-foreground">{t("noLocationTree")}</div>
            ) : (
              <LocationTreeNode
                node={tree}
                productKey={PRODUCT_KEY}
                expandedNodes={expandedNodes}
                selectedNodeId={selectedNode?.id || null}
                searchQuery={searchQuery}
                matchingIds={matchingIds}
                assetCounts={assetCounts}
                onSelect={setSelectedNode}
                onToggle={toggleExpand}
                onRename={(n) => { setRenameTarget(n); setRenameDialogOpen(true); }}
                onEditLabel={openLabelDialog}
                onAddChild={handleAddChild}
                onDuplicate={handleDuplicate}
                onDelete={(n) => { setDeleteTarget(n); setDeleteDialogOpen(true); }}
              />
            )}
          </ScrollArea>
          {/* Only relevant before the product has a root asset — provisions
              the single root node. Children are added via each node's "..."
              menu once the root exists. */}
          {treeNotFound && (
            <div className="p-2 border-t">
              <Button className="w-full gap-2" onClick={handleProvisionRoot} disabled={provisionRoot.isPending}>
                {provisionRoot.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("addNode")}
              </Button>
            </div>
          )}
        </Card>

        {/* Right: Details */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {treeIsLoading ? (
              <LocationDetailSkeleton />
            ) : (
            <LocationDetailPanel
              node={selectedNode}
              ancestry={ancestry}
              assets={previewAssets}
              totalAssetCount={totalAssetCount}
              parentNode={parentNode}
              onAddAsset={() => selectedNode && handleAddChild(selectedNode)}
              onViewAllAssets={handleViewAllAssets}
              onNavigateAsset={handleNavigateAsset}
              onSelectAncestor={(n) => setSelectedNode(n)}
              onEditLabel={() => selectedNode && openLabelDialog(selectedNode)}
            />
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Dialogs */}
      <AddNodeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        workspaceId={workspaceId ?? ""}
        productKey={PRODUCT_KEY}
        parentId={addParentId}
        parentName={(() => {
          const parent = addParentId ? findNode(tree, addParentId) : null;
          return parent ? nodeDisplayName(parent, t) : undefined;
        })()}
        parentAssetType={addParentId ? findNode(tree, addParentId)?.assetType : undefined}
        defaultType={addDefaultType}
        onAdd={handleAdd}
      />
      <RenameNodeDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        workspaceId={workspaceId ?? ""}
        productKey={PRODUCT_KEY}
        nodeId={renameTarget?.id}
        parentId={renameTarget ? findParent(tree, renameTarget.id)?.id : undefined}
        currentName={renameTarget?.name || ""}
        currentLabel={renameTarget?.label}
        onRename={handleRename}
      />
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workspaceId={workspaceId ?? ""}
        productKey={PRODUCT_KEY}
        nodeId={deleteTarget?.id}
        parentId={deleteTarget ? findParent(tree, deleteTarget.id)?.id : undefined}
        nodeName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
      />
      <EditLabelDialog
        open={labelDialogOpen}
        onOpenChange={setLabelDialogOpen}
        workspaceId={workspaceId ?? ""}
        productKey={PRODUCT_KEY}
        nodeId={labelTarget?.id}
        parentId={labelTarget ? findParent(tree, labelTarget.id)?.id : undefined}
        nodeName={labelTarget?.name || ""}
        currentLabel={labelTarget?.label}
        onSave={handleEditLabel}
      />
    </>
  );
};

export default Locations;
