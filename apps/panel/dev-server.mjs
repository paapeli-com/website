import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createVite } from "vite";

/* ------------------------------------------------------------------ */
/* Panel host — everything on ONE port you open: http://localhost:8080  */
/*   /                      → redirects to /login                      */
/*   /login                 → login (product-agnostic auth)             */
/*   /AIoT/*                → the host shell (header/sidebar), which    */
/*                            mounts Smart Factory / GPS Tracking as     */
/*                            Module Federation remotes client-side      */
/*                                                                       */
/* This is panel.paapeli.com. It's a separate origin from apps/web (the */
/* marketing landing site, paapeli.com) — no proxying between the two.  */
/*                                                                       */
/* login and host are independent projects (apps/panel/login,           */
/* apps/panel/host), each with its own package.json/build, but mounted   */
/* together here as Vite middleware for local dev so they share one      */
/* origin (required for the shared login session in localStorage — see   */
/* packages/brand/session.ts).                                          */
/*                                                                       */
/* Smart Factory, GPS Tracking, and Cloud Management (apps/product/aiot/  */
/* {factory,track}, apps/product/cloud-management) are NOT mounted here — */
/* they run their own `dev` script (a one-time build, then                */
/* `vite build --watch` + `vite preview` together — see their             */
/* package.json) on ports 8081/8082/8085, and the host fetches their      */
/* remoteEntry.js from there at runtime. This is why `pnpm dev` at the    */
/* repo root (turbo) is enough — it runs each package's own "dev" script, */
/* and these three packages' "dev" IS the build+preview combo. Their      */
/* `dev:standalone` script (plain `vite dev`, fast HMR) only works for     */
/* running that one remote by itself — the host can't consume it, since   */
/* a live dev server has no real remoteEntry.js to serve.                 */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const mkVite = (root, hmrPort) =>
  createVite({
    root,
    server: { middlewareMode: true, hmr: { port: hmrPort } },
    appType: "spa",
    clearScreen: false,
  });

const [host, login] = await Promise.all([
  mkVite(path.resolve(__dirname, "host"), 24678),
  mkVite(path.resolve(__dirname, "login"), 24680),
]);

const redirect = (res, to) => {
  res.writeHead(302, { Location: to });
  res.end();
};

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/") return redirect(res, "/login");

  // Login (base "/") — strip the /login prefix before handing off.
  if (url === "/login" || url === "/login/") {
    req.url = "/";
    return login.middlewares(req, res);
  }
  if (url.startsWith("/login/") || url.startsWith("/login?")) {
    req.url = url.slice("/login".length) || "/";
    return login.middlewares(req, res);
  }

  // Everything else (/AIoT/*, and any future host routes) is the host SPA —
  // it owns client-side routing, including the /AIoT → /AIoT/SmartFactory
  // redirect and mounting the factory/track remotes.
  return host.middlewares(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Panel  →  http://localhost:${PORT}`);
  console.log(`     Login          →  http://localhost:${PORT}/login`);
  console.log(`     Smart Factory  →  http://localhost:${PORT}/AIoT/SmartFactory`);
  console.log(`     GPS Tracking   →  http://localhost:${PORT}/AIoT/GPSTracking`);
  console.log(`     Cloud Mgmt     →  http://localhost:${PORT}/CloudManagement`);
  console.log(`\n  Make sure the remotes are also running — from the repo root, "pnpm dev" starts`);
  console.log(`  everything (this server plus factory/track/cloud-management as build+preview).`);
  console.log(`  Running this file by itself? Start those three separately in their own terminals:`);
  console.log(`     pnpm --filter factory dev`);
  console.log(`     pnpm --filter track dev`);
  console.log(`     pnpm --filter cloud-management dev\n`);
});
