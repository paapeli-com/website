import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Served under the panel host at /AIoT/track (GPS Tracking solution).
  base: "/AIoT/track/",
  server: {
    host: "::",
    port: 8082,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
