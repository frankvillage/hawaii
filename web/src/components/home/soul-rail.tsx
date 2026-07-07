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

      const next = scene.soul === "Transition" ? null : (scene.soul as SoulLabel);

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
      <nav
        className="pointer-events-auto p-1"
        style={{ filter: "drop-shadow(0 1px 10px rgba(6,6,7,0.65))" }}
      >
        <ul className="flex items-center gap-1 md:flex-col md:items-end">
          {soulNavigation.map((item) => {
            const isActive = activeSoul === item.label;

            return (
              <li key={item.label}>
                <Link
                  data-soul-link
                  href={item.href}
                  className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[0.6rem] uppercase tracking-[0.16em] transition sm:gap-2 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.22em] md:min-w-[7rem] md:justify-end md:px-4 ${
                    isActive ? "text-[#e8c89e]" : "text-[#dadad5] hover:text-white"
                  }`}
                >
                  {item.label}
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
