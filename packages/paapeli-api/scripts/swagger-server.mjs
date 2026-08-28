#!/usr/bin/env node
/**
 * Dev-only Swagger UI for src/swagger.json — the spec the services in src/api
 * are written against.
 *
 *   pnpm --filter @paapeli/api swagger            # http://localhost:8081
 *   pnpm --filter @paapeli/api swagger -- --port 9000
 *
 * The UI is served from the local swagger-ui-dist package, so this works
 * offline, and the spec is re-read from disk on every request — edit
 * swagger.json and reload the page to see it.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

const SPEC_PATH = resolve(here, "../src/swagger.json");
const UI_DIR = dirname(require.resolve("swagger-ui-dist/package.json"));

const portArg = process.argv.indexOf("--port");
const PORT = Number(
  (portArg !== -1 && process.argv[portArg + 1]) || process.env.PORT || 8081,
);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
};

/* Our own shell rather than swagger-ui-dist's index.html, which points at
   petstore. persistAuthorization keeps a pasted bearer token across reloads. */
const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paapeli Gateway API</title>
    <link rel="stylesheet" href="./swagger-ui.css" />
    <link rel="icon" href="./favicon-32x32.png" sizes="32x32" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js"></script>
    <script src="./swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "./swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });
    </script>
  </body>
</html>
`;

const send = (res, status, body, type) => {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;

  if (path === "/" || path === "/index.html") {
    return send(res, 200, INDEX_HTML, MIME[".html"]);
  }

  if (path === "/swagger.json") {
    try {
      return send(res, 200, await readFile(SPEC_PATH), MIME[".json"]);
    } catch (err) {
      return send(
        res,
        500,
        JSON.stringify({ error: `Could not read ${SPEC_PATH}: ${err.message}` }),
        MIME[".json"],
      );
    }
  }

  // Everything else comes from swagger-ui-dist. The URL parser already
  // collapses "..", but %2f survives it, so decode before normalizing and
  // then confirm the result really landed inside UI_DIR.
  let file;
  try {
    file = join(UI_DIR, normalize(decodeURIComponent(path)));
  } catch {
    return send(res, 400, "Bad request", MIME[".html"]);
  }
  if (!file.startsWith(UI_DIR + sep)) {
    return send(res, 403, "Forbidden", MIME[".html"]);
  }
  try {
    const type = MIME[extname(file)] ?? "application/octet-stream";
    return send(res, 200, await readFile(file), type);
  } catch {
    return send(res, 404, "Not found", MIME[".html"]);
  }
});

server.listen(PORT, () => {
  console.log(`Swagger UI  http://localhost:${PORT}`);
  console.log(`Spec        ${SPEC_PATH}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is in use. Try: pnpm --filter @paapeli/api swagger -- --port ${PORT + 1}`);
    process.exit(1);
  }
  throw err;
});
