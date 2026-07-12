// vite.config.ts
import { defineConfig } from "file:///F:/Desktop-Surface-Laptop/Startup/Code/panel-mainpage/panel/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.8_sass@1.97.3/node_modules/vite/dist/node/index.js";
import react from "file:///F:/Desktop-Surface-Laptop/Startup/Code/panel-mainpage/panel/node_modules/.pnpm/@vitejs+plugin-react-swc@3.11.0_@swc+helpers@0.5.15_vite@5.4.21_@types+node@22.19.8_sass@1.97.3_/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///F:/Desktop-Surface-Laptop/Startup/Code/panel-mainpage/panel/node_modules/.pnpm/lovable-tagger@1.1.13_vite@5.4.21_@types+node@22.19.8_sass@1.97.3__yaml@2.8.3/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "F:\\Desktop-Surface-Laptop\\Startup\\Code\\panel-mainpage\\panel\\apps\\panel\\factory";
var vite_config_default = defineConfig(({ mode }) => ({
  // Served under the panel host at /AIoT/SmartFactory (Smart Factory solution).
  base: "/AIoT/SmartFactory/",
  server: {
    host: "::",
    port: 8081
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  define: {
    global: "globalThis"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxEZXNrdG9wLVN1cmZhY2UtTGFwdG9wXFxcXFN0YXJ0dXBcXFxcQ29kZVxcXFxwYW5lbC1tYWlucGFnZVxcXFxwYW5lbFxcXFxhcHBzXFxcXHBhbmVsXFxcXGZhY3RvcnlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkY6XFxcXERlc2t0b3AtU3VyZmFjZS1MYXB0b3BcXFxcU3RhcnR1cFxcXFxDb2RlXFxcXHBhbmVsLW1haW5wYWdlXFxcXHBhbmVsXFxcXGFwcHNcXFxccGFuZWxcXFxcZmFjdG9yeVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRjovRGVza3RvcC1TdXJmYWNlLUxhcHRvcC9TdGFydHVwL0NvZGUvcGFuZWwtbWFpbnBhZ2UvcGFuZWwvYXBwcy9wYW5lbC9mYWN0b3J5L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIC8vIFNlcnZlZCB1bmRlciB0aGUgcGFuZWwgaG9zdCBhdCAvQUlvVC9TbWFydEZhY3RvcnkgKFNtYXJ0IEZhY3Rvcnkgc29sdXRpb24pLlxyXG4gIGJhc2U6IFwiL0FJb1QvU21hcnRGYWN0b3J5L1wiLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZpbmU6IHtcclxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4YSxTQUFTLG9CQUFvQjtBQUMzYyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUE7QUFBQSxFQUV6QyxNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQzlFLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
