import { Suspense, type ComponentType } from "react";
import { ErrorBoundary } from "@/shell/ErrorBoundary";
import { FeatureFallback, ProductGate } from "@/shell/ProductGate";

interface Props {
  /** Human-readable name, used in error messages. */
  name: string;
  /** Workspace-product key to subscribe before rendering — see ProductGate. */
  productKey?: string;
  /** The feature's lazily-imported route table (see ./features.ts). */
  routes: ComponentType;
}

/**
 * Mounts one feature: subscribes the active workspace to its product (if it
 * has one), suspends on the feature's chunk, and contains a render crash to
 * this pane instead of the whole shell.
 */
export function Feature({ name, productKey, routes: Routes }: Props) {
  return (
    <ErrorBoundary name={name}>
      <ProductGate name={name} productKey={productKey}>
        <Suspense fallback={<FeatureFallback />}>
          <Routes />
        </Suspense>
      </ProductGate>
    </ErrorBoundary>
  );
}
