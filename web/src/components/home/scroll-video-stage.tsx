"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

/* Soft hold: the middle 40% of each scene advances the video only slightly,
   so the frame settles while titles and markers come in (design handoff §4). */
function plateau(f: number) {
  if (f < 0.3) {
    return (f / 0.3) * 0.46;
  }
  if (f < 0.7) {
    return 0.46 + ((f - 0.3) / 0.4) * 0.08;
  }
  return 0.54 + ((f - 0.7) / 0.3) * 0.46;
}

function sceneAt(progress: number) {
  return (
    homeJourney.scenes.find((scene) => progress >= scene.start && progress < scene.end) ??
    homeJourney.scenes[homeJourney.scenes.length - 1]
  );
}

function captionFor(hotspot: JourneyHotspot) {
  return hotspot.caption ?? routeCaptions[hotspot.href.split("#")[0]] ?? "";
}

const RING_RADIUS = 15;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function ScrollVideoStage() {
  const wrapperRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [videoDuration, setVideoDuration] = useState(homeJourney.media.duration);
  const [progress, setProgress] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sheetHotspot, setSheetHotspot] = useState<JourneyHotspot | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => setIsReducedMotion(mediaQuery.matches);

    syncMotionPreference();

    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

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
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const syncDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setVideoDuration(video.duration);
      }

      video.pause();
    };

    video.addEventListener("loadedmetadata", syncDuration);
    syncDuration();

    return () => video.removeEventListener("loadedmetadata", syncDuration);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;

    if (!wrapper) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      const rect = wrapper.getBoundingClientRect();
      const scrollable = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      const nextProgress = clamp(-rect.top / scrollable, 0, 1);

      wrapper.style.setProperty("--journey-progress", nextProgress.toFixed(4));

      setProgress((current) => (Math.abs(current - nextProgress) > 0.0012 ? nextProgress : current));

      if (isReducedMotion || !video || !Number.isFinite(videoDuration) || videoDuration <= 0) {
        return;
      }

      const scene = sceneAt(nextProgress);
      const span = Math.max(scene.end - scene.start, 0.001);
      const sceneFraction = clamp((nextProgress - scene.start) / span, 0, 1);
      const mappedProgress = scene.start + plateau(sceneFraction) * span;
      const nextTime = clamp(mappedProgress * videoDuration, 0, videoDuration);

      if (Math.abs(video.currentTime - nextTime) > 0.05) {
        try {
          video.currentTime = nextTime;
        } catch {
          // Safari can occasionally reject seeks while metadata is still settling.
        }
      }
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    update();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [isReducedMotion, videoDuration]);

  const activeScene = useMemo(() => sceneAt(progress), [progress]);

  const activeSceneIndex = useMemo(
    () => homeJourney.scenes.findIndex((scene) => scene.id === activeScene.id),
    [activeScene.id],
  );

  const sceneFraction = clamp(
    (progress - activeScene.start) / Math.max(activeScene.end - activeScene.start, 0.001),
    0,
    1,
  );

  /* Settle envelope: overlays fade in as the scene holds, release as it scrolls
     on. The first scene arrives already settled so the first paint is complete. */
  const overlaySettle = isReducedMotion
    ? 1
    : activeSceneIndex === 0 && sceneFraction < 0.5
      ? 1
      : clamp((0.5 - Math.abs(sceneFraction - 0.5)) / 0.28, 0, 1);

  const overlaysInteractive = overlaySettle > 0.18;

  const overlayStyle = {
    opacity: overlaySettle,
    transform: `translateY(${((1 - overlaySettle) * 16).toFixed(1)}px)`,
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
      className="relative bg-[#040a0f]"
      aria-label="Hawaii Urban Village journey"
    >
      <div
        ref={stageRef}
        data-testid="scroll-video-stage"
        className="journey-stage sticky top-[4.6rem] h-[calc(100svh-4.6rem)] overflow-hidden"
        onMouseMove={handlePointerMove}
        onMouseLeave={resetPointer}
      >
        {isReducedMotion ? (
          <Image
            src={homeJourney.media.poster}
            alt={homeHero.media.alt}
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 object-cover object-center"
          />
        ) : (
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
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,12,0.14),rgba(3,8,12,0.22)_24%,rgba(3,8,12,0.58)_62%,rgba(3,8,12,0.88))]" />
        <div
          className="journey-stage-light absolute inset-0"
          style={{ opacity: 0.32 + progress * 0.4 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,227,173,0.22),transparent_36%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-8 lg:pb-8">
          <div className="flex items-start justify-between gap-4">
            <div
              className="max-w-[16rem] sm:max-w-xl"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * -0.26), calc(var(--pointer-y) * -0.26), 0)",
              }}
            >
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#e8c89e]">
                {homeHero.eyebrow}
              </p>
              <Image
                src="/media/hawaii/brand/logo-hawaii-white.png"
                alt=""
                aria-hidden
                width={800}
                height={377}
                priority
                className="mt-3 h-14 w-auto drop-shadow-[0_2px_24px_rgba(3,8,12,0.6)] sm:h-20 lg:h-24"
              />
              <h1 className="sr-only">Hawaii Pescara — Urban Village</h1>
            </div>

            <div
              data-testid="scene-marker"
              className="flex items-center gap-3 rounded-full border border-white/14 bg-[rgba(7,17,26,0.44)] py-2 pl-2.5 pr-4 backdrop-blur-md"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * 0.22), calc(var(--pointer-y) * 0.22), 0)",
              }}
            >
              <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden className="-rotate-90">
                <circle
                  cx="19"
                  cy="19"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(245,239,230,0.18)"
                  strokeWidth="2"
                />
                <circle
                  cx="19"
                  cy="19"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#e8c89e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={RING_LENGTH}
                  strokeDashoffset={RING_LENGTH * (1 - sceneFraction)}
                />
              </svg>
              <div className="text-right">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#e8c89e]">
                  {String(activeSceneIndex + 1).padStart(2, "0")} /{" "}
                  {String(homeJourney.scenes.length).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#eef2f4]">
                  {activeScene.daypart}
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0" style={overlayStyle}>
            {activeScene.hotspots.map((hotspot, index) => {
              const mirrored = hotspot.x > 62;

              return (
                <div
                  key={`${activeScene.id}-${hotspot.label}`}
                  data-mirrored={mirrored}
                  className="journey-marker absolute"
                  style={
                    {
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      "--marker-i": index,
                      transform:
                        "translate(-50%, -50%) translate3d(calc(var(--pointer-x) * 0.4), calc(var(--pointer-y) * 0.4), 0)",
                    } as React.CSSProperties
                  }
                >
                  <a
                    href={hotspot.href}
                    data-testid="scene-hotspot"
                    onClick={(event) => openHotspotSheet(event, hotspot)}
                    className={`flex items-center gap-2.5 p-2 ${
                      mirrored ? "flex-row-reverse" : ""
                    } ${overlaysInteractive ? "pointer-events-auto" : "pointer-events-none"}`}
                  >
                    <span className="journey-dot" />
                    <span className="journey-hairline" />
                    <span className="journey-pill inline-flex rounded-full border border-[rgba(245,239,230,0.26)] bg-[rgba(7,17,26,0.5)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#f5efe6] backdrop-blur-md">
                      {hotspot.label}
                    </span>
                  </a>

                  <div
                    className={`journey-minicard absolute top-full mt-2 hidden w-[216px] rounded-2xl border border-[rgba(245,239,230,0.16)] bg-[rgba(6,14,22,0.78)] p-4 backdrop-blur-xl md:block ${
                      mirrored ? "right-2" : "left-2"
                    }`}
                  >
                    <p className="text-[12.5px] leading-5 text-[#dfe7ea]">{captionFor(hotspot)}</p>
                    <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
                      <span className="text-[0.66rem] uppercase tracking-[0.2em] text-[#e8c89e]">
                        Apri
                      </span>
                      <span className="font-mono text-[0.66rem] text-[#8ea3ad]">
                        {hotspot.href.split("#")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div
              className="max-w-2xl"
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
                className="mt-4 max-w-[12ch] font-serif text-4xl leading-[0.95] text-[#f5efe6] sm:text-5xl lg:text-6xl"
                style={{ textShadow: "0 2px 30px rgba(3,8,12,0.6)" }}
              >
                {activeScene.title}
              </h2>
              <p
                className="mt-5 max-w-xl text-sm leading-7 text-[#edf2f4] sm:text-base sm:leading-8"
                style={{ textShadow: "0 1px 18px rgba(3,8,12,0.55)" }}
              >
                {activeScene.summary}
              </p>

              <div className={`mt-6 flex flex-wrap gap-3 ${overlaysInteractive ? "" : "pointer-events-none"}`}>
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
                  className="cta-ghost"
                >
                  {activeScene.menu ? "Menu & prenota" : "Prenota"}
                </button>
              </div>
            </div>

            <div
              className="hidden justify-self-end rounded-[1.35rem] border border-white/10 bg-[rgba(7,17,26,0.34)] p-4 text-sm text-[#dfe7ea] backdrop-blur-md lg:block"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * 0.14), calc(var(--pointer-y) * 0.14), 0)",
              }}
            >
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-[#e8c89e]">
                Urban Village
              </p>
              <p className="mt-3 leading-7">
                Alba, spiaggia, pranzo, terrazza e notte scorrono nello stesso fronte mare.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scene anchors are laid out on the same scale as the scroll progress so
          the soul rail and #anchor navigation stay in sync with the footage. */}
      <div aria-hidden="true" className="pointer-events-none relative z-0 h-[800svh]">
        {homeJourney.scenes.map((scene) => (
          <section
            key={scene.id}
            id={scene.anchor}
            data-chapter
            data-soul={scene.soul}
            className="absolute inset-x-0"
            style={{
              top: `${Math.max(scene.start * 800 - 60, 0).toFixed(1)}svh`,
              height: `${((scene.end - scene.start) * 800).toFixed(1)}svh`,
            }}
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
            className="absolute inset-0 cursor-pointer bg-[rgba(3,8,12,0.64)] backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sheetHotspot.label}
            data-testid="hotspot-sheet"
            className="relative w-full rounded-t-[1.8rem] border border-white/12 bg-[rgba(9,19,28,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:max-w-sm sm:rounded-[1.8rem]"
          >
            <p className="text-[0.64rem] uppercase tracking-[0.26em] text-[#e8c89e]">
              Hawaii • {activeScene.eyebrow}
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight text-[#f5efe6]">
              {sheetHotspot.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#dfe7ea]">{captionFor(sheetHotspot)}</p>
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
            className="absolute inset-0 cursor-pointer bg-[rgba(3,8,12,0.64)] backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu e prenotazioni"
            data-testid="menu-popup"
            className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-[1.8rem] border border-white/12 bg-[rgba(9,19,28,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:max-w-md sm:rounded-[1.8rem]"
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
                className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#dfe7ea] transition hover:border-white/35"
              >
                ✕
              </button>
            </div>

            {activeScene.menu ? (
              <div className="mt-5">
                <ul className="grid gap-2.5 text-sm leading-6 text-[#e9eef1]">
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
                        className="flex items-baseline justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#f0f4f6] transition hover:border-white/30"
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-right text-xs text-[#b9c6cd]">{option.detail}</span>
                      </a>
                    </li>
                  ) : (
                    <li key={option.label}>
                      <Link
                        href={option.href}
                        onClick={() => setIsPanelOpen(false)}
                        className="flex items-baseline justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#f0f4f6] transition hover:border-white/30"
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-right text-xs text-[#b9c6cd]">{option.detail}</span>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-4 text-xs leading-6 text-[#b9c6cd]">
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
