import { productKeyFor } from "@paapeli/brand/config";

/* Sourced from @paapeli/brand/config, not a hardcoded literal here — the
   shell subscribes the active workspace to this same key before rendering
   this feature (see src/shell/ProductGate.tsx), so the two must agree on
   the exact string. */
export const PRODUCT_KEY = productKeyFor("SmartFactory")!;
