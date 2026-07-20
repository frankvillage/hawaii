# Hawaii Continuous Journey Scrub Design

**Date:** 2026-07-20
**Status:** Approved in conversation
**Supersedes:** `2026-07-17-simplified-journey-player-design.md` for homepage video behavior

## Objective

Restore a legible, continuous relationship between page movement and the Hawaii journey video. Scrolling must no longer trigger checkpoint clips, destination pre-rolls, static covers or mandatory snap points.

## Interaction Model

- The homepage remains one sticky cinematic stage over a continuous scroll track.
- Normalized scroll progress maps continuously to video time from `0` to the media duration.
- A small inertial controller advances the rendered media time toward the current scroll target without jumping directly across several seconds.
- When scrolling stops, the video settles on the corresponding timeline position and pauses.
- Scrolling backward moves the target backward with the same bounded interpolation.
- Scene copy and Soul Rail state are derived from continuous progress. They never start, stop or seek the media independently.
- Selecting a Soul Rail item smoothly scrolls the document to that scene position. It does not issue a separate video command.

## Removed Behavior

- No intro autoplay.
- No scene-by-scene clip playback.
- No destination pre-roll or playback-rate acceleration.
- No destination still covering the playing video.
- No mandatory CSS scroll snap or `scroll-snap-stop`.
- No pending/confirmed checkpoint queue in the homepage stage.

Existing clip-player modules and tests remain in the repository for reversibility, but the homepage no longer imports or executes them.

## Scroll Density

The track uses eighteen viewport-height units across the nine narrative scenes. Space is distributed according to each scene's real video range, keeping copy, anchors and footage aligned while limiting a typical mobile swipe to a small portion of the 57-second video.

## Media Controller

The controller exposes pure helpers for progress, target time and bounded time steps. Runtime updates are scheduled with one `requestAnimationFrame` loop and write only when the desired time differs by at least one video frame.

The maximum time movement per render tick is bounded. Large wheel or swipe deltas therefore become a short controlled catch-up rather than an immediate seek to a distant checkpoint. The controller does not call `play()`; this avoids autoplay restrictions and keeps scroll ownership explicit.

## Fallback And Accessibility

- Before metadata is available, the poster remains visible.
- Media errors retain the current narrative still and do not block page navigation.
- `prefers-reduced-motion` uses scene stills selected from progress without video scrubbing.
- The mobile hotspot hiding rule remains unchanged.
- Keyboard, anchor and Soul Rail navigation use native smooth document scrolling, subject to reduced-motion preference.

## Acceptance Criteria

- A small progress delta produces a proportionally small video target delta.
- A large progress delta cannot move displayed video time directly to the destination in one controller step.
- Repeated controller steps converge monotonically on forward and backward targets without overshoot.
- The page does not add `journey-snap-root` and scene spacers have no scroll-snap rules.
- Soul Rail navigation changes document position but never directly invokes a media seek operation.
- The homepage renders no destination cover image during healthy video mode.
- WebKit mobile and Chromium desktop show increasing video time across a scroll gesture and hidden mobile hotspots.
- Existing booking, content, static, TypeScript and lint checks continue to pass.

## Reversibility

The change is delivered as one isolated commit. It does not delete media, scene content, checkpoint manifests or the previous clip-player implementation. Reverting that commit restores the prior checkpoint behavior.
