# Documents list: card + loading/error/empty states

## Context

The documents feature has a working vertical slice (repository, reducer, `useDocuments`,
`DocumentsScreen`), but the screen only renders a document's title in a bare `View`/`Text`, has
no empty-state handling, and has no way to retry after a failed fetch. This milestone brings the
list screen in line with the challenge mockup's list view: a document card showing title,
version, contributors and attachments, plus loading, error (with retry), and empty states — each
covered by component tests. Each unit below is one commit.

Out of scope for this milestone (separate future work): grid view, the sort dropdown, the
notification bell, and the "Add document" modal — the mockup shows all of these on the same
screen, but only the card + list states were asked for here.

The mockup images live at `mockups/mdc_1.png` (list view, implemented here), `mdc_2.png` (grid
view, out of scope), and `mdc_3.png` (add-document modal, out of scope) — a gitignored local
folder, not checked into the repo.

Adding `@expo/vector-icons` (bundled with Expo SDK, Expo Go-safe) was approved to render the
small "users"/"link" icons the mockup shows next to the Contributors/Attachments column headers.

## Commits

- [x] **1. `DocumentCard` component + tests**
  - `npx expo install @expo/vector-icons` (never plain `npm install`); add a README
    decision-record entry: why `@expo/vector-icons` (ships bundled with Expo, no extra
    native-module/Expo-Go risk) vs. the alternative considered — `react-native-vector-icons`
    directly, rejected since it isn't guaranteed auto-linked/compatible in Expo Go the way the
    Expo-maintained wrapper is.
  - `src/features/documents/ui/DocumentCard.tsx` — `DocumentCardProps { document: Document }`.
    Root `View` with `testID={\`document-${document.id}\`}` and card styling (white background,
    rounded corners, padding, bottom margin) via `StyleSheet.create`. Row 1: title (bold) +
    `Version {document.version}` (gray, smaller) on the same line. Row 2: two `flex: 1` columns —
    left has `Feather name="users"` + bold "Contributors" label then one `Text` per
    `document.contributors` entry (`key={contributor.id}`); right has `Feather name="link"` +
    bold "Attachments" label then one `Text` per `document.attachments` entry
    (`key={\`${document.id}-attachment-${index}\`}`, attachments are plain strings with no id).
    Empty `contributors`/`attachments`: no special-casing — `.map` over `[]` renders nothing, so
    the column just shows its icon + label with no lines beneath. Confirm `Feather`'s
    `users`/`link` glyph names exist in the installed package before using them.
  - `src/features/documents/ui/DocumentCard.test.tsx` — renders title, version, and every
    contributor name + attachment string for a document with 2 of each; renders without crashing
    and still shows both column labels when `contributors: []` and `attachments: []`.
  - Not wired into `DocumentsScreen` yet — compiles and is tested in isolation.

- [x] **2. `useDocuments` retry capability + tests**
  - `src/features/documents/state/useDocuments.ts` — return type becomes
    `UseDocumentsResult { state: DocumentsState; retry: () => void }`. Add a `fetchAttempt`
    counter via `useState`, included in the fetch effect's dependency array
    (`[repository, fetchAttempt]`) so bumping it re-runs the existing fetch effect;
    `retry = useCallback(() => setFetchAttempt((n) => n + 1), [])`. The existing
    stale-fetch-guard (`isFetchStillCurrent`) is untouched — each effect run still gets its own
    closure. No reducer change: retry re-runs the existing fetch, it isn't a new action/state, so
    `documentsReducer.ts`/`.test.ts` stay untouched.
  - `src/features/documents/ui/DocumentsScreen.tsx` — minimal mechanical adaptation so the build
    stays green: `const state = useDocuments();` becomes `const { state } = useDocuments();`
    only, no new UI behavior yet.
  - `src/features/documents/state/useDocuments.test.tsx` — update the 3 existing tests (success,
    error, throws-outside-provider) from `result.current` to `result.current.state`; new test:
    `getAll` mocked to reject once then resolve, after the hook reaches the error state call
    `result.current.retry()` inside `act`, assert it reaches success and `repository.getAll` was
    called twice.

- [x] **3. `DocumentsScreen` wiring (card, empty state, retry control)**
  - `src/features/documents/ui/DocumentsScreen.tsx` — remove the inline `DocumentRow` function;
    `renderItem` uses `<DocumentCard document={item} />`. Error branch keeps
    `testID="documents-error"` + message text, adds a
    `Pressable testID="documents-retry-button" accessibilityRole="button" onPress={retry}` with
    "Retry" text. Loading branch unchanged (`testID="documents-loading"`). New branch:
    `state.status === 'success' && state.documents.length === 0` →
    `testID="documents-empty"`, copy "No documents yet." Non-empty success: `FlatList` with
    `testID="documents-list"` as before, using `DocumentCard`.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — keep the 3 existing tests (title
    appears, loading, error message); new: error state also renders
    `getByTestId('documents-retry-button')`; new: pressing retry after a reject-then-resolve
    re-fetch reaches the document list (`repository.getAll` called twice); new: `getAll`
    resolving `[]` shows `testID="documents-empty"` with the expected copy. Full card content
    (contributors/attachments) stays covered by `DocumentCard.test.tsx`, not re-asserted here.

## Verification

- After each commit: `npm test`, `npm run lint`, `npm run typecheck` — all must pass before
  committing.
- After commit 3: run the app against the challenge server (`go run server.go`, then
  `npm run ios`/`npm run android`) and compare the rendered list screen against `mockups/mdc_1.png`
  for the card layout, plus manually trigger the error state (e.g. stop the server) to confirm
  the retry button recovers the list once the server is back.
