# Safe area wrapper + "Documents" header

## Context

The documents screen rendered with no safe-area handling (content could sit under the status
bar/notch/home indicator) and no visible screen title. The mockup (`mockups/mdc_1.png`,
`mdc_2.png`) shows a "Documents" title top-left and a white header band with generous top
padding — neither was ever built; `docs/plans/02-documents-list-card.md` deferred the
notification bell and list/grid toggle by name but never mentioned the title or safe-area at
all, so this was unaddressed prior work, not a previously tracked gap.

Scope: only the safe-area wrapper and the "Documents" title text — not the notification bell
(notifications has no UI yet) and not the list/grid toggle (already deferred separately in
`02-documents-list-card.md`). Two independent concerns, two commits.

Dependency decision, per CLAUDE.md's "ask before adding any dependency": `react-native-safe-area-context`,
added via `npx expo install`. React Native core's own `SafeAreaView` is iOS-only (a no-op on
Android) and effectively deprecated in favor of this library; since the app targets Android too
(per CLAUDE.md's 10.0.2.2 note), core `SafeAreaView` wouldn't actually fix the Android case. The
library is bundled in Expo Go for SDK 57 — no dev build required.

## Commits

- [x] **1. Safe-area wrapper**
  - `npx expo install react-native-safe-area-context`. README decision-record entry: why this
    library over core `SafeAreaView` (Android support, the de facto standard, Expo Go-bundled).
  - New `jest.setup.ts` at the repo root:
    `jest.mock('react-native-safe-area-context', () => { const mock =
    require('react-native-safe-area-context/jest/mock'); return mock.default ?? mock; })`,
    wired via `package.json`'s `"jest": { "setupFiles": ["<rootDir>/jest.setup.ts"] }`. The
    library's own docs suggest pointing `setupFiles` straight at its `jest/mock` file, but that
    file is a `.tsx` ES module compiled by Babel to `{ __esModule, default }` — pointing
    `setupFiles` at it directly only runs it for side effects without substituting the module,
    and handing its raw `require()` result to `jest.mock` leaves `SafeAreaView` undefined since
    the real mock is nested under `.default`. The explicit `jest.mock` + `.default` unwrap above
    is what actually makes `SafeAreaView`/`useSafeAreaInsets` resolve to the mock in tests —
    caught by the pre-existing `src/app/App.test.tsx`, which renders the full `<App />`.
  - `src/app/App.tsx` — wrap the existing tree in `<SafeAreaProvider>` at the root, once. Pure
    root-config change, supplies real inset measurements at runtime.
  - `src/features/documents/ui/DocumentsScreen.tsx` — replaced the sequence of early returns
    (`ErrorState` / `LoadingState` / `EmptyState` / the success `View`) with a `DocumentsBody`
    helper rendering whichever branch applies, wrapped once in a shared outer `SafeAreaView`.
    Every state gets the same top-inset handling instead of duplicating it per branch; each
    branch kept its existing testID/content, so this was a structural refactor, not a behavior
    change — `DocumentsScreen.test.tsx`'s existing assertions passed unmodified.

- [] **2. "Documents" header**
  - `src/shared/ui/theme.ts` — added `fontSize.lg: 28` (the scale was only `sm: 13, md: 17`; the
    mockup's title is visually much larger/bolder than either).
  - `src/features/documents/ui/DocumentsScreen.tsx` — added a local `Header` function (same
    pattern as the existing local `LoadingState`/`ErrorState`/`EmptyState` — not its own file, a
    single `Text` in a `View`). Renders "Documents" in `fontSize.lg`, bold, `colors.textPrimary`,
    on a white (`colors.surface`) background with padding. Rendered once, inside the
    `SafeAreaView` from commit 1, above whichever state branch is active, so the title stays
    visible during loading/error/empty too, not just once documents have loaded.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — added a test confirming the
    "Documents" title renders during the loading state, proving it's hoisted above the status
    branching rather than tied to the success case.

## Verification

- After each commit: `npm test`, `npm run lint`, `npm run typecheck` — all passed.
- Still to do: run the app (`npm run ios` / `npm run android`) against the challenge server and
  compare the header + safe-area clearance against `mockups/mdc_1.png` on both a notched
  device/simulator and Android.
