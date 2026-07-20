"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JourneyCheckpoint } from "@/lib/journey-checkpoints";
import { JOURNEY_FRAME_TOLERANCE_SECONDS, JOURNEY_SEEK_TOLERANCE_SECONDS, planJourneyClip } from "@/lib/journey-clip-plan";
import {
  createJourneyClipRuntime, type JourneyClipMedia,
  isJourneyFallbackFrameReady, type JourneyClipPlayerState,
  type JourneyClipRuntime,
} from "@/lib/journey-clip-runtime";
import type { NavigationSource } from "@/lib/journey-playback";
type Options = {
  checkpoints: readonly JourneyCheckpoint[];
  initialIndex?: number; reducedMotion?: boolean;
};
type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (
    _now: number, metadata: { mediaTime: number },
  ) => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};
const clampIndex = (index: number, count: number) =>
  Math.min(Math.max(Math.trunc(index), 0), Math.max(count - 1, 0));
function makeState(
  checkpoints: readonly JourneyCheckpoint[],
  index: number,
  reducedMotion: boolean,
): JourneyClipPlayerState {
  const initial = clampIndex(index, checkpoints.length);
  return {
    status: "idle", confirmedIndex: initial, requestedIndex: initial,
    targetIndex: null, targetTime: checkpoints[initial]?.time ?? 0,
    coverIndex: null,
    mediaMode: reducedMotion ? "stills" : "video",
    fallbackReason: null, interruptionRetries: 0, disposed: false,
  };
}
function waitForEvent(
  video: HTMLVideoElement,
  signal: AbortSignal,
  events: readonly string[],
) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      events.forEach((event) => video.removeEventListener(event, finish));
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    events.forEach((event) => video.addEventListener(event, finish, { once: true }));
  });
}
function fallbackFrame(
  video: HTMLVideoElement,
  signal: AbortSignal,
  seeking: boolean,
) {
  return new Promise<number>((resolve, reject) => {
    const startTime = video.currentTime;
    const eventName = seeking ? "seeked" : "timeupdate";
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      video.removeEventListener(eventName, frame);
    };
    const frame = (event: Event) => {
      if (!isJourneyFallbackFrameReady(
        event.type, seeking, startTime, video.currentTime,
      )) return;
      cleanup();
      resolve(video.currentTime);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    video.addEventListener(eventName, frame);
  });
}
function decodedFrame(
  video: HTMLVideoElement,
  signal: AbortSignal,
  seeking: boolean,
) {
  const frameVideo = video as FrameVideo;
  if (!frameVideo.requestVideoFrameCallback) {
    return fallbackFrame(video, signal, seeking);
  }
  return new Promise<number>((resolve, reject) => {
    const id = frameVideo.requestVideoFrameCallback!((_now, metadata) => {
      signal.removeEventListener("abort", abort);
      resolve(metadata.mediaTime);
    });
    const abort = () => {
      frameVideo.cancelVideoFrameCallback?.(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}
function mediaAdapter(
  video: HTMLVideoElement | null,
  expectedPause: { current: boolean },
): JourneyClipMedia {
  if (!video) {
    return {
      currentTime: () => 0,
      readyState: () => 4,
      play: async () => {}, pause: () => {}, seek: () => {},
      setPlaybackRate: () => {},
      waitForDecodedFrame: async () => 0,
      waitForPlayable: async () => {}, unload: () => {},
    };
  }
  return {
    currentTime: () => video.currentTime,
    readyState: () => video.readyState,
    async play() {
      await video.play();
      expectedPause.current = false;
    },
    pause() {
      expectedPause.current = true;
      video.pause();
    },
    seek: (time) => { video.currentTime = time; },
    setPlaybackRate: (rate) => { video.playbackRate = Math.min(Math.max(rate, 1), 1.25); },
    waitForDecodedFrame: (signal, expectedTime) =>
      decodedFrame(video, signal, expectedTime !== undefined),
    waitForPlayable: (signal) =>
      video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
        ? Promise.resolve()
        : waitForEvent(video, signal, ["canplay", "loadeddata", "playing"]),
    unload() {
      expectedPause.current = true;
      video.pause();
      video.removeAttribute("src");
      video.querySelectorAll("source").forEach((item) => item.removeAttribute("src"));
      video.load();
    },
  };
}
export function useJourneyClipPlayer({ checkpoints, initialIndex = 0, reducedMotion = false }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const runtimeRef = useRef<JourneyClipRuntime | null>(null);
  const expectedPause = useRef(false);
  const [state, setState] = useState(() =>
    makeState(checkpoints, initialIndex, reducedMotion),
  );
  const [selectedStill, setSelectedStill] = useState(
    checkpoints[clampIndex(initialIndex, checkpoints.length)]?.still ?? null,
  );
  const confirmedIndexRef = useRef(state.confirmedIndex);
  const requestedIndexRef = useRef(state.requestedIndex);
  useEffect(() => {
    if (!checkpoints.length) return;
    const video = videoRef.current;
    const runtime = createJourneyClipRuntime({
      checkpoints,
      clock: {
        timeout: (callback, ms) => window.setTimeout(callback, ms),
        clearTimeout: (id) => window.clearTimeout(id),
        nextFrame: (callback) => window.requestAnimationFrame(callback),
        cancelFrame: (id) => window.cancelAnimationFrame(id),
      },
      media: mediaAdapter(video, expectedPause),
      planClip: planJourneyClip,
      seekToleranceSeconds: JOURNEY_SEEK_TOLERANCE_SECONDS,
      frameToleranceSeconds: JOURNEY_FRAME_TOLERANCE_SECONDS,
      initialIndex,
      reducedMotion,
      selectStill: setSelectedStill,
      onStateChange(next) {
        confirmedIndexRef.current = next.confirmedIndex;
        requestedIndexRef.current = next.requestedIndex;
        setState(next);
      },
    });
    runtimeRef.current = runtime;
    setState(runtime.state());
    const waiting = () => void runtime.waiting();
    const stalled = () => void runtime.stalled();
    const retry = () => void runtime.retryFromGesture();
    const error = () => runtime.mediaError();
    const pause = () => {
      if (expectedPause.current) {
        expectedPause.current = false;
      } else if (
        video &&
        runtime.state().status === "moving" &&
        video.currentTime < runtime.state().targetTime - JOURNEY_FRAME_TOLERANCE_SECONDS
      ) {
        void runtime.unexpectedPause();
      }
    };
    const visibility = () =>
      document.visibilityState === "hidden"
        ? runtime.visibilityHidden()
        : void runtime.visibilityVisible();
    const pageHide = () => runtime.pageHide();
    const pageShow = () => void runtime.pageShow();
    const listeners: [EventTarget, string, EventListener][] = [
      [document, "visibilitychange", visibility],
      [window, "pagehide", pageHide],
      [window, "pageshow", pageShow],
      [window, "pointerdown", retry],
      [window, "touchstart", retry],
    ];
    if (video) listeners.push(
      [video, "waiting", waiting], [video, "stalled", stalled],
      [video, "pause", pause], [video, "error", error],
    );
    video?.querySelectorAll("source").forEach((item) =>
      listeners.push([item, "error", error]),
    );
    listeners.forEach(([target, event, listener]) => target.addEventListener(event, listener));
    return () => {
      listeners.forEach(([target, event, listener]) => target.removeEventListener(event, listener));
      runtime.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
  }, [checkpoints, initialIndex, reducedMotion]);
  const request = useCallback(
    (index: number, source: NavigationSource) =>
      runtimeRef.current?.request(index, source) ?? Promise.resolve(),
    [],
  );
  const retry = useCallback(
    () => runtimeRef.current?.retryFromGesture() ?? Promise.resolve(),
    [],
  );
  const dispose = useCallback(() => {
    runtimeRef.current?.dispose();
    runtimeRef.current = null;
  }, []);
  return {
    videoRef, confirmedIndexRef, requestedIndexRef, state, selectedStill,
    request, retry, dispose,
  };
}
