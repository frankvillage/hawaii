import assert from "node:assert/strict";

import {
  checkpointProgress,
  checkpointTime,
  JOURNEY_NAVIGATE_EVENT,
  sceneIndexFromProgress,
  sceneProgressForIndex,
  shouldUseJourneyFrames,
  transitionKind,
} from "../web/src/lib/journey-playback.ts";

assert.equal(
  shouldUseJourneyFrames({
    viewportWidth: 390,
    coarsePointer: false,
    hoverNone: false,
    maxTouchPoints: 0,
  }),
  true,
  "A narrow mobile viewport must use frame rendering even when pointer media queries are wrong",
);
assert.equal(
  shouldUseJourneyFrames({
    viewportWidth: 1366,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 1,
  }),
  true,
  "Touch-capable devices should not depend on paused-video seeking",
);
assert.equal(
  shouldUseJourneyFrames({
    viewportWidth: 1366,
    coarsePointer: false,
    hoverNone: false,
    maxTouchPoints: 0,
  }),
  false,
  "A conventional desktop should keep the video renderer",
);

assert.equal(JOURNEY_NAVIGATE_EVENT, "hawaii:journey-navigate");
assert.equal(checkpointProgress({ start: 0.125, end: 0.2 }), 0.1625);
assert.equal(checkpointTime({ start: 0.125, end: 0.2 }, 57.2), 9.295);
assert.equal(checkpointTime({ start: Number.NaN, end: Number.NaN }, 57.2), 0);

assert.equal(sceneIndexFromProgress(0, 9), 0);
assert.equal(sceneIndexFromProgress(0.124, 9), 1);
assert.equal(sceneIndexFromProgress(1, 9), 8);
assert.equal(sceneIndexFromProgress(4, 9), 8);
assert.equal(sceneIndexFromProgress(0.5, 0), 0);

assert.equal(sceneProgressForIndex(0, 9), 0);
assert.equal(sceneProgressForIndex(4, 9), 0.5);
assert.equal(sceneProgressForIndex(8, 9), 1);
assert.equal(sceneProgressForIndex(3, 1), 0);

assert.equal(transitionKind(0, 0, "intro"), "intro");
assert.equal(transitionKind(0, 1, "scroll"), "step");
assert.equal(transitionKind(8, 1, "rail"), "jump");
assert.equal(transitionKind(1, 4, "scroll"), "jump");

console.log("journey playback unit checks passed");
