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

// ---------- Seed industrial hierarchy ----------
const seedTree = (): TreeNode => ({
  id: "org-root",
  name: "Paapeli Corp",
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

const LOCATIONS_STORAGE_KEY = "paapeli-locations-tree-v1";

const loadTree = (): TreeNode => {
  try {
    const raw = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as TreeNode;
    }
  } catch {}
  return seedTree();
};

const saveTree = (tree: TreeNode) => {
  try {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(tree));
  } catch {}
};

const Locations = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tree, setTree] = useState<TreeNode>(loadTree);

  useEffect(() => { saveTree(tree); }, [tree]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["org-root", "loc-qazvin", "loc-factory-a", "loc-sulfonation"])
  );
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentType, setAddParentType] = useState<TreeNode["type"] | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  // Default select Line 1 for showcase
  useEffect(() => {
    if (!selectedNode) {
      const initial = findNode(tree, "loc-line-1");
      if (initial) setSelectedNode(initial);
    }
  }, []); // eslint-disable-line

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
  const collapseAll = () => setExpandedNodes(new Set(["org-root"]));

  // ----- Mutations -----
  const handleAdd = (name: string, type: "location" | "area" | "asset") => {
    const newNode: TreeNode = {
      id: `node-${Date.now()}-${nextId++}`,
      name,
      type,
      children: type === "asset" ? undefined : [],
    };
    setTree((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as TreeNode;
      const parent = findNode(updated, addParentId || "org-root");
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(newNode);
      }
      return updated;
    });
    setExpandedNodes((p) => new Set([...p, addParentId || "org-root"]));
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
      return updated || seedTree();
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
    setAddParentId(selectedNode?.id || "org-root");
    setAddParentType(selectedNode?.type || "organization");
    setAddDialogOpen(true);
  };

  const handleAddLocationOnNode = (node: TreeNode) => {
    setAddParentId(node.id);
    setAddParentType(node.type);
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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success(t("success"));
    }, 600);
  };

  // ----- Derived for detail panel -----
  const ancestry = selectedNode ? findAncestry(tree, selectedNode.id) : [];
  const parentNode = selectedNode ? findParent(tree, selectedNode.id) : null;
  const previewAssets = selectedNode ? (MOCK_ASSETS_BY_LOCATION[selectedNode.id] || []) : [];
  const totalAssetCount = selectedNode ? (assetCounts.get(selectedNode.id) ?? 0) : 0;

  return (
    <PanelLayout pageTitle={t("locations")}>
      {/* Header */}
      <PageHeader
        title={t("locations")}
        count={(() => {
          let n = 0;
          const walk = (node: TreeNode) => {
            if (node.type === "location") n++;
            node.children?.forEach(walk);
          };
          walk(tree);
          return n;
        })()}
        countLabel={t("locations")}
        actions={
          <>
            <Button onClick={handleTopAddLocation} className="h-10 gap-2">
              <Plus className="h-4 w-4" />
              {t("addLocation")}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={expandAll}>
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("expandAll")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={collapseAll}>
                    <ChevronsDownUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("collapseAll")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("refresh")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        }
      />

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
              onAddLocation={handleAddLocationOnNode}
              onAddAsset={handleAddAssetOnNode}
              onMove={handleMove}
              onDuplicate={handleDuplicate}
              onDelete={(n) => { setDeleteTarget(n); setDeleteDialogOpen(true); }}
            />
          </ScrollArea>
          <div className="p-2 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={handleTopAddLocation}>
              <Plus className="h-4 w-4" />
              {t("addLocation")}
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
              onAddAsset={() => selectedNode && handleAddAssetOnNode(selectedNode)}
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
        parentType={addParentType}
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
