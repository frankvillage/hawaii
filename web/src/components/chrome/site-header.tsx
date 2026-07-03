"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { navigation, siteMeta } from "@/lib/site-content";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(7,17,26,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/media/hawaii/brand/logo-hawaii-white.png"
            alt={`${siteMeta.name} — ${siteMeta.payoff}`}
            width={800}
            height={377}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden text-[0.62rem] uppercase tracking-[0.28em] text-[#d6b887] sm:block">
            {siteMeta.payoff}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#d9e2e7] lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Menu"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[#f4ede4] transition hover:border-white/30 lg:hidden"
          >
            <span className="text-lg leading-none">{isOpen ? "×" : "≡"}</span>
          </button>

          <Link
            href="/prenotazioni"
            className="rounded-full border border-[#d7a675] bg-[#bf7148] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#cb7f57]"
          >
            Prenota
          </Link>
        </div>
      </div>

      <div
        id="mobile-navigation"
        data-testid="mobile-nav-panel"
        className={`${isOpen ? "max-h-[30rem] border-t border-white/10 opacity-100" : "max-h-0 opacity-0"} overflow-hidden transition-[max-height,opacity] duration-200 lg:hidden`}
      >
        <nav className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#e6edf1] transition hover:border-white/25 hover:bg-white/4"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/menu"
            onClick={() => setIsOpen(false)}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#e6edf1] transition hover:border-white/25 hover:bg-white/4"
          >
            Menu
          </Link>
          <Link
            href="/feste-private"
            onClick={() => setIsOpen(false)}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#e6edf1] transition hover:border-white/25 hover:bg-white/4"
          >
            Feste Private
          </Link>
        </nav>
      </div>
    </header>
  );
}
