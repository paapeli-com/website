import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // No assets reference this base directly (the page is a single self-contained
  // HTML file), so "/" works whether run standalone or mounted at /login by
  // the panel host (see apps/panel).
  base: "/",
  server: {
    host: "::",
    port: 8083,
  },
});
