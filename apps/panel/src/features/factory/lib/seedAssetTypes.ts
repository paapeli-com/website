import { productAssetTypesService } from "@paapeli/api";
import { PRODUCT_KEY } from "./product";

/* One-shot seed of the product's asset-type graph, so the Locations tree has
   something to offer in its "Add …" menu and the Add dialog.

   Runs at most once per browser: the flag below is written BEFORE any request
   goes out, so a reload mid-flight cannot fire a second round either. Clear
   the key from localStorage to run it again.

   It is also idempotent on the server's terms — both endpoints answer 409 when
   the type or the link already exists, and a 409 is treated as "already done"
   rather than an error. That matters because the flag is per-browser: opening
   the app in a second browser re-runs the seed against a product that is
   already set up.

   Dev only. This writes to a real product on the gateway, so it must never
   fire from a production build. */
const SEED_FLAG = `paapeli.assetTypes.seeded.${PRODUCT_KEY}`;

interface SeedType {
    assetType: string;
    label: string;
    description: string;
}

/* Mirrors the hierarchy the tree used to hardcode before the graph came from
   the API: root holds locations, units and assets; a location holds units and
   assets; a unit holds assets; an asset is a leaf. */
const TYPES: SeedType[] = [
    { assetType: "LOCATION", label: "Location", description: "A site, plant or building" },
    { assetType: "UNIT", label: "Unit", description: "A production line or process unit" },
    { assetType: "ASSET", label: "Asset", description: "A machine or piece of equipment" },
];

const CHILD_LINKS: Array<[parent: string, child: string]> = [
    ["LOCATION", "UNIT"],
    ["LOCATION", "ASSET"],
    ["UNIT", "ASSET"],
];

const isConflict = (error: unknown) =>
    (error as { response?: { status?: number } })?.response?.status === 409;

/** Runs `fn`, treating "already exists" as success. Returns false if it failed. */
async function tolerateConflict(label: string, fn: () => Promise<unknown>): Promise<boolean> {
    try {
        await fn();
        return true;
    } catch (error) {
        if (isConflict(error)) return true;
        console.warn(`[seedAssetTypes] ${label} failed`, error);
        return false;
    }
}

/**
 * Seeds asset types and their allowed-children links for this product.
 *
 * @param rootAssetType the tree root's own type, read from the asset tree —
 *   the parent every top-level type hangs off. Not hardcoded, because it is
 *   whatever the product was provisioned with.
 */
export async function seedAssetTypes(rootAssetType: string): Promise<void> {
    if (!import.meta.env.DEV) return;
    if (!rootAssetType) return;
    try {
        if (localStorage.getItem(SEED_FLAG)) return;
        localStorage.setItem(SEED_FLAG, new Date().toISOString());
    } catch {
        // No localStorage means no way to guarantee "once" — don't seed at all.
        return;
    }

    const results: boolean[] = [];

    // Types first: a link cannot be made to a type that does not exist yet.
    for (const type of TYPES) {
        results.push(
            await tolerateConflict(`create ${type.assetType}`, () =>
                productAssetTypesService.createProductAssetType(PRODUCT_KEY, type),
            ),
        );
    }

    const links: Array<[string, string]> = [
        ...TYPES.map((t) => [rootAssetType, t.assetType] as [string, string]),
        ...CHILD_LINKS,
    ];
    for (const [parent, child] of links) {
        results.push(
            await tolerateConflict(`allow ${parent} → ${child}`, () =>
                productAssetTypesService.allowChild(PRODUCT_KEY, parent, child),
            ),
        );
    }

    const failed = results.filter((ok) => !ok).length;
    console.info(
        failed
            ? `[seedAssetTypes] finished with ${failed}/${results.length} failures — clear localStorage["${SEED_FLAG}"] to retry`
            : `[seedAssetTypes] asset types ready for ${PRODUCT_KEY}`,
    );
}
