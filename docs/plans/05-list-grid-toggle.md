# List/grid toggle for the documents screen

## Context

The documents screen currently only renders the full-detail list card (`DocumentCard`) in a
single-column `FlatList`. The mockups (`mockups/mdc_1.png` list view, `mockups/mdc_2.png` grid
view) show a toolbar control — a bordered pill with two segments, list icon and grid icon — that
switches between that list view and a 2-column grid of compact cards (title + version only, no
Contributors/Attachments). This was explicitly deferred in `docs/plans/02-documents-list-card.md`
("Out of scope for this milestone: grid view... deferred"). This milestone builds it.

Commit order is outside-in rather than bottom-up: the toggle control is built and placed in the
screen first — interactive via its own local state, but not yet changing what the list renders —
so it's checkable by running the app from the very first commit, not just by unit tests. The next
commit lifts that state into `useDocuments` and wires it to a placeholder grid state, and only
after that is the real grid card content built to replace the placeholder. Each step leaves the
app in a runnable, visually-checkable state.

## Commits

- [x] **1. Add the list/grid toggle control and place it in the screen**
  - `src/features/documents/ui/ViewModeToggle.tsx` (new) — `ViewModeToggleProps { selected: 'list' | 'grid'; onChange: (viewMode: 'list' | 'grid') => void }`.
    Modeled on `SortMenu`'s existing `Pressable` + `Feather` + themed-pill pattern, but no `Modal`
    — it's a static two-segment switch, always visible. A small private (unexported) `Segment`
    helper renders each of the two `Pressable`s (`testID="view-mode-button-list"` /
    `"view-mode-button-grid"`, `accessibilityRole="button"`, `accessibilityState={{ selected }}`,
    `Feather name={mode}` since Feather's icon names are literally `"list"`/`"grid"`) to avoid
    repeating that block twice inline — justified since both call sites exist in this one file
    today, not speculative. Active segment: `colors.accent` icon on a `colors.surface` highlight;
    inactive: `colors.textSecondary` icon, no highlight, matching the mockup's pill. No new theme
    tokens needed. `selected` as a named union, not a boolean, so it doesn't trip the
    no-boolean-parameters rule.
  - `src/features/documents/ui/ViewModeToggle.test.tsx` (new) — isolated like `SortMenu.test.tsx`
    (no provider needed). Asserts both segment testIDs render; pressing each calls `onChange` with
    the right value; the segment matching `selected` has `accessibilityState.selected === true`.
  - `src/features/documents/ui/DocumentsScreen.tsx` — `toolbar` style gains
    `justifyContent: 'space-between', alignItems: 'center'`; `ViewModeToggle` renders as a sibling
    of `SortMenu` inside it, driven by a local `useState<ViewMode>('list')` in `DocumentsBody` (not
    `useDocuments` yet — a short comment notes this is temporary). The toggle is interactive (its
    active segment flips on press) but doesn't yet change what `DocumentList` renders — that's
    deliberate, so the component is checkable by running the app from this first commit, before
    its state has anywhere real to plug into.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — two new tests: the toggle renders with
    list selected by default; pressing the grid segment selects it (both via `accessibilityState`,
    not list content, since content doesn't change yet).

- [ ] **2. Lift view mode state into `useDocuments` and wire a grid placeholder**
  - `src/features/documents/state/useDocuments.ts` — add `export type ViewMode = 'list' | 'grid'`
    and `const DEFAULT_VIEW_MODE: ViewMode = 'list'`. `ViewMode` lives here, not in `domain/`,
    because it's a UI presentation concern (unlike `SortKey`, which affects ordering the domain
    layer could care about). Add `const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)`,
    a sibling to the existing `sortBy` state (same reasoning: independent of the fetch
    `useReducer` so it survives `retry()`). Add `viewMode`/`setViewMode` to `UseDocumentsResult`
    and the hook's return value.
  - `src/features/documents/state/useDocuments.test.tsx` — three new tests mirroring the existing
    `sortBy` trio: defaults to `'list'`, `setViewMode` updates it, and it survives a
    failed-then-retried fetch.
  - `src/features/documents/ui/DocumentsScreen.tsx` — replace `DocumentsBody`'s local `viewMode`
    `useState` with `viewMode`/`setViewMode` from `useDocuments()`, removing the temporary comment.
    `DocumentsBody` branches on `viewMode`: `'list'` renders the existing `DocumentList`/`FlatList`
    unchanged; `'grid'` renders a small local `GridPlaceholder` (`testID="documents-grid-placeholder"`,
    simple centered text, same local-function pattern as the file's existing
    `LoadingState`/`EmptyState`) standing in for the not-yet-built grid content. This is a
    deliberately temporary branch, replaced in commit 3 once `DocumentGridCard` exists.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — extend the two toggle tests from commit
    1 (or add new ones) to also assert content: pressing `view-mode-button-grid` shows
    `documents-grid-placeholder` and hides the list content; pressing `view-mode-button-list` after
    that reverts to the list. This is the "component test for toggling" the milestone asked for —
    it passes before the real grid card exists, and keeps passing with updated assertions after
    commit 3 swaps the placeholder for real content.

- [ ] **3. Build the real grid view**
  - `src/features/documents/ui/DocumentGridCard.tsx` (new) — `DocumentGridCardProps { document: Document }`.
    Root `View` with `testID={\`document-grid-${document.id}\`}`, rendering only the title
    (`numberOfLines={1}`, bold) and `Version {document.version}` (gray, smaller), stacked — no
    Contributors/Attachments. A separate sibling component rather than a `compact`/`variant` prop
    on `DocumentCard`: the two cards share almost no markup once Contributors/Attachments are
    dropped, `DocumentCard` itself must stay untouched, and a boolean/variant prop that silently
    switches rendered content is exactly what the no-boolean-parameters rule forbids. Only two call
    sites will ever exist, below the rule-of-three threshold for extracting a shared base. Styling
    reuses existing theme tokens only — no new tokens needed.
  - `src/features/documents/ui/DocumentGridCard.test.tsx` (new) — same `buildDocument` helper
    pattern as `DocumentCard.test.tsx`. Asserts the testID, title, and version render; asserts
    `queryByText('Contributors')`/`queryByText('Attachments')` are absent.
  - `src/features/documents/ui/DocumentsScreen.tsx` — remove `GridPlaceholder`; per the milestone's
    "share one FlatList," `DocumentList` becomes a single `<FlatList>` whose props switch on
    `viewMode` (`numColumns`, `columnWrapperStyle`, `contentContainerStyle`, and `renderItem`
    choosing `DocumentGridCard` vs `DocumentCard`) rather than two near-duplicate lists or a
    separate placeholder branch. `key={viewMode}` is added to the `FlatList` — React Native
    requires a remount when `numColumns` changes at runtime, and switching the `key` forces that
    remount cheaply (no refetch, `fetchAttempt` untouched). New styles `gridRow: { gap: spacing.md }`
    (via `columnWrapperStyle`) and `gridContent: { padding: spacing.lg, gap: spacing.md }` (via
    `contentContainerStyle`) use RN's `gap` support (present since RN 0.71, well within Expo SDK
    57's RN version) instead of hand-rolled margins. `testID="documents-list"` is unchanged.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — update the two toggle tests from commit
    2 to assert `document-grid-doc-1` (and real title/version content) instead of the placeholder
    testID.

## Verification

- After each commit: `npm run lint`, `npm run typecheck`, `npm test` — all must pass before
  committing.
- After commit 1: run the app and confirm the toggle appears in the toolbar (sort left, toggle
  right) and its active segment flips on press, even though the list itself doesn't change yet.
- After commit 2: run the app and confirm pressing the toggle flips between the real list and the
  placeholder, proving the wiring before the grid card exists.
- After commit 3: run the app against the challenge server and compare the toggle's position
  (sort left / toggle right), the 2-column grid spacing, and the grid card's title+version-only
  content against `mockups/mdc_1.png` and `mockups/mdc_2.png`.
