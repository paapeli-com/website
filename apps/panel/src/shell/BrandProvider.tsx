import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrandConfig, resolveBrand } from "@paapeli/brand/config";

/* The panel's accent colour, chosen in Account Settings.
 *
 * It is a preference, not a tenant: picking green paints the panel green and
 * does nothing else, where switching tenant would also rename the app and
 * swap its logo. So an accent overrides the brand's primary and leaves the
 * rest of the brand alone, and "paapeli" means the brand's own colour,
 * whatever a white-labelled deployment has set that to.
 *
 * There is no endpoint for account preferences, so the choice lives in this
 * browser until there is one. */
export type AccentId = "paapeli" | "green";

const ACCENT_KEY = "paapeli.panel.accent";

const ACCENT_OVERRIDE: Partial<Record<AccentId, { primary: string; primaryForeground: string }>> = {
  green: { primary: "160 84% 39%", primaryForeground: "0 0% 100%" },
};

const readAccent = (): AccentId => {
  try {
    return window.localStorage.getItem(ACCENT_KEY) === "green" ? "green" : "paapeli";
  } catch {
    return "paapeli";
  }
};

type BrandContextType = {
  brand: BrandConfig;
  setTenant: (id: string) => void;
  accent: AccentId;
  setAccent: (id: AccentId) => void;
  /** The colour an accent actually paints, for a swatch to show. */
  accentColor: (id: AccentId) => string;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(() => resolveBrand());
  const [accent, setAccentState] = useState<AccentId>(readAccent);

  // Inject the brand colour into the shared CSS variables, with the chosen
  // accent on top of it. One owner for --primary, so the two cannot disagree.
  useEffect(() => {
    const root = document.documentElement;
    const override = ACCENT_OVERRIDE[accent];
    root.style.setProperty("--primary", override?.primary ?? brand.primary);
    root.style.setProperty("--primary-foreground", override?.primaryForeground ?? brand.primaryForeground);
    root.style.setProperty("--ring", override?.primary ?? brand.primary);
  }, [brand, accent]);

  const value = useMemo<BrandContextType>(
    () => ({
      brand,
      setTenant: (id) => {
        window.localStorage.setItem("paapeli_tenant", id);
        setBrand(resolveBrand());
      },
      accent,
      setAccent: (id) => {
        try {
          window.localStorage.setItem(ACCENT_KEY, id);
        } catch {
          /* private mode / storage disabled — the colour still applies */
        }
        setAccentState(id);
      },
      accentColor: (id) => ACCENT_OVERRIDE[id]?.primary ?? brand.primary,
    }),
    [brand, accent],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
