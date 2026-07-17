# Hawaii Simplified Journey Player Design

**Date:** 2026-07-17  
**Status:** Approved in conversation  
**Scope:** Replace the unfinished state-machine playback architecture with one small, deterministic clip player before publishing to GitHub Pages.

## Objective

The mobile experience must use the real 25 fps MP4, not the 3 fps JPEG canvas. One swipe or Soul Rail selection starts a short, fluid video transition and stops on the selected scene. The player must recover from common mobile media interruptions without leaving the interface ahead of a frozen frame.

## Architecture

The player has one owner and one active operation token. It does not use the existing general-purpose journey reducer or the abandoned large controller.

Checkpoint timing has one canonical source: `createJourneyCheckpointManifest()` in `journey-checkpoints.ts`, materialized from the effective video duration and the existing scene ranges in `site-content.ts`. The simplified planner consumes that manifest. `journey-playback.ts` remains responsible only for mapping page scroll progress to a requested scene index; it does not calculate media targets independently.

The runtime state is intentionally limited to:

- `idle`: video paused on a confirmed checkpoint;
- `moving`: seeking or playing toward one target;
- `waiting-for-gesture`: muted autoplay was rejected and the same transition can be retried by touch;
- `fallback`: video is unavailable for the session and the corresponding scene still is shown.

Every asynchronous callback captures the current operation token. A newer direct navigation invalidates the old token, pauses the video and prevents stale promises or events from updating UI state.

## Navigation Rules

- Intro: hold the poster for one second, then play from zero to the Arrivo checkpoint.
- Any scroll input while a clip is active, forward or backward, keeps the active physical transition running and updates only the latest pending destination. Scroll direction is evaluated from the active target, not the already confirmed scene.
- Pending destination: after the current checkpoint is confirmed, transition directly to the latest requested scene rather than replaying every skipped scene.
- Soul Rail navigation is the only input that immediately cancels an active operation and moves directly to the selected scene under the destination still. Backward page scroll follows the pending-destination rule above.
- Copy, hotspot and active Soul Rail item change only after a decoded destination frame has been confirmed.
- Scroll position may represent the requested destination while scene UI remains on the last confirmed checkpoint during motion.

## Smooth Clip Plan

- Playback rate is always between `1` and `1.25`.
- If the destination is no more than `3.25` seconds ahead, play from the current video time.
- For a longer forward gap, seek under cover to `target - 2.25s`, verify that decoded frame, then play forward at no more than `1.25x`.
- Backward and distant jumps use the same verified pre-roll. The video is never played in reverse and never replays the full route backward.
- The cover remains visible through seek verification and fades away only when motion begins or the destination checkpoint is confirmed.

This intentionally skips non-essential footage between distant checkpoints. The user always receives a real moving clip at the destination instead of high-speed, dropped-frame playback.

## Recovery Rules

- `play()` rejection: retain the target in `waiting-for-gesture`; one pointer/touch gesture retries it.
- A second `play()` rejection after that user-gesture retry activates session fallback.
- `waiting`, `stalled` or unexpected `pause` before the target: pause, wait for playable data with a bounded watchdog, then retry once.
- A second interruption, metadata timeout, media error or failed exact seek activates the static-still fallback for the session.
- The fallback does not animate the 3 fps JPEG sequence. It shows the destination still and keeps navigation, copy, CTA and booking paths usable.
- In `fallback` and reduced-motion modes, displaying the requested scene still is a valid confirmation. Requested and confirmed indices update atomically after the still source is selected; no decoded video frame is required. Diagnostics expose the resulting still/fallback media mode.
- On `visibilitychange` hidden or `pagehide`, invalidate the operation, pause and retain the latest requested index. On return, reconcile the video to the last confirmed checkpoint; on the next animation frame, automatically start the retained request if it differs from the confirmed index.
- All timers, media listeners and frame callbacks are removed when an operation ends or the component unmounts.

## Reduced Motion

`prefers-reduced-motion` uses scene stills only. No autoplay, parallax chase or video transition starts automatically. Navigation remains complete and the selected scene still updates immediately.

## Media and Performance

- Healthy mobile and desktop paths use the existing H.264 MP4 sources with byte-range delivery.
- No blob conversion and no simultaneous MP4 plus JPEG-frame-sequence download.
- The mobile source remains under 10 MB; `preload="auto"` is limited to the homepage player.
- The 172 fallback JPEG files remain untouched for reversibility but are not requested by the simplified runtime.
- Only one local server and one browser context may run during verification. Build memory is capped at 2 GB.

## Diagnostics

The journey root exposes only non-visual diagnostics:

- `data-playback-state`;
- `data-confirmed-scene-id`;
- `data-requested-scene-id`;
- `data-target-time`;
- `data-media-mode` (`video`, `stills`, `fallback`).

No technical status copy is shown to visitors.

## Acceptance Tests

- WebKit mobile uses one real video and zero canvas elements on the healthy path.
- Playback rate never exceeds `1.25`.
- Four time samples during a transition increase monotonically.
- A synthetic system pause before the checkpoint triggers one retry and still reaches the target.
- A synthetic `waiting`/`stalled` event retries once; a second interruption activates the still fallback.
- Rapid scroll does not cancel the active clip; the latest target is retained.
- Eventi to Bar navigation does not replay the full video backward.
- Scene copy and Soul Rail remain on the confirmed scene until the decoded target frame is available.
- Reduced motion and forced media error show scene stills without loading JPEG timeline frames.
- Planner unit tests pin `max(0, target - 2.25s)`, the `3.25s` threshold, the `1.25x` ceiling and seek/frame verification tolerances.
- Chromium and WebKit focused tests, journey unit tests, static checks, lint, TypeScript and the memory-capped production build pass before deployment.

## Reversibility and Release

Implementation is split into independent commits:

1. simplified clip planning and unit tests;
2. homepage integration and WebKit regression tests;
3. removal or revert of the unused controller experiment;
4. official booking/contact integration;
5. verified GitHub Pages publication.

No existing media asset or page is deleted. The Pages update occurs only after local production verification, and the deployed commit SHA is recorded.

The Pages workflow gains a blocking `verify` job. It runs journey/static tests, lint, TypeScript, static build and the focused mobile browser suites against the generated export; the deploy job declares `needs: verify` and cannot publish a failing SHA. WebKit is installed only in CI and used by the focused mobile suite. After deployment, a smoke check opens the cache-busted public URL and verifies both MP4 URLs plus an HTTP `206` byte-range response before the release is reported complete.
