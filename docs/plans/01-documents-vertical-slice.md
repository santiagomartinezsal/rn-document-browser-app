# Documents vertical slice

## Context

The project is a greenfield React Native (Expo SDK 57, TypeScript strict)
take-home. So far only tooling (lint/prettier/test setup) and server response
fixtures exist — no feature code. The architecture (feature folders with
`api/domain/state/ui` layers, `useReducer` + Context per feature, repository
as single source of truth) is already decided and recorded in README.md and
CLAUDE.md. This milestone builds the first vertical slice: fetch documents
from the challenge server and render their titles in a plain `FlatList`, with
no styling. It intentionally stops short of local-document merging (no
create-document feature yet — the server has no POST) and of any UI polish.
Each unit below is one commit.

Verified repo state: `src/features/documents/` has only its fixture JSON (a
bare PascalCase array; `ID` is all-caps). `src/shared/` does not exist.
Jest uses the `jest-expo` preset, `@testing-library/react-native` v14 is
installed, path alias `@/*` → `./src/*`, `resolveJsonModule: true` (fixtures
import directly). ESLint requires `import type`, exhaustive `switch`,
no floating/misused promises. No new dependencies needed — RN/Expo ship
global `fetch`/`WebSocket`.

## Commits

- [ ] **1. Domain type + DTO + defensive mapper**
  - `src/features/documents/domain/document.ts` — `DocumentContributor { id, name }`, `Document { id, title, createdAt, updatedAt, attachments, contributors, version }`. All DTO fields kept (renamed to camelCase), since this is the one mapping pass for the entity.
  - `src/features/documents/api/document-dto.ts` — `DocumentContributorDto { ID, Name }`, `DocumentDto { ID, CreatedAt, UpdatedAt, Title, Attachments, Contributors, Version }`.
  - `src/features/documents/api/document-mapper.ts` — private `isDocumentDto(value: unknown): value is DocumentDto` type guard; `InvalidDocumentError`, `InvalidDocumentsResponseError`; `mapDocument(dto: unknown): Document` (throws on invalid shape); `mapDocuments(payload: unknown): Document[]` (throws `InvalidDocumentsResponseError` if not an array; per-element try/catch — skips and `console.warn`s a malformed entry rather than dropping the whole list, since the server already guarantees a loose shape, not per-field validity).
  - `src/features/documents/api/document-mapper.test.ts` — maps the real fixture (import JSON directly) and checks length + first entry; throws on non-array payload; skips one malformed entry out of two; warns on skip; per-field rejection cases for `mapDocument` (missing `Title`, non-array `Attachments`, contributor missing `Name`).

- [ ] **2. Shared HTTP client (timeout + typed errors) + server host resolution**
  - `src/shared/http/http-errors.ts` — `HttpError` base; `HttpTimeoutError`, `HttpNetworkError`, `HttpParseError` leaves; `HttpResponseError` carries `status: number`. Generic — no documents-specific meaning.
  - `src/shared/http/http-client.ts` — `DEFAULT_TIMEOUT_MS = 10_000`; `fetchJson(url: string, options?: { timeoutMs?: number }): Promise<unknown>`. Returns `unknown` — transport correctness only, shape validation stays in each feature's own mapper. `AbortController` + `setTimeout` for the timeout, cleared in `finally`. Split into two helpers (`performFetch`, `parseJsonBody`) to stay under ~20 lines each.
  - `src/shared/http/server-config.ts` — named constants `LOCALHOST_HOST`, `ANDROID_EMULATOR_HOST`, `CHALLENGE_SERVER_PORT = 8080`; pure `resolveServerHost(platformOS: PlatformOSType): string`; `getServerHost(): string` wrapper reading the real `Platform.OS` (left untested — the branching logic is already covered via the pure function); `getHttpBaseUrl(): string` composing `http://${getServerHost()}:${CHALLENGE_SERVER_PORT}`. Lives in shared because the host/port resolution is about reaching the challenge server at all, not about documents specifically — the notifications feature's `ws://` URL will need the same host later.
  - `src/shared/http/http-client.test.ts` — mock `global.fetch`: resolves parsed body on ok response; rejects `HttpResponseError` with correct `.status` on non-ok; rejects `HttpParseError` when body isn't JSON; rejects `HttpNetworkError` when `fetch` itself rejects; rejects `HttpTimeoutError` using fake timers + an abort-aware fetch stub.
  - `src/shared/http/server-config.test.ts` — table test over `ios`/`android`/`web` asserting the exact resolved host, plus one assertion for `getHttpBaseUrl()`'s composed URL shape.
  - This is the one piece of this slice that isn't documents-specific: a typed-error `fetch` wrapper and "how do I reach the challenge server" are generic concerns any feature doing network I/O would need, so they go in `src/shared/` on day one rather than waiting for a second consumer to force a move. What stays in the documents feature is only the documents-specific use of it: the `/documents` path and the DTO mapping (commit 3).

- [ ] **3. Repository interface + server implementation**
  - `src/features/documents/domain/documents-repository.ts` — `DocumentsRepository { getAll(): Promise<Document[]> }`. Deliberately parameter-less and minimal so a future local-merge implementation (`createMergingDocumentsRepository(...)`) is a drop-in replacement — nothing upstream changes shape. `domain/` doesn't reference HTTP error types, keeping the "domain never imports api/" rule.
  - `src/features/documents/api/server-documents-repository.ts` — `createServerDocumentsRepository(baseUrl: string): DocumentsRepository`, calling the shared `fetchJson` then the local `mapDocuments`.
  - `src/features/documents/api/server-documents-repository.test.ts` — mocks `@/shared/http/http-client` (not `global.fetch`, since commit 2 already covers that layer): `getAll()` returns mapped documents on success; propagates (doesn't swallow) `fetchJson` rejections.

- [ ] **4. Reducer + Context + `useDocuments` hook**
  - `src/features/documents/state/documents-reducer.ts` — `DocumentsState` discriminated union: `{status:'idle'}` | `{status:'loading'}` | `{status:'success', documents}` | `{status:'error', message}`. `DocumentsAction`: `FETCH_STARTED` | `FETCH_SUCCEEDED` | `FETCH_FAILED`. `documentsReducer` via exhaustive `switch` (satisfies `switch-exhaustiveness-check`).
  - `src/features/documents/state/documents-repository-context.tsx` — `DocumentsRepositoryContext`, `DocumentsProvider({ repository, children })`. Taking `repository` as a prop (rather than constructing one internally) is what makes commit 5's fake-repository test possible without module mocking.
  - `src/features/documents/state/use-documents.ts` — `useDocuments(): DocumentsState`; reads repository from context (throws if used outside `DocumentsProvider`); `useReducer` + a `useEffect` that dispatches `FETCH_STARTED` → calls `repository.getAll()` → dispatches `FETCH_SUCCEEDED`/`FETCH_FAILED`. Returns state as-is; no `refetch` yet (nothing in this slice needs it).
  - `src/features/documents/state/documents-reducer.test.ts` — one assertion per transition (`FETCH_STARTED`, `FETCH_SUCCEEDED`, `FETCH_FAILED`).
  - `src/features/documents/state/use-documents.test.tsx` — via `renderHook` with a `DocumentsProvider` wrapper around a fake repository: ends in `success` with the fake's documents; ends in `error` with a message when the fake rejects; throws when rendered without a provider.

- [ ] **5. Screen (plain `FlatList`) + test with fake repository**
  - `src/features/documents/ui/documents-screen.tsx` — `DocumentsScreen(): JSX.Element`; guard-clause branches over `useDocuments()` status (error → loading/idle → success `FlatList`). TestIDs: `documents-loading`, `documents-error`, `documents-list`, `document-${item.id}` per row.
  - `src/features/documents/ui/documents-screen.test.tsx` — same `render`/`screen` pattern as the existing `App.test.tsx`; fake repository as a plain object (`{ getAll: jest.fn().mockResolvedValue([...]) }` / `.mockRejectedValue(...)`) injected via `DocumentsProvider`. Verifies: each fake document's title appears (`findByText`, async); loading state visible before the fake's promise resolves (deferred promise); error message appears on rejection.

- [ ] **6. Feature `index.ts` + `App.tsx` wiring**
  - `src/features/documents/index.ts` — exports `DocumentsScreen`, `DocumentsProvider`, the `DocumentsRepository` type, and `createDocumentsRepository(): DocumentsRepository` (binds the shared `getHttpBaseUrl()` to `createServerDocumentsRepository`), hiding the transport detail from `App.tsx`.
  - `src/app/App.tsx` — module-scoped `const repository = createDocumentsRepository()`; renders `<DocumentsProvider repository={repository}><DocumentsScreen /></DocumentsProvider>` plus the existing `StatusBar`.
  - `src/app/App.test.tsx` — mocks `global.fetch` to resolve with the fixture JSON; renders `<App />`; `await screen.findByText(fixture[0].Title)` and asserts it's on screen. Replaces the old placeholder `app-root` assertion (that markup no longer exists) and exercises the full wired path once.

## Verification

- After each commit: `npm test`, `npm run lint`, `npm run typecheck` — all must pass before committing.
- Commit 6 is the only one exercising the real app shell; run `npm run ios` (or `android`) with the challenge server running (`go run server.go`) to confirm titles actually render end-to-end against the live server, not just fixtures.
- Final check across the whole slice: `npm test`, `npm run lint`, `npm run typecheck` once more after commit 6.
