import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  MapPin,
  Plus,
  ArrowRight,
  ArrowLeft,
  Box,
  Router,
  Cpu,
  Tag,
} from "lucide-react";
import type { TreeNode } from "./LocationTreeNode";
import { useState, useMemo } from "react";
import { localizedNodeName, localizedKindLabel, localizedRelative } from "@/lib/locationLabels";

export interface AssetPreview {
  id: string;
  name: string;
  kind: "device" | "gateway" | "other";
  typeLabel: string;
  status: "online" | "offline" | "error";
  updated: string;
}

interface LocationDetailPanelProps {
  node: TreeNode | null;
  ancestry: TreeNode[]; // root → ... → node (excluding org root)
  assets: AssetPreview[]; // preview list (up to 5)
  totalAssetCount: number;
  parentNode: TreeNode | null;
  onAddAsset: () => void;
  onViewAllAssets: () => void;
  onNavigateAsset: (assetId: string) => void;
  onSelectAncestor: (node: TreeNode) => void;
  onEditLabel: () => void;
}

const fmtType = (t: (k: any) => string, type: string) => {
  switch (type) {
    case "organization": return t("organization");
    case "location": return t("locationLabel");
    case "area": return t("areaUnit");
    case "asset": return t("assets");
    default: return type;
  }
};

const kindIcon = (kind: AssetPreview["kind"]) => {
  switch (kind) {
    case "gateway": return <Router className="h-4 w-4" />;
    case "other": return <Cpu className="h-4 w-4" />;
    default: return <Box className="h-4 w-4" />;
  }
};

export const LocationDetailPanel = ({
  node,
  ancestry,
  assets,
  totalAssetCount,
  parentNode,
  onAddAsset,
  onViewAllAssets,
  onNavigateAsset,
  onSelectAncestor,
  onEditLabel,
}: LocationDetailPanelProps) => {
  const { t, isRTL, formatNumber } = useLanguage();
  const [tab, setTab] = useState<"all" | "device" | "gateway" | "other">("all");

  const counts = useMemo(() => {
    const c = { all: assets.length, device: 0, gateway: 0, other: 0 };
    assets.forEach((a) => { c[a.kind]++; });
    c.all = totalAssetCount;
    return c;
  }, [assets, totalAssetCount]);

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
        <MapPin className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">{t("selectLocationPrompt")}</p>
      </div>
    );
  }

  const filtered = tab === "all" ? assets : assets.filter((a) => a.kind === tab);

  const statusDot = (s: AssetPreview["status"]) => {
    const color = s === "online" ? "bg-green-500" : s === "error" ? "bg-red-500" : "bg-muted-foreground/50";
    const label = s === "online" ? t("online") : s === "error" ? (t("errorStatus") || "Error") : t("offline");
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      {/* Breadcrumbs */}
      {ancestry.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {ancestry.map((n, i) => (
              <span key={n.id} className="flex items-center gap-1.5">
                <BreadcrumbItem>
                  {i === ancestry.length - 1 ? (
                    <BreadcrumbPage className="font-medium">{localizedNodeName(n.id, n.name, t)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => onSelectAncestor(n)}
                    >
                      {localizedNodeName(n.id, n.name, t)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {i < ancestry.length - 1 && <BreadcrumbSeparator />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Context cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <ContextCard label={t("locationType")} value={fmtType(t, node.type)} />
        <ContextCard label={t("parentLocation")} value={parentNode ? localizedNodeName(parentNode.id, parentNode.name, t) : t("rootOrganization")} />
        {node.type !== "asset" && <ContextCard label={t("totalAssets")} value={formatNumber(totalAssetCount)} />}
        <ContextCard label={t("lastUpdated")} value={"—"} />
        <LabelCard
          label={node.label}
          onEdit={onEditLabel}
          editable={node.type !== "organization"}
        />
      </div>

      {/* Assets list — containers only (an asset node has no child assets) */}
      {node.type !== "asset" && (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="bg-transparent p-0 h-auto gap-4">
              <TabsTrigger
                value="all"
                className="px-0 pb-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <span dir={isRTL ? "rtl" : "ltr"} className="inline-flex items-center gap-1.5">
                  <span>{t("allAssets")}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(counts.all)}</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="device"
                className="px-0 pb-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <span dir={isRTL ? "rtl" : "ltr"} className="inline-flex items-center gap-1.5">
                  <span>{t("devicesLabel") || t("devices")}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(counts.device)}</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="gateway"
                className="px-0 pb-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <span dir={isRTL ? "rtl" : "ltr"} className="inline-flex items-center gap-1.5">
                  <span>{t("gateways")}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(counts.gateway)}</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className="px-0 pb-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <span dir={isRTL ? "rtl" : "ltr"} className="inline-flex items-center gap-1.5">
                  <span>{t("other")}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(counts.other)}</span>
                </span>
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3">
            <Box className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noAssetsInLocation")}</p>
            {(node.type === "location" || node.type === "area") && (
              <Button size="sm" onClick={onAddAsset} className="mt-1">
                <Plus className="h-4 w-4" /> {t("addAsset")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("locationType")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("updated") || t("lastUpdated")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 5).map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => onNavigateAsset(a.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-7 w-7 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center">
                          {kindIcon(a.kind)}
                        </span>
                        {a.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{localizedKindLabel(a.kind, t)}</TableCell>
                    <TableCell>{statusDot(a.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{localizedRelative(a.updated, t, formatNumber)}</TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {isRTL ? <ArrowLeft className="h-4 w-4 inline" /> : <ArrowRight className="h-4 w-4 inline" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalAssetCount > 0 && (
              <button
                onClick={onViewAllAssets}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t text-sm text-primary hover:bg-accent/50 transition-colors"
              >
                {t("viewAllAssets")} ({formatNumber(totalAssetCount)})
                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
};

const ContextCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-card px-4 py-3">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-sm font-semibold truncate" title={value}>{value}</div>
  </div>
);

const LabelCard = ({
  label,
  onEdit,
  editable,
}: {
  label?: string;
  onEdit: () => void;
  editable: boolean;
}) => {
  const { t, isRTL } = useLanguage();
  const value = label?.trim();

  const content = (
    <>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        <Tag className="h-3.5 w-3.5" />
        {t("label")}
      </div>
      <div
        className={`text-sm font-semibold truncate ${value ? "" : "text-muted-foreground"}`}
        title={value || undefined}
      >
        {value || "\u2014"}
      </div>
    </>
  );

  // The product root asset is immutable server-side — show it read-only.
  if (!editable) {
    return (
      <div className="flex flex-col rounded-lg border bg-card px-4 py-3" dir={isRTL ? "rtl" : "ltr"}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={t("editLabel")}
      className="flex flex-col rounded-lg border bg-card px-4 py-3 text-start hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {content}
    </button>
  );
};
