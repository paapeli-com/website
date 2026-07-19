import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ */
/* Paapeli host — PRODUCTION.  Everything on ONE port: 8080            */
/*   /                      → Web (Next.js standalone, internal child)  */
/*   /login                 → redirect to Smart Factory login          */
/*   /AIoT/track/           → GPS Tracking      (static Vite build)     */
/*   /AIoT/SmartFactory     → Smart Factory     (static Vite build)     */
/*                                                                      */
/* This is the production counterpart of dev-server.mjs. Instead of     */
/* Vite middleware + `next dev`, it serves the two Vite `dist` folders  */
/* as static files (SPA fallback) and reverse-proxies everything else   */
/* to an internal `next start` (the standalone server.js). Only 8080 is */
/* ever exposed.                                                        */
/*                                                                      */
/* Layout inside the container (see ci/docker/panel/Dockerfile):        */
/*   /app/prod-server.mjs           ← this file                         */
/*   /app/apps/web/server.js        ← Next standalone entrypoint        */
/*   /app/apps/panel/factory/dist   ← Smart Factory static build        */
/*   /app/apps/panel/track/dist     ← GPS Tracking static build         */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const WEB_PORT = Number(process.env.WEB_PORT || 3100);

const FACTORY = path.resolve(__dirname, "apps/panel/factory/dist");
const TRACK = path.resolve(__dirname, "apps/panel/track/dist");
const WEB_SERVER = path.resolve(__dirname, "apps/web/server.js");

// --- Web (Next.js) as an internal child process ---------------------
// The standalone server honours PORT/HOSTNAME env. Bind it to loopback so it
// is only reachable through this host on 8080.
const webProc = spawn(process.execPath, [WEB_SERVER], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(WEB_PORT), HOSTNAME: "127.0.0.1" },
});

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

// Serve a Vite `dist` folder mounted at `base`, with SPA fallback to index.html.
const serveStatic = (root, base, req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = pathname.slice(base.length);
  if (rel === "" || rel === "/") return sendIndex(root, res);

  const filePath = path.join(root, rel);
  if (!filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { "content-type": "text/plain" });
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, buf) => {
    if (err) return sendIndex(root, res); // unknown path → SPA route
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

// Reverse-proxy a request to the internal web (Next) server.
const proxyToWeb = (req, res) => {
  // The external hop (browser → Caddy) is HTTPS, but the internal hop
  // (this host → Next child on 127.0.0.1:WEB_PORT) is plain HTTP. If we pass
  // Caddy's `X-Forwarded-Proto: https` down to the child, Next's i18n
  // middleware builds an absolute rewrite URL with an `https://` scheme
  // (e.g. https://localhost:3100/en). Because that scheme doesn't match the
  // http origin the child is actually served over, Next treats the rewrite as
  // cross-origin and re-fetches it over TLS against its own HTTP port →
  // `EPROTO: wrong version number`. Strip the scheme/host-forwarding headers
  // so the child sees its real internal http origin and resolves the rewrite
  // in-process. (The browser still sees HTTPS via Caddy; the web app never
  // reads these headers server-side, so nothing downstream is affected.)
  const headers = { ...req.headers };
  delete headers["x-forwarded-proto"];
  delete headers["x-forwarded-host"];
  const p = http.request(
    { hostname: "127.0.0.1", port: WEB_PORT, path: req.url, method: req.method, headers },
    (pr) => {
      res.writeHead(pr.statusCode || 502, pr.headers);
      pr.pipe(res);
    },
  );
  p.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Web app is still starting… refresh in a moment.");
  });
  req.pipe(p);
};

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  const p = url.split("?")[0];

  // Cheap liveness probe for the host itself (deploy/ansible healthcheck).
  if (p === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }

  // Product-agnostic login served by the host (one login for every product).
  if (p === "/login" || p === "/login/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.resolve(__dirname, "login.html"), "utf8"));
  }

  if (p === "/AIoT/track") return redirect(res, "/AIoT/track/");
  if (p.startsWith("/AIoT/track/")) return serveStatic(TRACK, "/AIoT/track/", req, res);

  // Clean base URL (no /home); the SPA root renders the dashboard.
  if (p === "/AIoT/SmartFactory") return redirect(res, "/AIoT/SmartFactory/");
  if (p.startsWith("/AIoT/SmartFactory/")) return serveStatic(FACTORY, "/AIoT/SmartFactory/", req, res);

  return proxyToWeb(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Paapeli (prod)  →  http://0.0.0.0:${PORT}`);
  console.log(`     Web           →  /`);
  console.log(`     Login         →  /login`);
  console.log(`     GPS Tracking  →  /AIoT/track/`);
  console.log(`     Smart Factory →  /AIoT/SmartFactory\n`);
});

const stop = () => {
  try {
    webProc.kill();
  } catch {}
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
webProc.on("exit", (code) => {
  console.error(`[panel] internal web server exited (code ${code}); shutting down host`);
  process.exit(code || 1);
});
