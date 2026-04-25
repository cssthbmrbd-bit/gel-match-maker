/**
 * Capacitor / SPA entry point.
 *
 * This file is the bundle entry used by `vite.config.cap.ts` to produce a
 * fully static SPA build for Capacitor (iOS/Android WebView). It does NOT
 * use TanStack Start — there is no SSR, no server runtime, no Worker. The
 * router is created with memory history so it works under `file://`,
 * `capacitor://`, and `https://localhost` schemes equally.
 *
 * The Lovable web preview / production deploy continues to use
 * `vite.config.ts` (TanStack Start SSR). This file is only consumed by the
 * `cap:build` script.
 */
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useNativeBootstrap } from "./hooks/use-native-bootstrap";

// The root route defines a `shellComponent` that renders <html>/<body> for
// TanStack Start SSR. In the SPA build we mount inside an existing <body>,
// so we strip the shell to avoid producing a nested <html> inside #root.
// The same trick neutralizes the SSR-only <Scripts /> tag.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(routeTree.options as any).shellComponent = undefined;

const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] }),
  context: {},
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  // Hides the splash screen + applies status-bar styling on native.
  useNativeBootstrap();
  return <RouterProvider router={router} />;
}

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element in index.cap.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
