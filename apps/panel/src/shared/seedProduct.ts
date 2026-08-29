import { productsService } from "@paapeli/api";

/* One-shot registration of a product on the gateway (POST /api/v1/aiot/products),
   so a solution has something to be scoped under while developing.

   Runs at most once per browser per product: the flag is written BEFORE the
   request goes out, so a reload mid-flight cannot fire a second one. Clear the
   key from localStorage to run it again.

   Also idempotent on the server's terms — the endpoint answers 409 when the
   product already exists, which is treated as "already done". That matters
   because the flag is per-browser, so another browser would otherwise re-post
   against a product that is already registered.

   This replaces the pattern that used to sit inline in each feature's routes
   file — a `useRef` guard plus `createProduct.mutate()` in a mount effect.
   That guard only held within a single mount, so it re-posted on every full
   page load, which is why both call sites ended up commented out.

   Dev only: this writes to the real gateway and must never fire from a
   production build. */
const flagFor = (productKey: string) => `paapeli.product.seeded.${productKey}`;

export async function seedProduct(productKey: string, name: string): Promise<void> {
    if (!import.meta.env.DEV) return;
    if (!productKey || !name) return;

    const flag = flagFor(productKey);
    try {
        if (localStorage.getItem(flag)) return;
        localStorage.setItem(flag, new Date().toISOString());
    } catch {
        // Without localStorage there is no way to guarantee "once" — skip.
        return;
    }

    try {
        await productsService.createProduct({ productKey, name });
        console.info(`[seedProduct] created "${name}" (${productKey})`);
    } catch (error) {
        if ((error as { response?: { status?: number } })?.response?.status === 409) {
            console.info(`[seedProduct] "${name}" (${productKey}) already exists`);
            return;
        }
        console.warn(
            `[seedProduct] failed to create "${name}" (${productKey}) — clear localStorage["${flag}"] to retry`,
            error,
        );
    }
}
