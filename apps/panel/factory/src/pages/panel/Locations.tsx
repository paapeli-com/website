import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  RefreshCw,
  ChevronsDownUp,
  ChevronsUpDown,
  Cpu,
} from "lucide-react";
import { LocationTreeNode, type TreeNode } from "@/components/locations/LocationTreeNode";
import { LocationDetailPanel, type AssetPreview } from "@/components/locations/LocationDetailPanel";
import { AddNodeDialog } from "@/components/locations/AddNodeDialog";
import { RenameNodeDialog } from "@/components/locations/RenameNodeDialog";
import { DeleteNodeDialog } from "@/components/locations/DeleteNodeDialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useGetAssetTreeQuery, type PaapeliTreeNode } from "@paapeli/api";

const ROOT_ASSET_ID = "7c613570-836f-11f1-a92c-4f03335be81b";

const mapApiTreeNode = (node: PaapeliTreeNode): TreeNode => ({
  id: node.id,
  name: node.name,
  type: node.type || "asset",
  children: node.children?.map(mapApiTreeNode) ?? [],
});

const EMPTY_TREE: TreeNode = { id: ROOT_ASSET_ID, name: "", type: "organization", children: [] };

// ---------- Mock assets per location ----------
const MOCK_ASSETS_BY_LOCATION: Record<string, AssetPreview[]> = {
  "loc-line-1": [
    { id: "dev-001", name: "Temp Sensor A5", kind: "device", typeLabel: "Device", status: "online", updated: "2 min ago" },
    { id: "dev-002", name: "Vibration Sensor F9", kind: "device", typeLabel: "Device", status: "online", updated: "15 sec ago" },
    { id: "dev-003", name: "Flow Rate Meter E8", kind: "device", typeLabel: "Device", status: "error", updated: "Just now" },
    { id: "dev-004", name: "Humidity Sensor D7", kind: "device", typeLabel: "Device", status: "online", updated: "1 hour ago" },
    { id: "dev-005", name: "Energy Monitor C6", kind: "gateway", typeLabel: "Gateway", status: "offline", updated: "11 sec ago" },
  ],
  "loc-line-2": [
    { id: "dev-006", name: "Temp Sensor A3", kind: "device", typeLabel: "Device", status: "online", updated: "5 min ago" },
    { id: "dev-007", name: "Pressure Sensor B2", kind: "device", typeLabel: "Device", status: "online", updated: "1 min ago" },
  ],
  "loc-nitration": [
    { id: "dev-008", name: "Flow Meter G4", kind: "device", typeLabel: "Device", status: "online", updated: "8 min ago" },
    { id: "dev-009", name: "Voltage Monitor H1", kind: "device", typeLabel: "Device", status: "online", updated: "2 hour ago" },
  ],
};

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

// Compute total asset count (direct + descendants) per node
const computeAssetCounts = (root: TreeNode): Map<string, number> => {
  const map = new Map<string, number>();
  const walk = (n: TreeNode): number => {
    const direct = MOCK_ASSETS_BY_LOCATION[n.id]?.length ?? n.directAssetCount ?? 0;
    let sum = direct;
    if (n.children) for (const c of n.children) sum += walk(c);
    map.set(n.id, sum);
    return sum;
  };
  walk(root);
  return map;
};

let nextId = 1;

const Locations = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: apiTree, isLoading: treeLoading, isError: treeError, refetch: refetchTree } = useGetAssetTreeQuery(ROOT_ASSET_ID);

  const [tree, setTree] = useState<TreeNode>(EMPTY_TREE);

  useEffect(() => {
    if (apiTree) setTree(mapApiTreeNode(apiTree));
  }, [apiTree]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([ROOT_ASSET_ID]));
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentType, setAddParentType] = useState<TreeNode["type"] | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addDefaultType, setAddDefaultType] = useState<"location" | "area" | "asset" | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

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
  const collapseAll = () => setExpandedNodes(new Set([ROOT_ASSET_ID]));

  // ----- Mutations -----
  // The dialog itself performs the create call against the API; here we just
  // refresh the tree from the server and reflect the new node in the UI.
  const handleAdd = (_name: string, _type: "location" | "area" | "asset", _tags: string[] = []) => {
    refetchTree();
    setExpandedNodes((p) => new Set([...p, addParentId || ROOT_ASSET_ID]));
    toast.success(t("success"));
  };

  const handleRename = (newName: string) => {
    if (!renameTarget) return;
    setTree((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as TreeNode;
      const n = findNode(updated, renameTarget.id);
      if (n) n.name = newName;
      return updated;
    });
    if (selectedNode?.id === renameTarget.id) setSelectedNode({ ...renameTarget, name: newName });
    toast.success(t("success"));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTree((prev) => {
      const updated = mapTree(JSON.parse(JSON.stringify(prev)), (n) => (n.id === deleteTarget.id ? null : n));
      return updated || EMPTY_TREE;
    });
    if (selectedNode?.id === deleteTarget.id) setSelectedNode(null);
    setDeleteDialogOpen(false);
    toast.success(t("deleted"));
  };

  const handleDuplicate = (node: TreeNode) => {
    const clone = JSON.parse(JSON.stringify(node)) as TreeNode;
    const rekey = (n: TreeNode) => {
      n.id = `node-${Date.now()}-${nextId++}`;
      if (n.children) n.children.forEach(rekey);
    };
    rekey(clone);
    clone.name = `${clone.name} (copy)`;
    setTree((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as TreeNode;
      const parent = findParent(updated, node.id);
      const parentNode = parent ? findNode(updated, parent.id) : updated;
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(clone);
      }
      return updated;
    });
    toast.success(t("success"));
  };

  const handleMove = (_node: TreeNode) => {
    toast.info(t("comingSoon") || "Coming soon");
  };

  // ----- UI handlers -----
  const handleTopAddLocation = () => {
    // Footer button: add under the selected container (or the root).
    const target = selectedNode && selectedNode.type !== "asset" ? selectedNode : null;
    setAddParentId(target?.id || ROOT_ASSET_ID);
    setAddParentType(target?.type || "organization");
    setAddDefaultType(null);
    setAddDialogOpen(true);
  };

  const handleAddChild = (node: TreeNode, type: "location" | "area" | "asset") => {
    setAddParentId(node.id);
    setAddParentType(node.type);
    setAddDefaultType(type);
    setAddDialogOpen(true);
  };

  const buildLocationPath = (id: string) =>
    findAncestry(tree, id).map((n) => n.name).join(" / ");

  const getLocalizedPath = (path: string) => (language === "en" ? path : `/${language}${path}`);

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
  const previewAssets = selectedNode ? (MOCK_ASSETS_BY_LOCATION[selectedNode.id] || []) : [];
  const totalAssetCount = selectedNode ? (assetCounts.get(selectedNode.id) ?? 0) : 0;

  return (
    <PanelLayout pageTitle={t("locations")}>
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
            {treeLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">{t("loading") || "Loading..."}</div>
            ) : treeError ? (
              <div className="py-10 text-center text-sm text-destructive">{t("errorStatus") || "Failed to load locations"}</div>
            ) : (
              <LocationTreeNode
                node={tree}
                expandedNodes={expandedNodes}
                selectedNodeId={selectedNode?.id || null}
                searchQuery={searchQuery}
                matchingIds={matchingIds}
                assetCounts={assetCounts}
                onSelect={setSelectedNode}
                onToggle={toggleExpand}
                onRename={(n) => { setRenameTarget(n); setRenameDialogOpen(true); }}
                onAddChild={handleAddChild}
                onMove={handleMove}
                onDuplicate={handleDuplicate}
                onDelete={(n) => { setDeleteTarget(n); setDeleteDialogOpen(true); }}
              />
            )}
          </ScrollArea>
          {/* Primary add action, contextual to the tree (adds under the
              selected container, or the root). */}
          <div className="p-2 border-t">
            <Button className="w-full gap-2" onClick={handleTopAddLocation}>
              <Plus className="h-4 w-4" />
              {t("addNode")}
            </Button>
          </div>
        </Card>

        {/* Right: Details */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <LocationDetailPanel
              node={selectedNode}
              ancestry={ancestry}
              assets={previewAssets}
              totalAssetCount={totalAssetCount}
              parentNode={parentNode}
              onAddAsset={() => selectedNode && handleAddChild(selectedNode, "asset")}
              onViewAllAssets={handleViewAllAssets}
              onNavigateAsset={handleNavigateAsset}
              onSelectAncestor={(n) => setSelectedNode(n)}
            />
          </ScrollArea>
        </Card>
      </div>

      {/* Dialogs */}
      <AddNodeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentId={addParentId}
        parentType={addParentType}
        parentName={addParentId ? findNode(tree, addParentId)?.name : undefined}
        defaultType={addDefaultType}
        onAdd={handleAdd}
      />
      <RenameNodeDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={renameTarget?.name || ""}
        onRename={handleRename}
      />
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        nodeName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
      />
    </PanelLayout>
  );
};

export default Locations;
