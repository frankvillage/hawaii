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
      <nav className="pointer-events-auto rounded-full border border-white/12 bg-[rgba(5,12,19,0.72)] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl md:rounded-[2rem]">
        <ul className="flex items-center gap-1 md:flex-col">
          {soulNavigation.map((item) => {
            const isActive = activeSoul === item.label;

            return (
              <li key={item.label}>
                <Link
                  data-soul-link
                  href={item.href}
                  className={`flex min-w-[5.8rem] items-center justify-center rounded-full px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] transition md:min-w-[7rem] md:justify-start md:px-4 ${
                    isActive
                      ? "bg-[#f4ede4] text-[#0f2233]"
                      : "text-[#d8e2e7] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
