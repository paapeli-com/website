import { PRODUCT_BASE, productKeyFor } from "@paapeli/brand/config";

/* This feature's pages serve more than one AIoT solution: Smart Factory at
   /AIoT/SmartFactory and Smart Greenhouse at /AIoT/SmartGreenhouse. Both are
   the same pages over the same platform; what differs is the workspace
   product their API calls are scoped under, so each solution sees only its
   own devices, alarms, work orders and dashboards.

   Which one is open is read from the URL rather than passed down, so plain
   functions (query keys, data sources) get it as easily as components do.
   Anything rendered outside a solution's mount falls back to Smart Factory,
   which is what every caller meant before there was a second solution.

   Keys are sourced from @paapeli/brand/config, not hardcoded here: the shell
   subscribes the active workspace to the same key before rendering the
   feature (see src/shell/ProductGate.tsx), so the two must agree. */
export const FACTORY_SOLUTIONS = ["SmartFactory", "SmartGreenhouse"] as const;
export type FactorySolution = (typeof FACTORY_SOLUTIONS)[number];

export function solutionOfPath(pathname: string): FactorySolution {
  const [, base, solution] = pathname.split("/");
  return base === PRODUCT_BASE && (FACTORY_SOLUTIONS as readonly string[]).includes(solution)
    ? (solution as FactorySolution)
    : "SmartFactory";
}

/** The solution whose pages are open. */
export const currentSolution = (): FactorySolution =>
  solutionOfPath(typeof window === "undefined" ? "" : window.location.pathname);

/** The workspace-product key the open solution's API calls are scoped under. */
export const currentProductKey = (): string => productKeyFor(currentSolution())!;
