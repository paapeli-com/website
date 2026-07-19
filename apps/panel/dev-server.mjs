import http from "node:http";
import path from "node:path";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer as createVite } from "vite";

/* ------------------------------------------------------------------ */
/* Paapeli host — everything on ONE port you open: http://localhost:8080 */
/*   /                      → Web (marketing site + login entry)         */
/*   /login                 → login (Smart Factory auth)                 */
/*   /AIoT/track/           → GPS Tracking                               */
/*   /AIoT/SmartFactory     → Smart Factory (panel dashboard)            */
/*                                                                       */
/* The two panels (Vite) are mounted in-process as middleware. Web       */
/* (Next.js) can't share the process with Vite's TS-config loader, so it */
/* runs as a child `next dev` on an internal port and the host proxies   */
/* to it. You only ever open 8080.                                       */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;
const WEB_PORT = 3100;

// --- Web (Next.js) as an internal child process ---------------------
const webProc = spawn("pnpm", ["--filter", "paapeli_web", "exec", "next", "dev", "--port", String(WEB_PORT)], {
  stdio: "inherit",
  shell: true,
});

// --- Panels (Vite) mounted in middleware mode -----------------------
const mkVite = (dir, hmrPort) =>
  createVite({
    root: path.resolve(__dirname, dir),
    server: { middlewareMode: true, hmr: { port: hmrPort } },
    appType: "spa",
    clearScreen: false,
  });

const [factory, track] = await Promise.all([mkVite("factory", 24678), mkVite("track", 24679)]);

const redirect = (res, to) => {
  res.writeHead(302, { Location: to });
  res.end();
};

// Reverse-proxy a request to the internal web (Next) server.
const proxyToWeb = (req, res) => {
  const p = http.request(
    { hostname: "localhost", port: WEB_PORT, path: req.url, method: req.method, headers: req.headers },
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

  // Product-agnostic login served by the host (one login for every product).
  if (url === "/login" || url === "/login/" || url.startsWith("/login?")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(readFileSync(path.resolve(__dirname, "login.html"), "utf8"));
    return;
  }

  if (url === "/AIoT/track") return redirect(res, "/AIoT/track/");
  if (url.startsWith("/AIoT/track")) return track.middlewares(req, res);

  if (url.startsWith("/AIoT/SmartFactory")) {
    // Serve the SPA root at the clean base URL (no /home redirect).
    if (url === "/AIoT/SmartFactory") req.url = "/AIoT/SmartFactory/";
    return factory.middlewares(req, res);
  }

  return proxyToWeb(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Paapeli  →  http://localhost:${PORT}`);
  console.log(`     Web           →  http://localhost:${PORT}/`);
  console.log(`     Login         →  http://localhost:${PORT}/login`);
  console.log(`     GPS Tracking  →  http://localhost:${PORT}/AIoT/track/`);
  console.log(`     Smart Factory →  http://localhost:${PORT}/AIoT/SmartFactory\n`);
});

const stop = () => {
  try { webProc.kill(); } catch {}
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
