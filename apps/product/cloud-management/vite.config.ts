import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

// `vite build --watch` (the dev script) re-runs a full build on every save and
// wipes dist/ before each one, so for a second or two remoteEntry.js and every
// hashed chunk 404. A host page loaded during that window can never recover on
// its own — see apps/panel/host/src/lib/remote.ts. Keeping the previous build's
// files around means an in-flight load still resolves; the one-shot `vite build`
// that precedes the watcher (and CI's `vite build`) still starts from a clean
// dist.
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

// https://vitejs.dev/config/
export default defineConfig({
  // Served under the panel host at /CloudManagement (workspace/account
  // administration — independent of any AIoT product/solution).
  base: "/CloudManagement/",
  server: {
    host: "::",
    port: 8085,
  },
  plugins: [
    react(),
    // Exposes RemoteApp.tsx to the host (apps/panel/host) via Module
    // Federation. The host owns header/sidebar chrome; this only renders
    // the routed page content. See src/RemoteApp.tsx.
    federation({
      name: "cloudManagement",
      filename: "remoteEntry.js",
      exposes: { "./CloudManagementApp": "./src/RemoteApp.tsx" },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  build: {
    // Required by @originjs/vite-plugin-federation for exposed modules.
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
    emptyOutDir: !isWatch,
  },
});
