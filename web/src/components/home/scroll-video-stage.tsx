"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { homeHero, homeJourney } from "@/lib/site-content";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ScrollVideoStage() {
  const wrapperRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [videoDuration, setVideoDuration] = useState(homeJourney.media.duration);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => setIsReducedMotion(mediaQuery.matches);

    syncMotionPreference();

    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

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

      setProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current));

      if (isReducedMotion || !video || !Number.isFinite(videoDuration) || videoDuration <= 0) {
        return;
      }

      const nextTime = clamp(nextProgress * videoDuration, 0, videoDuration);

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

  const activeScene = useMemo(() => {
    const directMatch =
      homeJourney.scenes.find((scene) => progress >= scene.start && progress < scene.end) ??
      homeJourney.scenes[homeJourney.scenes.length - 1];

    return directMatch;
  }, [progress]);

  const activeSceneIndex = useMemo(
    () => homeJourney.scenes.findIndex((scene) => scene.id === activeScene.id),
    [activeScene.id],
  );

  const sceneProgress = clamp(
    (progress - activeScene.start) / Math.max(activeScene.end - activeScene.start, 0.001),
    0,
    1,
  );

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;

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
            <source src={homeJourney.media.src} type="video/mp4" />
          </video>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,12,0.12),rgba(3,8,12,0.2)_24%,rgba(3,8,12,0.52)_70%,rgba(3,8,12,0.84))]" />
        <div
          className="journey-stage-light absolute inset-0"
          style={{ opacity: 0.32 + progress * 0.4 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,227,173,0.22),transparent_36%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between px-4 pb-6 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="flex items-start justify-between gap-4">
            <div
              className="max-w-[16rem] sm:max-w-xl"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * -0.22), calc(var(--pointer-y) * -0.22), 0)",
              }}
            >
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#e8c89e]">
                {homeHero.eyebrow}
              </p>
              <h1 className="mt-3 max-w-[7ch] font-serif text-5xl leading-[0.86] text-[#f6efe6] sm:text-7xl lg:text-[7rem]">
                {homeHero.title}
              </h1>
            </div>

            <div
              data-testid="scene-marker"
              className="rounded-full border border-white/14 bg-[rgba(7,17,26,0.44)] px-3 py-2 text-right backdrop-blur-md"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * 0.18), calc(var(--pointer-y) * 0.18), 0)",
              }}
            >
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#e8c89e]">
                {String(activeSceneIndex + 1).padStart(2, "0")} / {String(homeJourney.scenes.length).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#eef2f4]">
                {activeScene.daypart}
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            {activeScene.hotspots.map((hotspot) => (
              <Link
                key={`${activeScene.id}-${hotspot.label}`}
                data-testid="scene-hotspot"
                href={hotspot.href}
                className="pointer-events-auto absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-white/16 bg-[rgba(7,17,26,0.46)] px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-[#f5efe6] backdrop-blur-md transition hover:border-white/36 hover:bg-[rgba(12,24,36,0.62)]"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  opacity: 0.56 + sceneProgress * 0.44,
                  transform: `translate3d(calc(-50% + var(--pointer-x) * 0.12), calc(-50% + var(--pointer-y) * 0.12), 0) scale(${0.97 + sceneProgress * 0.03})`,
                }}
              >
                {hotspot.label}
              </Link>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div
              className="max-w-2xl"
              style={{
                transform: "translate3d(calc(var(--pointer-x) * -0.16), calc(var(--pointer-y) * -0.16), 0)",
              }}
            >
              <p
                data-testid="scene-eyebrow"
                className="text-[0.7rem] uppercase tracking-[0.28em] text-[#e8c89e]"
              >
                {activeScene.eyebrow}
              </p>
              <h2 className="mt-4 max-w-[12ch] font-serif text-4xl leading-[0.92] text-[#f5efe6] sm:text-5xl lg:text-6xl">
                {activeScene.title}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#edf2f4] sm:text-base sm:leading-8">
                {activeScene.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={activeScene.hotspots[0]?.href ?? homeHero.secondaryAction.href}
                  className="inline-flex rounded-full bg-[#bf7148] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#cc7d54]"
                >
                  {activeScene.hotspots[0]?.label ?? "Prenota"}
                </Link>
                <Link
                  href={homeHero.secondaryAction.href}
                  className="inline-flex rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-[#f5efe6] transition hover:border-white/32"
                >
                  {homeHero.secondaryAction.label}
                </Link>
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

      <div aria-hidden="true" className="relative z-0">
        {homeJourney.scenes.map((scene) => (
          <section
            key={scene.id}
            id={scene.anchor}
            data-chapter
            data-soul={scene.soul}
            className="min-h-[80svh] sm:min-h-[86svh]"
          >
            <div className="sr-only">
              <h2>{scene.title}</h2>
              <p>{scene.summary}</p>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
