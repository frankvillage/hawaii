"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useJourneyClipPlayer } from "@/components/home/use-journey-clip-player";
import { createJourneyCheckpointManifest } from "@/lib/journey-checkpoints";
import {
  JOURNEY_NAVIGATE_EVENT,
  type NavigationSource,
  sceneIndexFromProgress,
  sceneProgressForIndex,
} from "@/lib/journey-playback";
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
const journeyCheckpoints = createJourneyCheckpointManifest(
  homeJourney.scenes.map((scene) => ({
    id: scene.id,
    start: scene.start,
    end: scene.end,
    still: scene.still ?? homeJourney.media.poster,
  })),
  homeJourney.media.duration,
  JOURNEY_FPS,
);

type JourneyNavigateDetail = {
  index: number;
  anchor?: string;
};

export function ScrollVideoStage() {
  const wrapperRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railTargetIndexRef = useRef<number | null>(null);
  const introRequestedRef = useRef(false);

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false);
  const [navigationSource, setNavigationSource] = useState<NavigationSource | "initial">(
    "initial",
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sheetHotspot, setSheetHotspot] = useState<JourneyHotspot | null>(null);
  const {
    videoRef,
    confirmedIndexRef,
    requestedIndexRef,
    state,
    selectedStill,
    request,
  } = useJourneyClipPlayer({
    checkpoints: journeyCheckpoints,
    reducedMotion: isReducedMotion,
  });

  const playbackState =
    state.status === "fallback"
      ? "fallback"
      : state.status === "idle"
        ? "settled"
        : "moving";

  const syncSoulRail = useCallback((index: number) => {
    document.querySelectorAll<HTMLAnchorElement>("[data-soul-link]").forEach((link, linkIndex) => {
      const isConfirmed = linkIndex === index;
      const label = link.children.item(0) as HTMLElement | null;
      const dot = link.children.item(1) as HTMLElement | null;

      link.dataset.journeyConfirmed = String(isConfirmed);
      if (isConfirmed) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
      link.classList.toggle("text-[#e8c89e]", isConfirmed);
      link.classList.toggle("text-[#dadad5]", !isConfirmed);
      link.classList.toggle("hover:text-white", !isConfirmed);
      label?.classList.toggle("sr-only", !isConfirmed);
      label?.classList.toggle("md:not-sr-only", !isConfirmed);
      dot?.classList.toggle("bg-[#e8c89e]", isConfirmed);
      dot?.classList.toggle("shadow-[0_0_10px_rgba(232,200,158,0.8)]", isConfirmed);
      dot?.classList.toggle("bg-white/20", !isConfirmed);
    });
  }, []);

  const requestScene = useCallback(
    (index: number, source: NavigationSource) => {
      setNavigationSource(source);
      return request(clamp(index, 0, homeJourney.scenes.length - 1), source);
    },
    [request],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      setIsReducedMotion(mediaQuery.matches);
      setMotionPreferenceReady(true);
    };

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);
    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (!motionPreferenceReady || introRequestedRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!introRequestedRef.current) {
        introRequestedRef.current = true;
        void requestScene(0, "intro");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [motionPreferenceReady, requestScene]);

  useEffect(() => {
    syncSoulRail(state.confirmedIndex);
  });

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
    const root = document.documentElement;
    if (!isReducedMotion) {
      root.classList.add("journey-snap-root");
    }
    return () => root.classList.remove("journey-snap-root");
  }, [isReducedMotion]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = wrapper.getBoundingClientRect();
      const scrollable = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      const nextProgress = clamp(-rect.top / scrollable, 0, 1);
      const nextIndex = sceneIndexFromProgress(nextProgress, homeJourney.scenes.length);

      wrapper.style.setProperty("--journey-progress", nextProgress.toFixed(4));
      if (nextIndex !== requestedIndexRef.current) {
        if (railTargetIndexRef.current === nextIndex) {
          railTargetIndexRef.current = null;
        } else {
          void requestScene(nextIndex, "scroll");
        }
      }
      syncSoulRail(confirmedIndexRef.current);
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [confirmedIndexRef, requestScene, requestedIndexRef, syncSoulRail]);

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
        sceneProgressForIndex(nextIndex, homeJourney.scenes.length) * scrollable;
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      railTargetIndexRef.current = nextIndex;
      void requestScene(nextIndex, "rail");
      syncSoulRail(confirmedIndexRef.current);
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: nextTop, behavior: "auto" });

      if (detail.anchor) {
        window.history.replaceState(null, "", `#${detail.anchor}`);
      }

      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
        railTargetIndexRef.current = null;
        syncSoulRail(confirmedIndexRef.current);
      });
    };

    window.addEventListener(JOURNEY_NAVIGATE_EVENT, navigate);
    return () => window.removeEventListener(JOURNEY_NAVIGATE_EVENT, navigate);
  }, [confirmedIndexRef, requestScene, syncSoulRail]);

  const confirmedIndex = state.confirmedIndex;
  const activeScene = homeJourney.scenes[confirmedIndex] ?? homeJourney.scenes[0];
  const isMoving = state.status === "moving" || state.status === "waiting-for-gesture";
  const sceneFraction = isMoving ? 0.35 : 1;
  const rawSettle = isMoving ? 0.3 : 1;
  const overlaySettle = rawSettle;

  const overlaysInteractive = overlaySettle > 0.18;
  const hotspotsInteractive = rawSettle > 0.18;

  const activeStill = activeScene.still ?? homeJourney.media.poster;
  const coverStill =
    state.coverIndex === null
      ? null
      : homeJourney.scenes[state.coverIndex]?.still ?? homeJourney.media.poster;

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
    opacity: overlaySettle,
    transform: `translateY(${((1 - overlaySettle) * 16).toFixed(1)}px)`,
  };

  const hotspotLayerStyle = {
    opacity: rawSettle,
    transform: `translateY(${((1 - rawSettle) * 16).toFixed(1)}px)`,
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
      data-requested-scene-id={homeJourney.scenes[state.requestedIndex]?.id ?? activeScene.id}
      data-media-mode={state.mediaMode}
      data-media-state={playbackState}
      data-playback-state={playbackState}
      data-nav-source={navigationSource}
      data-target-time={state.targetTime.toFixed(3)}
      data-settled={String(playbackState === "settled")}
      className="relative bg-[#070808]"
      aria-label="Hawaii Urban Village journey"
    >
      <div
        ref={stageRef}
        data-testid="scroll-video-stage"
        className="journey-stage sticky top-0 h-[100svh] overflow-hidden"
        onMouseMove={handlePointerMove}
        onMouseLeave={resetPointer}
      >
        {state.mediaMode === "video" ? (
          <video
            ref={videoRef}
            data-testid="journey-video"
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            poster={homeJourney.media.poster}
            aria-label={homeJourney.media.alt}
          >
            <source
              src={homeJourney.media.src}
              type="video/mp4"
              media="(min-aspect-ratio: 3/4)"
            />
            <source src={homeJourney.media.mobileSrc} type="video/mp4" />
          </video>
        ) : (
          <Image
            key={selectedStill ?? activeStill}
            src={selectedStill ?? activeStill}
            alt={homeHero.media.alt}
            fill
            priority
            sizes="100vw"
            data-testid={state.mediaMode === "fallback" ? "journey-fallback" : undefined}
            className="absolute inset-0 object-cover object-center"
          />
        )}

        {state.mediaMode === "video" && coverStill ? (
          <Image
            key={`cover-${state.coverIndex}-${coverStill}`}
            src={coverStill}
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none absolute inset-0 object-cover object-center transition-opacity duration-300"
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

          <div className="pointer-events-none absolute inset-0" style={hotspotLayerStyle}>
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
                    className={`flex items-center gap-2.5 p-2 ${
                      mirrored ? "flex-row-reverse" : ""
                    } ${hotspotsInteractive ? "pointer-events-auto" : "pointer-events-none"}`}
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
              className={`max-w-2xl ${copyAlignClasses}`}
              style={{
                ...overlayStyle,
                transform: `${overlayStyle.transform} translate3d(calc(var(--pointer-x) * -0.18), calc(var(--pointer-y) * -0.18), 0)`,
              }}
            >
              <p
                data-testid="scene-eyebrow"
                className="text-[0.7rem] uppercase tracking-[0.28em] text-[#e8c89e]"
              >
                {activeScene.eyebrow}
              </p>
              <h2
                className={`mt-4 max-w-[14ch] font-serif text-3xl leading-[0.98] text-[#f5efe6] sm:text-5xl lg:text-6xl ${
                  copyAlign === "center" ? "mx-auto" : copyAlign === "right" ? "ml-auto" : ""
                }`}
                style={{ textShadow: "0 2px 30px rgba(8,9,10,0.6)" }}
              >
                {activeScene.title}
              </h2>
              <p
                className={`mt-4 max-w-xl text-sm leading-7 text-[#eeeee9] sm:mt-5 sm:text-base sm:leading-8 ${
                  copyAlign === "center" ? "mx-auto" : copyAlign === "right" ? "ml-auto" : ""
                }`}
                style={{ textShadow: "0 1px 18px rgba(8,9,10,0.55)" }}
              >
                {activeScene.summary}
              </p>

              <div
                className={`mt-5 flex flex-wrap gap-3 sm:mt-6 ${copyRowJustify} ${
                  overlaysInteractive ? "" : "pointer-events-none"
                }`}
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
                  onClick={() => setIsPanelOpen(true)}
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

      {/* The track overlaps the sticky stage: nine equal snap points produce
          eight viewport-sized moves from the first scene to the last. */}
      <div aria-hidden="true" className="pointer-events-none relative z-0 -mt-[100svh]">
        {homeJourney.scenes.map((scene) => (
          <section
            key={scene.id}
            id={scene.anchor}
            data-chapter
            data-soul={scene.soul}
            className="h-[100svh] [scroll-snap-align:start] [scroll-snap-stop:always]"
          >
            <div className="sr-only">
              <h2>{scene.title}</h2>
              <p>{scene.summary}</p>
            </div>
          </section>
        ))}
      </div>

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
                  Hawaii • {activeScene.eyebrow}
                </p>
                <p className="mt-2 font-serif text-2xl leading-tight text-[#f5efe6]">
                  {activeScene.menu ? "Dal menu" : "Prenota il tuo momento"}
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

            {activeScene.menu ? (
              <div className="mt-5">
                <ul className="grid gap-2.5 text-sm leading-6 text-[#eaeae5]">
                  {activeScene.menu.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <span>{item.name}</span>
                      {item.price ? (
                        <span className="whitespace-nowrap text-[#e8c89e]">{item.price}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/menu#${activeScene.menu.anchor}`}
                  onClick={() => setIsPanelOpen(false)}
                  className="mt-4 inline-block text-[0.72rem] uppercase tracking-[0.18em] text-[#e8c89e] transition hover:text-[#f6ecd9]"
                >
                  Menu completo
                </Link>
              </div>
            ) : null}

            <div className={activeScene.menu ? "mt-6 border-t border-white/10 pt-5" : "mt-6"}>
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
