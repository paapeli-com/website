/* ------------------------------------------------------------------ */
/* Shared white-label / tenant config (framework-agnostic).           */
/* Read at RUNTIME (after build) so one build serves every customer.   */
/* Today values are local mocks; later resolveBrand() fetches the same */
/* shape from the gateway ( GET /tenant-config?host=… ).               */
/* ------------------------------------------------------------------ */

/* Cloud-provider products shown in the top-bar product switcher.       */
/* Shared so every product app offers the same switch list. A product   */
/* may contain one or more Solutions (specialised domains/apps) that     */
/* appear as a tree under the product.                                   */
export type Solution = {
     id: string;
            name: string;
  href?: string;
  disabled?: boolean;
  /** Workspace-product key (see @paapeli/api workspaces.subscribeWorkspaceProduct)
   *  this solution's backend calls are scoped under: every endpoint like
   *  /api/v1/aiot/<resource>/{workspaceId}/{productKey}/… 404s until the
   *  active workspace holds a subscription for it. Absent for a solution
   *  with no such scope. Single source of truth — the host reads it to
   *  subscribe before mounting the solution's remote, and the remote reads
   *  it for its own API calls, so the two can't drift apart on the string. */
  productKey?: string;
  /** Built but not launched: a host shows it only where it opens unreleased
   *  products (the panel's staging). */
  unreleased?: boolean;
};
export type Product = { id: string; name: string; href?: string; disabled?: boolean; solutions?: Solution[] };

export const PRODUCTS: Product[] = [
  {
    id: "aiot",
    name: "AIoT",
    solutions: [
      /* Smart Infrastructure leads the family. Its id stays SmartFactory:
         that is its URL and its subscription key. */
      { id: "SmartFactory", name: "Smart Infrastructure", productKey: "smartFactory" },
      { id: "GPSTracking", name: "Fleet Management", productKey: "gpsTracking" },
      { id: "SmartGreenhouse", name: "Smart Greenhouse", productKey: "smartGreenhouse" },
    ],
  },
  { id: "ai", name: "AI Infra", disabled: true },
];

/** The workspace-product key a solution's API calls are scoped under. */
export function productKeyFor(solutionId: string): string | undefined {
  for (const product of PRODUCTS) {
    const solution = product.solutions?.find((s) => s.id === solutionId);
    if (solution) return solution.productKey;
  }
  return undefined;
}

/* Base URL segment for the product that owns the solutions above.       */
/* Solution routes are `/{PRODUCT_BASE}/{solutionId}` on one host, e.g.  */
/* panel.paapeli.com/AIoT/track and panel.paapeli.com/AIoT/factory.       */
export const PRODUCT_BASE = "AIoT";

export function solutionPath(solutionId: string) {
  return `/${PRODUCT_BASE}/${solutionId}`;
}

/* The signed-in account is no longer a constant here. It was a single
   hardcoded person — name, email and initial — rendered in every solution's
   header, so the panel showed the same identity whoever had logged in. Read
   it from the session instead: getCurrentUser() in ./session. */

export type BrandConfig = {
  tenantId: string;
  appName: string;
  /** Brand primary as an HSL triplet "H S% L%" (overrides --primary). */
  primary: string;
  primaryForeground: string;
  defaultLang: "en" | "fa" | "ar";
  features: {
    geofences: boolean;
    playback: boolean;
    alerts: boolean;
    health: boolean;
    attendance: boolean;
  };
};

/** Default Paapeli tenant — brand orange, matches the panel design. */
export const DEFAULT_BRAND: BrandConfig = {
  tenantId: "paapeli",
  appName: "Paapeli",
  primary: "28 100% 50%",
  primaryForeground: "0 0% 100%",
  /* Persian first, as on paapeli.com: most of our users are in Iran. A
     saved choice or ?lang= still wins. */
  defaultLang: "fa",
  features: { geofences: true, playback: true, alerts: true, health: true, attendance: true },
};

/** Example white-label tenants (what a customer override looks like). */
export const SAMPLE_TENANTS: Record<string, BrandConfig> = {
  paapeli: DEFAULT_BRAND,
  petpal: {
    tenantId: "petpal",
    appName: "PetPal GPS",
    primary: "22 92% 52%",
    primaryForeground: "0 0% 100%",
    defaultLang: "en",
    features: { geofences: true, playback: true, alerts: true, health: true, attendance: false },
  },
  fleetly: {
    tenantId: "fleetly",
    appName: "Fleetly",
    primary: "160 84% 39%",
    primaryForeground: "0 0% 100%",
    defaultLang: "en",
    features: { geofences: true, playback: true, alerts: true, health: false, attendance: false },
  },
};

/**
 * Resolve the active tenant brand.
 * Order: ?tenant= query → localStorage → default.
 * (When the backend is wired this becomes a fetch to the gateway.)
 */
export function resolveBrand(): BrandConfig {
  if (typeof window === "undefined") return DEFAULT_BRAND;
  const url = new URL(window.location.href);
  const qp = url.searchParams.get("tenant");
  if (qp) window.localStorage.setItem("paapeli_tenant", qp);
  const key = qp || window.localStorage.getItem("paapeli_tenant") || DEFAULT_BRAND.tenantId;
  return SAMPLE_TENANTS[key] ?? DEFAULT_BRAND;
}
