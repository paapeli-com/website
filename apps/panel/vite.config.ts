import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/* Serve the login entry at "/login", the way server.mjs does in production.
 *
 * Vite resolves a multi-page entry only at its directory URL ("/login/"); the
 * bare "/login" misses and falls through to the SPA fallback, which hands back
 * the panel shell instead. That shell gates on the session, and a signed-out
 * visitor bounces to goToLogin() → "/login" → the shell again → an infinite
 * redirect loop. Rewriting before the fallback runs keeps dev and prod
 * identical, and keeps the URL bare (no redirect to "/login/").
 *
 * Registered inside configureServer/configurePreviewServer's body rather than
 * in a returned function, so it lands ahead of Vite's own SPA-fallback
 * middleware instead of behind it.
 */
const loginEntry = (): Plugin => {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const [pathname, query] = (req.url ?? "").split("?");
    if (pathname === "/login") req.url = "/login/index.html" + (query ? `?${query}` : "");
    next();
  };
  return {
    name: "paapeli-login-entry",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
};

/* The panel (panel.paapeli.com) — ONE Vite app.
 *
 * This replaces the previous Module Federation setup (a host plus three
 * remotes, each its own Vite project, build, and dev server). That bought
 * independent deployability we never used — ci/docker/panel/Dockerfile built
 * all of them into a single image served by a single process — while costing
 * us HMR, duplicated dependencies in every remote, and a class of runtime
 * "couldn't load remote" failures caused by the host fetching remoteEntry.js
 * while a remote's `vite build --watch` was mid-rewrite of its dist/.
 *
 * Features are now ordinary dynamic imports (see src/app/features.ts), so
 * they still ship as separate lazily-fetched chunks — the split is just
 * resolved at build time instead of over the network.
 *
 * Two HTML entries:
 *   index.html        the panel SPA (/, /AIoT/*, /CloudManagement/*)
 *   login/index.html  the standalone sign-in page, served at /login
 * Same origin, which is what the shared localStorage session requires (see
 * packages/brand/session.ts).
 */
export default defineConfig({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  plugins: [react(), loginEntry()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  build: {
    target: "esnext",
    // Smart Factory is genuinely large (~50k lines) and ships as its own lazy
    // chunk, so it trips the default 500 kB warning on every build. Raise the
    // bar rather than train ourselves to ignore the warning — it should still
    // fire if something unexpected balloons.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        login: path.resolve(__dirname, "login/index.html"),
      },
      output: {
        // Every feature's entry module is named routes.tsx, so the default
        // naming would emit three indistinguishable `routes-<hash>.js` files.
        // Name each lazy chunk after its feature directory instead.
        chunkFileNames(chunk) {
          const id = chunk.facadeModuleId ?? "";
          const feature = id.match(/src\/features\/([^/]+)\//)?.[1];
          return feature ? `assets/${feature}-[hash].js` : "assets/[name]-[hash].js";
        },
      },
    },
  },
});
