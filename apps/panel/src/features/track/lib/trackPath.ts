import { solutionPath } from "@paapeli/brand/config";

/* Every in-feature link has to carry the feature's mount point.
   This feature is mounted at "AIoT/GPSTracking/*" (see src/app/App.tsx), so a
   bare "/devices" passed to navigate() or <NavLink to> is resolved from the
   APP root, not from the mount — it matches nothing, falls through to
   App.tsx's catch-all and silently redirects to "/", which in turn redirects
   to Smart Factory.

   Route paths inside the feature stay relative ("devices"), because a
   descendant <Routes> matches them under the splat. It is only navigate(),
   <Navigate to> and <NavLink to> that resolve leading slashes absolutely — so
   those go through here.

   The Smart Factory feature has the same helper (features/factory/lib/
   localizedPath); that one also carries a language segment, which this feature
   has no routes for. */
const BASE = solutionPath("GPSTracking");

export const trackPath = (p: string) => `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
