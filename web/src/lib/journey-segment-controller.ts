import {
  createJourneyCheckpointManifest,
  type JourneyCheckpoint,
} from "./journey-checkpoints.ts";
import {
  createJourneyMachineState,
  reduceJourneyMachine,
  type JourneyMachineState,
} from "./journey-segment-machine.ts";

export interface JourneyMediaAdapter {
  currentTime(): number;
  duration(): number;
  readyState(): number;
  paused(): boolean;
  waitForMetadata(signal: AbortSignal): Promise<number>;
  play(): Promise<void>;
  pause(): void;
  fastSeek?(time: number): void;
  seekExact(time: number): void;
  setPlaybackRate(rate: number): void;
  waitForDecodedFrame(signal: AbortSignal): Promise<number>;
  unload(): void;
}

export interface JourneyClock {
  now(): number;
  nextFrame(callback: () => void): number;
  cancelFrame(id: number): void;
  timeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

type JourneyCheckpointScene = {
  id: string;
  start: number;
  end: number;
  still: string;
};

type JourneySegmentControllerOptions = {
  media: JourneyMediaAdapter;
  clock: JourneyClock;
  scenes: readonly JourneyCheckpointScene[];
  fps: number;
  initialIndex?: number;
};

const CHECKPOINT_TOLERANCE_SECONDS = 0.15;
const PAUSE_LEAD_SECONDS = 0.08;
const PRE_ROLL_SECONDS = 2.25;
const PRE_ROLL_THRESHOLD_SECONDS = 3.25;
const OPERATION_TIMEOUT_MS = 800;

type ActiveOperation = {
  abortController: AbortController;
  requestId: number;
  timeoutId: number;
};

export function createJourneySegmentController({
  media,
  clock,
  scenes,
  fps,
  initialIndex = 0,
}: JourneySegmentControllerOptions) {
  let checkpoints: JourneyCheckpoint[] | null = null;
  let state: JourneyMachineState = createJourneyMachineState({
    currentIndex: initialIndex,
  });
  let activeOperation: ActiveOperation | null = null;
  let activeSource: "intro" | "scroll" | "rail" = "scroll";
  let queuedSource: "intro" | "scroll" | "rail" | null = null;

  function isActive(operation: ActiveOperation) {
    return (
      activeOperation === operation &&
      !operation.abortController.signal.aborted &&
      state.requestId === operation.requestId
    );
  }

  function cancelOperation() {
    if (activeOperation === null) {
      return;
    }
    activeOperation.abortController.abort();
    clock.clearTimeout(activeOperation.timeoutId);
    activeOperation = null;
    media.pause();
  }

  function beginOperation(
    requestId: number,
    onTimeout?: (operation: ActiveOperation) => void,
  ) {
    cancelOperation();
    const operation: ActiveOperation = {
      abortController: new AbortController(),
      requestId,
      timeoutId: 0,
    };
    activeOperation = operation;
    operation.timeoutId = clock.timeout(() => {
      if (isActive(operation)) {
        if (onTimeout) {
          onTimeout(operation);
        } else {
          void interrupt("WAITING");
        }
      }
    }, OPERATION_TIMEOUT_MS);
    return operation;
  }

  function releaseOperation(operation: ActiveOperation) {
    clock.clearTimeout(operation.timeoutId);
    if (activeOperation === operation) {
      activeOperation = null;
    }
  }

  async function waitForFrame(operation: ActiveOperation) {
    try {
      return await media.waitForDecodedFrame(
        operation.abortController.signal,
      );
    } catch (error) {
      if (!isActive(operation)) {
        return null;
      }
      throw error;
    }
  }

  async function playToCheckpoint(
    targetIndex: number,
    requestId: number,
    source: "intro" | "scroll" | "rail",
  ) {
    if (checkpoints === null) {
      throw new Error("Journey controller must be initialized before playback");
    }

    const handlePlaybackTimeout = (timedOutOperation: ActiveOperation) => {
      if (state.status === "checkpoint_paused") {
        void retryCheckpointConfirmation(
          timedOutOperation,
          targetIndex,
          requestId,
        );
      } else {
        void interrupt("WAITING");
      }
    };
    let operation = beginOperation(requestId, handlePlaybackTimeout);
    const targetTime = checkpoints[targetIndex].time;
    let gap = Math.max(0, targetTime - media.currentTime());
    if (source !== "intro" && gap > PRE_ROLL_THRESHOLD_SECONDS) {
      const preRollTime = Math.max(0, targetTime - PRE_ROLL_SECONDS);
      if (media.fastSeek) {
        media.fastSeek(preRollTime);
      } else {
        media.seekExact(preRollTime);
      }
      let decodedTime = await waitForFrame(operation);
      if (decodedTime === null || !isActive(operation)) {
        return;
      }
      if (
        Math.abs(decodedTime - preRollTime) > CHECKPOINT_TOLERANCE_SECONDS
      ) {
        state = reduceJourneyMachine(state, {
          type: "WAITING",
          requestId,
        });
        cancelOperation();
        if (state.status === "fallback") {
          media.pause();
          media.unload();
          return;
        }
        const retryRequestId = state.requestId;
        state = reduceJourneyMachine(state, {
          type: "RETRY_SUCCEEDED",
          requestId: retryRequestId,
        });
        requestId = state.requestId;
        operation = beginOperation(requestId, handlePlaybackTimeout);
        media.seekExact(preRollTime);
        decodedTime = await waitForFrame(operation);
        if (decodedTime === null || !isActive(operation)) {
          return;
        }
        if (
          Math.abs(decodedTime - preRollTime) >
          CHECKPOINT_TOLERANCE_SECONDS
        ) {
          state = reduceJourneyMachine(state, {
            type: "WAITING",
            requestId,
          });
          cancelOperation();
          if (state.status === "fallback") {
            media.pause();
            media.unload();
          }
          return;
        }
      }
      gap = Math.max(0, targetTime - media.currentTime());
    }
    media.setPlaybackRate(Math.min(1.25, Math.max(1, gap / 2.25)));
    try {
      await media.play();
    } catch {
      if (!isActive(operation)) {
        return;
      }
      state = reduceJourneyMachine(state, {
        type: "PLAY_REJECTED",
        requestId,
      });
      releaseOperation(operation);
      if (state.status === "fallback") {
        media.pause();
        media.unload();
      }
      return;
    }

    let frameTime = media.currentTime();
    while (frameTime < targetTime - PAUSE_LEAD_SECONDS) {
      const decodedTime = await waitForFrame(operation);
      if (decodedTime === null || !isActive(operation)) {
        return;
      }
      frameTime = decodedTime;
    }

    media.pause();
    state = reduceJourneyMachine(state, {
      type: "CHECKPOINT_REACHED",
      index: targetIndex,
      requestId,
    });
    const confirmedTime = await waitForFrame(operation);
    if (confirmedTime === null || !isActive(operation)) {
      return;
    }
    if (
      Math.abs(confirmedTime - targetTime) > CHECKPOINT_TOLERANCE_SECONDS
    ) {
      await retryCheckpointConfirmation(operation, targetIndex, requestId);
      return;
    }

    state = reduceJourneyMachine(state, {
      type: "CHECKPOINT_FRAME_CONFIRMED",
      index: targetIndex,
      requestId,
    });
    releaseOperation(operation);
    await reconcileOperation();
  }

  async function retryCheckpointConfirmation(
    operation: ActiveOperation,
    targetIndex: number,
    requestId: number,
  ) {
    if (!isActive(operation)) {
      return;
    }
    cancelOperation();
    await confirmCheckpointExactly(targetIndex, requestId);
  }

  async function confirmCheckpointExactly(
    targetIndex: number,
    requestId: number,
  ) {
    if (checkpoints === null) {
      throw new Error("Journey controller must be initialized before seeking");
    }
    const operation = beginOperation(requestId, (timedOutOperation) => {
      failCheckpointConfirmation(timedOutOperation, requestId);
    });
    const targetTime = checkpoints[targetIndex].time;
    media.seekExact(targetTime);
    const decodedTime = await waitForFrame(operation);
    if (decodedTime === null || !isActive(operation)) {
      return;
    }
    if (
      media.readyState() < 2 ||
      Math.abs(decodedTime - targetTime) > CHECKPOINT_TOLERANCE_SECONDS
    ) {
      failCheckpointConfirmation(operation, requestId);
      return;
    }

    releaseOperation(operation);
    state = reduceJourneyMachine(state, {
      type: "CHECKPOINT_FRAME_CONFIRMED",
      index: targetIndex,
      requestId,
    });
    await reconcileOperation();
  }

  function failCheckpointConfirmation(
    operation: ActiveOperation,
    requestId: number,
  ) {
    if (!isActive(operation)) {
      return;
    }
    cancelOperation();
    state = reduceJourneyMachine(state, {
      type: "METADATA_TIMEOUT",
      requestId,
    });
    media.pause();
    media.unload();
  }

  async function seekToCheckpoint(
    targetIndex: number,
    requestId: number,
    attempt: "primary" | "exact",
  ): Promise<void> {
    if (checkpoints === null) {
      throw new Error("Journey controller must be initialized before seeking");
    }

    const operation = beginOperation(requestId, (timedOutOperation) => {
      void failSeek(
        timedOutOperation,
        targetIndex,
        requestId,
        attempt,
      );
    });
    const targetTime = checkpoints[targetIndex].time;
    if (attempt === "primary" && media.fastSeek) {
      media.fastSeek(targetTime);
    } else {
      media.seekExact(targetTime);
    }

    let decodedTime: number;
    try {
      decodedTime = await media.waitForDecodedFrame(
        operation.abortController.signal,
      );
    } catch {
      if (!isActive(operation)) {
        return;
      }
      decodedTime = Number.NaN;
    }
    if (!isActive(operation)) {
      return;
    }

    if (
      media.readyState() < 2 ||
      !Number.isFinite(decodedTime) ||
      Math.abs(decodedTime - targetTime) > CHECKPOINT_TOLERANCE_SECONDS
    ) {
      await failSeek(operation, targetIndex, requestId, attempt);
      return;
    }

    releaseOperation(operation);
    state = reduceJourneyMachine(state, {
      type: "CHECKPOINT_FRAME_CONFIRMED",
      index: targetIndex,
      requestId,
    });
    await reconcileOperation();
  }

  async function failSeek(
    operation: ActiveOperation,
    targetIndex: number,
    requestId: number,
    attempt: "primary" | "exact",
  ) {
    if (!isActive(operation)) {
      return;
    }
    cancelOperation();
    const eventType =
      attempt === "primary" ? "SEEK_PRIMARY_FAILED" : "SEEK_EXACT_FAILED";
    state = reduceJourneyMachine(state, {
      type: eventType,
      requestId,
    });
    if (state.status === "fallback") {
      media.pause();
      media.unload();
      return;
    }
    await seekToCheckpoint(targetIndex, state.requestId, "exact");
  }

  function reconcileOperation(): Promise<void> {
    if (
      state.status === "checkpoint_paused" &&
      state.segmentTargetIndex !== null
    ) {
      return confirmCheckpointExactly(
        state.segmentTargetIndex,
        state.requestId,
      );
    }
    if (state.status === "playing" && state.segmentTargetIndex !== null) {
      const source = queuedSource ?? activeSource;
      queuedSource = null;
      activeSource = source;
      return playToCheckpoint(
        state.segmentTargetIndex,
        state.requestId,
        source,
      );
    }
    if (
      (state.status === "seeking" || state.status === "suspended") &&
      state.segmentTargetIndex !== null &&
      state.seekAttempt !== null
    ) {
      return seekToCheckpoint(
        state.segmentTargetIndex,
        state.requestId,
        state.seekAttempt,
      );
    }
    return Promise.resolve();
  }

  function interrupt(
    eventType: "WAITING" | "STALLED" | "SYSTEM_PAUSED",
  ): Promise<void> {
    const requestId = state.requestId;
    const targetIndex = state.segmentTargetIndex;
    state = reduceJourneyMachine(state, { type: eventType, requestId });
    if (state.requestId === requestId) {
      return Promise.resolve();
    }

    cancelOperation();
    if (state.status === "fallback") {
      media.pause();
      media.unload();
      return Promise.resolve();
    }
    if (state.status !== "buffering" || targetIndex === null) {
      return Promise.resolve();
    }

    const retryRequestId = state.requestId;
    state = reduceJourneyMachine(state, {
      type: "RETRY_SUCCEEDED",
      requestId: retryRequestId,
    });
    if (state.status === "playing") {
      return playToCheckpoint(targetIndex, state.requestId, activeSource);
    }
    if (state.status === "seeking" && state.seekAttempt !== null) {
      return seekToCheckpoint(
        targetIndex,
        state.requestId,
        state.seekAttempt,
      );
    }
    return Promise.resolve();
  }

  function visibilityEvent(
    eventType: "VISIBILITY_HIDDEN" | "VISIBILITY_VISIBLE" | "PAGE_SHOWN",
  ) {
    const requestId = state.requestId;
    state = reduceJourneyMachine(state, { type: eventType });
    if (state.requestId !== requestId) {
      cancelOperation();
    }
    return reconcileOperation();
  }

  return {
    async initialize() {
      const abortController = new AbortController();
      let timeoutId = 0;
      const timedOut = new Promise<null>((resolve) => {
        timeoutId = clock.timeout(() => {
          abortController.abort();
          state = reduceJourneyMachine(state, {
            type: "METADATA_TIMEOUT",
            requestId: state.requestId,
          });
          media.pause();
          media.unload();
          resolve(null);
        }, 3_000);
      });
      const duration = await Promise.race([
        media.waitForMetadata(abortController.signal),
        timedOut,
      ]);
      clock.clearTimeout(timeoutId);
      if (duration === null) {
        return null;
      }
      checkpoints = createJourneyCheckpointManifest(scenes, duration, fps);
      return checkpoints;
    },
    manifest() {
      return checkpoints;
    },
    request(index: number, source: "intro" | "scroll" | "rail") {
      const previousRequestId = state.requestId;
      state = reduceJourneyMachine(state, { type: "REQUEST", index, source });
      if (
        state.requestId === previousRequestId &&
        state.pendingTargetIndex !== null
      ) {
        queuedSource = source;
      }
      if (state.requestId !== previousRequestId) {
        queuedSource = null;
        cancelOperation();
      }
      if (
        state.status === "playing" &&
        state.segmentTargetIndex !== null &&
        state.requestId !== previousRequestId
      ) {
        activeSource = source;
        return playToCheckpoint(
          state.segmentTargetIndex,
          state.requestId,
          source,
        );
      }
      if (
        (state.status === "seeking" || state.status === "suspended") &&
        state.segmentTargetIndex !== null &&
        state.seekAttempt !== null &&
        state.requestId !== previousRequestId
      ) {
        return seekToCheckpoint(
          state.segmentTargetIndex,
          state.requestId,
          state.seekAttempt,
        );
      }
      return Promise.resolve();
    },
    async unlock() {
      if (state.status !== "unlocking" || state.segmentTargetIndex === null) {
        return;
      }

      const requestId = state.requestId;
      const targetIndex = state.segmentTargetIndex;
      const operation = beginOperation(requestId);
      try {
        await media.play();
      } catch {
        if (!isActive(operation)) {
          return;
        }
        releaseOperation(operation);
        state = reduceJourneyMachine(state, {
          type: "UNLOCK_CONFIRMED",
          requestId,
        });
        state = reduceJourneyMachine(state, {
          type: "PLAY_REJECTED",
          requestId: state.requestId,
        });
        media.pause();
        media.unload();
        return;
      }
      if (!isActive(operation)) {
        return;
      }

      media.pause();
      releaseOperation(operation);
      state = reduceJourneyMachine(state, {
        type: "UNLOCK_CONFIRMED",
        requestId,
      });
      await playToCheckpoint(targetIndex, state.requestId, activeSource);
    },
    waiting() {
      return interrupt("WAITING");
    },
    stalled() {
      return interrupt("STALLED");
    },
    systemPaused() {
      return interrupt("SYSTEM_PAUSED");
    },
    visibilityHidden() {
      return visibilityEvent("VISIBILITY_HIDDEN");
    },
    visibilityVisible() {
      return visibilityEvent("VISIBILITY_VISIBLE");
    },
    pageShown() {
      return visibilityEvent("PAGE_SHOWN");
    },
    state() {
      return state;
    },
  };
}
