# Hawaii Mobile Segment Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Riprodurre il video reale su mobile tra checkpoint consecutivi, mostrare un frame realmente pausato a ogni tappa e usare i JPEG soltanto dopo un errore media verificato.

**Architecture:** Un manifest versionato e una state machine pura governano richieste, segmenti, retry e conferme. Un controller con media adapter e clock iniettabili rende testabili play, seek, buffering e cancellazioni senza browser. Hook React separati collegano controller video e fallback canvas alla homepage; `NarrativeHomepage` possiede l’indice confermato usato da video, copy e Soul Rail.

**Tech Stack:** Next.js 16, React 19, TypeScript, HTMLMediaElement, requestVideoFrameCallback, Node assert, Playwright Chromium/WebKit.

---

## File Structure

- Create `web/src/lib/journey-checkpoints.ts`: manifest canonico e validazione.
- Create `web/src/lib/journey-segment-machine.ts`: stati, eventi e reducer puro.
- Create `web/src/lib/journey-segment-controller.ts`: effetti media con adapter/clock iniettabili.
- Create `web/src/lib/journey-frame-cache.ts`: LRU per byte e rilascio risorse.
- Create `web/src/components/home/use-segmented-journey-video.ts`: lifecycle React/Safari.
- Create `web/src/components/home/use-journey-frame-fallback.ts`: canvas e cache bounded.
- Create `tests/journey-segment-machine.test.mjs`, `tests/journey-segment-controller.test.mjs`, `tests/journey-frame-cache.test.mjs`.
- Create `tests/webkit-mobile-playback.js` e `tests/run-web-production.js`.
- Modify `NarrativeHomepage`, `SoulRail`, `ScrollVideoStage`, `globals.css`, browser tests e package scripts.

### Task 1: Checkpoint manifest

**Files:**
- Create: `web/src/lib/journey-checkpoints.ts`
- Create: `tests/journey-checkpoints.test.mjs`

- [ ] **Step 1: Write RED tests** for duplicate IDs, non-increasing times, values outside duration and a valid manifest shared by all renderers.
- [ ] **Step 2: Run** `node --no-warnings --experimental-strip-types tests/journey-checkpoints.test.mjs` and confirm FAIL because the module is absent.
- [ ] **Step 3: Implement** `createJourneyCheckpointManifest(scenes, duration, fps)` returning `{ version, id, index, time, still, fallbackFrame }[]` with midpoint timestamps and strict validation.
- [ ] **Step 4: Run GREEN** plus `npm run test:web:journey`.
- [ ] **Step 5: Commit** `git commit -m "Add canonical journey checkpoints"`.

### Task 2: State machine with real checkpoint pauses

**Files:**
- Create: `web/src/lib/journey-segment-machine.ts`
- Create: `tests/journey-segment-machine.test.mjs`

- [ ] **Step 1: Write RED tests** covering adjacent forward play, rapid scroll pending target, backward seek, distant Rail seek, stale request IDs and reduced mode.
- [ ] **Step 2: Require an explicit pause confirmation:**

```js
const reached = reduceJourneyMachine(queued, { type: "CHECKPOINT_REACHED", index: 1 });
assert.equal(reached.status, "checkpoint_paused");
assert.equal(reached.segmentTargetIndex, 1);

const confirmed = reduceJourneyMachine(reached, {
  type: "CHECKPOINT_FRAME_CONFIRMED",
  index: 1,
});
assert.equal(confirmed.currentIndex, 1);
assert.equal(confirmed.status, "playing");
assert.equal(confirmed.segmentTargetIndex, 2);
```

- [ ] **Step 3: Add RED cases** for `METADATA_TIMEOUT`, two `PLAY_REJECTED` events, `WAITING`, `STALLED`, one retry, seek-primary failure, exact-retry failure, pause imposed by Safari and cancellation during retry.
- [ ] **Step 4: Implement states** `idle`, `unlocking`, `buffering`, `playing`, `seeking`, `checkpoint_paused`, `suspended`, `fallback`; include `retryCount`, immutable active endpoint, pending target and request ID.
- [ ] **Step 5: Run GREEN** and commit `Add journey playback state machine`.

### Task 3: Deterministic segment controller

**Files:**
- Create: `web/src/lib/journey-segment-controller.ts`
- Create: `tests/journey-segment-controller.test.mjs`

- [ ] **Step 1: Define fakeable ports in the failing tests:**

```ts
export interface JourneyMediaAdapter {
  currentTime(): number;
  duration(): number;
  readyState(): number;
  paused(): boolean;
  waitForMetadata(signal: AbortSignal): Promise<number>;
  play(): Promise<void>;
  pause(): void;
  fastSeek?(time: number): void;
  seekExact(time: number): void;
  waitForDecodedFrame(signal: AbortSignal): Promise<number>;
  unload(): void;
}

export interface JourneyClock {
  now(): number;
  nextFrame(callback: () => void): number;
  cancelFrame(id: number): void;
  timeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
}
```

- [ ] **Step 2: Write RED tests one behavior at a time:** metadata sospesi con watchdog dedicato, manifest materializzato dalla durata effettiva restituita da `waitForMetadata`, unlock rejection/retry, forward play then pause, decoded checkpoint confirmation before next segment, exact seek retry, operation timeout, stale callback ignored, waiting/stalled retry, lifecycle suspend/resume and fallback only after verified failure.
- [ ] **Step 3: Implement the minimum controller for each RED case**, running the focused test after every behavior. Cancellation must abort listeners/timeouts, call `pause()` and prevent old Promises from dispatching.
- [ ] **Step 4: Assert healthy-path invariants:** controller never enters fallback and never requests frame fallback while media adapter succeeds.
- [ ] **Step 5: Run all controller/state tests** and commit `Add deterministic journey segment controller`.

### Task 4: Integrate video lifecycle after first paint

**Files:**
- Create: `web/src/components/home/use-segmented-journey-video.ts`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/lib/journey-playback.ts`
- Modify: `tests/journey-playback.test.mjs`
- Modify: `tests/web-static.js`
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Add RED browser assertions:** mobile healthy path has one video and zero canvas; source request starts after first paint; state becomes `playing`; video time advances across at least two samples; then `paused` is true within 150 ms of target.
- [ ] **Step 2: Mount poster and video shell first**, connect `<source>` only in a post-paint `requestAnimationFrame`, set `preload="auto"`, call `load()` and attach the HTMLMediaElement adapter.
- [ ] **Step 3: Unlock WebKit** on first `pointerdown`/`touchstart`; attempt muted intro autoplay after one second; rejection waits for user input rather than activating fallback immediately.
- [ ] **Step 4: Remove legacy mobile-default canvas and paused-currentTime damping** once the new controller owns playback. Delete `shouldUseJourneyFrames` and its mobile-default assertions; frame selection must occur only after the controller enters `fallback`.
- [ ] **Step 5: Add RED seek-cover assertions** for backward scroll and distant Rail jumps: the destination still appears for at least 180 ms and remains until the destination frame is verified; it clears on success, cancellation and fallback without exposing an old frame.
- [ ] **Step 6: Implement the seek cover** as controller-driven state, not an independent timeout in the layout component.
- [ ] **Step 7: Expose diagnostics** `data-playback-state`, `data-target-time`, `data-request-id`, `data-media-mode` and `data-fallback-reason` without technical UI copy.
- [ ] **Step 8: Run static/unit/smoke GREEN** and commit `Use real video for mobile journey segments`.

### Task 5: Synchronize scene UI and Soul Rail

**Files:**
- Modify: `web/src/components/home/narrative-homepage.tsx`
- Modify: `web/src/components/home/soul-rail.tsx`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Add RED tests** proving rapid scroll confirms checkpoints in order, Soul Rail/copy remain on the last decoded checkpoint until `CHECKPOINT_FRAME_CONFIRMED`, and a distant Rail request keeps the destination cover mounted until the verified frame.
- [ ] **Step 2: Lift `confirmedSceneIndex` to `NarrativeHomepage`** and pass it to Soul Rail. Soul Rail may request navigation but must not derive active state from scroll.
- [ ] **Step 3: Have ScrollVideoStage emit only confirmed checkpoints.** Scroll updates requested target; Rail click sends a direct-seek request.
- [ ] **Step 4: Rewrite existing Beach smoke flow** as adjacent checkpoint progress; keep a separate rapid-scroll test that records every confirmed pause.
- [ ] **Step 5: Run GREEN** and commit `Synchronize journey UI with decoded checkpoints`.

### Task 6: Reduced motion and explicit opt-in

**Files:**
- Modify: `web/src/components/home/use-segmented-journey-video.ts`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Add RED tests** for initial verified seek replacing poster, `system-reduced`, `enabled`, `paused`, opt-in persistence in sessionStorage, pause during play/seek and reopening the homepage in the same session.
- [ ] **Step 2: Implement the three-state motion preference.** System reduced uses verified seek only; `Attiva movimento` enables segment play for the session; `Pausa movimento` cancels the operation and completes a verified checkpoint seek.
- [ ] **Step 3: Add `data-motion-mode="enabled"` to the journey root after opt-in.** Inside the reduced-motion media query, re-enable only journey-local transitions, parallax and marker motion under that attribute; leave all unrelated site animations reduced.
- [ ] **Step 4: Run GREEN** and commit `Add explicit journey motion control`.

### Task 7: Bounded frame fallback

**Files:**
- Create: `web/src/lib/journey-frame-cache.ts`
- Create: `tests/journey-frame-cache.test.mjs`
- Create: `web/src/components/home/use-journey-frame-fallback.ts`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Write LRU RED tests** for byte accounting, 64 MiB cap, 12-frame cap, recency eviction and exactly-once `ImageBitmap.close()`.
- [ ] **Step 2: Implement cache and run GREEN.** No canvas or DOM dependencies belong in the cache module.
- [ ] **Step 3: Add forced-media-error RED test** asserting intermediate frame changes, video unload and no simultaneous MP4/JPEG activity.
- [ ] **Step 4: Implement the fallback hook** with viewport-sized bitmap decoding, priority path loading and permanent session fallback after controller failure.
- [ ] **Step 5: Run GREEN** and commit `Add bounded journey frame fallback`.

### Task 8: Reproducible browser runner and WebKit suite

**Files:**
- Create: `tests/run-web-production.js`
- Create: `tests/webkit-mobile-playback.js`
- Modify: `package.json`

- [ ] **Step 1: Implement a production runner** that builds, starts Next on a free local port, polls readiness, runs child test commands and terminates the server in `finally` even on failure.
- [ ] **Step 2: Add scripts:** `test:web:production`, `test:web:webkit`, and `playwright:install-webkit` (`npx playwright install webkit`). Allow `PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH` for the already-installed local engine.
- [ ] **Step 3: Add deterministic WebKit fault injection** for first `play()` rejection, waiting/stalled, background/resume, reduced-motion opt-in, rapid swipes and Eventi-to-BAR seek.
- [ ] **Step 4: Prepare the mandatory physical-device checklist:** Playwright WebKit is automated coverage, not a substitute for iPhone 12/iOS 16.4 plus one current iPhone with Low Power Mode and background/resume checks.
- [ ] **Step 5: Run production Chromium/WebKit suites** and commit `Cover Safari segment playback lifecycle`.

### Task 9: Performance and release verification

**Files:**
- Modify only for scoped failures.

- [ ] **Step 1: Run all unit/static checks:** journey, checkpoints, machine, controller, cache, lint, TypeScript and `git diff --check`.
- [ ] **Step 2: Run one optimized build** and the production runner; verify no child processes or listening ports remain.
- [ ] **Step 3: Verify healthy-path network:** MP4 request after first paint, Range response `206`, no intermediate JPEG requests, `state !== fallback`.
- [ ] **Step 4: Verify forced fallback:** video unloaded before JPEG requests, decoded cache <=64 MiB and <=12 entries.
- [ ] **Step 5: Collect performance evidence** under 10 Mbps/1.5 Mbps, RTT 80 ms, loss 0.5%: first decoded frame <=3 s cold/1.5 s warm, seek <=800 ms, checkpoint pause <=150 ms, dropped frames <10%.
- [ ] **Step 6: After explicit preview approval**, record `release_sha=$(git rev-parse HEAD)` and push only that exact SHA to `claude/codex-handoff-assets-se8fjq`. Verify the public cache-busted URL, WebKit behavior and HTTP Range response against that SHA.
- [ ] **Step 7: Complete the blocking physical-device gate** on iPhone 12/iOS 16.4 and one current iPhone: cache fredda/calda, Low Power Mode, rete profilata, background/ripresa, input ripetuti e memoria fallback totale `<80 MiB`. If both required device classes are unavailable or any criterion fails, stop release as blocked and do not update `main`.
- [ ] **Step 8: After physical QA approval**, push the same recorded `release_sha` to `main`, without rebuilding or creating another commit. Verify through the GitHub API that `main` and the Pages-authorized branch resolve to the identical SHA. The existing Pages environment protection may reject the redundant `main` deploy job; the already-verified Pages deployment must remain unchanged.
