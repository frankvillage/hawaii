"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation, siteMeta } from "@/lib/site-content";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const syncScroll = () => setIsCondensed(window.scrollY > 48);

    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });

    return () => window.removeEventListener("scroll", syncScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /* On the immersive homepage the stage carries the big wordmark, so the bar
     stays logo-free until the journey begins; elsewhere the logo is always on. */
  const showLogo = pathname !== "/" || isCondensed;

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        isCondensed || isOpen
          ? "border-b border-white/12 bg-[rgba(228,240,244,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_50px_rgba(2,8,13,0.3)] backdrop-blur-2xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8 ${
          isCondensed ? "py-2" : "py-4"
        }`}
      >
        <Link
          href="/"
          aria-label={`${siteMeta.name} — home`}
          className={`min-w-0 transition-[opacity,transform] duration-300 ${
            showLogo ? "opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <Image
            src="/media/hawaii/brand/logo-hawaii-white.png"
            alt={`${siteMeta.name} — ${siteMeta.payoff}`}
            width={800}
            height={377}
            priority
            className={`w-auto transition-[height] duration-300 ${isCondensed ? "h-7" : "h-9"}`}
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label="Menu"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[2px] border border-white/20 bg-[rgba(7,17,26,0.22)] text-[#f4ede4] backdrop-blur-md transition hover:border-white/45"
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
          isOpen ? "max-h-[36rem] border-t border-white/10 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden transition-[max-height,opacity] duration-200`}
      >
        <nav className="mx-auto grid w-full max-w-7xl gap-1.5 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-[2px] border border-white/10 bg-[rgba(7,17,26,0.25)] px-4 py-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#e6edf1] transition hover:border-[rgba(232,200,158,0.6)] hover:text-[#e8c89e]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/menu"
            onClick={() => setIsOpen(false)}
            className="rounded-[2px] border border-white/10 bg-[rgba(7,17,26,0.25)] px-4 py-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#e6edf1] transition hover:border-[rgba(232,200,158,0.6)] hover:text-[#e8c89e]"
          >
            Menu
          </Link>
          <Link
            href="/feste-private"
            onClick={() => setIsOpen(false)}
            className="rounded-[2px] border border-white/10 bg-[rgba(7,17,26,0.25)] px-4 py-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#e6edf1] transition hover:border-[rgba(232,200,158,0.6)] hover:text-[#e8c89e]"
          >
            Feste Private
          </Link>
          <Link
            href="/prenotazioni"
            onClick={() => setIsOpen(false)}
            className="rounded-[2px] border border-white/10 bg-[rgba(7,17,26,0.25)] px-4 py-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#e6edf1] transition hover:border-[rgba(232,200,158,0.6)] hover:text-[#e8c89e]"
          >
            Prenotazioni
          </Link>
        </nav>
      </div>
    </header>
  );
}
