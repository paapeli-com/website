/* ------------------------------------------------------------------ */
/* White-label brand config.                                          */
/* This object is read at RUNTIME (after build) so a single build can  */
/* serve every customer. Today it is a local mock; later the same      */
/* shape is fetched from the gateway ( GET /tenant-config?host=… ).    */
/* The BrandProvider turns `primary` into the --primary CSS variable,  */
/* so changing the brand recolors the whole app.                       */
/* ------------------------------------------------------------------ */

export type BrandConfig = {
  /** Tenant id (matches a customer record in the backend later). */
  tenantId: string;
  /** Product name shown in the sidebar / title. */
  appName: string;
  /** Short logo mark text (or first letter) used in the logo badge. */
  logoText: string;
  /** Brand primary color as HSL triplet "H S% L%" (no hsl() wrapper). */
  primary: string;
  primaryForeground: string;
  /** Default language for this tenant. */
  defaultLang: "en" | "fa" | "ar";
  /** Feature flags — hide/show optional modules per tenant. */
  features: {
    geofences: boolean;
    playback: boolean;
    alerts: boolean;
    health: boolean;
    attendance: boolean;
  };
};

/** Default Paapeli-branded tenant (used when no tenant override is found). */
export const DEFAULT_BRAND: BrandConfig = {
  tenantId: "paapeli",
  appName: "Paapeli Track",
  logoText: "P",
  primary: "250 84% 60%",
  primaryForeground: "0 0% 100%",
  defaultLang: "en",
  features: {
    geofences: true,
    playback: true,
    alerts: true,
    health: true,
    attendance: true,
  },
};

/* Example of a second white-label tenant. Not used by default; shown   */
/* here so you can see exactly what a customer override looks like.     */
export const SAMPLE_TENANTS: Record<string, BrandConfig> = {
  paapeli: DEFAULT_BRAND,
  // e.g. a pet-brand reseller on their own domain
  petpal: {
    tenantId: "petpal",
    appName: "PetPal GPS",
    logoText: "🐾",
    primary: "22 92% 52%",
    primaryForeground: "0 0% 100%",
    defaultLang: "en",
    features: { geofences: true, playback: true, alerts: true, health: true, attendance: false },
  },
};

/**
 * Resolve the active tenant brand.
 * Order: ?tenant=… query → localStorage → hostname map → default.
 * (When the backend is wired, this becomes a fetch to the gateway.)
 */
export function resolveBrand(): BrandConfig {
  if (typeof window === "undefined") return DEFAULT_BRAND;

  const url = new URL(window.location.href);
  const qp = url.searchParams.get("tenant");
  const stored = window.localStorage.getItem("track_tenant");
  const key = qp || stored || DEFAULT_BRAND.tenantId;

  if (qp) window.localStorage.setItem("track_tenant", qp);

  return SAMPLE_TENANTS[key] ?? DEFAULT_BRAND;
}
