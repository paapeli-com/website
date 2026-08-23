import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import path from "path";
import { componentTagger } from "lovable-tagger";

// `vite build --watch` (the dev script) re-runs a full build on every save and
// wipes dist/ before each one, so for a second or two remoteEntry.js and every
// hashed chunk 404. A host page loaded during that window can never recover on
// its own — see apps/panel/host/src/lib/remote.ts. Keeping the previous build's
// files around means an in-flight load still resolves; the one-shot `vite build`
// that precedes the watcher (and CI's `vite build`) still starts from a clean
// dist.
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served under the panel host at /AIoT/SmartFactory (Smart Factory solution).
  base: "/AIoT/SmartFactory/",
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Exposes RemoteApp.tsx to the host (apps/panel/host) via Module
    // Federation. The host owns header/sidebar chrome; this only renders
    // the routed page content. See src/RemoteApp.tsx.
    federation({
      name: "factory",
      filename: "remoteEntry.js",
      exposes: { "./FactoryApp": "./src/RemoteApp.tsx" },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // The workspace has both React 18 (this app) and React 19 (shared packages
    // like @paapeli/api, which pulls @tanstack/react-query). Without deduping,
    // the production bundle ships two React copies and hooks crash with
    // "Cannot read properties of null (reading 'useContext')". Force a single
    // instance of each so react-query shares one React and one QueryClient.
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  define: {
    global: 'globalThis',
  },
  build: {
    // Required by @originjs/vite-plugin-federation for exposed modules.
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
    emptyOutDir: !isWatch,
  },
}));
