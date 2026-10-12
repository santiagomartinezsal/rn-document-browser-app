# Sort documents

## Context

The documents screen currently renders whatever order the server returns.
The mockup (`mockups/mdc_1.png`, `mdc_2.png`) shows a "Sort by" control in the
toolbar above the list/grid; `docs/plans/02-documents-list-card.md` explicitly
deferred it as future work. This milestone builds it: a pure version
comparator and a pure document sorter in `domain/` (tests first), then wires
a `SortMenu` into the existing `useReducer` state and the screen. Each unit
below is one commit.

Design decisions:
- "Date" sorts by `updatedAt`, falling back to `createdAt` if `updatedAt` is
  missing or not a parseable date (most recently edited first, otherwise
  most recently created).
- "Version" is sorted per the original milestone instruction (`sortDocuments
  ... by date, title and version`) — the mockup doesn't show the sort menu's
  open/expanded options, so this key comes from that instruction, not the
  mockup.
- Each sort key has one fixed direction — no separate asc/desc toggle:
  - **Date** → newest first (descending `updatedAt`, falling back to `createdAt`)
  - **Title** → A→Z (ascending)
  - **Version** → highest first (descending, via `compareVersions`)
- Default sort on initial load is **Date, newest first**.

## Commits

- [ ] **1. `compareVersions` (domain, pure) + tests**
  - `src/features/documents/domain/compareVersions.ts` —
    `compareVersions(a: string, b: string): number`. Splits each version on
    `.`, parses each segment as an integer, pads the shorter one with `0`s,
    compares segment by segment; returns negative/zero/positive like a
    standard comparator. No defensive validation of malformed input —
    `Document.version` is always a dot-separated numeric string per the
    server fixture; this isn't general semver (no pre-release/build
    metadata), matching what's actually needed.
  - `src/features/documents/domain/compareVersions.test.ts` — equal
    versions; same-length comparisons (`'2.10.0' > '2.9.1'`, the
    multi-digit-segment case that rules out plain string comparison);
    differing segment counts (`'1.2' === '1.2.0'`).

- [ ] **2. `sortDocuments` (domain, pure) + tests**
  - `src/features/documents/domain/sortDocuments.ts` —
    `type SortKey = 'date' | 'title' | 'version'`,
    `DEFAULT_SORT_KEY: SortKey = 'date'`,
    `sortDocuments(documents: Document[], sortBy: SortKey): Document[]`.
    Returns a new array (doesn't mutate the input). `'date'`: descending by
    a private `effectiveDate(document)` helper returning `updatedAt` if it
    parses to a valid `Date`, else `createdAt` (not exported — one caller).
    `'title'`: ascending via `localeCompare`. `'version'`: descending via
    `compareVersions` from commit 1.
  - `src/features/documents/domain/sortDocuments.test.ts` — one case per key
    confirming order, plus the date fallback (`updatedAt`
    missing/empty/unparseable → falls back to `createdAt`); small inline
    sample arrays, matching `documentsReducer.test.ts`'s style.

- [x] **3. Track sort preference in `useDocuments`**
  - `documentsReducer.ts` is untouched — fetch status and sort preference
    are orthogonal, so sort state doesn't live there. (Originally planned
    as a `sortBy` field on the `success` variant plus a `SORT_CHANGED`
    action; reverted because `FETCH_SUCCEEDED` would then reset `sortBy` to
    the default on every refetch, silently discarding whatever the user
    had picked — e.g. after a `retry()`.)
  - `src/features/documents/state/useDocuments.ts` — add
    `const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT_KEY)`,
    independent of the fetch reducer/effect, so it survives
    loading/error/success transitions and retries. `UseDocumentsResult`
    gains `sortBy: SortKey` and `setSortBy: (sortBy: SortKey) => void`
    alongside the existing `state`/`retry`.
  - `src/features/documents/state/useDocuments.test.tsx` — add cases: it
    defaults to `DEFAULT_SORT_KEY`; `setSortBy` updates it; it survives a
    `retry()` that refetches (reject-then-resolve), proving the bug above
    doesn't recur.

- [ ] **4. `SortMenu` UI, wired into `DocumentsScreen`**
  - `src/shared/ui/theme.ts` — add `colors.primary` (accent, e.g.
    `#2563EB`) for the selected option/active state, and `colors.border`
    (e.g. `#E5E7EB`) for the pill outline — neither exists yet and both are
    needed for the mockup's "Sort by" pill.
  - `src/features/documents/ui/SortMenu.tsx` — props
    `{ selected: SortKey; onChange: (sortBy: SortKey) => void }`. Matches
    `DocumentCard.tsx`'s conventions: named `Props` interface, plain
    function component, `StyleSheet.create` with theme tokens, `Feather`
    icons (already installed, no new dependency), testIDs
    (`sort-menu-button`, `sort-menu-option-date`, etc.). A `Pressable`
    "Sort by" trigger (local `useState` for open/closed — presentational UI
    state, stays local rather than going through the reducer) opens a plain
    RN `Modal` listing the three `SortKey` options; the selected one is
    highlighted with `colors.primary`.
  - `src/features/documents/ui/DocumentsScreen.tsx` — destructure
    `sortBy`/`setSortBy` from `useDocuments()`; on the `success` branch,
    derive `sortDocuments(state.documents, sortBy)` and render `<SortMenu
    selected={sortBy} onChange={setSortBy} />` in a toolbar row above
    `DocumentList`.
  - `src/features/documents/ui/SortMenu.test.tsx` — renders the trigger,
    opening it shows all three options, tapping an option calls `onChange`
    with that key.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — update for the
    new toolbar row and to confirm the list renders in sorted order.
  - `README.md` — short decision-record entry: why sorting lives in
    `domain/` as pure functions, why direction is fixed per key instead of
    a separate toggle, and why sort state resets to the default on refetch.

## Verification

- After each commit: `npm test`, `npm run lint`, `npm run typecheck` — all
  must pass before committing.
- After commit 4: run the app against the challenge server and manually
  exercise the sort menu to confirm Date/Title/Version ordering reads
  correctly on real (randomized, 2–22 document) responses.
