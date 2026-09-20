// Maps seed location node ids to translation keys so the tree, breadcrumbs
// and detail panel show localized names in FA/AR while preserving English.

import { ROOT_LOCATION_NAME } from "@/features/factory/hooks/useAssetLocations";

const NODE_NAME_KEYS: Record<string, string> = {
  // The root is deliberately unmapped, but no longer for the reason this note
  // used to give ("its own editable name, the user can rename it") — that was
  // true of the old seed data. The live API assigns the ROOT asset's name and
  // refuses to change it: POST .../root takes no body and PUT .../{assetId}
  // rejects the ROOT node. Renaming it needs a gateway change first.
  "loc-qazvin": "locQazvin",
  "loc-factory-a": "locFactoryAName",
  "loc-factory-b": "locFactoryBName",
  "loc-sulfonation": "locSulfonationName",
  "loc-nitration": "locNitrationName",
  "loc-packaging": "locPackagingName",
  "loc-line-1": "locProductionLine1",
  "loc-line-2": "locProductionLine2",
  "loc-line-b1": "locLineB1Name",
};

export const localizedNodeName = (
  id: string,
  fallback: string,
  t: (k: any) => string,
): string => {
  const key = NODE_NAME_KEYS[id];
  if (!key) return fallback;
  const v = t(key);
  // If the key is missing the framework returns the key itself.
  return v && v !== key ? v : fallback;
};

/**
 * What to show for a node, for display only — nothing here is ever sent back.
 *
 * The tree root is the one node whose name the panel overrides. The server
 * assigns the ROOT asset's name (it comes back as the product key, e.g.
 * "smartFactory") and refuses to change it — POST .../root takes no body and
 * PUT .../{assetId} rejects the ROOT node — so a friendly name can only exist
 * on this side. The real name stays on the node, so any request that carries a
 * name still carries the server's.
 *
 * The root's name stays English in every language: it stands in for a
 * server-side name, and a translated root read oddly mid-path next to the
 * untranslated names below it (e.g. "پوشه اصلی > Asset2 > Unit").
 */
export const nodeDisplayName = (
  node: { id: string; name: string; type: string },
  t: (k: any) => string,
): string =>
  node.type === "organization" ? ROOT_LOCATION_NAME : localizedNodeName(node.id, node.name, t);

export const localizedKindLabel = (
  kind: "device" | "gateway" | "other",
  t: (k: any) => string,
): string => {
  switch (kind) {
    case "gateway": return t("gateway") || "Gateway";
    case "other": return t("other") || "Other";
    default: return t("device") || "Device";
  }
};

// Format strings like "2 min ago", "15 sec ago", "1 hour ago", "Just now"
export const localizedRelative = (
  s: string,
  t: (k: any) => string,
  formatNumber?: (n: number | string) => string,
): string => {
  if (!s) return s;
  const trimmed = s.trim();
  if (/^just\s*now$/i.test(trimmed)) return t("justNow") || trimmed;
  const m = trimmed.match(/^(\d+)\s*(sec|min|hour|day)s?\s*ago$/i);
  if (!m) return trimmed;
  const n = formatNumber ? formatNumber(m[1]) : m[1];
  const unit = m[2].toLowerCase();
  const unitKey =
    unit === "sec" ? "relSecondsAgo" :
    unit === "min" ? "relMinutesAgo" :
    unit === "hour" ? "relHoursAgo" :
    "relDaysAgo";
  const template = t(unitKey);
  if (!template || template === unitKey) return trimmed;
  return template.replace("{n}", n);
};
