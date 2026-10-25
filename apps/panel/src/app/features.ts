import { lazy } from "react";

/* The feature registry — and the app's code-splitting boundary.
 *
 * Each entry is a plain dynamic import, so Vite/Rollup emits one chunk per
 * feature and the browser fetches it on first navigation. Same lazy-loading
 * behaviour the Module Federation remotes gave us, except the graph is
 * resolved at BUILD time: the chunk is served from this app's own origin with
 * a hash the build guarantees exists. There is no remoteEntry.js, no
 * cross-origin round-trip, and therefore no "couldn't load remote" failure
 * mode to retry around.
 *
 * Loaders live at module scope so React.lazy's memoised factory is created
 * once, not on every render of the route element.
 */
export const homeRoutes = lazy(() => import("@/features/home/routes"));
export const factoryRoutes = lazy(() => import("@/features/factory/routes"));
export const trackRoutes = lazy(() => import("@/features/track/routes"));
export const cloudManagementRoutes = lazy(() => import("@/features/cloud-management/routes"));
/* Not a feature of the signed-in panel: the page a share link opens. */
export const sharedDashboardPage = lazy(() => import("@/features/factory/pages/SharedDashboard"));
export const aiInferenceRoutes = lazy(() => import("@/features/ai-inference/routes"));
export const cloudServerRoutes = lazy(() => import("@/features/cloud-server/routes"));
