import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceScrubTime,
  playbackRateForDistance,
  sceneIndexForTimelineProgress,
  timelineProgressForSceneIndex,
  targetTimeForProgress,
  transportForTimes,
} from "../web/src/lib/journey-scroll-scrub.ts";

const sceneRanges = [
  { start: 0, end: 0.125 },
  { start: 0.125, end: 0.2 },
  { start: 0.2, end: 0.55 },
  { start: 0.55, end: 1 },
];

test("scroll progress maps proportionally to the complete video", () => {
  assert.equal(targetTimeForProgress(0.25, 57.2), 14.3);
  assert.equal(targetTimeForProgress(-1, 57.2), 0);
  assert.equal(targetTimeForProgress(2, 57.2), 57.2);
});

test("one animation step cannot jump directly to a distant forward target", () => {
  const next = advanceScrubTime(0, 30, 16.67);

  assert.ok(next > 0);
  assert.ok(next <= 0.051);
  assert.ok(next < 30);
});

test("one animation step cannot jump directly to a distant backward target", () => {
  const next = advanceScrubTime(30, 0, 16.67);

  assert.ok(next < 30);
  assert.ok(next >= 29.949);
  assert.ok(next > 0);
});

test("scrub steps converge without overshooting either direction", () => {
  assert.equal(advanceScrubTime(9.98, 10, 16.67), 10);
  assert.equal(advanceScrubTime(10.02, 10, 16.67), 10);
});

test("forward movement uses real playback while reverse movement uses seeking", () => {
  assert.equal(transportForTimes(2, 8, 0.04), "play-forward");
  assert.equal(transportForTimes(8, 2, 0.04), "seek-backward");
  assert.equal(transportForTimes(7.98, 8, 0.04), "settled");
});

test("forward playback accelerates distant targets without exceeding a fluid rate", () => {
  assert.equal(playbackRateForDistance(0.5), 1);
  assert.equal(playbackRateForDistance(3), 2);
  assert.equal(playbackRateForDistance(30), 3);
  assert.equal(playbackRateForDistance(30, 2), 2);
});

test("invalid inputs produce finite safe times", () => {
  assert.equal(targetTimeForProgress(Number.NaN, Number.POSITIVE_INFINITY), 0);
  assert.equal(advanceScrubTime(Number.NaN, Number.POSITIVE_INFINITY, -1), 0);
});

test("active scenes follow their actual video ranges", () => {
  assert.equal(sceneIndexForTimelineProgress(0.19, sceneRanges), 1);
  assert.equal(sceneIndexForTimelineProgress(0.5, sceneRanges), 2);
  assert.equal(sceneIndexForTimelineProgress(1, sceneRanges), 3);
});

test("Soul Rail destinations use the midpoint of the real scene range", () => {
  assert.equal(timelineProgressForSceneIndex(1, sceneRanges), 0.1625);
  assert.equal(timelineProgressForSceneIndex(99, sceneRanges), 0.775);
});
