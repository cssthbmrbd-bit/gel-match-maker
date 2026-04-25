/**
 * Vite config for the Capacitor (offline SPA) build.
 *
 * This config intentionally does NOT use TanStack Start, the Cloudflare
 * plugin, or any SSR machinery — it produces a single static `index.html`
 * plus hashed JS/CSS assets in `dist/cap/`, which is what Capacitor needs
 * for its WebView (`webDir` in `capacitor.config.ts`).
 *
 * The regular `vite build` (driven by `vite.config.ts`) still produces the
 * SSR build for the Lovable web deploy. Use:
 *
 *     npm run cap:build
 *
 * to produce the offline SPA bundle, then `npx cap sync` to copy it into
 * the native iOS / Android projects.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  configFile: false as never, // ignored at type level; ensures no auto-merge
  root: ".",
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist/cap",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.cap.html"),
      },
    },
  },
});
