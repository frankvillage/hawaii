import assert from "node:assert/strict";
import test from "node:test";

import {
  createJourneyMachineState,
  reduceJourneyMachine,
} from "../web/src/lib/journey-segment-machine.ts";

test("adjacent forward scroll starts one checkpoint segment", () => {
  const initial = createJourneyMachineState({ currentIndex: 0 });

  const next = reduceJourneyMachine(initial, {
    type: "REQUEST",
    index: 1,
    source: "scroll",
  });

  assert.equal(next.status, "playing");
  assert.equal(next.currentIndex, 0);
  assert.equal(next.segmentTargetIndex, 1);
  assert.equal(next.pendingTargetIndex, null);
  assert.equal(next.requestId, 1);
});

test("rapid forward scroll preserves the active endpoint and queues the destination", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );

  const queued = reduceJourneyMachine(playing, {
    type: "REQUEST",
    index: 4,
    source: "scroll",
  });

  assert.equal(queued.status, "playing");
  assert.equal(queued.segmentTargetIndex, 1);
  assert.equal(queued.pendingTargetIndex, 4);
  assert.equal(queued.requestId, playing.requestId);
});

test("checkpoint confirmation exposes the paused frame before the next segment", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const queued = reduceJourneyMachine(playing, {
    type: "REQUEST",
    index: 3,
    source: "scroll",
  });

  const reached = reduceJourneyMachine(queued, {
    type: "CHECKPOINT_REACHED",
    index: 1,
    requestId: queued.requestId,
  });
  assert.equal(reached.status, "checkpoint_paused");
  assert.equal(reached.currentIndex, 0);
  assert.equal(reached.segmentTargetIndex, 1);

  const confirmed = reduceJourneyMachine(reached, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 1,
    requestId: reached.requestId,
  });
  assert.equal(confirmed.currentIndex, 1);
  assert.equal(confirmed.status, "playing");
  assert.equal(confirmed.segmentTargetIndex, 2);
  assert.equal(confirmed.pendingTargetIndex, 3);
  assert.equal(confirmed.requestId, reached.requestId + 1);
});

test("checkpoint confirmation returns idle when no farther target is pending", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const reached = reduceJourneyMachine(playing, {
    type: "CHECKPOINT_REACHED",
    index: 1,
  });
  const confirmed = reduceJourneyMachine(reached, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 1,
  });

  assert.equal(confirmed.status, "idle");
  assert.equal(confirmed.currentIndex, 1);
  assert.equal(confirmed.segmentTargetIndex, null);
});

test("backward scroll starts a new seek request", () => {
  const initial = createJourneyMachineState({ currentIndex: 3 });

  const seeking = reduceJourneyMachine(initial, {
    type: "REQUEST",
    index: 2,
    source: "scroll",
  });

  assert.equal(seeking.status, "seeking");
  assert.equal(seeking.segmentTargetIndex, 2);
  assert.equal(seeking.requestId, 1);
  assert.equal(seeking.seekAttempt, "primary");
});

test("a distant Rail request seeks directly with a new request ID", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 2, source: "scroll" },
  );

  const seeking = reduceJourneyMachine(playing, {
    type: "REQUEST",
    index: 6,
    source: "rail",
  });

  assert.equal(seeking.status, "seeking");
  assert.equal(seeking.segmentTargetIndex, 6);
  assert.equal(seeking.pendingTargetIndex, null);
  assert.equal(seeking.requestId, playing.requestId + 1);
});

test("stale request events cannot mutate the active operation", () => {
  const first = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const active = reduceJourneyMachine(first, {
    type: "REQUEST",
    index: 4,
    source: "rail",
  });

  const stale = reduceJourneyMachine(active, {
    type: "CHECKPOINT_REACHED",
    index: 1,
    requestId: first.requestId,
  });

  assert.strictEqual(stale, active);
});

test("motion-disabled navigation stays suspended and requests a seek", () => {
  const suspended = createJourneyMachineState({
    currentIndex: 1,
    motionEnabled: false,
  });

  const requested = reduceJourneyMachine(suspended, {
    type: "REQUEST",
    index: 4,
    source: "scroll",
  });

  assert.equal(requested.status, "suspended");
  assert.equal(requested.motionEnabled, false);
  assert.equal(requested.segmentTargetIndex, 4);
  assert.equal(requested.seekAttempt, "primary");
  assert.equal(requested.requestId, suspended.requestId + 1);
});

test("disabling motion cancels playback and keeps the latest requested checkpoint", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const queued = reduceJourneyMachine(playing, {
    type: "REQUEST",
    index: 3,
    source: "scroll",
  });

  const suspended = reduceJourneyMachine(queued, {
    type: "MOTION_CHANGED",
    enabled: false,
  });

  assert.equal(suspended.status, "suspended");
  assert.equal(suspended.motionEnabled, false);
  assert.equal(suspended.segmentTargetIndex, 3);
  assert.equal(suspended.pendingTargetIndex, null);
  assert.equal(suspended.requestId, queued.requestId + 1);
});

test("metadata timeout enters fallback without changing the confirmed checkpoint", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );

  const fallback = reduceJourneyMachine(playing, {
    type: "METADATA_TIMEOUT",
    requestId: playing.requestId,
  });

  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.currentIndex, 0);
  assert.equal(fallback.segmentTargetIndex, 1);
  assert.equal(fallback.fallbackReason, "metadata_timeout");
});

test("play rejection allows one unlock retry and falls back on the second rejection", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );

  const unlocking = reduceJourneyMachine(playing, {
    type: "PLAY_REJECTED",
    requestId: playing.requestId,
  });
  assert.equal(unlocking.status, "unlocking");
  assert.equal(unlocking.retryCount, 1);
  assert.equal(unlocking.requestId, playing.requestId + 1);

  const retried = reduceJourneyMachine(unlocking, {
    type: "UNLOCK_CONFIRMED",
    requestId: unlocking.requestId,
  });
  assert.equal(retried.status, "playing");
  assert.equal(retried.retryCount, 1);

  const fallback = reduceJourneyMachine(retried, {
    type: "PLAY_REJECTED",
    requestId: retried.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.retryCount, 1);
  assert.equal(fallback.fallbackReason, "play_rejected");
});

for (const eventType of ["WAITING", "STALLED"]) {
  test(`${eventType} buffers the active endpoint and starts its only retry`, () => {
    const playing = reduceJourneyMachine(
      createJourneyMachineState({ currentIndex: 0 }),
      { type: "REQUEST", index: 1, source: "scroll" },
    );

    const buffering = reduceJourneyMachine(playing, {
      type: eventType,
      requestId: playing.requestId,
    });

    assert.equal(buffering.status, "buffering");
    assert.equal(buffering.segmentTargetIndex, 1);
    assert.equal(buffering.retryCount, 1);
    assert.equal(buffering.requestId, playing.requestId + 1);
    assert.equal(buffering.resumeStatus, "playing");
  });
}

test("a second buffering interruption after retry enters fallback", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const buffering = reduceJourneyMachine(playing, {
    type: "WAITING",
    requestId: playing.requestId,
  });
  const resumed = reduceJourneyMachine(buffering, {
    type: "RETRY_SUCCEEDED",
    requestId: buffering.requestId,
  });

  assert.equal(resumed.status, "playing");
  assert.equal(resumed.retryCount, 1);

  const fallback = reduceJourneyMachine(resumed, {
    type: "STALLED",
    requestId: resumed.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.fallbackReason, "stalled");
});

test("a Safari or system pause uses the same single retry budget", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 2 }),
    { type: "REQUEST", index: 3, source: "scroll" },
  );

  const buffering = reduceJourneyMachine(playing, {
    type: "SYSTEM_PAUSED",
    requestId: playing.requestId,
  });

  assert.equal(buffering.status, "buffering");
  assert.equal(buffering.retryCount, 1);
  assert.equal(buffering.resumeStatus, "playing");
  assert.equal(buffering.segmentTargetIndex, 3);
});

test("seek retries once with an exact assignment before verified fallback", () => {
  const seeking = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 4 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );

  const exactRetry = reduceJourneyMachine(seeking, {
    type: "SEEK_PRIMARY_FAILED",
    requestId: seeking.requestId,
  });
  assert.equal(exactRetry.status, "seeking");
  assert.equal(exactRetry.seekAttempt, "exact");
  assert.equal(exactRetry.retryCount, 1);
  assert.equal(exactRetry.requestId, seeking.requestId + 1);

  const fallback = reduceJourneyMachine(exactRetry, {
    type: "SEEK_EXACT_FAILED",
    requestId: exactRetry.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.segmentTargetIndex, 1);
  assert.equal(fallback.fallbackReason, "seek_exact_failed");
});

test("a new request cancels a retry and ignores its stale failure", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const retrying = reduceJourneyMachine(playing, {
    type: "WAITING",
    requestId: playing.requestId,
  });
  const replacement = reduceJourneyMachine(retrying, {
    type: "REQUEST",
    index: 5,
    source: "rail",
  });

  assert.equal(replacement.status, "seeking");
  assert.equal(replacement.retryCount, 0);
  assert.equal(replacement.requestId, retrying.requestId + 1);

  const stale = reduceJourneyMachine(replacement, {
    type: "STALLED",
    requestId: retrying.requestId,
  });
  assert.strictEqual(stale, replacement);
});

test("visibility suspension preserves and resumes the active operation", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 2, source: "scroll" },
  );

  const hidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });
  assert.equal(hidden.status, "suspended");
  assert.equal(hidden.suspendReason, "visibility");
  assert.equal(hidden.resumeStatus, "playing");
  assert.equal(hidden.segmentTargetIndex, 2);
  assert.equal(hidden.requestId, playing.requestId + 1);

  const visible = reduceJourneyMachine(hidden, {
    type: "VISIBILITY_VISIBLE",
  });
  assert.equal(visible.status, "playing");
  assert.equal(visible.segmentTargetIndex, 2);
  assert.equal(visible.suspendReason, null);
  assert.equal(visible.requestId, hidden.requestId + 1);
});

test("pageshow does not resume playback while motion remains disabled", () => {
  const suspended = createJourneyMachineState({
    currentIndex: 2,
    motionEnabled: false,
  });
  const requested = reduceJourneyMachine(suspended, {
    type: "REQUEST",
    index: 4,
    source: "rail",
  });

  const pageShown = reduceJourneyMachine(requested, { type: "PAGE_SHOWN" });

  assert.equal(pageShown.status, "suspended");
  assert.equal(pageShown.motionEnabled, false);
  assert.equal(pageShown.segmentTargetIndex, 4);
});
