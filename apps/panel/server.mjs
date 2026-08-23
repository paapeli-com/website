import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ */
/* Panel — production static server.  One port: 8080                    */
/*   /            → redirects to /login                                 */
/*   /login       → the sign-in page      (dist/login/index.html)       */
/*   /AIoT/*      → the panel SPA         (dist/index.html)             */
/*   /CloudManagement/*  → the panel SPA  (dist/index.html)             */
/*                                                                      */
/* This is panel.paapeli.com — a separate origin from apps/web (the     */
/* marketing landing site, paapeli.com); no proxying between the two.   */
/*                                                                      */
/* There is now exactly ONE Vite build to serve. The previous version of */
/* this file stitched together five independent dist folders and had to  */
/* special-case remoteEntry.js caching, because a stale federation       */
/* manifest would point a browser at chunk hashes a deploy had already   */
/* removed. With one build that whole hazard is gone: index.html is      */
/* no-cache and names the current hashed entry chunk; everything under   */
/* /assets is content-hashed and immutable.                             */
/*                                                                      */
/* Layout inside the container (see ci/docker/panel/Dockerfile):        */
/*   /app/server.mjs            ← this file                             */
/*   /app/dist                  ← the single Vite build                 */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const DIST = path.resolve(__dirname, "dist");

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

/** Send an HTML shell. Never cached — it names the current hashed entry chunk. */
const sendHtml = (file, res) =>
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    res.end(buf);
  });

const server = http.createServer((req, res) => {
  try {
    const url = req.url || "/";
    const pathname = decodeURIComponent(url.split("?")[0]);

    // Cheap liveness probe (deploy/ansible healthcheck).
    if (pathname === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("ok");
    }

    if (pathname === "/") return redirect(res, "/login");

    // The sign-in page is its own HTML entry, not an SPA route.
    if (pathname === "/login" || pathname === "/login/") {
      return sendHtml(path.join(DIST, "login", "index.html"), res);
    }

    const filePath = path.join(DIST, pathname);
    if (!filePath.startsWith(DIST + path.sep)) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (err, buf) => {
      // Unknown path → an SPA route (/AIoT/*, /CloudManagement/*, …).
      if (err) return sendHtml(path.join(DIST, "index.html"), res);

      const ext = path.extname(filePath).toLowerCase();
      const headers = { "content-type": MIME[ext] || "application/octet-stream" };
      // Vite emits content-hashed files under /assets — safe to cache forever.
      if (ext !== ".html" && filePath.includes(`${path.sep}assets${path.sep}`)) {
        headers["cache-control"] = "public, max-age=31536000, immutable";
      }
      res.writeHead(200, headers);
      res.end(buf);
    });
  } catch (e) {
    console.error("[panel] request error:", e && e.message);
    try {
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
      res.end("Internal error");
    } catch {}
  }
});

// Last-resort guard so a stray error never takes the panel down.
process.on("uncaughtException", (e) => console.error("[panel] uncaughtException:", e && e.message));
process.on("unhandledRejection", (e) => console.error("[panel] unhandledRejection:", e));

server.listen(PORT, () => {
  console.log(`\n  Panel (prod)  →  http://0.0.0.0:${PORT}`);
  console.log(`     Login          →  /login`);
  console.log(`     Smart Factory  →  /AIoT/SmartFactory`);
  console.log(`     GPS Tracking   →  /AIoT/GPSTracking`);
  console.log(`     Cloud Mgmt     →  /CloudManagement\n`);
});
