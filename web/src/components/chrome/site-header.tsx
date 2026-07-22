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
  /* 0 = top of page, 1 = condensed. Touch keeps one stable size. */
  const [condense, setCondense] = useState(0);
  const pathname = usePathname();

  /* The homepage journey is dark and full-bleed: transparent bar, white
     lockup. Every other page lives on the light theme: frosted light bar,
     dark lockup. */
  const isImmersive = pathname === "/";

  useEffect(() => {
    let frame = 0;
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      frame = 0;
      const next = coarsePointerQuery.matches
        ? 0
        : Math.round(clamp01(window.scrollY / 180) * 20) / 20;
      setCondense((current) => (current === next ? current : next));
    };

    const requestSync = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", requestSync, { passive: true });
    coarsePointerQuery.addEventListener("change", requestSync);

    return () => {
      window.removeEventListener("scroll", requestSync);
      coarsePointerQuery.removeEventListener("change", requestSync);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  /* Close the panel when navigation lands on a new page. */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  const t = isOpen ? 1 : condense;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={
          isImmersive
            ? ""
            : "border-b border-[#123338]/10 bg-[rgba(250,247,240,0.72)] backdrop-blur-xl"
        }
      >
        <div
          className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{ height: `${(6.4 - 1.9 * t).toFixed(3)}rem`, transition: "height 120ms linear" }}
        >
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label="Menu"
            onClick={() => setIsOpen((open) => !open)}
            className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center transition ${
              isImmersive
                ? "text-white/90 hover:text-white"
                : "text-[#123338] hover:text-[#0b444b]"
            }`}
            style={isImmersive ? { filter: "drop-shadow(0 1px 8px rgba(6,6,7,0.7))" } : undefined}
          >
            {/* Three slim lines, as on the old site; they fold into an × when open. */}
            <span aria-hidden className="relative block h-3.5 w-6">
              <span
                className="absolute inset-x-0 top-0 h-px bg-current transition-transform duration-200"
                style={isOpen ? { transform: "translateY(6.5px) rotate(45deg)" } : undefined}
              />
              <span
                className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current transition-opacity duration-200"
                style={isOpen ? { opacity: 0 } : undefined}
              />
              <span
                className="absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-200"
                style={isOpen ? { transform: "translateY(-6.5px) rotate(-45deg)" } : undefined}
              />
            </span>
          </button>

          <Link
            href="/"
            aria-label={`${siteMeta.name} — home`}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <Image
              src={
                isImmersive
                  ? "/media/hawaii/brand/logo-lockup-white.png"
                  : "/media/hawaii/brand/logo-lockup-dark.png"
              }
              alt={`${siteMeta.name} — ${siteMeta.payoff}`}
              width={1309}
              height={721}
              priority
              className={`w-auto ${
                isImmersive ? "drop-shadow-[0_2px_16px_rgba(6,6,7,0.65)]" : ""
              }`}
              style={{
                height: `${(5 - 1.5 * t).toFixed(3)}rem`,
                transition: "height 120ms linear",
              }}
            />
          </Link>

          <Link href="/prenotazioni" className="cta cta-sm">
            Prenota
          </Link>
        </div>
      </div>

      <div
        id="site-navigation"
        data-testid="mobile-nav-panel"
        className={`${
          isOpen ? "max-h-[36rem] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden transition-[max-height,opacity] duration-200`}
      >
        {/* Frosted light panel: readable over the video and native to the
            light pages. */}
        <div
          className={
            isOpen
              ? "border-b border-[#123338]/10 bg-[rgba(250,247,240,0.78)] backdrop-blur-2xl backdrop-saturate-150"
              : ""
          }
        >
          <nav className="mx-auto grid w-full max-w-7xl gap-1.5 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[...navigation, { label: "Menu", href: "/menu" }, { label: "Feste Private", href: "/feste-private" }, { label: "Prenotazioni", href: "/prenotazioni" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-[#123338]/12 px-1 py-3 text-[0.72rem] uppercase tracking-[0.16em] text-[#1c2b2e] transition hover:border-[#96703d] hover:text-[#96703d]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
