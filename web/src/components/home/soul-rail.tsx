"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { homeJourney, soulNavigation } from "@/lib/site-content";

type SoulLabel = (typeof soulNavigation)[number]["label"];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SoulRail() {
  /* null = no sector on screen yet (arrival aerial, transitions). */
  const [activeSoul, setActiveSoul] = useState<SoulLabel | null>(null);

  /* The rail follows the journey's active scene, so a soul lights up exactly
     while its sector is in frame — same progress math as the video stage. */
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('[data-testid="hero-stage"]');

    if (!stage) {
      return;
    }

    let frame = 0;

    const sync = () => {
      frame = 0;

      const rect = stage.getBoundingClientRect();
      const scrollable = Math.max(stage.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollable, 0, 1);

      const scene =
        homeJourney.scenes.find((s) => progress >= s.start && progress < s.end) ??
        homeJourney.scenes[homeJourney.scenes.length - 1];

      const next: SoulLabel = scene.soul;

      setActiveSoul((current) => (current === next ? current : next));
    };

    const requestSync = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      data-testid="soul-rail"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:inset-x-auto md:right-6 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:px-0"
    >
      {/* Light glass backing keeps the stops readable over bright footage. */}
      <nav
        className="pointer-events-auto rounded-full border border-white/10 bg-[rgba(10,11,12,0.34)] px-2 py-1 backdrop-blur-md md:rounded-[1.4rem] md:px-2 md:py-3"
        style={{ filter: "drop-shadow(0 1px 10px rgba(6,6,7,0.45))" }}
      >
        {/* Nine stops: on phones each stop is a dot and only the active one
            expands its label; the md+ rail shows every label vertically. */}
        <ul className="flex items-center gap-0.5 md:flex-col md:items-end md:gap-1">
          {soulNavigation.map((item) => {
            const isActive = activeSoul === item.label;

            return (
              <li key={item.label}>
                <Link
                  data-soul-link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex items-center justify-center gap-1.5 rounded-full px-1.5 py-2 text-[0.6rem] uppercase tracking-[0.14em] transition md:min-w-[8rem] md:justify-end md:gap-2 md:px-4 md:text-[0.68rem] md:tracking-[0.22em] ${
                    isActive ? "text-[#e8c89e]" : "text-[#dadad5] hover:text-white"
                  }`}
                >
                  <span className={isActive ? "" : "sr-only md:not-sr-only"}>
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 flex-none rounded-full transition ${
                      isActive
                        ? "bg-[#e8c89e] shadow-[0_0_10px_rgba(232,200,158,0.8)]"
                        : "bg-white/20"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
