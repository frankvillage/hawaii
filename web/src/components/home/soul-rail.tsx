"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { soulNavigation } from "@/lib/site-content";

type SoulLabel = (typeof soulNavigation)[number]["label"];

const defaultSoul: SoulLabel = soulNavigation[0].label;

export function SoulRail() {
  const [activeSoul, setActiveSoul] = useState<SoulLabel>(defaultSoul);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter][data-soul]"),
    );

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const soul = visible.target.getAttribute("data-soul");
        if (soul && soul !== "Transition") {
          setActiveSoul(soul as SoulLabel);
        }
      },
      {
        rootMargin: "-30% 0px -35% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
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
                  className={`flex min-w-[5.8rem] items-center justify-center gap-2 rounded-full px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] transition md:min-w-[7rem] md:justify-end md:px-4 ${
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
