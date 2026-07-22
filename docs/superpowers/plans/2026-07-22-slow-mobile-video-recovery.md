# Hawaii Slow Mobile Video Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the real homepage video mounted and recoverable when initial MP4 metadata is slow on iPhone.

**Architecture:** Extend the existing WebKit production gate with one slow-network scenario that withholds the mobile MP4 beyond the old watchdog, interacts before metadata, then verifies continuous decoded playback after release. Remove only the fixed initial metadata fallback; preserve real media errors, reduced-motion stills and seek/buffering recovery.

**Tech Stack:** Next.js 16, React 19, TypeScript, native HTML video, Node.js assertions, Playwright WebKit.

---

### Task 1: Reproduce initial metadata latency

**Files:**
- Create: `tests/webkit-slow-mobile-video.js`
- Modify: `tests/run-web-production.js`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Add a WebKit iPhone regression test**

Create a browser test with one explicit media release promise. The first intercepted MP4 request signals that the gate is closed; every MP4 range request waits on the same promise, and all later requests continue immediately after it resolves. Patch `HTMLMediaElement.prototype.play` before page code runs to count calls while preserving native behavior. After both the first interception and mounted stage are observed, dispatch `touchstart`, scroll the journey to four percent and dispatch `touchend`. Keep the gate closed for 4.2 seconds after the mounted stage, then assert:

```js
assert.equal(state.mediaMode, "video");
assert.equal(state.videoCount, 1);
assert.ok(state.scrollProgress > 0);
assert.ok(state.targetTime > 0);
assert.ok(state.poster.endsWith(".jpg") || state.poster.endsWith(".webp"));
assert.ok(state.playAttempts > 0);
```

Prove the poster paints while the gate is closed by temporarily rendering an `<img>` with the same poster URL, dimensions and `object-fit`, then requiring its locator screenshot hash to equal the mounted video screenshot hash. After the route continues, wait for finite media duration and collect 10 `currentTime` samples at 120 ms intervals without another scroll operation. Capture post-release video screenshots with the first and last samples. Require at least 0.3 seconds of total advancement, every delta between -0.05 and 0.35 seconds, and different SHA-256 hashes for the two advancing decoded frames.

The entire slow-media page runs inside `try/finally`; `releaseMedia()` is called in `finally` before page/context cleanup so the intentional RED assertion cannot leave intercepted range requests hanging.

Open a second page with MP4 requests aborted. Wait until both `data-media-mode="fallback"` and `data-fallback-reason="media-error"` are present, then require:

```js
assert.equal(errorState.mediaMode, "fallback");
assert.equal(errorState.fallbackReason, "media-error");
```

- [ ] **Step 2: Add a failing runner-wiring assertion**

Add a static assertion proving `tests/run-web-production.js` includes `tests/webkit-slow-mobile-video.js`.

Run:

```bash
npm run test:web:static
```

Expected: FAIL because the production runner does not include the new script.

- [ ] **Step 3: Wire the test into the exact-artifact runner**

Run `tests/webkit-slow-mobile-video.js` after the strict iPhone test in `tests/run-web-production.js`, then rerun `npm run test:web:static` and expect PASS.

- [ ] **Step 4: Build a reproducible baseline Pages artifact and verify RED**

Create a temporary static export without deleting API routes from the working tree:

```bash
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hawaii-slow-red.XXXXXX")"
mkdir -p "$TMP_ROOT/web" "$TMP_ROOT/pages-preview/hawaii"
rsync -a --exclude node_modules --exclude .next --exclude out --exclude src/app/api web/ "$TMP_ROOT/web/"
ln -s "$PWD/web/node_modules" "$TMP_ROOT/web/node_modules"
(cd "$TMP_ROOT/web" && STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/hawaii NODE_OPTIONS=--max-old-space-size=2048 npm run build -- --webpack)
find "$TMP_ROOT/web/out" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.txt' \) -print0 | xargs -0 sed -i '' -e 's|"/media/|"/hawaii/media/|g' -e "s|'/media/|'/hawaii/media/|g" -e 's|(/media/|(/hawaii/media/|g'
rsync -a "$TMP_ROOT/web/out/" "$TMP_ROOT/pages-preview/hawaii/"
PAGES_BASE_PATH=/hawaii node tests/run-web-production.js "$TMP_ROOT/pages-preview"
```

Expected: the new slow-network test fails because the stage enters `fallback` with `metadata-timeout` before the delayed MP4 is released.

### Task 2: Preserve video mode during initial loading

**Files:**
- Modify: `web/src/components/home/scroll-video-stage.tsx:444-455`
- Test: `tests/webkit-slow-mobile-video.js`

- [ ] **Step 1: Remove only the initial metadata watchdog**

Delete the effect that calls `activateFallback("metadata-timeout")` after 3.5 seconds. Do not change `onError`, reduced-motion handling, seek timeout, buffer retry or gesture recovery.

- [ ] **Step 2: Build and run the full exact-artifact GREEN suite**

Repeat the temporary Pages build commands from Task 1 and run `tests/run-web-production.js`. This runner intentionally executes the full booking, smoke, desktop, strict iPhone, slow-network iPhone and general WebKit suite. Confirm every check passes.

- [ ] **Step 3: Run regression checks**

Run:

```bash
npm run test:web:journey
npm run test:web:booking
npm run test:web:static
(cd web && npm run lint -- --max-warnings=0)
(cd web && npx tsc --noEmit)
(cd web && NODE_OPTIONS=--max-old-space-size=2048 npm run build)
git diff --check
```

Expected: every command passes. WebKit mobile, strict/slow iPhone, Chromium desktop, booking and smoke browser checks are already exercised by the full exact-artifact runner in Step 2 with `WEB_BASE_URL` supplied by its temporary server.

### Task 3: Release and verify

- [ ] **Step 1: Review and commit the isolated implementation diff**

Confirm no assets, content, header behavior or unrelated files changed. Commit the player and test changes separately from the design commit.

- [ ] **Step 2: Record the immutable release candidate**

Require a clean worktree, record `candidate_sha=$(git rev-parse HEAD)` and do not modify files afterward. Any regression returns to a new RED/GREEN cycle and restarts verification with a new candidate SHA.

- [ ] **Step 3: Obtain explicit deployment approval**

Report local verification and ask the user to confirm the push to the auto-deploying Pages branch. Do not push without that confirmation.

- [ ] **Step 4: Push the Pages branch and monitor deployment**

Immediately before the push require `test "$(git rev-parse HEAD)" = "$candidate_sha"`, then push the recorded SHA rather than the movable branch name:

```bash
git push origin "$candidate_sha":refs/heads/claude/codex-handoff-assets-se8fjq
```

Require the GitHub Pages workflow to complete successfully.

- [ ] **Step 5: Verify the public URL and release identity**

Run:

```bash
run_id="$(gh run list --repo Frankvillage/hawaii --branch claude/codex-handoff-assets-se8fjq --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == \"$candidate_sha\") | .databaseId" | head -1)"
test -n "$run_id"
gh run watch "$run_id" --repo Frankvillage/hawaii --exit-status
test "$(git rev-parse HEAD)" = "$candidate_sha"
remote_sha="$(git ls-remote origin refs/heads/claude/codex-handoff-assets-se8fjq | cut -f1)"
test "$remote_sha" = "$candidate_sha"
WEB_BASE_URL="https://frankvillage.github.io/hawaii/?release=${candidate_sha}-iphone" node tests/webkit-iphone-touch-playback.js
WEB_BASE_URL="https://frankvillage.github.io/hawaii/?release=${candidate_sha}-slow" node tests/webkit-slow-mobile-video.js
WEB_BASE_URL="https://frankvillage.github.io/hawaii/?release=${candidate_sha}-desktop" node tests/desktop-video-playback.js
```

Expected: the matching workflow succeeds, local and remote SHAs remain equal to `candidate_sha`, and all three public browser checks pass.
