import { solutionPath } from "@paapeli/brand/config";

/* Every in-feature link has to carry the feature's mount point.
   This feature is mounted at "AIoT/SmartFactory/*" (see src/app/App.tsx), so a
   bare "/devices/new" passed to navigate() is resolved from the APP root, not
   from the mount — it matches nothing, falls through to App.tsx's catch-all
   and silently redirects to "/". That is why "Add device" and the create
   button both landed on the dashboard.

   Route paths inside the feature stay relative ("/devices"), because a
   descendant <Routes> matches them under the splat. It is only navigate() and
   <Navigate to> that resolve leading slashes absolutely — so those go through
   here.

   Language is a path segment under the mount ("/AIoT/SmartFactory/fa/devices"),
   matching the "/:lang/..." route pairs the feature declares. English is the
   default and carries no segment. */
const BASE = solutionPath("SmartFactory");

export const localizedPath = (p: string, language: string) => {
  const path = p.startsWith("/") ? p : `/${p}`;
  return language === "en" ? `${BASE}${path}` : `${BASE}/${language}${path}`;
};
