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
