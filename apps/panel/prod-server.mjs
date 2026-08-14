import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ */
/* Panel host — PRODUCTION.  Everything on ONE port: 8080               */
/*   /                      → redirects to /login                      */
/*   /login                 → login                (static Vite build) */
/*   /AIoT/*                → the host shell (header/sidebar), which    */
/*                            mounts Smart Factory / GPS Tracking as     */
/*                            Module Federation remotes client-side      */
/*                                                                      */
/* This is panel.paapeli.com — a separate origin from apps/web (the     */
/* marketing landing site, paapeli.com); no proxying between the two.   */
/*                                                                      */
/* login, host, factory and track are independent projects, each with   */
/* its own build, served together here as static `dist` folders so they */
/* share one origin (required for the shared login session in           */
/* localStorage — see packages/brand/session.ts).                       */
/*                                                                      */
/* factory/track's dist folders are served PURELY as static asset       */
/* folders now (remoteEntry.js + JS/CSS chunks, fetched at runtime by    */
/* the host via Module Federation) — the host owns page-level routing,   */
/* so an unmatched path under their base falls back to the HOST's        */
/* index.html, not their own (their own index.html/main.tsx is only      */
/* used when running them standalone via `pnpm --filter factory preview`)*/
/*                                                                      */
/* Layout inside the container (see ci/docker/panel/Dockerfile):        */
/*   /app/prod-server.mjs                     ← this file               */
/*   /app/apps/panel/host/dist                ← Host shell build        */
/*   /app/apps/product/aiot/factory/dist      ← Smart Factory build     */
/*   /app/apps/product/aiot/track/dist        ← GPS Tracking build      */
/*   /app/apps/panel/login/dist               ← Login build             */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);

const HOST = path.resolve(__dirname, "apps/panel/host/dist");
const FACTORY = path.resolve(__dirname, "apps/product/aiot/factory/dist");
const TRACK = path.resolve(__dirname, "apps/product/aiot/track/dist");
const LOGIN = path.resolve(__dirname, "apps/panel/login/dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

const redirect = (res, to) => {
  res.writeHead(302, { Location: to });
  res.end();
};

const sendIndex = (root, res) =>
  fs.readFile(path.join(root, "index.html"), (err, idx) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(idx);
  });

// Serve a Vite `dist` folder mounted at `base`, with SPA fallback to
// `fallbackRoot`'s index.html (defaults to `root` itself — pass a different
// root for remotes whose page-level routing is now owned by the host).
const serveStatic = (root, base, req, res, fallbackRoot = root) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = pathname.slice(base.length);
  if (rel === "" || rel === "/") return sendIndex(fallbackRoot, res);

  const filePath = path.join(root, rel);
  if (!filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { "content-type": "text/plain" });
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, buf) => {
    if (err) return sendIndex(fallbackRoot, res); // unknown path → SPA route
    const ext = path.extname(filePath).toLowerCase();
    const headers = { "content-type": MIME[ext] || "application/octet-stream" };
    // Vite emits content-hashed files under /assets — safe to cache forever.
    if (ext !== ".html" && filePath.includes(`${path.sep}assets${path.sep}`)) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    }
    res.writeHead(200, headers);
    res.end(buf);
  });
};

const server = http.createServer((req, res) => {
 try {
  const url = req.url || "/";
  const p = url.split("?")[0];

  // Cheap liveness probe for the host itself (deploy/ansible healthcheck).
  if (p === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }

  if (p === "/") return redirect(res, "/login");

  // Login (base "/") — strip the /login prefix before serving.
  if (p === "/login" || p.startsWith("/login/")) return serveStatic(LOGIN, "/login/", req, res);

  // Remote static assets (remoteEntry.js, JS/CSS chunks) — SPA-route misses
  // fall back to the HOST shell, which owns routing for these paths.
  if (p.startsWith("/AIoT/SmartFactory/")) return serveStatic(FACTORY, "/AIoT/SmartFactory/", req, res, HOST);
  if (p.startsWith("/AIoT/GPSTracking/")) return serveStatic(TRACK, "/AIoT/GPSTracking/", req, res, HOST);

  // Everything else (/AIoT, /AIoT/SmartFactory with no trailing slash, and
  // any future host routes) is the host SPA.
  return serveStatic(HOST, "/", req, res);
 } catch (e) {
   console.error("[panel] request error:", e && e.message);
   try { if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" }); res.end("Internal error"); } catch {}
 }
});

// Last-resort guard so a stray error never takes the whole host down.
process.on("uncaughtException", (e) => console.error("[panel] uncaughtException:", e && e.message));
process.on("unhandledRejection", (e) => console.error("[panel] unhandledRejection:", e));

server.listen(PORT, () => {
  console.log(`\n  Panel (prod)  →  http://0.0.0.0:${PORT}`);
  console.log(`     Login          →  /login`);
  console.log(`     Smart Factory  →  /AIoT/SmartFactory`);
  console.log(`     GPS Tracking   →  /AIoT/GPSTracking\n`);
});
