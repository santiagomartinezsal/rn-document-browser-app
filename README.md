# Document Browser

React Native (Expo) app to browse documents, get real-time notifications and create new ones.

## Getting started

Requires Node 24 (`nvm use`), and Xcode or Android Studio.

```bash
npm ci
go run server.go   # challenge server, from its own folder (localhost:8080)
npm run ios        # or: npm run android
```

Checks: `npm test`, `npm run lint`, `npm run typecheck`.

## Decision record

- `blank-typescript` template: single screen, so no router needed.
- State: `useReducer` + Context per feature, no state library. The state is small and the UI only
  consumes hooks, so moving to Zustand or TanStack Query would only touch `state/`.
- Architecture: feature folders with layers inside (each feature owns its `api`, `domain`,
  `state` and `ui`). A feature can change or be removed in one place, and `domain` has no React
  or network code, so it's tested in isolation. Based on:
  - [Bulletproof React](https://github.com/alan2207/bulletproof-react): feature folders that
    don't import each other's internals.
  - [Android's app architecture guide](https://developer.android.com/topic/architecture): a
    repository per feature as the single source of truth, hiding where the data comes from.

  Alternatives considered:
  - Layer-first folders (`domain/`, `data/`, `ui/` at the root, shared by all features): one
    feature change touches several top-level folders.
  - Feature-Sliced Design (fixed layers `app → pages → widgets → features → entities → shared`,
    imports only downward): strict and scalable, but too much structure for one screen.
  - Clean Architecture with use cases everywhere (every action goes through a use-case class
    between UI and repositories): most use cases would only forward a repository call; I add
    one only where there is real logic.
- Data fetching: a hand-written `fetchJson` wrapper over the global `fetch` (`AbortController`
  timeout + a small typed-error hierarchy: `HttpTimeoutError`, `HttpNetworkError`,
  `HttpResponseError`, `HttpParseError`), not a library. The real need is one `GET` endpoint
  with no caching requirement, so the wrapper stays ~40 lines, fully covered by tests for every
  failure path (timeout, network failure, non-2xx, invalid JSON).

  Alternatives considered:
  - TanStack Query: its main value (caching by query key, staleness, refetch-on-focus) doesn't
    apply here — the challenge server returns a freshly randomly-generated set of documents on
    every call, with no overlapping IDs between requests, so there is no stable "document list"
    to cache.
  - axios / ky: would still need the same typed-error mapping on top, since neither throws our
    domain-specific error types; the only thing delegated is timeout/retry wiring, a small
    fraction of what the wrapper already does and tests.
- Documents state: no state library (Zustand, Redux, Jotai...) here either — the state is one
  fetch-on-mount lifecycle with no cross-feature sharing, undo, or persistence, so `useReducer`
  already covers it with zero bundle cost and a plain, directly-testable reducer function, per
  the State decision above. `DocumentsState` is a discriminated union (`idle | loading | success |
  error`) over a single `status` field, not separate `isLoading`/`error`/`documents` flags — makes
  impossible combinations (e.g. loading and error at once) unrepresentable. `DocumentsProvider`
  takes the repository as a prop rather than constructing it internally, so `useDocuments` can be
  tested against a fake repository without mocking any module.
- Feature boundaries: `eslint-plugin-boundaries` enforces that a feature's internals are only
  importable through its `index.ts` (`boundaries/dependencies` in `eslint.config.js`). Preferred
  over hand-rolling it with `import/no-restricted-paths` (no new dependency, but needs an
  `fs.readdirSync` scan and a generated zone per feature) for a declarative config that reads as
  the rule itself rather than logic to trace through.
- React Compiler: enabled (`experiments.reactCompiler` in `app.json`) so components and hook
  return values are memoized automatically — no hand-written `useMemo`/`useCallback`/`React.memo`.
  Stable and maintained by the React team; Expo SDK 54+ wires the Babel plugin in automatically
  (no extra dependency), and SDK 55+ bundles its ESLint rules in `eslint-config-expo`, so lint
  already catches Rules-of-React violations the compiler couldn't safely optimize around.
- Styling: plain React Native `StyleSheet.create` per component, referencing named constants from
  `src/shared/ui/theme.ts` (`colors`, `spacing`, `fontSize`, `borderRadius`, `iconSize`) instead of
  inline hex/pixel literals. Keeps colors and spacing consistent across components without a new
  dependency or build-step config.

  Alternatives considered:
  - NativeWind (Tailwind for React Native): closer to a utility-class workflow, but needs a
    babel/metro/global.css setup for a two-screen app whose only current styling need is one
    card component — the plain constants file covers that with zero extra config.
  - A component library (Tamagui, Restyle...): brings its own primitives and theming API on top
    of RN's; more than this app's fixed, mockup-driven screens need.
- Icons: `@expo/vector-icons` for the document card's Contributors/Attachments markers. It ships
  bundled with the Expo SDK, so it works in Expo Go with no extra native-module linking. Its font
  loader (`expo-font`) requires `expo-asset` at runtime, so that's installed alongside it even
  though nothing here imports it directly.

  Alternatives considered:
  - `react-native-vector-icons` directly: the package `@expo/vector-icons` wraps, but without the
    guaranteed auto-linking/Expo Go compatibility the Expo-maintained wrapper provides.
- Safe area: `react-native-safe-area-context`'s `SafeAreaProvider` (root, in `App.tsx`) and
  `SafeAreaView` (wrapping `DocumentsScreen`'s content) keep the screen clear of the status
  bar/notch/home indicator. Bundled in Expo Go for SDK 57, no dev build needed. Tests use the
  library's own `jest/mock` (wired via `package.json`'s `jest.setupFiles`) so components don't
  need a real `SafeAreaProvider` ancestor to resolve insets in Jest.

  Alternatives considered:
  - React Native core's own `SafeAreaView`: iOS-only (a no-op on Android), and effectively
    deprecated in favor of this library — wouldn't actually handle the Android case this app
    targets.
- Sorting: `compareVersions` and `sortDocuments` are plain functions in `domain/`, not inlined in
  the screen or the reducer — they're pure, so they're tested directly with no component/hook
  rendering. Each `SortKey` (date, title, version) has one fixed direction (newest, A→Z, highest)
  instead of an independent ascending/descending toggle, since the mockup's "Sort by" control
  doesn't show one and a toggle would double the menu's states for no requirement asked for.
  `useDocuments` tracks the active `sortBy` as its own `useState`, separate from the fetch
  reducer's `idle | loading | success | error` state — sort preference and fetch status are
  unrelated, and nesting `sortBy` inside the `success` variant would reset it to the default on
  every `retry()`/refetch, silently discarding the user's choice. `SortMenu`'s dropdown is a plain
  RN `Modal` + `Pressable` list (no new dependency); the mockup doesn't show the open state, so its
  look is a judgement call using the existing theme tokens.
- File picker: `expo-document-picker` for the "Add document" modal's File field. It ships bundled
  in Expo Go, so no development build or config plugin is needed for the basic `getDocumentAsync()`
  call used here. The picker result's `uri`/`mimeType` are never read past that call — this app
  only ever stores the picked file's `name` as an attachment reference, since there's no `POST
  /documents` to upload bytes to and no local persistence layer to copy them into;
  `copyToCacheDirectory: false` is passed for the same reason, so nothing is written to the app's
  cache.

  Alternatives considered:
  - A plain text input for a file name: no new dependency, but diverges from the mockup's
    picker-button UX.
  - `react-native-document-picker`: not guaranteed Expo-Go-compatible, would likely force a
    development build.
- Real-time transport: `partysocket`'s `WebSocket` class (reconnect with exponential backoff,
  configurable via `maxRetries`/`minReconnectionDelay`/`maxReconnectionDelay`) instead of a
  hand-written equivalent. It's a drop-in replacement for the platform `WebSocket` (same
  `onopen`/`onmessage`/`onclose`/`onerror` surface, plus `reconnect()`/`close()`), pure JS with no
  native module (`event-target-shim` is its only dependency, itself dependency-free), so Expo Go
  needs no development build. 1.5M+ weekly downloads and released within the last few months,
  versus the originally-considered `reconnecting-websocket`, whose last release was 6 years ago.
  `notificationsSocketSource.ts` only unit-tests its own integration (parses a valid message,
  drops and warns on a malformed one, delegates `start`/`stop` to `reconnect`/`close`) — the
  backoff/retry timing itself is the library's responsibility and its own test suite's job, not
  re-tested here.

  Alternatives considered:
  - Hand-written reconnecting WebSocket (a small `idle | connecting | open | waitingToRetry` state
    machine over the platform `WebSocket`, backoff capped via `min(initialDelay * 2^n, maxDelay)`):
    this is what shipped first, with its own fake-timer test suite covering the backoff schedule.
    Working code, but maintaining a hand-rolled reconnect/backoff implementation (and its ~200
    lines of tests) going forward has an ongoing cost a maintained library removes, for a part of
    the app that isn't this project's differentiator.
  - `socket.io-client`: incompatible outright — it speaks its own handshake protocol (namespaces,
    acks, polling fallback) on top of WebSocket, and the challenge server is a plain `ws://`
    endpoint emitting raw JSON frames, not a Socket.IO server.
  - `@opensumi/reconnecting-websocket`: an actively maintained fork of the same abandoned package,
    explicitly targeting React Native, but a small fraction of `partysocket`'s downloads/visibility.
  - `react-use-websocket` / `react-native-use-websocket`: React hooks rather than a plain socket
    wrapper — would compete with this project's own `useReducer`+Context state layer instead of
    sitting underneath it in `api/`.
