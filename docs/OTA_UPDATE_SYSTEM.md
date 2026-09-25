# ALPHA Personal Performance OS — Production OTA Auto-Update System

This document outlines the architecture, configuration, deployment workflows, and operational protocols for the Over-The-Air (OTA) update system powering the ALPHA React Native mobile application.

---

## 1. System Architecture

The ALPHA mobile app uses **EAS Update** integrated with **`expo-updates`** to deliver instantaneous, zero-downtime updates to users without requiring Play Store or APK reinstallation.

```
                      +-----------------------------+
                      |   GitHub Push to 'main'     |
                      |   (Scoped to apps/mobile)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    GitHub Actions CI/CD     |
                      |  - npm ci                   |
                      |  - TypeScript strict check  |
                      |  - Monorepo package builds  |
                      +--------------+--------------+
                                     | (Pass)
                                     v
                      +-----------------------------+
                      |       EAS Update CLI        |
                      |   Channel: production       |
                      |   Runtime: appVersion (1.0.0)|
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Expo Cloud Update Server   |
                      |  u.expo.dev/<project-id>    |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
     Cold Launch Check                            Foreground AppState Check
 (Background download)                        (Interactive non-blocking UI)
              |                                             |
              +----------------------+----------------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Active Workout Protection |
                      |   - IF workout in progress: |
                      |     Delay restart prompt    |
                      |   - IF idle:                |
                      |     Show AlphaUpdateModal   |
                      +-----------------------------+
```

---

## 2. Project Configuration

### `apps/mobile/app.json`
- **EAS Project ID**: `8b8e3acd-ebda-4d78-b8fa-c84d8bb079af`
- **Native Package Name**: `com.gymapp08.alphapersonalperformanceos`
- **Native Version Code**: `1`
- **Native App Version**: `1.0.0`
- **Runtime Version Policy**: `{"policy": "appVersion"}`  
  *All OTA updates published for app version `1.0.0` will automatically bind to any native build sharing `version: "1.0.0"`.*
- **Update URL**: `https://u.expo.dev/8b8e3acd-ebda-4d78-b8fa-c84d8bb079af`
- **Check Automatically**: `ON_LOAD` (with `fallbackToCacheTimeout: 0` for instantaneous startup).

### `apps/mobile/eas.json`
Build profiles explicitly link to update channels:
- `production` &rarr; `"channel": "production"`
- `preview` &rarr; `"channel": "preview"`
- `development` &rarr; `"channel": "development"`

---

## 3. In-App Update Engine & Safety Protections

The in-app update system is implemented across:
- **`UpdateService`** (`apps/mobile/src/services/updateService.ts`): Singleton service managing `expo-updates` APIs, lifecycle events, and app state transitions.
- **`UpdateContext`** (`apps/mobile/src/context/UpdateContext.tsx`): React context exposing live state and binding with `PerformanceContext` for workout safety.
- **`AlphaUpdateModal`** (`apps/mobile/src/components/AlphaUpdateModal.tsx`): Dark OLED modal adhering to the Alpha visual language.
- **`SettingsScreen`** (`apps/mobile/src/screens/profile/SettingsScreen.tsx`): Real-time diagnostics card with manual "Check Now" button.

### Non-Negotiable Constraint: Workout Protection
OTA updates **never interrupt an active workout or discard unsaved workout/nutrition data**.
- When `workout.status === 'IN_PROGRESS'`, the update service:
  1. Quietly downloads the update in the background.
  2. Suppresses the blocking modal.
  3. Displays a discrete, non-intrusive amber pill: `UPDATE READY · SAFE WORKOUT MODE`.
  4. Blocks any call to `Updates.reloadAsync()`.
  5. Shows a safety warning if the user attempts to manually restart before finishing their session.

---

## 4. GitHub Actions CI/CD Setup

Two automated workflows are provided in `.github/workflows/`:

| Workflow File | Trigger | Channel | Purpose |
| :--- | :--- | :--- | :--- |
| `eas-update-production.yml` | Push to `main` (scoped to `apps/mobile/**`) or Manual | `production` | Automatic production OTA release |
| `eas-update-preview.yml` | Manual (`workflow_dispatch`) | `preview` | Pre-release QA testing on internal builds |

### Required GitHub Secret: `EXPO_TOKEN`
To enable GitHub Actions to publish updates to your Expo account:

1. Log into your Expo dashboard: [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
2. Click **Create Token** &rarr; Name it `GitHub Actions CI`.
3. Copy the token.
4. In your GitHub repository:
   - Navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
   - Click **New repository secret**.
   - **Name**: `EXPO_TOKEN`
   - **Secret**: Paste the Expo access token.
   - Click **Add secret**.

---

## 5. Native Changes vs. OTA Updates Protocol

Not all changes can be delivered via Over-The-Air updates. The following protocol **must** be followed:

###  What CAN be released via OTA (`eas update`):
- React Native components and screens (UI/UX updates)
- State management and context updates (`PerformanceContext`, `AuthContext`)
- TypeScript business logic, formulas, and algorithms
- Styling, theme colors, and layout adjustments
- Static bundled assets (images, icons)
- API endpoint and networking logic

### ❌ What CANNOT be released via OTA (Requires New EAS Build):
The following modifications alter native binary code and **will crash or fail** if pushed through OTA:
- Adding, upgrading, or removing native modules (e.g. `react-native-reanimated`, health integrations)
- Changing `apps/mobile/app.json` native configurations:
  - Permissions (`android.permissions`, `ios.infoPlist`)
  - Package ID (`com.gymapp08.alphapersonalperformanceos`)
  - `versionCode` or native `version` bump
  - Splash screen native drawables or App icons
  - `expo-build-properties` (Kotlin version, Android compileSdkVersion)

### Native Release Procedure (When Native Changes are Required):
1. Bump `version` in `apps/mobile/app.json` (e.g. `1.0.0` &rarr; `1.1.0`) and increment `versionCode` (e.g. `1` &rarr; `2`).
2. Run full native build:
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   ```
3. Upload the resulting `.aab` to Google Play Console (or install the preview `.apk`).
4. Future OTA updates for the new version will automatically use runtime version `1.1.0`.

---

## 6. Testing the Update on the Installed App

To verify OTA updates on your already-installed Android APK:

1. **Verify Current Channel & Runtime in App**:
   - Open ALPHA App &rarr; Tap **Profile/Settings** &rarr; **Settings**.
   - Scroll to **SYSTEM UPDATES (OTA)**.
   - Notice: `Runtime Channel: PRODUCTION` and `v1.0.0`.

2. **Publish a Test OTA Update**:
   From terminal:
   ```bash
   cd apps/mobile
   npx eas-cli update --channel production --message "Test live OTA update"
   ```

3. **Observe In-App Update Flow**:
   - Open or bring the ALPHA app to foreground.
   - You will see the discrete cyan notification pill: **ALPHA OS UPDATE — Downloading verified bundle in background...**
   - Once completed, the **ALPHA Performance OS System Update Available** card appears.
   - Tap **Restart & Apply Update**. The app will reload with the new JavaScript bundle instantly!
