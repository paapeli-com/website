import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

/* A remote is declared as a promise-typed external — an expression the plugin
   calls on every load attempt — rather than a fixed URL string, so the host can
   hand out a URL the browser's module map has never seen when it retries. That
   matters because a failed remote is otherwise permanently broken for the life
   of the document: the browser caches the failed dynamic import, remoteEntry.js
   caches its own exposed-chunk promise (including rejections) and the hrefs of
   the stylesheets it has already injected, and React.lazy caches the rejection.
   Reloading the page was the only way out — see src/lib/remote.ts, which owns
   __paapeliRemoteUrl and bumps the attempt counter. The `??` fallback keeps a
   plain URL working if a remote is ever imported without that module loaded. */
const remote = (name: string, url: string) => ({
  external: `Promise.resolve((globalThis.__paapeliRemoteUrl ?? ((n, u) => u))(${JSON.stringify(name)}, ${JSON.stringify(url)}))`,
  externalType: "promise" as const,
  format: "esm" as const,
  from: "vite" as const,
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Panel host — owns "/" and everything under /AIoT/*. Served at the
  // origin root (panel.paapeli.com), unlike the remotes it mounts.
  base: "/",
  server: {
    host: "::",
    port: 8084,
    // Login (apps/panel/login) is a separate project/port (8083) in dev, but
    // must stay same-origin as the host for the shared session in
    // localStorage to work (see packages/brand/session.ts) — goToLogin()
    // navigates to a relative "/login", which the browser would otherwise
    // resolve against :8084 and 404. This proxy makes plain `vite dev`
    // (running the host standalone, without apps/panel/dev-server.mjs)
    // behave the same as the unified panel dev server. Mirrors the
    // "/login" prefix-stripping in dev-server.mjs.
    proxy: {
      "/login": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/login/, "") || "/",
      },
    },
  },
  plugins: [
    react(),
    federation({
      name: "host",
      remotes:
        mode === "development"
          ? {
              // Remotes run `vite build --watch` + `vite preview` in dev
              // (see apps/product/aiot/{factory,track} package.json) — a live
              // `vite dev` server doesn't produce a federation-consumable
              // remoteEntry.js, so we always point at a real build. Paths
              // match each remote's `base` (also what it's served at, from
              // `vite preview`, and in prod — see prod-server.mjs). The
              // `assets/` segment is where Vite's default `assetsDir` puts
              // even the federation plugin's unhashed remoteEntry.js chunk.
              factory: remote("factory", "http://localhost:8081/AIoT/SmartFactory/assets/remoteEntry.js"),
              track: remote("track", "http://localhost:8082/AIoT/GPSTracking/assets/remoteEntry.js"),
              cloudManagement: remote("cloudManagement", "http://localhost:8085/CloudManagement/assets/remoteEntry.js"),
            }
          : {
              // Prod: same paths the panel host's static server exposes the
              // remotes' built dist folders under (see prod-server.mjs).
              factory: remote("factory", "/AIoT/SmartFactory/assets/remoteEntry.js"),
              track: remote("track", "/AIoT/GPSTracking/assets/remoteEntry.js"),
              cloudManagement: remote("cloudManagement", "/CloudManagement/assets/remoteEntry.js"),
            },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
  },
}));
