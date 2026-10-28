# GitHub Pages and Firebase diary implementation plan

> **For agentic workers:** Use executing-plans to implement the tasks in this session.

**Goal:** Publish the reviewed hub on GitHub Pages and connect an authenticated Firebase diary.

**Architecture:** Static hub and diary UI; Firebase Auth Google provider; Firestore per-user entry collections. Export an allowlisted source snapshot for GitHub, without Sites metadata or local diary files.

**Tech Stack:** HTML/CSS/ES modules, Firebase JS SDK, Firebase CLI, GitHub CLI and Pages Actions.

**Spec:** User request in this chat. User delegates routine decisions. Choose Firebase (first requested option), dedicated project when permitted, account-isolated storage, no automatic local diary migration.

## Global constraints

- Never copy SQLite databases, diary entries, credentials, CLI caches or Sites metadata into the public repository.
- Google sign-in only; owner UID from Firebase Auth controls the document path.
- Do not make data publicly readable. Reject malformed and oversized entries on create and update.
- No successful-save message until the server acknowledges a write.
- Do not enable billing or upload existing diary entries.

## Review focus

- Anonymous and second-account requests must fail for another user's documents.
- Logout/account switch must clear all private UI state and invalidate pending requests.
- Save timeout/retry must retain the same document ID to prevent duplicates.
- Malicious titles/content must render as text; secret-bearing app URLs must be rejected.
- GitHub Pages subdirectory paths must work; Firebase config missing must fail closed.

### Task 1: publication security and export

Files: `dist/core.mjs`, `dist/app.mjs`, `dist/index.html`, `tests/core.test.mjs`, `scripts/prepare-pages.mjs`, `.github/workflows/pages.yml`.

- [ ] Add failing URL tests, implement normalization and secret query rejection, run suite.
- [ ] Add security policy and referrer meta; export only allowlisted static assets and documentation; validate the export has no secrets or databases.
- [ ] Add Pages deployment workflow with minimal permissions, run all checks.

### Task 2: Firebase diary

Files: `dist/diary/`, `firestore.rules`, `firebase.json`, `tests/diary.test.mjs`, `tests/firestore.rules.test.mjs`.

- [ ] Preserve existing UI design as a new cloud UI without editing the local source/database.
- [ ] Test data validation and UID scoping first. Implement Auth session state, per-user CRUD, pagination, retry IDs, safe text rendering and logout clearing.
- [ ] Test security rules with anonymous/two-user contexts, invalid fields and immutable timestamps.
- [ ] Configure a dedicated Firebase project/Google provider/database after account authorization. Deploy rules before making the cloud diary usable.

### Task 3: deploy and verify

- [ ] Write security review with verified evidence and remaining limits.
- [ ] Authenticate GitHub/Firebase if needed; user completes OAuth consent.
- [ ] Publish reviewed snapshot to a dedicated repository; enable Pages.
- [ ] Verify deployment status, static paths, live sign-in and owner-only persistence when login is available.
- [ ] Report exact URLs and any account/policy blockers without claiming unperformed work.

## Execution decisions and evidence

- Firebase first requested option selected. Dedicated project; user completed Google OAuth and console activation after initial 403. No billing account connected. Database Standard free tier in Seoul.
- GitHub OAuth scopes do not include workflow. Use native branch-based Pages (`gh-pages`, `/`) instead of requiring expanded OAuth permissions. Active workflow file removed; source and static branch are separate.
- General tests 11/11, rules emulator tests 7/7, independent code review completed. Offline-delete logout finding fixed and verified.
- Public repository export excludes Sites metadata, original Git history, local diary data, credentials, debug logs and toolchain caches.
