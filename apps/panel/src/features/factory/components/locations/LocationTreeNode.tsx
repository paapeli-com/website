import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
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
  Copy,
  Tag,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { nodeDisplayName } from "@/features/factory/lib/locationLabels";
import { useAllowedChildTypes } from "@/features/factory/hooks/useAllowedChildTypes";

export interface TreeNode {
  id: string;
  name: string;
  /** Canonical UI kind, used only to pick an icon. */
  type: string;
  /** Raw asset type key from the server — the key the asset-type graph is keyed by. */
  assetType?: string;
  /** Server-side asset label, edited via the asset edit endpoint. */
  label?: string;
  children?: TreeNode[];
  /** Direct (non-recursive) asset/device count attached to this node */
  directAssetCount?: number;
}

interface LocationTreeNodeProps {
  node: TreeNode;
  productKey: string;
  depth?: number;
  /**
   * One flag per indent column, outermost first, saying whether a vertical
   * guide line continues past this row in that column — i.e. whether the
   * ancestor sitting in that column still has siblings below it. The final
   * entry describes this node itself, which is what turns its own connector
   * into a "├" (siblings follow) or an "└" (last child).
   *
   * Length always equals `depth`, so the array doubles as the indent: one
   * 14px column per entry, replacing the padding-based indent this used to
   * have. Empty for the root, which draws no guides.
   */
  lineage?: boolean[];
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  searchQuery: string;
  matchingIds: Set<string>;
  assetCounts: Map<string, number>;
  onSelect: (node: TreeNode) => void;
  onToggle: (nodeId: string) => void;
  onRename: (node: TreeNode) => void;
  onEditLabel: (node: TreeNode) => void;
  onAddChild: (node: TreeNode, assetType?: string) => void;
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

// Icon for one of the server's asset types. The keys are product-defined, so
// this matches on the well-known words rather than an exhaustive list.
const iconForAssetType = (assetType: string) => {
  const s = assetType.toLowerCase();
  if (s.includes("location") || s.includes("site")) return <MapPin className="h-3.5 w-3.5" />;
  if (s.includes("unit") || s.includes("area") || s.includes("line")) return <Factory className="h-3.5 w-3.5" />;
  if (s.includes("asset") || s.includes("device") || s.includes("machine")) return <Cpu className="h-3.5 w-3.5" />;
  return <Plus className="h-3.5 w-3.5" />;
};

/* The "Add <type>" entries, one per asset type the server allows under this
   node. Split into its own component so the allowed-children request fires
   when a menu opens rather than for every node in the tree — Radix keeps the
   menu content unmounted while closed. */
const AddChildMenuItems = ({
  productKey,
  node,
  onAddChild,
  showSeparator,
}: Pick<LocationTreeNodeProps, "productKey" | "node" | "onAddChild"> & {
  /** Whether entries follow these in the menu, and so need a divider. */
  showSeparator: boolean;
}) => {
  const { t } = useLanguage();
  const { options, isLoading } = useAllowedChildTypes(productKey, node.assetType);

  if (isLoading) {
    return <DropdownMenuItem disabled>{t("loading")}</DropdownMenuItem>;
  }
  if (options.length === 0) return null;

  return (
    <>
      {options.map((opt) => (
        <DropdownMenuItem key={opt.assetType} onClick={() => onAddChild(node, opt.assetType)}>
          {iconForAssetType(opt.assetType)}
          {`${t("add")} ${opt.label}`}
        </DropdownMenuItem>
      ))}
      {showSeparator && <DropdownMenuSeparator />}
    </>
  );
};

export const LocationTreeNode = ({
  node,
  productKey,
  depth = 0,
  lineage = [],
  expandedNodes,
  selectedNodeId,
  searchQuery,
  matchingIds,
  assetCounts,
  onSelect,
  onToggle,
  onRename,
  onEditLabel,
  onAddChild,
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

  const displayName = nodeDisplayName(node, t);

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
      {/* The row splits in two: the indent columns, which are never
          highlighted, and everything from the chevron rightwards, which is.
          The selected/hover background used to sit on this outer row, so it
          ran the full width of the panel and filled the indent area behind the
          guide lines. */}
      <div dir={isRTL ? "rtl" : "ltr"} className="group flex items-center ps-2">
        {/* Indent and guide lines in one: a column per ancestor level, which
            is what the old `paddingLeft: depth * 14` did on its own.

            The column width matches the chevron's (w-4) on purpose. Both are
            centred in their own box, and this row's start padding matches the
            highlight's, so a child's connector column sits at exactly the same
            x as its parent's chevron and the spine runs unbroken from a toggle
            down through every one of its children.

            These columns are the row's own children, outside the highlighted
            area and outside its vertical padding — so `self-stretch` covers
            the full row height and one row's line meets the next one's with no
            gap. Positioned with logical `start-*`/`end-*` insets so the whole
            thing mirrors under RTL without a second code path. */}
        {lineage.map((continues, column) => {
          const isConnector = column === lineage.length - 1;
          return (
            <span key={column} className="relative w-4 shrink-0 self-stretch" aria-hidden="true">
              {isConnector ? (
                <>
                  {/* Down to this row's centre, and onward only if a sibling follows ("├" vs "└"). */}
                  <span className={`absolute start-1/2 top-0 w-px bg-border ${continues ? "bottom-0" : "h-1/2"}`} />
                  {/* The elbow's arm. `end-0` lands exactly on the highlight's
                      leading edge, which is where a node with a chevron has
                      its toggle. A leaf has no toggle, so the arm has to cross
                      that empty 16px column and the gap-2 after it to reach
                      the icon — 24px more. */}
                  <span
                    className={`absolute start-1/2 top-1/2 h-px bg-border ${
                      hasChildren ? "end-0" : "-end-6"
                    }`}
                  />
                </>
              ) : (
                continues && <span className="absolute start-1/2 top-0 bottom-0 w-px bg-border" />
              )}
            </span>
          );
        })}
        {/* Everything from here rightwards is what gets the selected/hover
            background — the indent columns above stay clear of it. */}
        <div
          className={`flex-1 flex items-center min-w-0 rounded-md transition-colors ${
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
            className={`flex-1 flex items-center gap-2 py-1.5 pe-2 min-w-0 cursor-pointer ${isRTL ? "text-right text-[15px]" : "text-left text-sm"}`}
          >
            {/* The chevron column doubles as the top of this node's own spine:
                when expanded, a vertical drops from just under the glyph to the
                row's bottom edge, where the first child's connector picks it up.
                Starting at 50% + 7px clears the 14px glyph instead of drawing a
                line through it. The underscores are Tailwind's escape for the
                spaces calc() wants around the "+"; it compiles either way. */}
            <span className="relative w-4 shrink-0 self-stretch -my-1.5 inline-flex items-center justify-center">
              {hasChildren && isExpanded && (
                <span
                  className="absolute start-1/2 top-[calc(50%_+_7px)] bottom-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(node.id);
                  }}
                  className="relative h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : isRTL ? (
                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </span>
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
              {/* Add actions — the set comes from the product's asset-type graph */}
              <AddChildMenuItems
                productKey={productKey}
                node={node}
                onAddChild={onAddChild}
                showSeparator={node.type !== "organization"}
              />

              {/* The product root asset is immutable server-side, so it only
                  offers the add actions above. */}
              {node.type !== "organization" && (
                <>
                  <DropdownMenuItem onClick={() => onRename(node)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {t("rename")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditLabel(node)}>
                    <Tag className="h-3.5 w-3.5" />
                    {t("editLabel")}
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
      </div>
      {hasChildren && isExpanded && node.children!.map((child, i) => (
        <LocationTreeNode
          key={child.id}
          node={child}
          productKey={productKey}
          depth={depth + 1}
          lineage={[...lineage, i < node.children!.length - 1]}
          expandedNodes={expandedNodes}
          selectedNodeId={selectedNodeId}
          searchQuery={searchQuery}
          matchingIds={matchingIds}
          assetCounts={assetCounts}
          onSelect={onSelect}
          onToggle={onToggle}
          onRename={onRename}
          onEditLabel={onEditLabel}
          onAddChild={onAddChild}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
