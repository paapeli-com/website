import { productKeyFor } from "@paapeli/brand/config";

/* Sourced from @paapeli/brand/config rather than a literal, so this feature
   and the shell's product gate agree on the exact string (see the same file
   in features/factory/lib). Resolves to "gpsTracking". */
export const PRODUCT_KEY = productKeyFor("GPSTracking")!;
