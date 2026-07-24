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
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { localizedNodeName } from "@/lib/locationLabels";

export interface TreeNode {
  id: string;
  name: string;
  type: string;
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
  onEditTags: (node: TreeNode) => void;
  onAddChild: (node: TreeNode, type: "location" | "area" | "asset") => void;
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

// Graph rules — which child types each node type may contain:
//   organization → location, unit, asset   location → unit, asset
//   unit (area)  → asset                    asset    → (none)
const canAddLocation = (type: string) => type === "organization";
const canAddArea = (type: string) => type === "organization" || type === "location";
const canAddAsset = (type: string) => type === "organization" || type === "location" || type === "area";

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
  onEditTags,
  onAddChild,
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
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            onSelect(node);
            if (hasChildren && !isExpanded) onToggle(node.id);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            onSelect(node);
            if (hasChildren && !isExpanded) onToggle(node.id);
          }}
          dir={isRTL ? "rtl" : "ltr"}
          className={`flex-1 flex items-center gap-2 py-1.5 px-2 min-w-0 cursor-pointer ${isRTL ? "text-right text-[15px]" : "text-left text-sm"}`}
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
        </div>

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
            {/* Add actions — gated by the graph hierarchy */}
            {canAddLocation(node.type) && (
              <DropdownMenuItem onClick={() => onAddChild(node, "location")}>
                <MapPin className="h-3.5 w-3.5" />
                {t("addLocation")}
              </DropdownMenuItem>
            )}
            {canAddArea(node.type) && (
              <DropdownMenuItem onClick={() => onAddChild(node, "area")}>
                <Factory className="h-3.5 w-3.5" />
                {t("addUnit")}
              </DropdownMenuItem>
            )}
            {canAddAsset(node.type) && (
              <DropdownMenuItem onClick={() => onAddChild(node, "asset")}>
                <Cpu className="h-3.5 w-3.5" />
                {t("addAsset")}
              </DropdownMenuItem>
            )}
            {node.type !== "asset" && <DropdownMenuSeparator />}

            <DropdownMenuItem onClick={() => onRename(node)}>
              <Pencil className="h-3.5 w-3.5" />
              {t("rename")}
            </DropdownMenuItem>

            {/* Tags apply to every node type. */}
            <DropdownMenuItem onClick={() => onEditTags(node)}>
              <Tag className="h-3.5 w-3.5" />
              {t("editTags")}
            </DropdownMenuItem>

            {/* Root can only be renamed; everything else can be moved/removed. */}
            {node.type !== "organization" && (
              <>
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
          onEditTags={onEditTags}
          onAddChild={onAddChild}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
