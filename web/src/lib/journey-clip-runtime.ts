import type { JourneyCheckpoint } from "./journey-checkpoints";
import type { JourneyClipPlan } from "./journey-clip-plan";
import type { NavigationSource } from "./journey-playback";
export type JourneyClipPlayerState = {
  status: "idle" | "moving" | "waiting-for-gesture" | "fallback";
  confirmedIndex: number; requestedIndex: number;
  targetIndex: number | null;
  targetTime: number; coverIndex: number | null;
  mediaMode: "video" | "stills" | "fallback";
  fallbackReason: string | null;
  interruptionRetries: number; disposed: boolean;
};
export type JourneyClipMedia = {
  currentTime(): number;
  readyState(): number;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setPlaybackRate(rate: number): void;
  waitForDecodedFrame(signal: AbortSignal, expectedTime?: number): Promise<number>;
  waitForPlayable(signal: AbortSignal): Promise<void>;
  unload(): void;
};
type Clock = {
  timeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
  nextFrame(callback: () => void): number;
  cancelFrame(id: number): void;
};
type Operation = { controller: AbortController; token: number };
type Interruption = "waiting" | "stalled" | "unexpectedPause";
type Options = {
  checkpoints: readonly JourneyCheckpoint[]; clock: Clock; media: JourneyClipMedia;
  planClip(input: {
    currentTime: number;
    targetTime: number;
    source: NavigationSource;
    isIntro: boolean;
  }): JourneyClipPlan;
  seekToleranceSeconds: number; frameToleranceSeconds: number;
  selectStill(still: string): void;
  onStateChange?(state: JourneyClipPlayerState): void;
  initialIndex?: number;
  introDelayMs?: number;
  operationTimeoutMs?: number;
  reducedMotion?: boolean;
};
const aborted = () => new DOMException("Aborted", "AbortError");
const isAbort = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";
export const JOURNEY_OPERATION_TIMEOUT_MS = 2_500;
export function isJourneyFallbackFrameReady(
  event: string,
  seeking: boolean,
  startTime: number,
  currentTime: number,
) {
  if (!Number.isFinite(currentTime)) return false;
  return seeking
    ? event === "seeked"
    : event === "timeupdate" && currentTime > startTime;
}
export function syncJourneyClipIndexRefs(
  state: JourneyClipPlayerState,
  confirmedIndexRef: { current: number },
  requestedIndexRef: { current: number },
) {
  confirmedIndexRef.current = state.confirmedIndex;
  requestedIndexRef.current = state.requestedIndex;
}
export function createJourneyClipRuntime(options: Options) {
  const {
    checkpoints, clock, media, planClip, seekToleranceSeconds,
    frameToleranceSeconds, selectStill, onStateChange, initialIndex = 0,
    introDelayMs = 1_000,
    operationTimeoutMs = JOURNEY_OPERATION_TIMEOUT_MS,
    reducedMotion = false,
  } = options;
  if (!checkpoints.length) throw new Error("Journey requires checkpoints");
  const at = (index: number) =>
    checkpoints[Math.min(Math.max(Math.trunc(index), 0), checkpoints.length - 1)];
  const initial = at(initialIndex);
  let state: JourneyClipPlayerState = {
    status: "idle", confirmedIndex: initial.index, requestedIndex: initial.index,
    targetIndex: null, targetTime: initial.time, coverIndex: null,
    mediaMode: reducedMotion ? "stills" : "video",
    fallbackReason: null, interruptionRetries: 0, disposed: false,
  };
  let operation: Operation | null = null;
  let operationToken = 0;
  let task: Promise<void> | null = null;
  let source: NavigationSource = "scroll";
  let playRejections = 0;
  let hidden = false;
  const frames = new Set<number>();
  const snapshot = () => ({ ...state });
  const set = (patch: Partial<JourneyClipPlayerState>) => {
    state = { ...state, ...patch };
    onStateChange?.(snapshot());
  };
  const active = (candidate: Operation) =>
    !state.disposed && operation === candidate && !candidate.controller.signal.aborted;
  function stop() {
    if (!operation) return;
    const current = operation;
    operation = null;
    current.controller.abort();
    media.pause();
  }
  function begin() {
    stop();
    operation = { controller: new AbortController(), token: ++operationToken };
    return operation;
  }
  function release(candidate: Operation) {
    if (operation === candidate) operation = null;
    candidate.controller.abort();
  }
  function watched<T>(candidate: Operation, promise: Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      let done = false;
      const finish = (callback: () => void) => {
        if (done) return;
        done = true;
        clock.clearTimeout(timer);
        candidate.controller.signal.removeEventListener("abort", onAbort);
        callback();
      };
      const onAbort = () => finish(() => reject(aborted()));
      const timer = clock.timeout(
        () => finish(() => reject(new Error("Journey operation timed out"))),
        operationTimeoutMs,
      );
      candidate.controller.signal.addEventListener("abort", onAbort, { once: true });
      promise.then(
        (value) => finish(() => resolve(value)),
        (error) => finish(() => reject(error)),
      );
    });
  }
  function delay(candidate: Operation) {
    return new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clock.clearTimeout(timer);
        reject(aborted());
      };
      const timer = clock.timeout(() => {
        candidate.controller.signal.removeEventListener("abort", onAbort);
        resolve();
      }, introDelayMs);
      candidate.controller.signal.addEventListener("abort", onAbort, { once: true });
    });
  }
  function showStill(
    index: number,
    mode: "stills" | "fallback",
    reason = state.fallbackReason,
  ) {
    const destination = at(index);
    if (mode === "fallback") {
      stop();
      media.pause();
    }
    selectStill(destination.still);
    set({
      status: mode === "fallback" ? "fallback" : "idle",
      confirmedIndex: destination.index, requestedIndex: destination.index,
      targetIndex: null, targetTime: destination.time, coverIndex: null,
      mediaMode: mode, fallbackReason: reason,
    });
    if (mode === "fallback") media.unload();
  }
  function fallback(reason: string) {
    if (state.disposed || state.status === "fallback") return;
    showStill(state.requestedIndex, "fallback", reason);
  }
  async function verify(candidate: Operation, time: number, tolerance: number) {
    const decoded = await watched(
      candidate,
      media.waitForDecodedFrame(candidate.controller.signal, time),
    );
    return (
      active(candidate) &&
      media.readyState() >= 2 &&
      Number.isFinite(decoded) &&
      Math.abs(decoded - time) <= tolerance
    );
  }
  async function finishMove(
    candidate: Operation,
    destination: JourneyCheckpoint,
    play: Promise<void>,
  ) {
    try {
      try {
        await watched(candidate, play);
      } catch {
        if (!active(candidate)) return false;
        release(candidate);
        if (++playRejections === 1) set({ status: "waiting-for-gesture" });
        else fallback("play-rejected");
        return false;
      }
      let decoded = media.currentTime();
      while (decoded < destination.time - frameToleranceSeconds) {
        decoded = await watched(
          candidate,
          media.waitForDecodedFrame(candidate.controller.signal),
        );
        if (!active(candidate)) return false;
      }
      media.pause();
      media.seek(destination.time);
      if (!(await verify(candidate, destination.time, frameToleranceSeconds))) {
        fallback("checkpoint-confirmation-failed");
        return false;
      }
      release(candidate);
      playRejections = 0;
      set({
        status: "idle", confirmedIndex: destination.index, targetIndex: null,
        targetTime: destination.time, coverIndex: null, interruptionRetries: 0,
      });
      return true;
    } catch (error) {
      if (active(candidate) && !isAbort(error)) fallback("operation-timeout");
      return false;
    }
  }
  async function move(index: number, navigationSource: NavigationSource) {
    const destination = at(index);
    const candidate = begin();
    source = navigationSource;
    const plan = planClip({
      currentTime: media.currentTime(), targetTime: destination.time,
      source: navigationSource, isIntro: navigationSource === "intro",
    });
    set({
      status: "moving", targetIndex: destination.index,
      targetTime: destination.time,
      coverIndex: plan.seekTime === null ? null : destination.index,
      mediaMode: "video",
    });
    try {
      if (navigationSource === "intro") await delay(candidate);
      if (!active(candidate)) return false;
      if (plan.seekTime !== null) {
        media.pause();
        media.seek(plan.seekTime);
        if (!(await verify(candidate, plan.seekTime, seekToleranceSeconds))) {
          fallback("seek-failed");
          return false;
        }
      }
      media.setPlaybackRate(plan.playbackRate);
      return finishMove(candidate, destination, media.play());
    } catch (error) {
      if (active(candidate) && !isAbort(error)) fallback("operation-timeout");
      return false;
    }
  }
  function own(nextMove: Promise<boolean>) {
    const next = nextMove.then(async (confirmed) => {
      if (
        confirmed && !state.disposed && !hidden && state.status !== "fallback" &&
        state.requestedIndex !== state.confirmedIndex
      ) await start(state.requestedIndex, "scroll");
    });
    task = next;
    return next;
  }
  function start(index: number, navigationSource: NavigationSource) {
    return own(move(index, navigationSource));
  }
  function request(index: number, navigationSource: NavigationSource) {
    if (state.disposed) return Promise.resolve();
    const destination = at(index);
    if (state.status === "fallback") {
      showStill(destination.index, "fallback");
      return Promise.resolve();
    }
    if (reducedMotion) {
      showStill(destination.index, "stills", null);
      return Promise.resolve();
    }
    if (
      navigationSource === "rail" && state.status === "idle" &&
      destination.index === state.confirmedIndex
    ) return Promise.resolve();
    if (navigationSource === "rail") {
      playRejections = 0;
      set({ requestedIndex: destination.index, interruptionRetries: 0 });
    } else set({ requestedIndex: destination.index });
    if (
      navigationSource === "scroll" &&
      (state.status === "moving" || state.status === "waiting-for-gesture")
    ) return task ?? Promise.resolve();
    return hidden ? Promise.resolve() : start(destination.index, navigationSource);
  }
  function retryFromGesture() {
    if (state.disposed || hidden || state.status !== "waiting-for-gesture") {
      return Promise.resolve();
    }
    const destination = at(state.targetIndex ?? state.requestedIndex);
    const candidate = begin();
    set({ status: "moving", targetIndex: destination.index });
    return own(finishMove(candidate, destination, media.play()));
  }
  function interrupt(reason: Interruption) {
    if (state.disposed || state.status !== "moving") return Promise.resolve();
    if (state.interruptionRetries) {
      fallback(reason);
      return Promise.resolve();
    }
    const target = state.targetIndex ?? state.requestedIndex;
    stop();
    set({ status: "moving", interruptionRetries: 1 });
    const candidate = begin();
    const next = watched(
      candidate,
      media.waitForPlayable(candidate.controller.signal),
    )
      .then(() => {
        if (!active(candidate)) return;
        release(candidate);
        return start(target, source);
      })
      .catch((error: unknown) => {
        if (active(candidate) && !isAbort(error)) fallback(reason);
      });
    task = next;
    return next;
  }
  function suspend() {
    if (state.disposed) return;
    hidden = true;
    stop();
    set({
      status: state.status === "fallback" ? "fallback" : "idle",
      targetIndex: null, coverIndex: null,
    });
  }
  async function visibilityVisible() {
    if (state.disposed || !hidden || state.status === "fallback") return;
    hidden = false;
    const confirmed = at(state.confirmedIndex);
    const candidate = begin();
    set({
      status: "moving", targetIndex: confirmed.index,
      targetTime: confirmed.time, coverIndex: confirmed.index,
    });
    media.pause();
    media.seek(confirmed.time);
    try {
      if (!(await verify(candidate, confirmed.time, frameToleranceSeconds))) {
        fallback("visibility-reconciliation-failed");
        return;
      }
      release(candidate);
      set({ status: "idle", targetIndex: null, coverIndex: null });
      const resumeToken = candidate.token;
      let frame = 0;
      frame = clock.nextFrame(() => {
        frames.delete(frame);
        if (
          operationToken === resumeToken && !state.disposed && !hidden &&
          state.requestedIndex !== state.confirmedIndex
        ) {
          start(state.requestedIndex, "scroll");
        }
      });
      frames.add(frame);
    } catch (error) {
      if (active(candidate) && !isAbort(error)) {
        fallback("visibility-reconciliation-failed");
      }
    }
  }
  function dispose() {
    if (state.disposed) return;
    stop();
    frames.forEach((frame) => clock.cancelFrame(frame));
    frames.clear();
    state = { ...state, disposed: true };
  }
  return {
    request,
    retryFromGesture,
    waiting: () => interrupt("waiting"),
    stalled: () => interrupt("stalled"),
    unexpectedPause: () => interrupt("unexpectedPause"),
    visibilityHidden: suspend,
    visibilityVisible,
    pageHide: suspend,
    pageShow: visibilityVisible,
    mediaError: () => fallback("media-error"),
    dispose,
    state: snapshot,
  };
}
export type JourneyClipRuntime = ReturnType<typeof createJourneyClipRuntime>;
