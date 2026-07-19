import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Building2,
  Factory,
  ChevronRight,
  ChevronDown,
  Cpu,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Move,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { localizedNodeName } from "@/lib/locationLabels";

export interface TreeNode {
  id: string;
  name: string;
  type: "organization" | "location" | "area" | "asset";
  children?: TreeNode[];
  /** Direct (non-recursive) asset/device count attached to this node */
  directAssetCount?: number;
  /** Free-form tags shown in the detail panel */
  tags?: string[];
}

interface LocationTreeNodeProps {
  node: TreeNode;
  depth?: number;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  searchQuery: string;
  matchingIds: Set<string>;
  assetCounts: Map<string, number>;
  onSelect: (node: TreeNode) => void;
  onToggle: (nodeId: string) => void;
  onRename: (node: TreeNode) => void;
  onAddLocation: (node: TreeNode) => void;
  onAddAsset: (node: TreeNode) => void;
  onMove: (node: TreeNode) => void;
  onDuplicate: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

const getNodeIcon = (type: string, isSelected: boolean) => {
  const cls = `h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`;
  switch (type) {
    case "organization":
      return <Building2 className={`h-4 w-4 shrink-0 text-primary`} />;
    case "location":
      return <MapPin className={cls} />;
    case "area":
      return <Factory className={cls} />;
    case "asset":
      return <Cpu className={cls} />;
    default:
      return <MapPin className={cls} />;
  }
};

const canHaveChildren = (type: string) => type !== "asset";
const canHaveAssets = (type: string) => type === "location" || type === "area";

export const LocationTreeNode = ({
  node,
  depth = 0,
  expandedNodes,
  selectedNodeId,
  searchQuery,
  matchingIds,
  assetCounts,
  onSelect,
  onToggle,
  onRename,
  onAddLocation,
  onAddAsset,
  onMove,
  onDuplicate,
  onDelete,
}: LocationTreeNodeProps) => {
  const { t, isRTL, formatNumber } = useLanguage();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isMatch = matchingIds.has(node.id);
  const count = assetCounts.get(node.id) ?? 0;

  if (searchQuery && !isMatch) return null;

  const displayName = localizedNodeName(node.id, node.name, t);

  const renderName = () => {
    if (!searchQuery) return displayName;
    const idx = displayName.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return displayName;
    return (
      <>
        {displayName.slice(0, idx)}
        <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">
          {displayName.slice(idx, idx + searchQuery.length)}
        </mark>
        {displayName.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <div>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`group flex items-center rounded-md transition-colors ${
          isSelected ? "bg-primary/10" : "hover:bg-accent/60"
        }`}
      >
        <button
          onClick={() => {
            onSelect(node);
            if (hasChildren && !isExpanded) onToggle(node.id);
          }}
          dir={isRTL ? "rtl" : "ltr"}
          className={`flex-1 flex items-center gap-2 py-1.5 px-2 min-w-0 ${isRTL ? "text-right text-[15px]" : "text-left text-sm"}`}
          style={{ [isRTL ? "paddingRight" : "paddingLeft"]: `${depth * 14 + 6}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              className="shrink-0 h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : isRTL ? (
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          {getNodeIcon(node.type, isSelected)}
          <span className={`truncate ${isSelected ? "text-primary font-medium" : ""}`}>
            {renderName()}
          </span>
          {count > 0 && (
            <span className={`text-muted-foreground shrink-0 tabular-nums ${isRTL ? "text-xs" : "text-[11px]"}`}>
              ({formatNumber(count)})
            </span>
          )}
          <span className="flex-1" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Actions"
              className={`h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ${isRTL ? "ml-1 mr-0" : "mr-1 ml-0"}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-44 bg-popover z-50">
            {node.type === "organization" ? (
              // The root can only be renamed.
              <DropdownMenuItem onClick={() => onRename(node)}>
                <Pencil className="h-3.5 w-3.5" />
                {t("rename")}
              </DropdownMenuItem>
            ) : (
              <>
                {canHaveChildren(node.type) && (
                  <DropdownMenuItem onClick={() => onAddLocation(node)}>
                    <Plus className="h-3.5 w-3.5" />
                    {t("addLocation")}
                  </DropdownMenuItem>
                )}
                {canHaveAssets(node.type) && (
                  <DropdownMenuItem onClick={() => onAddAsset(node)}>
                    <Cpu className="h-3.5 w-3.5" />
                    {t("addAsset")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRename(node)}>
                  <Pencil className="h-3.5 w-3.5" />
                  {t("rename")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)}>
                  <Move className="h-3.5 w-3.5" />
                  {t("move")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(node)}>
                  <Copy className="h-3.5 w-3.5" />
                  {t("duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("delete")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isExpanded && node.children!.map((child) => (
        <LocationTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          selectedNodeId={selectedNodeId}
          searchQuery={searchQuery}
          matchingIds={matchingIds}
          assetCounts={assetCounts}
          onSelect={onSelect}
          onToggle={onToggle}
          onRename={onRename}
          onAddLocation={onAddLocation}
          onAddAsset={onAddAsset}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
