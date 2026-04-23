import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for Lighting Gel Combiner.
 *
 * The app is fully offline — no APIs, no remote assets. All gel data is
 * bundled in `src/lib/gels.ts`; favorites + inventory live in localStorage.
 *
 * `webDir` points at the Vite client build output. After running
 * `npm run build`, run `npx cap sync` to copy that build into the native
 * iOS/Android projects.
 */
const config: CapacitorConfig = {
  appId: "com.sestak.gelcalculator",
  appName: "Lighting Gel Combiner",
  webDir: "dist/client",
  backgroundColor: "#1a1714",
  ios: {
    contentInset: "always",
    backgroundColor: "#1a1714",
  },
  android: {
    backgroundColor: "#1a1714",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#1a1714",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a1714",
      overlaysWebView: false,
    },
  },
};

export default config;
