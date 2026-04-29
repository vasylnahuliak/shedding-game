# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Development builds

This app is configured for a local-first development build workflow.

1. Build and install the native app once per platform:

   ```bash
   npm run run:android
   npm run run:ios
   ```

2. Start the Metro bundler for day-to-day development:

   ```bash
   npm run start
   ```

Use `npm run prebuild:clean` after changing native dependencies, upgrading the Expo SDK, or editing `app.config.js`, then rebuild the native app with `run:android` or `run:ios`.

## Local App Store build

Use `npm run build:ios` when you need a local production iOS build via EAS for App Store upload.

Use `npm run build:android` when you need a local production Android build via EAS.

Both commands run through `scripts/with-secrets.sh`, which exports values from `apps/frontend/.secrets` before invoking EAS.

Make sure `apps/frontend/.secrets` exists and contains shell-style `KEY=value` entries.

On macOS, iOS Simulator development builds work without a paid Apple Developer account. A real iPhone build still requires Apple signing credentials.

## Local Supabase Auth

`npm run dev` now boots a local Supabase stack before Expo and the backend, then rewrites the ignored `.env.local` files in `apps/frontend` and `apps/backend` with the current local URL and keys.

- Supabase Studio: `http://127.0.0.1:54323`
- Test email inbox for password reset flows: `http://127.0.0.1:54324`

If you change `supabase/config.toml`, restart the stack with:

```bash
npm run supabase:stop
npm run supabase:start
npm run supabase:env
```

## Sentry

Frontend Sentry uses `EXPO_PUBLIC_SENTRY_DSN_MOBILE` for iOS and Android.

## Aptabase

- `EXPO_PUBLIC_APTABASE_APP_KEY` enables Aptabase analytics for native builds.
- Keep it in `apps/frontend/.env.local` for local development.
- For EAS Build / EAS Update, add the same variable to the target EAS environment so Expo can inline it during build time.

## React effect policy

- Keep `useEffect` and `useLayoutEffect` for external synchronization only: subscriptions, sockets, analytics, timers, browser or native bridges, and other imperative integrations.
- Derived state belongs in render. User actions belong in event handlers. If an effect name sounds like `submit`, `press`, `compute`, `filter`, or `sort`, refactor before naming it.
- Name every `useEffect` and `useLayoutEffect` callback inline: `useEffect(function syncRoomSubscription() { ... }, deps)`.
- For `useFocusEffect`, use `useFocusEffect(useCallback(function syncRoomsOnFocus() { ... }, deps))`.
- Prefer verb-first names such as `sync*`, `subscribe*`, `track*`, `redirect*`, `restore*`, `measure*`, and `initialize*`.
- Avoid vague names such as `effect`, `run`, `doStuff`, and `handleEffect`.

## Smler invite links and deferred deep links

- `EXPO_PUBLIC_SMLER_DOMAIN` controls which Smler host the native app recognizes for direct and deferred deep links. The default is `smler.in`.
- Backend invite-link generation requires `PUBLIC_APP_URL` and `SMLER_API_KEY`.
- `POST /rooms/:roomId/invitations` creates a fresh Smler short link that resolves to the canonical `/lobby?roomId=...` destination.
- Native builds need a fresh prebuild/reinstall after changing `app.config.js` deep-link settings.

Sentry is intentionally disabled for local development sessions. If `__DEV__ === true` or `EXPO_PUBLIC_APP_ENV=local`, the SDK is not initialized and no events are sent.

For Expo development builds, use local builds for debugging and a non-local build (`staging` or `production`) when you want to validate real Sentry delivery. This project uses development builds instead of Expo Go, which is the recommended path for native Sentry integration.

### EAS Build and EAS Update

- Native build uploads use the standard Sentry environment variables expected by the Expo/Sentry plugin: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
- Keep `SENTRY_PROJECT` pointed at the mobile Sentry project in EAS Build environments.
- If you also keep `SENTRY_PROJECT_MOBILE`, set it to the same value so the update upload script can reuse it.
- After `eas update`, upload update sourcemaps with:

  ```bash
  npm run sentry:upload:eas-update-sourcemaps
  ```

### Static Site

- `apps/frontend/public` is the only website surface now.
- It exists only for legal pages and deep-link handoff on the main app domain.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial for Expo development workflows.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
