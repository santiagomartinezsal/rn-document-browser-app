# CLAUDE.md

React Native take-home (Expo SDK 57, TypeScript): a documents screen
(list/grid), real-time notifications over WebSocket, and a create-document
form. Reviewers assess: structure that tolerates requirement changes, several
kinds of tests, reasoning in README.md, and a readable git history.

## Hard constraints

- Never write the hiring company's name anywhere: code, comments, file names,
  commit messages, URLs. Say "the challenge server".
- No database or ORM (no SQLite, Realm, WatermelonDB...). Use plain `fetch`
  and `WebSocket`.
- Ask before adding any dependency. Every dependency, and every notable
  hand-rolled alternative to one, gets a README entry: why, alternatives
  considered, trade-off.
- No navigation library: one screen plus a modal (see README decision record).
- Match the mockups; pixel-perfect is not a goal.

## Challenge server (Go, localhost:8080)

- `GET /documents` only. No POST, so creating a document is local-only.
- Returns 2–22 random documents per request, unordered, PascalCase JSON.
- `ws://.../notifications` emits a JSON message every 0–5 s
  (UserName, DocumentTitle, DocumentID, Timestamp). Not a full document.
- Android emulator reaches the host at 10.0.2.2.

## Expo: check the docs, not memory

Expo ships breaking changes every SDK release. Before touching an Expo or
React Native API, read the versioned docs for the `expo` major in
package.json (https://docs.expo.dev/versions/v<major>.0.0/) or start from
https://docs.expo.dev/llms.txt.

## Commands

```bash
npx expo install <pkg>   # always, instead of npm install: SDK-compatible versions
npx expo start
npx expo lint
npx tsc --noEmit
npx expo-doctor          # dependency/config issues
```

Run lint and typecheck before declaring a task done.

## Rules

- `ios/` and `android/` are generated (CNG). Never create, edit or commit
  them; configure native behaviour in app.json and config plugins.
- Expo Go only ships its bundled native modules. Flag it before adding a
  library with native code (it would require a development build).
- Do not commit or push. Propose a Conventional Commits message; I commit.
- One concern per change. Keep diffs small.
- New logic ships with tests, colocated as `*.test.ts(x)`.
- No speculative abstractions; build what the current step needs.

## Architecture

<!-- add once decided -->
