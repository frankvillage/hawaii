"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { JourneyScrollCue } from "@/components/home/journey-scroll-cue";
import {
  isRecoverablePlaybackError,
  readJourneyVideoOverride,
  shouldEnableJourneyVideo,
  writeJourneyVideoOverride,
} from "@/lib/journey-media-preference";

import {
  JOURNEY_CONFIRMED_EVENT,
  JOURNEY_NAVIGATE_EVENT,
  type NavigationSource,
} from "@/lib/journey-playback";
import {
  advanceScrubTime,
  mobileTransportForState,
  playbackRateForDistance,
  sceneIndexForTimelineProgress,
  timelineProgressForSceneIndex,
  targetTimeForProgress,
  transportForTimes,
} from "@/lib/journey-scroll-scrub";
import {
  journeyScrollCueState,
  type JourneyScrollCueMode,
} from "@/lib/journey-scroll-cue-state";
import {
  homeHero,
  homeJourney,
  quickBooking,
  routeCaptions,
  type JourneyHotspot,
} from "@/lib/site-content";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function captionFor(hotspot: JourneyHotspot) {
  return hotspot.caption ?? routeCaptions[hotspot.href.split("#")[0]] ?? "";
}

const RING_RADIUS = 15;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const JOURNEY_FPS = 25;
const JOURNEY_FRAME_SECONDS = 1 / JOURNEY_FPS;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function mediaUrl(src: string) {
  return `${BASE_PATH}${src}`;
}

type JourneyMediaMode = "video" | "stills" | "fallback";

type JourneyNavigateDetail = {
  index: number;
  anchor?: string;
};

export function ScrollVideoStage() {
  const wrapperRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const journeyFrameRef = useRef(0);
  const scrollDirtyRef = useRef(true);
  const lastScrubTickRef = useRef(0);
  const seekStartedAtRef = useRef(0);
  const playAttemptRef = useRef(false);
  const playAttemptIdRef = useRef(0);
  const waitingForGestureRef = useRef(false);
  const maxPlaybackRateRef = useRef(3);
  const isCoarsePointerRef = useRef(false);
  const lastScrollAtRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef(0);
  const lastMediaTimeRef = useRef(0);
  const lastMediaAdvanceAtRef = useRef(0);
  const bufferingRef = useRef(false);
  const bufferRetryTimerRef = useRef(0);
  const railScrollingRef = useRef(false);
  const railScrollTimeoutRef = useRef(0);
  const cueTimeoutRef = useRef(0);
  const progressRef = useRef(0);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(homeJourney.media.duration);
  const reducedMotionRef = useRef(false);
  const sessionVideoOverrideRef = useRef(false);
  const mediaModeRef = useRef<JourneyMediaMode>("stills");

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isWaitingForGesture, setIsWaitingForGesture] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [mediaMode, setMediaMode] = useState<JourneyMediaMode>("stills");
  const [motionPreferenceResolved, setMotionPreferenceResolved] = useState(false);
  const [sessionVideoOverride, setSessionVideoOverride] = useState(false);
  const [cueMode, setCueMode] = useState<JourneyScrollCueMode>("hidden");
  const [fallbackReason, setFallbackReason] = useState("");
  const [navigationSource, setNavigationSource] = useState<NavigationSource | "initial">(
    "initial",
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelSceneIndex, setPanelSceneIndex] = useState(0);
  const [sheetHotspot, setSheetHotspot] = useState<JourneyHotspot | null>(null);

  const playbackState =
    mediaMode === "fallback"
      ? "fallback"
      : isWaitingForGesture
        ? "waiting-for-gesture"
        : isBuffering
          ? "buffering"
          : isScrubbing
            ? "moving"
            : "settled";

  const stopScrub = useCallback(() => {
    if (journeyFrameRef.current) {
      window.cancelAnimationFrame(journeyFrameRef.current);
      journeyFrameRef.current = 0;
    }
    lastScrubTickRef.current = 0;
    seekStartedAtRef.current = 0;
    playAttemptRef.current = false;
    playAttemptIdRef.current += 1;
    waitingForGestureRef.current = false;
    bufferingRef.current = false;
    window.clearTimeout(bufferRetryTimerRef.current);
    setIsWaitingForGesture(false);
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.playbackRate = 1;
    }
    setIsScrubbing(false);
  }, []);

  const activateFallback = useCallback((reason: string) => {
    mediaModeRef.current = "fallback";
    setFallbackReason(reason);
    setMediaMode("fallback");
    if (journeyFrameRef.current) {
      window.cancelAnimationFrame(journeyFrameRef.current);
      journeyFrameRef.current = 0;
    }
    lastScrubTickRef.current = 0;
    seekStartedAtRef.current = 0;
    playAttemptRef.current = false;
    playAttemptIdRef.current += 1;
    waitingForGestureRef.current = false;
    bufferingRef.current = false;
    window.clearTimeout(bufferRetryTimerRef.current);
    setIsWaitingForGesture(false);
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.playbackRate = 1;
    }
    setIsScrubbing(false);
  }, []);

  const requestJourneyFrame = useCallback(() => {
    if (journeyFrameRef.current) return;

    if (!reducedMotionRef.current && mediaModeRef.current === "video") {
      setIsScrubbing(true);
    }
    const tick = (timestamp: number) => {
      journeyFrameRef.current = 0;
      const wrapper = wrapperRef.current;

      if (wrapper && scrollDirtyRef.current) {
        scrollDirtyRef.current = false;
        const rect = wrapper.getBoundingClientRect();
        const scrollable = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
        const nextProgress = clamp(-rect.top / scrollable, 0, 1);
        const nextIndex = sceneIndexForTimelineProgress(nextProgress, homeJourney.scenes);
        const usableDuration = Math.max(durationRef.current - JOURNEY_FRAME_SECONDS, 0);
        const nextTargetTime = targetTimeForProgress(nextProgress, usableDuration);

        progressRef.current = nextProgress;
        targetTimeRef.current = nextTargetTime;
        wrapper.style.setProperty("--journey-progress", nextProgress.toFixed(4));
        wrapper.dataset.scrollProgress = nextProgress.toFixed(4);
        wrapper.dataset.targetTime = nextTargetTime.toFixed(3);
        if (reducedMotionRef.current || mediaModeRef.current !== "video") {
          setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
        }
      }

      const video = videoRef.current;
      if (!video || reducedMotionRef.current || mediaModeRef.current !== "video") {
        lastScrubTickRef.current = 0;
        setIsScrubbing(false);
        return;
      }

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        lastScrubTickRef.current = 0;
        setIsScrubbing(false);
        return;
      }

      if (waitingForGestureRef.current) {
        lastScrubTickRef.current = 0;
        setIsScrubbing(false);
        return;
      }

      if (bufferingRef.current) {
        lastScrubTickRef.current = 0;
        setIsScrubbing(false);
        return;
      }

      if (video.seeking) {
        if (!seekStartedAtRef.current) seekStartedAtRef.current = timestamp;
        if (timestamp - seekStartedAtRef.current > 1500) {
          activateFallback("seek-timeout");
          return;
        }
        journeyFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }
      seekStartedAtRef.current = 0;

      const usableDuration = Math.max(durationRef.current - JOURNEY_FRAME_SECONDS, 0);
      const visibleProgress = usableDuration > 0 ? video.currentTime / usableDuration : 0;
      const visibleIndex = sceneIndexForTimelineProgress(visibleProgress, homeJourney.scenes);
      const scrollIdleMs = Math.max(timestamp - lastScrollAtRef.current, 0);
      const transport = isCoarsePointerRef.current
        ? mobileTransportForState({
            currentTime: video.currentTime,
            targetTime: targetTimeRef.current,
            scrollIdleMs,
            scrollDirection: scrollDirectionRef.current,
          })
        : transportForTimes(
            video.currentTime,
            targetTimeRef.current,
            JOURNEY_FRAME_SECONDS,
          );

      setActiveIndex((current) => (current === visibleIndex ? current : visibleIndex));

      if (transport === "play-forward") {
        seekStartedAtRef.current = 0;
        lastScrubTickRef.current = timestamp;
        const nextPlaybackRate = isCoarsePointerRef.current
          ? 1
          : playbackRateForDistance(
              targetTimeRef.current - video.currentTime,
              maxPlaybackRateRef.current,
            );
        if (Math.abs(video.playbackRate - nextPlaybackRate) >= 0.05) {
          video.playbackRate = nextPlaybackRate;
        }

        if (Math.abs(video.currentTime - lastMediaTimeRef.current) >= JOURNEY_FRAME_SECONDS) {
          lastMediaTimeRef.current = video.currentTime;
          lastMediaAdvanceAtRef.current = timestamp;
        } else if (
          !video.paused &&
          lastMediaAdvanceAtRef.current > 0 &&
          timestamp - lastMediaAdvanceAtRef.current > 2500
        ) {
          bufferingRef.current = true;
          playAttemptIdRef.current += 1;
          playAttemptRef.current = false;
          setIsBuffering(true);
          setIsScrubbing(false);
          video.pause();
          window.clearTimeout(bufferRetryTimerRef.current);
          bufferRetryTimerRef.current = window.setTimeout(() => {
            bufferingRef.current = false;
            setIsBuffering(false);
            setIsScrubbing(true);
            lastMediaAdvanceAtRef.current = performance.now();
            journeyFrameRef.current = window.requestAnimationFrame(tick);
          }, 900);
          return;
        }

        if (video.paused && !playAttemptRef.current) {
          const attemptId = ++playAttemptIdRef.current;
          playAttemptRef.current = true;
          void video.play().then(
            () => {
              if (attemptId !== playAttemptIdRef.current) return;
              playAttemptRef.current = false;
              lastMediaTimeRef.current = video.currentTime;
              lastMediaAdvanceAtRef.current = performance.now();
            },
            (error) => {
              if (attemptId !== playAttemptIdRef.current) return;
              playAttemptRef.current = false;
              if (!isRecoverablePlaybackError(error)) {
                activateFallback("play-error");
                return;
              }
              waitingForGestureRef.current = true;
              setIsWaitingForGesture(true);
              setIsScrubbing(false);
            },
          );
        }

        journeyFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (transport === "hold-reverse") {
        playAttemptIdRef.current += 1;
        video.pause();
        if (video.playbackRate !== 1) video.playbackRate = 1;
        playAttemptRef.current = false;
        journeyFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (transport === "settled") {
        playAttemptIdRef.current += 1;
        video.pause();
        if (video.playbackRate !== 1) video.playbackRate = 1;
        playAttemptRef.current = false;
        lastScrubTickRef.current = 0;
        setIsScrubbing(false);
        return;
      }

      const elapsed = lastScrubTickRef.current
        ? timestamp - lastScrubTickRef.current
        : 1000 / 60;
      lastScrubTickRef.current = timestamp;
      const nextTime = isCoarsePointerRef.current
        ? targetTimeRef.current
        : advanceScrubTime(video.currentTime, targetTimeRef.current, elapsed);

      try {
        playAttemptIdRef.current += 1;
        video.pause();
        if (video.playbackRate !== 1) video.playbackRate = 1;
        playAttemptRef.current = false;
        video.currentTime = nextTime;
        lastMediaTimeRef.current = nextTime;
        lastMediaAdvanceAtRef.current = timestamp;
        seekStartedAtRef.current = timestamp;
      } catch {
        activateFallback("seek-error");
        return;
      }

      journeyFrameRef.current = window.requestAnimationFrame(tick);
    };

    journeyFrameRef.current = window.requestAnimationFrame(tick);
  }, [activateFallback]);

  const primePlaybackFromGesture = useCallback((isTouchGesture: boolean) => {
    const video = videoRef.current;
    const isRecovery = bufferingRef.current || waitingForGestureRef.current;
    const isTouchPrime = isTouchGesture && video?.paused;
    if (
      (!isRecovery && !isTouchPrime) ||
      !video ||
      playAttemptRef.current ||
      mediaModeRef.current !== "video"
    ) {
      return;
    }

    window.clearTimeout(bufferRetryTimerRef.current);
    bufferingRef.current = false;
    waitingForGestureRef.current = false;
    setIsBuffering(false);
    setIsWaitingForGesture(false);
    setIsScrubbing(true);
    lastMediaTimeRef.current = video.currentTime;
    lastMediaAdvanceAtRef.current = performance.now();
    const attemptId = ++playAttemptIdRef.current;
    playAttemptRef.current = true;

    void video.play().then(
      () => {
        if (attemptId !== playAttemptIdRef.current) return;
        playAttemptRef.current = false;
      },
      (error) => {
        if (attemptId !== playAttemptIdRef.current) return;
        playAttemptRef.current = false;
        if (!isRecoverablePlaybackError(error)) {
          activateFallback("play-error");
          return;
        }
        waitingForGestureRef.current = true;
        setIsWaitingForGesture(true);
        setIsScrubbing(false);
      },
    );
  }, [activateFallback]);

  const primePointerPlayback = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      primePlaybackFromGesture(event.pointerType === "touch");
    },
    [primePlaybackFromGesture],
  );

  const primeTouchPlayback = useCallback(() => {
    primePlaybackFromGesture(true);
  }, [primePlaybackFromGesture]);

  const completePlaybackGesture = useCallback(() => {
    scrollDirtyRef.current = true;
    requestJourneyFrame();
  }, [requestJourneyFrame]);

  const activateJourneyVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const selectedSource = window.matchMedia("(min-aspect-ratio: 3/4)").matches
      ? homeJourney.media.src
      : homeJourney.media.mobileSrc;

    video.src = mediaUrl(selectedSource);
    video.load();
    const playPromise = video.play();

    sessionVideoOverrideRef.current = true;
    writeJourneyVideoOverride(window.sessionStorage);
    setSessionVideoOverride(true);
    mediaModeRef.current = "video";
    setMediaMode("video");
    waitingForGestureRef.current = false;
    setIsWaitingForGesture(false);

    void playPromise.then(
      () => {
        scrollDirtyRef.current = true;
        requestJourneyFrame();
      },
      (error) => {
        if (isRecoverablePlaybackError(error)) {
          waitingForGestureRef.current = true;
          setIsWaitingForGesture(true);
          return;
        }
        activateFallback("play-error");
      },
    );
  }, [activateFallback, requestJourneyFrame]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const storedOverride = readJourneyVideoOverride(window.sessionStorage);
    sessionVideoOverrideRef.current = storedOverride;
    setSessionVideoOverride(storedOverride);

    const syncMotionPreference = () => {
      const reduced = mediaQuery.matches;
      reducedMotionRef.current = reduced;
      setIsReducedMotion(reduced);
      setMotionPreferenceResolved(true);

      const videoEnabled = shouldEnableJourneyVideo({
        preferenceResolved: true,
        prefersReducedMotion: reduced,
        sessionOverride: sessionVideoOverrideRef.current,
      });

      if (!videoEnabled) {
        mediaModeRef.current = "stills";
        setMediaMode("stills");
        stopScrub();
        scrollDirtyRef.current = true;
        requestJourneyFrame();
      } else if (mediaModeRef.current !== "fallback") {
        mediaModeRef.current = "video";
        setMediaMode("video");
        scrollDirtyRef.current = true;
        requestJourneyFrame();
      }
    };
    const syncPlaybackRate = () => {
      isCoarsePointerRef.current = coarsePointerQuery.matches;
      maxPlaybackRateRef.current = coarsePointerQuery.matches ? 1 : 3;
    };

    syncMotionPreference();
    syncPlaybackRate();
    mediaQuery.addEventListener("change", syncMotionPreference);
    coarsePointerQuery.addEventListener("change", syncPlaybackRate);
    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
      coarsePointerQuery.removeEventListener("change", syncPlaybackRate);
    };
  }, [requestJourneyFrame, stopScrub]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(JOURNEY_CONFIRMED_EVENT, {
        detail: { index: activeIndex },
      }),
    );
  }, [activeIndex]);

  useEffect(() => {
    if (!isPanelOpen && !sheetHotspot) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
        setSheetHotspot(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isPanelOpen, sheetHotspot]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const scheduleIdleCue = () => {
      window.clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = window.setTimeout(() => {
        const rect = wrapper.getBoundingClientRect();
        setCueMode(
          journeyScrollCueState({
            idleMs: 1800,
            inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
            progress: progressRef.current,
            reducedMotion: reducedMotionRef.current,
            scrolling: false,
          }),
        );
      }, 1800);
    };

    const requestScrollUpdate = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollYRef.current;
      if (Math.abs(delta) >= 1) {
        scrollDirectionRef.current = Math.sign(delta);
      }
      lastScrollYRef.current = nextScrollY;
      lastScrollAtRef.current = performance.now();
      setCueMode("hidden");
      scheduleIdleCue();
      if (railScrollingRef.current) {
        window.clearTimeout(railScrollTimeoutRef.current);
        railScrollTimeoutRef.current = window.setTimeout(() => {
          railScrollingRef.current = false;
        }, 180);
      } else {
        setNavigationSource("scroll");
      }
      scrollDirtyRef.current = true;
      requestJourneyFrame();
    };
    const requestResizeUpdate = () => {
      scrollDirtyRef.current = true;
      requestJourneyFrame();
      scheduleIdleCue();
    };

    requestResizeUpdate();
    lastScrollYRef.current = window.scrollY;
    lastScrollAtRef.current = performance.now();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestResizeUpdate);
    return () => {
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestResizeUpdate);
      window.clearTimeout(railScrollTimeoutRef.current);
      window.clearTimeout(cueTimeoutRef.current);
    };
  }, [requestJourneyFrame]);

  useEffect(() => {
    const navigate = (event: Event) => {
      const detail = (event as CustomEvent<JourneyNavigateDetail>).detail;
      const wrapper = wrapperRef.current;
      if (!wrapper || !detail || !Number.isFinite(detail.index)) {
        return;
      }

      const nextIndex = clamp(detail.index, 0, homeJourney.scenes.length - 1);
      const rect = wrapper.getBoundingClientRect();
      const wrapperTop = window.scrollY + rect.top;
      const scrollable = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      const nextTop =
        wrapperTop +
        timelineProgressForSceneIndex(nextIndex, homeJourney.scenes) * scrollable;
      railScrollingRef.current = true;
      window.clearTimeout(railScrollTimeoutRef.current);
      railScrollTimeoutRef.current = window.setTimeout(() => {
        railScrollingRef.current = false;
      }, 180);
      setNavigationSource("rail");
      window.scrollTo({
        top: nextTop,
        behavior: isReducedMotion ? "auto" : "smooth",
      });

      if (detail.anchor) {
        window.history.replaceState(null, "", `#${detail.anchor}`);
      }

    };

    window.addEventListener(JOURNEY_NAVIGATE_EVENT, navigate);
    return () => window.removeEventListener(JOURNEY_NAVIGATE_EVENT, navigate);
  }, [isReducedMotion]);

  useEffect(() => () => stopScrub(), [stopScrub]);

  const confirmedIndex = activeIndex;
  const activeScene = homeJourney.scenes[activeIndex] ?? homeJourney.scenes[0];
  const panelScene = homeJourney.scenes[panelSceneIndex] ?? activeScene;
  const sceneFraction = 1;

  const activeStill = activeScene.still ?? homeJourney.media.poster;

  const copyAlign = activeScene.align ?? "left";
  /* Right-aligned blocks stay clear of the WhatsApp button and the desktop
     soul rail parked along the right edge. */
  const copyAlignClasses =
    copyAlign === "center"
      ? "mx-auto text-center"
      : copyAlign === "right"
        ? "ml-auto text-right md:pr-44"
        : "";
  const copyRowJustify =
    copyAlign === "center" ? "justify-center" : copyAlign === "right" ? "justify-end" : "";

  const overlayStyle = {
    opacity: 1,
    transform: "translateY(0)",
  };

  const hotspotLayerStyle = {
    opacity: 1,
    transform: "translateY(0)",
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 28;

    stage.style.setProperty("--pointer-x", `${offsetX.toFixed(2)}px`);
    stage.style.setProperty("--pointer-y", `${offsetY.toFixed(2)}px`);
  };

  const resetPointer = () => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    stage.style.setProperty("--pointer-x", "0px");
    stage.style.setProperty("--pointer-y", "0px");
  };

  const openHotspotSheet = (event: React.MouseEvent, hotspot: JourneyHotspot) => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      event.preventDefault();
      setSheetHotspot(hotspot);
    }
  };

  return (
    <section
      ref={wrapperRef}
      data-testid="hero-stage"
      data-scene-id={activeScene.id}
      data-confirmed-scene-id={activeScene.id}
      data-requested-scene-id={activeScene.id}
      data-media-mode={mediaMode}
      data-media-state={playbackState}
      data-playback-state={playbackState}
      data-fallback-reason={fallbackReason}
      data-motion-preference-resolved={String(motionPreferenceResolved)}
      data-session-video-override={String(sessionVideoOverride)}
      data-nav-source={navigationSource}
      data-target-time="0.000"
      data-scroll-progress="0.0000"
      data-settled={String(playbackState === "settled")}
      className="relative bg-[#070808]"
      aria-label="Hawaii Urban Village journey"
    >
      <div
        ref={stageRef}
        data-testid="scroll-video-stage"
        className="journey-stage sticky top-0 h-[100svh] overflow-hidden"
        onPointerDown={primePointerPlayback}
        onTouchStart={primeTouchPlayback}
        onPointerUp={completePlaybackGesture}
        onPointerCancel={completePlaybackGesture}
        onTouchEnd={completePlaybackGesture}
        onTouchCancel={completePlaybackGesture}
        onMouseMove={handlePointerMove}
        onMouseLeave={resetPointer}
      >
        <video
          ref={videoRef}
          data-testid="journey-video"
          className={`absolute inset-0 h-full w-full object-cover ${
            mediaMode === "video" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          muted
          playsInline
          preload={mediaMode === "video" ? "auto" : "none"}
          poster={mediaUrl(homeJourney.media.poster)}
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (Number.isFinite(duration) && duration > 0) {
              durationRef.current = duration;
              lastMediaTimeRef.current = event.currentTarget.currentTime;
              lastMediaAdvanceAtRef.current = performance.now();
              const usableDuration = Math.max(duration - JOURNEY_FRAME_SECONDS, 0);
              const nextTarget = targetTimeForProgress(progressRef.current, usableDuration);
              targetTimeRef.current = nextTarget;
              scrollDirtyRef.current = true;
              requestJourneyFrame();
            }
          }}
          onError={() => activateFallback("media-error")}
        >
          {mediaMode === "video" && !sessionVideoOverride ? (
            <>
              <source
                src={mediaUrl(homeJourney.media.src)}
                type="video/mp4"
                media="(min-aspect-ratio: 3/4)"
                onError={() => activateFallback("media-error")}
              />
              <source
                src={mediaUrl(homeJourney.media.mobileSrc)}
                type="video/mp4"
                onError={() => activateFallback("media-error")}
              />
            </>
          ) : null}
        </video>

        {mediaMode !== "video" ? (
          <Image
            key={activeStill}
            src={activeStill}
            alt={homeHero.media.alt}
            fill
            priority
            sizes="100vw"
            data-testid={mediaMode === "fallback" ? "journey-fallback" : undefined}
            className="absolute inset-0 object-cover object-center"
          />
        ) : null}

        {/* No boxes: legibility comes from one light veil plus a feathered
            scrim that follows the copy block (left / center / right). */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.16),rgba(8,9,10,0.02)_32%,rgba(8,9,10,0.06)_60%,rgba(8,9,10,0.3))]" />
        {/* Phones get a firmer bottom veil: copy and CTAs sit low and the
            bright frames washed the text out. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.3),rgba(8,9,10,0.1)_30%,rgba(8,9,10,0.28)_55%,rgba(8,9,10,0.74))] sm:hidden" />
        <div
          className="absolute inset-0 bg-[radial-gradient(115%_125%_at_0%_100%,rgba(6,6,7,0.55),rgba(6,6,7,0.26)_42%,transparent_68%)] transition-opacity duration-700"
          style={{ opacity: copyAlign === "left" ? 1 : 0 }}
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(105%_120%_at_50%_115%,rgba(6,6,7,0.55),rgba(6,6,7,0.24)_42%,transparent_70%)] transition-opacity duration-700"
          style={{ opacity: copyAlign === "center" ? 1 : 0 }}
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(115%_125%_at_100%_100%,rgba(6,6,7,0.55),rgba(6,6,7,0.26)_42%,transparent_68%)] transition-opacity duration-700"
          style={{ opacity: copyAlign === "right" ? 1 : 0 }}
        />

        {motionPreferenceResolved && (mediaMode === "stills" || isWaitingForGesture) ? (
          <button
            type="button"
            data-testid="journey-video-activate"
            onClick={activateJourneyVideo}
            className="journey-video-activate absolute z-30 inline-flex min-h-11 items-center rounded-full border border-[rgba(232,200,158,0.6)] bg-[rgba(7,8,8,0.64)] px-4 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#f5efe6] backdrop-blur-md"
          >
            {mediaMode === "stills" ? "Attiva esperienza video" : "Avvia il video"}
          </button>
        ) : null}

        <JourneyScrollCue mode={cueMode} />

        {/* pb-36 keeps the CTA row clear of the soul rail and the WhatsApp
            button on phones; both float over the stage's bottom band. */}
        <div className="relative z-10 flex h-full flex-col justify-between px-4 pb-36 pt-24 sm:px-6 md:pb-6 lg:px-8 lg:pb-8">
          <div className="flex items-start justify-end gap-4">
            <h1 className="sr-only">Hawaii Pescara — Urban Village</h1>

            <div
              data-testid="scene-marker"
              className="flex items-center gap-3"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * 0.22), calc(var(--pointer-y) * 0.22), 0)",
                filter: "drop-shadow(0 1px 10px rgba(6,6,7,0.6))",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 38 38" aria-hidden className="-rotate-90">
                <circle
                  cx="19"
                  cy="19"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(245,239,230,0.28)"
                  strokeWidth="1.5"
                />
                <circle
                  cx="19"
                  cy="19"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#e8c89e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={RING_LENGTH}
                  strokeDashoffset={RING_LENGTH * (1 - sceneFraction)}
                />
              </svg>
              <div className="text-right">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#e8c89e]">
                  {String(confirmedIndex + 1).padStart(2, "0")} /{" "}
                  {String(homeJourney.scenes.length).padStart(2, "0")}
                </p>
                <p className="mt-1 hidden text-xs uppercase tracking-[0.18em] text-[#efefea] sm:block">
                  {activeScene.daypart}
                </p>
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0"
            style={hotspotLayerStyle}
          >
            {activeScene.hotspots.map((hotspot, index) => {
              const mirrored = hotspot.x > 50;

              return (
                <div
                  key={`${activeScene.id}-${hotspot.label}`}
                  data-mirrored={mirrored}
                  className="journey-marker absolute"
                  style={
                    {
                      left: `${hotspot.x}%`,
                      "--hotspot-y": `${hotspot.y}%`,
                      "--marker-i": index,
                      /* Anchor the DOT on (x, y): the pill grows inward
                         (mirrored past 62%), so markers near the edges can
                         never run off screen. 13px = row padding + dot half. */
                      transform: `${
                        mirrored ? "translate(calc(-100% + 13px), -50%)" : "translate(-13px, -50%)"
                      } translate3d(calc(var(--pointer-x) * 0.4), calc(var(--pointer-y) * 0.4), 0)`,
                    } as React.CSSProperties
                  }
                >
                  <Link
                    href={hotspot.href}
                    data-testid="scene-hotspot"
                    onClick={(event) => openHotspotSheet(event, hotspot)}
                    className={`pointer-events-auto flex items-center gap-2.5 p-2 ${
                      mirrored ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="journey-dot" />
                    <span className="journey-hairline" />
                    <span
                      className="journey-pill inline-flex whitespace-nowrap rounded-[3px] bg-[rgba(6,6,7,0.55)] px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.18em] text-[#f7f2ea] backdrop-blur-[3px]"
                      style={{ textShadow: "0 1px 8px rgba(6,6,7,0.7)" }}
                    >
                      {hotspot.label}
                    </span>
                  </Link>

                  <div
                    className={`journey-minicard absolute top-full mt-2 hidden w-[216px] rounded-2xl border border-[rgba(245,239,230,0.16)] bg-[rgba(17,18,19,0.78)] p-4 backdrop-blur-xl md:block ${
                      mirrored ? "right-2" : "left-2"
                    }`}
                  >
                    <p className="text-[12.5px] leading-5 text-[#e0e0db]">{captionFor(hotspot)}</p>
                    <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
                      <span className="text-[0.66rem] uppercase tracking-[0.2em] text-[#e8c89e]">
                        Apri
                      </span>
                      <span aria-hidden className="text-[0.8rem] text-[#e8c89e]">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-8">
            <div
              data-testid="journey-persistent-copy"
              className={`max-w-2xl ${copyAlignClasses}`}
              style={{
                ...overlayStyle,
                transform: `${overlayStyle.transform} translate3d(calc(var(--pointer-x) * -0.18), calc(var(--pointer-y) * -0.18), 0)`,
              }}
            >
              <p
                data-testid="scene-eyebrow"
                className="journey-copy-eyebrow text-[0.7rem] uppercase tracking-[0.28em] text-[#e8c89e]"
              >
                {activeScene.eyebrow}
              </p>
              <h2
                className={`journey-copy-title mt-4 max-w-[14ch] font-serif text-3xl leading-[0.98] text-[#f5efe6] sm:text-5xl lg:text-6xl ${
                  copyAlign === "center" ? "mx-auto" : copyAlign === "right" ? "ml-auto" : ""
                }`}
                style={{ textShadow: "0 2px 30px rgba(8,9,10,0.6)" }}
              >
                {activeScene.title}
              </h2>
              <p
                className={`journey-copy-summary mt-4 max-w-xl text-sm leading-7 text-[#eeeee9] sm:mt-5 sm:text-base sm:leading-8 ${
                  copyAlign === "center" ? "mx-auto" : copyAlign === "right" ? "ml-auto" : ""
                }`}
                style={{ textShadow: "0 1px 18px rgba(8,9,10,0.55)" }}
              >
                {activeScene.summary}
              </p>

              <div
                className={`mt-5 flex flex-wrap gap-3 sm:mt-6 ${copyRowJustify}`}
              >
                {activeScene.action?.external ? (
                  <a
                    href={activeScene.action.href}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="scene-primary-action"
                    className="cta"
                  >
                    {activeScene.action.label}
                  </a>
                ) : (
                  <Link
                    href={activeScene.action?.href ?? activeScene.hotspots[0]?.href ?? homeHero.secondaryAction.href}
                    data-testid="scene-primary-action"
                    className="cta"
                  >
                    {activeScene.action?.label ?? activeScene.hotspots[0]?.label ?? "Prenota"}
                  </Link>
                )}
                <button
                  type="button"
                  data-testid="menu-popup-trigger"
                  onClick={() => {
                    setPanelSceneIndex(activeIndex);
                    setIsPanelOpen(true);
                  }}
                  className="inline-flex cursor-pointer items-baseline self-center border-b border-[rgba(232,200,158,0.55)] pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f5efe6] transition hover:border-[#e8c89e] hover:text-[#e8c89e]"
                  style={{ textShadow: "0 1px 12px rgba(6,6,7,0.6)" }}
                >
                  {activeScene.menu ? "Menu & prenota" : "Tutte le prenotazioni"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eighteen viewport heights are distributed by each scene's video range. */}
      <div aria-hidden="true" className="pointer-events-none relative z-0 -mt-[100svh]">
        {homeJourney.scenes.map((scene) => (
          <section
            key={scene.id}
            id={scene.anchor}
            data-chapter
            data-soul={scene.soul}
            style={{ height: `${(scene.end - scene.start) * 1800}svh` }}
          >
            <div className="sr-only">
              <h2>{scene.title}</h2>
              <p>{scene.summary}</p>
            </div>
          </section>
        ))}
      </div>
      <div data-journey-tail aria-hidden="true" className="h-[100svh]" />

      {sheetHotspot ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Chiudi"
            onClick={() => setSheetHotspot(null)}
            className="absolute inset-0 cursor-pointer bg-[rgba(8,9,10,0.64)] backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sheetHotspot.label}
            data-testid="hotspot-sheet"
            className="relative w-full rounded-t-[1.8rem] border border-white/12 bg-[rgba(20,21,22,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:max-w-sm sm:rounded-[1.8rem]"
          >
            <p className="text-[0.64rem] uppercase tracking-[0.26em] text-[#e8c89e]">
              Hawaii • {activeScene.eyebrow}
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight text-[#f5efe6]">
              {sheetHotspot.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#e0e0db]">{captionFor(sheetHotspot)}</p>
            <div className="mt-5 flex gap-3">
              <Link
                href={sheetHotspot.href}
                onClick={() => setSheetHotspot(null)}
                className="cta"
              >
                Apri
              </Link>
              <button
                type="button"
                onClick={() => setSheetHotspot(null)}
                className="cta-ghost"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPanelOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Chiudi menu e prenotazioni"
            onClick={() => setIsPanelOpen(false)}
            className="absolute inset-0 cursor-pointer bg-[rgba(8,9,10,0.64)] backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu e prenotazioni"
            data-testid="menu-popup"
            className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-[1.8rem] border border-white/12 bg-[rgba(20,21,22,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:max-w-md sm:rounded-[1.8rem]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.26em] text-[#e8c89e]">
                  Hawaii • {panelScene.eyebrow}
                </p>
                <p className="mt-2 font-serif text-2xl leading-tight text-[#f5efe6]">
                  {panelScene.menu ? "Dal menu" : "Prenota il tuo momento"}
                </p>
              </div>
              <button
                type="button"
                data-testid="menu-popup-close"
                aria-label="Chiudi"
                autoFocus
                onClick={() => setIsPanelOpen(false)}
                className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#e0e0db] transition hover:border-white/35"
              >
                ✕
              </button>
            </div>

            {panelScene.menu ? (
              <div className="mt-5">
                <ul className="grid gap-2.5 text-sm leading-6 text-[#eaeae5]">
                  {panelScene.menu.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <span>{item.name}</span>
                      {item.price ? (
                        <span className="whitespace-nowrap text-[#e8c89e]">{item.price}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/menu#${panelScene.menu.anchor}`}
                  onClick={() => setIsPanelOpen(false)}
                  className="mt-4 inline-block text-[0.72rem] uppercase tracking-[0.18em] text-[#e8c89e] transition hover:text-[#f6ecd9]"
                >
                  Menu completo
                </Link>
              </div>
            ) : null}

            <div className={panelScene.menu ? "mt-6 border-t border-white/10 pt-5" : "mt-6"}>
              <p className="text-[0.64rem] uppercase tracking-[0.26em] text-[#e8c89e]">
                {quickBooking.eyebrow}
              </p>
              <ul className="mt-3 grid gap-2">
                {quickBooking.options.map((option) =>
                  option.external ? (
                    <li key={option.label}>
                      <a
                        href={option.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-baseline justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#f1f1ec] transition hover:border-white/30"
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-right text-xs text-[#c1c1bb]">{option.detail}</span>
                      </a>
                    </li>
                  ) : (
                    <li key={option.label}>
                      <Link
                        href={option.href}
                        onClick={() => setIsPanelOpen(false)}
                        className="flex items-baseline justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#f1f1ec] transition hover:border-white/30"
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-right text-xs text-[#c1c1bb]">{option.detail}</span>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-4 text-xs leading-6 text-[#c1c1bb]">
                {quickBooking.phones.map((phone, index) => (
                  <span key={phone.label}>
                    {index > 0 ? " · " : ""}
                    {phone.label}{" "}
                    <a href={`tel:${phone.tel}`} className="text-[#e8c89e] hover:text-[#f6ecd9]">
                      {phone.number}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
