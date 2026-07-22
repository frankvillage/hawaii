# Hawaii Slow Mobile Video Recovery Design

**Date:** 2026-07-22
**Status:** Approved in conversation
**Extends:** `2026-07-20-continuous-journey-scrub-design.md`

## Problem

The homepage currently treats media metadata that takes more than 3.5 seconds to arrive as a permanent video failure. On a cold mobile connection this removes the video element and replaces it with scene stills. The Soul Rail and copy continue to follow scroll progress, so the result looks like a sequence of static frames rather than a continuous film.

The failure is deterministic: delaying the public MP4 request by five seconds produces `data-media-mode="fallback"` with `data-fallback-reason="metadata-timeout"`.

## Approved Behavior

- Initial metadata latency alone must never replace the video with scene stills.
- While metadata is loading, the native video poster remains visible and the video element remains mounted.
- Scroll progress continues to be recorded while the media loads.
- A touch gesture may request playback even before metadata is available; once the browser can decode media, the existing controller catches up toward the latest scroll target.
- The Soul Rail follows the video timeline while video mode is healthy. It does not become a frame selector.
- A real media `error` may still activate the existing static fallback.
- `prefers-reduced-motion` continues to use stills intentionally.
- The mobile header behavior is unchanged.

## Implementation Boundary

Remove only the fixed initial metadata timeout that calls `activateFallback("metadata-timeout")`. Keep the poster, `preload`, source selection, media error handler, buffering recovery, gesture recovery, seek watchdog and reduced-motion behavior intact. Slow or failed seek handling is outside this fix.

Do not add loaders, notices, panels or new dependencies. Do not change the video files in this pass.

## Verification

- A WebKit iPhone context must perform touch and scroll while the MP4 request remains delayed beyond 3.5 seconds.
- During that delay the page must remain in `video` mode, retain the `<video>` element and record increased `data-scroll-progress` plus `data-target-time`.
- After the delayed request is released, the retained media intent must produce advancing media time and visibly different rendered frames without another document jump.
- A genuine media error must activate fallback with `data-fallback-reason="media-error"`.
- Existing WebKit mobile, Chromium desktop, static, TypeScript, lint and production build checks must pass.

## Reversibility

The behavior change is limited to the homepage player and its regression tests. No assets or fallback paths are removed. Reverting the implementation commit restores the previous timeout policy.
