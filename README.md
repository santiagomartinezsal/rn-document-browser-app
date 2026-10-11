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
