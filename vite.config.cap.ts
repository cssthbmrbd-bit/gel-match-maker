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
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import fs from "node:fs";

/**
 * Renames `dist/cap/index.cap.html` -> `dist/cap/index.html` after the
 * build, so Capacitor can find its WebView entry at the conventional path.
 */
function renameCapHtml(): Plugin {
  return {
    name: "rename-cap-html",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist/cap");
      const from = path.join(outDir, "index.cap.html");
      const to = path.join(outDir, "index.html");
      if (fs.existsSync(from)) {
        if (fs.existsSync(to)) fs.unlinkSync(to);
        fs.renameSync(from, to);
      }
    },
  };
}

export default defineConfig({
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
    renameCapHtml(),
  ],
  build: {
    outDir: "dist/cap",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "index.cap.html"),
    },
  },
});
