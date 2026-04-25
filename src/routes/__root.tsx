import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { useNativeBootstrap } from "../hooks/use-native-bootstrap";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "theme-color", content: "#1a1714" },
      { title: "Lighting Gel Combiner — Filter Combination Finder" },
      {
        name: "description",
        content:
          "Lighting Gel Combiner: find practical lighting gel combinations that approximate any target color. Subtractive stacking simulator for theatre lighting technicians.",
      },
      { property: "og:title", content: "Lighting Gel Combiner — Filter Combination Finder" },
      {
        property: "og:description",
        content:
          "Recreate missing lighting gels by stacking the ones you have. Subtractive color math, ΔE accuracy and brightness loss for every suggestion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Lighting Gel Combiner — Filter Combination Finder" },
      { name: "description", content: "Find the best replacement for missing lighting gels by combining the ones you already have." },
      { property: "og:description", content: "Find the best replacement for missing lighting gels by combining the ones you already have." },
      { name: "twitter:description", content: "Find the best replacement for missing lighting gels by combining the ones you already have." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6d581c15-7dab-4a0a-afaf-0586043f257f/id-preview-f59a819c--2e215ec7-fc7d-4eea-a9de-2d00e7818688.lovable.app-1776877275265.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6d581c15-7dab-4a0a-afaf-0586043f257f/id-preview-f59a819c--2e215ec7-fc7d-4eea-a9de-2d00e7818688.lovable.app-1776877275265.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/app-icon.png" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useNativeBootstrap();
  return <Outlet />;
}
