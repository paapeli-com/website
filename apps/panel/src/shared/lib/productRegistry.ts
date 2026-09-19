import { listAvailableModels, PROJECTS } from "@/features/ai-inference/lib/catalog";

/* What a product can grant an API key.
 *
 * A registry rather than a column per product: adding GPS Tracking or a fourth
 * product later should be an entry here, not a new boolean on the key, a new
 * branch in the key form and a new table somewhere. Everything that renders a
 * grant — the create dialog, the key detail, the filter popover — reads this.
 *
 * `resources` is a function because a product's resources are its own data:
 * AI Inference's are models from its catalogue, and a future product's would
 * be assets or vehicles from theirs. Returning [] means the product scopes by
 * project and action only.
 *
 * ENFORCEMENT LIVES ON THE GATEWAY. Listing an action here says the product
 * understands it, not that anything checks it. A grant recorded in the console
 * is a record of intent until the product's own gateway validates it.
 */

export interface ProductAction {
  id: string;
  /** English label; the key screens translate through their own tables. */
  label: string;
}

export interface ProductResource {
  id: string;
  label: string;
}

export interface ProductDefinition {
  id: string;
  name: string;
  /** False keeps it out of the grant editor without deleting the entry. */
  enabled: boolean;
  projects: { id: string; name: string }[];
  actions: ProductAction[];
  /** The things a grant can be narrowed to, if the product scopes that way. */
  resources: () => ProductResource[];
  /** What a resource is called, for the grant editor's own heading. */
  resourceLabel?: string;
}

export const PRODUCT_REGISTRY: ProductDefinition[] = [
  {
    id: "ai-inference",
    name: "AI Inference",
    enabled: true,
    projects: PROJECTS,
    actions: [
      { id: "inference:run", label: "Run inference" },
      { id: "inference:read", label: "Read usage" },
    ],
    resources: () => listAvailableModels().map((m) => ({ id: m.id, label: m.name })),
    resourceLabel: "Models",
  },
  {
    id: "smart-factory",
    name: "Smart Factory",
    enabled: true,
    projects: [{ id: "default", name: "Workspace" }],
    actions: [
      { id: "devices:read", label: "Read devices" },
      { id: "telemetry:read", label: "Read telemetry" },
      { id: "devices:write", label: "Manage devices" },
    ],
    /* Assets come from the workspace's own hierarchy, which is a
       workspace-scoped request this screen does not make. Until it does, a
       Smart Factory grant is project and action wide, and the editor says so
       rather than offering an empty list as if there were nothing there. */
    resources: () => [],
  },
  {
    id: "gps-tracking",
    name: "GPS Tracking",
    enabled: true,
    projects: [{ id: "default", name: "Workspace" }],
    actions: [
      { id: "locations:read", label: "Read locations" },
      { id: "trips:read", label: "Read trips" },
    ],
    resources: () => [],
  },
];

export const getProduct = (id: string): ProductDefinition | undefined =>
  PRODUCT_REGISTRY.find((p) => p.id === id);

export const productName = (id: string): string => getProduct(id)?.name ?? id;

export const AI_INFERENCE_PRODUCT_ID = "ai-inference";
