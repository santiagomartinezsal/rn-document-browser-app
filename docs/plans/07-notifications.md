# Notifications feature

## Context

The documents vertical slice is in place (fetch, merge with local, list/grid,
create-document modal). This milestone adds the second feature: real-time
notifications over the challenge server's `ws://.../notifications` socket,
surfaced as a bell with an unread badge and a panel listing them. Uses
`partysocket` for the reconnecting transport (see README decision record —
originally hand-written, swapped out in commit 4 below) and the usual
`api/domain/state/ui` split.

Each commit below is one unit — stop after each so the user can confirm
before moving on.

Verified repo state: working tree is clean on `main`
(`485e604 feat(documents): merge local documents into the repository's
getAll`). `src/features/notifications/` has only its fixture JSON
(`api/notifications-messages.fixture.json`: `Timestamp`, `UserID`,
`UserName`, `DocumentID`, `DocumentTitle`); no code yet. No `AppState` usage
anywhere (`grep -rn "AppState" src/` is empty) — this milestone introduces
it, from `react-native` core, no new dependency. `src/shared/ui/` has no
existing Badge/IconButton primitive; `NotificationBell` will be
feature-local, modeled after `AddDocumentButton.tsx`'s icon+`Pressable`
style (`Feather` from `@expo/vector-icons`, already a dependency).

## Commits

- [x] **1. `feat(shared): add reconnecting WebSocket with exponential backoff`**
  (superseded by commit 4 below — kept here as a historical record of what
  originally shipped)
  - `src/shared/ws/reconnectingWebSocket.ts` — `createReconnectingWebSocket({
    url, onMessage, createWebSocket?, initialDelayMs?, maxDelayMs? }):
    { start(); stop() }`. Modeled as an explicit state machine, a private
    `type ConnectionState = 'idle' | 'connecting' | 'open' |
    'waitingToRetry'`: `start()` is a no-op unless `idle`; a successful
    `onopen` moves to `open` and resets the retry-attempt counter; any
    `onclose`/`onerror` while not `idle`/`waitingToRetry` schedules a retry
    (`waitingToRetry`) with `delay = min(initialDelayMs *
    2 ** retryAttempt, maxDelayMs)`; `stop()` forces `idle`, clears any
    pending retry timer, and closes the active socket. Exports
    `WebSocketLike` (the minimal `onopen`/`onclose`/`onerror`/`onmessage`/
    `close()` shape) and `WebSocketFactory = (url: string) =>
    WebSocketLike`, defaulting to the platform `WebSocket` — this seam is
    what lets the test inject a fake socket instead of opening a real
    connection.
  - `src/shared/ws/reconnectingWebSocket.test.ts` — a hand-rolled fake
    `WebSocketFactory` that records each created socket (so tests can
    reach in and fire `onopen`/`onclose`/`onmessage` manually) plus
    `jest.useFakeTimers()` to drive the backoff without real waits. Cases:
    connects to the given url on `start()`; forwards `onmessage` data to
    `onMessage`; retries after `initialDelayMs` on close; escalates the
    delay on repeated failures, capped at `maxDelayMs`; resets the delay
    to `initialDelayMs` after a successful reconnect; `stop()` cancels a
    pending retry and closes the active socket; a stale `onclose` arriving
    after `stop()` is ignored; `stop()` then `start()` reconnects from
    scratch.

- [x] **2. `feat(notifications): add notification parser`**
  - `src/features/notifications/domain/notification.ts` — `Notification {
    userName: string; documentTitle: string; documentId: string; timestamp:
    string }`. Plain TS, no React/WS import, matching the `domain/` rule.
  - `src/features/notifications/api/notificationDto.ts` — `NotificationDto
    { Timestamp, UserID, UserName, DocumentID, DocumentTitle }` (all
    `string`), matching the fixture's PascalCase wire shape.
  - `src/features/notifications/api/notificationParser.ts` — private
    `isNotificationDto(value: unknown): value is NotificationDto` type
    guard; `InvalidNotificationError`; `parseNotification(raw: string):
    Notification` — `JSON.parse`s the raw WS message (one notification per
    message, not an array), throws `InvalidNotificationError` on bad JSON
    or a missing/mistyped field, otherwise maps to the domain shape
    (`userName`, `documentTitle`, `documentId`, `timestamp`). Throws rather
    than swallowing, since a *single* malformed message has nothing to
    "skip past" the way `mapDocuments` skips one bad array element — the
    caller (commit 3's socket source) decides whether to drop it and keep
    the stream running.
  - `src/features/notifications/api/notificationParser.test.ts` — maps
    every message in the fixture without throwing; maps one message's
    fields correctly; throws `InvalidNotificationError` on invalid JSON;
    throws on a missing required field; throws when a field has the wrong
    type.

- [x] **3. `feat(notifications): add notifications reducer and context`**
  - `src/shared/http/serverConfig.ts` — add `getWsBaseUrl(): string`
    returning `` `ws://${getServerHost()}:${CHALLENGE_SERVER_PORT}` ``,
    next to the existing `getHttpBaseUrl()`. Extend
    `serverConfig.test.ts`'s existing table test with the ws case.
  - `src/features/notifications/domain/notificationsSource.ts` —
    `NotificationsSource { subscribe(onNotification: (n: Notification) =>
    void): void; start(): void; stop(): void }`. Plain TS, no React/WS
    import.
  - `src/features/notifications/api/notificationsSocketSource.ts` —
    `createNotificationsSocketSource(url: string): NotificationsSource`,
    built on commit 1's `createReconnectingWebSocket` + commit 2's
    `parseNotification` (commit 1's primitive was later replaced by
    `partysocket` in commit 4 — the public shape of this file is
    unaffected). On an unparseable message: catch
    `InvalidNotificationError`, `console.warn` with the raw payload, and
    drop that message — the stream keeps running, mirroring
    `mapDocuments`' skip-and-warn precedent for the same situation.
  - `src/features/notifications/api/notificationsSocketSource.test.ts` —
    reuses commit 1's fake-`WebSocket`-factory pattern: a subscribed
    callback receives a parsed `Notification` on a valid message; a
    malformed message is dropped (callback not called) and
    `console.warn` is called, without breaking later valid messages;
    `start()`/`stop()` delegate to the underlying reconnecting socket.
    (Commit 4 simplifies this test, since backoff timing is no longer
    this project's own code to verify.)
  - `src/features/notifications/state/notificationsReducer.ts` —
    `NotificationsState { items: Notification[]; unreadCount: number }`,
    initial `{ items: [], unreadCount: 0 }`. `NotificationsAction`:
    `NOTIFICATION_RECEIVED` (prepends to `items`, increments `unreadCount`)
    | `NOTIFICATIONS_READ` (resets `unreadCount` to 0, `items` untouched).
    Exhaustive `switch`, no `default`.
  - `src/features/notifications/state/NotificationsSourceContext.tsx` —
    `NotificationsProvider({ source, children })` /
    `useNotificationsSource()`, same DI-via-prop shape as
    `DocumentsRepositoryContext.tsx` (throws if used outside the provider).
  - `src/features/notifications/state/useNotifications.ts` —
    `useReducer(notificationsReducer, initialNotificationsState)`; on
    mount, `source.subscribe(n => dispatch({ type: 'NOTIFICATION_RECEIVED',
    notification: n }))` then `source.start()`; cleanup calls
    `source.stop()`. Returns `{ items, unreadCount, markAllRead }` where
    `markAllRead` dispatches `NOTIFICATIONS_READ`.
  - Tests: `notificationsReducer.test.ts` (pure, one case per transition,
    same style as `documentsReducer.test.ts`); `useNotifications.test.tsx`
    (`renderHook` + a fake `NotificationsSource` via the provider —
    receiving a notification increments `unreadCount` and prepends to
    `items`; `markAllRead` resets `unreadCount` to 0 but keeps `items`;
    unmounting calls `source.stop()`).
  - `src/features/notifications/index.ts` — exports `NotificationsProvider`,
    the `Notification` type, and `createNotificationsSource(): NotificationsSource`
    (binds `getWsBaseUrl()` to `createNotificationsSocketSource`).

- [x] **4. `refactor(notifications): replace hand-written WebSocket with partysocket`**
  - Reviewing commit 1's `reconnectingWebSocket.ts`, decided a maintained
    library is a better fit than carrying a hand-rolled reconnect/backoff
    implementation (and its own ~200-line test suite) going forward — see
    the full trade-off recorded in the README decision record.
  - `npx expo install partysocket` (pure JS, no native module — no Expo Go
    impact). Delete `src/shared/ws/` entirely (both files).
  - `src/features/notifications/api/notificationsSocketSource.ts` —
    rewritten on top of `partysocket`'s `WebSocket` class instead of the
    deleted primitive: constructed with `{ startClosed: true }` so nothing
    connects until `start()` calls `.reconnect()`; `stop()` calls
    `.close()`. Takes an optional `createPartySocket` factory (defaulting
    to the real `partysocket` constructor) purely for test injection — the
    `NotificationsSource` interface and the rest of the feature are
    unaffected.
  - `src/features/notifications/api/notificationsSocketSource.test.ts` —
    simplified: no more fake timers or backoff-schedule assertions (that's
    `partysocket`'s own tested responsibility now), just this module's own
    integration — parses a valid message, drops and warns on a malformed
    one without breaking later messages, delegates `start`/`stop` to
    `reconnect`/`close`.
  - `README.md` — added the decision record entry for `partysocket` over
    a hand-written implementation (plus `socket.io-client`, which turned
    out to be protocol-incompatible with the challenge server's plain
    `ws://` endpoint, and other alternatives). `CLAUDE.md`'s architecture
    line updated to match.

- [x] **5. `feat(notifications): add bell with unread badge`**
  - `src/features/notifications/ui/NotificationBell.tsx` — presentational,
    `{ unreadCount, onPress }` props (no context coupling, so it's testable
    standalone): `Feather name="bell"` + a small badge `View`/`Text`
    showing `unreadCount`, rendered only when `unreadCount > 0`. `testID`s
    (`notification-bell`, `notification-bell-badge`), `accessibilityRole="button"`,
    same conventions as `AddDocumentButton.tsx`.
  - `src/features/notifications/ui/NotificationBell.test.tsx` — badge
    hidden at `unreadCount={0}`; badge shows the count when `>0`; `onPress`
    fires on press.

- [x] **6. `feat(notifications): add notifications panel`**
  - `src/features/notifications/ui/NotificationsPanel.tsx` — RN `Modal`
    (same bottom-sheet shape as `AddDocumentModal.tsx`: `transparent`,
    `animationType="slide"`, `onRequestClose={onClose}`), listing `items`
    (`documentTitle`, `userName`, formatted `timestamp`) newest-first, an
    empty state message when `items` is empty, `testID`s per row and on the
    close control.
  - `src/features/notifications/ui/NotificationsPanel.test.tsx` — renders
    one row per item; shows the empty-state message when `items` is empty;
    calls `onClose`.
  - Wire into `src/features/documents/ui/DocumentsScreen.tsx`'s `Header`:
    call `useNotifications()`, add local `isPanelOpen` state, render
    `NotificationBell` (`onPress` opens the panel) and `NotificationsPanel`
    as siblings; opening the panel calls `markAllRead()`. Update
    `DocumentsScreen.test.tsx` to wrap with `NotificationsProvider` (fake
    source) and cover: pressing the bell opens the panel; opening it clears
    the badge.
  - `src/app/App.tsx` — module-scope `const notificationsSource =
    createNotificationsSource()`, wrap the tree in
    `<NotificationsProvider source={notificationsSource}>`. Update
    `App.test.tsx` only if the existing mock setup needs a fake source to
    avoid opening a real socket in tests.

- [ ] **7. `feat(notifications): pause socket when the app goes to background`**
  - In `useNotifications.ts`, add an `AppState.addEventListener('change',
    ...)` subscription (from `react-native` core — first use in this repo,
    no new dependency): on leaving `'active'`, call `source.stop()`; on
    returning to `'active'`, call `source.start()`. Remove the listener
    (`.remove()`) in the same cleanup as the existing `source.stop()` call.
  - `useNotifications.test.tsx` — add cases mocking `AppState` (partial
    `jest.mock('react-native', ...)` keeping the rest of the module real):
    backgrounding calls `source.stop()`; foregrounding again calls
    `source.start()`; unmounting removes the listener.

## Verification

- After each commit: `npm run lint`, `npm run typecheck`, `npm test`.
- After commit 6, run the app (`npx expo start`) and confirm visually: the
  bell badge increments as the challenge server's WS emits messages, the
  panel opens on tap and lists them, and the badge clears on open.
- After commit 7, background and foreground the app (or simulate via the
  AppState mock in tests) and confirm no duplicate sockets open on resume.
