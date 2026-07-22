# Persistent Reversible Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere l'interfaccia della journey sempre visibile e interattiva, aggiungere override accessibile per Riduci movimento, cue mobile, hotspot desktop collision-safe e riproduzione fluida forward/reverse con MP4 dedicati.

**Architecture:** Separare dal componente principale quattro responsabilita: preferenza media, layout hotspot, stato del cue e conversione temporale forward/reverse. Il controller React mantiene una timeline canonica forward e due layer video mutuamente esclusivi; gli asset reverse vengono prodotti offline con un processo segmentato a memoria limitata e caricati solo alla prima inversione.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Tailwind/CSS, Node test runner, Playwright Chromium/WebKit, H.264 MP4 statici, ffmpeg eseguito offline con massimo due thread.

---

## File Structure

- Create `web/src/lib/journey-media-preference.ts`: precedenza reduced-motion/session override e classificazione errori `play()` recuperabili.
- Create `web/src/lib/journey-hotspot-layout.ts`: collision resolver puro e deterministico.
- Create `web/src/lib/journey-reverse-time.ts`: mapping frame-accurate tra timeline forward e asset reverse.
- Create `web/src/lib/journey-scroll-cue-state.ts`: stato puro del cue mobile.
- Create `web/src/components/home/journey-scroll-cue.tsx`: indicatore mobile non interattivo.
- Create `web/src/components/home/journey-hotspot-layer.tsx`: misura ostacoli e applica il resolver senza lavoro per-frame.
- Create `web/src/components/home/journey-video-layers.tsx`: boundary rimovibile per due layer forward/reverse e frame presentation.
- Modify `web/src/components/home/scroll-video-stage.tsx`: integra preferenze, overlay persistente, due video e componenti estratti.
- Modify `web/src/app/globals.css`: alpha mobile, cue, hotspot risolti e reduced-motion.
- Create `scripts/generate-reverse-video.mjs`: generazione segmentata e sequenziale degli asset reverse.
- Create `scripts/build-pages-preview.sh`: build statico locale identico al workflow Pages, senza modificare `web/src/app/api`.
- Create `tests/journey-media-preference.test.mjs`: test puri della precedenza e degli errori.
- Create `tests/journey-hotspot-layout.test.mjs`: fixture collisioni/overflow/no-fit.
- Create `tests/journey-reverse-time.test.mjs`: mapping frame forward/reverse.
- Create `tests/webkit-persistent-interface.js`: reduced-motion override, retry Safari e overlay stabile.
- Create `tests/desktop-hotspot-collisions.js`: verifica browser di rettangoli e ostacoli.
- Create `tests/webkit-reverse-playback.js`: caricamento lazy, frame presentation e cambi direzione.
- Modify `tests/run-web-production.js`, `tests/web-static.js`, `package.json`: includere i nuovi gate.
- Create `web/public/media/hawaii/journey-mobile-reverse.mp4` e `web/public/media/hawaii/journey-desktop-reverse.mp4`: asset derivati, senza sostituire i forward.

### Task 0: Reproducible exact Pages artifact harness

**Files:**
- Create: `scripts/build-pages-preview.sh`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Write failing static assertions**

Require the script to use a temporary web copy, exclude `src/app/api`, preserve source files, set `STATIC_EXPORT=1`, `NEXT_PUBLIC_BASE_PATH=/hawaii`, cap Node at 2GB, prefix root media URLs and stage output under `pages-preview/hawaii`.

- [ ] **Step 2: Run RED**

Run: `npm run test:web:static`

Expected: FAIL because `scripts/build-pages-preview.sh` does not exist.

- [ ] **Step 3: Implement the harness**

Mirror `scripts/build-static-aruba.sh`: `mktemp`, `rsync` excluding `node_modules/.next/out/src/app/api`, symlink existing `web/node_modules`, build inside the temporary copy, apply the same three media-prefix substitutions used by `.github/workflows/deploy-pages.yml`, then `rsync --delete` into `pages-preview/hawaii`. Cleanup the temp directory on every exit/signal.

- [ ] **Step 4: Run GREEN and exact artifact smoke**

Run sequentially:

```bash
NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh
PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production
```

Expected: current production suite passes and `git status --short` shows no source deletion.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-pages-preview.sh tests/web-static.js
git commit -m "Add reproducible Pages preview build"
```

### Task 1: Pure media preference and recoverable play policy

**Files:**
- Create: `tests/journey-media-preference.test.mjs`
- Create: `web/src/lib/journey-media-preference.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Cover:

```js
assert.equal(videoEnabled({ resolved: false, reduced: false, override: false }), false);
assert.equal(videoEnabled({ resolved: true, reduced: true, override: false }), false);
assert.equal(videoEnabled({ resolved: true, reduced: true, override: true }), true);
assert.equal(videoEnabled({ resolved: true, reduced: false, override: false }), true);
assert.equal(isRecoverablePlayError({ name: "NotAllowedError" }), true);
assert.equal(isRecoverablePlayError({ name: "AbortError" }), true);
assert.equal(isRecoverablePlayError({ name: "NotSupportedError" }), false);
```

- [ ] **Step 2: Run RED**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-media-preference.test.mjs`

Expected: FAIL because `journey-media-preference.ts` does not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Export typed `videoEnabled`, `isRecoverablePlayError`, `readSessionOverride`, and `writeSessionOverride`. Storage helpers catch security/quota errors and never throw. Add `tests/journey-media-preference.test.mjs` explicitly to the `test:web:journey` script.

- [ ] **Step 4: Run GREEN and static tests**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-media-preference.test.mjs && npm run test:web:journey && npm run test:web:static`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/journey-media-preference.ts tests/journey-media-preference.test.mjs package.json
git commit -m "Add journey video preference policy"
```

### Task 2: Persistent overlay and explicit reduced-motion override

**Files:**
- Create: `tests/webkit-persistent-interface.js`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `tests/run-web-production.js`
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Write failing WebKit tests**

The test must assert:

- reduced motion starts with poster/still, a mounted hidden `<video>` without `src`/`<source>`, and `Attiva esperienza video`;
- the real button handler attaches the selected source and calls `play()` before the next microtask;
- after scrolling to a non-zero target, the video becomes visible and advances;
- repeated `NotAllowedError` and `AbortError` rejections retain video/waiting mode and retry UI instead of fallback;
- during `moving`, copy opacity/transform and CTA pointer behavior equal the settled values;
- mobile `.journey-marker` remains `display:none`;
- video is muted, `playsInline` and `aria-hidden="true"`;
- override survives reload in the same context/session and storage failure does not break the current activation;
- runtime changes of `prefers-reduced-motion` recalculate eligibility without video flash or loss of the session override;
- Enter/Space activation, visible unobscured focus, minimum 44x44 target and portrait/landscape safe-area placement;
- computed text alpha and contrast on representative brightest/darkest journey frames.

- [ ] **Step 2: Run RED**

Register the new script in `tests/run-web-production.js`, build and run the exact artifact:

```bash
NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh
PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production
```

Expected: FAIL on missing button, source already attached in reduced mode, overlay opacity `0.3`, and inert CTA.

- [ ] **Step 3: Implement media-preference state**

Initialize preference as unresolved and render poster plus a source-less hidden video. On normal preference resolution, attach sources. On reduced-motion override click, synchronously select mobile/desktop source, assign `video.src`, call `load()`, call `play()`, persist session override, then update React state. Never fallback for recoverable `play()` errors.

- [ ] **Step 4: Make interface persistent**

Remove playback-driven `overlayStyle`, `hotspotLayerStyle`, `inert`, and pointer disabling. Keep mobile hotspot hiding. Apply per-element alpha colors on mobile only; CTA remains fully opaque. Add a dedicated data-testid to the persistent copy region.

- [ ] **Step 5: Run GREEN and regressions**

Run: `npm run test:web:journey && npm run test:web:static`

Run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/scroll-video-stage.tsx web/src/app/globals.css tests/webkit-persistent-interface.js tests/run-web-production.js tests/web-smoke.js
git commit -m "Keep journey controls active during playback"
```

### Task 3: Mobile continuation cue

**Files:**
- Create: `web/src/components/home/journey-scroll-cue.tsx`
- Create: `web/src/lib/journey-scroll-cue-state.ts`
- Create: `tests/journey-scroll-cue.test.mjs`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `package.json`

- [ ] **Step 1: Write failing cue state tests**

Test a pure exported state helper with: active scroll hides immediately; idle for `<1800ms` stays hidden; idle for `>=1800ms` shows; progress `>=0.985` hides; outside viewport hides; reduced motion returns a static cue.

- [ ] **Step 2: Run RED**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-scroll-cue.test.mjs`

Expected: FAIL because the component/helper does not exist.

- [ ] **Step 3: Implement cue**

Implement the pure state helper in `journey-scroll-cue-state.ts`, then render `Scorri`, line and dot on mobile right safe edge. Use `pointer-events:none`, `aria-hidden="true"`, safe-area inset and no backdrop filter. Update visibility from existing progress/scroll timestamps without adding a second scroll listener. Add the pure test explicitly to `test:web:journey`; the browser test uses `elementFromPoint` to prove input reaches the layer below the cue.

- [ ] **Step 4: Verify visual and reduced-motion behavior**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-scroll-cue.test.mjs && npm run test:web:journey`

Run browser GREEN through the exact artifact: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: PASS; reduced motion disables dot animation even after video override.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/journey-scroll-cue.tsx web/src/lib/journey-scroll-cue-state.ts web/src/components/home/scroll-video-stage.tsx web/src/app/globals.css tests/journey-scroll-cue.test.mjs package.json
git commit -m "Add mobile journey scroll cue"
```

### Task 4: Pure collision resolver

**Files:**
- Create: `web/src/lib/journey-hotspot-layout.ts`
- Create: `tests/journey-hotspot-layout.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing geometry tests**

Fixtures must cover 768x1024, 1024x768, 1280x720, 1366x768, 1440x900 and 1920x1080; 100/125/150/200% text scaling; safe-area insets on every side; obstacles on every side; overlapping authored anchors; expanded card; and no-fit mode. Validate authored coordinates before resolution.

For every returned rect assert:

```js
assert.equal(intersectsAny(result.rect, obstacles), false);
assert.equal(intersectsAny(result.rect, previousRects), false);
assert.equal(isInside(result.rect, safeViewport), true);
```

No-fit must pack deterministic compact positions across left then right lanes with unique 44x44 targets and `mode: "compact"`. Tests distinguish peer collision sets (hotspot against hotspot/obstacle) from intentional containment (dot/label inside its own interactive parent).

- [ ] **Step 2: Run RED**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-hotspot-layout.test.mjs`

Expected: FAIL because resolver does not exist.

- [ ] **Step 3: Implement resolver**

Use immutable rects, 8px separation, 24px bounded anchor relocation, ordered candidate positions, then deterministic two-side lane packing. Export authored-coordinate validation and small geometry helpers for tests; no DOM access in this file. Add `tests/journey-hotspot-layout.test.mjs` explicitly to `test:web:journey`.

- [ ] **Step 4: Run GREEN**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-hotspot-layout.test.mjs && npm run test:web:journey`

Expected: all fixtures pass with zero overlaps/overflow.

Run authored-coordinate validation against every hotspot in `homeJourney` for each supported aspect ratio. Fail with scene and hotspot identifiers for invalid coordinates or unresolved placement.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/journey-hotspot-layout.ts tests/journey-hotspot-layout.test.mjs package.json
git commit -m "Add deterministic hotspot collision resolver"
```

### Task 5: Integrate collision-safe desktop hotspots

**Files:**
- Create: `web/src/components/home/journey-hotspot-layer.tsx`
- Create: `tests/desktop-hotspot-collisions.js`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `tests/run-web-production.js`
- Modify: `tests/webkit-mobile-playback.js`

- [ ] **Step 1: Write failing browser collision test**

First require the integration marker `data-hotspot-layout="resolved"`, which guarantees RED fails before integration instead of relying on accidental current overlap. For every scene and supported viewport, collect rects for header, copy, marker, rail, WhatsApp, interactive hotspot parents and the single active card. Assert no peer intersection and no viewport overflow before/after resize and font readiness. Repeat with root font scaling and browser/CSS zoom equivalents at 100/125/150/200%. Assert mobile hotspot count visible is zero.

- [ ] **Step 2: Run RED**

Register the test in `tests/run-web-production.js`, then run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: FAIL because `data-hotspot-layout="resolved"` is absent.

- [ ] **Step 3: Extract and integrate layer**

Measure only after scene/font/resize changes using `ResizeObserver` and one scheduled animation frame. Pass measured safe-area insets into the resolver and set `data-hotspot-layout="resolved"` only after a valid result. Apply output via absolute coordinates. Remove label/card parallax. Preserve dot pulse, links and touch-sheet behavior. Keep expanded-card identity as controlled React state and permit only one card.

- [ ] **Step 4: Run GREEN and mobile regression**

Run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: zero collisions and zero visible mobile hotspots.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/journey-hotspot-layer.tsx web/src/components/home/scroll-video-stage.tsx web/src/app/globals.css tests/desktop-hotspot-collisions.js tests/run-web-production.js tests/webkit-mobile-playback.js
git commit -m "Keep desktop hotspots inside safe visual areas"
```

### Task 6: Frame-accurate reverse timeline helpers

**Files:**
- Create: `web/src/lib/journey-reverse-time.ts`
- Create: `tests/journey-reverse-time.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing mapping tests**

Use `fps=25`, `frameCount=1430`. Verify forward frame `0` maps to reverse `1429`, forward `1429` maps to reverse `0`, midpoint round-trips exactly, invalid values clamp, and no mapped timestamp exceeds `(frameCount - 1) / fps`.

- [ ] **Step 2: Run RED**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-reverse-time.test.mjs`

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helpers**

Export `timeToFrame`, `frameToTime`, `forwardFrameToReverseFrame`, `forwardTimeToReverseTime`, and inverse equivalents. Keep frame rounding policy explicit and symmetric. Add `tests/journey-reverse-time.test.mjs` explicitly to `test:web:journey`.

- [ ] **Step 4: Run GREEN**

Run: `node --no-warnings --experimental-strip-types --test tests/journey-reverse-time.test.mjs && npm run test:web:journey`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/journey-reverse-time.ts tests/journey-reverse-time.test.mjs package.json
git commit -m "Add frame accurate reverse timeline mapping"
```

### Task 7: Generate reverse MP4 assets with bounded resources

**Files:**
- Create: `scripts/generate-reverse-video.mjs`
- Create: `web/public/media/hawaii/journey-mobile-reverse.mp4`
- Create: `web/public/media/hawaii/journey-desktop-reverse.mp4`
- Modify: `tests/web-static.js`
- Modify: `tests/aruba-static-readiness.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add failing asset assertions**

Require both reverse files only. Controller/source-reference and lazy-load assertions belong to Task 8. Assert each file begins with MP4 `ftyp`, has `moov` before `mdat`, contains exactly 1430 video frames and stays at or below its forward counterpart size.

- [ ] **Step 2: Run RED**

Run: `npm run test:web:static`

Expected: FAIL because reverse assets are absent.

- [ ] **Step 3: Implement low-memory generator**

After network approval, install the reproducible offline encoder with `npm install --save-dev ffmpeg-static`. The script discovers an ffmpeg binary from `FFMPEG_PATH` or that dependency and treats the published forward MP4 as the explicit source because no original master exists in the repository. It performs a disk preflight requiring at least four times the source size plus 250MB free, creates all output under a temporary directory and replaces the destination atomically only after verification.

Process one source at a time. For each 50-frame chunk use accurate input seek to `startFrame/25`, decode exactly `frameCount` frames, apply frame-based `trim`, reset PTS, `reverse`, then `setpts=N/(25*TB)`. Encode CFR 25 H.264 `avc1`/yuv420p, BT.709 metadata, keyint 25, no audio/data/timecode with `-threads 2 -filter_threads 1 -filter_complex_threads 1`. Concatenate chunks in reverse chronological order and add faststart.

The Node parent monitors the ffmpeg child tree RSS every 500ms and terminates it above 2.5GB. SIGINT, SIGTERM, ffmpeg failure or verification failure remove temporary chunks and leave the previous destination untouched. Desktop and mobile never run concurrently.

Start from the forward file's measured bitrate/CRF-equivalent settings. If the output exceeds the forward byte budget, retry sequentially with target bitrate reduced by 8%, at most three attempts. Every accepted segment must meet SSIM >=0.965 against its decoded reversed source chunk; otherwise stop and report that the available lossy source cannot satisfy both quality and size budgets.

- [ ] **Step 4: Generate mobile then desktop**

Run sequentially with Node capped at 2GB:

```bash
NODE_OPTIONS=--max-old-space-size=2048 node scripts/generate-reverse-video.mjs mobile
NODE_OPTIONS=--max-old-space-size=2048 node scripts/generate-reverse-video.mjs desktop
```

Expected: two valid assets, each no larger than the corresponding forward file; ffmpeg child-tree RSS remains below 2.5GB.

- [ ] **Step 5: Verify frame equivalence**

Verify all 1430 output PTS values are CFR 25 and strictly increasing; duration is 57.2s; dimensions, SAR, BT.709 metadata and profile/level match the compatibility budget; no audio/timecode exists; keyframe gaps are <=1s. For every generated segment, compare all decoded frames against the corresponding reversed source chunk and require aggregate SSIM >=0.965.

For complete ordering validation, decode the forward and final reverse assets to one 64x36 grayscale signature per frame (about 3.3MB for 1430 frames). Compare reverse signature `i` with forward signature `1429-i` for every frame. Require normalized grayscale MAE <=0.08 for every frame, <=0.04 at the 95th percentile and <=0.025 globally; fail with exact indices for any threshold violation. Also verify fixed one-to-one sequence length/order so no output frame can be skipped or reused. Full-resolution screenshots at start, midpoint, every scene boundary and end remain a secondary visual check.

- [ ] **Step 6: Verify the Aruba package**

Run: `NODE_OPTIONS=--max-old-space-size=2048 npm run build:web:aruba`

Expected: the generated `output/aruba-static` passes readiness checks with both reverse assets.

- [ ] **Step 7: Commit assets separately**

```bash
git add scripts/generate-reverse-video.mjs web/public/media/hawaii/journey-mobile-reverse.mp4 web/public/media/hawaii/journey-desktop-reverse.mp4 tests/web-static.js tests/aruba-static-readiness.js package.json package-lock.json
git commit -m "Add optimized reverse journey media"
```

### Task 8: Dual-layer forward/reverse controller

**Files:**
- Create: `tests/webkit-reverse-playback.js`
- Create: `web/src/components/home/journey-video-layers.tsx`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/lib/site-content.ts`
- Modify: `tests/run-web-production.js`
- Modify: `tests/webkit-mobile-playback.js`
- Modify: `tests/desktop-video-playback.js`

- [ ] **Step 1: Write failing reverse integration test**

Add static assertions for both reverse source references and the removable `JourneyVideoLayers` boundary. Assert reverse MP4 is not requested during initial load/forward scroll. Reverse loading may begin only when the timeline has already advanced by at least one frame and the canonical target is at least one frame behind the presented canonical time. Then assert request occurs, old frame remains visible until the reverse layer presents a frame, canonical time decreases through multiple intermediate values, only one video is playing, and no fallback/still is inserted. Repeat rapid forward/reverse switches and delayed reverse response.

- [ ] **Step 2: Add failure and lifecycle cases**

Test reverse 404/decode error, missing `requestVideoFrameCallback`, stale callback token, background/resume and reduced-motion override. A reverse-only failure must preserve the current frame and realign forward without global static fallback.

- [ ] **Step 3: Run RED**

Register the test in `tests/run-web-production.js`, then run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: FAIL because only one forward video exists and upward scroll seeks.

- [ ] **Step 4: Implement dual layers**

Implement `JourneyVideoLayers` as the removable boundary, with forward/reverse refs, canonical time conversion, active direction and transition token. On a qualified reverse request: increment token, pause destination, attach/load reverse if needed, seek it to the latest mapped target, wait for seek completion and a presented frame, re-check token, pause the source layer, then atomically switch visibility and start destination playback if target distance remains. Every `loadedmetadata`, `loadeddata`, `canplay`, `seeked`, `playing`, `timeupdate`, `requestVideoFrameCallback`, canvas fallback and rAF callback checks the captured token before mutating state.

On rapid direction changes, increment the token before any new media work and retain the last painted layer. On reverse 404/decode failure, keep the painted layer visible, seek the forward layer to the latest canonical target while hidden, wait for a presented forward frame, then reveal it; never expose an undecoded frame and never enter global still fallback for a reverse-only error.

- [ ] **Step 5: Preserve existing forward behavior**

Forward-only users must download no reverse bytes. Coarse-pointer forward playback remains 1x; desktop catch-up remains capped. Scene index and Soul Rail derive from canonical forward time regardless of active layer.

- [ ] **Step 6: Run GREEN and direction regressions**

Run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

Expected: PASS with moving frame samples in both directions.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/home/journey-video-layers.tsx web/src/components/home/scroll-video-stage.tsx web/src/lib/site-content.ts tests/webkit-reverse-playback.js tests/run-web-production.js tests/webkit-mobile-playback.js tests/desktop-video-playback.js tests/web-static.js
git commit -m "Play dedicated reverse video on upward scroll"
```

### Task 9: Full release-candidate verification

**Files:**
- Modify only if verification reveals a root-cause defect.

- [ ] **Step 1: Source checks**

Run:

```bash
npm run test:web:journey
npm run test:web:booking
npm run test:web:static
./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json
npm --prefix web run lint -- --max-warnings=0
```

Expected: zero failures/warnings.

- [ ] **Step 2: Type and build checks**

Run the two exact static builds sequentially with `NODE_OPTIONS=--max-old-space-size=2048`:

```bash
bash scripts/build-pages-preview.sh
npm run build:web:aruba
```

Expected: exit 0.

- [ ] **Step 3: Exact static artifact suite**

Run: `PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`

`tests/run-web-production.js` starts one ephemeral static server and executes browser scripts sequentially. Expected: booking, smoke, desktop, iPhone, slow media, persistent interface, collision and reverse tests all pass.

- [ ] **Step 4: Resource audit**

Confirm no preview server remains, no duplicate browser process remains, reverse files respect budgets, and peak local memory stayed bounded.

- [ ] **Step 5: Final review**

Dispatch spec-compliance then code-quality reviewers. Resolve findings and repeat the exact affected tests.

- [ ] **Step 6: Prepare deploy decision**

Report commits, asset sizes, verification evidence and remaining physical-iPhone acceptance risk. Ask explicit confirmation before push/deploy to GitHub Pages.

### Task 10: Blocking physical-iPhone acceptance and rollout

**Files:**
- Modify only when a physical-device finding identifies a reproducible defect.

- [ ] **Step 1: Obtain explicit deploy approval**

Do not push the release candidate until the user approves updating the shared Pages preview.

- [ ] **Step 2: Push and verify Pages commit identity**

Push the verified commit to `claude/codex-handoff-assets-se8fjq`, wait for the Pages workflow, confirm remote SHA equals the workflow `headSha`, then open the public URL with a commit cache-buster.

- [ ] **Step 3: Run public automated checks**

Run the iPhone WebKit, slow-media, collision, reverse and desktop scripts sequentially against the public URL. These checks are necessary but not sufficient.

- [ ] **Step 4: Complete physical Safari matrix**

Before the physical pass, add a dedicated reversible diagnostic commit that maps the reverse URL to a guaranteed missing asset only when the public query contains `reverse-test=404`; ordinary visitors are unaffected. On a real iPhone verify: Riduci movimento on/off; Risparmio energetico on/off; cache fredda/calda; portrait/landscape safe areas; forward and reverse with rapid changes; CTA while video is moving; background/resume; and reverse failure through `?reverse-test=404`. Record whether video pixels, canonical scene, Soul Rail and copy stay synchronized.

Expected: no static fallback for policy rejection, no text glitch, no hidden CTA, no black frame, smooth forward/reverse and no hotspot on mobile. Any failure blocks final acceptance and returns to systematic debugging.

After the 404 case passes, revert the diagnostic-only commit, rebuild and redeploy with explicit approval. Verify the public URL no longer changes reverse behavior for `?reverse-test=404`.

- [ ] **Step 5: Document reversible rollout**

The dependency order is: preference helpers -> persistent UI -> cue -> collision resolver/layer -> reverse mapping -> reverse assets -> dual-layer controller. Revert in strict reverse order. To disable only reverse behavior without removing assets/helpers, remove `JourneyVideoLayers` integration first; unused assets/helpers can then be reverted safely.
