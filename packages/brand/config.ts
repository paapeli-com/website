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
export type Solution = { id: string; name: string; href?: string; disabled?: boolean };
export type Product = { id: string; name: string; href?: string; disabled?: boolean; solutions?: Solution[] };

export const PRODUCTS: Product[] = [
  {
    id: "aiot",
    name: "AIoT",
    solutions: [
      { id: "GPSTracking", name: "GPS Tracking" },
      { id: "SmartFactory", name: "Smart Factory" },
    ],
  },
  { id: "ai", name: "AI Infra", disabled: true },
];

/* Base URL segment for the product that owns the solutions above.       */
/* Solution routes are `/{PRODUCT_BASE}/{solutionId}` on one host, e.g.  */
/* panel.paapeli.com/AIoT/track and panel.paapeli.com/AIoT/factory.       */
export const PRODUCT_BASE = "AIoT";

export function solutionPath(solutionId: string) {
  return `/${PRODUCT_BASE}/${solutionId}`;
}

/* Current user shown in the top toolbar. Single source of truth for     */
/* every solution's header (name, email, initial). Mock for now; later    */
/* replaced by a fetch from the gateway / auth API — same shape.          */
export type CurrentUser = { name: string; email: string; initial: string };

export const CURRENT_USER: CurrentUser = {
  name: "هلدینگ هوشمند سینا",
  email: "sina@paapeli.com",
  initial: "س",
};

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
  defaultLang: "en",
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
