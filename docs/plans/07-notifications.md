# Notifications feature

## Context

The documents vertical slice is in place (fetch, merge with local, list/grid,
create-document modal). This milestone adds the second feature: real-time
notifications over the challenge server's `ws://.../notifications` socket,
surfaced as a bell with an unread badge and a panel listing them. CLAUDE.md
calls for a hand-written reconnecting WebSocket (state machine, exponential
backoff) rather than a library, and the usual `api/domain/state/ui` split.

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

- [ ] **3. `feat(notifications): add notifications reducer and context`**
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
    `parseNotification`. On an unparseable message: catch
    `InvalidNotificationError`, `console.warn` with the raw payload, and
    drop that message — the stream keeps running, mirroring
    `mapDocuments`' skip-and-warn precedent for the same situation.
  - `src/features/notifications/api/notificationsSocketSource.test.ts` —
    reuses commit 1's fake-`WebSocket`-factory pattern: a subscribed
    callback receives a parsed `Notification` on a valid message; a
    malformed message is dropped (callback not called) and
    `console.warn` is called, without breaking later valid messages;
    `start()`/`stop()` delegate to the underlying reconnecting socket.
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

- [ ] **4. `feat(notifications): add bell with unread badge`**
  - `src/features/notifications/ui/NotificationBell.tsx` — presentational,
    `{ unreadCount, onPress }` props (no context coupling, so it's testable
    standalone): `Feather name="bell"` + a small badge `View`/`Text`
    showing `unreadCount`, rendered only when `unreadCount > 0`. `testID`s
    (`notification-bell`, `notification-bell-badge`), `accessibilityRole="button"`,
    same conventions as `AddDocumentButton.tsx`.
  - `src/features/notifications/ui/NotificationBell.test.tsx` — badge
    hidden at `unreadCount={0}`; badge shows the count when `>0`; `onPress`
    fires on press.

- [ ] **5. `feat(notifications): add notifications panel`**
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

- [ ] **6. `feat(notifications): pause socket when the app goes to background`**
  - In `useNotifications.ts`, add an `AppState.addEventListener('change',
    ...)` subscription (from `react-native` core — first use in this repo,
    no new dependency): on leaving `'active'`, call `source.stop()`; on
    returning to `'active'`, call `source.start()`. Remove the listener
    (`.remove()`) in the same cleanup as the existing `source.stop()` call.
  - `useNotifications.test.tsx` — add cases mocking `AppState` (partial
    `jest.mock('react-native', ...)` keeping the rest of the module real):
    backgrounding calls `source.stop()`; foregrounding again calls
    `source.start()`; unmounting removes the listener.

- [ ] **7. `docs: record hand-written WebSocket decision`**
  - `README.md` — add a "Decision record" entry for the hand-written
    reconnecting WebSocket (state machine + exponential backoff) vs. a
    library (`react-native-reconnecting-websocket`, `partysocket`,
    `socket.io-client`), same shape as the existing `fetchJson` entry: why
    (CLAUDE.md requires hand-written; the actual need — one socket URL, no
    multiplexing/rooms/ack semantics — stays small and is fully exercised
    by the fake-timer test) + an "Alternatives considered" sub-list.

## Verification

- After each commit: `npm run lint`, `npm run typecheck`, `npm test`.
- After commit 5, run the app (`npx expo start`) and confirm visually: the
  bell badge increments as the challenge server's WS emits messages, the
  panel opens on tap and lists them, and the badge clears on open.
- After commit 6, background and foreground the app (or simulate via the
  AppState mock in tests) and confirm no duplicate sockets open on resume.
