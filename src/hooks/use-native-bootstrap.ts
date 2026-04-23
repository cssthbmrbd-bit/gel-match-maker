/**
 * Native (Capacitor) bootstrap.
 *
 * Runs only when the app is wrapped by Capacitor (iOS / Android). On the
 * web it's a no-op — Capacitor.isNativePlatform() returns false and we
 * skip the native plugin calls.
 */
import { useEffect } from "react";

export function useNativeBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (cancelled || !Capacitor.isNativePlatform()) return;

        const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
          import("@capacitor/status-bar"),
          import("@capacitor/splash-screen"),
        ]);

        await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#1a1714" }).catch(() => {});
        }
        await SplashScreen.hide().catch(() => {});
      } catch {
        // Capacitor not present (web build) — ignore.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
