# Simplified Hawaii Journey Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile 3 fps/cancel-prone journey runtime with a small real-video clip player, hide visual highlights on mobile, and gate GitHub Pages deployment on focused verification.

**Architecture:** A pure clip planner computes decoder-safe playback commands from the canonical checkpoint manifest. One React hook owns a single operation token, pending scroll intent and bounded recovery; `ScrollVideoStage` renders only confirmed scene UI and static still fallback. The old reducer/controller experiment is removed in a separate reversible commit after the replacement is green.

**Tech Stack:** Next.js 16, React 19, TypeScript, HTMLMediaElement, Node test runner, Playwright WebKit/Chromium, GitHub Actions Pages.

---

## File Structure

- Create `web/src/lib/journey-clip-plan.ts`: pure pre-roll/rate planning and constants.
- Create `tests/journey-clip-plan.test.mjs`: planner boundary tests.
- Create `web/src/lib/journey-clip-runtime.ts`: framework-free operation ownership, pending intent and recovery state.
- Create `web/src/components/home/use-journey-clip-player.ts`: one-operation media lifecycle and recovery.
- Create `tests/journey-clip-player.test.mjs`: fake media/clock tests against the pure runtime.
- Modify `web/src/components/home/scroll-video-stage.tsx`: consume the hook, confirmed scene state, still fallback and diagnostics.
- Modify `web/src/app/globals.css`: hide `.journey-marker` below `768px` while retaining desktop hotspots.
- Modify `tests/webkit-mobile-playback.js`, `tests/web-smoke.js`, `tests/web-static.js`, `package.json`: browser and source regressions.
- Delete the unused `journey-segment-controller.ts` and its tests in a dedicated commit; keep the older reducer files untouched for reversible history.
- Modify `.github/workflows/deploy-pages.yml`: blocking verification job and deploy dependency.

### Task 1: Pure clip planner

**Files:**
- Create: `web/src/lib/journey-clip-plan.ts`
- Create: `tests/journey-clip-plan.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write RED tests** for intro from zero, adjacent play, long-gap `max(0, target - 2.25)`, backward/distant pre-roll, `3.25s` threshold and playback rate clamped to `[1, 1.25]`.
- [ ] **Step 2: Run** `node --no-warnings --experimental-strip-types --test tests/journey-clip-plan.test.mjs` and confirm module-not-found RED.
- [ ] **Step 3: Implement** `planJourneyClip({ currentTime, targetTime, source, isIntro })` returning `{ seekTime: number | null, targetTime, playbackRate }`; no DOM or React dependencies.
- [ ] **Step 4: Add the planner test to `test:web:journey`** and run the focused plus complete journey suite GREEN.
- [ ] **Step 5: Commit** `Add decoder-safe journey clip planning`.

### Task 2: Single-operation clip player

**Files:**
- Create: `web/src/lib/journey-clip-runtime.ts`
- Create: `web/src/components/home/use-journey-clip-player.ts`
- Create: `tests/journey-clip-player.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write RED fake-media tests against the framework-free `journey-clip-runtime.ts`** for intro delay, one active operation token, scroll pending target, Rail cancellation, decoded checkpoint confirmation and stale callback rejection. Do not attempt to mount a React hook in the Node test runner.
- [ ] **Step 2: Add RED recovery tests** for first `play()` rejection -> `waiting-for-gesture`, second rejection -> fallback, one `waiting`/`stalled`/unexpected-pause retry, second interruption -> fallback, hidden/visible reconciliation and retained pending destination.
- [ ] **Step 3: Add RED lifecycle tests** for `pagehide`, unmount/dispose and operation replacement. Assert every timer, media listener and frame callback is cancelled when the owning operation ends.
- [ ] **Step 4: Run focused tests** and confirm intended RED failures before implementation.
- [ ] **Step 5: Implement the pure runtime first, then a thin React hook adapter** with states `idle`, `moving`, `waiting-for-gesture`, `fallback`; one `AbortController` per operation; bounded metadata/seek/play watchdogs; callbacks for confirmed/requested scene and fallback. Handle `visibilitychange`, `pagehide` and unmount disposal explicitly.
- [ ] **Step 6: Ensure fallback never requests timeline JPEGs** and reduced motion confirms selected still atomically.
- [ ] **Step 7: Run focused and complete journey tests GREEN.**
- [ ] **Step 8: Commit** `Add simplified journey clip player`.

### Task 3: Homepage integration and mobile decluttering

**Files:**
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `tests/webkit-mobile-playback.js`
- Modify: `tests/web-smoke.js`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Extend browser/source RED tests** to require real MP4/zero canvas, `playbackRate <= 1.25`, monotonic movement, pause recovery, confirmed-scene UI, direct backward Rail transition and zero visible `.journey-marker` elements at iPhone width.
- [ ] **Step 2: Run WebKit against the old component** and confirm RED first on the rate ceiling or UI ownership assertion.
- [ ] **Step 3: Replace the ad-hoc media effect and canvas runtime** with the hook. Keep canonical manifest timing, static stills for reduced/fallback, desktop pointer parallax and existing CTA/menu layout.
- [ ] **Step 4: Drive copy, hotspots, Soul Rail event state and diagnostics from confirmed scene.** Requested scroll may differ while moving.
- [ ] **Step 5: Hide `.journey-marker` under `@media (max-width: 767px)`** with `display: none`; desktop hotspots and focus behavior remain unchanged. The bottom scene copy, CTA and Soul Rail remain visible.
- [ ] **Step 6: Refactor browser suites to create, use and close one context/page before creating the next. Run journey, static, WebKit and Chromium smoke suites GREEN with one browser process and one context active at a time.**
- [ ] **Step 7: Commit** `Integrate smooth journey playback and simplify mobile UI`.

### Task 4: Remove unused controller experiment

**Files:**
- Delete: `web/src/lib/journey-segment-controller.ts`
- Delete: `tests/journey-segment-controller.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add static assertion** that production imports neither the old reducer nor controller.
- [ ] **Step 2: Remove the unused controller module/test and its test-script entry; do not remove canonical checkpoints or the old reducer history files.**
- [ ] **Step 3: Run journey/static tests and TypeScript GREEN.**
- [ ] **Step 4: Commit** `Remove unused journey controller experiment`.

### Task 5: Enforce Pages release gate

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `package.json`
- Create or modify: `tests/run-web-production.js`

- [ ] **Step 1: Add static RED assertions** that deploy depends on a `verify` job and that verify runs journey/static/lint/TypeScript, static build and focused mobile browser checks.
- [ ] **Step 2: Implement a bounded production/static runner** using a free port, 20-second readiness deadline, child-liveness checks and `finally` cleanup. It must run one browser engine at a time.
- [ ] **Step 3: Update workflow** so `verify` runs root `npm ci` and `web/npm ci`, installs Chromium and WebKit binaries only inside CI, builds the Pages export, and applies the existing `/hawaii` media rewrite. Copy `web/out` to `pages-preview/hawaii`, serve `pages-preview` from a free localhost port, and run Chromium then WebKit with `WEB_BASE_URL=http://127.0.0.1:<port>/hawaii`. Upload the exact tested `web/out` artifact; `deploy` declares `needs: verify`.
- [ ] **Step 4: Run YAML/static validation and local tests; do not run the full CI browser install locally.**
- [ ] **Step 5: Commit** `Gate Pages deployment on journey verification`.

### Task 6: Combined release verification and publication

**Files:**
- Modify only for scoped failures.

- [ ] **Step 1: Complete the separate approved booking/contact plan** `docs/superpowers/plans/2026-07-17-booking-contacts-implementation.md` Tasks 1-4 with its independent commits.
- [ ] **Step 2: Before release verification, commit every intended file, remove the temporary diagnostic script if it is not part of the suite, and require an empty `git status --porcelain`. Record `candidate_sha=$(git rev-parse HEAD)`. Then run journey, booking, static, WebKit, Chromium smoke, lint, TypeScript and `git diff --check`; run browser engines and contexts sequentially.
- [ ] **Step 3: Create a temporary detached worktree for the Pages build.** Move `web/src/app/api` to a temporary disabled path inside that worktree, symlink the existing `web/node_modules`, then run `STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/hawaii NODE_OPTIONS=--max-old-space-size=2048 npm --prefix <worktree>/web run build`. Apply the same media rewrite as CI. Copy output under `<temp>/pages-preview/hawaii`, serve the parent directory and run browser checks against `/hawaii`; guarantee worktree/server cleanup with traps.
- [ ] **Step 4: Verify the isolated static export contains both TheFork routes, correct `/hawaii/media/` URLs and mobile CSS that hides highlights. Verify no local server remains.**
- [ ] **Step 5: Require `git status --porcelain` to remain empty and `git rev-parse HEAD` to equal `candidate_sha`. If verification required any fix, commit it and restart Task 6 from Step 2. Set `release_sha=$candidate_sha`, then push exactly that HEAD to `claude/codex-handoff-assets-se8fjq`, wait for the Pages workflow and inspect logs. Do not force-push.**
- [ ] **Step 6: Verify `https://frankvillage.github.io/hawaii/?v=<sha>` plus both MP4 URLs; send an HTTP Range request and require `206`.**
- [ ] **Step 7: If public verification passes, report the deployed SHA and URL. If it fails, stop publication reporting, fix on a new commit and rerun the gate.**
