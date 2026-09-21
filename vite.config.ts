import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the React/Three.js "Avora Core" hero island into a small, fixed-name
// bundle that the static site (served as-is by Wrangler) loads with a plain
// <script type="module"> tag — no server, no SSR, no app-wide React.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "app-dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        entryFileNames: "avora-app.js",
        chunkFileNames: "avora-app-[hash].js",
        assetFileNames: (info) =>
          info.names?.[0]?.endsWith(".css") ? "avora-app.css" : "assets/[name]-[hash][extname]",
      },
    },
  },
});
