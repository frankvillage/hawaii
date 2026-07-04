"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation, siteMeta } from "@/lib/site-content";

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  /* 0 = top of page (airy, transparent), 1 = fully condensed ice slab.
     Quantized so scrolling doesn't storm re-renders. */
  const [condense, setCondense] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;
      const next = Math.round(clamp01(window.scrollY / 180) * 20) / 20;
      setCondense((current) => (current === next ? current : next));
    };

    const requestSync = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", requestSync, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestSync);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const t = isOpen ? 1 : condense;

  /* On the immersive homepage the stage carries the big wordmark: the bar
     stays logo-free at the top and the small logo takes over as you scroll. */
  const isHome = pathname === "/";
  const logoOpacity = isHome ? t : 1;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: `rgba(226, 238, 242, ${(0.1 * t).toFixed(3)})`,
        borderBottom: `1px solid rgba(255, 255, 255, ${(0.16 * t).toFixed(3)})`,
        boxShadow:
          t > 0.05
            ? `inset 0 1px 0 rgba(255,255,255,${(0.16 * t).toFixed(3)}), 0 18px 50px rgba(2,8,13,${(0.28 * t).toFixed(3)})`
            : "none",
        backdropFilter: t > 0.05 ? `blur(${Math.round(20 * t)}px) saturate(${(1 + 0.55 * t).toFixed(2)})` : "none",
        WebkitBackdropFilter:
          t > 0.05 ? `blur(${Math.round(20 * t)}px) saturate(${(1 + 0.55 * t).toFixed(2)})` : "none",
      }}
    >
      <div
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
        style={{ height: `${(4.5 - 1.25 * t).toFixed(3)}rem`, transition: "height 120ms linear" }}
      >
        <Link
          href="/"
          aria-label={`${siteMeta.name} — home`}
          className="min-w-0"
          style={{
            opacity: logoOpacity,
            pointerEvents: logoOpacity < 0.3 ? "none" : undefined,
            transform: `translateY(${((1 - logoOpacity) * -4).toFixed(1)}px)`,
            transition: "opacity 150ms linear, transform 150ms linear",
          }}
        >
          <Image
            src="/media/hawaii/brand/logo-hawaii-white.png"
            alt={`${siteMeta.name} — ${siteMeta.payoff}`}
            width={800}
            height={377}
            priority
            className="w-auto"
            style={{ height: `${(2.4 - 0.6 * t).toFixed(3)}rem` }}
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label="Menu"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[2px] border border-white/22 bg-[rgba(10,22,30,0.25)] text-[#f4ede4] backdrop-blur-md transition hover:border-white/50"
          >
            <span className="text-lg leading-none">{isOpen ? "×" : "≡"}</span>
          </button>

          <Link href="/prenotazioni" className="cta cta-sm">
            Prenota
          </Link>
        </div>
      </div>

      <div
        id="site-navigation"
        data-testid="mobile-nav-panel"
        className={`${
          isOpen ? "max-h-[36rem] border-t border-white/12 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden transition-[max-height,opacity] duration-200`}
      >
        <nav className="mx-auto grid w-full max-w-7xl gap-1.5 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[...navigation, { label: "Menu", href: "/menu" }, { label: "Feste Private", href: "/feste-private" }, { label: "Prenotazioni", href: "/prenotazioni" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-[2px] border border-white/12 bg-[rgba(226,238,242,0.06)] px-4 py-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#eef4f6] transition hover:border-[rgba(232,200,158,0.65)] hover:text-[#e8c89e]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
