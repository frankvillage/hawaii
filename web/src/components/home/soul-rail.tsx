"use client";

import { useEffect, useState } from "react";

import { JOURNEY_CONFIRMED_EVENT, JOURNEY_NAVIGATE_EVENT } from "@/lib/journey-playback";
import { soulNavigation } from "@/lib/site-content";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SoulRail() {
  const [activeIndex, setActiveIndex] = useState(0);

  /* The rail follows the scene range reached by continuous page progress. */
  useEffect(() => {
    const confirm = (event: Event) => {
      const index = Number((event as CustomEvent<{ index?: number }>).detail?.index);
      if (Number.isFinite(index)) {
        setActiveIndex(clamp(index, 0, soulNavigation.length - 1));
      }
    };

    window.addEventListener(JOURNEY_CONFIRMED_EVENT, confirm);
    return () => window.removeEventListener(JOURNEY_CONFIRMED_EVENT, confirm);
  }, []);

  return (
    <div
      data-testid="soul-rail"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:inset-x-auto md:right-6 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:px-0"
    >
      {/* Mobile uses an opaque veil to avoid live blur over decoded video. */}
      <nav
        aria-label="Momenti della giornata"
        className="soul-rail-surface pointer-events-auto touch-pan-y rounded-full border border-white/10 bg-[rgba(10,11,12,0.72)] px-2 py-1 md:rounded-[1.4rem] md:bg-[rgba(10,11,12,0.34)] md:px-2 md:py-3 md:backdrop-blur-md"
        style={{ filter: "drop-shadow(0 1px 10px rgba(6,6,7,0.45))" }}
      >
        {/* Nine stops: on phones each stop is a dot and only the active one
            expands its label; the md+ rail shows every label vertically. */}
        <ul className="flex items-center gap-0.5 md:flex-col md:items-end md:gap-1">
          {soulNavigation.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <li key={item.label}>
                <a
                  data-soul-link
                  data-journey-confirmed={isActive}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent(JOURNEY_NAVIGATE_EVENT, {
                        detail: { index, anchor: item.href.slice(1) },
                      }),
                    );
                  }}
                  className={`flex min-h-6 min-w-6 items-center justify-center gap-1.5 rounded-full px-1.5 py-2 text-[0.6rem] uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8c89e] md:min-w-[8rem] md:justify-end md:gap-2 md:px-4 md:text-[0.68rem] md:tracking-[0.22em] ${
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
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
