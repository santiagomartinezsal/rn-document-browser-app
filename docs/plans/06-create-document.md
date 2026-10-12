# Create documents: modal first, then push logic into the architecture

## Context

The documents feature has a working vertical slice plus list/grid/sort
(plans 01-05), but creation is entirely unimplemented: `DocumentsRepository`
only has `getAll()`, there's no local data source, no merge logic, and no
"Add document" UI. Per CLAUDE.md the challenge server has no `POST
/documents`, so creating a document is local-only — eventually the
repository must become "the single source of truth" by merging server
documents with ones created on-device, as plan 01 anticipated when it kept
`DocumentsRepository` deliberately minimal.

Rather than building the architecture bottom-up before anything is visible,
this milestone is a walking skeleton: get the "Add document" modal working
end-to-end first with the simplest possible wiring, then push that logic
down into proper layers one refactor at a time — in-memory local source,
then merge. Each unit below is one commit.

Dependency approved: `expo-document-picker` for the modal's "File" field —
confirmed bundled in Expo Go (no dev build, no config plugin needed for
basic `getDocumentAsync()`). Decision record goes in README with commit 1.

The mockup for this milestone is `mockups/mdc_3.png` (add-document modal,
gitignored local folder, not checked into the repo); the "+ Add document"
trigger button is visible at the bottom of `mockups/mdc_1.png` (list view).

## Commits

- [x] **1. "Add document" modal, wired directly into state**

  Gets the feature visibly working end-to-end: submitting the modal appends
  a document to the current list. No local-source abstraction yet — the
  hook builds the `Document` itself; that's intentionally temporary and
  gets extracted in commit 2.

  - `src/features/documents/domain/document.ts` — add `CreateDocumentInput
    { title: string; version: string; fileName: string }`.
  - `src/features/documents/domain/validateCreateDocumentInput.ts` (+ test)
    — pure function, no throwing (invalid form input is expected control
    flow): `ValidationResult = { valid: true } | { valid: false; errors:
    Partial<Record<keyof CreateDocumentInput, string>> }`. Rules: `title`
    non-empty after trim; `version` matches the dot-separated numeric-
    segment shape `compareVersions` already assumes (`/^\d+(\.\d+)*$/`);
    `fileName` non-empty (file is required, per mockup). One `it` per rule
    plus the all-valid case, following the `describe`/`it` + builder-object
    style used in `sortDocuments.test.ts`.
  - `npx expo install expo-document-picker`; README decision-record entry
    (why: matches the mockup's file-picker UX and needs no dev build;
    alternatives considered: plain text input for a file name — rejected,
    diverges from mockup; `react-native-document-picker` — rejected, not
    Expo-Go-compatible).
  - `src/features/documents/state/documentsReducer.ts` (+ test) — add
    `{ type: 'DOCUMENT_CREATED'; document: Document }`; when `status ===
    'success'`, prepends `action.document` to `state.documents`.
  - `src/features/documents/state/useDocuments.ts` (+ test) — add
    `addDocument(input: CreateDocumentInput): void` that builds a
    `Document` from `input` inline (hand-rolled
    `local-${Date.now()}-${random}` id, `createdAt`/`updatedAt` = now,
    `attachments: [input.fileName]`, `contributors: []`) and dispatches
    `DOCUMENT_CREATED`.
  - `src/features/documents/ui/AddDocumentModal.tsx` (+ test) — follows
    `SortMenu`'s local-state `Modal` pattern (no navigation library). Title
    "Add document" + close button, Name input, Version input, "Choose
    file" button calling `DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false })` and showing the picked file's name
    (truncated with the same ellipsis pattern `DocumentCard` already uses
    for long titles), inline per-field error text from
    `validateCreateDocumentInput`, full-width Submit button. On valid
    submit: calls `addDocument`, closes. A canceled pick (`result.canceled
    === true`) is a normal outcome, not an error. Only `name` is ever read
    off the picker result and stored (as `fileName`); the picked
    `uri`/`mimeType` are never persisted, logged, or used for anything,
    since nothing in this app reads file contents or uploads them.
  - `src/features/documents/ui/DocumentsScreen.tsx` — add the mockup's
    full-width "+ Add document" button pinned under the list (only once
    `status === 'success'`), opening the modal via local `useState`, same
    precedent as `SortMenu`.

- [x] **2. Extract an in-memory local documents source**

  Pure refactor: moves the ad-hoc document-building out of the hook into a
  proper, independently-testable port + implementation. External behavior
  is unchanged (commit 1's tests should still pass; new tests cover the
  extracted source directly).

  - `src/features/documents/domain/localDocumentsSource.ts` — a port like
    `documentsRepository.ts`: `LocalDocumentsSource { add(input:
    CreateDocumentInput): Document; getAll(): Document[] }`. Synchronous —
    it's in-memory, no I/O.
  - `src/features/documents/api/inMemoryLocalDocumentsSource.ts` (+ test) —
    `createInMemoryLocalDocumentsSource(): LocalDocumentsSource`. Owns the
    id generation and `Document` construction moved out of `useDocuments`;
    keeps an internal array and prepends on `add` so its own `getAll()` is
    already newest-first. Tests: starts empty, `add` returns the created
    document, `getAll` reflects additions newest-first.
  - A small `LocalDocumentsSourceContext` (mirroring
    `DocumentsRepositoryContext`) provides one shared instance; `index.ts`
    constructs it alongside the repository. This context is transitional —
    commit 3 folds the local source into the repository composition and
    removes it again.
  - `src/features/documents/state/useDocuments.ts` (+ test) — `addDocument`
    now calls `localSource.add(input)` and dispatches `DOCUMENT_CREATED`
    with the result, instead of building the `Document` itself.

- [ ] **3. `mergeDocuments` + merging repository**

  Makes the repository the actual source of truth: local documents now
  survive a refetch/remount, deduped against the server by id.

  - `src/features/documents/domain/mergeDocuments.ts` (+ test) — pure
    `mergeDocuments(local: Document[], server: Document[]): Document[]`.
    Dedupes by `id`; local documents win and come first. Tests: dedups an
    id present in both, concatenates distinct ones, local document is
    first.
  - `src/features/documents/domain/documentsRepository.ts` — split the
    write capability out instead of forcing it onto
    `serverDocumentsRepository` (which genuinely can't create — no POST):
    `DocumentsRepository { getAll(): Promise<Document[]> }` stays as-is;
    add `DocumentsWriter { create(input: CreateDocumentInput):
    Promise<Document> }`.
  - `src/features/documents/api/mergingDocumentsRepository.ts` (+ test) —
    `createMergingDocumentsRepository(server: DocumentsRepository, local:
    LocalDocumentsSource): DocumentsRepository & DocumentsWriter`.
    `getAll()` awaits `server.getAll()` and returns
    `mergeDocuments(local.getAll(), serverDocuments)`; `create()` delegates
    to `local.add()`. Test (fakes for `server`/`local`): merged list
    dedupes by id, and **a just-created document appears first** in
    `getAll()`.
  - `src/features/documents/index.ts` — wire `createDocumentsRepository()`
    to `createMergingDocumentsRepository(createServerDocumentsRepository(...),
    createInMemoryLocalDocumentsSource())`; remove the now-redundant
    `LocalDocumentsSourceContext` from commit 2.
  - `src/features/documents/state/useDocuments.ts` (+ test) — widen the
    repository type to `DocumentsRepository & DocumentsWriter`;
    `addDocument` now calls `repository.create(input)` instead of the
    local-source context.

## Verification

- After each commit: `npm test`, `npm run lint`, `npm run typecheck` — all
  must pass before committing.
- After commit 1: run the app (`npm run ios`/`npm run android`, challenge
  server running), open "Add document", submit valid input, confirm the new
  document appears first in both list and grid views; compare the modal
  against `mockups/mdc_3.png`.
- After commit 3: confirm a created document also survives pulling to
  refresh / remounting, still ahead of the server-fetched ones.
