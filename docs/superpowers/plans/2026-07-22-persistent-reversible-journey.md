# Persistent Reversible Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere l'interfaccia della journey sempre visibile e interattiva, aggiungere override accessibile per Riduci movimento, cue mobile, hotspot desktop collision-safe e riproduzione fluida forward/reverse con MP4 dedicati.

**Architecture:** Separare dal componente principale quattro responsabilita: preferenza media, layout hotspot, stato del cue e conversione temporale forward/reverse. Il controller React mantiene una timeline canonica forward e due layer video mutuamente esclusivi; gli asset reverse vengono prodotti offline con un processo segmentato a memoria limitata e caricati solo alla prima inversione.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind/CSS, Node test runner, Playwright Chromium/WebKit, H.264 MP4 statici, ffmpeg eseguito offline con massimo due thread.

---

## File Structure

- Create `web/src/lib/journey-media-preference.ts`: precedenza reduced-motion/session override e classificazione errori `play()` recuperabili.
- Create `web/src/lib/journey-hotspot-layout.ts`: collision resolver puro e deterministico.
- Create `web/src/lib/journey-reverse-time.ts`: mapping frame-accurate tra timeline forward e asset reverse.
- Create `web/src/components/home/journey-scroll-cue.tsx`: indicatore mobile non interattivo.
- Create `web/src/components/home/journey-hotspot-layer.tsx`: misura ostacoli e applica il resolver senza lavoro per-frame.
- Modify `web/src/components/home/scroll-video-stage.tsx`: integra preferenze, overlay persistente, due video e componenti estratti.
- Modify `web/src/app/globals.css`: alpha mobile, cue, hotspot risolti e reduced-motion.
- Create `scripts/generate-reverse-video.mjs`: generazione segmentata e sequenziale degli asset reverse.
- Create `tests/journey-media-preference.test.mjs`: test puri della precedenza e degli errori.
- Create `tests/journey-hotspot-layout.test.mjs`: fixture collisioni/overflow/no-fit.
- Create `tests/journey-reverse-time.test.mjs`: mapping frame forward/reverse.
- Create `tests/webkit-persistent-interface.js`: reduced-motion override, retry Safari e overlay stabile.
- Create `tests/desktop-hotspot-collisions.js`: verifica browser di rettangoli e ostacoli.
- Create `tests/webkit-reverse-playback.js`: caricamento lazy, frame presentation e cambi direzione.
- Modify `tests/run-web-production.js`, `tests/web-static.js`, `package.json`: includere i nuovi gate.
- Create `web/public/media/hawaii/journey-mobile-reverse.mp4` e `web/public/media/hawaii/journey-desktop-reverse.mp4`: asset derivati, senza sostituire i forward.

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

Run: `node tests/journey-media-preference.test.mjs`

Expected: FAIL because `journey-media-preference.ts` does not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Export typed `videoEnabled`, `isRecoverablePlayError`, `readSessionOverride`, and `writeSessionOverride`. Storage helpers catch security/quota errors and never throw.

- [ ] **Step 4: Run GREEN and static tests**

Run: `node tests/journey-media-preference.test.mjs && npm run test:web:static`

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
- override survives reload in the same context/session and storage failure does not break the current activation.

- [ ] **Step 2: Run RED**

Run against a local production build: `node tests/webkit-persistent-interface.js`

Expected: FAIL on missing button, source already attached in reduced mode, overlay opacity `0.3`, and inert CTA.

- [ ] **Step 3: Implement media-preference state**

Initialize preference as unresolved and render poster plus a source-less hidden video. On normal preference resolution, attach sources. On reduced-motion override click, synchronously select mobile/desktop source, assign `video.src`, call `load()`, call `play()`, persist session override, then update React state. Never fallback for recoverable `play()` errors.

- [ ] **Step 4: Make interface persistent**

Remove playback-driven `overlayStyle`, `hotspotLayerStyle`, `inert`, and pointer disabling. Keep mobile hotspot hiding. Apply per-element alpha colors on mobile only; CTA remains fully opaque. Add a dedicated data-testid to the persistent copy region.

- [ ] **Step 5: Run GREEN and regressions**

Run: `node tests/webkit-persistent-interface.js`

Run: `npm run test:web:journey && npm run test:web:static`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/scroll-video-stage.tsx web/src/app/globals.css tests/webkit-persistent-interface.js tests/run-web-production.js tests/web-smoke.js
git commit -m "Keep journey controls active during playback"
```

### Task 3: Mobile continuation cue

**Files:**
- Create: `web/src/components/home/journey-scroll-cue.tsx`
- Create: `tests/journey-scroll-cue.test.mjs`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Write failing cue state tests**

Test a pure exported state helper with: active scroll hides immediately; idle for `<1800ms` stays hidden; idle for `>=1800ms` shows; progress `>=0.985` hides; outside viewport hides; reduced motion returns a static cue.

- [ ] **Step 2: Run RED**

Run: `node tests/journey-scroll-cue.test.mjs`

Expected: FAIL because the component/helper does not exist.

- [ ] **Step 3: Implement cue**

Render `Scorri`, line and dot on mobile right safe edge. Use `pointer-events:none`, `aria-hidden="true"`, safe-area inset and no backdrop filter. Update visibility from existing progress/scroll timestamps without adding a second scroll listener.

- [ ] **Step 4: Verify visual and reduced-motion behavior**

Run: `node tests/journey-scroll-cue.test.mjs && node tests/webkit-persistent-interface.js`

Expected: PASS; reduced motion disables dot animation even after video override.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/journey-scroll-cue.tsx web/src/components/home/scroll-video-stage.tsx web/src/app/globals.css tests/journey-scroll-cue.test.mjs
git commit -m "Add mobile journey scroll cue"
```

### Task 4: Pure collision resolver

**Files:**
- Create: `web/src/lib/journey-hotspot-layout.ts`
- Create: `tests/journey-hotspot-layout.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing geometry tests**

Fixtures must cover viewport widths 768/1024/1366/1440/1920, common heights, portrait-like desktop windows, 100-200% text scaling, obstacles on every side, overlapping authored anchors, expanded card, and no-fit mode.

For every returned rect assert:

```js
assert.equal(intersectsAny(result.rect, obstacles), false);
assert.equal(intersectsAny(result.rect, previousRects), false);
assert.equal(isInside(result.rect, safeViewport), true);
```

No-fit must return deterministic compact lane positions with unique 44x44 targets and `mode: "compact"`.

- [ ] **Step 2: Run RED**

Run: `node tests/journey-hotspot-layout.test.mjs`

Expected: FAIL because resolver does not exist.

- [ ] **Step 3: Implement resolver**

Use immutable rects, 8px separation, 24px bounded anchor relocation, ordered candidate positions, then deterministic side-lane packing. Export small geometry helpers for tests; no DOM access in this file.

- [ ] **Step 4: Run GREEN**

Run: `node tests/journey-hotspot-layout.test.mjs`

Expected: all fixtures pass with zero overlaps/overflow.

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

For every scene and viewport, collect rects for header, copy, marker, rail, WhatsApp, labels and active card. Assert no pairwise intersection and no viewport overflow before/after resize and font readiness. Assert mobile hotspot count visible is zero.

- [ ] **Step 2: Run RED**

Run: `node tests/desktop-hotspot-collisions.js`

Expected: current authored transforms overlap at least one obstacle fixture or overflow.

- [ ] **Step 3: Extract and integrate layer**

Measure only after scene/font/resize changes using `ResizeObserver` and one scheduled animation frame. Apply resolver output via absolute coordinates. Remove label/card parallax. Preserve dot pulse, links and touch-sheet behavior. Permit only one expanded card.

- [ ] **Step 4: Run GREEN and mobile regression**

Run: `node tests/desktop-hotspot-collisions.js && node tests/webkit-mobile-playback.js`

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

- [ ] **Step 1: Write failing mapping tests**

Use `fps=25`, `frameCount=1430`. Verify forward frame `0` maps to reverse `1429`, forward `1429` maps to reverse `0`, midpoint round-trips exactly, invalid values clamp, and no mapped timestamp exceeds `(frameCount - 1) / fps`.

- [ ] **Step 2: Run RED**

Run: `node tests/journey-reverse-time.test.mjs`

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helpers**

Export `timeToFrame`, `frameToTime`, `forwardFrameToReverseFrame`, `forwardTimeToReverseTime`, and inverse equivalents. Keep frame rounding policy explicit and symmetric.

- [ ] **Step 4: Run GREEN**

Run: `node tests/journey-reverse-time.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/journey-reverse-time.ts tests/journey-reverse-time.test.mjs
git commit -m "Add frame accurate reverse timeline mapping"
```

### Task 7: Generate reverse MP4 assets with bounded resources

**Files:**
- Create: `scripts/generate-reverse-video.mjs`
- Create: `web/public/media/hawaii/journey-mobile-reverse.mp4`
- Create: `web/public/media/hawaii/journey-desktop-reverse.mp4`
- Modify: `tests/web-static.js`
- Modify: `tests/aruba-static-readiness.js`

- [ ] **Step 1: Add failing asset assertions**

Require both reverse files and require site content/controller references. Assert each file begins with MP4 `ftyp`, has `moov` before `mdat`, and stays at or below its forward counterpart size.

- [ ] **Step 2: Run RED**

Run: `npm run test:web:static && node tests/aruba-static-readiness.js`

Expected: FAIL because reverse assets are absent.

- [ ] **Step 3: Implement low-memory generator**

The script discovers an ffmpeg binary from `FFMPEG_PATH` or `ffmpeg-static`, processes one source at a time with two threads, reverses two-second/50-frame chunks, encodes each chunk H.264/yuv420p/keyint 25, concatenates chunks in reverse order, adds faststart, strips audio/timecode, verifies 1430 frames, then deletes temporary chunks. Never run desktop and mobile encodes concurrently.

- [ ] **Step 4: Generate mobile then desktop**

Run sequentially with Node capped at 2GB:

```bash
NODE_OPTIONS=--max-old-space-size=2048 node scripts/generate-reverse-video.mjs mobile
NODE_OPTIONS=--max-old-space-size=2048 node scripts/generate-reverse-video.mjs desktop
```

Expected: two valid assets, each no larger than the corresponding forward file. Monitor RSS and stop if the process exceeds the agreed resource ceiling.

- [ ] **Step 5: Verify frame equivalence**

Use ffmpeg/ffprobe or Playwright screenshots to compare forward frame `n` with reverse frame `1429-n` at start, midpoint, scene boundaries and end. Expected normalized pixel difference within encoding tolerance.

- [ ] **Step 6: Commit assets separately**

```bash
git add scripts/generate-reverse-video.mjs web/public/media/hawaii/*-reverse.mp4 tests/web-static.js tests/aruba-static-readiness.js
git commit -m "Add optimized reverse journey media"
```

### Task 8: Dual-layer forward/reverse controller

**Files:**
- Create: `tests/webkit-reverse-playback.js`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/lib/site-content.ts`
- Modify: `tests/run-web-production.js`
- Modify: `tests/webkit-mobile-playback.js`
- Modify: `tests/desktop-video-playback.js`

- [ ] **Step 1: Write failing reverse integration test**

Assert reverse MP4 is not requested during initial load/forward scroll. After upward scroll, assert request occurs, old frame remains visible until the reverse layer presents a frame, canonical time decreases through multiple intermediate values, only one video is playing, and no fallback/still is inserted. Repeat rapid forward/reverse switches and delayed reverse response.

- [ ] **Step 2: Add failure and lifecycle cases**

Test reverse 404/decode error, missing `requestVideoFrameCallback`, stale callback token, background/resume and reduced-motion override. A reverse-only failure must preserve the current frame and realign forward without global static fallback.

- [ ] **Step 3: Run RED**

Run: `node tests/webkit-reverse-playback.js`

Expected: FAIL because only one forward video exists and upward scroll seeks.

- [ ] **Step 4: Implement dual layers**

Add forward/reverse refs, canonical time conversion, active direction and transition token. Attach reverse source only after a negative scroll delta. Pause inactive layer. Use `requestVideoFrameCallback` or offscreen canvas decode proof plus two rAFs before changing layer opacity. Ignore every async completion with an obsolete token.

- [ ] **Step 5: Preserve existing forward behavior**

Forward-only users must download no reverse bytes. Coarse-pointer forward playback remains 1x; desktop catch-up remains capped. Scene index and Soul Rail derive from canonical forward time regardless of active layer.

- [ ] **Step 6: Run GREEN and direction regressions**

Run: `node tests/webkit-reverse-playback.js`

Run: `node tests/webkit-mobile-playback.js && node tests/desktop-video-playback.js`

Expected: PASS with moving frame samples in both directions.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/home/scroll-video-stage.tsx web/src/lib/site-content.ts tests/webkit-reverse-playback.js tests/run-web-production.js tests/webkit-mobile-playback.js tests/desktop-video-playback.js
git commit -m "Play dedicated reverse video on upward scroll"
```

### Task 9: Full release-candidate verification

**Files:**
- Modify only if verification reveals a root-cause defect.

- [ ] **Step 1: Source checks**

Run: `npm run test:web:journey && npm run test:web:static && npm run test:booking && npm run lint`

Expected: zero failures/warnings.

- [ ] **Step 2: Type and build checks**

Run sequentially with `NODE_OPTIONS=--max-old-space-size=2048`:

```bash
npm run typecheck
npm run build:web
```

Expected: exit 0.

- [ ] **Step 3: Exact static artifact suite**

Build the Pages artifact and run `node tests/run-web-production.js <pages-preview>` one browser at a time. Expected: booking, smoke, desktop, iPhone, slow media, persistent interface, collision and reverse tests all pass.

- [ ] **Step 4: Resource audit**

Confirm no preview server remains, no duplicate browser process remains, reverse files respect budgets, and peak local memory stayed bounded.

- [ ] **Step 5: Final review**

Dispatch spec-compliance then code-quality reviewers. Resolve findings and repeat the exact affected tests.

- [ ] **Step 6: Prepare deploy decision**

Report commits, asset sizes, verification evidence and remaining physical-iPhone acceptance risk. Ask explicit confirmation before push/deploy to GitHub Pages.
