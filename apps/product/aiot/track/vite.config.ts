import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Served under the panel host at /AIoT/GPSTracking (GPS Tracking solution).
  base: "/AIoT/GPSTracking/",
  server: {
    host: "::",
    port: 8082,
  },
  plugins: [
    react(),
    // Exposes RemoteApp.tsx to the host (apps/panel/host) via Module
    // Federation. The host owns header/sidebar chrome; this only renders
    // the routed page content. See src/RemoteApp.tsx.
    federation({
      name: "track",
      filename: "remoteEntry.js",
      exposes: { "./TrackApp": "./src/RemoteApp.tsx" },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Required by @originjs/vite-plugin-federation for exposed modules.
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
  },
});
