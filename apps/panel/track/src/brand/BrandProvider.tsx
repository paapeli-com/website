import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrandConfig, resolveBrand } from "@paapeli/brand/config";

type BrandContextType = {
  brand: BrandConfig;
  setTenant: (id: string) => void;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(() => resolveBrand());

  // Inject the tenant's brand color into the shared CSS variables.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", brand.primary);
    root.style.setProperty("--primary-foreground", brand.primaryForeground);
    root.style.setProperty("--ring", brand.primary);
  }, [brand]);

  const value = useMemo<BrandContextType>(
    () => ({
      brand,
      setTenant: (id) => {
        window.localStorage.setItem("paapeli_tenant", id);
        setBrand(resolveBrand());
      },
    }),
    [brand],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
