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
    requestId: playing.requestId,
  });
  const confirmed = reduceJourneyMachine(reached, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 1,
    requestId: reached.requestId,
  });

  assert.equal(confirmed.status, "idle");
  assert.equal(confirmed.currentIndex, 1);
  assert.equal(confirmed.segmentTargetIndex, null);
  assert.equal(confirmed.requestId, reached.requestId + 1);

  const lateTimeout = reduceJourneyMachine(confirmed, {
    type: "METADATA_TIMEOUT",
    requestId: reached.requestId,
  });
  assert.strictEqual(lateTimeout, confirmed);
});

test("backward scroll waits for the active checkpoint frame before seeking", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 2 }),
    { type: "REQUEST", index: 3, source: "scroll" },
  );
  const queuedWhilePlaying = reduceJourneyMachine(playing, {
    type: "REQUEST",
    index: 1,
    source: "scroll",
  });

  assert.equal(queuedWhilePlaying.status, "playing");
  assert.equal(queuedWhilePlaying.segmentTargetIndex, 3);
  assert.equal(queuedWhilePlaying.pendingTargetIndex, 1);
  assert.equal(queuedWhilePlaying.requestId, playing.requestId);

  const reached = reduceJourneyMachine(queuedWhilePlaying, {
    type: "CHECKPOINT_REACHED",
    index: 3,
    requestId: queuedWhilePlaying.requestId,
  });
  const queuedWhilePaused = reduceJourneyMachine(reached, {
    type: "REQUEST",
    index: 0,
    source: "scroll",
  });

  assert.equal(queuedWhilePaused.status, "checkpoint_paused");
  assert.equal(queuedWhilePaused.segmentTargetIndex, 3);
  assert.equal(queuedWhilePaused.pendingTargetIndex, 0);
  assert.equal(queuedWhilePaused.requestId, reached.requestId);

  const confirmed = reduceJourneyMachine(queuedWhilePaused, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 3,
    requestId: queuedWhilePaused.requestId,
  });

  assert.equal(confirmed.currentIndex, 3);
  assert.equal(confirmed.status, "seeking");
  assert.equal(confirmed.segmentTargetIndex, 0);
  assert.equal(confirmed.pendingTargetIndex, null);
  assert.equal(confirmed.requestId, queuedWhilePaused.requestId + 1);
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

test("every request during seeking replaces it even when forward or current", () => {
  const firstSeek = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 2 }),
    { type: "REQUEST", index: 0, source: "rail" },
  );
  const forwardReplacement = reduceJourneyMachine(firstSeek, {
    type: "REQUEST",
    index: 5,
    source: "scroll",
  });

  assert.equal(forwardReplacement.status, "seeking");
  assert.equal(forwardReplacement.segmentTargetIndex, 5);
  assert.equal(forwardReplacement.requestId, firstSeek.requestId + 1);

  const currentReplacement = reduceJourneyMachine(forwardReplacement, {
    type: "REQUEST",
    index: 2,
    source: "scroll",
  });

  assert.equal(currentReplacement.status, "seeking");
  assert.equal(currentReplacement.segmentTargetIndex, 2);
  assert.equal(
    currentReplacement.requestId,
    forwardReplacement.requestId + 1,
  );
  assert.equal(currentReplacement.retryCount, 0);
  assert.equal(currentReplacement.seekAttempt, "primary");
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
  assert.equal(retried.requestId, unlocking.requestId + 1);

  const fallback = reduceJourneyMachine(retried, {
    type: "PLAY_REJECTED",
    requestId: retried.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.retryCount, 1);
  assert.equal(fallback.fallbackReason, "play_rejected");
});

test("Rail navigation cancels unlocking and starts a direct seek", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const unlocking = reduceJourneyMachine(playing, {
    type: "PLAY_REJECTED",
    requestId: playing.requestId,
  });

  const seeking = reduceJourneyMachine(unlocking, {
    type: "REQUEST",
    index: 4,
    source: "rail",
  });

  assert.equal(seeking.status, "seeking");
  assert.equal(seeking.segmentTargetIndex, 4);
  assert.equal(seeking.pendingTargetIndex, null);
  assert.equal(seeking.retryCount, 0);
  assert.equal(seeking.seekAttempt, "primary");
  assert.equal(seeking.requestId, unlocking.requestId + 1);
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
  assert.equal(resumed.requestId, buffering.requestId + 1);

  const fallback = reduceJourneyMachine(resumed, {
    type: "STALLED",
    requestId: resumed.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.fallbackReason, "stalled");
});

function createRetriedCheckpointPause() {
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

  return reduceJourneyMachine(resumed, {
    type: "CHECKPOINT_REACHED",
    index: 1,
    requestId: resumed.requestId,
  });
}

for (const eventType of [
  "WAITING",
  "STALLED",
  "SYSTEM_PAUSED",
  "PLAY_REJECTED",
]) {
  test(`${eventType} is ignored at a checkpoint after retry`, () => {
    const checkpointPaused = createRetriedCheckpointPause();
    assert.equal(checkpointPaused.status, "checkpoint_paused");
    assert.equal(checkpointPaused.retryCount, 1);

    const unchanged = reduceJourneyMachine(checkpointPaused, {
      type: eventType,
      requestId: checkpointPaused.requestId,
    });

    assert.strictEqual(unchanged, checkpointPaused);
  });
}

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

test("repeated requests during buffering preserve the single retry budget", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const retrying = reduceJourneyMachine(playing, {
    type: "WAITING",
    requestId: playing.requestId,
  });
  const firstQueued = reduceJourneyMachine(retrying, {
    type: "REQUEST",
    index: 3,
    source: "scroll",
  });
  const latestQueued = reduceJourneyMachine(firstQueued, {
    type: "REQUEST",
    index: 5,
    source: "scroll",
  });

  assert.equal(latestQueued.status, "buffering");
  assert.equal(latestQueued.segmentTargetIndex, 1);
  assert.equal(latestQueued.pendingTargetIndex, 5);
  assert.equal(latestQueued.retryCount, 1);
  assert.equal(latestQueued.requestId, retrying.requestId);

  const resumed = reduceJourneyMachine(latestQueued, {
    type: "RETRY_SUCCEEDED",
    requestId: latestQueued.requestId,
  });
  assert.equal(resumed.status, "playing");
  assert.equal(resumed.segmentTargetIndex, 1);
  assert.equal(resumed.pendingTargetIndex, 5);
  assert.equal(resumed.retryCount, 1);

  const fallback = reduceJourneyMachine(resumed, {
    type: "STALLED",
    requestId: resumed.requestId,
  });
  assert.equal(fallback.status, "fallback");
  assert.equal(fallback.fallbackReason, "stalled");
});

test("Rail navigation cancels buffering that would resume playing", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const buffering = reduceJourneyMachine(playing, {
    type: "WAITING",
    requestId: playing.requestId,
  });

  const seeking = reduceJourneyMachine(buffering, {
    type: "REQUEST",
    index: 4,
    source: "rail",
  });

  assert.equal(seeking.status, "seeking");
  assert.equal(seeking.segmentTargetIndex, 4);
  assert.equal(seeking.retryCount, 0);
  assert.equal(seeking.resumeStatus, null);
  assert.equal(seeking.requestId, buffering.requestId + 1);
});

test("Rail navigation replaces buffering that would resume seeking", () => {
  const firstSeek = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 3 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const buffering = reduceJourneyMachine(firstSeek, {
    type: "WAITING",
    requestId: firstSeek.requestId,
  });
  assert.equal(buffering.resumeStatus, "seeking");

  const replacement = reduceJourneyMachine(buffering, {
    type: "REQUEST",
    index: 5,
    source: "rail",
  });

  assert.equal(replacement.status, "seeking");
  assert.equal(replacement.segmentTargetIndex, 5);
  assert.equal(replacement.retryCount, 0);
  assert.equal(replacement.resumeStatus, null);
  assert.equal(replacement.requestId, buffering.requestId + 1);
});

test("requests while visibility-suspended only update the pending target", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 2, source: "scroll" },
  );
  const hidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });

  const requested = reduceJourneyMachine(hidden, {
    type: "REQUEST",
    index: 4,
    source: "scroll",
  });

  assert.equal(requested.status, "suspended");
  assert.equal(requested.suspendReason, "visibility");
  assert.equal(requested.segmentTargetIndex, 2);
  assert.equal(requested.pendingTargetIndex, 4);
  assert.equal(requested.retryCount, hidden.retryCount);
  assert.equal(requested.requestId, hidden.requestId);
});

test("Rail navigation while hidden replaces the operation resumed after reconcile", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 2, source: "scroll" },
  );
  const hidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });

  const redirected = reduceJourneyMachine(hidden, {
    type: "REQUEST",
    index: 5,
    source: "rail",
  });
  assert.equal(redirected.status, "suspended");
  assert.equal(redirected.suspendReason, "visibility");
  assert.equal(redirected.resumeStatus, "seeking");
  assert.equal(redirected.resumeTargetIndex, 5);
  assert.equal(redirected.resumeSeekAttempt, "primary");
  assert.equal(redirected.pendingTargetIndex, null);
  assert.equal(redirected.requestId, hidden.requestId + 1);

  const reconciling = reduceJourneyMachine(redirected, {
    type: "VISIBILITY_VISIBLE",
  });
  assert.equal(reconciling.status, "seeking");
  assert.equal(reconciling.segmentTargetIndex, 1);
  assert.equal(reconciling.resumeTargetIndex, 5);

  const resumed = reduceJourneyMachine(reconciling, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 1,
    requestId: reconciling.requestId,
  });
  assert.equal(resumed.status, "seeking");
  assert.equal(resumed.currentIndex, 1);
  assert.equal(resumed.segmentTargetIndex, 5);
  assert.equal(resumed.seekAttempt, "primary");
  assert.equal(resumed.resumeStatus, null);
});

test("a second hide during reconcile preserves the original resume metadata", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 4, source: "scroll" },
  );
  const firstHidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });
  const firstReconcile = reduceJourneyMachine(firstHidden, {
    type: "VISIBILITY_VISIBLE",
  });

  const secondHidden = reduceJourneyMachine(firstReconcile, {
    type: "VISIBILITY_HIDDEN",
  });
  assert.equal(secondHidden.status, "suspended");
  assert.equal(secondHidden.resumeStatus, "playing");
  assert.equal(secondHidden.resumeTargetIndex, 2);
  assert.equal(secondHidden.resumeSeekAttempt, null);
  assert.equal(secondHidden.pendingTargetIndex, 4);
  assert.equal(secondHidden.requestId, firstReconcile.requestId + 1);

  const secondReconcile = reduceJourneyMachine(secondHidden, {
    type: "PAGE_SHOWN",
  });
  assert.equal(secondReconcile.status, "seeking");
  assert.equal(secondReconcile.segmentTargetIndex, 1);
  assert.equal(secondReconcile.resumeStatus, "playing");
  assert.equal(secondReconcile.resumeTargetIndex, 2);
  assert.equal(secondReconcile.pendingTargetIndex, 4);

  const resumed = reduceJourneyMachine(secondReconcile, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 1,
    requestId: secondReconcile.requestId,
  });
  assert.equal(resumed.status, "playing");
  assert.equal(resumed.segmentTargetIndex, 2);
  assert.equal(resumed.pendingTargetIndex, 4);
});

test("motion pause during reconcile seeks the original resume target", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 2, source: "scroll" },
  );
  const hidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });
  const reconciling = reduceJourneyMachine(hidden, {
    type: "VISIBILITY_VISIBLE",
  });
  assert.equal(reconciling.segmentTargetIndex, 1);
  assert.equal(reconciling.resumeTargetIndex, 2);

  const motionPaused = reduceJourneyMachine(reconciling, {
    type: "MOTION_CHANGED",
    enabled: false,
  });
  assert.equal(motionPaused.status, "suspended");
  assert.equal(motionPaused.suspendReason, "motion");
  assert.equal(motionPaused.motionEnabled, false);
  assert.equal(motionPaused.segmentTargetIndex, 2);
  assert.equal(motionPaused.pendingTargetIndex, null);
  assert.equal(motionPaused.seekAttempt, "primary");
  assert.equal(motionPaused.requestId, reconciling.requestId + 1);

  const confirmed = reduceJourneyMachine(motionPaused, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 2,
    requestId: motionPaused.requestId,
  });
  assert.equal(confirmed.status, "suspended");
  assert.equal(confirmed.currentIndex, 2);
  assert.equal(confirmed.seekAttempt, null);
  assert.equal(confirmed.requestId, motionPaused.requestId + 1);
});

test("motion pause during reconcile prefers the latest pending intent", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 1 }),
    { type: "REQUEST", index: 4, source: "scroll" },
  );
  assert.equal(playing.segmentTargetIndex, 2);
  assert.equal(playing.pendingTargetIndex, 4);

  const hidden = reduceJourneyMachine(playing, {
    type: "VISIBILITY_HIDDEN",
  });
  const reconciling = reduceJourneyMachine(hidden, {
    type: "VISIBILITY_VISIBLE",
  });
  assert.equal(reconciling.segmentTargetIndex, 1);
  assert.equal(reconciling.resumeTargetIndex, 2);
  assert.equal(reconciling.pendingTargetIndex, 4);

  const motionPaused = reduceJourneyMachine(reconciling, {
    type: "MOTION_CHANGED",
    enabled: false,
  });
  assert.equal(motionPaused.status, "suspended");
  assert.equal(motionPaused.segmentTargetIndex, 4);
  assert.equal(motionPaused.pendingTargetIndex, null);
  assert.equal(motionPaused.seekAttempt, "primary");

  const confirmed = reduceJourneyMachine(motionPaused, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 4,
    requestId: motionPaused.requestId,
  });
  assert.equal(confirmed.status, "suspended");
  assert.equal(confirmed.currentIndex, 4);
  assert.equal(confirmed.seekAttempt, null);
});

for (const resumeEvent of ["VISIBILITY_VISIBLE", "PAGE_SHOWN"]) {
  test(`${resumeEvent} reconciles the active checkpoint before completion`, () => {
    const queued = reduceJourneyMachine(
      createJourneyMachineState({ currentIndex: 1 }),
      { type: "REQUEST", index: 4, source: "scroll" },
    );
    const buffering = reduceJourneyMachine(queued, {
      type: "WAITING",
      requestId: queued.requestId,
    });
    const playing = reduceJourneyMachine(buffering, {
      type: "RETRY_SUCCEEDED",
      requestId: buffering.requestId,
    });
    assert.equal(playing.retryCount, 1);

    const hidden = reduceJourneyMachine(playing, {
      type: "VISIBILITY_HIDDEN",
    });
    assert.equal(hidden.status, "suspended");
    assert.equal(hidden.suspendReason, "visibility");
    assert.equal(hidden.resumeStatus, "playing");
    assert.equal(hidden.segmentTargetIndex, 2);
    assert.equal(hidden.pendingTargetIndex, 4);
    assert.equal(hidden.requestId, playing.requestId + 1);

    const reconciling = reduceJourneyMachine(hidden, {
      type: resumeEvent,
    });
    assert.equal(reconciling.status, "seeking");
    assert.equal(reconciling.segmentTargetIndex, 1);
    assert.equal(reconciling.resumeStatus, "playing");
    assert.equal(reconciling.resumeTargetIndex, 2);
    assert.equal(reconciling.pendingTargetIndex, 4);
    assert.equal(reconciling.retryCount, hidden.retryCount);
    assert.equal(reconciling.seekAttempt, "primary");
    assert.equal(reconciling.suspendReason, null);
    assert.equal(reconciling.requestId, hidden.requestId + 1);

    const confirmed = reduceJourneyMachine(reconciling, {
      type: "CHECKPOINT_FRAME_CONFIRMED",
      index: 1,
      requestId: reconciling.requestId,
    });
    assert.equal(confirmed.status, "playing");
    assert.equal(confirmed.currentIndex, 1);
    assert.equal(confirmed.segmentTargetIndex, 2);
    assert.equal(confirmed.pendingTargetIndex, 4);
    assert.equal(confirmed.retryCount, reconciling.retryCount);
    assert.equal(confirmed.resumeStatus, null);
    assert.equal(confirmed.resumeTargetIndex, null);
    assert.equal(confirmed.requestId, reconciling.requestId + 1);
  });
}

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

test("fallback persists across motion changes and confirms canonical navigation", () => {
  const playing = reduceJourneyMachine(
    createJourneyMachineState({ currentIndex: 0 }),
    { type: "REQUEST", index: 1, source: "scroll" },
  );
  const fallback = reduceJourneyMachine(playing, {
    type: "METADATA_TIMEOUT",
    requestId: playing.requestId,
  });

  const motionDisabled = reduceJourneyMachine(fallback, {
    type: "MOTION_CHANGED",
    enabled: false,
  });
  assert.equal(motionDisabled.status, "fallback");
  assert.equal(motionDisabled.fallbackReason, "metadata_timeout");
  assert.equal(motionDisabled.motionEnabled, false);

  const requested = reduceJourneyMachine(motionDisabled, {
    type: "REQUEST",
    index: 4,
    source: "scroll",
  });
  assert.equal(requested.status, "fallback");
  assert.equal(requested.currentIndex, 0);
  assert.equal(requested.segmentTargetIndex, 4);
  assert.equal(requested.requestId, motionDisabled.requestId + 1);

  const confirmed = reduceJourneyMachine(requested, {
    type: "CHECKPOINT_FRAME_CONFIRMED",
    index: 4,
    requestId: requested.requestId,
  });
  assert.equal(confirmed.status, "fallback");
  assert.equal(confirmed.currentIndex, 4);
  assert.equal(confirmed.segmentTargetIndex, null);
  assert.equal(confirmed.fallbackReason, "metadata_timeout");
  assert.equal(confirmed.requestId, requested.requestId + 1);

  const motionEnabled = reduceJourneyMachine(confirmed, {
    type: "MOTION_CHANGED",
    enabled: true,
  });
  assert.equal(motionEnabled.status, "fallback");
  assert.equal(motionEnabled.fallbackReason, "metadata_timeout");
  assert.equal(motionEnabled.motionEnabled, true);
});
