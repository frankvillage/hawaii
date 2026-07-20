import assert from "node:assert/strict";
import test from "node:test";

import {
  JOURNEY_FRAME_TOLERANCE_SECONDS,
  JOURNEY_SEEK_TOLERANCE_SECONDS,
  planJourneyClip,
} from "../web/src/lib/journey-clip-plan.ts";
import * as journeyRuntime from "../web/src/lib/journey-clip-runtime.ts";

const { createJourneyClipRuntime } = journeyRuntime;

const checkpoints = [
  {
    version: 1,
    id: "arrivo",
    index: 0,
    time: 2,
    still: "/stills/arrivo.jpg",
    fallbackFrame: 50,
  },
  {
    version: 1,
    id: "spiaggia",
    index: 1,
    time: 6,
    still: "/stills/spiaggia.jpg",
    fallbackFrame: 150,
  },
  {
    version: 1,
    id: "bar",
    index: 2,
    time: 12,
    still: "/stills/bar.jpg",
    fallbackFrame: 300,
  },
];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

async function flushMicrotasks(turns = 8) {
  for (let turn = 0; turn < turns; turn += 1) {
    await Promise.resolve();
  }
}

function createClock() {
  let nextId = 1;
  const frames = new Map();
  const timers = new Map();

  return {
    timeout(callback, ms) {
      const id = nextId++;
      timers.set(id, { callback, ms });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    nextFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      frames.delete(id);
    },
    fireTimeout(ms) {
      const entry = [...timers.entries()].find(([, timer]) => timer.ms === ms);
      assert.ok(entry, `Expected an active ${ms}ms timer`);
      timers.delete(entry[0]);
      entry[1].callback();
    },
    flushFrame() {
      const entry = frames.entries().next().value;
      assert.ok(entry, "Expected an active animation frame");
      frames.delete(entry[0]);
      entry[1]();
    },
    activeFrames() {
      return frames.size;
    },
    activeTimers() {
      return timers.size;
    },
    activeTimersFor(ms) {
      return [...timers.values()].filter((timer) => timer.ms === ms).length;
    },
  };
}

function createMedia({ play, waitForDecodedFrame } = {}) {
  let currentTime = 2;
  const calls = [];
  const frameWaits = [];
  const playableWaits = [];
  let activeListeners = 0;

  function abortableWait(signal, queue) {
    const pending = deferred();
    const entry = { pending, signal };
    queue.push(entry);
    activeListeners += 1;

    const cleanup = () => {
      if (entry.cleaned) {
        return;
      }
      entry.cleaned = true;
      activeListeners -= 1;
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      pending.reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    pending.promise.then(cleanup, cleanup);

    return pending.promise;
  }

  const media = {
    calls,
    currentTime: () => currentTime,
    readyState: () => 4,
    play() {
      calls.push(["play"]);
      return play ? play() : Promise.resolve();
    },
    pause() {
      calls.push(["pause"]);
    },
    seek(time) {
      calls.push(["seek", time]);
      currentTime = time;
    },
    setPlaybackRate(rate) {
      calls.push(["setPlaybackRate", rate]);
    },
    waitForDecodedFrame(signal) {
      calls.push(["waitForDecodedFrame", signal]);
      if (waitForDecodedFrame) {
        return waitForDecodedFrame(signal);
      }
      return abortableWait(signal, frameWaits);
    },
    waitForPlayable(signal) {
      calls.push(["waitForPlayable", signal]);
      return abortableWait(signal, playableWaits);
    },
    unload() {
      calls.push(["unload"]);
    },
    resolveFrame(time) {
      const entry = frameWaits.find((candidate) => !candidate.cleaned);
      assert.ok(entry, "Expected a decoded-frame listener");
      currentTime = time;
      entry.pending.resolve(time);
    },
    resolvePlayable() {
      const entry = playableWaits.find((candidate) => !candidate.cleaned);
      assert.ok(entry, "Expected a playable-data listener");
      entry.pending.resolve();
    },
    setCurrentTime(time) {
      currentTime = time;
    },
    activeListeners() {
      return activeListeners;
    },
  };

  return media;
}

function createHarness(overrides = {}) {
  const clock = overrides.clock ?? createClock();
  const media = overrides.media ?? createMedia();
  const selectedStills = [];
  const states = [];
  const runtime = createJourneyClipRuntime({
    checkpoints,
    clock,
    frameToleranceSeconds: JOURNEY_FRAME_TOLERANCE_SECONDS,
    initialIndex: 0,
    introDelayMs: 1_000,
    media,
    operationTimeoutMs: 800,
    planClip: planJourneyClip,
    reducedMotion: false,
    seekToleranceSeconds: JOURNEY_SEEK_TOLERANCE_SECONDS,
    selectStill: (still) => selectedStills.push(still),
    onStateChange: (state) => states.push(state),
    ...overrides,
  });

  return { clock, media, runtime, selectedStills, states };
}

async function confirmCurrentTarget(media, targetTime) {
  await flushMicrotasks();
  media.resolveFrame(targetTime);
  await flushMicrotasks();
  media.resolveFrame(targetTime);
  await flushMicrotasks();
}

test("intro owns one delayed operation before playback starts", async () => {
  const { clock, media, runtime } = createHarness();

  const intro = runtime.request(0, "intro");

  assert.equal(runtime.state().status, "moving");
  assert.equal(runtime.state().targetIndex, 0);
  assert.equal(media.calls.some(([name]) => name === "play"), false);
  assert.equal(clock.activeTimers(), 1);

  clock.fireTimeout(1_000);
  await flushMicrotasks();

  media.resolveFrame(0);
  await flushMicrotasks();

  assert.equal(
    media.calls.filter(([name]) => name === "play").length,
    1,
  );
  assert.equal(media.activeListeners(), 1);
  await confirmCurrentTarget(media, 2);
  await intro;
  assert.equal(runtime.state().status, "idle");
});

test("scroll updates only the latest pending target while motion continues", async () => {
  const { media, runtime } = createHarness();
  media.setCurrentTime(3);

  const firstTransition = runtime.request(1, "scroll");
  await flushMicrotasks();
  const firstSignal = media.calls.find(
    ([name]) => name === "waitForDecodedFrame",
  )[1];

  const queuedTransition = runtime.request(2, "scroll");

  assert.strictEqual(queuedTransition, firstTransition);
  assert.equal(firstSignal.aborted, false);
  assert.equal(runtime.state().requestedIndex, 2);
  assert.equal(runtime.state().targetIndex, 1);

  await confirmCurrentTarget(media, 6);
  assert.equal(runtime.state().confirmedIndex, 1);
  assert.equal(runtime.state().targetIndex, 2);

  await flushMicrotasks();
  media.resolveFrame(9.75);
  await confirmCurrentTarget(media, 12);
  await firstTransition;

  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 2);
  assert.equal(runtime.state().requestedIndex, 2);
});

test("Rail cancels and replaces the active operation", async () => {
  const { media, runtime } = createHarness();

  const staleTransition = runtime.request(1, "scroll");
  await flushMicrotasks();
  const staleSignal = media.calls.find(
    ([name]) => name === "waitForDecodedFrame",
  )[1];

  const replacement = runtime.request(2, "rail");

  assert.equal(staleSignal.aborted, true);
  assert.equal(runtime.state().targetIndex, 2);
  assert.equal(runtime.state().coverIndex, 2);
  assert.ok(
    media.calls.findIndex(([name]) => name === "pause") <
      media.calls.findIndex(([name, time]) => name === "seek" && time === 9.75),
  );

  await flushMicrotasks();
  media.resolveFrame(9.75);
  await confirmCurrentTarget(media, 12);
  await replacement;
  await staleTransition;
  assert.equal(runtime.state().confirmedIndex, 2);
});

test("stale decoded-frame callbacks cannot confirm a replaced target", async () => {
  const staleFrame = deferred();
  const currentFrames = [];
  let frameCall = 0;
  const media = createMedia({
    waitForDecodedFrame(signal) {
      frameCall += 1;
      if (frameCall === 1) {
        return staleFrame.promise;
      }
      const pending = deferred();
      currentFrames.push({ pending, signal });
      return pending.promise;
    },
  });
  const { runtime } = createHarness({ media });

  const staleTransition = runtime.request(1, "scroll");
  await flushMicrotasks();
  const replacement = runtime.request(2, "rail");
  await flushMicrotasks();

  currentFrames.shift().pending.resolve(9.75);
  await flushMicrotasks();
  currentFrames.shift().pending.resolve(12);
  await flushMicrotasks();
  currentFrames.shift().pending.resolve(12);
  await replacement;

  staleFrame.resolve(6);
  await staleTransition;

  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 2);
});

test("a checkpoint remains unconfirmed until its paused decoded frame is verified", async () => {
  const { media, runtime } = createHarness();
  media.setCurrentTime(3);

  const transition = runtime.request(1, "scroll");
  await flushMicrotasks();
  media.resolveFrame(6 - JOURNEY_FRAME_TOLERANCE_SECONDS);
  await flushMicrotasks();

  assert.equal(runtime.state().status, "moving");
  assert.equal(runtime.state().confirmedIndex, 0);

  media.resolveFrame(6 + JOURNEY_FRAME_TOLERANCE_SECONDS - 0.001);
  await transition;

  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 1);
  assert.equal(runtime.state().targetTime, 6);
});

test("the planner drives verified pre-roll and never exceeds 1.25x", async () => {
  const { media, runtime } = createHarness();
  media.setCurrentTime(2);

  const transition = runtime.request(2, "rail");
  await flushMicrotasks();

  assert.deepEqual(
    media.calls.find(([name]) => name === "seek").slice(0, 2),
    ["seek", 9.75],
  );
  media.resolveFrame(9.75 + JOURNEY_SEEK_TOLERANCE_SECONDS - 0.001);
  await flushMicrotasks();

  const rate = media.calls.find(([name]) => name === "setPlaybackRate")[1];
  assert.ok(rate >= 1 && rate <= 1.25);

  await confirmCurrentTarget(media, 12);
  await transition;
  assert.equal(runtime.state().confirmedIndex, 2);
});

test("the first play rejection waits for gesture and the second falls back", async () => {
  const media = createMedia({
    play: () => Promise.reject(new Error("NotAllowedError")),
  });
  media.setCurrentTime(3);
  const { runtime, selectedStills } = createHarness({ media });

  await runtime.request(1, "scroll");

  assert.equal(runtime.state().status, "waiting-for-gesture");
  assert.equal(runtime.state().requestedIndex, 1);
  assert.equal(runtime.state().fallbackReason, null);

  await runtime.retryFromGesture();

  assert.equal(runtime.state().status, "fallback");
  assert.equal(runtime.state().confirmedIndex, 1);
  assert.equal(runtime.state().fallbackReason, "play-rejected");
  assert.deepEqual(selectedStills, ["/stills/spiaggia.jpg"]);
  assert.deepEqual(media.calls.at(-1), ["unload"]);
});

for (const method of ["waiting", "stalled", "unexpectedPause"]) {
  test(`${method} retries once after playable data, then falls back`, async () => {
    const { media, runtime, selectedStills } = createHarness();
    media.setCurrentTime(3);
    const firstTransition = runtime.request(1, "scroll");
    await flushMicrotasks();
    const firstSignal = media.calls.find(
      ([name]) => name === "waitForDecodedFrame",
    )[1];

    const retry = runtime[method]();
    await flushMicrotasks();

    assert.equal(firstSignal.aborted, true);
    assert.equal(runtime.state().status, "moving");
    assert.equal(runtime.state().interruptionRetries, 1);
    assert.equal(
      media.calls.filter(([name]) => name === "waitForPlayable").length,
      1,
    );

    media.resolvePlayable();
    await flushMicrotasks();
    assert.equal(
      media.calls.filter(([name]) => name === "play").length,
      2,
    );

    await runtime[method]();
    await retry;
    await firstTransition;

    assert.equal(runtime.state().status, "fallback");
    assert.equal(runtime.state().fallbackReason, method);
    assert.deepEqual(selectedStills, ["/stills/spiaggia.jpg"]);
  });
}

test("hidden visibility invalidates motion and visible reconciliation retains the request", async () => {
  const { clock, media, runtime } = createHarness();
  media.setCurrentTime(10);
  const hiddenTransition = runtime.request(2, "scroll");
  await flushMicrotasks();
  const hiddenSignal = media.calls.find(
    ([name]) => name === "waitForDecodedFrame",
  )[1];

  runtime.visibilityHidden();

  assert.equal(hiddenSignal.aborted, true);
  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 0);
  assert.equal(runtime.state().requestedIndex, 2);

  const visible = runtime.visibilityVisible();
  await flushMicrotasks();
  assert.deepEqual(
    media.calls.filter(([name]) => name === "seek").at(-1),
    ["seek", 2],
  );
  media.resolveFrame(2);
  await visible;

  assert.equal(clock.activeFrames(), 1);
  assert.equal(
    media.calls.filter(([name]) => name === "play").length,
    1,
  );

  clock.flushFrame();
  await flushMicrotasks();
  assert.equal(runtime.state().targetIndex, 2);
  assert.deepEqual(
    media.calls.filter(([name]) => name === "seek").at(-1),
    ["seek", 9.75],
  );

  media.resolveFrame(9.75);
  await flushMicrotasks();
  assert.equal(
    media.calls.filter(([name]) => name === "play").length,
    2,
  );

  await confirmCurrentTarget(media, 12);
  await hiddenTransition;
  assert.equal(runtime.state().confirmedIndex, 2);
});

test("pagehide invalidates the operation without discarding the requested target", async () => {
  const { media, runtime } = createHarness();
  const transition = runtime.request(1, "scroll");
  await flushMicrotasks();
  const signal = media.calls.find(
    ([name]) => name === "waitForDecodedFrame",
  )[1];

  runtime.pageHide();
  await transition;

  assert.equal(signal.aborted, true);
  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 0);
  assert.equal(runtime.state().requestedIndex, 1);
});

test("dispose cancels owned timers, listeners, frame callbacks and work", async () => {
  const { clock, media, runtime } = createHarness();

  const intro = runtime.request(0, "intro");
  assert.equal(clock.activeTimers(), 1);
  runtime.dispose();
  await intro;
  assert.equal(clock.activeTimers(), 0);

  const second = createHarness();
  second.media.setCurrentTime(3);
  const transition = second.runtime.request(1, "scroll");
  await flushMicrotasks();
  assert.equal(second.media.activeListeners(), 1);
  second.runtime.visibilityHidden();
  const visible = second.runtime.visibilityVisible();
  await flushMicrotasks();
  second.media.resolveFrame(2);
  await visible;
  assert.equal(second.clock.activeFrames(), 1);

  second.runtime.dispose();
  await transition;

  assert.equal(second.clock.activeTimers(), 0);
  assert.equal(second.clock.activeFrames(), 0);
  assert.equal(second.media.activeListeners(), 0);
  assert.equal(second.runtime.state().disposed, true);
});

test("reduced motion confirms the selected still atomically without media work", async () => {
  const { media, runtime, selectedStills, states } = createHarness({
    reducedMotion: true,
  });

  await runtime.request(2, "rail");

  assert.deepEqual(selectedStills, ["/stills/bar.jpg"]);
  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().mediaMode, "stills");
  assert.equal(runtime.state().requestedIndex, 2);
  assert.equal(runtime.state().confirmedIndex, 2);
  assert.equal(
    states.some(
      (state) =>
        state.requestedIndex === 2 && state.confirmedIndex !== 2,
    ),
    false,
  );
  assert.deepEqual(media.calls, []);
});

test("fallback confirms only canonical scene stills and never timeline JPEGs", async () => {
  const { media, runtime, selectedStills } = createHarness();

  runtime.mediaError();
  await runtime.request(2, "scroll");

  assert.equal(runtime.state().status, "fallback");
  assert.equal(runtime.state().mediaMode, "fallback");
  assert.equal(runtime.state().requestedIndex, 2);
  assert.equal(runtime.state().confirmedIndex, 2);
  assert.deepEqual(selectedStills, [
    "/stills/arrivo.jpg",
    "/stills/bar.jpg",
  ]);
  assert.equal(
    selectedStills.some((src) => src.includes("/frames/") || /-[0-9]{3}\.jpg$/.test(src)),
    false,
  );
  assert.equal(
    media.calls.some(([name]) => name === "waitForDecodedFrame"),
    false,
  );
});

test("pageshow reconciles and resumes the request retained by pagehide", async () => {
  const { clock, media, runtime } = createHarness();
  media.setCurrentTime(10);
  const hiddenTransition = runtime.request(2, "scroll");
  await flushMicrotasks();

  runtime.pageHide();
  const shown = runtime.pageShow();
  await flushMicrotasks();
  media.resolveFrame(2);
  await shown;

  assert.equal(clock.activeFrames(), 1);
  clock.flushFrame();
  await flushMicrotasks();
  assert.equal(runtime.state().targetIndex, 2);

  media.resolveFrame(9.75);
  await confirmCurrentTarget(media, 12);
  await hiddenTransition;
  assert.equal(runtime.state().confirmedIndex, 2);
});

test("gesture retry calls play synchronously without repeating the intro delay", async () => {
  let playAttempts = 0;
  const media = createMedia({
    play() {
      playAttempts += 1;
      return playAttempts === 1
        ? Promise.reject(new Error("NotAllowedError"))
        : Promise.resolve();
    },
  });
  const { clock, runtime } = createHarness({ media });
  const intro = runtime.request(0, "intro");
  clock.fireTimeout(1_000);
  await flushMicrotasks();
  media.resolveFrame(0);
  await intro;
  assert.equal(runtime.state().status, "waiting-for-gesture");

  const retry = runtime.retryFromGesture();

  assert.equal(playAttempts, 2);
  assert.equal(clock.activeTimersFor(1_000), 0);
  await confirmCurrentTarget(media, 2);
  await retry;
  assert.equal(runtime.state().confirmedIndex, 0);
});

test("Rail replacement receives a fresh interruption retry budget", async () => {
  const { media, runtime } = createHarness();
  media.setCurrentTime(3);
  const first = runtime.request(1, "scroll");
  await flushMicrotasks();
  const retry = runtime.waiting();
  await flushMicrotasks();
  assert.equal(runtime.state().interruptionRetries, 1);

  const rail = runtime.request(2, "rail");

  assert.equal(runtime.state().interruptionRetries, 0);
  runtime.dispose();
  await Promise.all([first, retry, rail]);
});

test("Rail replacement receives a fresh play-rejection budget", async () => {
  const media = createMedia({
    play: () => Promise.reject(new Error("NotAllowedError")),
  });
  media.setCurrentTime(3);
  const { runtime } = createHarness({ media });
  await runtime.request(1, "scroll");
  assert.equal(runtime.state().status, "waiting-for-gesture");

  const rail = runtime.request(2, "rail");
  await flushMicrotasks();
  media.resolveFrame(9.75);
  await rail;

  assert.equal(runtime.state().status, "waiting-for-gesture");
  assert.equal(runtime.state().fallbackReason, null);
});

test("a retained visibility callback cannot replace a newer Rail operation", async () => {
  const { clock, media, runtime } = createHarness();
  media.setCurrentTime(10);
  const hidden = runtime.request(2, "scroll");
  await flushMicrotasks();
  runtime.visibilityHidden();
  const visible = runtime.visibilityVisible();
  await flushMicrotasks();
  media.resolveFrame(2);
  await visible;
  assert.equal(clock.activeFrames(), 1);

  const rail = runtime.request(1, "rail");
  await flushMicrotasks();
  const railSignal = media.calls.filter(
    ([name]) => name === "waitForDecodedFrame",
  ).at(-1)[1];
  clock.flushFrame();

  assert.equal(railSignal.aborted, false);
  assert.equal(runtime.state().targetIndex, 1);
  runtime.dispose();
  await Promise.all([hidden, rail]);
});

test("an active AbortError play rejection waits for gesture instead of sticking", async () => {
  const media = createMedia({
    play: () => Promise.reject(new DOMException("Interrupted", "AbortError")),
  });
  media.setCurrentTime(3);
  const { runtime } = createHarness({ media });

  await runtime.request(1, "scroll");

  assert.equal(runtime.state().status, "waiting-for-gesture");
  assert.equal(runtime.state().requestedIndex, 1);
});

test("no-rVFC readiness rejects stale events and requires presented progress", () => {
  const ready = journeyRuntime.isJourneyFallbackFrameReady;
  assert.equal(typeof ready, "function");

  assert.equal(ready("loadeddata", true, 4, 4), false);
  assert.equal(ready("timeupdate", true, 4, 4), false);
  assert.equal(ready("seeked", true, 4, 4), true);
  assert.equal(ready("loadeddata", false, 4, 5), false);
  assert.equal(ready("timeupdate", false, 4, 4), false);
  assert.equal(ready("timeupdate", false, 4, 4.01), true);
});

test("Rail request for the confirmed scene settles without media work", async () => {
  let playAttempts = 0;
  const media = createMedia({
    play() {
      playAttempts += 1;
      return Promise.reject(new Error("NotAllowedError"));
    },
  });
  const { runtime } = createHarness({ media });

  await runtime.request(0, "rail");

  assert.equal(playAttempts, 0);
  assert.equal(runtime.state().status, "idle");
  assert.equal(runtime.state().confirmedIndex, 0);
  assert.equal(runtime.state().requestedIndex, 0);
  assert.equal(runtime.state().interruptionRetries, 0);
});

test("fresh runtime state synchronously replaces stale index refs", () => {
  const syncRefs = journeyRuntime.syncJourneyClipIndexRefs;
  assert.equal(typeof syncRefs, "function");
  const confirmedIndexRef = { current: 2 };
  const requestedIndexRef = { current: 1 };
  const { runtime } = createHarness();

  syncRefs(runtime.state(), confirmedIndexRef, requestedIndexRef);

  assert.equal(confirmedIndexRef.current, 0);
  assert.equal(requestedIndexRef.current, 0);
});
