import assert from "node:assert/strict";

import {
  checkpointProgress,
  checkpointTime,
  JOURNEY_CONFIRMED_EVENT,
  JOURNEY_NAVIGATE_EVENT,
  sceneIndexFromProgress,
  sceneProgressForIndex,
  transitionKind,
} from "../web/src/lib/journey-playback.ts";

assert.equal(JOURNEY_NAVIGATE_EVENT, "hawaii:journey-navigate");
assert.equal(JOURNEY_CONFIRMED_EVENT, "hawaii:journey-confirmed");
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
