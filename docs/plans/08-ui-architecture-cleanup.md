# UI architecture cleanup

## Context

A full-repo review (feature-folder structure, Context usage, UI composition)
found the `domain/api/state/ui` split sound — no changes needed there. Three
concrete issues surfaced that are worth fixing before submission, since a
reviewer explicitly assesses "structure that tolerates requirement changes":

1. `AddDocumentModal` and `NotificationsPanel` duplicate an entire
   bottom-sheet shell (overlay, sheet, header row, close button)
   almost byte-for-byte.
2. `Feather` from `@expo/vector-icons` is imported directly in 7 files, and
   `ViewModeToggle` relies on `ViewMode` values (`'list'`, `'grid'`) also
   being valid Feather glyph names — an implicit coupling that breaks
   silently if `ViewMode` ever gains a value.
3. `DocumentsScreen.tsx` (in the **documents** feature) owns the app header,
   which calls `useNotifications()` and renders `NotificationBell` /
   `NotificationsPanel` from the **notifications** feature — backwards from
   "features don't import each other's internals." `app/` is the
   composition root and should own this instead. Confirmed by
   `DocumentsScreen.test.tsx`: it already has to wrap `<DocumentsScreen />`
   in a `NotificationsProvider` purely to test the header's bell/panel
   behavior — evidence the header doesn't belong there.

Each commit below is one unit — stop after each so the user can confirm
before moving on. Order: structural (header) → duplication (modal) → polish
(icons), since commit 1 also simplifies `DocumentsScreen.tsx` down to one
component, which commit 2 builds on top of.

Verified repo state: working tree clean on `main`
(`4cb7d30 feat(notifications): pause socket when the app goes to background`).

## Commits

- [x] **1. `refactor(app): move the header out of the documents feature`**
  - `src/app/AppHeader.tsx` (new) — `AppHeader({ title }: { title: string })`,
    moved verbatim from the current `Header` function in
    `src/features/documents/ui/DocumentsScreen.tsx`: calls `useNotifications()`,
    renders the title `Text`, `NotificationBell`, and `NotificationsPanel`.
  - `src/app/App.tsx` — import `SafeAreaView` from
    `react-native-safe-area-context` (moved from `DocumentsScreen.tsx`); wrap
    `<AppHeader title="Documents" /><DocumentsScreen />` in it, inside the
    existing `DocumentsProvider`/`NotificationsProvider`.
  - `src/features/documents/ui/DocumentsScreen.tsx` — delete the `Header`
    function and the old `DocumentsScreen` wrapper that rendered
    `SafeAreaView`; rename the current `DocumentsBody` function to
    `DocumentsScreen` (it becomes the file's only component — no
    `SafeAreaView`, no `@/features/notifications` import). Drop the
    `safeArea`/`header`/`headerTitle` entries from `StyleSheet.create`.
  - `src/features/documents/ui/DocumentsScreen.test.tsx` — drop the
    `NotificationsProvider` wrapping, the `Notification`/`NotificationsSource`
    imports and `sampleNotification`/`buildNotificationsSource` fixtures, and
    the `notificationsSource` param on `renderScreen`; remove the three
    tests that belong to the header (`'shows the "Documents" header while
    still loading'`, `'opens the notifications panel when the bell is
    pressed'`, `'clears the unread badge when the panel is opened'`).
  - `src/app/AppHeader.test.tsx` (new) — same three cases, generic: renders
    the given `title`; pressing the bell shows the panel's close button;
    receiving a notification (via a fake `NotificationsSource`) shows the
    unread badge, and opening the panel clears it.
  - `src/app/App.test.tsx` — add `expect(await screen.findByText('Documents')).toBeOnTheScreen()`
    so the `App` → `AppHeader` `title="Documents"` wiring stays covered.

- [x] **2. `refactor(shared): extract a shared bottom-sheet modal`**
  - `src/shared/ui/BottomSheetModal.tsx` (new) —
    `BottomSheetModal({ visible, title, onClose, children, testID })`:
    the `Modal`(`transparent`, `animationType="slide"`,
    `onRequestClose={onClose}`) + overlay + sheet + header row (title +
    `Feather name="x"` close `Pressable`) currently duplicated in
    `AddDocumentModal` and `NotificationsPanel`. Takes a `closeButtonTestID`
    prop so each caller keeps its existing `testID`
    (`add-document-close-button`, `notifications-panel-close-button`).
  - `src/shared/ui/BottomSheetModal.test.tsx` (new) — not rendered when
    `visible={false}`; renders `title` and `children` when `visible={true}`;
    pressing the close button calls `onClose`.
  - `src/features/documents/ui/AddDocumentModal.tsx` — render its fields
    (`Field`s, choose-file `Pressable`, submit `Pressable`) as `children` of
    `BottomSheetModal`; delete the duplicated `overlay`/`sheet`/`header`/
    `headerTitle` styles and the manual close `Pressable`.
  - `src/features/notifications/ui/NotificationsPanel.tsx` — same change:
    the `FlatList`/empty-state becomes `BottomSheetModal`'s `children`.
  - `AddDocumentModal.test.tsx` / `NotificationsPanel.test.tsx` — no changes
    expected since `testID`s are preserved; run both to confirm.
  - `SortMenu.tsx` stays as-is — its centered popover is a different shape,
    not a bottom sheet.

- [x] **3. `refactor(shared): add an Icon wrapper over the icon library`**
  - `src/shared/ui/Icon.tsx` (new) — `export type IconName =
    ComponentProps<typeof Feather>['name']`; `Icon({ name, size, color }:
    { name: IconName; size: number; color: string })` rendering `<Feather
    name={name} size={size} color={color} />`.
  - `src/shared/ui/Icon.test.tsx` (new) — renders a `Feather` icon with the
    given `name`/`size`/`color` (smoke test; no branching logic to cover).
  - Replace the direct `import { Feather } from '@expo/vector-icons'` +
    `<Feather .../>` usage with `Icon` in: `AddDocumentButton.tsx`,
    `AddDocumentModal.tsx`, `DocumentCard.tsx`, `SortMenu.tsx`,
    `ViewModeToggle.tsx`, `NotificationBell.tsx`, and
    `BottomSheetModal.tsx` (added in commit 2).
  - `ViewModeToggle.tsx` — add
    `const VIEW_MODE_ICON: Record<ViewMode, IconName> = { list: 'list', grid: 'grid' }`
    and pass `VIEW_MODE_ICON[mode]` as `Icon`'s `name`, instead of passing
    `mode` straight in — removes the implicit assumption that `ViewMode`
    values are always valid Feather glyph names.
  - No test changes expected beyond the new `Icon.test.tsx` — existing
    snapshots/assertions key off `testID`/text, not the icon library.

## Verification

- After each commit: `npm run lint`, `npm run typecheck`, `npm test`.
- After commit 1: confirm `App.test.tsx` + `AppHeader.test.tsx` together
  cover everything the removed `DocumentsScreen.test.tsx` cases covered —
  no net loss of coverage.
- After commit 2: run the app (`npx expo start`), open the add-document
  modal and the notifications panel, confirm both still look and behave
  identically (slide-up sheet, close button, overlay tap does not need to
  dismiss — matches current behavior).
