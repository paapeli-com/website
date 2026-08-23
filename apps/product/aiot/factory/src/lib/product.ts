import { productKeyFor } from "@paapeli/brand/config";

/* Sourced from @paapeli/brand/config, not a hardcoded literal here — the
   host (apps/panel/host) subscribes the active workspace to this same key
   before mounting this remote (see RemoteMount.tsx), so the two must agree
   on the exact string. */
export const PRODUCT_KEY = productKeyFor("SmartFactory")!;
