import assert from "node:assert/strict";
import test from "node:test";

import { planJourneyClip } from "../web/src/lib/journey-clip-plan.ts";

test("intro playback starts from zero", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 12,
      targetTime: 2,
      source: "intro",
      isIntro: true,
    }),
    { seekTime: 0, targetTime: 2, playbackRate: 1 },
  );
});

test("adjacent forward playback continues from the current time", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 10,
      targetTime: 12,
      source: "scroll",
      isIntro: false,
    }),
    { seekTime: null, targetTime: 12, playbackRate: 1 },
  );
});

test("a long forward gap seeks to a 2.25 second pre-roll", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 4,
      targetTime: 12,
      source: "scroll",
      isIntro: false,
    }),
    { seekTime: 9.75, targetTime: 12, playbackRate: 1 },
  );
});

test("pre-roll is clamped to zero", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 8,
      targetTime: 1,
      source: "rail",
      isIntro: false,
    }),
    { seekTime: 0, targetTime: 1, playbackRate: 1 },
  );
});

test("backward playback uses destination pre-roll instead of reverse playback", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 15,
      targetTime: 8,
      source: "scroll",
      isIntro: false,
    }),
    { seekTime: 5.75, targetTime: 8, playbackRate: 1 },
  );
});

test("a forward gap exactly at the 3.25 second threshold does not seek", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: 5,
      targetTime: 8.25,
      source: "scroll",
      isIntro: false,
    }),
    { seekTime: null, targetTime: 8.25, playbackRate: 1.25 },
  );
});

test("playback rate stays within the decoder-safe range", () => {
  const plans = [
    planJourneyClip({
      currentTime: 2,
      targetTime: 2.1,
      source: "scroll",
      isIntro: false,
    }),
    planJourneyClip({
      currentTime: 2,
      targetTime: 5,
      source: "scroll",
      isIntro: false,
    }),
    planJourneyClip({
      currentTime: 0,
      targetTime: 20,
      source: "rail",
      isIntro: false,
    }),
  ];

  assert.deepEqual(
    plans.map(({ playbackRate }) => playbackRate),
    [1, 1.25, 1],
  );
  assert.ok(
    plans.every(
      ({ playbackRate }) => playbackRate >= 1 && playbackRate <= 1.25,
    ),
  );
});

test("invalid and non-finite inputs produce a safe finite plan", () => {
  assert.deepEqual(
    planJourneyClip({
      currentTime: Number.NaN,
      targetTime: Number.POSITIVE_INFINITY,
      source: "invalid",
      isIntro: false,
    }),
    { seekTime: null, targetTime: 0, playbackRate: 1 },
  );
  assert.deepEqual(
    planJourneyClip({
      currentTime: -10,
      targetTime: -5,
      source: null,
      isIntro: null,
    }),
    { seekTime: null, targetTime: 0, playbackRate: 1 },
  );
});
