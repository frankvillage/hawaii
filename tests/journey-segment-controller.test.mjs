import assert from "node:assert/strict";
import test from "node:test";

import { createJourneySegmentController } from "../web/src/lib/journey-segment-controller.ts";

const scenes = [
  { id: "intro", start: 0, end: 0.2, still: "/intro.jpg" },
  { id: "beach", start: 0.2, end: 0.4, still: "/beach.jpg" },
  { id: "bar", start: 0.7, end: 0.9, still: "/bar.jpg" },
];

const shortScenes = [
  { id: "intro", start: 0.05, end: 0.15, still: "/intro.jpg" },
  { id: "beach", start: 0.15, end: 0.25, still: "/beach.jpg" },
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

function createClock() {
  let nextId = 1;
  const frames = new Map();
  const timers = new Map();

  return {
    now: () => 0,
    nextFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      frames.delete(id);
    },
    timeout(callback, ms) {
      const id = nextId++;
      timers.set(id, { callback, ms });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fireTimeout(ms) {
      const entry = [...timers.entries()].find(([, timer]) => timer.ms === ms);
      assert.ok(entry, `Expected a ${ms}ms timeout`);
      timers.delete(entry[0]);
      entry[1].callback();
    },
  };
}

function createMedia(overrides = {}) {
  let time = 0;
  const calls = [];

  return {
    calls,
    currentTime: () => time,
    duration: () => 20,
    readyState: () => 4,
    paused: () => true,
    waitForMetadata: async () => 20,
    play: async () => {},
    pause: () => calls.push(["pause"]),
    fastSeek(value) {
      calls.push(["fastSeek", value]);
      time = value;
    },
    seekExact(value) {
      calls.push(["seekExact", value]);
      time = value;
    },
    setPlaybackRate(value) {
      calls.push(["setPlaybackRate", value]);
    },
    waitForDecodedFrame: async () => time,
    unload: () => calls.push(["unload"]),
    setCurrentTime(value) {
      time = value;
    },
    ...overrides,
  };
}

test("materializes checkpoints from the metadata duration", async () => {
  const metadata = deferred();
  const media = createMedia({
    duration: () => 999,
    waitForMetadata: () => metadata.promise,
  });
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes,
  });

  const initialized = controller.initialize();
  metadata.resolve(20);
  const manifest = await initialized;

  assert.deepEqual(manifest.map(({ id }) => id), ["intro", "beach", "bar"]);
  assert.ok(Math.abs(manifest[0].time - 2) < Number.EPSILON);
  assert.ok(Math.abs(manifest[1].time - 6) < 1e-12);
  assert.ok(Math.abs(manifest[2].time - 16) < Number.EPSILON);
  assert.deepEqual(controller.manifest(), manifest);
});

test("metadata watchdog aborts materialization before entering fallback", async () => {
  const metadata = deferred();
  let metadataSignal;
  const clock = createClock();
  const media = createMedia({
    waitForMetadata(signal) {
      metadataSignal = signal;
      return metadata.promise;
    },
  });
  const controller = createJourneySegmentController({
    clock,
    fps: 25,
    media,
    scenes,
  });

  const initialized = controller.initialize();
  clock.fireTimeout(3_000);

  assert.equal(await initialized, null);
  assert.equal(metadataSignal.aborted, true);
  assert.equal(controller.state().status, "fallback");
  assert.equal(controller.state().fallbackReason, "metadata_timeout");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
});

test("forward playback pauses and confirms a decoded checkpoint frame", async () => {
  let frameCount = 0;
  const media = createMedia({
    play() {
      media.calls.push(["play"]);
      return Promise.resolve();
    },
    waitForDecodedFrame() {
      frameCount += 1;
      media.setCurrentTime(4);
      media.calls.push(["decodedFrame", frameCount]);
      return Promise.resolve(4);
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();

  await controller.request(1, "scroll");

  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 1);
  assert.equal(frameCount, 2);
  assert.ok(media.calls.find(([name]) => name === "setPlaybackRate")[1] <= 1.25);
  assert.ok(
    media.calls.findIndex(([name]) => name === "play") <
      media.calls.findIndex(([name]) => name === "pause"),
  );
  assert.ok(
    media.calls.findIndex(
      ([name, count]) => name === "decodedFrame" && count === 1,
    ) < media.calls.findIndex(([name]) => name === "pause"),
  );
  assert.ok(
    media.calls.findIndex(([name]) => name === "pause") <
      media.calls.findIndex(
        ([name, count]) => name === "decodedFrame" && count === 2,
      ),
  );
});

test("failed paused-frame confirmation retries an exact verified seek", async () => {
  let frameCount = 0;
  const media = createMedia({
    play: () => Promise.resolve(),
    waitForDecodedFrame() {
      frameCount += 1;
      if (frameCount === 1) {
        media.setCurrentTime(4);
        return Promise.resolve(4);
      }
      if (frameCount === 2) {
        return Promise.resolve(4.5);
      }
      return Promise.resolve(media.currentTime());
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();

  await controller.request(1, "scroll");

  assert.deepEqual(
    media.calls.filter(([name]) => name === "seekExact"),
    [["seekExact", 4]],
  );
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 1);
  assert.equal(controller.state().fallbackReason, null);
});

test("paused-frame watchdog retries exact then falls back without getting stuck", async () => {
  const clock = createClock();
  const confirmationFrame = deferred();
  const exactFrame = deferred();
  let frameCount = 0;
  const media = createMedia({
    play: () => Promise.resolve(),
    waitForDecodedFrame() {
      frameCount += 1;
      if (frameCount === 1) {
        media.setCurrentTime(4);
        return Promise.resolve(4);
      }
      return frameCount === 2 ? confirmationFrame.promise : exactFrame.promise;
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock,
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  const playback = controller.request(1, "scroll");
  for (let turn = 0; turn < 4; turn += 1) {
    await Promise.resolve();
  }
  assert.equal(controller.state().status, "checkpoint_paused");

  clock.fireTimeout(800);
  await Promise.resolve();

  assert.deepEqual(
    media.calls.filter(([name]) => name === "seekExact"),
    [["seekExact", 4]],
  );
  assert.equal(controller.state().status, "checkpoint_paused");

  clock.fireTimeout(800);
  await Promise.resolve();

  assert.equal(controller.state().status, "fallback");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
  confirmationFrame.resolve(4);
  exactFrame.resolve(4);
  await playback;
});

test("long forward gaps use verified pre-roll without exceeding 1.25x", async () => {
  let decodedFrames = 0;
  const media = createMedia({
    play() {
      media.calls.push(["play"]);
      return Promise.resolve();
    },
    waitForDecodedFrame() {
      decodedFrames += 1;
      if (decodedFrames > 1) {
        media.setCurrentTime(6);
      }
      media.calls.push(["decodedFrame", media.currentTime()]);
      return Promise.resolve(media.currentTime());
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes,
  });
  await controller.initialize();

  await controller.request(1, "scroll");

  const preRoll = media.calls.find(([name]) => name === "fastSeek");
  assert.equal(preRoll[0], "fastSeek");
  assert.ok(Math.abs(preRoll[1] - 3.75) < 1e-12);
  const preRollFrame = media.calls[media.calls.indexOf(preRoll) + 1];
  assert.equal(preRollFrame[0], "decodedFrame");
  assert.ok(Math.abs(preRollFrame[1] - 3.75) < 1e-12);
  const playbackRate = media.calls.find(
    ([name]) => name === "setPlaybackRate",
  )[1];
  assert.ok(playbackRate <= 1.25);
  assert.equal(controller.state().currentIndex, 1);
  assert.equal(controller.state().status, "idle");
});

test("intro may play from zero without pre-roll", async () => {
  let frameCount = 0;
  const introScenes = [
    { id: "intro", start: 0.2, end: 0.4, still: "/intro.jpg" },
  ];
  const media = createMedia({
    play() {
      media.calls.push(["play"]);
      return Promise.resolve();
    },
    waitForDecodedFrame() {
      frameCount += 1;
      media.setCurrentTime(6);
      return Promise.resolve(6);
    },
  });
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    initialIndex: -1,
    media,
    scenes: introScenes,
  });
  await controller.initialize();

  await controller.request(0, "intro");

  assert.equal(frameCount, 2);
  assert.equal(
    media.calls.some(([name]) => name === "fastSeek" || name === "seekExact"),
    false,
  );
  assert.ok(media.calls.find(([name]) => name === "setPlaybackRate")[1] <= 1.25);
  assert.equal(controller.state().currentIndex, 0);
});

test("first play rejection waits for an unlock retry without fallback", async () => {
  const media = createMedia({
    play: () => Promise.reject(new Error("NotAllowedError")),
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();

  await controller.request(1, "scroll");

  assert.equal(controller.state().status, "unlocking");
  assert.equal(controller.state().fallbackReason, null);
  assert.equal(media.calls.some(([name]) => name === "unload"), false);
});

test("successful unlock resumes the rejected segment", async () => {
  let playAttempts = 0;
  const media = createMedia({
    play() {
      playAttempts += 1;
      media.calls.push(["play", playAttempts]);
      return playAttempts === 1
        ? Promise.reject(new Error("NotAllowedError"))
        : Promise.resolve();
    },
    waitForDecodedFrame() {
      media.setCurrentTime(4);
      return Promise.resolve(4);
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  await controller.request(1, "scroll");

  await controller.unlock();

  assert.equal(playAttempts, 3);
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 1);
  assert.equal(media.calls.some(([name]) => name === "unload"), false);
});

test("rejected unlock consumes the retry budget and enters fallback", async () => {
  let playAttempts = 0;
  const media = createMedia({
    play() {
      playAttempts += 1;
      return Promise.reject(new Error("NotAllowedError"));
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  await controller.request(1, "scroll");

  await controller.unlock();

  assert.equal(playAttempts, 2);
  assert.equal(controller.state().status, "fallback");
  assert.equal(controller.state().fallbackReason, "play_rejected");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
});

test("second play rejection after unlock enters fallback", async () => {
  let playAttempts = 0;
  const media = createMedia({
    play() {
      playAttempts += 1;
      return playAttempts === 2
        ? Promise.resolve()
        : Promise.reject(new Error("NotAllowedError"));
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  await controller.request(1, "scroll");

  await controller.unlock();

  assert.equal(playAttempts, 3);
  assert.equal(controller.state().status, "fallback");
  assert.equal(controller.state().fallbackReason, "play_rejected");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
});

test("replacement request aborts stale callbacks before they can mutate state", async () => {
  const staleFrame = deferred();
  let staleSignal;
  let frameCalls = 0;
  const media = createMedia({
    play: () => Promise.resolve(),
    waitForDecodedFrame(signal) {
      frameCalls += 1;
      if (frameCalls === 1) {
        staleSignal = signal;
        return staleFrame.promise;
      }
      return Promise.resolve(media.currentTime());
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  const staleRequest = controller.request(1, "scroll");
  await Promise.resolve();

  const replacementRequest = controller.request(0, "rail");

  assert.equal(staleSignal.aborted, true);
  assert.ok(
    media.calls.findIndex(([name]) => name === "pause") <
      media.calls.findIndex(([name]) => name === "fastSeek"),
  );
  await replacementRequest;
  staleFrame.reject(new DOMException("Aborted", "AbortError"));
  await staleRequest;
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().segmentTargetIndex, null);
  assert.equal(controller.state().currentIndex, 0);
});

test("backward seek retries exact assignment after primary verification fails", async () => {
  let frameAttempt = 0;
  const media = createMedia({
    waitForDecodedFrame() {
      frameAttempt += 1;
      return Promise.resolve(frameAttempt === 1 ? 2.5 : media.currentTime());
    },
  });
  media.setCurrentTime(4);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    initialIndex: 1,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();

  await controller.request(0, "rail");

  assert.deepEqual(
    media.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ),
    [
      ["fastSeek", 2],
      ["seekExact", 2],
    ],
  );
  assert.equal(media.calls.some(([name]) => name === "play"), false);
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 0);
  assert.equal(controller.state().fallbackReason, null);
});

test("seek enters fallback only after primary and exact verification fail", async () => {
  const media = createMedia({
    waitForDecodedFrame: () => Promise.resolve(2.5),
  });
  media.setCurrentTime(4);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    initialIndex: 1,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();

  await controller.request(0, "rail");

  assert.deepEqual(
    media.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ),
    [
      ["fastSeek", 2],
      ["seekExact", 2],
    ],
  );
  assert.equal(controller.state().status, "fallback");
  assert.equal(controller.state().fallbackReason, "seek_exact_failed");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
});

test("primary seek watchdog retries with exact assignment", async () => {
  const clock = createClock();
  const frames = [deferred(), deferred()];
  let frameIndex = 0;
  const media = createMedia({
    waitForDecodedFrame: () => frames[frameIndex++].promise,
  });
  media.setCurrentTime(4);
  const controller = createJourneySegmentController({
    clock,
    fps: 25,
    initialIndex: 1,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  const primarySeek = controller.request(0, "rail");
  await Promise.resolve();

  clock.fireTimeout(800);
  await Promise.resolve();

  assert.equal(controller.state().status, "seeking");
  assert.equal(controller.state().seekAttempt, "exact");
  assert.deepEqual(
    media.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ).map(([name]) => name),
    ["fastSeek", "seekExact"],
  );
  frames[1].resolve(2);
  frames[0].resolve(2);
  await primarySeek;
});

test("waiting stalled and system pause retry once before fallback", async () => {
  const cases = [
    ["waiting", "waiting"],
    ["stalled", "stalled"],
    ["systemPaused", "system_paused"],
  ];

  for (const [method, fallbackReason] of cases) {
    const frames = [deferred(), deferred()];
    const signals = [];
    let frameIndex = 0;
    let playCount = 0;
    const media = createMedia({
      play() {
        playCount += 1;
        return Promise.resolve();
      },
      waitForDecodedFrame(signal) {
        signals.push(signal);
        return frames[frameIndex++].promise;
      },
    });
    media.setCurrentTime(2);
    const controller = createJourneySegmentController({
      clock: createClock(),
      fps: 25,
      media,
      scenes: shortScenes,
    });
    await controller.initialize();
    const firstOperation = controller.request(1, "scroll");
    await Promise.resolve();

    const retryOperation = controller[method]();
    await Promise.resolve();

    assert.equal(signals[0].aborted, true);
    assert.equal(controller.state().status, "playing");
    assert.equal(controller.state().retryCount, 1);
    assert.equal(playCount, 2);

    await controller[method]();

    assert.equal(signals[1].aborted, true);
    assert.equal(controller.state().status, "fallback");
    assert.equal(controller.state().fallbackReason, fallbackReason);
    assert.deepEqual(media.calls.at(-1), ["unload"]);
    frames[0].resolve(4);
    frames[1].resolve(4);
    await Promise.all([firstOperation, retryOperation]);
  }
});

test("operation watchdog retries once before verified timeout fallback", async () => {
  const clock = createClock();
  const frames = [deferred(), deferred()];
  const signals = [];
  let frameIndex = 0;
  const media = createMedia({
    play: () => Promise.resolve(),
    waitForDecodedFrame(signal) {
      signals.push(signal);
      return frames[frameIndex++].promise;
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock,
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  const firstOperation = controller.request(1, "scroll");
  await Promise.resolve();

  clock.fireTimeout(800);
  await Promise.resolve();

  assert.equal(signals[0].aborted, true);
  assert.equal(controller.state().status, "playing");
  assert.equal(controller.state().retryCount, 1);

  clock.fireTimeout(800);
  await Promise.resolve();

  assert.equal(signals[1].aborted, true);
  assert.equal(controller.state().status, "fallback");
  assert.equal(controller.state().fallbackReason, "waiting");
  assert.deepEqual(media.calls.at(-1), ["unload"]);
  frames[0].resolve(4);
  frames[1].resolve(4);
  await firstOperation;
});

test("checkpoint confirmation reconciles the next pending target", async () => {
  const firstFrame = deferred();
  let frameCount = 0;
  let playCount = 0;
  const sequentialScenes = [
    { id: "intro", start: 0.05, end: 0.15, still: "/intro.jpg" },
    { id: "beach", start: 0.15, end: 0.25, still: "/beach.jpg" },
    { id: "bar", start: 0.25, end: 0.35, still: "/bar.jpg" },
  ];
  const media = createMedia({
    play() {
      playCount += 1;
      return Promise.resolve();
    },
    waitForDecodedFrame() {
      frameCount += 1;
      if (frameCount === 1) {
        return firstFrame.promise;
      }
      const frameTime = frameCount === 2 ? 4 : 6;
      media.setCurrentTime(frameTime);
      return Promise.resolve(frameTime);
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: sequentialScenes,
  });
  await controller.initialize();
  const firstSegment = controller.request(1, "scroll");
  await Promise.resolve();
  await controller.request(2, "scroll");

  media.setCurrentTime(4);
  firstFrame.resolve(4);
  await firstSegment;

  assert.equal(playCount, 2);
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 2);
  assert.equal(controller.state().segmentTargetIndex, null);
});

test("visibility resume verifies the active checkpoint before playback", async () => {
  const hiddenFrame = deferred();
  const signals = [];
  let frameCount = 0;
  let playCount = 0;
  const media = createMedia({
    play() {
      playCount += 1;
      return Promise.resolve();
    },
    waitForDecodedFrame(signal) {
      signals.push(signal);
      frameCount += 1;
      if (frameCount === 1) {
        return hiddenFrame.promise;
      }
      if (frameCount >= 3) {
        media.setCurrentTime(4);
      }
      return Promise.resolve(media.currentTime());
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: shortScenes,
  });
  await controller.initialize();
  const hiddenOperation = controller.request(1, "scroll");
  await Promise.resolve();

  await controller.visibilityHidden();

  assert.equal(signals[0].aborted, true);
  assert.equal(controller.state().status, "suspended");
  assert.equal(controller.state().suspendReason, "visibility");

  await controller.visibilityVisible();

  assert.equal(playCount, 2);
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 1);
  assert.equal(controller.state().fallbackReason, null);
  hiddenFrame.resolve(4);
  await hiddenOperation;
});

test("visibility restores a paused checkpoint before its pending target", async () => {
  const interruptedConfirmation = deferred();
  let frameCount = 0;
  let playCount = 0;
  const sequentialScenes = [
    { id: "intro", start: 0.05, end: 0.15, still: "/intro.jpg" },
    { id: "beach", start: 0.15, end: 0.25, still: "/beach.jpg" },
    { id: "bar", start: 0.25, end: 0.35, still: "/bar.jpg" },
  ];
  const media = createMedia({
    play() {
      playCount += 1;
      return Promise.resolve();
    },
    waitForDecodedFrame() {
      frameCount += 1;
      if (frameCount === 1) {
        media.setCurrentTime(4);
        return Promise.resolve(4);
      }
      if (frameCount === 2) {
        return interruptedConfirmation.promise;
      }
      if (frameCount >= 5) {
        media.setCurrentTime(6);
      }
      return Promise.resolve(media.currentTime());
    },
  });
  media.setCurrentTime(2);
  const controller = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media,
    scenes: sequentialScenes,
  });
  await controller.initialize();
  const interruptedPlayback = controller.request(1, "scroll");
  await controller.request(2, "scroll");
  for (let turn = 0; turn < 4; turn += 1) {
    await Promise.resolve();
  }
  assert.equal(controller.state().status, "checkpoint_paused");

  await controller.visibilityHidden();
  await controller.visibilityVisible();

  assert.deepEqual(
    media.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ),
    [
      ["fastSeek", 2],
      ["seekExact", 4],
    ],
  );
  assert.equal(playCount, 2);
  assert.equal(controller.state().status, "idle");
  assert.equal(controller.state().currentIndex, 2);
  interruptedConfirmation.resolve(4);
  await interruptedPlayback;
});

test("failed pre-roll verification retries exact before fallback", async () => {
  let recoveringFrame = 0;
  const recoveringMedia = createMedia({
    play: () => Promise.resolve(),
    waitForDecodedFrame() {
      recoveringFrame += 1;
      if (recoveringFrame === 1) {
        return Promise.resolve(4.2);
      }
      if (recoveringFrame >= 3) {
        recoveringMedia.setCurrentTime(6);
      }
      return Promise.resolve(recoveringMedia.currentTime());
    },
  });
  recoveringMedia.setCurrentTime(2);
  const recoveringController = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media: recoveringMedia,
    scenes,
  });
  await recoveringController.initialize();

  await recoveringController.request(1, "scroll");

  assert.deepEqual(
    recoveringMedia.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ).map(([name]) => name),
    ["fastSeek", "seekExact"],
  );
  assert.equal(recoveringController.state().status, "idle");
  assert.equal(recoveringController.state().currentIndex, 1);
  assert.equal(recoveringMedia.calls.some(([name]) => name === "unload"), false);

  const failingMedia = createMedia({
    play() {
      failingMedia.calls.push(["play"]);
      return Promise.resolve();
    },
    waitForDecodedFrame: () => Promise.resolve(4.2),
  });
  failingMedia.setCurrentTime(2);
  const failingController = createJourneySegmentController({
    clock: createClock(),
    fps: 25,
    media: failingMedia,
    scenes,
  });
  await failingController.initialize();

  await failingController.request(1, "scroll");

  assert.deepEqual(
    failingMedia.calls.filter(
      ([name]) => name === "fastSeek" || name === "seekExact",
    ).map(([name]) => name),
    ["fastSeek", "seekExact"],
  );
  assert.equal(failingMedia.calls.some(([name]) => name === "play"), false);
  assert.equal(failingController.state().status, "fallback");
  assert.deepEqual(failingMedia.calls.at(-1), ["unload"]);
});
