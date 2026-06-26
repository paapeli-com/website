// Maps seed location node ids to translation keys so the tree, breadcrumbs
// and detail panel show localized names in FA/AR while preserving English.

const NODE_NAME_KEYS: Record<string, string> = {
  "org-root": "locPaapeliCorp",
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
