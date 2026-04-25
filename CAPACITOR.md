# Lighting Gel Combiner — Native iOS & Android Build Guide

This app is wrapped with **Capacitor** for distribution on the App Store and
Play Store. Everything runs **fully offline** — no APIs, no network calls,
no CDNs. All gel data is bundled. Favorites and inventory live in
`localStorage`.

> ⚠️ The native `/ios` and `/android` folders **cannot** be created inside the
> Lovable editor. You must run a few commands locally on your machine
> (Xcode requires macOS for iOS builds).

---

## 1. One-time local setup

1. Push the project to GitHub (Lovable → top right → GitHub → Connect).
2. Clone it on your computer:
   ```bash
   git clone <your-repo-url>
   cd <your-repo>
   npm install
   ```
3. Build the **offline SPA bundle** (this is the one Capacitor wraps):
   ```bash
   npm run cap:build
   ```
   This runs `vite build --config vite.config.cap.ts` and produces a fully
   static SPA in `dist/cap/` — a single `index.html` plus hashed JS/CSS
   assets. No SSR, no Worker, no server runtime is required.

   > Do **not** run `npm run build` for Capacitor — that command produces the
   > TanStack Start SSR build (`dist/server/` + `dist/client/`) used for the
   > Lovable web deploy, which needs a Cloudflare Worker at runtime and is
   > **not** suitable for an offline WebView.

4. Add the native platforms (only needed once):
   ```bash
   npx cap add ios
   npx cap add android
   ```
   This creates `/ios` and `/android` folders in your repo.

---

## 2. Sync after every code change

Whenever you edit the app and want to test it on device:

```bash
npm run cap:build
npx cap sync
```

`cap sync` copies the new `dist/cap` build into both native projects
and updates plugin bindings.

---

## 3. Run on iOS

Requires macOS + Xcode 15+.

```bash
npx cap open ios
```

In Xcode:

1. Select a Simulator (e.g. iPhone 15) or your connected device.
2. Click **Signing & Capabilities** → choose your Apple Developer team.
3. Press **▶ Run**.

For a real device you must enroll in the Apple Developer Program ($99/yr).

---

## 4. Run on Android

Requires Android Studio (any OS).

```bash
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync to finish.
2. Pick an emulator (Tools → Device Manager) or plug in a USB device with
   Developer Mode enabled.
3. Press **▶ Run**.

---

## 5. App icons & splash screen

After `cap add`, drop your assets in:

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- `android/app/src/main/res/mipmap-*/`

The fastest workflow is the **@capacitor/assets** generator:

```bash
npm install --save-dev @capacitor/assets
# Place a 1024×1024 icon.png and 2732×2732 splash.png in ./resources/
npx capacitor-assets generate
```

This produces every size required by both stores.

---

## 6. App metadata for store submission

| Field         | Where to set                                                         |
|---------------|----------------------------------------------------------------------|
| App name      | `capacitor.config.ts` → `appName` (currently *Lighting Gel Combiner*) |
| Bundle ID     | `capacitor.config.ts` → `appId` (currently *com.sestak.gelcalculator*) |
| iOS version   | `ios/App/App.xcodeproj` → General → Identity                         |
| Android ver.  | `android/app/build.gradle` → `versionCode` / `versionName`           |
| Description   | App Store Connect / Play Console listing                             |

---

## 7. Production build for the stores

**iOS (App Store):**
1. Xcode → Product → Archive
2. Distribute App → App Store Connect

**Android (Play Store):**
1. Android Studio → Build → Generate Signed Bundle / APK
2. Choose **Android App Bundle (.aab)**
3. Upload the `.aab` to Play Console

---

## 8. Offline guarantees

This app makes **zero** network requests at runtime:

- Gel catalog is statically imported from `src/lib/gels.ts`.
- Color math (`src/lib/color.ts`) and matcher (`src/lib/matcher.ts`) are
  pure JS — no APIs.
- Favorites use `window.localStorage` (key `lgc:favorites:v1`).
- All fonts are system fonts — no Google Fonts CDN.
- No analytics, no telemetry.

Airplane mode → app keeps working.

---

## 9. Troubleshooting

- **White screen on launch** → run `npm run build` before `npx cap sync`.
- **`webDir not found`** → make sure `dist/client` exists; that's the
  TanStack Start client build output.
- **iOS build fails on M-series Macs** → in Xcode, Build Settings →
  Excluded Architectures → Any iOS Simulator SDK → add `arm64`.
- **Status bar overlaps content** → the config sets `overlaysWebView: false`;
  if you change it, add `env(safe-area-inset-top)` padding in CSS.
