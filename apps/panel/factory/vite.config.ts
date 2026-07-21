import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served under the panel host at /AIoT/SmartFactory (Smart Factory solution).
  base: "/AIoT/SmartFactory/",
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
}));
